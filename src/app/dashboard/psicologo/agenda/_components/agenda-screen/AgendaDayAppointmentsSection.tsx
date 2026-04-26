"use client";

import type { AgendaAppointmentListItem } from "./types";
import { AgendaAppointmentCard } from "./AgendaAppointmentCard";
import { cn } from "@/lib/utils";
import { CalendarX2 } from "lucide-react";

type Props = {
  items: AgendaAppointmentListItem[];
  timeZone?: string;
  className?: string;
};

export function AgendaDayAppointmentsSection({ items, timeZone, className }: Props) {
  return (
    <section className={cn(className)}>
      <h2 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
        Consultas do dia
        <span className="badge bg-light text-dark border">{items.length}</span>
      </h2>

      {items.length === 0 ? (
        <div className="border border-2 border-dashed rounded-3 bg-light py-5 px-3 text-center">
          <CalendarX2 className="mb-2 text-muted" size={40} />
          <p className="fw-medium mb-1">Nenhuma consulta neste dia</p>
          <p className="small text-muted mb-0 mx-auto" style={{ maxWidth: "24rem" }}>
            Ajuste a data ou use &quot;Novo agendamento&quot; para criar uma consulta.
          </p>
        </div>
      ) : (
        <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
          {items.map((item) => (
            <li key={item.id}>
              <AgendaAppointmentCard item={item} timeZone={timeZone} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
