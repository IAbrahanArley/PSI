"use server";

import {
  createWeeklyRuleSchema,
  deleteWeeklyRuleSchema,
  updateWeeklyRuleSchema,
} from "@/lib/validation/agenda/weekly-availability.schema";
import {
  createWeeklyRuleService,
  deleteWeeklyRuleService,
  listWeeklyRulesService,
  updateWeeklyRuleService,
} from "@/services/agenda/weekly-availability.service";
import { requirePsychologist } from "@/server/auth/require-psychologist";

export async function listWeeklyAvailabilityRulesAction() {
  const ctx = await requirePsychologist();
  return listWeeklyRulesService(ctx);
}

export async function createWeeklyAvailabilityRuleAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = createWeeklyRuleSchema.parse(input);
  return createWeeklyRuleService(ctx, parsed);
}

export async function updateWeeklyAvailabilityRuleAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = updateWeeklyRuleSchema.parse(input);
  return updateWeeklyRuleService(ctx, parsed);
}

export async function deleteWeeklyAvailabilityRuleAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = deleteWeeklyRuleSchema.parse(input);
  return deleteWeeklyRuleService(ctx, parsed);
}
