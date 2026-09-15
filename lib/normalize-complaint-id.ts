/** Acepta el id de negocio ("Q-2026-00147") o su forma mostrada en pantalla ("CL-2026-00147"). */
export function normalizeComplaintId(id: string): string {
  return id.startsWith("CL-") ? id.replace("CL-", "Q-") : id;
}
