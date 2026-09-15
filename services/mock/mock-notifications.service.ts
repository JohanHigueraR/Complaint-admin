import type { Notification } from "@/types/complaint";
import { mockNotifications } from "@/data/mock-notifications";
import { NotificationsService } from "@/services/contracts/notifications.service";

/** Mock de notificaciones.
 * Quien lo usa: notification-center, header badge, getUnreadNotificationCount.
 * Nota architectural: los mismos eventos de negocio que actualizan quejas tambien producen
 * notificaciones en el store local. Cuando se conecte API, es probable que la fuente unica de
 * notificaciones sea el backend, y que el frontend Mantenga solamente un cache.
 *
 * POR DEFINIR como se sincroniza la notificacion generada por una accion de negocio (p. ej. "Queja aprobada")
 * con el servicio de notificaciones. En el estado actual, la notificacion se crea localmente dentro del store. */
export class MockNotificationsService implements NotificationsService {
  async getNotifications(_complaintId?: string): Promise<Notification[]> {
    return [...mockNotifications];
  }

  async getUnreadNotificationCount(): Promise<number> {
    return mockNotifications.filter((n) => !n.read).length;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) throw new Error("NOT_FOUND");
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
