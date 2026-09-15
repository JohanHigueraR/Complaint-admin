# README Backend — Guía de integración (Frontend Quejas SAC Central)

> **Audiencia:** equipo de backend.
> **Objetivo:** responder *"¿Qué necesita implementar backend para que este frontend pueda reemplazar los mocks por servicios reales?"*
> **Alcance:** solo documenta necesidades del frontend. NO se implementó ninguna llamada real, NO se cambió arquitectura ni lógica, NO existen endpoints reales todavía.

- Estado actual del frontend: 100% mock/local (`data/`, `lib/store.ts`).
- Los nombres de endpoints/métodos son **propuestas**; backend puede cambiar la convención siempre que cubra la necesidad descrita.
- Todo lo que no pudo determinarse con certeza desde el código está marcado como `POR DEFINIR`.
- Stack frontend: Next.js 16.3.5 (App Router) + React 19 + Zustand 5 + Tailwind 4 + `lucide-react`. Alias `@/*` → `./*` (`tsconfig.json`).

## Índice

1. Cómo está organizado el frontend hoy
2. Estados de la queja y transiciones
3. Quejas: listado, detalle, status
4. Asignación
5. Investigación
6. Evidencias
7. Notas internas
8. Resolución
9. Historial
10. Notificaciones
11. Ubicación en el frontend
12. Mapeo Mock → API
13. Modelo de datos
14. Relaciones
15. Listado y filtros
16. Paginación y ordenamiento (POR DEFINIR)
17. Autenticación, usuario actual y autorización (POR DEFINIR)
18. Convenciones transversales (propuestas)
19. Checklist mínimo

---

## 1. Cómo está organizado el frontend hoy

### Rutas reales (App Router)

| Ruta | Archivo | Qué renderiza |
|---|---|---|
| `/quejas` | `app/quejas/page.tsx` | `<ComplaintInbox />` vista `all` |
| `/quejas/mis` | `app/quejas/mis/page.tsx` | `<ComplaintInbox />` vista `mine` |
| `/quejas/pendientes` | `app/quejas/pendientes/page.tsx` | `<ComplaintInbox />` vista `pending` |
| `/quejas/completadas` | `app/quejas/completadas/page.tsx` | `<ComplaintInbox />` vista `completed` |
| `/quejas/[id]` | `app/quejas/[id]/page.tsx` | `<ComplaintDetail>` o "Queja no encontrada" |
| `/` | `app/page.tsx` | `POR DEFINIR` |

Las 4 rutas de inbox comparten `components/complaints/complaint-inbox.tsx`. La vista se deriva del pathname (`getView`): `…/mis → mine`, `…/pendientes → pending`, `…/completadas → completed`, resto → `all`.

### Estado global y datos

| Pieza | Archivo real | Rol actual |
|---|---|---|
| Store quejas + notificaciones | `lib/store.ts` (`useComplaintStore`, Zustand) | Única fuente de verdad + acciones de negocio |
| Toasts | `lib/toast.ts` (`useToastStore`) | Solo UI, sin backend |
| Filtrado/orden/resumen | `lib/complaint-list.ts` | Hoy 100% client-side |
| Tipos | `types/complaint.ts` | Contrato real de la UI (ver §13) |
| Mocks | `data/mock-complaints.ts`, `data/mock-advisors.ts`, `data/mock-notifications.ts` | A reemplazar |
| Constantes | `constants/complaint-flow.ts`, `constants/complaint-options.ts`, `constants/complaints.ts` | Transiciones, agrupaciones, labels |

No existe capa `services/` ni `hooks/` de datos. Los componentes consumen `useComplaintStore()` directamente.

### Componentes relevantes (archivos reales)

- Inbox: `complaint-inbox.tsx`, `complaint-table.tsx`,
  `complaint-filter-panel.tsx`, `complaint-status-badge.tsx`,
  `complaint-priority-badge.tsx`.
- Detalle: `complaint-detail.tsx`, `complaint-progress.tsx`,
  `complaint-state-action.tsx`, `advisor-assignment.tsx`,
  `advisor-selector.tsx`, `investigation-section.tsx`,
  `evidence-section.tsx`, `internal-notes-section.tsx`,
  `resolution-section.tsx` (`dynamic(...,{ssr:false})`),
  `complaint-timeline.tsx`, `copy-button.tsx`.
- `complaint-actions.tsx` está deshabilitado ("Próximamente",
  botones `disabled`) — **no genera necesidad backend**.
- Layout: `layout/app-shell.tsx`, `layout/sidebar.tsx`
  (contadores vía `getComplaintSummary`), `layout/header.tsx`,
  `layout/user-menu.tsx` (usuario hardcodeado),
    `notifications/notification-center.tsx`,
  `notifications/notification-item.tsx`.

## 2. Estados de la queja y transiciones

Valores reales (`types/complaint.ts`, minúsculas, sin tildes):

