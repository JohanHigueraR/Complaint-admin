import type { Evidence } from "@/types/complaint";
import type { EvidenceService } from "@/services/contracts/evidence.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de EvidenceService contra el backend.
 * Contrato: services/contracts/evidence.service.ts.
 * Ver tabla completa en services/contracts/README.md.
 *
 *   GET  /complaints/{id}/evidence          → Evidence[]
 *   POST /complaints/{id}/evidence          → Evidence
 *
 * NOTA: `addEvidence` recibe aquí el objeto `Evidence` ya armado, igual que el mock. Si el
 * backend termina pidiendo `multipart/form-data` (archivo real, no solo metadata), este
 * método es el único lugar que cambia — construir un FormData en vez de enviar JSON.
 */
export class ApiEvidenceService implements EvidenceService {
  async getEvidenceList(complaintId: string): Promise<Evidence[]> {
    return httpClient.get<Evidence[]>(`/complaints/${complaintId}/evidence`);
  }

  async addEvidence(complaintId: string, evidence: Evidence): Promise<Evidence> {
    return httpClient.post<Evidence>(`/complaints/${complaintId}/evidence`, evidence);
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — equivalente en NestJS + Prisma. No se ejecuta en este repo.
 * ------------------------------------------------------------------------------------

// complaints/evidence.controller.ts
import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { EvidenceService } from "./evidence.service";

@Controller("complaints/:complaintId/evidence")
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  // GET /complaints/{id}/evidence → Evidence[]
  @Get()
  findAll(@Param("complaintId") complaintId: string) {
    return this.evidenceService.findAll(complaintId);
  }

  // POST /complaints/{id}/evidence (multipart/form-data) → Evidence
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  create(@Param("complaintId") complaintId: string, @UploadedFile() file: Express.Multer.File, @Body("description") description?: string) {
    return this.evidenceService.create(complaintId, file, description);
  }
}

// complaints/evidence.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service"; // wrapper sobre S3/GCS/etc.

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll(complaintId: string) {
    return this.prisma.evidence.findMany({ where: { complaintId }, orderBy: { uploadedAt: "desc" } });
  }

  async create(complaintId: string, file: Express.Multer.File, description?: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException("La queja no existe.");
    // Solo en investigando/manejando/escalado_merchant (ver EVIDENCE_EDITABLE en lib/store.ts del frontend)
    if (!["investigando", "manejando", "escalado_merchant"].includes(complaint.status)) {
      throw new ConflictException("No se puede agregar evidencia en este estado.");
    }

    const storageKey = await this.storage.upload(file);

    return this.prisma.evidence.create({
      data: {
        complaintId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        storageKey,
        uploadedBy: "obtener del usuario autenticado", // ver README_BACKEND §17
        description,
      },
    });
  }
}

 * ------------------------------------------------------------------------------------ */
