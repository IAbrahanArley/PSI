import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAddresses } from "@/lib/db/schema";
import {
  dbDeleteWeeklyRule,
  dbGetWeeklyRuleById,
  dbInsertWeeklyRule,
  dbListWeeklyRulesByPsychologist,
  dbUpdateWeeklyRule,
} from "@/lib/db/queries/agenda/weekly-availability.queries";
import type {
  CreateWeeklyRuleInput,
  DeleteWeeklyRuleInput,
  UpdateWeeklyRuleInput,
} from "@/lib/validation/agenda/weekly-availability.schema";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";

function normalizeTimeForPg(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
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

export async function listWeeklyRulesService(ctx: PsychologistSessionContext) {
  return dbListWeeklyRulesByPsychologist(ctx.psychologistId);
}

export async function createWeeklyRuleService(ctx: PsychologistSessionContext, input: CreateWeeklyRuleInput) {
  if (input.modality === "PRESENTIAL" && input.addressId) {
    await assertAddressBelongsToPsychologist(input.addressId, ctx.psychologistId);
  }

  return dbInsertWeeklyRule({
    psychologistId: ctx.psychologistId,
    weekday: input.weekday,
    startTime: normalizeTimeForPg(input.startTime),
    endTime: normalizeTimeForPg(input.endTime),
    ruleType: input.ruleType,
    modality: input.modality,
    addressId: input.modality === "ONLINE" ? null : input.addressId!,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateWeeklyRuleService(ctx: PsychologistSessionContext, input: UpdateWeeklyRuleInput) {
  const existing = await dbGetWeeklyRuleById(input.id, ctx.psychologistId);
  if (!existing) {
    throw new Error("Regra não encontrada.");
  }

  const modality = input.modality ?? existing.modality;
  const addressId =
    input.addressId !== undefined ? input.addressId : existing.addressId;

  if (modality === "ONLINE" && addressId != null) {
    throw new Error("Online não pode ter endereço.");
  }
  if (modality === "PRESENTIAL" && !addressId) {
    throw new Error("Presencial exige endereço.");
  }
  if (modality === "PRESENTIAL" && addressId) {
    await assertAddressBelongsToPsychologist(addressId, ctx.psychologistId);
  }

  const patch = {
    ...(input.weekday !== undefined ? { weekday: input.weekday } : {}),
    ...(input.startTime !== undefined ? { startTime: normalizeTimeForPg(input.startTime) } : {}),
    ...(input.endTime !== undefined ? { endTime: normalizeTimeForPg(input.endTime) } : {}),
    ...(input.ruleType !== undefined ? { ruleType: input.ruleType } : {}),
    ...(input.modality !== undefined ? { modality: input.modality } : {}),
    ...(input.addressId !== undefined
      ? { addressId: modality === "ONLINE" ? null : addressId }
      : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  return dbUpdateWeeklyRule(input.id, ctx.psychologistId, patch);
}

export async function deleteWeeklyRuleService(ctx: PsychologistSessionContext, input: DeleteWeeklyRuleInput) {
  const row = await dbDeleteWeeklyRule(input.id, ctx.psychologistId);
  if (!row) {
    throw new Error("Regra não encontrada.");
  }
  return row;
}
