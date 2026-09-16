"use client";

import { CheckCircle2, ClipboardList, Clock3, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";

import { NavigationItem } from "@/components/layout/navigation-item";
import { getComplaintSummary } from "@/lib/complaint-list";
import { useComplaintStore } from "@/lib/store";
import { useSidebarStore } from "@/lib/sidebar-store";
import styles from "./sidebar.module.scss";

export function Sidebar() {
  const complaints = useComplaintStore((s) => s.complaints);
  const currentAdvisor = useComplaintStore((s) => s.currentAdvisor);
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);
  // Contadores derivados del estado global (no hardcodeados).
  const summary = getComplaintSummary(complaints, currentAdvisor.id);

  const primaryItems = [{ href: "/quejas", label: "Quejas", icon: ClipboardList, count: summary.total, exact: true }, { href: "/quejas/mis", label: "Mis quejas", icon: UserRound, count: summary.mine }];
  const trackingItems = [{ href: "/quejas/pendientes", label: "Pendientes", icon: Clock3, count: summary.pending }, { href: "/quejas/completadas", label: "Completadas", icon: CheckCircle2, count: summary.completed }];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>S</div>
        <div className={styles.brandText}>
          <p className={styles.brandName}>SAC Central</p>
          <p className={styles.brandSub}>Gestión de quejas</p>
        </div>
      </div>
      <div className={styles.collapseRow}>
        <button aria-label="Colapsar o expandir la barra lateral" className={styles.collapseBtn} onClick={toggleSidebar} type="button">
          <PanelLeftClose className={styles.collapseIconExpanded} size={16} aria-hidden="true" />
          <PanelLeftOpen className={styles.collapseIconCollapsed} size={16} aria-hidden="true" />
          <span className={styles.collapseLabel}>Colapsar</span>
        </button>
      </div>
      <nav aria-label="Navegación principal" className={styles.nav}>
        <div className={styles.group}>
          {primaryItems.map((item) => <NavigationItem key={item.href} {...item} />)}
        </div>
        <div className={styles.groupSpaced}>
          <p className={styles.groupLabel}>Seguimiento</p>
          <div className={styles.group}>
            {trackingItems.map((item) => <NavigationItem key={item.href} {...item} />)}
          </div>
        </div>
      </nav>
      <div className={styles.footer}>
        <p className={styles.footerText}>Datos locales de demostración.</p>
      </div>
    </aside>
  );
}