| Estado | Etiqueta UI (`complaintStatusLabels`) | Descripción (`getStatusDescription`) |
|---|---|---|
| `recibido` | Recibido | Pendiente de iniciar investigación |
| `investigando` | Investigando | Siendo investigado |
| `manejando` | Manejando | Investigación completa, listo para gestionar |
| `aprobado` | Aprobado | Aprobada, pendiente de completar |
| `rechazado` | Rechazado | Rechazada, pendiente de completar |
| `completado` | Completado | Proceso finalizado (terminal) |

Transiciones (`statusTransitions` en `constants/complaint-flow.ts`):

```text
recibido  -> investigando
investigando -> manejando
manejando -> aprobado | rechazado
aprobado  -> completado
rechazado -> completado
completado -> (sin salidas)
```

Reglas que backend debería replicar:

- `updateComplaintStatus` solo permite `investigando`/`manejando` (`SIMPLE_TARGETS`). Lo demás → `INVALID_TRANSITION`.
- `aprobado/rechazado/completado` solo vía acciones dedicadas.
- Rechazo exige motivo no vacío. Completar exige venir de `aprobado` o `rechazado`.
- No existen ni deben inventarse: `pendiente`, `en revisión`, `esperando información`, `escalado`, `resuelto`, `cerrado`, `cancelado`. "Pendientes" = `recibido,investigando,manejando`; "Completadas" = `aprobado,rechazado,completado`. Son agrupaciones UI (`pendingStatuses`/`completedStatuses` en `constants/complaint-options.ts`).

## 3. Quejas: listado, detalle, status

### 3.1 `GET /complaints` — Listar

- Método: GET
- Objetivo: alimentar inbox + contadores del sidebar. Hoy: `mockComplaints`.
- Quién consume: `/quejas`, `/quejas/mis`, `/quejas/pendientes`, `/quejas/completadas` (`complaint-inbox.tsx` + `complaint-table.tsx` + `sidebar.tsx`).
- Request (query params propuestos; ver §15 detalle): `q`, `status`, `priority`, `advisorId`, `merchant`, `type`, `date`, `start`, `end`, `sort`, `page`, `pageSize`, `view` (`all|mine|pending|completed`).
- Response 200 (campos que la UI usa):

```json
{
  "data": [
    {
      "id": "Q-2026-00147",
      "createdAt": "2026-09-14T08:15:00-05:00",
      "updatedAt": "2026-09-14T08:57:00-05:00",
      "customer": { "id": "CLI-023", "name": "Samuel Ortiz", "document": "***9483", "phone": "*** *** 1234", "email": "sa***@correo.com" },
      "complaintType": "Cobro duplicado",
      "merchant": "Farmacia Salud",
      "merchantInfo": { "name": "Farmacia Salud", "type": "Comercio", "code": "MER-00123" },
      "transaction": { "id": "TX-841026", "amount": 78400, "currency": "COP", "date": "2026-09-14T08:15:00-05:00", "paymentMethod": "PSE", "transactionStatus": "Exitosa" },
      "status": "investigando",
      "priority": "media",
      "assignedAdvisor": { "id": "advisor-1", "name": "María Gómez", "role": "Asesora SAC" },
      "description": "El cliente reporta cobro duplicado."
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 24 }
}
```

- Errores: 400, 401, 403, 500.
- Integración: `lib/store.ts` (`useComplaintStore.complaints`). `PROPUESTA DE ESTRUCTURA`: `@/services/complaints.service.ts` + `@/hooks/useComplaints.ts`.

### 3.2 `GET /complaints/{id}` — Detalle

- Método: GET. Objetivo: `/quejas/[id]`. Hoy: `getMockComplaintById(id)`.
- Quién consume: `app/quejas/[id]/page.tsx` + `complaint-detail.tsx`.
- Request: path param `id` (ej. `Q-2026-00147`).
- Response 200: `Complaint` completo. Recomendación de embeber en §14. Mínimo: campos 3.1 + `investigation`, `evidences`, `notes`, `resolution`, `history`.
- Errores: 400 (id malformado), 401, 403, 404, 500.
- Nota: frontend normaliza `CL-` → `Q-` (`normalizeComplaintId` en `lib/store.ts`) y muestra `#CL-…` (`displayId`). Backend define formato canónico del id (`POR DEFINIR`).
- Integración: `app/quejas/[id]/page.tsx` (reemplazar `getMockComplaintById`). `PROPUESTA DE ESTRUCTURA`: `@/services/complaints.service.ts` (`getComplaintById`).

### 3.3 `PATCH /complaints/{id}/status` — Avance simple

- Método: PATCH (parcial, solo `status`). Se descarta PUT (no es reemplazo total).
- Objetivo: `recibido → investigando` e `investigando → manejando`. Lo consumen el botón principal del detalle + `complaint-state-action.tsx`.
- Razón PATCH/no POST: transiciones lineales de etapa, no acciones con efectos complejos. Las decisiones (aprobar/rechazar/completar) van como POST dedicados (§8).
- Quién consume: `/quejas/[id]` (`complaint-detail.tsx` → `transition()` → `updateComplaintStatus` + `complaint-state-action.tsx`).
- Request body: `{ "to": "investigando" }`.
- Response 200: `Complaint` actualizada (o `{id,status,updatedAt,historyEvent?,notification?}` — `POR DEFINIR` según §9/§10 sobre quién genera historial).
- Errores: 400 (destino inválido), 401, 403, 404, 409/422 (transición no permitida — hoy `INVALID_TRANSITION`), 500. El frontend también tiene `BUSY` (solo local, mutex).
- Integración: `lib/store.ts` (`updateComplaintStatus`).

