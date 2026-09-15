# README Base de Datos — Guía para Backend (NestJS + Prisma)

> **Audiencia:** equipo de backend.
> **Objetivo:** responder *"¿qué tablas necesito crear, con qué formato, para que este frontend funcione con un backend real?"*
> **Cómo usar este documento:** es la base de datos que soporta el contrato descrito en [`README_BACKEND.md`](./README_BACKEND.md) (endpoints, reglas de negocio, mapeo mock→API). Léanlo junto a ese documento; aquí solo se detalla el modelo de datos y el setup en Nest + Prisma.
> **Este repo es solo frontend.** No hay backend ni Prisma instalado aquí — todo lo de este documento (`schema.prisma`, servicios Nest) va en el repo del backend. El código de ejemplo es para copiar allá.

---

## Índice

1. [Resumen del dominio](#1-resumen-del-dominio)
2. [Diagrama de entidades](#2-diagrama-de-entidades)
3. [Catálogo de tablas](#3-catálogo-de-tablas)
4. [Enums: cuáles son reales y cuáles son texto validado](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado)
5. [Decisiones de diseño (dónde este modelo mejora al mock)](#5-decisiones-de-diseño-dónde-este-modelo-mejora-al-mock)
6. [`schema.prisma` completo](#6-schemaprisma-completo)
7. [Paso a paso: levantar Prisma en el proyecto Nest](#7-paso-a-paso-levantar-prisma-en-el-proyecto-nest)
8. [Cómo serializar hacia el contrato del frontend](#8-cómo-serializar-hacia-el-contrato-del-frontend)
9. [Seed inicial](#9-seed-inicial)
10. [Checklist final](#10-checklist-final)

---

## 1. Resumen del dominio

Una **queja (`Complaint`)** la presenta un **cliente (`Customer`)** sobre una **transacción (`Transaction`)** con un **merchant (`Merchant`)**. Un **asesor (`Advisor`)** la investiga (`Investigation`), puede escalarla al merchant una o más veces (`MerchantEscalation`), adjuntar **evidencias** (`Evidence`) y **notas internas** (`ComplaintNote`), y finalmente tomar una **decisión** (`Resolution`). Cada paso queda en un **historial** (`ComplaintHistoryEvent`) y puede generar una **notificación** (`Notification`).

Todo gira alrededor de `Complaint`: es la tabla "padre" de casi todo lo demás.

## 2. Diagrama de entidades

```mermaid
erDiagram
  ADVISOR ||--o{ COMPLAINT : "asignado a"
  CUSTOMER ||--o{ COMPLAINT : "presenta"
  MERCHANT ||--o{ COMPLAINT : "recibe"
  COMPLAINT ||--o| TRANSACTION : "1-1"
  COMPLAINT ||--o| INVESTIGATION : "1-1"
  COMPLAINT ||--o| RESOLUTION : "1-1"
  COMPLAINT ||--o{ MERCHANT_ESCALATION : "1-N (histórico)"
  COMPLAINT ||--o{ EVIDENCE : "1-N"
  COMPLAINT ||--o{ COMPLAINT_NOTE : "1-N"
  COMPLAINT ||--o{ COMPLAINT_HISTORY_EVENT : "1-N"
  COMPLAINT ||--o{ NOTIFICATION : "1-N"
  ADVISOR ||--o{ MERCHANT_ESCALATION : "envía / cierra"
```

## 3. Catálogo de tablas

Para cada tabla: para qué sirve, columnas y con qué campo del frontend (`types/complaint.ts`) se corresponde.

### `advisors`

Asesores del equipo SAC. Hoy el frontend usa un asesor fijo (`currentAdvisor`); cuando exista login real, `email`/auth vive aquí (ver README_BACKEND §17, "por definir").

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `name` | String | |
| `role` | String | ej. "Asesora SAC" |
| `email` | String? único | para cuando se defina autenticación |

### `customers`

Un cliente puede presentar varias quejas a lo largo del tiempo; por eso es tabla propia y no un campo embebido en `Complaint`.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `name` | String | |
| `document` | String | cédula/documento |
| `phone` | String | |
| `email` | String | |

### `merchants`

Igual razón que `customers`: un merchant recibe muchas quejas. **El frontend tiene dos campos redundantes** (`complaint.merchant` string y `complaint.merchantInfo` objeto) que representan lo mismo — no los guarden duplicados, generen ambos al serializar (ver [sección 8](#8-cómo-serializar-hacia-el-contrato-del-frontend)).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `name` | String | |
| `type` | String | `"Comercio"` \| `"Servicio digital"` (ver [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado)) |
| `code` | String único | ej. `"MER-00123"` |

### `complaints` — la tabla central

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | **Formato de negocio**, ej. `"Q-2026-00147"`. Ver nota abajo. |
| `createdAt` / `updatedAt` | DateTime | |
| `complaintType` | String | uno de los 6 valores fijos de `constants/complaint-options.ts` (ver [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado)) |
| `description` | String (texto largo) | |
| `status` | Enum `ComplaintStatus` | ver [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado) |
| `priority` | Enum `ComplaintPriority` | `baja` \| `media` \| `alta` |
| `customerId` | FK → `customers` | |
| `merchantId` | FK → `merchants` | |
| `assignedAdvisorId` | FK → `advisors`, nullable | `null` = sin asignar |

**Sobre el `id`:** el frontend usa este campo directamente como identificador visible (`#CL-2026-00147` en pantalla, normaliza `CL-`→`Q-` al buscar). Generen el id en la capa de aplicación antes de insertar (ej. `Q-${año}-${consecutivo con padding}`), no usen un UUID interno con un `code` separado — les ahorra una capa de traducción en cada endpoint.

Estados y transiciones válidas (debe replicarse en el backend, ver `constants/complaint-flow.ts`):

```text
recibido            → investigando
investigando        → manejando | escalado_merchant
escalado_merchant   → investigando   (solo con una respuesta del merchant registrada)
manejando           → aprobado | rechazado
aprobado            → completado
rechazado           → completado
completado          → (sin salidas)
```

### `transactions` — 1-1 con `complaints`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | interno |
| `code` | String único | el que ve el usuario, ej. `"TX-841026"` |
| `complaintId` | FK único → `complaints` | |
| `amount` | Decimal(14,2) | |
| `currency` | String, default `"COP"` | fijo por ahora |
| `date` | DateTime | |
| `paymentMethod` | String | `"PSE"` \| `"Tarjeta débito"` \| `"Tarjeta crédito"` |
| `transactionStatus` | String | hoy solo `"Exitosa"`; se deja como texto para que backend pueda agregar valores sin romper al frontend (ver README_BACKEND §13) |

### `investigations` — 1-1 con `complaints`

| Columna | Tipo | Notas |
|---|---|---|
| `complaintId` | FK (PK) → `complaints` | |
| `startedAt` | DateTime? | |
| `investigatorId` | FK → `advisors`, nullable | al serializar, devolver `investigator: investigator.name` (el frontend solo espera el nombre) |
| `findings` | String (texto), default `""` | |
| `transactionVerified` / `customerDataVerified` / `merchantDataVerified` / `paymentVerified` | Boolean, default `false` | checklist de verificación |
| `conclusion` | String (texto), default `""` | |

Editable solo mientras `status` es `investigando`, `manejando` o `escalado_merchant` (ver `INVESTIGATION_EDITABLE` en `lib/store.ts`).

### `merchant_escalations` — 1-N con `complaints` (feature "enviar al merchant")

Cada fila es **un ciclo** de envío-respuesta con el merchant. **Importante:** el mock del frontend solo guarda el ciclo más reciente en `complaint.merchantEscalation` (un objeto, se sobreescribe si se vuelve a escalar). El backend debe guardar **todos** los ciclos aquí para no perder historial; al serializar `GET /complaints/{id}`, expongan solo el más reciente (`ORDER BY escalated_at DESC LIMIT 1`) en el campo `merchantEscalation`, y opcionalmente todo el listado en un endpoint aparte si backend lo necesita.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `complaintId` | FK → `complaints` | |
| `escalatedAt` | DateTime | |
| `escalatedById` | FK → `advisors` | al serializar: `escalatedBy: advisor.name` |
| `note` | String (texto) | qué se le pidió al merchant, obligatorio |
| `respondedAt` | DateTime? | `null` mientras está en espera |
| `response` | String (texto)? | qué contestó el merchant |
| `closedById` | FK → `advisors`, nullable | quién registró la respuesta |

Solo se crea una fila nueva cuando el caso está en `investigando` (acción "Enviar al merchant"); se completa (`respondedAt`/`response`/`closedById`) cuando el caso está en `escalado_merchant` y el asesor cierra el seguimiento, lo que devuelve `status` a `investigando`.

### `evidences` — 1-N con `complaints`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `complaintId` | FK → `complaints` | |
| `name` | String | nombre de archivo |
| `type` | String | mime type |
| `size` | Int | bytes |
| `storageKey` | String? | referencia al archivo real (S3/GCS/etc.) — **no existe en el mock actual**, el frontend simula el upload; backend sí necesita guardar dónde quedó el archivo real |
| `uploadedAt` | DateTime | |
| `uploadedBy` | String | nombre snapshot (ver nota en [§5](#5-decisiones-de-diseño-dónde-este-modelo-mejora-al-mock)) |
| `description` | String (texto)? | |

Agregable en `investigando`, `manejando` y `escalado_merchant`.

### `complaint_notes` — 1-N con `complaints`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `complaintId` | FK → `complaints` | |
| `content` | String (texto) | |
| `author` | String | nombre snapshot |
| `authorRole` | String? | rol snapshot al momento de escribir la nota |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime? | hoy no hay edición en la UI, se deja el campo previsto |

Privadas, nunca se muestran al cliente. Agregable en `recibido`, `investigando`, `manejando`, `escalado_merchant`.

### `complaint_history_events` — 1-N con `complaints`, es el timeline

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `complaintId` | FK → `complaints` | |
| `type` | Enum `HistoryEventType` | ver [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado) |
| `title` | String | |
| `description` | String (texto)? | |
| `createdAt` | DateTime | |
| `actor` | String | nombre snapshot de quién hizo la acción |
| `metadata` | Json? | libre, ej. `{ "from": "investigando", "to": "manejando" }` |

Se inserta una fila por cada acción de negocio (cambio de estado, asignación, escalar/cerrar merchant, evidencia, nota, resolución). Es de solo-agregar, nunca se edita ni se borra.

### `resolutions` — 1-1 con `complaints`, opcional

| Columna | Tipo | Notas |
|---|---|---|
| `complaintId` | FK (PK) → `complaints` | |
| `decision` | Enum `ResolutionDecision` | `aprobado` \| `rechazado` |
| `decidedAt` | DateTime | |
| `decidedById` | FK → `advisors` | al serializar: `decidedBy: advisor.name` |
| `rejectionReason` | String (texto)? | obligatorio solo si `decision = rechazado` (validar en la capa de aplicación, no en la BD) |
| `completedAt` | DateTime? | se llena cuando el caso pasa a `completado` |

Solo existe si el caso llegó a `aprobado`/`rechazado`/`completado`.

### `notifications` — 1-N con `complaints` (nullable)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | String (PK) | |
| `type` | Enum `NotificationType` | ver [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado) |
| `title` | String | |
| `description` | String (texto) | |
| `complaintId` | FK → `complaints`, nullable | |
| `createdAt` | DateTime | |
| `read` | Boolean, default `false` | |

> **Pendiente de decisión (no está resuelto en el frontend):** hoy todas las notificaciones son una lista global, no hay un `recipientAdvisorId`. Cuando se implemente login multi-asesor, agreguen esa columna para filtrar "mis notificaciones" — no es necesaria para igualar el comportamiento actual del mock. Ver README_BACKEND §17.

## 4. Enums: cuáles son reales y cuáles son texto validado

Varios campos del frontend son literales de texto en español, algunos con tildes o espacios (`"Tarjeta débito"`, `"Cobro duplicado"`). Un enum de Prisma usa su **nombre de miembro** (no el valor mapeado) como valor real en el cliente TypeScript, así que un enum con `@map` para guardar el string con tildes **no evita** tener que traducir en el código — solo mueve el problema. Para no confundir al equipo, usamos dos estrategias distintas y consistentes:

**A) Enum real de Prisma** — cuando el valor que espera el frontend ya es un identificador válido (sin tildes/espacios), así el enum y el contrato son *el mismo string*, cero mapeos:

| Campo | Enum | Valores |
|---|---|---|
| `complaints.status` | `ComplaintStatus` | `recibido`, `investigando`, `escalado_merchant`, `manejando`, `aprobado`, `rechazado`, `completado` |
| `complaints.priority` | `ComplaintPriority` | `baja`, `media`, `alta` |
| `resolutions.decision` | `ResolutionDecision` | `aprobado`, `rechazado` |
| `complaint_history_events.type` | `HistoryEventType` | `received`, `assignment`, `investigation_started`, `investigation_updated`, `merchant_escalated`, `merchant_response_received`, `evidence_added`, `internal_note_added`, `status_change`, `approved`, `rejected`, `completed` |
| `notifications.type` | `NotificationType` | `assignment`, `status_change`, `investigation`, `merchant`, `evidence`, `note`, `resolution` |

**B) `String` con validación en el DTO** — cuando el valor real tiene tildes o espacios. Se guarda tal cual en la base de datos (legible) y se valida con `class-validator` en el endpoint de entrada:

| Campo | Valores permitidos |
|---|---|
| `complaints.complaintType` | `"Transacción no reconocida"`, `"Cobro duplicado"`, `"Cobro no autorizado"`, `"Producto no entregado"`, `"Servicio no conforme"`, `"Reverso pendiente"` (`constants/complaint-options.ts`) |
| `merchants.type` | `"Comercio"`, `"Servicio digital"` |
| `transactions.paymentMethod` | `"PSE"`, `"Tarjeta débito"`, `"Tarjeta crédito"` |
| `transactions.transactionStatus` | hoy solo `"Exitosa"` (dejar abierto a futuros valores) |

Ejemplo de validación (Nest + `class-validator`):

```ts
import { IsIn } from "class-validator";

const COMPLAINT_TYPES = [
  "Transacción no reconocida", "Cobro duplicado", "Cobro no autorizado",
  "Producto no entregado", "Servicio no conforme", "Reverso pendiente",
] as const;

export class CreateComplaintDto {
  @IsIn(COMPLAINT_TYPES)
  complaintType: string;
  // ...resto de campos
}
```

## 5. Decisiones de diseño (dónde este modelo mejora al mock)

El frontend es 100% mock hoy, así que simplifica algunas cosas que un backend real no debería copiar tal cual. Resumen de las diferencias intencionales:

- **`merchant` vs `merchantInfo`**: el frontend los trata como dos campos independientes, pero son el mismo merchant. Este modelo tiene una sola tabla `merchants`; el backend genera ambos campos al serializar.
- **Seguimiento con el merchant**: el frontend solo recuerda el último ciclo (`complaint.merchantEscalation` es un objeto que se sobreescribe). El backend debe guardar el historial completo en `merchant_escalations` (1-N) y exponer solo el más reciente en el campo del contrato — así no se pierde información si un caso se escala más de una vez.
- **"Quién hizo qué" en `advisors`**: se usa FK a `advisors` en los campos que reflejan *estado actual* (`assignedAdvisorId`, `investigatorId`, `escalatedById`, `closedById`, `decidedById`) para tener integridad referencial. En cambio, `actor` (historial), `author` (notas) y `uploadedBy` (evidencias) se guardan como **texto plano** (nombre en el momento del evento): son registros de auditoría, y si un asesor cambia de nombre o se desactiva, el historial no debe cambiar retroactivamente.
- **Evidencias**: el mock no sube archivos reales. `storageKey` es nuevo (no existe en `types/complaint.ts`) porque un backend real sí necesita saber dónde está el archivo.
- **Notificaciones por usuario**: no implementado en el mock (lista global). Ver nota en la tabla `notifications`.

## 6. `schema.prisma` completo

Copien esto en `prisma/schema.prisma` del proyecto backend y ajusten `datasource` si no usan PostgreSQL.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums (ver README_DATABASE.md §4 para el porqué) ----------

enum ComplaintStatus {
  recibido
  investigando
  escalado_merchant
  manejando
  aprobado
  rechazado
  completado

  @@map("complaint_status")
}

enum ComplaintPriority {
  baja
  media
  alta

  @@map("complaint_priority")
}

enum ResolutionDecision {
  aprobado
  rechazado

  @@map("resolution_decision")
}

enum HistoryEventType {
  received
  assignment
  investigation_started
  investigation_updated
  merchant_escalated
  merchant_response_received
  evidence_added
  internal_note_added
  status_change
  approved
  rejected
  completed

  @@map("history_event_type")
}

enum NotificationType {
  assignment
  status_change
  investigation
  merchant
  evidence
  note
  resolution

  @@map("notification_type")
}

// ---------- Tablas ----------

model Advisor {
  id        String   @id @default(cuid())
  name      String
  role      String
  email     String?  @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  assignedComplaints    Complaint[]          @relation("AssignedAdvisor")
  investigations        Investigation[]      @relation("Investigator")
  escalationsSent       MerchantEscalation[] @relation("EscalatedBy")
  escalationsClosed     MerchantEscalation[] @relation("ClosedBy")
  resolutionsDecided    Resolution[]         @relation("DecidedBy")

  @@map("advisors")
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  document  String
  phone     String
  email     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  complaints Complaint[]

  @@map("customers")
}

model Merchant {
  id        String   @id @default(cuid())
  name      String
  type      String   // "Comercio" | "Servicio digital" — validar en el DTO, ver §4
  code      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  complaints Complaint[]

  @@map("merchants")
}

model Complaint {
  id            String            @id // formato de negocio, ej. "Q-2026-00147" (ver §3)
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  complaintType String            @map("complaint_type") // validar en el DTO, ver §4
  description   String
  status        ComplaintStatus   @default(recibido)
  priority      ComplaintPriority

  customerId        String   @map("customer_id")
  customer          Customer @relation(fields: [customerId], references: [id])

  merchantId        String   @map("merchant_id")
  merchant          Merchant @relation(fields: [merchantId], references: [id])

  assignedAdvisorId String?  @map("assigned_advisor_id")
  assignedAdvisor   Advisor? @relation("AssignedAdvisor", fields: [assignedAdvisorId], references: [id])

  transaction         Transaction?
  investigation       Investigation?
  resolution          Resolution?
  merchantEscalations MerchantEscalation[]
  evidences           Evidence[]
  notes               ComplaintNote[]
  history             ComplaintHistoryEvent[]
  notifications       Notification[]

  @@index([status])
  @@index([priority])
  @@index([assignedAdvisorId])
  @@index([merchantId])
  @@index([createdAt])
  @@map("complaints")
}

model Transaction {
  id                String   @id @default(cuid())
  code              String   @unique // ej. "TX-841026"
  amount            Decimal  @db.Decimal(14, 2)
  currency          String   @default("COP")
  date              DateTime
  paymentMethod     String   @map("payment_method")      // validar en el DTO, ver §4
  transactionStatus String   @map("transaction_status")  // validar en el DTO, ver §4

  complaintId String    @unique @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

model Investigation {
  complaintId String    @id @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  startedAt   DateTime? @map("started_at")

  investigatorId String?  @map("investigator_id")
  investigator   Advisor? @relation("Investigator", fields: [investigatorId], references: [id])

  findings             String  @default("") @db.Text
  transactionVerified  Boolean @default(false) @map("transaction_verified")
  customerDataVerified Boolean @default(false) @map("customer_data_verified")
  merchantDataVerified Boolean @default(false) @map("merchant_data_verified")
  paymentVerified      Boolean @default(false) @map("payment_verified")
  conclusion           String  @default("") @db.Text

  @@map("investigations")
}

model MerchantEscalation {
  id          String    @id @default(cuid())
  complaintId String    @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  escalatedAt   DateTime @default(now()) @map("escalated_at")
  escalatedById String   @map("escalated_by_id")
  escalatedBy   Advisor  @relation("EscalatedBy", fields: [escalatedById], references: [id])
  note          String   @db.Text

  respondedAt DateTime? @map("responded_at")
  response    String?   @db.Text
  closedById  String?   @map("closed_by_id")
  closedBy    Advisor?  @relation("ClosedBy", fields: [closedById], references: [id])

  @@index([complaintId, escalatedAt])
  @@map("merchant_escalations")
}

model Evidence {
  id          String    @id @default(cuid())
  complaintId String    @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  name        String
  type        String // mime type, ej. "application/pdf"
  size        Int    // bytes
  storageKey  String? @map("storage_key")
  uploadedAt  DateTime @default(now()) @map("uploaded_at")
  uploadedBy  String   @map("uploaded_by") // snapshot, ver §5
  description String?  @db.Text

  @@index([complaintId])
  @@map("evidences")
}

model ComplaintNote {
  id          String    @id @default(cuid())
  complaintId String    @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  content    String    @db.Text
  author     String    // snapshot, ver §5
  authorRole String?   @map("author_role")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime? @map("updated_at")

  @@index([complaintId])
  @@map("complaint_notes")
}

model ComplaintHistoryEvent {
  id          String           @id @default(cuid())
  complaintId String           @map("complaint_id")
  complaint   Complaint        @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  type        HistoryEventType
  title       String
  description String?          @db.Text
  createdAt   DateTime         @default(now()) @map("created_at")
  actor       String           // snapshot, ver §5
  metadata    Json?

  @@index([complaintId, createdAt])
  @@map("complaint_history_events")
}

model Resolution {
  complaintId String    @id @map("complaint_id")
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  decision  ResolutionDecision
  decidedAt DateTime           @map("decided_at")

  decidedById String  @map("decided_by_id")
  decidedBy   Advisor @relation("DecidedBy", fields: [decidedById], references: [id])

  rejectionReason String?   @db.Text @map("rejection_reason")
  completedAt     DateTime? @map("completed_at")

  @@map("resolutions")
}

model Notification {
  id          String           @id @default(cuid())
  type        NotificationType
  title       String
  description String           @db.Text
  createdAt   DateTime         @default(now()) @map("created_at")
  read        Boolean          @default(false)

  complaintId String?    @map("complaint_id")
  complaint   Complaint? @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@index([complaintId])
  @@index([read])
  @@map("notifications")
}
```

## 7. Paso a paso: levantar Prisma en el proyecto Nest

1. **Instalar dependencias** (en el repo del backend):
   ```bash
   npm install prisma --save-dev
   npm install @prisma/client
   ```
2. **Inicializar Prisma**:
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
   Esto crea `prisma/schema.prisma` y un `.env` con `DATABASE_URL`.
3. **Pegar el schema completo** de la [sección 6](#6-schemaprisma-completo) en `prisma/schema.prisma`.
4. **Configurar `.env`** con la cadena de conexión real, ej.:
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/quejas_claro?schema=public"
   ```
5. **Crear la primera migración** (crea las tablas en la BD y genera el cliente):
   ```bash
   npx prisma migrate dev --name init
   ```
6. **Crear el módulo de Prisma en Nest**:
   ```ts
   // src/prisma/prisma.service.ts
   import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
   import { PrismaClient } from "@prisma/client";

   @Injectable()
   export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
     async onModuleInit() {
       await this.$connect();
     }
     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```
   ```ts
   // src/prisma/prisma.module.ts
   import { Global, Module } from "@nestjs/common";
   import { PrismaService } from "./prisma.service";

   @Global()
   @Module({
     providers: [PrismaService],
     exports: [PrismaService],
   })
   export class PrismaModule {}
   ```
   Importen `PrismaModule` una vez en `AppModule` (con `@Global()` queda disponible en todos los demás módulos sin volver a importarlo).
7. **(Opcional) Explorar los datos**: `npx prisma studio` abre una UI para ver/editar filas.
8. **Cada vez que cambien el schema**: editen `prisma/schema.prisma` y corran `npx prisma migrate dev --name <descripcion>` de nuevo.

A partir de aquí, cada módulo de recurso (`ComplaintsModule`, `AdvisorsModule`, etc.) inyecta `PrismaService` como cualquier otro provider de Nest.

## 8. Cómo serializar hacia el contrato del frontend

El único trabajo extra real (aparte de los enums de texto validado, [§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado)) es **aplanar las relaciones de `Advisor` a solo el nombre** en los campos que el frontend espera como `string`, y **generar `merchant`/`merchantInfo` desde la misma fila**. Ejemplo de mapeo para `GET /complaints/{id}`:

```ts
function toComplaintDTO(row: ComplaintWithRelations) {
  const escalation = row.merchantEscalations[0]; // la más reciente, ya ordenada desc

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    customer: row.customer,
    complaintType: row.complaintType,
    merchant: row.merchant.name,
    merchantInfo: { name: row.merchant.name, type: row.merchant.type, code: row.merchant.code },
    transaction: row.transaction && {
      id: row.transaction.code,
      amount: Number(row.transaction.amount),
      currency: row.transaction.currency,
      date: row.transaction.date.toISOString(),
      paymentMethod: row.transaction.paymentMethod,
      transactionStatus: row.transaction.transactionStatus,
    },
    status: row.status,
    priority: row.priority,
    assignedAdvisor: row.assignedAdvisor,
    description: row.description,
    investigation: row.investigation && {
      ...row.investigation,
      investigator: row.investigation.investigator?.name ?? null,
    },
    merchantEscalation: escalation && {
      escalatedAt: escalation.escalatedAt.toISOString(),
      escalatedBy: escalation.escalatedBy.name,
      note: escalation.note,
      respondedAt: escalation.respondedAt?.toISOString() ?? null,
      response: escalation.response,
      closedBy: escalation.closedBy?.name ?? null,
    },
    evidences: row.evidences,
    notes: row.notes,
    history: row.history,
    resolution: row.resolution && {
      ...row.resolution,
      decidedBy: row.resolution.decidedBy.name,
      decidedAt: row.resolution.decidedAt.toISOString(),
      completedAt: row.resolution.completedAt?.toISOString() ?? null,
    },
  };
}
```

Con Prisma, para tener `row` con todas las relaciones cargadas, el `findUnique` necesita el `include` correspondiente (`customer`, `merchant`, `assignedAdvisor`, `transaction`, `investigation.investigator`, `merchantEscalations` ordenado por `escalatedAt desc` con `take: 1` si solo necesitan la última, `resolution.decidedBy`, `evidences`, `notes`, `history`).

## 9. Seed inicial

Un seed mínimo para probar que el schema funciona (no busca replicar los 24 casos de `data/mock-complaints.ts`, solo dejar una fila de cada tabla):

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const advisor = await prisma.advisor.create({
    data: { name: "María Gómez", role: "Asesora SAC" },
  });

  const customer = await prisma.customer.create({
    data: { name: "Samuel Ortiz", document: "***9483", phone: "*** *** 1234", email: "sa***@correo.com" },
  });

  const merchant = await prisma.merchant.create({
    data: { name: "Farmacia Salud", type: "Comercio", code: "MER-00123" },
  });

  await prisma.complaint.create({
    data: {
      id: "Q-2026-00147",
      complaintType: "Cobro duplicado",
      description: "El cliente reporta cobro duplicado.",
      status: "investigando",
      priority: "media",
      customerId: customer.id,
      merchantId: merchant.id,
      assignedAdvisorId: advisor.id,
      transaction: {
        create: {
          code: "TX-841026",
          amount: 78400,
          date: new Date(),
          paymentMethod: "PSE",
          transactionStatus: "Exitosa",
        },
      },
      history: {
        create: [{ type: "received", title: "Queja recibida", actor: "Sistema" }],
      },
    },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Agregar a `package.json` del backend:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Y correr:

```bash
npx prisma db seed
```

## 10. Checklist final

- [ ] `schema.prisma` de la [sección 6](#6-schemaprisma-completo) copiado y migrado (`prisma migrate dev`)
- [ ] `PrismaModule`/`PrismaService` registrados en Nest
- [ ] DTOs de entrada con `@IsIn(...)` para los 4 campos de texto validado ([§4](#4-enums-cuáles-son-reales-y-cuáles-son-texto-validado))
- [ ] Serialización de salida aplanando `Advisor` → nombre y `merchant` → `merchant`+`merchantInfo` ([§8](#8-cómo-serializar-hacia-el-contrato-del-frontend))
- [ ] `merchant_escalations` guarda todos los ciclos; el endpoint de detalle solo expone el más reciente
- [ ] Seed corrido y verificado con `npx prisma studio`
- [ ] Revisar `README_BACKEND.md` para los endpoints que consumen cada tabla

Cualquier duda sobre *qué* debe devolver cada endpoint (no *cómo* se guarda) está en [`README_BACKEND.md`](./README_BACKEND.md).
