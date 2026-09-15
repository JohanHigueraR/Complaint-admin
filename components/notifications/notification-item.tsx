"use client";

import { Bell, Building2, CheckCircle2, AlertCircle, FileText, Paperclip, Square } from "lucide-react";
import Link from "next/link";
import type { Notification } from "@/types/complaint";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "assignment":
        return <CheckCircle2 size={16} className="text-blue-400" />;
      case "status_change":
        return <AlertCircle size={16} className="text-amber-400" />;
      case "investigation":
        return <FileText size={16} className="text-slate-400" />;
      case "evidence":
        return <Paperclip size={16} className="text-green-400" />;
      case "note":
        return <Square size={16} className="text-violet-400" />;
      case "resolution":
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case "merchant":
        return <Building2 size={16} className="text-orange-400" />;
      default:
        return <Bell size={16} className="text-slate-400" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={`flex gap-3 px-4 py-3 transition-colors ${
        notification.read ? "bg-slate-900" : "bg-slate-800/50 hover:bg-slate-800/80"
      }`}
      onClick={handleClick}
    >
      <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${notification.read ? "text-slate-400" : "text-slate-100"}`}>
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mt-1">{notification.description}</p>
        <p className="text-xs text-slate-600 mt-2">
          {new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(notification.createdAt))}
        </p>
      </div>
      {!notification.read && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-2" />}
    </div>
  );

  if (notification.complaintId) {
    return (
      <Link href={`/quejas/${notification.complaintId}`} className="block hover:bg-slate-800/30 transition-colors">
        {content}
      </Link>
    );
  }

  return <div className="block cursor-pointer">{content}</div>;
}
