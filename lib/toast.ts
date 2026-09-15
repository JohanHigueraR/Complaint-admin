"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

const TOAST_TIMEOUT = 3500;
let toastUid = 0;

/** Store ligero para notificaciones efímeras (toasts) de toda la aplicación. */
export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (toast) => {
    toastUid += 1;
    const id = toastUid;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-4) }));
    window.setTimeout(() => get().dismiss(id), TOAST_TIMEOUT);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** API imperativa para usar desde cualquier lugar (handlers, stores, etc.). */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "error", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ kind: "info", title, description }),
};