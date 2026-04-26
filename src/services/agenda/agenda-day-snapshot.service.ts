import { eq } from "drizzle-orm";
import { calculateAvailableSlots } from "@/lib/agenda/calculate-available-slots";
import type { AgendaAvailableSlot, AgendaExceptionInput, WeeklyAvailabilityRuleInput } from "@/lib/agenda/types";
import { findEndOfZonedDayUtcMs, findStartOfZonedDayUtcMs } from "@/lib/agenda/zoned-time";
import { db } from "@/lib/db";
import { dbListAppointmentsInUtcRangeWithDetails } from "@/lib/db/queries/agenda/appointments.queries";
import { dbListExceptionsBetween } from "@/lib/db/queries/agenda/exceptions.queries";
import { dbListActiveScheduleBlocksOverlappingUtcRange } from "@/lib/db/queries/agenda/schedule-blocks.queries";
import { dbListWeeklyRulesByPsychologist } from "@/lib/db/queries/agenda/weekly-availability.queries";
import { psychologistAddresses, psychologists } from "@/lib/db/schema";
import type { GetAgendaDaySnapshotInput } from "@/lib/validation/agenda/agenda-day-snapshot.schema";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";
import type {
  AgendaAppointmentListItem,
  AgendaDaySnapshot,
  AgendaFreeSlotItem,
} from "@/app/dashboard/psicologo/agenda/_components/agenda-screen/types";

function formatZonedClock(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function timeToString(t: unknown): string {
  if (t == null) return "";
  if (typeof t === "string") return t;
  return String(t);
}

export async function getAgendaDaySnapshotService(
  ctx: PsychologistSessionContext,
  input: GetAgendaDaySnapshotInput,
): Promise<AgendaDaySnapshot> {
  const { localDate, timeZone } = input;
  const rangeStart = new Date(findStartOfZonedDayUtcMs(localDate, timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(localDate, timeZone));

  const [appointmentRows, weeklyRows, exceptionRows, blockRows, addressRows, psychRows] = await Promise.all([
    dbListAppointmentsInUtcRangeWithDetails(ctx.psychologistId, rangeStart, rangeEnd),
    dbListWeeklyRulesByPsychologist(ctx.psychologistId),
    dbListExceptionsBetween(ctx.psychologistId, localDate, localDate),
    dbListActiveScheduleBlocksOverlappingUtcRange(ctx.psychologistId, rangeStart, rangeEnd),
    db
      .select({ id: psychologistAddresses.id, label: psychologistAddresses.label })
      .from(psychologistAddresses)
      .where(eq(psychologistAddresses.psychologistId, ctx.psychologistId)),
    db
      .select({ sessionDurationMinutes: psychologists.sessionDurationMinutes })
      .from(psychologists)
      .where(eq(psychologists.id, ctx.psychologistId))
      .limit(1),
  ]);

  const addressById = new Map(addressRows.map((a) => [a.id, a.label]));

  const weeklyRules: WeeklyAvailabilityRuleInput[] = weeklyRows.map((r) => ({
    weekday: Number(r.weekday),
    startTime: timeToString(r.startTime),
    endTime: timeToString(r.endTime),
    ruleType: r.ruleType,
    modality: r.modality,
    addressId: r.addressId,
    isActive: r.isActive,
    sortOrder: r.sortOrder ?? undefined,
  }));

  const exceptions: AgendaExceptionInput[] = exceptionRows.map((r) => ({
    exceptionDate: r.exceptionDate,
    kind: r.kind,
    startTime: r.startTime != null ? timeToString(r.startTime) : null,
    endTime: r.endTime != null ? timeToString(r.endTime) : null,
    addressId: r.addressId,
    isActive: r.isActive,
  }));

  const busyAppointments = appointmentRows
    .filter((a) => a.status !== "CANCELLED")
    .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));

  const scheduleBlocks = blockRows.map((b) => ({
    startsAt: b.startsAt,
    endsAt: b.endsAt,
  }));

  const defaultSessionDurationMinutes = psychRows[0]?.sessionDurationMinutes ?? 50;

  let freeSlotsRaw: AgendaAvailableSlot[] = [];
  try {
    freeSlotsRaw = calculateAvailableSlots({
      localDate,
      timeZone,
      defaultSessionDurationMinutes,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      weeklyRules,
      exceptions,
      appointments: busyAppointments,
      scheduleBlocks,
    });
  } catch {
    freeSlotsRaw = [];
  }

  const freeSlots: AgendaFreeSlotItem[] = freeSlotsRaw.map((s) => ({
    startLabel: formatZonedClock(s.start, timeZone),
    endLabel: formatZonedClock(s.end, timeZone),
    modality: s.mode,
    addressLabel: s.addressId ? (addressById.get(s.addressId) ?? null) : null,
  }));

  const appointments: AgendaAppointmentListItem[] = appointmentRows.map((r) => {
    const addrPresential =
      r.addressLabel ??
      ([r.addressStreet, r.addressCity].filter(Boolean).join(", ") || null);
    return {
      id: r.id,
      patientName: r.patientFullName,
      startsAtIso: r.startsAt.toISOString(),
      endsAtIso: r.endsAt.toISOString(),
      modality: r.modality,
      status: r.status,
      addressLabel: r.modality === "ONLINE" ? null : addrPresential,
      title: r.title,
    };
  });

  return {
    localDate,
    appointments,
    freeSlots,
  };
}
