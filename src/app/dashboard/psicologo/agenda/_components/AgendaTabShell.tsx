"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AgendaDayView } from "./AgendaDayView";
import { AgendaExceptionsView } from "./AgendaExceptionsView";
import { AgendaSettingsView } from "./AgendaSettingsView";
import { AgendaWeekView } from "./AgendaWeekView";
import { toLocalYmd } from "./agenda-utils";

type Tab = "day" | "week" | "settings" | "exceptions";

export function AgendaTabShell() {
  const defaultTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [timeZone] = useState(defaultTz);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const localDateYmd = useMemo(() => toLocalYmd(selectedDate), [selectedDate]);
  const [tab, setTab] = useState<Tab>("day");

  function shiftDay(delta: number) {
    setSelectedDate((d) => {
      const y = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();
      return new Date(y, m, day + delta);
    });
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className={cn("btn btn-sm flex-shrink-0", tab === id ? "btn-primary" : "btn-outline-secondary")}
    >
      {label}
    </button>
  );

  return (
    <div>
      <header className="mb-4 d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-sm-between">
        <div>
          <h1 className="title mb-1">Agenda</h1>
          <p className="mb-0 small text-muted">Consultas, grade semanal e exceções.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {tabBtn("day", "Dia")}
          {tabBtn("week", "Semana")}
          {tabBtn("settings", "Configuração")}
          {tabBtn("exceptions", "Exceções")}
        </div>
      </header>

      {(tab === "day" || tab === "week") && (
        <div className="mb-4 d-flex flex-wrap align-items-center gap-2 rounded border bg-white p-3">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => shiftDay(-1)}>
            ← Anterior
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedDate(new Date())}>
            Hoje
          </button>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: "auto" }}
            value={localDateYmd}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const [y, m, d] = v.split("-").map(Number);
              setSelectedDate(new Date(y, m - 1, d));
            }}
          />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => shiftDay(1)}>
            Próximo →
          </button>
          <span className="ms-auto small text-muted">{timeZone}</span>
        </div>
      )}

      {tab === "day" ? <AgendaDayView localDateYmd={localDateYmd} timeZone={timeZone} /> : null}
      {tab === "week" ? <AgendaWeekView anchorLocalYmd={localDateYmd} timeZone={timeZone} /> : null}
      {tab === "settings" ? <AgendaSettingsView /> : null}
      {tab === "exceptions" ? <AgendaExceptionsView /> : null}
    </div>
  );
}
