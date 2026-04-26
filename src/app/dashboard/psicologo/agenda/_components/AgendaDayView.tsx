"use client";

import { useAgendaAppointmentsDay } from "@/hooks/psychologist/agenda";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { getZonedWeekday } from "@/lib/agenda/zoned-time";
import { AgendaAppointmentCard } from "./AgendaAppointmentCard";
import { WEEKDAY_LABELS } from "./agenda-utils";

type Props = {
  localDateYmd: string;
  timeZone: string;
};

export function AgendaDayView({ localDateYmd, timeZone }: Props) {
  const { data = [], isLoading, isError, error } = useAgendaAppointmentsDay(localDateYmd, timeZone);

  if (isLoading) {
    return (
      <div className="d-flex flex-column gap-3">
        <BootstrapSkeleton height="2rem" className="w-25" />
        <BootstrapSkeleton height="6rem" />
        <BootstrapSkeleton height="6rem" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="alert alert-danger mb-0" role="alert">
        {error instanceof Error ? error.message : "Não foi possível carregar a agenda."}
      </div>
    );
  }

  const wd = getZonedWeekday(localDateYmd, timeZone);

  return (
    <div>
      <h2 className="h5 mb-1">
        {WEEKDAY_LABELS[wd]} · {localDateYmd}
      </h2>
      <p className="mb-4 small text-muted">Fuso: {timeZone}</p>
      {data.length === 0 ? (
        <p className="rounded border border-dashed bg-light p-4 text-center small text-muted mb-0">
          Nenhuma consulta neste dia.
        </p>
      ) : (
        <ul className="list-unstyled m-0 p-0 d-flex flex-column gap-3">
          {data.map((row) => (
            <li key={row.id}>
              <AgendaAppointmentCard row={row} timeZone={timeZone} localDateYmd={localDateYmd} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
