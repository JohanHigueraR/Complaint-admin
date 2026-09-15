# Mocks de servicio

Implementaciones **temporales, en memoria**, de los contratos en [`../contracts`](../contracts/README.md). Existen para que la UI funcione sin backend (demo/desarrollo) y para servir de referencia de comportamiento — no para copiarse tal cual a `api/`.

> `lib/store.ts` **sí** usa `mock-complaints.service.ts` y `mock-notifications.service.ts` — son la implementación por defecto (`NEXT_PUBLIC_DATA_SOURCE=mock`) detrás de `complaintsService`/`notificationsService` (ver `../service-provider.ts`). El resto (`advisors`, `evidence`, `notes`, `history`) existen y compilan pero ningún componente los llama todavía.

## Qué implementa cada uno

| Archivo | Contrato que implementa | Estado |
|---|---|---|
| `mock-complaints.service.ts` | `ComplaintsService` | ✅ completo — usado por `lib/store.ts` |
| `mock-notifications.service.ts` | `NotificationsService` | ✅ completo — usado por `lib/store.ts` |
| `mock-advisors.service.ts` | `AdvisorsService` | ✅ completo, sin usar aún |
| `mock-evidence.service.ts` | `EvidenceService` | ✅ completo, sin usar aún |
| `mock-notes.service.ts` | `NotesService` | ✅ completo, sin usar aún |
| `mock-history.service.ts` | `HistoryService` | ⏳ no existe |
| `mock-investigation.service.ts` | `InvestigationService` | ⏳ no existe (el contrato tampoco existe, ver `contracts/README.md`) |
| `mock-resolution.service.ts` | `ResolutionService` | ⏳ no existe (el contrato tampoco existe) |

`mock-complaints.service.ts` es el mock más importante: replica, sobre esta capa de servicios, la misma lógica de negocio que antes vivía inline en `lib/store.ts` (transiciones de estado válidas, mensajes de error, generación de eventos de historial y notificaciones). Cuando genera una notificación, la escribe en el mismo arreglo compartido (`data/mock-notifications.ts`) que lee `mock-notifications.service.ts` — así ambos quedan consistentes sin duplicar el storage.

## Patrón que siguen todos

```ts
import type { Evidence } from "@/types/complaint";
import { mockComplaints } from "@/data/mock-complaints";
import { EvidenceService } from "@/services/contracts/evidence.service";

export class MockEvidenceService implements EvidenceService {
  async getEvidenceList(complaintId: string): Promise<Evidence[]> {
    // 1. normalizar el id (acepta prefijo "CL-" o "Q-")
    // 2. buscar en los datos mock (data/mock-*.ts)
    // 3. devolver una copia, nunca la referencia mutable directa cuando sea de lectura
  }
}
```

Cosas de este patrón que **no** deben pasar a `api/*`:

- **Mutación directa del array mock** (`complaint.evidences = [...]`). Es un atajo para que la demo "recuerde" cambios sin una base de datos real; un backend real persiste en BD, no necesita este truco.
- **`throw new Error("NOT_FOUND")`** como único manejo de error (todavía así en `mock-evidence.service.ts`/`mock-notes.service.ts`, no usados por el store). `mock-complaints.service.ts`/`mock-notifications.service.ts` ya lanzan `ServiceError` (ver `../service-error.ts`) — ese es el patrón a seguir, no el anterior.
- Normalización manual de `CL-`/`Q-` repetida en cada método: si se implementa `api/*`, esa normalización debería centralizarse una sola vez (helper compartido), no copiarse en cada archivo.

## Cuándo mirar aquí vs. `contracts/README.md`

- ¿Qué debe *hacer* un método (verbo HTTP, qué retorna)? → `contracts/README.md`.
- ¿Cómo se comporta *hoy* en la demo (para reproducir un caso de prueba, por ejemplo)? → estos archivos.
