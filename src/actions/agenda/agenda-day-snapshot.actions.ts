"use server";

import { getAgendaDaySnapshotSchema } from "@/lib/validation/agenda/agenda-day-snapshot.schema";
import { getAgendaDaySnapshotService } from "@/services/agenda/agenda-day-snapshot.service";
import { requirePsychologist } from "@/server/auth/require-psychologist";

export async function getPsychologistAgendaDaySnapshotAction(input: unknown) {
  const ctx = await requirePsychologist();
  const parsed = getAgendaDaySnapshotSchema.parse(input);
  return getAgendaDaySnapshotService(ctx, parsed);
}
