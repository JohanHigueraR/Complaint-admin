import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { ComplaintDetail } from "@/components/complaints/complaint-detail";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { getMockComplaintById } from "@/data/mock-complaints";
import styles from "./not-found-state.module.scss";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const complaint = getMockComplaintById(id);
  if (complaint) return <ComplaintDetail complaint={complaint} />;
  return (
    <AppShell>
      <PageContainer>
        <div className={styles.card}>
          <CircleAlert className={styles.icon} size={24} />
          <h1 className={styles.title}>Queja no encontrada</h1>
          <p className={styles.description}>No pudimos encontrar la queja solicitada.</p>
          <Link className={styles.backLink} href="/quejas">Volver a quejas</Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