## 4. Asignación

La asignación **no cambia el estado** (texto en `advisor-selector.tsx`).
Solo cambia `assignedAdvisor`.

### 4.1 `GET /advisors` — Obtener asesores

- Método: GET
- Objetivo: poblar diálogo de asignación. Hoy: `mockAdvisors` (importado en `advisor-assignment.tsx`).
- Quién consume: `/quejas/[id]` (`advisor-assignment.tsx` → `advisor-selector.tsx`, búsqueda client-side por nombre).
- Request: `q` opcional. Paginación `POR DEFINIR`.
- Response 200:

```json
{ "data": [ { "id": "advisor-1", "name": "María Gómez", "role": "Asesora SAC" }, { "id": "advisor-2", "name": "Carlos Rodríguez", "role": "Asesor SAC" } ] }
```

- Errores: 401, 403, 500.
- Integración: `advisor-assignment.tsx` (reemplazar `import { mockAdvisors }`).

### 4.2 `PUT /complaints/{id}/assignment` — Asignar/reasignar

- Método: PUT (reemplazo del vínculo). PATCH aceptable si backend lo prefiere.
- Objetivo: cubrir `assignComplaint` y `reassignComplaint` con un solo endpoint (si no había asesor = asignar; si había otro = reasignar). Idempotente.
- Razón: el frontend ya los une en `handleSelect()` (`advisor-assignment.tsx` decide según estado previo). Separar duplica contratos sin beneficio.
- Quién consume: `/quejas/[id]` (`handleAssign`, `handleReassign`).
- Request body: `{ "advisorId": "advisor-3" }`.
- Response 200: queja con `assignedAdvisor` actualizado + `updatedAt`. Evento `assignment` + notificación `assignment` (§9/§10).
- Errores: 400 (advisor inválido — hoy `MISSING_DATA`), 401, 403, 404, 409 (queja bloqueada — `POR DEFINIR`), 500.
- Integración: `lib/store.ts` (`assignComplaint`, `reassignComplaint`).

### 4.3 `DELETE /complaints/{id}/assignment` — Desasignar

- Método: DELETE sobre sub-recurso. Alternativa `PUT { "advisorId": null }` válida; se propone DELETE por semántica REST.
- Objetivo: cubrir `unassignComplaint` (idempotente).
- Quién consume: `/quejas/[id]` (`handleUnassign`).
- Response: 200 con queja (`assignedAdvisor: null`) o 204 (`POR DEFINIR`).
- Errores: 401, 403, 404, 500.
- Integración: `lib/store.ts` (`unassignComplaint`).

## 5. Investigación

Editable solo en `investigando`/`manejando` (`INVESTIGATION_EDITABLE` en `lib/store.ts`; `readOnly` en `investigation-section.tsx`). Guardar **no cambia el estado**.

### 5.1 `GET /complaints/{id}/investigation` — Consultar

- Método: GET. Puede venir embebida en `GET /complaints/{id}` (§14).
- Quién consume: `/quejas/[id]` (`investigation-section.tsx`, prop `investigation`).
- Response 200:

```json
{
  "startedAt": "2026-09-14T08:25:00-05:00", "investigator": "María Gómez",
  "findings": "Revisión inicial: discrepancia en referencia.",
  "transactionVerified": true, "customerDataVerified": true,
  "merchantDataVerified": false, "paymentVerified": false,
  "conclusion": "Indicios de cobro duplicado, pendiente reverso."
}
```

- Errores: 401, 403, 404. Si no existe: 200 con `null` o 404 (`POR DEFINIR`; el frontend usa `EMPTY_INVESTIGATION`).
- Integración: `investigation-section.tsx` + `lib/store.ts`.

### 5.2 `PUT /complaints/{id}/investigation` — Guardar

- Método: PUT (formulario envía objeto completo). Se descarta PATCH.
- Objetivo: cubrir `updateInvestigation`. Backend completa `startedAt`/`investigator` si no vienen.
- Quién consume: `/quejas/[id]` (`handleSaveInvestigation` → `updateInvestigation`).
- Request body: objeto completo (ejemplo 5.1).
- Response 200: investigación + `updatedAt` de la queja. Evento `investigation_updated` + notificación `investigation` (§9/§10).
- Errores: 400 (payload — hoy `MISSING_DATA`), 401, 403, 404, 409 (estado no editable — hoy `READ_ONLY`), 500.
- Integración: `lib/store.ts` (`updateInvestigation`).

## 6. Evidencias

Agregables solo en `investigando`/`manejando` (`EVIDENCE_EDITABLE` en store; `readOnly` en `evidence-section.tsx`). No hay edición ni borrado implementado.

### 6.1 `GET /complaints/{id}/evidence` — Listar

