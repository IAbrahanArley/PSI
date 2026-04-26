"use client";

import { CalendarPlus, Clock, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgendaQuickActionsProps = {
  onConfigureAvailability: () => void;
  onBlockTime: () => void;
  onNewAppointment: () => void;
  className?: string;
};

export function AgendaQuickActions({
  onConfigureAvailability,
  onBlockTime,
  onNewAppointment,
  className,
}: AgendaQuickActionsProps) {
  return (
    <div className={cn("d-flex flex-column flex-sm-row flex-wrap gap-2 align-items-sm-center", className)}>
      <button
        type="button"
        onClick={onConfigureAvailability}
        className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-2"
      >
        <Settings2 size={16} />
        Configurar disponibilidade
      </button>
      <button type="button" onClick={onBlockTime} className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center gap-2">
        <Clock size={16} />
        Bloquear horário
      </button>
      <button
        type="button"
        onClick={onNewAppointment}
        className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
      >
        <CalendarPlus size={16} />
        Novo agendamento
      </button>
    </div>
  );
}
