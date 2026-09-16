"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";
import styles from "./user-menu.module.scss";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.wrap}>
      <button aria-expanded={isOpen} aria-haspopup="menu" className={styles.trigger} onClick={() => setIsOpen((open) => !open)} type="button">
        <span className={styles.avatar}>MG</span>
        <span className={styles.info}>
          <span className={styles.name}>María Gómez</span>
          <span className={styles.role}>Asesora SAC</span>
        </span>
        <ChevronDown aria-hidden="true" className={styles.chevron} size={16} />
      </button>
      {isOpen && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <p className={styles.menuName}>María Gómez</p>
            <p className={styles.menuRole}>Asesora SAC</p>
          </div>
          <button className={styles.menuItem} role="menuitem" type="button">
            <UserRound size={16} />
            Perfil (próximamente)
          </button>
        </div>
      )}
    </div>
  );
}
