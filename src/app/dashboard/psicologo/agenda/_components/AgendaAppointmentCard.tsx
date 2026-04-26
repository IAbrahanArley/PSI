"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AgendaAppointmentRow } from "@/hooks/psychologist/agenda";
import {
  useCancelAppointment,
  useRescheduleAppointment,
  useSetAppointmentStatus,
} from "@/hooks/psychologist/agenda";
import { cn } from "@/lib/utils";
import { modalityLabel, statusLabel, formatTimePt } from "./agenda-utils";

type Props = {
  row: AgendaAppointmentRow;
  timeZone: string;
  localDateYmd: string;
};

export function AgendaAppointmentCard({ row, timeZone, localDateYmd }: Props) {
  const setStatus = useSetAppointmentStatus(localDateYmd, timeZone);
  const cancel = useCancelAppointment(localDateYmd, timeZone);
  const reschedule = useRescheduleAppointment(localDateYmd, timeZone);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const addr =
    row.modality === "ONLINE"
      ? "Online"
      : [row.addressLabel, row.addressStreet, row.addressCity].filter(Boolean).join(" · ") || "—";

  async function onConfirm() {
    try {
      await setStatus.mutateAsync({ appointmentId: row.id, status: "CONFIRMED" });
      toast.success("Consulta confirmada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao confirmar.");
    }
  }

  async function onComplete() {
    try {
      await setStatus.mutateAsync({ appointmentId: row.id, status: "COMPLETED" });
      toast.success("Marcada como concluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao concluir.");
    }
  }

  async function onCancel() {
    try {
      await cancel.mutateAsync({ appointmentId: row.id, reason: cancelReason || undefined });
      toast.success("Consulta cancelada.");
      setCancelOpen(false);
      setCancelReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao cancelar.");
    }
  }

  async function onRescheduleSubmit() {
    if (!startLocal || !endLocal) {
      toast.error("Preencha início e fim.");
      return;
    }
    const startsAt = new Date(startLocal);
    const endsAt = new Date(endLocal);
    try {
      await reschedule.mutateAsync({ appointmentId: row.id, startsAt, endsAt });
      toast.success("Consulta remarcada.");
      setRescheduleOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remarcar.");
    }
  }

  const busy = setStatus.isPending || cancel.isPending || reschedule.isPending;
  const canAct = row.status !== "CANCELLED" && row.status !== "COMPLETED";

  return (
    <div className={cn("card shadow-sm", row.status === "CANCELLED" && "opacity-50")}>
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <div className="fw-semibold">
              {formatTimePt(row.startsAt, timeZone)} – {formatTimePt(row.endsAt, timeZone)}
            </div>
            <div className="small">{row.patientFullName}</div>
            {row.title ? <div className="mt-1 small text-muted">{row.title}</div> : null}
          </div>
          <span className="badge text-bg-secondary">{statusLabel(row.status)}</span>
        </div>
        <div className="mt-2 d-flex flex-wrap gap-2 small text-muted">
          <span className="badge bg-light text-dark border">{modalityLabel(row.modality)}</span>
          <span className="text-break text-start">{addr}</span>
        </div>
        {canAct ? (
          <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-2">
            {row.status === "SCHEDULED" ? (
              <button type="button" className="btn btn-sm btn-secondary" disabled={busy} onClick={() => void onConfirm()}>
                Confirmar
              </button>
            ) : null}
            {row.status !== "COMPLETED" ? (
              <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => void onComplete()}>
                Concluir
              </button>
            ) : null}
            <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => setRescheduleOpen(true)}>
              Remarcar
            </button>
            <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => setCancelOpen(true)}>
              Cancelar
            </button>
          </div>
        ) : null}
      </div>

      {rescheduleOpen ? (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h6 mb-0">Remarcar consulta</h2>
                <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setRescheduleOpen(false)} />
              </div>
              <div className="modal-body">
                <p className="small text-muted">
                  Horários no seu fuso local do navegador. Ajuste depois para o fuso do consultório se necessário.
                </p>
                <div className="mb-2">
                  <label className="form-label small">Início</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label small">Fim</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-sm" onClick={() => setRescheduleOpen(false)}>
                  Fechar
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void onRescheduleSubmit()}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cancelOpen ? (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h6 mb-0">Cancelar consulta</h2>
                <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setCancelOpen(false)} />
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Motivo (opcional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light btn-sm" onClick={() => setCancelOpen(false)}>
                  Voltar
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => void onCancel()}>
                  Cancelar consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
