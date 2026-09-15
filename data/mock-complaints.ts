import { Complaint, ComplaintHistoryEvent, ComplaintNote } from "@/types/complaint";
import { getAdvisorByName } from "./mock-advisors";

type ComplaintFixture = [string, string, string, string, string, string, string, string, number, Complaint["status"], Complaint["priority"], string | null];

/** Datos ficticios locales para la demo; reemplazables por la integración futura. */
const fixtures: ComplaintFixture[] = [
  ["Q-2026-00148", "2026-09-14T09:42:00-05:00", "Elena Vargas", "CLI-024", "***1258", "Transacción no reconocida", "Mercado Central", "TX-841048", 186500, "recibido", "alta", null],
  ["Q-2026-00147", "2026-09-14T08:15:00-05:00", "Samuel Ortiz", "CLI-023", "***9483", "Cobro duplicado", "Farmacia Salud", "TX-841026", 78400, "investigando", "media", "María Gómez"],
  ["Q-2026-00146", "2026-09-13T16:20:00-05:00", "Luciana Méndez", "CLI-022", "***7362", "Producto no entregado", "Tienda Norte", "TX-840994", 245900, "manejando", "alta", "Laura Martínez"],
  ["Q-2026-00145", "2026-09-13T11:04:00-05:00", "Bruno Castillo", "CLI-021", "***6104", "Servicio no conforme", "Movilidad Urbana", "TX-840967", 32900, "aprobado", "baja", "María Gómez"],
  ["Q-2026-00144", "2026-09-12T17:50:00-05:00", "Andrea Pardo", "CLI-020", "***2947", "Cobro no autorizado", "Estación Energía", "TX-840921", 115000, "rechazado", "media", "Carlos Rodríguez"],
  ["Q-2026-00143", "2026-09-12T14:08:00-05:00", "Tomás Cifuentes", "CLI-019", "***8325", "Reverso pendiente", "Viajes Horizonte", "TX-840889", 568000, "completado", "alta", "Andrés Torres"],
  ["Q-2026-00142", "2026-09-12T09:30:00-05:00", "Paula Miranda", "CLI-018", "***4039", "Transacción no reconocida", "Café Distrito", "TX-840833", 42800, "recibido", "baja", "María Gómez"],
  ["Q-2026-00141", "2026-09-11T18:22:00-05:00", "Ricardo Salas", "CLI-017", "***5518", "Producto no entregado", "Hogar & Más", "TX-840794", 913000, "escalado_merchant", "alta", "Laura Martínez"],
  ["Q-2026-00140", "2026-09-11T15:41:00-05:00", "Natalia Rueda", "CLI-016", "***6820", "Cobro duplicado", "Supermercado Andino", "TX-840761", 126300, "manejando", "media", "María Gómez"],
  ["Q-2026-00139", "2026-09-11T10:12:00-05:00", "Julián Montoya", "CLI-015", "***2971", "Reverso pendiente", "Cine Plaza", "TX-840702", 38500, "aprobado", "baja", "Andrés Torres"],
  ["Q-2026-00138", "2026-09-10T16:45:00-05:00", "Camila Ospina", "CLI-014", "***8206", "Servicio no conforme", "Conexión Digital", "TX-840655", 89900, "rechazado", "media", "Carlos Rodríguez"],
  ["Q-2026-00137", "2026-09-10T12:18:00-05:00", "Felipe Lozano", "CLI-013", "***1109", "Transacción no reconocida", "Restaurante Palma", "TX-840601", 154000, "completado", "alta", "María Gómez"],
  ["Q-2026-00136", "2026-09-09T19:05:00-05:00", "Sara Quintero", "CLI-012", "***4784", "Cobro no autorizado", "Estación Energía", "TX-840548", 97000, "recibido", "alta", null],
  ["Q-2026-00135", "2026-09-09T13:50:00-05:00", "Daniel Pineda", "CLI-011", "***3662", "Producto no entregado", "Tienda Norte", "TX-840513", 302000, "investigando", "media", "María Gómez"],
  ["Q-2026-00134", "2026-09-08T17:24:00-05:00", "Mónica Velasco", "CLI-010", "***9420", "Cobro duplicado", "Farmacia Salud", "TX-840472", 64800, "manejando", "baja", "Laura Martínez"],
  ["Q-2026-00133", "2026-09-08T11:33:00-05:00", "Iván Castaño", "CLI-009", "***7125", "Servicio no conforme", "Movilidad Urbana", "TX-840426", 41900, "aprobado", "media", "Carlos Rodríguez"],
  ["Q-2026-00132", "2026-09-07T16:02:00-05:00", "Valeria Mora", "CLI-008", "***6851", "Reverso pendiente", "Viajes Horizonte", "TX-840398", 724000, "rechazado", "alta", "Andrés Torres"],
  ["Q-2026-00131", "2026-09-07T09:48:00-05:00", "Sergio Arango", "CLI-007", "***2406", "Transacción no reconocida", "Mercado Central", "TX-840341", 76000, "completado", "baja", "María Gómez"],
  ["Q-2026-00130", "2026-09-06T15:12:00-05:00", "Diana Restrepo", "CLI-006", "***9310", "Producto no entregado", "Hogar & Más", "TX-840276", 458000, "recibido", "media", null],
  ["Q-2026-00129", "2026-09-06T10:26:00-05:00", "Héctor Molina", "CLI-005", "***5283", "Cobro no autorizado", "Café Distrito", "TX-840229", 26300, "investigando", "baja", "Laura Martínez"],
  ["Q-2026-00128", "2026-09-05T18:10:00-05:00", "Gloria Peña", "CLI-004", "***8174", "Cobro duplicado", "Supermercado Andino", "TX-840180", 193400, "manejando", "alta", "María Gómez"],
  ["Q-2026-00127", "2026-09-05T12:42:00-05:00", "Martín Duarte", "CLI-003", "***3751", "Servicio no conforme", "Conexión Digital", "TX-840133", 112000, "aprobado", "media", "Andrés Torres"],
  ["Q-2026-00126", "2026-09-04T14:55:00-05:00", "Laura Cárdenas", "CLI-002", "***6048", "Reverso pendiente", "Cine Plaza", "TX-840094", 42900, "rechazado", "baja", "Carlos Rodríguez"],
  ["Q-2026-00125", "2026-09-03T09:17:00-05:00", "Pedro Rincón", "CLI-001", "***1586", "Transacción no reconocida", "Restaurante Palma", "TX-840021", 221000, "completado", "alta", "Laura Martínez"],
];

