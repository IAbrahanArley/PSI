"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSpecialties, psychologists } from "@/lib/db/schema";

/** Especialidades distintas de psicólogos ativos (tabela + campo legado). */
export async function getPublicSpecialtyLabels(): Promise<string[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  const activePsych = notInArray(psychologists.status, ["REJECTED", "INACTIVE"]);

  const fromTable = await db
    .select({ label: psychologistSpecialties.label })
    .from(psychologistSpecialties)
    .innerJoin(psychologists, eq(psychologistSpecialties.psychologistId, psychologists.id))
    .where(and(activePsych, sql`trim(${psychologistSpecialties.label}) <> ''`))
    .groupBy(psychologistSpecialties.label);

  const fromLegacy = await db
    .select({ specialty: psychologists.specialty })
    .from(psychologists)
    .where(
      and(activePsych, sql`coalesce(trim(${psychologists.specialty}), '') <> ''`),
    )
    .groupBy(psychologists.specialty);

  const set = new Set<string>();
  for (const r of fromTable) {
    const t = r.label?.trim();
    if (t) set.add(t);
  }
  for (const r of fromLegacy) {
    const t = r.specialty?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
