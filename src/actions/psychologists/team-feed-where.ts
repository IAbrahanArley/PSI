import { and, notInArray, or, sql } from "drizzle-orm";
import { psychologistSpecialties, psychologists } from "@/lib/db/schema";

/** Psicólogos ativos na listagem pública, com filtro opcional por label de especialidade. */
export function publicTeamPsychologistBaseWhere(specialtyFilter: string | null) {
  const statusOk = notInArray(psychologists.status, ["REJECTED", "INACTIVE"]);
  const specialtyNorm = specialtyFilter?.trim().toLowerCase() ?? "";
  const specialtyMatch =
    specialtyFilter && specialtyNorm
      ? or(
          sql`exists (
            select 1 from psychologist_specialties ps
            where ps.psychologist_id = ${psychologists.id}
            and lower(trim(ps.label)) = ${specialtyNorm}
          )`,
          sql`lower(trim(coalesce(${psychologists.specialty}, ''))) = ${specialtyNorm}`,
        )
      : undefined;
  return specialtyMatch ? and(statusOk, specialtyMatch) : statusOk;
}
