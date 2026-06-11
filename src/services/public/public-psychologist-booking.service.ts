import { and, eq, notInArray } from "drizzle-orm";
import {
  agendaSlotMatchKey,
  calculateAvailableSlots,
  calculateDaySlotsWithAvailability,
  calculateTheoreticalSlots,
} from "@/lib/agenda/calculate-available-slots";
import type { AgendaExceptionInput, WeeklyAvailabilityRuleInput } from "@/lib/agenda/types";
import { findEndOfZonedDayUtcMs, findStartOfZonedDayUtcMs } from "@/lib/agenda/zoned-time";
import { db } from "@/lib/db";
import {
  dbInsertAppointment,
  dbInsertAppointmentStatusEvent,
  dbListAppointmentsInUtcRangeWithDetails,
  dbListAppointmentsOverlappingRange,
} from "@/lib/db/queries/agenda/appointments.queries";
import { dbListExceptionsBetween } from "@/lib/db/queries/agenda/exceptions.queries";
import { dbListActiveScheduleBlocksOverlappingUtcRange } from "@/lib/db/queries/agenda/schedule-blocks.queries";
import { dbListWeeklyRulesByPsychologist } from "@/lib/db/queries/agenda/weekly-availability.queries";
import {
  dbFindPatientByNormalizedEmail,
  dbInsertGuestPatient,
  dbUpdatePatientGuestContact,
  normalizePatientEmail,
} from "@/lib/db/queries/patients.queries";
import { psychologistAddresses, psychologists } from "@/lib/db/schema";

/** Timezone padrão até existir coluna no perfil do psicólogo. */
export const PUBLIC_BOOKING_TIMEZONE = "America/Sao_Paulo";

function timeToString(t: unknown): string {
  if (t == null) return "";
  if (typeof t === "string") return t;
  return String(t);
}

function mapWeeklyRules(
  weeklyRows: Awaited<ReturnType<typeof dbListWeeklyRulesByPsychologist>>,
): WeeklyAvailabilityRuleInput[] {
  return weeklyRows.map((r) => ({
    weekday: Number(r.weekday),
    startTime: timeToString(r.startTime),
    endTime: timeToString(r.endTime),
    ruleType: r.ruleType,
    modality: r.modality,
    addressId: r.addressId,
    isActive: r.isActive,
    sortOrder: r.sortOrder ?? undefined,
    slotDurationMinutes: null,
  }));
}

function mapExceptions(
  exceptionRows: Awaited<ReturnType<typeof dbListExceptionsBetween>>,
): AgendaExceptionInput[] {
  return exceptionRows.map((r) => ({
    exceptionDate: r.exceptionDate,
    kind: r.kind,
    startTime: r.startTime != null ? timeToString(r.startTime) : null,
    endTime: r.endTime != null ? timeToString(r.endTime) : null,
    addressId: r.addressId,
    isActive: r.isActive,
  }));
}

async function loadPsychologistForPublicBooking(slug: string) {
  const [row] = await db
    .select({
      id: psychologists.id,
      sessionDurationMinutes: psychologists.sessionDurationMinutes,
    })
    .from(psychologists)
    .where(
      and(eq(psychologists.slug, slug.trim()), notInArray(psychologists.status, ["REJECTED", "INACTIVE"])),
    )
    .limit(1);
  return row ?? null;
}

type AgendaPayload = {
  weeklyRules: WeeklyAvailabilityRuleInput[];
  exceptions: AgendaExceptionInput[];
  busyAppointments: { startsAt: Date; endsAt: Date }[];
  scheduleBlocks: { startsAt: Date; endsAt: Date }[];
  defaultSessionDurationMinutes: number;
  addressById: Map<string, string>;
};

