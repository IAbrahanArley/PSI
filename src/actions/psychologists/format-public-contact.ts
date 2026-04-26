import { psychologistAddresses } from "@/lib/db/schema";

type AddressRow = typeof psychologistAddresses.$inferSelect;

function formatTimeHm(value: unknown): string {
  const s = typeof value === "string" ? value : String(value ?? "");
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  if (!m) return s.slice(0, 5);
  const h = m[1].padStart(2, "0");
  return `${h}:${m[2]}`;
}

export function formatAddressForPublic(a: AddressRow): string {
  const line1 = [a.street, a.number].filter(Boolean).join(", ");
  const line2 = [a.neighborhood, [a.city, a.state].filter(Boolean).join(" - ")].filter(Boolean).join(" · ");
  const cep = a.zipCode ? `CEP ${a.zipCode}` : "";
  const extra = [a.complement, a.reference].filter(Boolean).join(" · ");
  const parts = [line1, line2, cep, extra].filter(Boolean);
  return parts.length ? parts.join(" · ") : a.label;
}

const WEEKDAY_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function buildWeeklyScheduleRows(
  rules: Array<{
    weekday: number;
    startTime: unknown;
    endTime: unknown;
  }>,
): Array<{ weekday: number; label: string; rangesText: string }> {
  const byDay = new Map<number, string[]>();
  for (const r of rules) {
    const w = Number(r.weekday);
    if (w < 0 || w > 6) continue;
    const range = `${formatTimeHm(r.startTime)} – ${formatTimeHm(r.endTime)}`;
    const list = byDay.get(w) ?? [];
    list.push(range);
    byDay.set(w, list);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekday, ranges]) => ({
      weekday,
      label: WEEKDAY_PT[weekday] ?? `Dia ${weekday}`,
      rangesText: ranges.join(" · "),
    }));
}
