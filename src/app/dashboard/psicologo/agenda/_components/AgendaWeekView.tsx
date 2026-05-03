"use client";

import { useAgendaAppointmentsWeek } from "@/hooks/psychologist/agenda";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { AgendaAppointmentCard } from "./AgendaAppointmentCard";
import { WEEKDAY_LABELS, formatTimePt, groupWeekAppointmentsByDay, weekDayYmds } from "./agenda-utils";

type Props = {
  anchorLocalYmd: string;
  timeZone: string;
};

export function AgendaWeekView({ anchorLocalYmd, timeZone }: Props) {
  const { data = [], isLoading, isError } = useAgendaAppointmentsWeek(anchorLocalYmd, timeZone);
  const ymds = weekDayYmds(anchorLocalYmd, timeZone);
  const byDay = groupWeekAppointmentsByDay(data, timeZone);

  if (isLoading) {
    return (
      <div className="d-flex flex-column gap-3">
        <BootstrapSkeleton height="2rem" className="w-50" />
        <BootstrapSkeleton height="10rem" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="alert alert-danger mb-0" role="alert">
        Não foi possível carregar os atendimentos da semana.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 small text-muted">
        Semana de domingo a sábado ({ymds[0]} → {ymds[6]})
      </p>

      <div className="d-none d-lg-flex gap-2 mb-4 flex-nowrap">
        {ymds.map((ymd, i) => {
          const list = byDay.get(ymd) ?? [];
          return (
            <div key={ymd} className="flex-grow-1 min-w-0 rounded border bg-white p-2" style={{ minHeight: "10rem" }}>
              <div className="mb-2 border-bottom pb-1 text-center small fw-semibold">
                {WEEKDAY_LABELS[i]}
                <div className="fw-normal text-muted">{ymd.slice(8)}</div>
              </div>
              <ul className="list-unstyled m-0 p-0 d-flex flex-column gap-2">
                {list.map((r) => (
                  <li key={r.id}>
                    <div className="rounded border bg-light p-2 small lh-sm">
                      <div className="fw-medium">{formatTimePt(r.startsAt, timeZone)}</div>
                      <div className="text-muted text-break">{r.patientFullName}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="d-lg-none d-flex flex-column gap-4">
        {ymds.map((ymd, i) => {
          const list = byDay.get(ymd) ?? [];
          return (
            <section key={ymd}>
              <h3 className="h6 mb-2">
                {WEEKDAY_LABELS[i]} <span className="fw-normal text-muted">{ymd}</span>
              </h3>
              {list.length === 0 ? (
                <p className="small text-muted mb-0">Sem consultas.</p>
              ) : (
                <ul className="list-unstyled m-0 p-0 d-flex flex-column gap-3">
                  {list.map((row) => (
                    <li key={row.id}>
                      <AgendaAppointmentCard row={row} timeZone={timeZone} localDateYmd={ymd} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
