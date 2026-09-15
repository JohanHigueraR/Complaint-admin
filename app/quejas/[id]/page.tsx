import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { ComplaintDetail } from "@/components/complaints/complaint-detail";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getMockComplaintById } from "@/data/mock-complaints";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complaint = getMockComplaintById(id);
  if (complaint) return <ComplaintDetail complaint={complaint} />;
  return <AppShell><PageContainer><div className="mx-auto mt-20 max-w-md rounded-xl border border-slate-800 bg-slate-900 p-7 text-center"><CircleAlert className="mx-auto text-amber-300" size={24} /><h1 className="mt-4 text-xl font-semibold text-slate-100">Queja no encontrada</h1><p className="mt-2 text-sm leading-6 text-slate-400">No pudimos encontrar la queja solicitada.</p><Link className="mt-6 inline-flex rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400" href="/quejas">Volver a quejas</Link></div></PageContainer></AppShell>;
}
