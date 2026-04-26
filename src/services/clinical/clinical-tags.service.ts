import { dbInsertClinicalTag } from "@/lib/db/queries/psychologist-clinical.queries";
import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";
import type { createClinicalTagSchema } from "@/lib/validation/clinical/clinical.schema";
import type { z } from "zod";

export async function createClinicalTagService(
  ctx: PsychologistSessionContext,
  input: z.infer<typeof createClinicalTagSchema>,
) {
  const label = input.label.trim().toLowerCase();
  if (!label) throw new Error("Rótulo inválido.");
  const row = await dbInsertClinicalTag({
    psychologistId: ctx.psychologistId,
    label,
    color: input.color?.trim() || null,
    sortOrder: 0,
  });
  if (!row) throw new Error("Não foi possível criar a tag (talvez já exista).");
  return row;
}
