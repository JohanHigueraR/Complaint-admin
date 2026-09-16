"use client";

import { useRef, useEffect, useState } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import { useComplaintStore } from "@/lib/store";
import { NotificationItem } from "./notification-item";
import styles from "./notification-center.module.scss";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useComplaintStore((s) => s.notifications);
  const unreadCount = useComplaintStore((s) => s.getUnreadNotificationCount());
  const { markNotificationAsRead, markAllNotificationsAsRead } = useComplaintStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);
  const hasUnread = unreadCount > 0;

  return (
    <div className={styles.wrap} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={hasUnread ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
        className={styles.bell}
      >
        <Bell size={19} aria-hidden="true" />
        {hasUnread && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Notificaciones</h2>
              <p className={styles.panelSubtitle}>{hasUnread ? `${unreadCount} sin leer` : "Todo al día"}</p>
            </div>
            <div className={styles.panelActions}>
              {hasUnread && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className={styles.markAllBtn}
                  title="Marcar todas como leídas"
                >
                  Marcar leídas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeBtn}
                aria-label="Cerrar"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  <Bell size={20} aria-hidden="true" />
                </span>
                <p className={styles.emptyTitle}>No tienes notificaciones</p>
                <p className={styles.emptyDescription}>Las acciones sobre tus casos aparecerán aquí.</p>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={`${styles.emptyIcon} ${styles.emptyIconOk}`}>
                  <CheckCircle2 size={20} aria-hidden="true" />
                </span>
                <p className={styles.emptyTitle}>No tienes notificaciones nuevas</p>
                <p className={styles.emptyDescription}>Las anteriores siguen disponibles abajo.</p>
              </div>
            ) : null}

            {unreadNotifications.length > 0 && (
              <div>
                <p className={styles.sectionLabel}>Nuevas</p>
                {unreadNotifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={markNotificationAsRead}
                  />
                ))}
              </div>
            )}

            {readNotifications.length > 0 && (
              <div className={unreadNotifications.length > 0 ? styles.sectionDivider : undefined}>
                <p className={styles.sectionLabel}>Anteriores</p>
                {readNotifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={markNotificationAsRead}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
