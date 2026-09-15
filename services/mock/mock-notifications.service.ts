import type { Notification } from "@/types/complaint";
import { mockNotifications } from "@/data/mock-notifications";
import { NotificationsService } from "@/services/contracts/notifications.service";
import { ServiceError } from "@/services/service-error";

/** Mock de notificaciones.
 * Quien lo usa: notification-center, header badge, getUnreadNotificationCount, lib/store.ts.
 * Nota: MockComplaintsService escribe en el mismo arreglo `mockNotifications` (import
 * compartido) al generar notificaciones como efecto secundario de una acción de negocio
 * (p. ej. "Queja aprobada"); este servicio solo lee/actualiza ese mismo storage. Cuando se
 * conecte la API real, ese mismo storage lo maneja el backend y este archivo deja de usarse. */
export class MockNotificationsService implements NotificationsService {
  async getNotifications(_complaintId?: string): Promise<Notification[]> {
    return [...mockNotifications];
  }

  async getUnreadNotificationCount(): Promise<number> {
    return mockNotifications.filter((n) => !n.read).length;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) throw new ServiceError("NOT_FOUND", "La notificación no existe.");
    const updated: Notification = { ...mockNotifications[index], read: true };
    mockNotifications[index] = updated;
    return updated;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    mockNotifications.forEach((n) => {
      n.read = true;
    });
  }
}