- Método: GET. Puede venir embebida en `GET /complaints/{id}` (§14).
- Quién consume: `/quejas/[id]` (`evidence-section.tsx`, prop `evidences`).
- Response 200:

```json
{ "data": [ {
  "id": "EV-001", "name": "Comprobante enviado.pdf",
  "type": "application/pdf", "size": 24800,
  "uploadedAt": "2026-09-13T17:50:00-05:00",
  "uploadedBy": "María Gómez",
  "description": "Captura de pantalla del cobro duplicado."
} ] }
```

- Errores: 401, 403, 404, 500. Sin evidencias: 200 con `[]`.
- Integración: `evidence-section.tsx` + `lib/store.ts`.

### 6.2 `POST /complaints/{id}/evidence` — Agregar

- Método: POST. Objetivo: cubrir `addEvidence`.
- Hoy el frontend genera `id`, `uploadedBy`, `uploadedAt` localmente y simula la subida.
- Quién consume: `/quejas/[id]` (diálogo "Agregar evidencia" → `handleAddEvidence` → `addEvidence`).
- Request: `Content-Type: multipart/form-data` (propuesto):

  | field | tipo | origen |
  |---|---|---|
  | `file` | file | input `type="file"` |
  | `description` | string | texto |
  | `uploadedBy` | string | opcional (backend usa usuario auth — `POR DEFINIR`) |

  Alternativa JSON (si upload a storage es separado): `{ name, type, size, uploadedAt, uploadedBy, description }` — `POR DEFINIR`.
- Response 201: evidencia creada (schema 6.1) + `updatedAt`. Evento `evidence_added` + notificación `evidence` (§9/§10).
- Errores: 400 (inválido/grande), 401, 403, 404, 409 (estado no editable), 413, 500.
- Integración: `evidence-section.tsx` (`onAdd`) + `lib/store.ts` (`addEvidence`).
- Límite de tamaño: `POR DEFINIR`.

### 6.3 `GET /complaints/{id}/evidence/{evidenceId}` — Ver/download

- Método: GET. Objetivo: preview/imagen del detalle.
- Quién consume: `evidence-section.tsx` (acción "ver").
- Response: binario o URL firmada (`POR DEFINIR`).
- Integración: `evidence-section.tsx`.

> No se proponen PUT/PATCH/DELETE de evidencia (no implementados). Ampliación si se agrega.

## 7. Notas internas

Agregables solo en `recibido`/`investigando`/`manejando` (`NOTES_EDITABLE` en store; `readOnly` incluye `aprobado/rechazado/completado`). No hay edición ni borrado.

### 7.1 `GET /complaints/{id}/notes` — Listar

- Método: GET. Puede venir embebida (§14).
- Quién consume: `/quejas/[id]` (`internal-notes-section.tsx`, prop `notes`).
- Response 200:

```json
{ "data": [ {
  "id": "N-Q-2026-00147-1", "complaintId": "Q-2026-00147",
  "content": "Se validó la transacción con la información disponible.",
  "author": "María Gómez", "authorRole": "Asesora SAC",
  "createdAt": "2026-09-14T09:20:00-05:00", "updatedAt": null
} ] }
```

- Errores: 401, 403, 404, 500. Sin notas: 200 con `[]`.
- Integración: `internal-notes-section.tsx` + `lib/store.ts`.

### 7.2 `POST /complaints/{id}/notes` — Agregar

- Método: POST. Objetivo: cubrir `addNote`.
- Hoy el frontend genera `id`, `author`, `authorRole`, `createdAt` localmente (autor = `currentAdvisor` hardcodeado).
- Quién consume: `/quejas/[id]` (`internal-notes-section.tsx` → `handleAddNote` → `addNote`).
- Request body: `{ "content": "Llamé al merchant y confirmó el reverso." }`.
- Response 201: nota creada (schema 7.1). Backend rellena `id`, `author`, `authorRole`, `createdAt`; `updatedAt: null`. Evento `internal_note_added` + notificación `note` (§9/§10).
- Errores: 400 (contenido vacío — hoy `MISSING_DATA`), 401, 403, 404, 409 (estado no editable), 500.
- Integración: `internal-notes-section.tsx` (`onAdd`) + `lib/store.ts` (`addNote`).

> No se propone editar/borrar nota. Ampliación si se agrega.

## 8. Resolución

Decisiones (`approve`/`reject`/`complete`) validan con `canTransition` y modifican `status` **y** `resolution`. Se proponen como POST dedicados por ser acciones de negocio con efectos colaterales (resolución firmada, auditoría).

### 8.1 `POST /complaints/{id}/approve` — Aprobar

- Método: POST
- Objetivo: `manejando → aprobado`.
- Quién consume: `/quejas/[id]` (`handleApprove` → `approveComplaint`).
- Request body: `{}`.
- Response 200: queja `status:"aprobado"` + `resolution:{decision:"aprobado",decidedAt,decidedBy}`. Evento `approved` + notificación `resolution` (§9/§10).
- Errores: 400 (estado no `manejando`), 401, 403, 404, 409 (`INVALID_TRANSITION`), 500.
- Integración: `lib/store.ts` (`approveComplaint`).

