"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactElement } from "react";
import { useToastStore, type ToastItem } from "@/lib/toast";
import styles from "./toaster.module.scss";

const icons: Record<ToastItem["kind"], ReactElement> = {
  success: <CheckCircle2 size={18} className={`${styles.icon} ${styles.iconSuccess}`} />,
  error: <AlertTriangle size={18} className={`${styles.icon} ${styles.iconError}`} />,
  info: <Info size={18} className={`${styles.icon} ${styles.iconInfo}`} />,
};

const cardVariant: Record<ToastItem["kind"], string> = {
  success: styles.cardSuccess,
  error: styles.cardError,
  info: styles.cardInfo,
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className={`${styles.card} ${cardVariant[item.kind]}`} role="status">
      {icons[item.kind]}
      <div className={styles.body}>
        <p className={styles.title}>{item.title}</p>
        {item.description && <p className={styles.description}>{item.description}</p>}
      </div>
      <button aria-label="Cerrar notificación" className={styles.closeBtn} onClick={() => dismiss(item.id)} type="button">
        <X size={14} />
      </button>
    </div>
  );
}

/** Contenedor global de toasts; se monta una sola vez en el layout raíz. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div aria-label="Notificaciones de acción" className={styles.container}>
      {toasts.map((item) => (
        <ToastCard item={item} key={item.id} />
      ))}
    </div>
  );
}
