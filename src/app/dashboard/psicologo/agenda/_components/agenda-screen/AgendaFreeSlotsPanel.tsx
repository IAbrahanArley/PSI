"use client";

import type { AgendaFreeSlotItem } from "./types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type Props = {
  slots: AgendaFreeSlotItem[];
  className?: string;
};

export function AgendaFreeSlotsPanel({ slots, className }: Props) {
  return (
    <aside className={cn("card border-primary border-opacity-25 shadow-sm", className)} style={{ top: "1rem" }}>
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Sparkles className="text-primary" size={20} />
          <h2 className="h6 fw-bold mb-0">Horários livres</h2>
        </div>
        <p className="small text-muted mb-3">
          Intervalos livres calculados com suas regras semanais, exceções do dia, consultas e bloqueios ativos.
        </p>
        {slots.length === 0 ? (
          <p className="border border-dashed rounded p-4 text-center small text-muted mb-0">
            Nenhum horário livre neste dia com as regras atuais.
          </p>
        ) : (
          <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
            {slots.map((s, i) => (
              <li key={`${s.startLabel}-${s.endLabel}-${i}`} className="border rounded p-2 small bg-white">
                <div className="fw-semibold">
                  {s.startLabel} – {s.endLabel}
                </div>
                <div className="text-muted mt-1">
                  <span>{s.modality === "ONLINE" ? "Online" : "Presencial"}</span>
                  {s.addressLabel ? <span> · {s.addressLabel}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