async function loadAgendaPayloadForUtcRange(
  psychologistId: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
  exceptionFrom: string,
  exceptionTo: string,
  defaultSessionDurationMinutes: number,
): Promise<AgendaPayload> {
  const [appointmentRows, weeklyRows, exceptionRows, blockRows, addressRows] = await Promise.all([
    dbListAppointmentsInUtcRangeWithDetails(psychologistId, rangeStartUtc, rangeEndUtc),
    dbListWeeklyRulesByPsychologist(psychologistId),
    dbListExceptionsBetween(psychologistId, exceptionFrom, exceptionTo),
    dbListActiveScheduleBlocksOverlappingUtcRange(psychologistId, rangeStartUtc, rangeEndUtc),
    db
      .select({ id: psychologistAddresses.id, label: psychologistAddresses.label })
      .from(psychologistAddresses)
      .where(eq(psychologistAddresses.psychologistId, psychologistId)),
  ]);

  const addressById = new Map(addressRows.map((a) => [a.id, a.label]));

  const busyAppointments = appointmentRows
    .filter((a) => a.status !== "CANCELLED")
    .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));

  const scheduleBlocks = blockRows.map((b) => ({
    startsAt: b.startsAt,
    endsAt: b.endsAt,
  }));

  return {
    weeklyRules: mapWeeklyRules(weeklyRows),
    exceptions: mapExceptions(exceptionRows),
    busyAppointments,
    scheduleBlocks,
    defaultSessionDurationMinutes,
    addressById,
  };
}

function buildDayInput(
  localDate: string,
  timeZone: string,
  payload: AgendaPayload,
): Parameters<typeof calculateDaySlotsWithAvailability>[0] {
  return {
    localDate,
    timeZone,
    defaultSessionDurationMinutes: payload.defaultSessionDurationMinutes,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    weeklyRules: payload.weeklyRules,
    exceptions: payload.exceptions,
    appointments: payload.busyAppointments,
    scheduleBlocks: payload.scheduleBlocks,
  };
}

export type PublicDaySlotItem = {
  startIso: string;
  endIso: string;
  available: boolean;
  modality: "ONLINE" | "PRESENTIAL";
  addressId: string | null;
  startLabel: string;
  endLabel: string;
  addressLabel: string | null;
  slotKey: string;
};

