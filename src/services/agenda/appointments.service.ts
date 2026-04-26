import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAddresses, patients } from "@/lib/db/schema";
import {
  dbGetAppointmentForPsychologist,
  dbInsertAppointment,
  dbInsertAppointmentStatusEvent,
  dbListAppointmentsInUtcRangeWithDetails,
  dbListAppointmentsOverlappingRange,
  dbUpdateAppointment,
} from "@/lib/db/queries/agenda/appointments.queries";
import {
  findEndOfZonedDayUtcMs,
  findStartOfZonedDayUtcMs,
  getSundayWeekRangeUtc,
} from "@/lib/agenda/zoned-time";
import type {
  CancelAppointmentInput,
  CreateAppointmentInput,
  ListAppointmentsByDayInput,
  ListAppointmentsByWeekInput,
  RescheduleAppointmentInput,
  SetAppointmentStatusInput,
} from "@/lib/validation/agenda/appointments.schema";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";

async function assertPatientExists(patientId: string) {
  const [row] = await db.select({ id: patients.id }).from(patients).where(eq(patients.id, patientId)).limit(1);
  if (!row) {
    throw new Error("Paciente não encontrado.");
  }
}

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
    throw new Error("Endereço não encontrado ou não pertence a este psicólogo.");
  }
}

async function throwIfOverlap(
  psychologistId: string,
  startsAt: Date,
  endsAt: Date,
  excludeAppointmentId?: string,
) {
  const hits = await dbListAppointmentsOverlappingRange(
    psychologistId,
    startsAt,
    endsAt,
    excludeAppointmentId,
  );
  if (hits.length > 0) {
    throw new Error("Horário conflita com outro agendamento ativo.");
  }
}

export async function listAppointmentsByDayService(
  ctx: PsychologistSessionContext,
  input: ListAppointmentsByDayInput,
) {
  const rangeStart = new Date(findStartOfZonedDayUtcMs(input.localDate, input.timeZone));
  const rangeEnd = new Date(findEndOfZonedDayUtcMs(input.localDate, input.timeZone));
  return dbListAppointmentsInUtcRangeWithDetails(ctx.psychologistId, rangeStart, rangeEnd);
}

export async function listAppointmentsByWeekService(
  ctx: PsychologistSessionContext,
  input: ListAppointmentsByWeekInput,
) {
  const { rangeStartUtc, rangeEndUtc } = getSundayWeekRangeUtc(input.anchorLocalDate, input.timeZone);
  return dbListAppointmentsInUtcRangeWithDetails(ctx.psychologistId, rangeStartUtc, rangeEndUtc);
}

export async function createAppointmentService(ctx: PsychologistSessionContext, input: CreateAppointmentInput) {
  await assertPatientExists(input.patientId);
  if (input.modality === "PRESENTIAL" && input.addressId) {
    await assertAddressBelongsToPsychologist(input.addressId, ctx.psychologistId);
  }

  await throwIfOverlap(ctx.psychologistId, input.startsAt, input.endsAt);

  const row = await dbInsertAppointment({
    psychologistId: ctx.psychologistId,
    patientId: input.patientId,
    modality: input.modality,
    addressId: input.modality === "ONLINE" ? null : input.addressId!,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: "SCHEDULED",
    title: input.title ?? null,
    notes: input.notes ?? null,
  });

  if (row) {
    await dbInsertAppointmentStatusEvent({
      appointmentId: row.id,
      fromStatus: null,
      toStatus: "SCHEDULED",
      changedByUserId: ctx.userId,
      note: null,
    });
  }

  return row;
}

export async function cancelAppointmentService(ctx: PsychologistSessionContext, input: CancelAppointmentInput) {
  const existing = await dbGetAppointmentForPsychologist(input.appointmentId, ctx.psychologistId);
  if (!existing) {
    throw new Error("Agendamento não encontrado.");
  }
  if (existing.status === "CANCELLED") {
    throw new Error("Agendamento já cancelado.");
  }

  const from = existing.status;
  const updated = await dbUpdateAppointment(input.appointmentId, ctx.psychologistId, {
    status: "CANCELLED",
    cancellationReason: input.reason ?? null,
    cancelledAt: new Date(),
  });

  if (updated) {
    await dbInsertAppointmentStatusEvent({
      appointmentId: updated.id,
      fromStatus: from,
      toStatus: "CANCELLED",
      changedByUserId: ctx.userId,
      note: input.reason ?? null,
    });
  }

  return updated;
}

export async function rescheduleAppointmentService(
  ctx: PsychologistSessionContext,
  input: RescheduleAppointmentInput,
) {
  const existing = await dbGetAppointmentForPsychologist(input.appointmentId, ctx.psychologistId);
  if (!existing) {
    throw new Error("Agendamento não encontrado.");
  }
  if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
    throw new Error("Não é possível remarcar este agendamento.");
  }

  await throwIfOverlap(ctx.psychologistId, input.startsAt, input.endsAt, input.appointmentId);

  const from = existing.status;
  const updated = await dbUpdateAppointment(input.appointmentId, ctx.psychologistId, {
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });

  if (updated) {
    await dbInsertAppointmentStatusEvent({
      appointmentId: updated.id,
      fromStatus: from,
      toStatus: from,
      changedByUserId: ctx.userId,
      note: "Remarcação",
    });
  }

  return updated;
}

export async function setAppointmentStatusService(
  ctx: PsychologistSessionContext,
  input: SetAppointmentStatusInput,
) {
  const existing = await dbGetAppointmentForPsychologist(input.appointmentId, ctx.psychologistId);
  if (!existing) {
    throw new Error("Agendamento não encontrado.");
  }

  if (input.status === "CONFIRMED") {
    if (existing.status !== "SCHEDULED") {
      throw new Error("Só é possível confirmar consultas agendadas.");
    }
  } else if (input.status === "COMPLETED") {
    if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
      throw new Error("Não é possível concluir este agendamento.");
    }
  }

  const from = existing.status;
  const updated = await dbUpdateAppointment(input.appointmentId, ctx.psychologistId, {
    status: input.status,
  });

  if (updated) {
    await dbInsertAppointmentStatusEvent({
      appointmentId: updated.id,
      fromStatus: from,
      toStatus: input.status,
      changedByUserId: ctx.userId,
      note: null,
    });
  }

  return updated;
}
