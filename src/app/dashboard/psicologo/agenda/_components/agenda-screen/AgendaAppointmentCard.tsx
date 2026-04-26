"use client";

import type { AgendaAppointmentListItem } from "./types";
import { formatSlotTime } from "./lib/format-slot-time";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "text-bg-warning",
  CONFIRMED: "text-bg-success",
  IN_PROGRESS: "text-bg-primary",
  COMPLETED: "text-bg-secondary",
  CANCELLED: "text-bg-danger",
  NO_SHOW: "text-bg-warning",
};

function statusPt(s: string): string {
  const m: Record<string, string> = {
    SCHEDULED: "Agendada",
    CONFIRMED: "Confirmada",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
    NO_SHOW: "Falta",
  };
  return m[s] ?? s;
}

type Props = {
  item: AgendaAppointmentListItem;
  timeZone?: string;
  className?: string;
};

export function AgendaAppointmentCard({ item, timeZone, className }: Props) {
  const addr = item.modality === "ONLINE" ? "Online" : item.addressLabel ?? "Presencial";

  return (
    <article className={cn("card shadow-sm", className)}>
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <p className="small fw-semibold mb-1">
              {formatSlotTime(item.startsAtIso, timeZone)} – {formatSlotTime(item.endsAtIso, timeZone)}
            </p>
            <p className="h6 mb-0">{item.patientName}</p>
            {item.title ? <p className="small text-muted mb-0 mt-1">{item.title}</p> : null}
          </div>
          <span className={cn("badge", STATUS_BADGE[item.status] ?? "text-bg-light text-dark")}>
            {statusPt(item.status)}
          </span>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-3 small">
          <span className="badge bg-secondary">{item.modality === "ONLINE" ? "Online" : "Presencial"}</span>
          <span className="text-muted">{addr}</span>
        </div>
      </div>
    </article>
  );
}
