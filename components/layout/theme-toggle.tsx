"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import styles from "./theme-toggle.module.scss";

export function ThemeToggle() {
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return (
    <button aria-label="Cambiar tema claro/oscuro" className={styles.toggle} onClick={toggleTheme} type="button">
      <Sun className={styles.sun} size={18} aria-hidden="true" />
      <Moon className={styles.moon} size={18} aria-hidden="true" />
    </button>
  );
}
