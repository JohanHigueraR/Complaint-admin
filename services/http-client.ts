/**
 * Cliente HTTP centralizado para la capa `services/api/*`.
 *
 * Todo lo que necesite hablar con el backend real pasa por aquí — así, cuando cambie la
 * base URL, el manejo de auth, o la forma de los errores, se toca un solo archivo y no
 * cada `api-*.service.ts`.
 *
 * Base URL: variable de entorno `NEXT_PUBLIC_API_BASE_URL` (ver `.env.example` si existe,
 * o defínanla en `.env.local`). Vacía por defecto → las requests son relativas (útil si el
 * frontend y el backend quedan detrás del mismo dominio/proxy).
 */

import { ServiceError, type ServiceErrorCode } from "@/services/service-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Forma esperada del cuerpo de error del backend. Ajustar cuando el equipo de backend defina el envelope real (ver README_BACKEND.md). */
export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorPayload | null,
  ) {
    super(payload?.message || `Error de red (HTTP ${status})`);
    this.name = "ApiError";
  }

  /**
   * Traduce el error HTTP a un `ServiceError` (el mismo tipo que lanzan los mocks), para que
   * el store pueda manejar ambos orígenes de forma idéntica sin distinguir mock/api.
   * Ajustar el mapeo por `payload.code` apenas el backend lo defina — hoy solo usa el status.
   */
  toServiceError(): ServiceError {
    if (this.payload?.code && isServiceErrorCode(this.payload.code)) {
      return new ServiceError(this.payload.code, this.message);
    }
    const code: ServiceErrorCode = (() => {
      switch (this.status) {
        case 404: return "NOT_FOUND";
        case 409:
        case 422: return "INVALID_TRANSITION";
        case 400: return "MISSING_DATA";
        case 403: return "READ_ONLY";
        default: return "MISSING_DATA";
      }
    })();
    return new ServiceError(code, this.message);
  }
}

function isServiceErrorCode(value: string): value is ServiceErrorCode {
  return ["NOT_FOUND", "INVALID_TRANSITION", "MISSING_DATA", "READ_ONLY", "DUPLICATE", "BUSY"].includes(value);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
    // Se lanza ya traducido a ServiceError: así los api-*.service.ts y el store manejan un
    // solo tipo de error, sin importar si la respuesta vino del mock o de la API real.
    throw new ApiError(response.status, payload).toServiceError();
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** Cliente mínimo tipo fetch-wrapper. Cambiar por axios/ky/etc. sin tocar los `api-*.service.ts` si se prefiere otra librería. */
export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
