import type { Advisor } from "@/types/complaint";
import type { AdvisorsService } from "@/services/contracts/advisors.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de AdvisorsService contra el backend.
 * Contrato: services/contracts/advisors.service.ts — GET /advisors → Advisor[]
 * Ver tabla completa en services/contracts/README.md.
 */
export class ApiAdvisorsService implements AdvisorsService {
  async getAdvisors(): Promise<Advisor[]> {
    return httpClient.get<Advisor[]>("/advisors");
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — cómo se vería este mismo endpoint del lado del backend en
 * NestJS + Prisma (ver README_DATABASE.md para el schema completo). Esto NO se ejecuta
 * en este repo (es solo frontend); es una guía para el equipo de backend.
 * ------------------------------------------------------------------------------------

// advisors/advisors.controller.ts
import { Controller, Get, Query } from "@nestjs/common";
import { AdvisorsService } from "./advisors.service";

@Controller("advisors")
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  // GET /advisors?q=maria  → Advisor[]
  @Get()
  findAll(@Query("q") q?: string) {
    return this.advisorsService.findAll(q);
  }
}

// advisors/advisors.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdvisorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(q?: string) {
    const advisors = await this.prisma.advisor.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
    });

    // El frontend solo espera { id, name, role } — devolver justo eso, sin campos internos.
    return advisors.map((a) => ({ id: a.id, name: a.name, role: a.role }));
  }
}

// advisors/advisors.module.ts
import { Module } from "@nestjs/common";
import { AdvisorsController } from "./advisors.controller";
import { AdvisorsService } from "./advisors.service";

@Module({
  controllers: [AdvisorsController],
  providers: [AdvisorsService],
})
export class AdvisorsModule {}

 * ------------------------------------------------------------------------------------ */
