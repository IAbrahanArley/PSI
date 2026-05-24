import {
  dbGetCareByPsychologistPatient,
  dbPsychologistHasPatientLink,
  dbUpdatePatientCare,
  dbUpsertPsychologistPatientCare,
} from "@/lib/db/queries/psychologist-clinical.queries";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";
import type { updatePatientCareSchema } from "@/lib/validation/clinical/clinical.schema";
import { assertPatientLimitService } from "@/services/subscriptions/subscription.service";
import type { z } from "zod";

export async function getPatientCareService(ctx: PsychologistSessionContext, patientId: string) {
  const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, patientId);
  if (!linked) {
    throw new Error("Paciente não encontrado ou sem vínculo com sua prática.");
  }

  // Verifica se já existe vínculo antes de checar o limite:
  // o limite só se aplica ao criar um vínculo NOVO.
  const existing = await dbGetCareByPsychologistPatient(ctx.psychologistId, patientId);
  if (!existing) {
    await assertPatientLimitService(ctx.psychologistId);
  }

  const row = existing ?? await dbUpsertPsychologistPatientCare({
    psychologistId: ctx.psychologistId,
    patientId,
  });
  return row;
}

export async function updatePatientCareService(
  ctx: PsychologistSessionContext,
  patientId: string,
  input: z.infer<typeof updatePatientCareSchema>,
) {
  const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, patientId);
  if (!linked) {
    throw new Error("Paciente não encontrado ou sem vínculo com sua prática.");
  }
  await dbUpsertPsychologistPatientCare({
    psychologistId: ctx.psychologistId,
    patientId,
  });

  const now = new Date();
  const patch: Parameters<typeof dbUpdatePatientCare>[2] = {};

  if (input.clinicalSummary !== undefined) {
    patch.clinicalSummary = input.clinicalSummary?.trim() || null;
  }

  if (input.status) {
    patch.status = input.status;
    if (input.status === "PAUSED") {
      patch.pausedAt = now;
    }
    if (input.status === "ACTIVE") {
      patch.pausedAt = null;
      patch.dischargedAt = null;
    }
    if (input.status === "DISCHARGED") {
      patch.dischargedAt = now;
    }
  }

  const row = await dbUpdatePatientCare(ctx.psychologistId, patientId, patch);
  if (!row) throw new Error("Não foi possível atualizar o caso clínico.");
  return row;
}
