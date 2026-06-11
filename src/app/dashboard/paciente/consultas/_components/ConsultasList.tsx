"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarX,
  Clock,
  MapPin,
  Monitor,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Address = {
  label: string;
  street: string | null;
  city: string | null;
};

type Psychologist = {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  slug: string;
};

type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  modality: "ONLINE" | "PRESENTIAL";
  title: string | null;
  notes: string | null;
  address: Address | null;
  psychologist: Psychologist;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Não compareceu",
};

const STATUS_CLASSES: Record<string, string> = {
  SCHEDULED: "bg-primary-subtle text-primary",
  CONFIRMED: "bg-success-subtle text-success",
  IN_PROGRESS: "bg-warning-subtle text-warning",
  COMPLETED: "bg-secondary-subtle text-secondary",
  CANCELLED: "bg-danger-subtle text-danger",
  NO_SHOW: "bg-dark-subtle text-dark",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge fw-normal small rounded-pill px-2 py-1 ${STATUS_CLASSES[status] ?? "bg-secondary-subtle text-secondary"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Appointment card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onCancelled,
  isUpcoming,
}: {
  appt: Appointment;
  onCancelled: (id: string) => void;
  isUpcoming: boolean;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const startsAt = new Date(appt.startsAt);
  const endsAt = new Date(appt.endsAt);

  const dateLabel = format(startsAt, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeLabel = `${format(startsAt, "HH:mm")} – ${format(endsAt, "HH:mm")}`;

  const canCancel =
    isUpcoming && (appt.status === "SCHEDULED" || appt.status === "CONFIRMED");

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const r = await fetch(`/api/patient/appointments/${appt.id}/cancel`, {
        method: "PATCH",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(data.error ?? "Não foi possível cancelar.");
        return;
      }
      toast.success("Consulta cancelada.");
      onCancelled(appt.id);
    } catch {
      toast.error("Falha de rede.");
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-start gap-3">
          {/* Avatar */}
          {appt.psychologist.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={appt.psychologist.profileImageUrl}
              alt={appt.psychologist.displayName}
              className="rounded-circle border flex-shrink-0 object-fit-cover"
              style={{ width: 52, height: 52 }}
            />
          ) : (
            <div
              className="rounded-circle border bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 52, height: 52 }}
            >
              <UserRound size={22} />
            </div>
          )}

          {/* Info */}
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
              <span className="fw-semibold text-truncate">{appt.psychologist.displayName}</span>
              <StatusBadge status={appt.status} />
            </div>

            <div className="d-flex flex-wrap gap-3 small text-muted">
              <span className="d-flex align-items-center gap-1">
                <CalendarCheck size={13} />
                <span className="text-capitalize">{dateLabel}</span>
              </span>
              <span className="d-flex align-items-center gap-1">
                <Clock size={13} />
                {timeLabel}
              </span>
              <span className="d-flex align-items-center gap-1">
                {appt.modality === "ONLINE" ? (
                  <>
                    <Monitor size={13} />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin size={13} />
                    {appt.address?.label ?? "Presencial"}
                    {appt.address?.city ? ` · ${appt.address.city}` : ""}
                  </>
                )}
              </span>
            </div>

            {appt.notes ? (
              <p className="small text-muted mt-2 mb-0 fst-italic">"{appt.notes}"</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
            <Link
              href={`/team-detail?slug=${encodeURIComponent(appt.psychologist.slug)}`}
              className="btn btn-outline-primary btn-sm"
            >
              Ver perfil
            </Link>
            {canCancel ? (
              !showConfirm ? (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                  onClick={() => setShowConfirm(true)}
                >
                  <XCircle size={13} />
                  Cancelar
                </button>
              ) : (
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={cancelling}
                    onClick={handleCancel}
                  >
                    {cancelling ? "…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setShowConfirm(false)}
                  >
                    Voltar
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-start gap-3">
          <div className="placeholder-glow">
            <span className="placeholder rounded-circle" style={{ width: 52, height: 52, display: "block" }} />
          </div>
          <div className="flex-grow-1">
            <div className="placeholder-glow mb-2">
              <span className="placeholder col-4" />
            </div>
            <div className="placeholder-glow">
              <span className="placeholder col-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ConsultasList() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingPast, setLoadingPast] = useState(false);
  const [pastLoaded, setPastLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (filter: "upcoming" | "past") => {
    try {
      const r = await fetch(`/api/patient/appointments?filter=${filter}`);
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Erro ao carregar consultas.");
      return (data.appointments ?? []) as Appointment[];
    } catch (e) {
      throw e;
    }
  }, []);

  // load upcoming on mount
  useEffect(() => {
    setLoadingUpcoming(true);
    fetchAppointments("upcoming")
      .then(setUpcoming)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingUpcoming(false));
  }, [fetchAppointments]);

  // load past lazily
  useEffect(() => {
    if (tab === "past" && !pastLoaded) {
      setLoadingPast(true);
      fetchAppointments("past")
        .then((rows) => {
          setPast(rows);
          setPastLoaded(true);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoadingPast(false));
    }
  }, [tab, pastLoaded, fetchAppointments]);

  const handleCancelled = useCallback((id: string) => {
    setUpcoming((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)),
    );
  }, []);

  const activeList = tab === "upcoming" ? upcoming : past;
  const isLoading = tab === "upcoming" ? loadingUpcoming : loadingPast;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="h5 fw-semibold mb-1">Minhas Consultas</h2>
          <p className="text-muted small mb-0">Acompanhe seus agendamentos com psicólogos.</p>
        </div>
        <Link href="/team" className="btn btn-primary btn-sm">
          Encontrar psicólogo
        </Link>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item">
          <button
            type="button"
            role="tab"
            className={`nav-link ${tab === "upcoming" ? "active" : ""}`}
            onClick={() => setTab("upcoming")}
          >
            <CalendarCheck size={15} className="me-1" />
            Próximas
            {upcoming.filter((a) => a.status !== "CANCELLED").length > 0 && (
              <span className="ms-1 badge bg-primary rounded-pill small">
                {upcoming.filter((a) => a.status !== "CANCELLED").length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            role="tab"
            className={`nav-link ${tab === "past" ? "active" : ""}`}
            onClick={() => setTab("past")}
          >
            <CalendarX size={15} className="me-1" />
            Passadas
          </button>
        </li>
      </ul>

      {/* Error */}
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : null}

      {/* Content */}
      {isLoading ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : activeList.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div className="mb-3 opacity-40">
            {tab === "upcoming" ? <CalendarCheck size={48} /> : <CalendarX size={48} />}
          </div>
          <p className="mb-2 fw-medium">
            {tab === "upcoming"
              ? "Nenhuma consulta agendada"
              : "Nenhuma consulta anterior"}
          </p>
          {tab === "upcoming" ? (
            <Link href="/team" className="btn btn-primary btn-sm mt-1">
              Encontrar um psicólogo
            </Link>
          ) : null}
        </div>
      ) : (
        activeList.map((appt) => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            onCancelled={handleCancelled}
            isUpcoming={tab === "upcoming"}
          />
        ))
      )}
    </div>
  );
}
