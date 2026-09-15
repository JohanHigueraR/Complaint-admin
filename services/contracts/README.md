# Contratos de servicio

Cada archivo de esta carpeta es una **interfaz TypeScript**: define qué método existe, qué recibe y qué debe devolver — sin importar si detrás hay datos mock o un backend real. `services/mock/*` y (en su momento) `services/api/*` son dos implementaciones distintas de la misma interfaz.

Esta es la tabla de referencia completa: para cada método, el verbo/endpoint HTTP sugerido (alineado con [`README_BACKEND.md`](../../README_BACKEND.md)) y qué debe retornar. Úsala como fuente única de verdad al implementar `api/*` — no repitas esta info allá, solo enlázala.

## `AdvisorsService` (`advisors.service.ts`)

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getAdvisors()` | `GET /advisors` | `Advisor[]` | **Plus:** aceptar `?q=` para búsqueda por nombre (hoy `advisor-selector.tsx` filtra en el cliente); si la lista crece, agregar paginación. |

## `ComplaintsService` (`complaints.service.ts`)

El servicio "grande": agrupa todo el ciclo de vida de una queja. La mayoría de sus métodos son las mismas operaciones que exponen `EvidenceService`/`NotesService`/etc. por separado — ver la nota de ["servicios redundantes a propósito"](#servicios-redundantes-a-propósito-más-abajo) más abajo.

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getComplaints()` | `GET /complaints` | `Complaint[]` | **Plus:** este es el método que más se va a llamar. Soportar los query params de README_BACKEND §15 (`status`, `priority`, `advisor`, `merchant`, `type`, `date`, `sort`, `page`, `pageSize`, `q`) apenas el filtrado se mueva a servidor — hoy `lib/complaint-list.ts` filtra en el cliente sobre la lista completa. |
| `getComplaintById(id)` | `GET /complaints/{id}` | `Complaint \| null` | `id` acepta prefijo `CL-` o `Q-` (frontend normaliza, ver README_BACKEND §3.2). |
| `updateComplaint(id, partial)` | `PATCH /complaints/{id}` | `Complaint` | No se usa en la UI hoy. **Nunca** debe permitir cambiar `status` ni `resolution` — esas van por sus métodos dedicados. |
| `updateStatus(id, to)` | `PATCH /complaints/{id}/status` | `Complaint` | Solo transiciones simples: `recibido→investigando`, `investigando→manejando`. Cualquier otro destino → 409/422. |
| `assign(id, advisor)` / `reassign(id, advisor)` | `PUT /complaints/{id}/assignment` | `Complaint` | Idempotente: reasignar al mismo asesor no debe generar un evento duplicado. |
| `unassign(id)` | `DELETE /complaints/{id}/assignment` | `Complaint` | Idempotente. |
| `updateInvestigation(id, investigation)` | `PUT /complaints/{id}/investigation` | `Complaint` | Solo en `investigando`/`manejando`/`escalado_merchant`. Backend completa `startedAt`/`investigator` si no vienen. |
| `escalateToMerchant(id, note)` | `POST /complaints/{id}/merchant-escalations` | `Complaint` | Solo desde `investigando`. `note` obligatoria. Ver README_BACKEND §3.4. |
| `closeMerchantEscalation(id, response)` | `POST /complaints/{id}/merchant-escalations/close` | `Complaint` | Solo desde `escalado_merchant`, vuelve a `investigando`. `response` obligatoria. **Plus:** un caso puede escalarse más de una vez — persistir cada ciclo (ver `README_DATABASE.md`, tabla `merchant_escalations`), el frontend solo necesita el más reciente. |
| `addEvidence(id, evidence)` | `POST /complaints/{id}/evidence` | `Complaint` | Solo en `investigando`/`manejando`/`escalado_merchant`. Rechazar `id` duplicado (409). |
| `addInternalNote(id, note)` | `POST /complaints/{id}/notes` | `Complaint` | Solo en `recibido`/`investigando`/`escalado_merchant`/`manejando`. |
| `approve(id)` | `POST /complaints/{id}/approve` | `Complaint` | Solo desde `manejando`. |
| `reject(id, reason)` | `POST /complaints/{id}/reject` | `Complaint` | Solo desde `manejando`. `reason` obligatorio. |
| `complete(id)` | `POST /complaints/{id}/complete` | `Complaint` | Solo desde `aprobado`/`rechazado`. |
| `addHistoryEvent(id, event)` | `POST /complaints/{id}/history` (propuesta) | `Complaint` | `POR DEFINIR`: hoy el frontend genera los eventos localmente en cada acción; si el backend prefiere generarlos él mismo, este método puede no ser necesario desde el cliente. |
| `getNotifications()` | `GET /notifications` | `Notification[]` | Duplica `NotificationsService.getNotifications()` — ver nota de abajo. |
| `markNotificationAsRead(id)` | `POST /notifications/{id}/read` | `Notification[]` | Ídem. |
| `markAllNotificationsAsRead()` | `POST /notifications/read-all` | `Notification[]` | Ídem. |
| `getUnreadNotificationCount()` | `GET /notifications/unread-count` | `number` | Evita traer todas las notificaciones solo por el badge. |

