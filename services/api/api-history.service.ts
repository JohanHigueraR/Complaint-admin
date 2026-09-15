import type { ComplaintHistoryEvent } from "@/types/complaint";
import type { HistoryService } from "@/services/contracts/history.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de HistoryService contra el backend.
 * Contrato: services/contracts/history.service.ts.
 * POR DEFINIR (ver contrato): si el backend genera los eventos automáticamente al persistir
 * cada acción de negocio, `addEvent` puede no ser necesario desde el frontend.
 *
 *   GET  /complaints/{id}/history → ComplaintHistoryEvent[]
 *   POST /complaints/{id}/history → ComplaintHistoryEvent (propuesta)
 */
export class ApiHistoryService implements HistoryService {
  async getHistory(complaintId: string): Promise<ComplaintHistoryEvent[]> {
    return httpClient.get<ComplaintHistoryEvent[]>(`/complaints/${complaintId}/history`);
  }

  async addEvent(complaintId: string, event: ComplaintHistoryEvent): Promise<ComplaintHistoryEvent> {
    return httpClient.post<ComplaintHistoryEvent>(`/complaints/${complaintId}/history`, event);
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — equivalente en NestJS + Prisma. No se ejecuta en este repo.
 *
 * Recomendación (ver README_BACKEND §10 y la nota del contrato): que el propio backend
 * inserte el evento de historial dentro de la MISMA transacción que ejecuta la acción de
 * negocio (aprobar, escalar al merchant, etc.), en vez de exponer un endpoint genérico de
 * "agregar evento" que el frontend pueda llamar con cualquier dato. Este ejemplo muestra
 * ambas cosas: el endpoint de lectura (necesario) y cómo un servicio de negocio (p. ej.
 * al aprobar una queja) genera su propio evento internamente.
 * ------------------------------------------------------------------------------------

// complaints/history.controller.ts
import { Controller, Get, Param } from "@nestjs/common";
import { HistoryService } from "./history.service";

@Controller("complaints/:complaintId/history")
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // GET /complaints/{id}/history → ComplaintHistoryEvent[]
  @Get()
  findAll(@Param("complaintId") complaintId: string) {
    return this.historyService.findAll(complaintId);
  }
}

// complaints/history.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(complaintId: string) {
    return this.prisma.complaintHistoryEvent.findMany({ where: { complaintId }, orderBy: { createdAt: "desc" } });
  }

  // Reutilizable desde cualquier servicio de negocio (aprobar, escalar, etc.), idealmente
  // dentro de la misma transacción de Prisma que actualiza la queja.
  async record(tx: Prisma.TransactionClient, complaintId: string, event: { type: string; title: string; description?: string; actor: string; metadata?: object }) {
    return tx.complaintHistoryEvent.create({ data: { complaintId, ...event } });
  }
}

 * ------------------------------------------------------------------------------------ */
