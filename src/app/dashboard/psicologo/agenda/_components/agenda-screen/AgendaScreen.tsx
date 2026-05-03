"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAgendaDaySnapshot } from "@/hooks/psychologist/agenda";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { getZonedWeekday } from "@/lib/agenda/zoned-time";
import { WEEKDAY_LABELS, toLocalYmd } from "../agenda-utils";
import { AgendaDateHeader } from "./AgendaDateHeader";
import { AgendaDayAppointmentsSection } from "./AgendaDayAppointmentsSection";
import type { AgendaFiltersState } from "./AgendaFiltersSidebar";
import { AgendaFiltersSidebar } from "./AgendaFiltersSidebar";
import { AgendaFreeSlotsPanel } from "./AgendaFreeSlotsPanel";
import { AgendaQuickActions } from "./AgendaQuickActions";
import { AgendaScreenLayout } from "./AgendaScreenLayout";
import type { AgendaAppointmentListItem } from "./types";

export type AgendaScreenProps = {
  timeZone?: string;
  onConfigureAvailability?: () => void;
  onBlockTime?: () => void;
  onNewAppointment?: () => void;
};

function applyFilters(
  items: AgendaAppointmentListItem[],
  f: AgendaFiltersState,
): AgendaAppointmentListItem[] {
  let out = items;
  const q = f.patientQuery.trim().toLowerCase();
  if (q) {
    out = out.filter((x) => x.patientName.toLowerCase().includes(q));
  }
  if (f.modality !== "ALL") {
    out = out.filter((x) => x.modality === f.modality);
  }
  if (f.status !== "ALL") {
    out = out.filter((x) => x.status === f.status);
  }
  return out;
}

export function AgendaScreen({
  timeZone: timeZoneProp,
  onConfigureAvailability,
  onBlockTime,
  onNewAppointment,
}: AgendaScreenProps) {
  const router = useRouter();
  const timeZone = timeZoneProp ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const localDate = useMemo(() => toLocalYmd(selectedDate), [selectedDate]);

  const { data: snapshot, isLoading, isError, refetch, isFetching } = useAgendaDaySnapshot(
    localDate,
    timeZone,
  );

  const [filters, setFilters] = useState<AgendaFiltersState>({
    modality: "ALL",
    status: "ALL",
    patientQuery: "",
  });

  const filteredAppointments = useMemo(
    () => applyFilters(snapshot?.appointments ?? [], filters),
    [snapshot?.appointments, filters],
  );

  const weekdayIdx = getZonedWeekday(localDate, timeZone);
  const weekdayLabel = WEEKDAY_LABELS[weekdayIdx];

  function shiftDay(delta: number) {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + delta);
      return n;
    });
  }

  const handleConfigure =
    onConfigureAvailability ?? (() => router.push("/dashboard/psicologo/agenda/configuracao"));

  const handleBlock = onBlockTime ?? (() => toast.message("Bloqueio de horário será liberado em breve."));

  const handleNew =
    onNewAppointment ?? (() => router.push("/dashboard/psicologo/agenda/novo"));

  const sidebar = (
    <AgendaFiltersSidebar
      filters={filters}
      onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
    />
  );

  if (isLoading && !snapshot) {
    return (
      <AgendaScreenLayout sidebar={sidebar}>
        <div className="d-flex flex-column gap-4">
          <BootstrapSkeleton height="5rem" />
          <div className="d-flex flex-wrap gap-2">
            <BootstrapSkeleton height="2.5rem" className="w-25" />
            <BootstrapSkeleton height="2.5rem" className="w-25" />
            <BootstrapSkeleton height="2.5rem" className="w-25" />
          </div>
          <div className="row g-4">
            <div className="col-lg-8">
              <BootstrapSkeleton height="280px" />
            </div>
            <div className="col-lg-4">
              <BootstrapSkeleton height="200px" />
            </div>
          </div>
        </div>
      </AgendaScreenLayout>
    );
  }

  if (isError) {
    return (
      <AgendaScreenLayout sidebar={sidebar}>
        <div className="alert alert-danger">
          <p className="fw-medium mb-0">
            Não foi possível carregar sua agenda agora.
          </p>
          <button type="button" className="btn btn-outline-danger btn-sm mt-3" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      </AgendaScreenLayout>
    );
  }

  return (
    <AgendaScreenLayout sidebar={sidebar}>
      <div className="d-flex flex-column gap-4">
        {isFetching ? (
          <p className="small text-muted mb-0" aria-live="polite">
            Atualizando…
          </p>
        ) : null}

        <AgendaDateHeader
          localDate={localDate}
          weekdayLabel={weekdayLabel}
          onPrevDay={() => shiftDay(-1)}
          onNextDay={() => shiftDay(1)}
          onToday={() => setSelectedDate(new Date())}
          onPickDate={(ymd) => {
            const [y, m, d] = ymd.split("-").map(Number);
            if (!y || !m || !d) return;
            setSelectedDate(new Date(y, m - 1, d));
          }}
        />

        <AgendaQuickActions
          onConfigureAvailability={handleConfigure}
          onBlockTime={handleBlock}
          onNewAppointment={handleNew}
        />

        <div className="row g-4 align-items-start">
          <div className="col-lg-8">
            <AgendaDayAppointmentsSection items={filteredAppointments} timeZone={timeZone} />
          </div>
          <div className="col-lg-4">
            <AgendaFreeSlotsPanel slots={snapshot?.freeSlots ?? []} className="position-sticky" />
          </div>
        </div>
      </div>
    </AgendaScreenLayout>
  );
}