function formatZonedClock(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export async function getPublicDaySlotsService(
  slug: string,
  localDate: string,
): Promise<{ timeZone: string; slots: PublicDaySlotItem[] } | null> {
  if (!process.env.DATABASE_URL?.trim()) return null;

  const psy = await loadPsychologistForPublicBooking(slug);
  if (!psy) return null;

  const timeZone = PUBLIC_BOOKING_TIMEZONE;
  const rangeStart = new Date(findStartOfZonedDayUtcMs(localDate, timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(localDate, timeZone));

  const payload = await loadAgendaPayloadForUtcRange(
    psy.id,
    rangeStart,
    rangeEnd,
    localDate,
    localDate,
    psy.sessionDurationMinutes,
  );

  let slotsRaw: ReturnType<typeof calculateDaySlotsWithAvailability> = [];
  try {
    slotsRaw = calculateDaySlotsWithAvailability(buildDayInput(localDate, timeZone, payload));
  } catch {
    slotsRaw = [];
  }

  const slots: PublicDaySlotItem[] = slotsRaw.map((s) => ({
    startIso: s.start.toISOString(),
    endIso: s.end.toISOString(),
    available: s.available,
    modality: s.mode,
    addressId: s.addressId,
    startLabel: formatZonedClock(s.start, timeZone),
    endLabel: formatZonedClock(s.end, timeZone),
    addressLabel: s.addressId ? (payload.addressById.get(s.addressId) ?? null) : null,
    slotKey: agendaSlotMatchKey(s),
  }));

  return { timeZone, slots };
}

/** Dias do mês civil (YYYY-MM-DD) em que existe pelo menos um horário na grade teórica. */
export async function getPublicMonthDatesWithSlotsService(
  slug: string,
  year: number,
  month1to12: number,
): Promise<{ timeZone: string; dates: string[] } | null> {
  if (!process.env.DATABASE_URL?.trim()) return null;

  const psy = await loadPsychologistForPublicBooking(slug);
  if (!psy) return null;

  const timeZone = PUBLIC_BOOKING_TIMEZONE;
  const y = year;
  const m = month1to12;
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = `${y}-${pad(m)}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${y}-${pad(m)}-${pad(lastDay)}`;

  const rangeStart = new Date(findStartOfZonedDayUtcMs(first, timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(last, timeZone));

  const payload = await loadAgendaPayloadForUtcRange(
    psy.id,
    rangeStart,
    rangeEnd,
    first,
    last,
    psy.sessionDurationMinutes,
  );

  const dates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const localDate = `${y}-${pad(m)}-${pad(d)}`;
    try {
      const theoretical = calculateTheoreticalSlots(buildDayInput(localDate, timeZone, payload));
      if (theoretical.length > 0) dates.push(localDate);
    } catch {
      /* skip */
    }
  }

  return { timeZone, dates };
}

export type PublicBookAppointmentInput = {
  fullName: string;
  email: string;
  phone: string;
  message?: string | null;
  startsAtIso: string;
  endsAtIso: string;
  modality: "ONLINE" | "PRESENTIAL";
  addressId: string | null;
};

async function assertAddressBelongsToPsychologist(addressId: string, psychologistId: string) {
  const [row] = await db
    .select({ id: psychologistAddresses.id })
    .from(psychologistAddresses)
    .where(
      and(
        eq(psychologistAddresses.id, addressId),
        eq(psychologistAddresses.psychologistId, psychologistId),
      ),
    )
    .limit(1);
  if (!row) {
    throw new Error("Endereço inválido para este profissional.");
  }
}

export type PatientBookAppointmentInput = {
  startsAtIso: string;
  endsAtIso: string;
  modality: "ONLINE" | "PRESENTIAL";
  addressId: string | null;
  message?: string | null;
  patientFullName: string;
};

/**
 * Reserva autenticada — o paciente já tem conta, não precisa de guest creation.
 */
export async function bookAuthenticatedPatientAppointmentService(
  slug: string,
  patientId: string,
  input: PatientBookAppointmentInput,
  changedByUserId: string,
): Promise<{ appointmentId: string } | "not_found" | "slot_taken" | "invalid_slot" | "conflict"> {
  if (!process.env.DATABASE_URL?.trim()) return "not_found";

  const psy = await loadPsychologistForPublicBooking(slug);
  if (!psy) return "not_found";

  const startsAt = new Date(input.startsAtIso);
  const endsAt = new Date(input.endsAtIso);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return "invalid_slot";
  }

  if (input.modality === "PRESENTIAL") {
    if (!input.addressId) return "invalid_slot";
    await assertAddressBelongsToPsychologist(input.addressId, psy.id);
  } else if (input.addressId) {
    return "invalid_slot";
  }

  const timeZone = PUBLIC_BOOKING_TIMEZONE;
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startsAt);

  const rangeStart = new Date(findStartOfZonedDayUtcMs(localDate, timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(localDate, timeZone));
  const payload = await loadAgendaPayloadForUtcRange(
    psy.id,
    rangeStart,
    rangeEnd,
    localDate,
    localDate,
    psy.sessionDurationMinutes,
  );

  let free: ReturnType<typeof calculateAvailableSlots> = [];
  try {
    free = calculateAvailableSlots(buildDayInput(localDate, timeZone, payload));
  } catch {
    return "invalid_slot";
  }

  const match = free.find(
    (s) =>
      s.start.getTime() === startsAt.getTime() &&
      s.end.getTime() === endsAt.getTime() &&
      s.mode === input.modality &&
      (s.addressId ?? null) === (input.addressId ?? null),
  );
  if (!match) return "invalid_slot";

  const overlaps = await dbListAppointmentsOverlappingRange(psy.id, startsAt, endsAt);
  if (overlaps.length > 0) return "slot_taken";

  try {
    const row = await dbInsertAppointment({
      psychologistId: psy.id,
      patientId,
      modality: input.modality,
      addressId: input.modality === "ONLINE" ? null : input.addressId!,
      startsAt,
      endsAt,
      status: "SCHEDULED",
      title: `Agendamento — ${input.patientFullName.trim()}`,
      notes: input.message?.trim() || null,
    });
    if (!row) return "conflict";

    await dbInsertAppointmentStatusEvent({
      appointmentId: row.id,
      fromStatus: null,
      toStatus: "SCHEDULED",
      changedByUserId,
      note: "Reserva pelo painel do paciente",
    });

    return { appointmentId: row.id };
  } catch {
    return "conflict";
  }
}

export async function bookPublicAppointmentService(
  slug: string,
  input: PublicBookAppointmentInput,
): Promise<{ appointmentId: string } | "not_found" | "slot_taken" | "invalid_slot" | "conflict"> {
  if (!process.env.DATABASE_URL?.trim()) return "not_found";

  const psy = await loadPsychologistForPublicBooking(slug);
  if (!psy) return "not_found";

  const startsAt = new Date(input.startsAtIso);
  const endsAt = new Date(input.endsAtIso);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return "invalid_slot";
  }

  if (input.modality === "PRESENTIAL") {
    if (!input.addressId) return "invalid_slot";
    await assertAddressBelongsToPsychologist(input.addressId, psy.id);
  } else if (input.addressId) {
    return "invalid_slot";
  }

  const timeZone = PUBLIC_BOOKING_TIMEZONE;
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startsAt);

  const rangeStart = new Date(findStartOfZonedDayUtcMs(localDate, timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(localDate, timeZone));
  const payload = await loadAgendaPayloadForUtcRange(
    psy.id,
    rangeStart,
    rangeEnd,
    localDate,
    localDate,
    psy.sessionDurationMinutes,
  );

  let free: ReturnType<typeof calculateAvailableSlots> = [];
  try {
    free = calculateAvailableSlots(buildDayInput(localDate, timeZone, payload));
  } catch {
    return "invalid_slot";
  }

  const match = free.find(
    (s) =>
      s.start.getTime() === startsAt.getTime() &&
      s.end.getTime() === endsAt.getTime() &&
      s.mode === input.modality &&
      (s.addressId ?? null) === (input.addressId ?? null),
  );
  if (!match) return "invalid_slot";

  const overlaps = await dbListAppointmentsOverlappingRange(psy.id, startsAt, endsAt);
  if (overlaps.length > 0) return "slot_taken";

  const emailNorm = normalizePatientEmail(input.email);
  let existing = await dbFindPatientByNormalizedEmail(emailNorm);
  let patientId: string;
  if (existing) {
    await dbUpdatePatientGuestContact(existing.id, {
      fullName: input.fullName,
      phone: input.phone,
    });
    patientId = existing.id;
  } else {
    const created = await dbInsertGuestPatient({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
    });
    if (!created) return "conflict";
    patientId = created.id;
  }

  try {
    const row = await dbInsertAppointment({
      psychologistId: psy.id,
      patientId,
      modality: input.modality,
      addressId: input.modality === "ONLINE" ? null : input.addressId!,
      startsAt,
      endsAt,
      status: "SCHEDULED",
      title: `Agendamento web — ${input.fullName.trim()}`,
      notes: input.message?.trim() || null,
    });
    if (!row) return "conflict";

    await dbInsertAppointmentStatusEvent({
      appointmentId: row.id,
      fromStatus: null,
      toStatus: "SCHEDULED",
      changedByUserId: null,
      note: "Reserva pelo site",
    });

    return { appointmentId: row.id };
  } catch {
    return "conflict";
  }
}
