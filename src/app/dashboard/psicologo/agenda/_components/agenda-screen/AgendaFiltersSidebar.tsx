"use client";

import type { AgendaModalityFilter, AgendaStatusFilter } from "./types";
import { cn } from "@/lib/utils";

export type AgendaFiltersState = {
  modality: AgendaModalityFilter;
  status: AgendaStatusFilter;
  patientQuery: string;
};

type Props = {
  filters: AgendaFiltersState;
  onChange: (next: Partial<AgendaFiltersState>) => void;
  className?: string;
};

const STATUS_OPTIONS: { value: AgendaStatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function AgendaFiltersSidebar({ filters, onChange, className }: Props) {
  return (
    <div className={cn("card shadow-sm", className)}>
      <div className="card-body">
        <h2 className="h6 text-uppercase text-muted fw-semibold mb-3">Filtros</h2>

        <div className="mb-3">
          <label htmlFor="agenda-filter-patient" className="form-label small mb-1">
            Paciente
          </label>
          <input
            id="agenda-filter-patient"
            type="search"
            placeholder="Buscar por nome…"
            value={filters.patientQuery}
            onChange={(e) => onChange({ patientQuery: e.target.value })}
            className="form-control form-control-sm"
          />
        </div>

        <div className="mb-3">
          <span className="form-label small d-block mb-2">Modalidade</span>
          <div className="btn-group w-100" role="group" aria-label="Filtrar por modalidade">
            {(
              [
                ["ALL", "Todas"],
                ["ONLINE", "Online"],
                ["PRESENTIAL", "Presencial"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ modality: value })}
                className={cn(
                  "btn btn-sm flex-fill",
                  filters.modality === value ? "btn-primary" : "btn-outline-secondary",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="agenda-filter-status" className="form-label small mb-1">
            Status
          </label>
          <select
            id="agenda-filter-status"
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as AgendaStatusFilter })}
            className="form-select form-select-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
