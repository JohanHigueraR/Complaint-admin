"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import styles from "./header.module.scss";

const pageInfo: Record<string, { title: string; crumb?: string }> = { "/quejas": { title: "Quejas" }, "/quejas/mis": { title: "Mis quejas", crumb: "Quejas" }, "/quejas/pendientes": { title: "Pendientes", crumb: "Quejas" }, "/quejas/completadas": { title: "Completadas", crumb: "Quejas" } };

export function Header() {
  const pathname = usePathname();
  const currentPage = pageInfo[pathname] ?? pageInfo["/quejas"];
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button aria-label="Abrir navegación" className={styles.menuBtn} type="button">
          <Menu size={20} />
        </button>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{currentPage.title}</span>
            {currentPage.crumb && (
              <>
                <span className={styles.crumbSep}>/</span>
                <span className={styles.crumb}>{currentPage.crumb}</span>
              </>
            )}
          </div>
          <p className={styles.subtitle}>Gestión de casos SAC</p>
        </div>
      </div>
      <div className={styles.right}>
        <ThemeToggle />
        <NotificationCenter />
        <div className={styles.divider} />
        <UserMenu />
      </div>
    </header>
  );
}
