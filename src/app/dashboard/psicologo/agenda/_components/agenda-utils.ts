import type { AgendaAppointmentRow } from "@/hooks/psychologist/agenda";
import { addCalendarDaysYmd, getZonedWeekday, getZonedYmd } from "@/lib/agenda/zoned-time";

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export function toLocalYmd(d: Date): string {
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** `yyyy-mm-dd` → exibição `dd-mm-yyyy` (API e `<input type="date">` continuam em ISO). */
export function formatYmdAsDdMmYyyy(ymd: string): string {
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

export function formatTimePt(iso: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(iso);
}

export function statusLabel(status: string): string {
  const m: Record<string, string> = {
    SCHEDULED: "Agendada",
    CONFIRMED: "Confirmada",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
    NO_SHOW: "Falta",
  };
  return m[status] ?? status;
}

export function modalityLabel(m: string): string {
  return m === "ONLINE" ? "Online" : "Presencial";
}

export function groupWeekAppointmentsByDay(rows: AgendaAppointmentRow[], timeZone: string) {
  const map = new Map<string, AgendaAppointmentRow[]>();
  for (const r of rows) {
    const ymd = getZonedYmd(r.startsAt.getTime(), timeZone);
    const list = map.get(ymd) ?? [];
    list.push(r);
    map.set(ymd, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
  return map;
}

/** 7 strings YMD domingo → sábado a partir de `anchorYmd`. */
export function weekDayYmds(anchorYmd: string, timeZone: string): string[] {
  const wd = getZonedWeekday(anchorYmd, timeZone);
  const start = addCalendarDaysYmd(anchorYmd, -wd);
  return Array.from({ length: 7 }, (_, i) => addCalendarDaysYmd(start, i));
}
