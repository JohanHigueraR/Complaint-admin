# Implementación real (backend)

Cada archivo de esta carpeta implementa un contrato de [`../contracts`](../contracts/README.md) contra el backend real (en vez de datos en memoria como `../mock`), usando `../http-client.ts`.

**Importante:** estos archivos **sí compilan y son código real del frontend** (llaman a `httpClient`, que sí hace `fetch`). Lo que es solo de referencia es el bloque comentado al final de cada uno, con el **equivalente en NestJS + Prisma** del lado del backend — no se ejecuta en este repo (es un frontend, no tiene Nest ni Prisma instalados), es para que el equipo de backend tenga un punto de partida concreto.

## Qué existe hoy

| Archivo | Contrato | Endpoints (ver detalle en `contracts/README.md`) |
|---|---|---|
| `api-advisors.service.ts` | `AdvisorsService` | `GET /advisors` |
| `api-complaints.service.ts` | `ComplaintsService` | Los ~19 endpoints de quejas: listado, detalle, transiciones, asignación, investigación, seguimiento con el merchant, evidencias, notas, resolución, notificaciones |
| `api-evidence.service.ts` | `EvidenceService` | `GET`/`POST /complaints/{id}/evidence` |
| `api-notes.service.ts` | `NotesService` | `GET`/`POST /complaints/{id}/notes` |
| `api-notifications.service.ts` | `NotificationsService` | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| `api-history.service.ts` | `HistoryService` | `GET`/`POST /complaints/{id}/history` |
| `api-reports.service.ts` | `ReportsService` | `GET /reports/complaints-by-{status,priority,type}` (no usado en la UI todavía) |

Faltan `api-investigation.service.ts` y `api-resolution.service.ts` porque sus contratos (`InvestigationService`, `ResolutionService`) tampoco existen todavía — ver la sección de contratos pendientes en [`../contracts/README.md`](../contracts/README.md). Cuando se creen esos contratos, su `api-*.service.ts` sigue el mismo patrón que los siete de arriba.

`complaintsService` y `notificationsService` (`api-complaints.service.ts` y `api-notifications.service.ts`) ya están conectados a `lib/store.ts` a través de `../service-provider.ts` — se activan solos con `NEXT_PUBLIC_DATA_SOURCE=api`. Lo que falta es un backend real que responda en esos endpoints; ver la sección "Qué falta para que `api` funcione de verdad" en [`../README.md`](../README.md). Los otros cinco (`advisors`, `evidence`, `notes`, `history`, `reports`) están listos pero ningún componente los llama todavía (`advisor-assignment.tsx` sigue importando `mockAdvisors` directamente).

## Cómo leer cada archivo

Los siete archivos siguen la misma estructura:

1. **Arriba, código real**: la clase `Api<Nombre>Service implements <Nombre>Service`, con un método por cada operación del contrato, llamando a `httpClient.get/post/put/patch/delete` con la ruta exacta de `README_BACKEND.md`.
2. **Abajo, un bloque `/* ... */` comentado**: el equivalente del mismo endpoint en NestJS — `@Controller`/`@Get`/`@Post`, un `*Service` con `PrismaService` inyectado, y (cuando aplica) un DTO con `class-validator`. Referencia `README_DATABASE.md` para el schema y `services/contracts/README.md` para qué debe devolver cada uno.

`api-complaints.service.ts` es el más largo (agrupa todo el ciclo de vida de la queja); su ejemplo de NestJS no repite el mismo patrón 19 veces — desarrolla completo el caso de lectura (`findOne`, con el `include` de Prisma y el mapeo al contrato) y un caso de mutación con reglas de negocio (`escalateToMerchant`, con validación de estado + transacción), y deja anotado que el resto de mutaciones (`approve`, `reject`, `complete`, `assign`, etc.) siguen exactamente esa misma forma.

## Plus sugeridos

Ideas que no son obligatorias para que la app funcione, pero que evitan retrabajo cuando el backend esté conectado de verdad:

### 1. Mapeo de errores consistente con el store

`http-client.ts` ya lanza `ServiceError` directamente (ver `../service-error.ts`) para cualquier respuesta no exitosa, traduciendo el status HTTP a uno de los códigos que espera `lib/store.ts` (`NOT_FOUND | INVALID_TRANSITION | MISSING_DATA | READ_ONLY | DUPLICATE | BUSY`). Cuando el backend defina un `code` propio en el cuerpo del error, completar el mapeo en `ApiError.toServiceError()` (ya tiene el punto de extensión: `payload.code`) en vez de inventar un mapeo nuevo en cada `api-*.service.ts`.

### 2. Terminar `http-client.ts` antes de conectar auth

Ya tiene base URL configurable y manejo de errores; falta cuando exista login (README_BACKEND §17): inyectar el header de autenticación en un solo lugar (`request()`), no en cada servicio.

### 3. Validar la forma de la respuesta

Un backend en desarrollo puede cambiar de forma sin avisar. Vale la pena parsear la respuesta con algo como `zod` en el borde (dentro de cada `api-*.service.ts`) antes de devolverla al resto de la app, para que un cambio de contrato falle con un error claro en vez de romper la UI silenciosamente más adelante.

### 4. Cancelación en búsquedas

`complaint-inbox.tsx` filtra mientras el usuario escribe. Si `getComplaints()` se mueve a filtrado server-side (README_BACKEND §15), usar `AbortController` en `http-client.ts` para cancelar la request anterior cuando el usuario sigue escribiendo, evitando que una respuesta vieja pise a una más reciente.

### 5. Cache corto para catálogos que casi no cambian

`getAdvisors()` no necesita pedirse en cada render — un cache en memoria de unos minutos (o `staleTime` si se introduce algo como TanStack Query) evita llamadas innecesarias. `getComplaints()` en cambio no debería cachearse (cambia todo el tiempo).

### 6. Idempotencia en mutaciones

El store ya evita doble-click con un mutex local (`begin/endComplaintOperation`), pero eso no protege contra dos pestañas/usuarios distintos. Si el backend soporta `Idempotency-Key` en las mutaciones (`POST`/`PUT`/`DELETE`), pasar un id generado en el cliente por cada intento evita duplicar una acción si la respuesta se pierde y el frontend reintenta.
