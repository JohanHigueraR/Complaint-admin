/**
 * Fuente de datos activa para toda la aplicación.
 *
 * - `mock`  → usa los datos en memoria (comportamiento actual / demo).  ← valor por defecto
 * - `api`   → usa las implementaciones `services/api/*` (pendientes de implementar por backend).
 *
 * Se controla con la variable de entorno pública `NEXT_PUBLIC_DATA_SOURCE`.
 * Cambiar a `api` no requiere tocar componentes: la selección ocurre en
 * `services/service-provider.ts`.
 *
 * NOTA: para el modo `api`, `getInitialData()` devuelve estructuras vacías
 * (la hidratación asíncrona está marcada como POR DEFINIR). Mientras tanto
 * la app arranca con `mock` y funciona de forma idéntica a hoy.
 */
export type DataSource = "mock" | "api";

export const DATA_SOURCE: DataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock") as DataSource;

export const isMockDataSource = () => DATA_SOURCE === "mock";
export const isApiDataSource = () => DATA_SOURCE === "api";
