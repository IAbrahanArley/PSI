import type {
  AgendaAvailableSlot,
  AgendaExceptionInput,
  AgendaModality,
  AgendaSlotWithAvailability,
  CalculateAvailableSlotsInput,
  WeeklyAvailabilityRuleInput,
} from "./types";
import {
  clipToDay,
  mergeIntervals,
  parseTimeToMinutes,
  subtractMany,
  type MinuteInterval,
} from "./time-intervals";
import {
  getZonedWeekday,
  utcRangeToZonedDayMinuteIntervals,
  zonedDayMinutesToUtcDate,
} from "./zoned-time";

/**
 * Calcula slots livres para agendar em um dia civil local do psicólogo.
 *
 * Ordem de aplicação (resumo):
 * 1. **Grade semanal** — cada regra `AVAILABLE` vira janela base no canal (modalidade + endereço).
 * 2. **Recortes semanais `UNAVAILABLE`** — removem pedaços dentro do mesmo weekday/canal.
 * 3. **Exceções da data** — `INACTIVE_*` fecham dia ou intervalo (global ou por endereço);
 *    `ACTIVE_OVERRIDE_INTERVAL` abre janela extra (ONLINE se sem endereço; PRESENTIAL se `addressId`).
 * 4. **Ocupação** — consultas e `schedule_blocks`, alargadas por buffers antes/depois; aplicada a todos
 *    os canais (um único profissional não atende outro modo no mesmo instante).
 * 5. **Fatia em sessões** — greedy com duração da regra ou `defaultSessionDurationMinutes` e
 *    espaçamento `bufferAfter` entre fim de um slot e início do próximo.
 */

/** Chave estável para casar slot teórico com slot livre. */
export function agendaSlotMatchKey(s: AgendaAvailableSlot): string {
  return `${s.start.toISOString()}|${s.end.toISOString()}|${s.mode}|${s.addressId ?? ""}`;
}

/**
 * Slots que cabem na grade do dia (regras + exceções), **antes** de remover ocupação —
 * usado na vitrine pública para mostrar horários indisponíveis (cinza).
 */
export function calculateTheoreticalSlots(input: CalculateAvailableSlotsInput): AgendaAvailableSlot[] {
  return calculateAgendaSlotsInternal(input, { subtractOccupancy: false });
}

export function calculateAvailableSlots(input: CalculateAvailableSlotsInput): AgendaAvailableSlot[] {
  return calculateAgendaSlotsInternal(input, { subtractOccupancy: true });
}

/**
 * Grade do dia: cada posição da regra semanal com flag `available` (livre para agendar).
 */