**Errores esperados por el frontend** (ver `ActionResult` en `lib/store.ts`): `NOT_FOUND`, `INVALID_TRANSITION`, `MISSING_DATA`, `READ_ONLY`, `DUPLICATE`, `BUSY`. Si `api/complaints.service.ts` lanza errores, que el `message`/`code` puedan traducirse a uno de estos (ver ["plus" en `api/README.md`](../api/README.md#plus-sugeridos)).

## `EvidenceService` (`evidence.service.ts`)

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getEvidenceList(complaintId)` | `GET /complaints/{id}/evidence` | `Evidence[]` | |
| `addEvidence(complaintId, evidence)` | `POST /complaints/{id}/evidence` | `Evidence` | **Plus:** el objeto `Evidence` hoy llega ya armado (mock); un backend real debería recibir `multipart/form-data` (archivo real) y devolver el `Evidence` con `id`/`uploadedAt` generados por el servidor. Definir límite de tamaño. |

## `NotesService` (`notes.service.ts`)

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getNotes(complaintId)` | `GET /complaints/{id}/notes` | `ComplaintNote[]` | |
| `addNote(complaintId, note)` | `POST /complaints/{id}/notes` | `ComplaintNote` | Nunca se muestran al cliente final — privadas del equipo. |

## `NotificationsService` (`notifications.service.ts`)

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getNotifications(complaintId?)` | `GET /notifications` (con `?complaintId=` opcional) | `Notification[]` | **Plus:** hoy es una lista global sin dueño. Cuando exista login, agregar filtrado por asesor autenticado (ver README_BACKEND §17 y `README_DATABASE.md` nota sobre `recipientAdvisorId`). |
| `getUnreadNotificationCount()` | `GET /notifications/unread-count` | `number` | |
| `markNotificationAsRead(id)` | `POST /notifications/{id}/read` | `Notification` | Idempotente. |
| `markAllNotificationsAsRead()` | `POST /notifications/read-all` | `void` | |

## `HistoryService` (`history.service.ts`)

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getHistory(complaintId)` | `GET /complaints/{id}/history` | `ComplaintHistoryEvent[]` | Es de solo-agregar: nunca se edita ni se borra un evento existente. |
| `addEvent(complaintId, event)` | `POST /complaints/{id}/history` (propuesta) | `ComplaintHistoryEvent` | Ver `POR DEFINIR` en `ComplaintsService.addHistoryEvent`. |

## `ReportsService` (`reports.service.ts`)

No usado en la UI todavía; preparado para cuando el dashboard consuma agregados del backend en vez de calcularlos en el cliente.

| Método | Verbo/Endpoint | Retorna | Notas / plus |
|---|---|---|---|
| `getComplaintsByStatus()` | `GET /reports/complaints-by-status` (propuesta) | `{status, count}[]` | **Plus:** aceptar los mismos filtros que `getComplaints()` (fecha, asesor) para que el dashboard pueda acotar el rango. |
| `getComplaintsByPriority()` | `GET /reports/complaints-by-priority` (propuesta) | `{priority, count}[]` | Ídem. |
| `getComplaintsByType()` | `GET /reports/complaints-by-type` (propuesta) | `{type, count}[]` | Ídem. |

## ⏳ Pendientes de crear en esta carpeta

Estos dos contratos están descritos en [`README_SERVICIOS.md`](../../README_SERVICIOS.md) pero el archivo `.ts` todavía no existe. Se documenta aquí la forma que deberían tener para no perder la referencia:

### `InvestigationService` (`investigation.service.ts` — no existe aún)

| Método | Verbo/Endpoint | Retorna |
|---|---|---|
| `getInvestigation(complaintId)` | `GET /complaints/{id}/investigation` | `Investigation \| null` |
| `updateInvestigation(complaintId, investigation)` | `PUT /complaints/{id}/investigation` | `Investigation` |

### `ResolutionService` (`resolution.service.ts` — no existe aún)

| Método | Verbo/Endpoint | Retorna |
|---|---|---|
| `approve(complaintId)` | `POST /complaints/{id}/approve` | `Complaint` |
| `reject(complaintId, reason)` | `POST /complaints/{id}/reject` | `Complaint` |
| `complete(complaintId)` | `POST /complaints/{id}/complete` | `Complaint` |

**Plus sugerido:** por el mismo patrón que ya existe, valdría la pena un `merchant-escalation.service.ts` dedicado (`getEscalations`/`escalate`/`close`) por si el backend prefiere ese recurso separado de `ComplaintsService`. Hoy no existe; se menciona solo como opción, no es necesario crearlo.

## Servicios "redundantes" a propósito

`EvidenceService`, `NotesService`, `HistoryService`, `InvestigationService` y `ResolutionService` cubren operaciones que **también** están en `ComplaintsService`. Es intencional: si el backend decide que evidencias/notas/investigación/resolución son sub-recursos con su propio endpoint (en vez de venir embebidos en `GET /complaints/{id}`), el contrato ya existe. Si el backend prefiere todo embebido, estos servicios simplemente no se implementan en `api/` y se ignoran — no hay que borrarlos.
