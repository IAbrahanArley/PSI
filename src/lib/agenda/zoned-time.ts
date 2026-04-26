/**
 * Conversões mínimas data/hora local (IANA) ↔ instantes UTC, sem dependências.
 * Usa Intl e busca binária para obter o instante do meia-noite local.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "YYYY-MM-DD" a partir de partes numéricas. */
export function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Calendar date da máquina em formato en-CA (YYYY-MM-DD) para um instante visto em `timeZone`. */
export function getZonedYmd(utcMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(utcMs));
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  return formatYmd(y, m, d);
}

/** Minutos desde meia-noite local no dia civil que contém `utcMs` em `timeZone`. */
export function utcMsToZonedMinutesFromMidnight(utcMs: number, timeZone: string): number {
  const ymd = getZonedYmd(utcMs, timeZone);
  const dayStartMs = findStartOfZonedDayUtcMs(ymd, timeZone);
  return Math.round((utcMs - dayStartMs) / 60000);
}

/**
 * Primeiro instante UTC em que o relógio local em `timeZone` cruza 00:00:00 no dia `localYmd`.
 */
export function findStartOfZonedDayUtcMs(localYmd: string, timeZone: string): number {
  const [y, mo, d] = localYmd.split("-").map(Number);
  let lo = Date.UTC(y, mo - 1, d, 0, 0, 0) - 2 * DAY_MS;
  let hi = lo + 4 * DAY_MS;
  const target = localYmd;
  while (hi - lo > 60000) {
    const mid = Math.floor((lo + hi) / 2);
    if (getZonedYmd(mid, timeZone) < target) lo = mid;
    else hi = mid;
  }
  return Math.floor((lo + hi) / 2);
}

/** Próximo dia civil a partir de `YYYY-MM-DD` (Gregorian). */
export function addCalendarDaysYmd(ymd: string, days: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const u = Date.UTC(y, mo - 1, d + days);
  const dt = new Date(u);
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Instant UTC do começo do dia civil seguintedepois de `localYmd` em `timeZone`. */
export function findEndOfZonedDayUtcMs(localYmd: string, timeZone: string): number {
  return findStartOfZonedDayUtcMs(addCalendarDaysYmd(localYmd, 1), timeZone);
}

/** weekday 0 = domingo … 6 = sábado (Postgres `dow` / schema). */
export function getZonedWeekday(localYmd: string, timeZone: string): number {
  const noonUtc = findStartOfZonedDayUtcMs(localYmd, timeZone) + 12 * 60 * 60 * 1000;
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date(noonUtc));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const idx = map[short];
  if (idx === undefined) {
    throw new Error(`Falha ao obter weekday para ${localYmd} em ${timeZone} (valor: ${short})`);
  }
  return idx;
}

/**
 * Semana dominical: domingo 00:00 local até domingo seguinte 00:00 exclusivo.
 * `anchorLocalDate` é qualquer dia da semana de interesse.
 */
export function getSundayWeekRangeUtc(anchorLocalDate: string, timeZone: string) {
  const wd = getZonedWeekday(anchorLocalDate, timeZone);
  const weekStartYmd = addCalendarDaysYmd(anchorLocalDate, -wd);
  const weekEndExclusiveYmd = addCalendarDaysYmd(weekStartYmd, 7);
  return {
    weekStartYmd,
    rangeStartUtc: new Date(findStartOfZonedDayUtcMs(weekStartYmd, timeZone)),
    rangeEndUtc: new Date(findStartOfZonedDayUtcMs(weekEndExclusiveYmd, timeZone)),
  };
}

/** localYmd + minutos desde meia-noite local → Date UTC (ajuste fino para DST). */
export function zonedDayMinutesToUtcDate(
  localYmd: string,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const dayStart = findStartOfZonedDayUtcMs(localYmd, timeZone);
  let ms = dayStart + minutesFromMidnight * 60 * 1000;
  for (let i = 0; i < 4; i++) {
    const got = utcMsToZonedMinutesFromMidnight(ms, timeZone);
    const diffMin = minutesFromMidnight - got;
    if (Math.abs(diffMin) < 0.5) break;
    ms += diffMin * 60 * 1000;
  }
  return new Date(ms);
}

/**
 * Projeta [startsAt, endsAt) em intervalos de minutos locais no dia `localYmd` (pode retornar 0, 1 ou 2).
 */
export function utcRangeToZonedDayMinuteIntervals(
  startsAt: Date,
  endsAt: Date,
  localYmd: string,
  timeZone: string,
): { start: number; end: number }[] {
  const dayStartMs = findStartOfZonedDayUtcMs(localYmd, timeZone);
  const dayEndMs = findEndOfZonedDayUtcMs(localYmd, timeZone);
  const s = startsAt.getTime();
  const e = endsAt.getTime();
  const clipStart = Math.max(s, dayStartMs);
  const clipEnd = Math.min(e, dayEndMs);
  if (clipEnd <= clipStart) return [];
  const startMin = Math.round((clipStart - dayStartMs) / 60000);
  const endMin = Math.round((clipEnd - dayStartMs) / 60000);
  const startClamped = Math.max(0, Math.min(24 * 60, startMin));
  const endClamped = Math.max(0, Math.min(24 * 60, endMin));
  if (endClamped <= startClamped) return [];
  return [{ start: startClamped, end: endClamped }];
}
