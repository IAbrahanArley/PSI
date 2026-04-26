"use client";

import { cn } from "@/lib/utils";
import { formatYmdAsDdMmYyyy } from "../agenda-utils";

type Props = {
  localDate: string;
  weekdayLabel: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  /** `yyyy-mm-dd` vindo do `<input type="date">`. */
  onPickDate: (ymd: string) => void;
  className?: string;
};

export function AgendaDateHeader({
  localDate,
  weekdayLabel,
  onPrevDay,
  onNextDay,
  onToday,
  onPickDate,
  className,
}: Props) {
  return (
    <header className={cn("card shadow-sm", className)}>
      <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <p className="small text-uppercase text-muted mb-1 fw-medium">Agenda do dia</p>
          <h1 className="h4 mb-0">
            {weekdayLabel}{" "}
            <span className="text-primary">{formatYmdAsDdMmYyyy(localDate)}</span>
          </h1>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button type="button" onClick={onPrevDay} className="btn btn-outline-secondary btn-sm">
            ←
          </button>
          <input
            type="date"
            value={localDate}
            onChange={(e) => {
              const v = e.target.value;
              if (v) onPickDate(v);
            }}
            className="form-control form-control-sm"
            style={{ width: "auto" }}
          />
          <button type="button" onClick={onNextDay} className="btn btn-outline-secondary btn-sm">
            →
          </button>
          <button type="button" onClick={onToday} className="btn btn-secondary btn-sm fw-semibold">
            Hoje
          </button>
        </div>
      </div>
    </header>
  );
}