const descriptions: Record<string, string> = {
  "Transacción no reconocida": "El cliente indica que identifica una transacción que no reconoce en su cuenta y solicita validar el origen del cobro.",
  "Cobro duplicado": "El cliente reporta que el valor de una misma compra fue debitado dos veces y solicita la validación correspondiente.",
  "Cobro no autorizado": "El cliente manifiesta no haber autorizado el cobro relacionado y requiere una revisión del movimiento.",
  "Producto no entregado": "El cliente informa que el pedido asociado a la transacción no fue recibido en la dirección registrada.",
  "Servicio no conforme": "El cliente considera que el servicio recibido no corresponde a las condiciones ofrecidas por el comercio.",
  "Reverso pendiente": "El cliente solicita seguimiento porque el reverso informado por el comercio aún no se refleja en su saldo.",
};

/** Ids con datos parciales a propósito, para probar la UI con información incompleta. */
const PARTIAL_CUSTOMER_IDS = new Set(["Q-2026-00136", "Q-2026-00125"]);
const PARTIAL_MERCHANT_IDS = new Set(["Q-2026-00136"]);

export const mockComplaints: Complaint[] = fixtures.map(([id, createdAt, name, customerId, document, complaintType, merchant, transactionId, amount, status, priority, assignedAdvisor], index) => {
  const updatedAt = index % 3 === 0 ? createdAt : new Date(new Date(createdAt).getTime() + 42 * 60_000).toISOString();

  const assignedAdvisorObj = getAdvisorByName(assignedAdvisor as string | null);

  // Create varied investigation scenarios depending on status/index to allow UI testing
  let investigation = null as Complaint["investigation"] | null;
  const investigator = assignedAdvisorObj?.name ?? (index % 2 === 0 ? "María Gómez" : "Laura Martínez");

  if (status === "investigando" || status === "manejando" || status === "escalado_merchant") {
    // partially or fully started
    investigation = {
      startedAt: new Date(new Date(createdAt).getTime() + 10 * 60_000).toISOString(),
      investigator,
      findings: index % 2 === 0 ? "Revisión inicial: transacción registrada correctamente; discrepancia en referencia." : "Se verificó con el merchant y se solicita información adicional.",
      transactionVerified: index % 2 === 0,
      customerDataVerified: true,
      merchantDataVerified: index % 3 === 0,
      paymentVerified: index % 2 !== 0,
      conclusion: index % 2 === 0 ? "Indicios de cobro duplicado, pendiente reverso." : "Investigación en curso; se espera respuesta del merchant.",
    };
  } else if (status === "aprobado" || status === "rechazado" || status === "completado") {
    // historical investigation records for finalized cases
    investigation = {
      startedAt: new Date(new Date(createdAt).getTime() + 5 * 60_000).toISOString(),
      investigator,
      findings: "Investigación finalizada. Evidencia recopilada y decisión tomada.",
      transactionVerified: true,
      customerDataVerified: true,
      merchantDataVerified: true,
      paymentVerified: true,
      conclusion: status === "aprobado" ? "Caso aprobado tras verificación." : status === "rechazado" ? "Caso rechazado por falta de evidencia." : "Caso completado.",
    };
  } else {
    // recibido or others: no investigation yet
    investigation = null;
  }

  // Create varied evidence scenarios
  let evidences: Complaint["evidences"] | null = null;
  const baseUploadedAt = new Date(new Date(createdAt).getTime() + 15 * 60_000).toISOString();
  if (index % 6 === 0) {
    evidences = [
      { id: `E-${index}-A`, name: "comprobante_pago.pdf", type: "application/pdf", size: 245_600, uploadedAt: baseUploadedAt, uploadedBy: investigator, description: "Comprobante enviado por cliente." },
      { id: `E-${index}-B`, name: "screenshot.png", type: "image/png", size: 184_300, uploadedAt: new Date(new Date(baseUploadedAt).getTime() + 2 * 60_000).toISOString(), uploadedBy: investigator, description: "Captura de pantalla proporcionada por cliente." },
      { id: `E-${index}-C`, name: "soporte_merchant.pdf", type: "application/pdf", size: 98_400, uploadedAt: new Date(new Date(baseUploadedAt).getTime() + 10 * 60_000).toISOString(), uploadedBy: "Merchant Team", description: "Documento recibido del merchant." },
    ];
  } else if (index % 6 === 1) {
    evidences = [
      { id: `E-${index}-A`, name: "comprobante_unico.pdf", type: "application/pdf", size: 124_000, uploadedAt: baseUploadedAt, uploadedBy: investigator, description: "Comprobante de pago." },
    ];
  } else if (status === "aprobado" || status === "rechazado") {
    evidences = [
      { id: `E-${index}-A`, name: "evidencia_final.pdf", type: "application/pdf", size: 64_000, uploadedAt: baseUploadedAt, uploadedBy: investigator, description: "Evidencia adjunta en la resolución." },
    ];
  } else {
    evidences = null;
  }

  return {
    id,
    createdAt,
    updatedAt,
    customer: {
      id: customerId,
      name,
      document: PARTIAL_CUSTOMER_IDS.has(id) ? "" : document,
      phone: PARTIAL_CUSTOMER_IDS.has(id) ? "" : `*** *** ${String(1200 + index * 37).slice(-4)}`,
      email: PARTIAL_CUSTOMER_IDS.has(id) ? "" : `${name.split(" ")[0].slice(0, 2).toLocaleLowerCase("es")}***@correo.com`,
    },
    complaintType,
    merchant,
    merchantInfo: { name: merchant, type: merchant === "Conexión Digital" ? "Servicio digital" : "Comercio", code: PARTIAL_MERCHANT_IDS.has(id) ? "" : `MER-${String(100 + index).padStart(5, "0")}` },
    transaction: { id: transactionId, amount, currency: "COP", date: createdAt, paymentMethod: (["PSE", "Tarjeta débito", "Tarjeta crédito"] as const)[index % 3], transactionStatus: "Exitosa" },
    status,
    priority,
    assignedAdvisor: assignedAdvisorObj,
    description: descriptions[complaintType],
    investigation,
    merchantEscalation:
      status === "escalado_merchant"
        ? { escalatedAt: new Date(new Date(createdAt).getTime() + 60 * 60_000).toISOString(), escalatedBy: assignedAdvisorObj?.name ?? investigator, note: "Se solicita al merchant confirmar la entrega y enviar soporte de despacho.", respondedAt: null, response: null, closedBy: null }
        : null,
    evidences,
    resolution: (() => {
      if (status === "aprobado") return { decision: "aprobado", decidedAt: new Date(new Date(createdAt).getTime() + 80 * 60_000).toISOString(), decidedBy: assignedAdvisorObj?.name ?? investigator };
      if (status === "rechazado") return { decision: "rechazado", decidedAt: new Date(new Date(createdAt).getTime() + 85 * 60_000).toISOString(), decidedBy: assignedAdvisorObj?.name ?? investigator, rejectionReason: "Motivo registrado en la resolución mock." };
      if (status === "completado") return { decision: "aprobado", decidedAt: new Date(new Date(createdAt).getTime() + 80 * 60_000).toISOString(), decidedBy: assignedAdvisorObj?.name ?? investigator, completedAt: new Date(new Date(createdAt).getTime() + 120 * 60_000).toISOString() };
      return null;
    })(),
    history: (() => {
      const events: ComplaintHistoryEvent[] = [];
      // Received
      events.push({ id: `H-${id}-received`, type: "received", title: "Queja recibida", description: "La queja fue registrada en el sistema.", createdAt, actor: assignedAdvisorObj?.name ?? "Sistema", metadata: null });

      // Investigation started/updated
      if (investigation && investigation.startedAt) {
        events.push({ id: `H-${id}-inv-start`, type: "investigation_started", title: "Investigación iniciada", description: `${investigator} inició la investigación del caso.`, createdAt: investigation.startedAt, actor: investigator, metadata: null });
        // Add an update event if findings exist
        if (investigation.findings) {
          events.push({ id: `H-${id}-inv-upd`, type: "investigation_updated", title: "Investigación actualizada", description: investigation.findings, createdAt: new Date(new Date(investigation.startedAt).getTime() + 5 * 60_000).toISOString(), actor: investigator, metadata: null });
        }
      }

      // Evidences
      if (evidences && evidences.length) {
        for (const ev of evidences) {
          events.push({ id: `H-${id}-e-${ev.id}`, type: "evidence_added", title: "Nueva evidencia", description: ev.name, createdAt: ev.uploadedAt, actor: ev.uploadedBy, metadata: { size: ev.size, type: ev.type } });
        }
      }

      // Simulate status transitions chronologically
      const created = new Date(createdAt).getTime();
      if (status === "investigando") {
        // Received -> Investigating
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
      } else if (status === "escalado_merchant") {
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
        events.push({ id: `H-${id}-merchant-esc`, type: "merchant_escalated", title: "Caso enviado al merchant", description: "Se solicita al merchant confirmar la entrega y enviar soporte de despacho.", createdAt: new Date(created + 60 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: null });
      } else if (status === "manejando") {
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
        events.push({ id: `H-${id}-s-man`, type: "status_change", title: "Estado actualizado", description: `Investigando → Manejando`, createdAt: new Date(created + 40 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "investigando", to: "manejando" } });
      } else if (status === "aprobado") {
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
        events.push({ id: `H-${id}-s-man`, type: "status_change", title: "Estado actualizado", description: `Investigando → Manejando`, createdAt: new Date(created + 40 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "investigando", to: "manejando" } });
        events.push({ id: `H-${id}-approved`, type: "approved", title: "Queja aprobada", description: `El caso fue aprobado.`, createdAt: new Date(created + 80 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: null });
      } else if (status === "rechazado") {
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
        events.push({ id: `H-${id}-s-man`, type: "status_change", title: "Estado actualizado", description: `Investigando → Manejando`, createdAt: new Date(created + 40 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "investigando", to: "manejando" } });
        events.push({ id: `H-${id}-rejected`, type: "rejected", title: "Queja rechazada", description: `El caso fue rechazado.`, createdAt: new Date(created + 85 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: null });
      } else if (status === "completado") {
        // full flow
        events.push({ id: `H-${id}-s-inv`, type: "status_change", title: "Estado actualizado", description: `Recibido → Investigando`, createdAt: new Date(created + 8 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "recibido", to: "investigando" } });
        events.push({ id: `H-${id}-s-man`, type: "status_change", title: "Estado actualizado", description: `Investigando → Manejando`, createdAt: new Date(created + 40 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: { from: "investigando", to: "manejando" } });
        events.push({ id: `H-${id}-approved`, type: "approved", title: "Queja aprobada", description: `El caso fue aprobado.`, createdAt: new Date(created + 80 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: null });
        events.push({ id: `H-${id}-completed`, type: "completed", title: "Queja completada", description: `El caso fue marcado como completado.`, createdAt: new Date(created + 120 * 60_000).toISOString(), actor: assignedAdvisorObj?.name ?? investigator, metadata: null });
      }

      // sort by createdAt desc (most recent first)
      return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    })(),
    // Add some mock internal notes for variety on a few cases
    notes: (() => {
      const list: ComplaintNote[] = [];
      if (index % 5 === 0) {
        list.push({ id: `N-${id}-1`, complaintId: id, content: "Se validó la transacción con la información disponible. El valor reportado por el cliente coincide con el movimiento registrado.", author: investigator, authorRole: "Asesora SAC", createdAt: new Date(new Date(createdAt).getTime() + 20 * 60_000).toISOString(), updatedAt: null });
      }
      if (index % 7 === 0) {
        list.push({ id: `N-${id}-2`, complaintId: id, content: "Se solicitó información adicional al merchant; pendiente respuesta.", author: assignedAdvisorObj?.name ?? investigator, authorRole: "Asesora SAC", createdAt: new Date(new Date(createdAt).getTime() + 30 * 60_000).toISOString(), updatedAt: null });
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    })(),
  } as Complaint;
});

export function getMockComplaintById(id: string) {
  const normalizedId = id.startsWith("CL-") ? id.replace("CL-", "Q-") : id;
  return mockComplaints.find((complaint) => complaint.id === normalizedId);
}