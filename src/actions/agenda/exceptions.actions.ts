"use server";

import {
  createAgendaExceptionSchema,
  listExceptionsByPeriodSchema,
} from "@/lib/validation/agenda/exceptions.schema";
import {
  createAgendaExceptionService,
  listExceptionsByPeriodService,
} from "@/services/agenda/exceptions.service";
import { requirePsychologist } from "@/server/auth/require-psychologist";

export async function listAgendaExceptionsByPeriodAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = listExceptionsByPeriodSchema.parse(input);
  return listExceptionsByPeriodService(ctx, parsed);
}

export async function createAgendaExceptionAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = createAgendaExceptionSchema.parse(input);
  return createAgendaExceptionService(ctx, parsed);
}
