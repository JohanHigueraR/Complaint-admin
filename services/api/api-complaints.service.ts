import type { Advisor, Complaint, ComplaintHistoryEvent, ComplaintNote, ComplaintStatus, Evidence, Investigation, Notification } from "@/types/complaint";
import type { ComplaintsService } from "@/services/contracts/complaints.service";
import { httpClient } from "@/services/http-client";
import { ServiceError } from "@/services/service-error";

/**
 * Implementación real de ComplaintsService contra el backend.
 * Contrato: services/contracts/complaints.service.ts.
 * Tabla completa de endpoints: services/contracts/README.md.
 */
export class ApiComplaintsService implements ComplaintsService {
  async getComplaints(): Promise<Complaint[]> {
    return httpClient.get<Complaint[]>("/complaints");
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      return await httpClient.get<Complaint>(`/complaints/${id}`);
    } catch (err) {
      if (err instanceof ServiceError && err.code === "NOT_FOUND") return null;
      throw err;
    }
  }

  async updateComplaint(id: string, partial: Partial<Complaint>): Promise<Complaint> {
    return httpClient.patch<Complaint>(`/complaints/${id}`, partial);
  }

  async updateStatus(id: string, to: ComplaintStatus): Promise<Complaint> {
    return httpClient.patch<Complaint>(`/complaints/${id}/status`, { to });
  }

  async assign(id: string, advisor: Advisor): Promise<Complaint> {
    return httpClient.put<Complaint>(`/complaints/${id}/assignment`, { advisorId: advisor.id });
  }

  async unassign(id: string): Promise<Complaint> {
    return httpClient.delete<Complaint>(`/complaints/${id}/assignment`);
  }

  async reassign(id: string, advisor: Advisor): Promise<Complaint> {
    return httpClient.put<Complaint>(`/complaints/${id}/assignment`, { advisorId: advisor.id });
  }

  async updateInvestigation(id: string, investigation: NonNullable<Investigation>): Promise<Complaint> {
    return httpClient.put<Complaint>(`/complaints/${id}/investigation`, investigation);
  }

  async escalateToMerchant(id: string, note: string): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/merchant-escalations`, { note });
  }

  async closeMerchantEscalation(id: string, response: string): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/merchant-escalations/close`, { response });
  }

  async addEvidence(id: string, evidence: Evidence): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/evidence`, evidence);
  }

  async addInternalNote(id: string, note: ComplaintNote): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/notes`, { content: note.content });
  }

  async approve(id: string): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/approve`);
  }

  async reject(id: string, reason: string): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/reject`, { reason });
  }

  async complete(id: string): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/complete`);
  }

  async addHistoryEvent(id: string, event: ComplaintHistoryEvent): Promise<Complaint> {
    return httpClient.post<Complaint>(`/complaints/${id}/history`, event);
  }

  async getNotifications(): Promise<Notification[]> {
    return httpClient.get<Notification[]>("/notifications");
  }

  async markNotificationAsRead(id: string): Promise<Notification[]> {
    await httpClient.post<Notification>(`/notifications/${id}/read`);
    return this.getNotifications();
  }

  async markAllNotificationsAsRead(): Promise<Notification[]> {
    await httpClient.post<void>("/notifications/read-all");
    return this.getNotifications();
  }

  async getUnreadNotificationCount(): Promise<number> {
    const { count } = await httpClient.get<{ count: number }>("/notifications/unread-count");
    return count;
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — cómo se vería este mismo recurso del lado del backend en
 * NestJS + Prisma (schema completo en README_DATABASE.md). No se ejecuta en este repo.
 *
 * Por espacio, el controller muestra TODAS las rutas, pero el service solo desarrolla dos
 * casos completos: `findOne` (lectura con relaciones + serialización al contrato del
 * frontend) y `escalateToMerchant` (una mutación con validación de estado + transacción).
 * El resto de mutaciones (approve/reject/complete/assign/etc.) siguen exactamente el mismo
 * patrón que `escalateToMerchant`: 1) buscar la queja, 2) validar el estado de origen,
 * 3) actualizar en una transacción (queja + evento de historial + notificación),
 * 4) devolver la queja serializada con `toComplaintDto`.
 * ------------------------------------------------------------------------------------

// complaints/complaints.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { ComplaintsService } from "./complaints.service";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { AssignmentDto } from "./dto/assignment.dto";
import { UpdateInvestigationDto } from "./dto/update-investigation.dto";
import { EscalateToMerchantDto, CloseMerchantEscalationDto } from "./dto/merchant-escalation.dto";
import { RejectDto } from "./dto/reject.dto";

@Controller("complaints")
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  findAll() {
    return this.complaintsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.complaintsService.updateStatus(id, dto.to);
  }

  @Put(":id/assignment")
  assign(@Param("id") id: string, @Body() dto: AssignmentDto) {
    return this.complaintsService.assign(id, dto.advisorId);
  }

  @Delete(":id/assignment")
  unassign(@Param("id") id: string) {
    return this.complaintsService.unassign(id);
  }

  @Put(":id/investigation")
  updateInvestigation(@Param("id") id: string, @Body() dto: UpdateInvestigationDto) {
    return this.complaintsService.updateInvestigation(id, dto);
  }

  @Post(":id/merchant-escalations")
  escalateToMerchant(@Param("id") id: string, @Body() dto: EscalateToMerchantDto) {
    return this.complaintsService.escalateToMerchant(id, dto.note);
  }

  @Post(":id/merchant-escalations/close")
  closeMerchantEscalation(@Param("id") id: string, @Body() dto: CloseMerchantEscalationDto) {
    return this.complaintsService.closeMerchantEscalation(id, dto.response);
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.complaintsService.approve(id);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() dto: RejectDto) {
    return this.complaintsService.reject(id, dto.reason);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.complaintsService.complete(id);
  }
}

// complaints/dto/merchant-escalation.dto.ts
import { IsNotEmpty, IsString } from "class-validator";

export class EscalateToMerchantDto {
  @IsString()
  @IsNotEmpty()
  note: string;
}

export class CloseMerchantEscalationDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}

// complaints/complaints.service.ts
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { toComplaintDto } from "./complaints.mapper"; // ver ejemplo en README_DATABASE.md §8

const COMPLAINT_INCLUDE = {
  customer: true,
  merchant: true,
  assignedAdvisor: true,
  transaction: true,
  investigation: { include: { investigator: true } },
  merchantEscalations: { orderBy: { escalatedAt: "desc" as const }, take: 1, include: { escalatedBy: true, closedBy: true } },
  evidences: true,
  notes: true,
  history: { orderBy: { createdAt: "desc" as const } },
  resolution: { include: { decidedBy: true } },
};

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.complaint.findMany({ include: COMPLAINT_INCLUDE, orderBy: { createdAt: "desc" } });
    return rows.map(toComplaintDto);
  }

  async findOne(id: string) {
    const row = await this.prisma.complaint.findUnique({ where: { id }, include: COMPLAINT_INCLUDE });
    if (!row) throw new NotFoundException("La queja no existe.");
    return toComplaintDto(row);
  }

  // Caso completo de ejemplo: escalar al merchant. El resto de mutaciones (approve, reject,
  // complete, assign, updateInvestigation...) siguen esta misma forma.
  async escalateToMerchant(id: string, note: string, advisorId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException("La queja no existe.");

    // Regla de negocio: solo se puede escalar desde "investigando" (ver constants/complaint-flow.ts del frontend).
    if (complaint.status !== "investigando") {
      throw new ConflictException("Solo puedes enviar el caso al merchant mientras está en Investigando.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const escalation = await tx.merchantEscalation.create({
        data: { complaintId: id, escalatedById: advisorId, note },
      });

      await tx.complaintHistoryEvent.create({
        data: {
          complaintId: id,
          type: "merchant_escalated",
          title: "Caso enviado al merchant",
          description: note,
          actor: escalation.escalatedById, // resolver a nombre al serializar, no aquí
        },
      });

      await tx.notification.create({
        data: {
          type: "merchant",
          title: "Caso enviado al merchant",
          description: `La queja ${complaint.complaintType} fue enviada al merchant.`,
          complaintId: id,
        },
      });

      return tx.complaint.update({
        where: { id },
        data: { status: "escalado_merchant" },
        include: COMPLAINT_INCLUDE,
      });
    });

    return toComplaintDto(updated);
  }
}

 * ------------------------------------------------------------------------------------ */
