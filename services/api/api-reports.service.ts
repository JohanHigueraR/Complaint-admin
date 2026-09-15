import type { ReportsService } from "@/services/contracts/reports.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de ReportsService contra el backend.
 * No usado en la UI todavía — preparado para cuando el dashboard consuma agregados en vez
 * de calcularlos en el cliente. Ver services/contracts/README.md.
 *
 *   GET /reports/complaints-by-status   → { status, count }[]
 *   GET /reports/complaints-by-priority → { priority, count }[]
 *   GET /reports/complaints-by-type     → { type, count }[]
 */
export class ApiReportsService implements ReportsService {
  async getComplaintsByStatus(): Promise<Array<{ status: string; count: number }>> {
    return httpClient.get("/reports/complaints-by-status");
  }

  async getComplaintsByPriority(): Promise<Array<{ priority: string; count: number }>> {
    return httpClient.get("/reports/complaints-by-priority");
  }

  async getComplaintsByType(): Promise<Array<{ type: string; count: number }>> {
    return httpClient.get("/reports/complaints-by-type");
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — equivalente en NestJS + Prisma, usando groupBy. No se ejecuta
 * en este repo.
 * ------------------------------------------------------------------------------------

// reports/reports.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("complaints-by-status")
  byStatus() {
    return this.reportsService.byStatus();
  }

  @Get("complaints-by-priority")
  byPriority() {
    return this.reportsService.byPriority();
  }

  @Get("complaints-by-type")
  byType() {
    return this.reportsService.byType();
  }
}

// reports/reports.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async byStatus() {
    const rows = await this.prisma.complaint.groupBy({ by: ["status"], _count: { _all: true } });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }

  async byPriority() {
    const rows = await this.prisma.complaint.groupBy({ by: ["priority"], _count: { _all: true } });
    return rows.map((r) => ({ priority: r.priority, count: r._count._all }));
  }

  async byType() {
    const rows = await this.prisma.complaint.groupBy({ by: ["complaintType"], _count: { _all: true } });
    return rows.map((r) => ({ type: r.complaintType, count: r._count._all }));
  }
}

 * ------------------------------------------------------------------------------------ */
