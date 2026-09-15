import type { Advisor } from "@/types/complaint";

export const mockAdvisors: Advisor[] = [
  { id: "advisor-1", name: "María Gómez", role: "Asesora SAC" },
  { id: "advisor-2", name: "Carlos Rodríguez", role: "Asesor SAC" },
  { id: "advisor-3", name: "Laura Martínez", role: "Asesora SAC" },
  { id: "advisor-4", name: "Andrés Torres", role: "Asesor SAC" },
];

export const currentAdvisor = mockAdvisors[0];

export function getAdvisorByName(name: string | null | undefined) {
  if (!name) return null;
  return mockAdvisors.find((a) => a.name === name) ?? null;
}

export function getAdvisorById(id: string | null | undefined) {
  if (!id) return null;
  return mockAdvisors.find((a) => a.id === id) ?? null;
}