### 8.2 `POST /complaints/{id}/reject` — Rechazar

- Método: POST
- Objetivo: `manejando → rechazado` con motivo.
- Quién consume: `/quejas/[id]` (`handleReject` → `rejectComplaint`).
- Request body: `{ "reason": "La transacción fue validada como legítima..." }`.
- Response 200: queja `status:"rechazado"` + `resolution:{decision:"rechazado",decidedAt,decidedBy,rejectionReason}`. Evento `rejected` + notificación `resolution` (§9/§10).
- Errores: 400 (motivo vacío — hoy `MISSING_DATA`), 401, 403, 404, 409 (estado no `manejando`), 500.
- Integración: `lib/store.ts` (`rejectComplaint`).

### 8.3 `POST /complaints/{id}/complete` — Completar

- Método: POST
- Objetivo: `aprobado → completado` o `rechazado → completado`.
- Quién consume: `/quejas/[id]` (`handleComplete` → `completeComplaint`).
- Request body: `{}`.
- Response 200: queja `status:"completado"` + `resolution.completedAt` actualizado. Evento `completed` + notificación `status_change` (§9/§10).
- Errores: 400 (estado no `aprobado/rechazado`), 401, 403, 404, 409 (`INVALID_TRANSITION`), 500.
- Integración: `lib/store.ts` (`completeComplaint`).

> Alternativa no adoptada: `PATCH /complaints/{id}/resolution`.

## 9. Historial

### 9.1 `GET /complaints/{id}/history` — Timeline

