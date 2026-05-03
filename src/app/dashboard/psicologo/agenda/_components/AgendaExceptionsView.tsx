"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateAgendaException, useAgendaExceptionsPeriod } from "@/hooks/psychologist/agenda";
import { usePsychologistAddresses } from "@/hooks/psychologist/data";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { AgendaExceptionForm } from "./exceptions-form/AgendaExceptionForm";
import type { AgendaExceptionSubmitPayload } from "./exceptions-form/types";

function ymdFirstOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function ymdLastOfMonth(d: Date): string {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export function AgendaExceptionsView() {
  const now = useMemo(() => new Date(), []);
  const [fromDate] = useState(() => ymdFirstOfMonth(now));
  const [toDate] = useState(() => ymdLastOfMonth(now));
  const { data: rows = [], isLoading } = useAgendaExceptionsPeriod(fromDate, toDate);
  const { data: addressesRaw } = usePsychologistAddresses();
  const addresses = addressesRaw ?? [];
  const createEx = useCreateAgendaException();

  async function onSubmit(payload: AgendaExceptionSubmitPayload) {
    try {
      await createEx.mutateAsync({
        exceptionDate: payload.exceptionDate,
        kind: payload.kind,
        startTime: payload.kind === "INACTIVE_DAY" ? null : payload.startTime,
        endTime: payload.kind === "INACTIVE_DAY" ? null : payload.endTime,
        addressId: payload.modality === "PRESENTIAL" ? payload.addressId : null,
        note: payload.note || null,
        isActive: payload.isActive,
      });
      toast.success("Exceção criada.");
    } catch {
      toast.error("Não foi possível criar a exceção agora.");
    }
  }

  if (isLoading) {
    return <BootstrapSkeleton height="12rem" />;
  }

  return (
    <div className="d-flex flex-column gap-4">
      <p className="small text-muted mb-0">
        Listando exceções entre <strong>{fromDate}</strong> e <strong>{toDate}</strong>.
      </p>

      <section className="card">
        <div className="card-body">
          <AgendaExceptionForm addresses={addresses} onSubmit={onSubmit} isSubmitting={createEx.isPending} />
        </div>
      </section>

      <section>
        <h3 className="h6 mb-2">Cadastradas no período</h3>
        {rows.length === 0 ? (
          <p className="small text-muted mb-0">Nenhuma exceção.</p>
        ) : (
          <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
            {rows.map((r) => (
              <li key={r.id} className="border rounded p-2 small">
                <strong>{r.exceptionDate}</strong> · {r.kind}
                {r.startTime ? ` · ${r.startTime}–${r.endTime}` : ""}
                {r.addressId ? ` · ${addresses.find((a) => a.id === r.addressId)?.label ?? r.addressId}` : ""}
                {r.note ? ` — ${r.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
