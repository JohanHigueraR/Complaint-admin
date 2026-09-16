"use client";

import { Bell, Building2, CheckCircle2, AlertCircle, FileText, Paperclip, Square } from "lucide-react";
import Link from "next/link";
import type { Notification } from "@/types/complaint";
import styles from "./notification-item.module.scss";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "assignment":
        return <CheckCircle2 size={16} className={styles.iconAssignment} />;
      case "status_change":
        return <AlertCircle size={16} className={styles.iconStatus} />;
      case "investigation":
        return <FileText size={16} className={styles.iconInvestigation} />;
      case "evidence":
        return <Paperclip size={16} className={styles.iconEvidence} />;
      case "note":
        return <Square size={16} className={styles.iconNote} />;
      case "resolution":
        return <CheckCircle2 size={16} className={styles.iconResolution} />;
      case "merchant":
        return <Building2 size={16} className={styles.iconMerchant} />;
      default:
        return <Bell size={16} className={styles.iconDefault} />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div className={`${styles.item} ${notification.read ? styles.itemRead : styles.itemUnread}`} onClick={handleClick}>
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.body}>
        <p className={`${styles.title} ${!notification.read ? styles.titleUnread : ""}`}>
          {notification.title}
        </p>
        <p className={styles.description}>{notification.description}</p>
        <p className={styles.time}>
          {new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" }).format(new Date(notification.createdAt))}
        </p>
      </div>
      {!notification.read && <div className={styles.dot} />}
    </div>
  );

  if (notification.complaintId) {
    return (
      <Link href={`/quejas/${notification.complaintId}`} className={styles.link}>
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
