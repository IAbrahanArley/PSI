/**
 * Intervalos em minutos desde 00:00 local, semi-abertos [start, end).
 * start >= 0, end <= 1440; end > start.
 */

export type MinuteInterval = {
  start: number;
  end: number;
};

const DAY_MINUTES = 24 * 60;

export function parseTimeToMinutes(value: string): number {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) {
    throw new Error(`Horário inválido: "${value}" (use HH:mm ou HH:mm:ss).`);
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  const s = m[3] ? Number(m[3]) : 0;
  if (h > 23 || min > 59 || s > 59) {
    throw new Error(`Horário fora do intervalo: "${value}".`);
  }
  return h * 60 + min + Math.round(s / 60);
}

/** Interseção [start,end) semi-aberta; vazio => null. */
export function intersectIntervals(a: MinuteInterval, b: MinuteInterval): MinuteInterval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  if (end <= start) return null;
  return { start, end };
}

export function sortIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  return [...intervals].sort((x, y) => x.start - y.start || x.end - y.end);
}

/** Mescla intervalos que se tocam ou sobrepõem. */
export function mergeIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  const sorted = sortIntervals(intervals);
  const out: MinuteInterval[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (!last || cur.start > last.end) {
      out.push({ ...cur });
    } else {
      last.end = Math.max(last.end, cur.end);
    }
  }
  return out;
}

/** Remove de `base` o interior de `cut` (semi-aberto). Retorna 0–2 pedaços. */
export function subtractInterval(base: MinuteInterval, cut: MinuteInterval): MinuteInterval[] {
  const inter = intersectIntervals(base, cut);
  if (!inter) return [base];
  const pieces: MinuteInterval[] = [];
  if (inter.start > base.start) {
    pieces.push({ start: base.start, end: inter.start });
  }
  if (inter.end < base.end) {
    pieces.push({ start: inter.end, end: base.end });
  }
  return pieces;
}

/** Subtrai vários cortes (já podem se sobrepor; serão unidos antes). */
export function subtractMany(baseList: MinuteInterval[], cuts: MinuteInterval[]): MinuteInterval[] {
  if (cuts.length === 0) return baseList.map((b) => ({ ...b }));
  const mergedCuts = mergeIntervals(cuts);
  let result = baseList.map((b) => ({ ...b }));
  for (const cut of mergedCuts) {
    result = result.flatMap((b) => subtractInterval(b, cut));
  }
  return result.filter((b) => b.end > b.start);
}

export function clipToDay(interval: MinuteInterval): MinuteInterval | null {
  return intersectIntervals(interval, { start: 0, end: DAY_MINUTES });
}

/** Recorta um intervalo local ao dia [0, 1440). */
export function clipMinuteRangeToDay(start: number, end: number): MinuteInterval | null {
  return clipToDay({ start, end });
}
