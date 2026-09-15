/** Cliente HTTP centralizado preparado para la integración API futura.
 *
 * NO se conecta a ningún backend todavia. El objetivo es que, cuando se implemente,
 * solo se complete esta utilidad (y/o se pase un base URL) y el resto del frontend
 * permanezca igual.
 *
 * Criterio de diseño actual:
 * - No existe fetch/axios usado en ningún lado del frontend actualmente; los contratos
 *   de servicio definen la forma y esta utilidad concentra el mecanismo.
 * - El manejo de errores de red no está implementado; POR DEFINIR como integrarlo.
 * - Las URLs de los endpoints tampoco están definidas todavia; se dejan como constantes
 *   vacias para que el equipo de backend/frontend las complete junto.
 */

export const COMPLAINTS_API_BASE = "" as const; // POR DEFINIR

/** POR DEFINIR: estandarizar respuestas de error (código, message, details) */
export function isApiError(response: unknown): response is { status?: number; statusText?: string; body?: unknown } {
  return typeof response === "object" && response !== null;
}
