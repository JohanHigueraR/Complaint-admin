import type { ComplaintNote } from "@/types/complaint";
import type { NotesService } from "@/services/contracts/notes.service";
import { httpClient } from "@/services/http-client";

/**
 * Implementación real de NotesService contra el backend.
 * Contrato: services/contracts/notes.service.ts.
 *
 *   GET  /complaints/{id}/notes → ComplaintNote[]
 *   POST /complaints/{id}/notes → ComplaintNote
 */
export class ApiNotesService implements NotesService {
  async getNotes(complaintId: string): Promise<ComplaintNote[]> {
    return httpClient.get<ComplaintNote[]>(`/complaints/${complaintId}/notes`);
  }

  async addNote(complaintId: string, note: ComplaintNote): Promise<ComplaintNote> {
    return httpClient.post<ComplaintNote>(`/complaints/${complaintId}/notes`, { content: note.content });
  }
}

/* ------------------------------------------------------------------------------------
 * EJEMPLO de referencia — equivalente en NestJS + Prisma. No se ejecuta en este repo.
 * ------------------------------------------------------------------------------------

// complaints/notes.controller.ts
import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";

@Controller("complaints/:complaintId/notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // GET /complaints/{id}/notes → ComplaintNote[]
  @Get()
  findAll(@Param("complaintId") complaintId: string) {
    return this.notesService.findAll(complaintId);
  }

  // POST /complaints/{id}/notes → ComplaintNote
  // Cuando exista auth (ver README_BACKEND §17), agregar @CurrentUser() y usar su nombre/rol en vez de los valores fijos de abajo.
  @Post()
  create(@Param("complaintId") complaintId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.create(complaintId, dto.content, "María Gómez", "Asesora SAC");
  }
}

// complaints/dto/create-note.dto.ts
import { IsNotEmpty, IsString } from "class-validator";

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

// complaints/notes.service.ts
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const NOTES_EDITABLE = ["recibido", "investigando", "escalado_merchant", "manejando"];

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(complaintId: string) {
    return this.prisma.complaintNote.findMany({ where: { complaintId }, orderBy: { createdAt: "desc" } });
  }

  async create(complaintId: string, content: string, author: string, authorRole: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException("La queja no existe.");
    if (!NOTES_EDITABLE.includes(complaint.status)) throw new ConflictException("No se pueden agregar notas en este estado.");

    return this.prisma.complaintNote.create({ data: { complaintId, content, author, authorRole } });
  }
}

 * ------------------------------------------------------------------------------------ */
