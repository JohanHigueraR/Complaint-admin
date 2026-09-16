"use client";

import { create } from "zustand";

const STORAGE_KEY = "softgic-sidebar-collapsed";

function applyCollapsed(collapsed: boolean) {
  if (collapsed) document.documentElement.setAttribute("data-sidebar", "collapsed");
  else document.documentElement.removeAttribute("data-sidebar");
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.) — el estado simplemente no persiste.
  }
}

/** Lee el estado real que ya dejó puesto el script inline de app/layout.tsx antes de hidratar. */
function getInitialCollapsed(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

interface SidebarStore {
  collapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: getInitialCollapsed(),
  setSidebarCollapsed: (collapsed) => {
    applyCollapsed(collapsed);
    set({ collapsed });
  },
  toggleSidebar: () => {
    const next = !get().collapsed;
    applyCollapsed(next);
    set({ collapsed: next });
  },
}));
