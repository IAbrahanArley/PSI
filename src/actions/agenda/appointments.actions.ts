"use server";

import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  listAppointmentsByDaySchema,
  listAppointmentsByWeekSchema,
  rescheduleAppointmentSchema,
  setAppointmentStatusSchema,
} from "@/lib/validation/agenda/appointments.schema";
import {
  cancelAppointmentService,
  createAppointmentService,
  listAppointmentsByDayService,
  listAppointmentsByWeekService,
  rescheduleAppointmentService,
  setAppointmentStatusService,
} from "@/services/agenda/appointments.service";
import { requirePsychologist } from "@/server/auth/require-psychologist";

export async function listPsychologistAppointmentsByDayAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = listAppointmentsByDaySchema.parse(input);
  return listAppointmentsByDayService(ctx, parsed);
}

export async function listPsychologistAppointmentsByWeekAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = listAppointmentsByWeekSchema.parse(input);
  return listAppointmentsByWeekService(ctx, parsed);
}

export async function setPsychologistAppointmentStatusAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = setAppointmentStatusSchema.parse(input);
  return setAppointmentStatusService(ctx, parsed);
}

export async function createPsychologistAppointmentAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = createAppointmentSchema.parse(input);
  return createAppointmentService(ctx, parsed);
}

export async function cancelPsychologistAppointmentAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = cancelAppointmentSchema.parse(input);
  return cancelAppointmentService(ctx, parsed);
}

export async function reschedulePsychologistAppointmentAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = rescheduleAppointmentSchema.parse(input);
  return rescheduleAppointmentService(ctx, parsed);
}
