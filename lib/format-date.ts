// Zona horaria fijada para evitar diferencias de renderizado entre servidor y cliente (hydration).
const dateFormatter = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" });

export function formatDateNormalized(input: string | Date | number | null | undefined) {
  if (!input) return "";
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input as Date;
  try {
    return dateFormatter.format(d).replace(/\u00A0/g, " ");
  } catch {
    return d.toString();
  }
}

export default formatDateNormalized;
