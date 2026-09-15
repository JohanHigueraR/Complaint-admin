"use client";

import { useRef, useEffect, useState } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import { useComplaintStore } from "@/lib/store";
import { NotificationItem } from "./notification-item";

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
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={hasUnread ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <Bell size={19} aria-hidden="true" />
        {hasUnread && (
          <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[11px] font-semibold tabular-nums text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 flex max-h-[26rem] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Notificaciones</h2>
              <p className="text-xs text-slate-500">{hasUnread ? `${unreadCount} sin leer` : "Todo al día"}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {hasUnread && (
                <button
                  onClick={() => markAllNotificationsAsRead()}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-blue-300 transition-colors hover:bg-slate-800 hover:text-blue-200"
                  title="Marcar todas como leídas"
                >
                  Marcar leídas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                aria-label="Cerrar"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-slate-400">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-slate-800 bg-slate-800/60 text-slate-500">
                  <Bell size={20} aria-hidden="true" className="opacity-70" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-300">No tienes notificaciones</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Las acciones sobre tus casos aparecerán aquí.</p>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-slate-400">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-slate-800 bg-slate-800/60 text-emerald-300">
                  <CheckCircle2 size={20} aria-hidden="true" className="opacity-80" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-300">No tienes notificaciones nuevas</p>
                <p className="mt-1 text-xs text-slate-500">Las anteriores siguen disponibles abajo.</p>
              </div>
            ) : null}

            {unreadNotifications.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nuevas</p>
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
              <div className={unreadNotifications.length > 0 ? "border-t border-slate-800" : undefined}>
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Anteriores</p>
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