"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./navigation-item.module.scss";

interface NavigationItemProps { href: string; icon: LucideIcon; label: string; count: number; exact?: boolean; }

export function NavigationItem({ href, icon: Icon, label, count, exact = false }: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link aria-current={isActive ? "page" : undefined} className={`${styles.item} ${isActive ? styles.itemActive : ""}`} href={href} title={label}>
      <Icon aria-hidden="true" className={`${styles.icon} ${isActive ? styles.iconActive : ""}`} size={18} />
      <span className={styles.label}>{label}</span>
      <span className={`${styles.count} ${isActive ? styles.countActive : ""}`}>{count}</span>
    </Link>
  );
}
