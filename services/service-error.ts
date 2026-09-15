/**
 * Error de negocio que puede lanzar cualquier implementación de un contrato (mock o api).
 * El store (lib/store.ts) lo captura y lo traduce a `ActionResult` sin distinguir el origen.
 */
export type ServiceErrorCode = "NOT_FOUND" | "INVALID_TRANSITION" | "MISSING_DATA" | "READ_ONLY" | "DUPLICATE" | "BUSY";

export class ServiceError extends Error {
  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
