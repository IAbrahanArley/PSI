import { dbListPatientsForPsychologist } from "@/lib/db/queries/psychologist-clinical.queries";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";

export async function listPatientsForPsychologistService(
  ctx: PsychologistSessionContext,
  search?: string,
) {
  return dbListPatientsForPsychologist(ctx.psychologistId, search);
}