- Método: GET. Objetivo: `complaint-timeline.tsx` (hoy fixture en `mock-complaints.ts`).
- Quién consume: `/quejas/[id]` (sección #historial + `complaint-timeline.tsx`).
- Response 200:

```json
{ "data": [ {
  "id": "H-Q-2026-00147-s-inv", "type": "status_change",
  "title": "Estado actualizado", "description": "Recibido -> Investigando",
  "createdAt": "2026-09-14T09:20:00-05:00",
  "actor": "María Gómez",
  "metadata": { "from": "recibido", "to": "investigando" }
} ] }
```

- `type` reconocidos (en `complaint-timeline.tsx`):
  `received`, `assignment`, `investigation_started`,
  `investigation_updated`, `evidence_added`,
  `internal_note_added`, `status_change`, `approved`,
  `rejected`, `completed`. `metadata` libre.
- Puede venir embebido en `GET /complaints/{id}` (§14).
- Errores: 401, 403, 404, 500. Sin eventos: 200 con `[]`.
- Integración: `complaint-timeline.tsx` + `lib/store.ts` (`addHistoryEvent`).

## 10. Notificaciones

El muéstrame (`notification-button.tsx`) y el centro (`notification-center.tsx`) consumen `notifications` del store (hoy `mockNotifications`).

### 10.1 `GET /notifications` — Listar

- Método: GET
- Objetivo: poblar centro + badge. Hoy: `mockNotifications`.
- Quién consume: `layout/header.tsx`, `notifications/notification-center.tsx`, `notification-item.tsx`.
- Request: opcional `?unreadOnly=true` para el badge.
- Response 200:

```json
{ "data": [ {
  "id": "NOTIF-001", "type": "assignment",
  "title": "Queja asignada",
  "description": "Se te asignó la queja Q-2026-00148.",
  "complaintId": "Q-2026-00148",
  "createdAt": "2026-09-14T10:28:00-05:00",
  "read": false
} ] }
```

- Errores: 401, 403, 500.
- Integración: `useComplaintStore.notifications` (`lib/store.ts`).

### 10.2 `POST /notifications/{id}/read` — Marcar leída

- Método: POST sobre sub-recurso. Alternativa `PATCH /notifications/{id} {read:true}`.
- Objetivo: `markNotificationAsRead` (click en ítem).
- Response: 200/204 (`POR DEFINIR`).
- Errores: 401, 403, 404, 500.
- Integración: `lib/store.ts` (`markNotificationAsRead`).

### 10.3 `POST /notifications/read-all` — Marcar todas leídas

- Método: POST sobre colección. Alternativa `PATCH /notifications {read:true}`.
- Objetivo: `markAllNotificationsAsRead` (botón "Marcar leídas").
- Response: 200/204 (`POR DEFINIR`).
- Errores: 401, 403, 500.
- Integración: `lib/store.ts` (`markAllNotificationsAsRead`).

### 10.4 `GET /notifications/unread-count` — Contador

- Objetivo: badge (`getUnreadNotificationCount`). Opcional si el listado (10.1) incluye `read`.
- Response: `{ "count": 3 }`.
- Integración: `layout/notification-button.tsx` + `getUnreadNotificationCount`.

> Las notificaciones hoy se **generan localmente** por cada acción (`makeNotification` en `lib/store.ts`). Recomendación: backend genera al persistir eventos; frontend deja de crearlas localmente. Estado: `POR DEFINIR` (¿WS/política push vs. consumo del listado?).

## 11. Ubicación en el frontend

> No existe capa `services/` ni `hooks/` de datos hoy. Los componentes consumen `useComplaintStore` directamente.

### PROPUESTA DE ESTRUCTURA (no implementada)

```text
src/
  services/
    complaints.service.ts
    advisors.service.ts
    notifications.service.ts
  hooks/
    useComplaints.ts
    useComplaint.ts
    useAdvisors.ts
    useNotifications.ts
```

Alias `@/*` → `./*` (`tsconfig.json`) → rutas propuestas `@/services/...`, `@/hooks/...`.

### Mapa de integración por endpoint

| Servicio | Consume desde | Archivo/componente objetivo |
|---|---|---|
| `GET /complaints` | `/quejas`, `/quejas/mis`, `/quejas/pendientes`, `/quejas/completadas` | `complaint-inbox.tsx` + `lib/store.ts` (`complaints`). Contadores: `layout/sidebar.tsx` (`getComplaintSummary`). |
| `GET /complaints/{id}` | `/quejas/[id]` | `app/quejas/[id]/page.tsx` (reemplazar `getMockComplaintById`) + `lib/store.ts` (`getComplaintById`). |
| `PATCH /complaints/{id}/status` | `/quejas/[id]` | `lib/store.ts` (`updateComplaintStatus`) + `complaint-state-action.tsx` (`onTransition`). |
| `GET /advisors` | `/quejas/[id]` (panel Asignado a) | `advisor-assignment.tsx` (reemplazar `import { mockAdvisors }`). |
| `PUT /complaints/{id}/assignment` | `/quejas/[id]` | `lib/store.ts` (`assignComplaint`,`reassignComplaint`). |
| `DELETE /complaints/{id}/assignment` | `/quejas/[id]` | `lib/store.ts` (`unassignComplaint`). |
| `GET /complaints/{id}/investigation` | `/quejas/[id]` | `investigation-section.tsx` (prop `investigation`). |
| `PUT /complaints/{id}/investigation` | `/quejas/[id]` | `lib/store.ts` (`updateInvestigation`) + `investigation-section.tsx` (`onSave`). |
| `GET /complaints/{id}/evidence` | `/quejas/[id]` | `evidence-section.tsx` (prop `evidences`). |
| `POST /complaints/{id}/evidence` | `/quejas/[id]` | `lib/store.ts` (`addEvidence`) + `evidence-section.tsx` (`onAdd`). |
| `GET .../evidence/{id}` | `/quejas/[id]` | `evidence-section.tsx` (acción "ver"). |
| `GET /complaints/{id}/notes` | `/quejas/[id]` | `internal-notes-section.tsx` (prop `notes`). |
| `POST /complaints/{id}/notes` | `/quejas/[id]` | `lib/store.ts` (`addNote`) + `internal-notes-section.tsx` (`onAdd`). |
| `GET /complaints/{id}/history` | `/quejas/[id]` | `complaint-timeline.tsx` (prop `events`). |
| `GET /notifications` | layout global | `useComplaintStore.notifications` (`lib/store.ts`); UI `notifications/notification-center.tsx` + `notification-item.tsx`. |
| `POST /notifications/{id}/read` | layout global | `lib/store.ts` (`markNotificationAsRead`). |
| `POST /notifications/read-all` | layout global | `lib/store.ts` (`markAllNotificationsAsRead`). |
| `GET /notifications/unread-count` | `notification-button.tsx` | `layout/notification-button.tsx` + `getUnreadNotificationCount`. |

## 12. Mapeo Mock → API

| Mock actual | Servicio backend | Método | Acción |
|---|---|---|---|
| `mockComplaints` | `/complaints` | GET | Reemplazar carga del listado |
| `getMockComplaintById(id)` | `/complaints/{id}` | GET | Reemplazar carga detalle |
| `mockAdvisors` (import en `advisor-assignment.tsx`) | `/advisors` | GET | Reemplazar lista de asesores |
| `mockNotifications` | `/notifications` | GET | Reemplazar notificaciones |
| `updateComplaintStatus()` | `/complaints/{id}/status` | PATCH | Reemplazar acción local |
| `approveComplaint()` | `/complaints/{id}/approve` | POST | Reemplazar acción local |
| `rejectComplaint()` | `/complaints/{id}/reject` | POST | Reemplazar acción local |
| `completeComplaint()` | `/complaints/{id}/complete` | POST | Reemplazar acción local |
| `assignComplaint()`/`reassignComplaint()` | `/complaints/{id}/assignment` | PUT | Reemplazar acción local |
| `unassignComplaint()` | `/complaints/{id}/assignment` | DELETE | Reemplazar acción local |
| `updateInvestigation()` | `/complaints/{id}/investigation` | PUT | Reemplazar acción local |
| `addEvidence()` | `/complaints/{id}/evidence` | POST | Reemplazar acción local |
| `addNote()` | `/complaints/{id}/notes` | POST | Reemplazar acción local |
| `addHistoryEvent()` | `/complaints/{id}/history` | POST (propuesta) | `POR DEFINIR`: hoy frontend inyecta eventos locales |
| `markNotificationAsRead()` | `/notifications/{id}/read` | POST | Reemplazar acción local |
| `markAllNotificationsAsRead()` | `/notifications/read-all` | POST | Reemplazar acción local |
| `filterComplaints()`/`sortComplaints()` (`lib/complaint-list.ts`) | `/complaints` (query) | server-side `POR DEFINIR` (ver §15) | Reemplazar filtrado/sort local |
| `getComplaintSummary()`/`getComplaintFilterOptions()` | derivados del listado | GET `/complaints` | Client-side hoy; server-side `POR DEFINIR` |
| `ComplaintHistoryEvent[]` fixture en `mock-complaints.ts` | `/complaints/{id}/history` | GET | Reemplazar generación local del timeline |

## 13. Modelo de datos (real, desde `types/complaint.ts`)

```ts
// types/complaint.ts
export type ComplaintStatus =
  | "recibido" | "investigando" | "manejando"
  | "aprobado" | "rechazado" | "completado";
export type ComplaintPriority = "baja" | "media" | "alta";

export interface ComplaintCustomer {
  id: string; name: string; document: string;
  phone: string; email: string;
}
export interface ComplaintTransaction {
  id: string; amount: number; currency: "COP";
  date: string; paymentMethod: "PSE"|"Tarjeta débito"|"Tarjeta crédito";
  transactionStatus: "Exitosa";
}
export interface ComplaintMerchant {
  name: string; type: "Comercio"|"Servicio digital"; code: string;
}
export interface Complaint {
  id: string; createdAt: string; updatedAt: string;
  customer: ComplaintCustomer;
  complaintType: string;
  merchant: string;                 // nombre legible (redundante con merchantInfo)
  merchantInfo: ComplaintMerchant;
  transaction: ComplaintTransaction;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedAdvisor?: Advisor | null;
  description: string;
  investigation?: Investigation | null;
  evidences?: Evidence[] | null;
  history?: ComplaintHistoryEvent[] | null;
  notes?: ComplaintNote[] | null;
  resolution?: Resolution | null;
}
export interface Investigation {
  startedAt: string | null; investigator: string | null;
  findings: string;
  transactionVerified: boolean; customerDataVerified: boolean;
  merchantDataVerified: boolean; paymentVerified: boolean;
  conclusion: string;
}
export interface Advisor { id: string; name: string; role: string; }
export interface Evidence {
  id: string; name: string; type: string; size: number; // bytes
  uploadedAt: string; uploadedBy: string; description?: string;
}
export interface ComplaintHistoryEvent {
  id: string; type: string; title: string;
  description?: string; createdAt: string; actor: string;
  metadata?: Record<string, unknown> | null;
}
export interface Resolution {
  decision: "aprobado" | "rechazado";
  decidedAt: string; decidedBy: string;
  rejectionReason?: string | null;
  completedAt?: string | null;
}
export interface ComplaintNote {
  id: string; complaintId: string; content: string;
  author: string; authorRole?: string | null;
  createdAt: string; updatedAt?: string | null;
}
export type NotificationType =
  | "assignment" | "status_change" | "investigation"
  | "evidence" | "note" | "resolution";
export interface Notification {
  id: string; type: NotificationType; title: string;
  description: string; complaintId?: string;
  createdAt: string; read: boolean;
}
```

Observaciones del frontend:

- `merchant` (string) y `merchantInfo` (objeto) coexisten; el listado usa `merchant`, el detalle usa `merchantInfo`. No asumir que siempre coinciden; el frontend los trata como independientes.
- `transaction.transactionStatus` es literalmente `"Exitosa"` en el tipado. Si backend amplía, el frontend no rompe.
- `currency` fijado a `"COP"`.
- `Evidence.uploadedBy`/`uploadedAt` hoy los setea el frontend; backend probablemente los genere.
- `ComplaintNote.complaintId` lo incluye el store (redundante si se path-dea el endpoint).
- `Resolution.decision` usa **español** (`aprobado`/`rechazado`), como el resto de estados. El frontend no hace traducción (`POR DEFINIR` si backend responde distinto).

## 14. Relaciones: qué embeber vs. qué separar

```text
Complaint
 ├── Customer        (embebido - pequeño)
 ├── MerchantInfo    (embebido - pequeño)
 ├── Transaction     (embebido - pequeño)
 ├── Advisor         (embebido - pequeño) | null
 ├── Investigation   (embebido o GET separado - pequeño)
 ├── Evidence[]      (embebido o GET separado - crece)
 ├── InternalNote[]  (embebido o GET separado - crece)
 ├── Resolution      (embebido - único) | null
 └── HistoryEvent[]  (GET separado preferible - crece con tiempo)
```

Recomendación de carga (`GET /complaints/{id}`):
- Embeber: `customer`, `merchantInfo`, `transaction`, `assignedAdvisor`, `resolution`, `investigation`, conteo de `evidences`/`notes` (no listados completos) y `history` solo si hay pocos eventos.
- `evidences`, `notes`, `history` por separado si superan ~20 ítems (payloads grandes en casos activos).
- El listado (`GET /complaints`) NO necesita `investigation`/`evidences`/`notes`/`history`; solo: `id`,`createdAt`,`updatedAt`,`customer`,`complaintType`,`merchant`,`transaction.id`,`status`,`priority`,`assignedAdvisor`,`description`.

> No sobrearquitecturar: hoy el fixture incluye todo embebido y el frontend funciona así. Separar para cuando `history`/`evidences`/`notes` crezcan.

## 15. Listado y filtros: server-side vs. client-side

Filtros actuales del inbox (`complaint-inbox.tsx` parsea query params → `filterComplaints()` en `lib/complaint-list.ts`):

| Filtro | Server-side recomendado | Nota |
|---|---|---|
| `q` (busca id/nombre/tx) | Sí | Hoy: client. |
| `status` (multi) | Sí | Agrupa vistas. |
| `priority` (multi) | Sí | — |
| `advisor` (multi, nombre) | Sí | Backend prefiere `advisorId`. |
| `merchant` (multi) | Sí | — |
| `type` (multi) | Sí | — |
| `date` (today/7d/30d/custom) | Sí | Rango explícito. |
| `startDate`/`endDate` | Sí | Solo con `date=custom`. |
| `sort` (recent/oldest/priority-high/priority-low) | Sí | Ver §16. |

Ejemplo de request (propuesta):

```http
GET /complaints?view=mine&status=investigando,status&priority=alta&date=7d&sort=priority-high&page=2&pageSize=20&q=clave
```

> `view` no es un filtro estricto del negocio; es agrupación UI. El frontend lo mapeará a `status`/`advisorId` (para `mine`) antes de llamar al backend (`POR DEFINIR` si backend asume la vista del usuario).

## 16. Paginación y ordenamiento (POR DEFINIR)

- Hoy **no hay paginación** (`mockComplaints` carga todo).
- `sortComplaints()` ordena por `recent|oldest|priority-high|priority-low`.
- `pagination` en la respuesta (§3.1) es propuesta.
- Backend decide esquema (`page/size` vs `cursor`) — `POR DEFINIR`, coordinar con frontend.

## 17. Autenticación, usuario actual y autorización (POR DEFINIR)

- `currentAdvisor` en `lib/store.ts` viene de `data/mock-advisors.ts` → hardcodeado (`mockAdvisors[0]` = María Gómez).
- `user-menu.tsx` muestra usuario hardcodeado.
- Operaciones usan `currentAdvisor.name`/`id` como actor.
- Necesario definir con backend:
  - Mecanismo de auth (`POR DEFINIR`: ¿cookie de sesión, JWT, SSO?).
  - Endpoint/claim "usuario actual/advisor" (`GET /auth/me` o `/advisors/me` — `POR DEFINIR`).
  - Autorización: ¿quién puede aprobar/rechazar/completar? Hoy el frontend no valida roles.
  - El frontend asume un único advisor activo; backend puede requerir selección (`POR DEFINIR`).

## 18. Convenciones transversales (propuestas)

- Formato de IDs: backend define (`Q-YYYY-NNNNN` propuesto). Frontend normaliza `CL-` → `Q-` (`normalizeComplaintId`).
- Fechas: ISO 8601 con zona (`-05:00`). Frontend formatea con `Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota"})`.
- Moneda: COP vía `Intl.NumberFormat("es-CO")`.
- Códigos de error: el store usa `NOT_FOUND|INVALID_TRANSITION|MISSING_DATA|READ_ONLY|DUPLICATE|BUSY` + `message`. Backend puede devolver `code` o usar `message` (`POR DEFINIR`).
- Mutex local (`begin/endComplaintOperation`) evita dobles clicks; no es responsabilidad del backend, pero backend debe ser idempotente ante reintentos (`POR DEFINIR`).
- Latencia simulada (`OP_DELAY=450ms`) → eliminar al integrar.

## 19. Checklist mínimo para reemplazar los mocks

1. [ ] `GET /complaints` listado + paginación + contadores.
2. [ ] `GET /complaints/{id}` detalle (con embebidos según §14).
3. [ ] `GET /advisors`.
4. [ ] `GET /notifications` + `GET /notifications/unread-count`.
5. [ ] `PATCH /complaints/{id}/status`.
6. [ ] `PUT`/`DELETE /complaints/{id}/assignment`.
7. [ ] `POST /complaints/{id}/approve|reject|complete`.
8. [ ] `GET/PUT /complaints/{id}/investigation`.
9. [ ] `GET/POST /complaints/{id}/evidence` (+ download).
10. [ ] `GET/POST /complaints/{id}/notes`.
11. [ ] `GET /complaints/{id}/history`.
12. [ ] `POST /notifications/{id}/read` + `/read-all`.
13. [ ] Definir auth + usuario actual (§17).
14. [ ] Coordinar paginación (§16) y filtros server-side (§15).
15. [ ] Resolver generación de notificaciones/historial (¿backend los crea o frontend los inyecta?).

---

Ver también los archivos fuente: `types/complaint.ts`, `lib/store.ts`, `lib/complaint-list.ts`, `constants/complaint-flow.ts`, `constants/complaint-options.ts`, `constants/complaints.ts`, `data/mock-*.ts`.