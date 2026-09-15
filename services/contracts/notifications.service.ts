import type { Notification } from "@/types/complaint";

/** SERVICE: Notificaciones.
 * Quien lo usa: notification-center, header badge, getUnreadNotificationCount. */
export interface NotificationsService {
  getNotifications(complaintId?: string): Promise<Notification[]>;

  getUnreadNotificationCount(): Promise<number>;

  markNotificationAsRead(id: string): Promise<Notification>;

  markAllNotificationsAsRead(): Promise<void>;
}
