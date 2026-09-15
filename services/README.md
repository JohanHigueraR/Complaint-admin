# Arquitectura de servicios

Punto de entrada para entender esta carpeta. Si vas a implementar el backend real, empieza aquí y sigue el link que te aplique.

## ✅ Estado actual (leer primero)

**`lib/store.ts` ya consume esta carpeta.** El store llama a `complaintsService`/`notificationsService` (expuestos por `service-provider.ts`), nunca a `mock/*` ni `api/*` directamente. Eso significa que **el único cambio necesario para pasar de datos mock a la API real es la variable de entorno `NEXT_PUBLIC_DATA_SOURCE`** — no hay que tocar el store ni ningún componente.

```
NEXT_PUBLIC_DATA_SOURCE=mock (default) → service-provider.ts entrega MockComplaintsService/MockNotificationsService
NEXT_PUBLIC_DATA_SOURCE=api             → service-provider.ts entrega ApiComplaintsService/ApiNotificationsService
```

### Qué falta para que `api` funcione de verdad contra un backend real

El switch en sí ya funciona (ver `lib/store.ts`), pero para que `NEXT_PUBLIC_DATA_SOURCE=api` sirva con un backend de verdad, todavía falta:

1. **Un backend real corriendo** que implemente los endpoints de `README_BACKEND.md` sobre el schema de `README_DATABASE.md`. `ApiComplaintsService` (en `api/`) ya está escrito y compilando, pero apunta a endpoints que hoy no existen en ningún servidor.
2. **`NEXT_PUBLIC_API_BASE_URL`** configurada en `.env.local` apuntando a ese backend.
3. **Autenticación** (README_BACKEND §17, todavía `POR DEFINIR`): `http-client.ts` no envía ningún header de auth hoy.
4. **Una UI de carga inicial**: en modo `api`, `complaints`/`notifications` arrancan vacíos hasta que resuelve el primer `getComplaints()`/`getNotifications()` (ver el comentario sobre hidratación en `lib/store.ts`). Hoy la app no tiene ningún `loading.tsx`/skeleton para ese instante — en modo mock nunca hace falta porque esa misma llamada resuelve con los datos que ya están en memoria, así que no se nota. Antes de exponer `api` a usuarios reales, alguien tiene que diseñar ese estado de carga.
5. **`services/mock/mock-complaints.service.ts` es la referencia de comportamiento**: cualquier regla de negocio que `ApiComplaintsService`/el backend deban replicar (transiciones válidas, mensajes de error, qué genera cada notificación) está ahí, ya que es exactamente la misma lógica que antes vivía en `lib/store.ts`.

Aparte de eso, algunos contratos secundarios (`investigation.service.ts`, `resolution.service.ts`) todavía no existen como archivo — no bloquean nada porque `ComplaintsService` ya cubre esas operaciones (ver la nota de "servicios redundantes a propósito" en `contracts/README.md`).

## Mapa de la carpeta

```
services/
  config.ts            # interruptor mock/api (NEXT_PUBLIC_DATA_SOURCE)
  service-provider.ts  # el switch en sí: expone complaintsService/notificationsService según DATA_SOURCE
  service-error.ts     # ServiceError — el único tipo de error que lanzan mock y api, que el store entiende
  http-client.ts       # utilidad HTTP centralizada (fetch-wrapper mínimo real, ver nota abajo)
  contracts/           # interfaces — el "qué debe hacer cada servicio". Ver contracts/README.md
  mock/                # implementación en memoria, la que usa el store hoy por defecto. Ver mock/README.md
  api/                 # implementación real contra el backend, ya escrita (falta el backend). Ver api/README.md
```

| Carpeta | Para quién es | README |
|---|---|---|
| `contracts/` | Cualquiera que necesite saber **qué** debe devolver cada servicio (frontend o backend) | [`contracts/README.md`](./contracts/README.md) |
| `mock/` | Referencia de cómo se comporta hoy la demo (in-memory, sin red) | [`mock/README.md`](./mock/README.md) |
| `api/` | El desarrollador que implemente las llamadas reales al backend | [`api/README.md`](./api/README.md) |

## `config.ts` y `http-client.ts`

- `config.ts` define `DATA_SOURCE` (`"mock" | "api"`), leído de `NEXT_PUBLIC_DATA_SOURCE`. La idea es que cambiar de mock a api sea una variable de entorno, no un refactor.
- `http-client.ts` es el lugar único donde vive: base URL (`NEXT_PUBLIC_API_BASE_URL`), un `fetch` centralizado con manejo de errores (lanza `ServiceError` directamente — ver `service-error.ts` — para que el store no tenga que distinguir si vino de mock o de la API) y los métodos `get/post/put/patch/delete`. Es una base mínima real, no un mock — falta lo que aún no se puede resolver sin el backend definido (auth, envelope de errores exacto, reintentos). Ver "Plus sugeridos" en [`api/README.md`](./api/README.md) para qué le falta.

## Otros documentos relacionados

- [`README_SERVICIOS.md`](../README_SERVICIOS.md) (raíz del repo) — pasos genéricos para agregar un servicio nuevo desde cero.
- [`README_BACKEND.md`](../README_BACKEND.md) — contrato completo de endpoints (request/response) que estos servicios terminan llamando.
- [`README_DATABASE.md`](../README_DATABASE.md) — schema de base de datos (Prisma) que soporta esos endpoints.

## Cómo leer las tablas de método en cada README

En `contracts/README.md` y `api/README.md` vas a ver tablas con estas columnas:

| Columna | Significado |
|---|---|
| **Método** | Nombre exacto del método TypeScript en el contrato |
| **Verbo/Endpoint** | Verbo HTTP y ruta sugeridos (coinciden con `README_BACKEND.md`) |
| **Retorna** | Tipo de retorno del método (lo que espera el frontend) |
| **Notas / plus** | Detalles de implementación, casos borde, o mejoras sugeridas |
