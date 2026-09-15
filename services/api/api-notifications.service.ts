import type { Notification } from "@/types/complaint";
import type { NotificationsService } from "@/services/contracts/notifications.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de NotificationsService contra el backend.
 * Contrato: services/contracts/notifications.service.ts.
 *
 *   GET  /notifications?complaintId=...  → Notification[]
 *   GET  /notifications/unread-count      → number
 *   POST /notifications/{id}/read         → Notification
 *   POST /notifications/read-all          → void
 */
export class ApiNotificationsService implements NotificationsService {
  async getNotifications(complaintId?: string): Promise<Notification[]> {
    const query = complaintId ? `?complaintId=${encodeURIComponent(complaintId)}` : "";
    return httpClient.get<Notification[]>(`/notifications${query}`);
  }

  async getUnreadNotificationCount(): Promise<number> {
    const { count } = await httpClient.get<{ count: number }>("/notifications/unread-count");
    return count;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    return httpClient.post<Notification>(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await httpClient.post<void>("/notifications/read-all");
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — equivalente en NestJS + Prisma. No se ejecuta en este repo.
 * ------------------------------------------------------------------------------------

// notifications/notifications.controller.ts
import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications?complaintId=... → Notification[]
  // Cuando exista login (README_BACKEND §17), filtrar también por el asesor autenticado.
  @Get()
  findAll(@Query("complaintId") complaintId?: string) {
    return this.notificationsService.findAll(complaintId);
  }

  // GET /notifications/unread-count → { count: number }
  @Get("unread-count")
  unreadCount() {
    return this.notificationsService.unreadCount();
  }

  // POST /notifications/{id}/read → Notification
  @Post(":id/read")
  markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // POST /notifications/read-all → 204
  @Post("read-all")
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }
}

// notifications/notifications.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(complaintId?: string) {
    return this.prisma.notification.findMany({
      where: complaintId ? { complaintId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async unreadCount() {
    const count = await this.prisma.notification.count({ where: { read: false } });
    return { count };
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException("La notificación no existe.");
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead() {
    await this.prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  }
}

 * ------------------------------------------------------------------------------------ */