export function calculateDaySlotsWithAvailability(
  input: CalculateAvailableSlotsInput,
): AgendaSlotWithAvailability[] {
  const theoretical = calculateTheoreticalSlots(input);
  const free = calculateAvailableSlots(input);
  const freeKeys = new Set(free.map((s) => agendaSlotMatchKey(s)));
  const out = theoretical.map((s) => ({
    ...s,
    available: freeKeys.has(agendaSlotMatchKey(s)),
  }));
  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

function calculateAgendaSlotsInternal(
  input: CalculateAvailableSlotsInput,
  opts: { subtractOccupancy: boolean },
): AgendaAvailableSlot[] {
  const {
    localDate,
    timeZone,
    defaultSessionDurationMinutes,
    bufferBeforeMinutes = 0,
    bufferAfterMinutes = 0,
    weeklyRules,
    exceptions,
    appointments,
    scheduleBlocks,
  } = input;

  if (defaultSessionDurationMinutes <= 0) {
    throw new Error("defaultSessionDurationMinutes deve ser > 0.");
  }

  const weekday = getZonedWeekday(localDate, timeZone);
  const dayExceptions = exceptions.filter(
    (x) => x.exceptionDate === localDate && x.isActive !== false,
  );

  if (isGloballyClosedByException(dayExceptions)) {
    return [];
  }

  const globalBusy = buildGlobalBusyMinuteIntervals(
    localDate,
    timeZone,
    appointments,
    scheduleBlocks,
    bufferBeforeMinutes,
    bufferAfterMinutes,
  );

  const weeklyAvailable = weeklyRules.filter(
    (r) =>
      r.ruleType === "AVAILABLE" &&
      r.weekday === weekday &&
      r.isActive !== false,
  );
  const weeklyUnavailable = weeklyRules.filter(
    (r) =>
      r.ruleType === "UNAVAILABLE" &&
      r.weekday === weekday &&
      r.isActive !== false,
  );

  const slots: AgendaAvailableSlot[] = [];
  const seen = new Set<string>();

  for (const rule of weeklyAvailable) {
    const duration =
      rule.slotDurationMinutes && rule.slotDurationMinutes > 0
        ? rule.slotDurationMinutes
        : defaultSessionDurationMinutes;

    let windows = initialWindowFromWeeklyRule(rule);
    if (windows.length === 0) continue;

    windows = applyWeeklyUnavailable(windows, rule, weeklyUnavailable);
    windows = applyExceptionsInactive(windows, rule, dayExceptions);
    const extra = activeOverrideWindowsForChannel(rule.modality, rule.addressId, dayExceptions);
    let merged = mergeIntervals([...windows, ...extra]);
    if (opts.subtractOccupancy) {
      merged = subtractMany(merged, globalBusy);
    }
    merged = mergeIntervals(merged);

    for (const seg of merged) {
      const emitted = emitSlotsInSegment({
        segment: seg,
        durationMinutes: duration,
        bufferAfterMinutes,
        bufferBeforeFirstMinutes: bufferBeforeMinutes,
        localYmd: localDate,
        timeZone,
        modality: rule.modality,
        addressId: rule.addressId,
      });
      for (const s of emitted) {
        const key = agendaSlotMatchKey(s);
        if (seen.has(key)) continue;
        seen.add(key);
        slots.push(s);
      }
    }
  }

  const orphanOverrides = opts.subtractOccupancy
    ? collectOrphanActiveOverrides(
        weeklyAvailable,
        dayExceptions,
        globalBusy,
        localDate,
        timeZone,
        defaultSessionDurationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
      )
    : collectOrphanTheoreticalOverrides(
        weeklyAvailable,
        dayExceptions,
        localDate,
        timeZone,
        defaultSessionDurationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes,
      );
  for (const s of orphanOverrides) {
    const key = agendaSlotMatchKey(s);
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push(s);
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}

function isGloballyClosedByException(dayExceptions: AgendaExceptionInput[]): boolean {
  return dayExceptions.some((e) => e.kind === "INACTIVE_DAY" && !e.addressId);
}

function buildGlobalBusyMinuteIntervals(
  localYmd: string,
  timeZone: string,
  appointments: CalculateAvailableSlotsInput["appointments"],
  blocks: CalculateAvailableSlotsInput["scheduleBlocks"],
  bufferBefore: number,
  bufferAfter: number,
): MinuteInterval[] {
  const pieces: MinuteInterval[] = [];
  const all = [...appointments, ...blocks];
  for (const b of all) {
    const s = new Date(b.startsAt.getTime() - bufferBefore * 60 * 1000);
    const e = new Date(b.endsAt.getTime() + bufferAfter * 60 * 1000);
    pieces.push(...utcRangeToZonedDayMinuteIntervals(s, e, localYmd, timeZone));
  }
  return mergeIntervals(pieces);
}

function initialWindowFromWeeklyRule(rule: WeeklyAvailabilityRuleInput): MinuteInterval[] {
  const start = parseTimeToMinutes(rule.startTime);
  const end = parseTimeToMinutes(rule.endTime);
  const clipped = clipToDay({ start, end });
  return clipped ? [clipped] : [];
}

function weeklyUnavailableCutsForRule(
  rule: WeeklyAvailabilityRuleInput,
  weeklyUnavailable: WeeklyAvailabilityRuleInput[],
): MinuteInterval[] {
  const cuts: MinuteInterval[] = [];
  for (const u of weeklyUnavailable) {
    if (!unavailableTouchesChannel(u, rule.modality, rule.addressId)) continue;
    const start = parseTimeToMinutes(u.startTime);
    const end = parseTimeToMinutes(u.endTime);
    const c = clipToDay({ start, end });
    if (c) cuts.push(c);
  }
  return mergeIntervals(cuts);
}

function unavailableTouchesChannel(
  u: WeeklyAvailabilityRuleInput,
  modality: AgendaModality,
  addressId: string | null,
): boolean {
  if (u.modality === "ONLINE" && modality === "ONLINE") return true;
  if (u.modality === "PRESENTIAL" && modality === "PRESENTIAL") {
    return u.addressId != null && u.addressId === addressId;
  }
  return false;
}

function applyWeeklyUnavailable(
  windows: MinuteInterval[],
  rule: WeeklyAvailabilityRuleInput,
  weeklyUnavailable: WeeklyAvailabilityRuleInput[],
): MinuteInterval[] {
  const cuts = weeklyUnavailableCutsForRule(rule, weeklyUnavailable);
  if (cuts.length === 0) return windows;
  return subtractMany(windows, cuts);
}

function applyExceptionsInactive(
  windows: MinuteInterval[],
  rule: WeeklyAvailabilityRuleInput,
  dayExceptions: AgendaExceptionInput[],
): MinuteInterval[] {
  let result = windows;
  for (const ex of dayExceptions) {
    if (ex.kind === "ACTIVE_OVERRIDE_INTERVAL") continue;
    if (ex.kind === "INACTIVE_DAY" && ex.addressId) {
      if (rule.modality === "PRESENTIAL" && rule.addressId === ex.addressId) {
        result = [];
      }
      continue;
    }
    if (ex.kind === "INACTIVE_DAY" && !ex.addressId) {
      result = [];
      continue;
    }
    if (ex.kind === "INACTIVE_INTERVAL" && ex.startTime && ex.endTime) {
      const start = parseTimeToMinutes(ex.startTime);
      const end = parseTimeToMinutes(ex.endTime);
      const interval = clipToDay({ start, end });
      if (!interval) continue;
      if (!ex.addressId) {
        result = subtractMany(result, [interval]);
      } else if (rule.modality === "PRESENTIAL" && rule.addressId === ex.addressId) {
        result = subtractMany(result, [interval]);
      }
    }
  }
  return result;
}

/**
 * Janelas extras: `ACTIVE_OVERRIDE_INTERVAL`.
 * Sem `addressId` → canal ONLINE; com `addressId` → PRESENTIAL naquele endereço.
 */
function activeOverrideWindowsForChannel(
  modality: AgendaModality,
  addressId: string | null,
  dayExceptions: AgendaExceptionInput[],
): MinuteInterval[] {
  const out: MinuteInterval[] = [];
  for (const ex of dayExceptions) {
    if (ex.kind !== "ACTIVE_OVERRIDE_INTERVAL" || !ex.startTime || !ex.endTime) continue;
    const start = parseTimeToMinutes(ex.startTime);
    const end = parseTimeToMinutes(ex.endTime);
    const w = clipToDay({ start, end });
    if (!w) continue;
    if (!ex.addressId) {
      if (modality === "ONLINE" && !addressId) out.push(w);
    } else if (
      modality === "PRESENTIAL" &&
      addressId &&
      ex.addressId === addressId
    ) {
      out.push(w);
    }
  }
  return mergeIntervals(out);
}

function emitSlotsInSegment(opts: {
  segment: MinuteInterval;
  durationMinutes: number;
  bufferAfterMinutes: number;
  bufferBeforeFirstMinutes: number;
  localYmd: string;
  timeZone: string;
  modality: AgendaModality;
  addressId: string | null;
}): AgendaAvailableSlot[] {
  const {
    segment,
    durationMinutes,
    bufferAfterMinutes,
    bufferBeforeFirstMinutes,
    localYmd,
    timeZone,
    modality,
    addressId,
  } = opts;

  const list: AgendaAvailableSlot[] = [];
  let cursor = segment.start + bufferBeforeFirstMinutes;
  while (cursor + durationMinutes <= segment.end) {
    const start = zonedDayMinutesToUtcDate(localYmd, cursor, timeZone);
    const end = zonedDayMinutesToUtcDate(localYmd, cursor + durationMinutes, timeZone);
    list.push({ start, end, mode: modality, addressId });
    cursor = cursor + durationMinutes + bufferAfterMinutes;
  }
  return list;
}

/**
 * Overrides sem nenhuma regra AVAILABLE que cubra o mesmo canal/dia (ex.: dia extra só com exceção).
 */
function collectOrphanActiveOverrides(
  weeklyAvailable: WeeklyAvailabilityRuleInput[],
  dayExceptions: AgendaExceptionInput[],
  globalBusy: MinuteInterval[],
  localYmd: string,
  timeZone: string,
  defaultDuration: number,
  bufBefore: number,
  bufAfter: number,
): AgendaAvailableSlot[] {
  const overrides = dayExceptions.filter(
    (e) => e.kind === "ACTIVE_OVERRIDE_INTERVAL" && e.startTime && e.endTime,
  );
  const out: AgendaAvailableSlot[] = [];
  for (const ex of overrides) {
    const modality: AgendaModality = ex.addressId ? "PRESENTIAL" : "ONLINE";
    const addressId = ex.addressId ?? null;
    const hasWeekly = weeklyAvailable.some(
      (r) => r.modality === modality && r.addressId === addressId,
    );
    if (hasWeekly) continue;
    const start = parseTimeToMinutes(ex.startTime!);
    const end = parseTimeToMinutes(ex.endTime!);
    const w = clipToDay({ start, end });
    if (!w) continue;
    const free = mergeIntervals(subtractMany([w], globalBusy));
    for (const seg of free) {
      out.push(
        ...emitSlotsInSegment({
          segment: seg,
          durationMinutes: defaultDuration,
          bufferAfterMinutes: bufAfter,
          bufferBeforeFirstMinutes: bufBefore,
          localYmd: localYmd,
          timeZone,
          modality,
          addressId,
        }),
      );
    }
  }
  return out;
}

/** Overrides órfãos sem aplicar remoção por ocupação (grade teórica). */
function collectOrphanTheoreticalOverrides(
  weeklyAvailable: WeeklyAvailabilityRuleInput[],
  dayExceptions: AgendaExceptionInput[],
  localYmd: string,
  timeZone: string,
  defaultDuration: number,
  bufBefore: number,
  bufAfter: number,
): AgendaAvailableSlot[] {
  const overrides = dayExceptions.filter(
    (e) => e.kind === "ACTIVE_OVERRIDE_INTERVAL" && e.startTime && e.endTime,
  );
  const out: AgendaAvailableSlot[] = [];
  for (const ex of overrides) {
    const modality: AgendaModality = ex.addressId ? "PRESENTIAL" : "ONLINE";
    const addressId = ex.addressId ?? null;
    const hasWeekly = weeklyAvailable.some(
      (r) => r.modality === modality && r.addressId === addressId,
    );
    if (hasWeekly) continue;
    const start = parseTimeToMinutes(ex.startTime!);
    const end = parseTimeToMinutes(ex.endTime!);
    const w = clipToDay({ start, end });
    if (!w) continue;
    const free = mergeIntervals([w]);
    for (const seg of free) {
      out.push(
        ...emitSlotsInSegment({
          segment: seg,
          durationMinutes: defaultDuration,
          bufferAfterMinutes: bufAfter,
          bufferBeforeFirstMinutes: bufBefore,
          localYmd: localYmd,
          timeZone,
          modality,
          addressId,
        }),
      );
    }
  }
  return out;
}
