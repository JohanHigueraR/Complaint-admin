/**
 * Punto único donde se decide, según `DATA_SOURCE` (services/config.ts), qué implementación
 * de cada contrato usa la app: la mock (en memoria) o la real contra el backend.
 *
 * `lib/store.ts` importa las instancias de aquí — nunca importa `mock/*` ni `api/*`
 * directamente. Ese es el único cambio necesario para pasar de mock a api: la variable de
 * entorno `NEXT_PUBLIC_DATA_SOURCE`, nada en el store ni en los componentes.
 */
import { DATA_SOURCE } from "./config";
import type { ComplaintsService } from "./contracts/complaints.service";
import type { NotificationsService } from "./contracts/notifications.service";
import type { AdvisorsService } from "./contracts/advisors.service";
import { MockComplaintsService } from "./mock/mock-complaints.service";
import { MockNotificationsService } from "./mock/mock-notifications.service";
import { MockAdvisorsService } from "./mock/mock-advisors.service";
import { ApiComplaintsService } from "./api/api-complaints.service";
import { ApiNotificationsService } from "./api/api-notifications.service";
import { ApiAdvisorsService } from "./api/api-advisors.service";

export const complaintsService: ComplaintsService = DATA_SOURCE === "api" ? new ApiComplaintsService() : new MockComplaintsService();

export const notificationsService: NotificationsService = DATA_SOURCE === "api" ? new ApiNotificationsService() : new MockNotificationsService();

/**
 * No consumido por lib/store.ts todavía — advisor-assignment.tsx sigue importando
 * `mockAdvisors` directamente (ver README_BACKEND.md). Se deja listo aquí para cuando se
 * conecte, siguiendo el mismo patrón que los dos de arriba.
 */
export const advisorsService: AdvisorsService = DATA_SOURCE === "api" ? new ApiAdvisorsService() : new MockAdvisorsService();
