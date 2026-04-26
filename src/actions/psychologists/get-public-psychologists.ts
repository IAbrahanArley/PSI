"use server";

import { and, asc, inArray, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSpecialties, psychologists } from "@/lib/db/schema";
import type { PublicPsychologist } from "./types";

export type GetPublicPsychologistsOptions = {
  limit?: number;
  /** Label exato da especialidade (case-insensitive). Omitir, vazio ou "todos" = todos. */
  specialty?: string | null;
  /** Lista inicial: aleatória (home) ou por nome (time). */
  order?: "random" | "name";
};

function normalizeSpecialtyFilter(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t.toLowerCase() === "todos") return null;
  return t;
}

export async function getPublicPsychologists(
  limitOrOptions: number | GetPublicPsychologistsOptions = 4,
): Promise<PublicPsychologist[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  let limit = 4;
  let specialtyRaw: string | null | undefined;
  let order: "random" | "name" = "random";

  if (typeof limitOrOptions === "number") {
    limit = limitOrOptions;
  } else {
    limit = limitOrOptions.limit ?? 4;
    specialtyRaw = limitOrOptions.specialty;
    order = limitOrOptions.order ?? "random";
  }

  if (!Number.isFinite(limit) || limit < 1) limit = 4;
  if (limit > 100) limit = 100;

  const specialtyFilter = normalizeSpecialtyFilter(specialtyRaw ?? null);

  const statusOk = notInArray(psychologists.status, ["REJECTED", "INACTIVE"]);

  const specialtyNorm = specialtyFilter ? specialtyFilter.trim().toLowerCase() : "";

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

  const whereClause = specialtyMatch ? and(statusOk, specialtyMatch) : statusOk;

  const orderBy =
    order === "name"
      ? [asc(psychologists.professionalName), asc(psychologists.fullName)]
      : [sql`random()`];

  const rows = await db
    .select({
      id: psychologists.id,
      slug: psychologists.slug,
      fullName: psychologists.fullName,
      professionalName: psychologists.professionalName,
      specialty: psychologists.specialty,
      profileImageUrl: psychologists.profileImageUrl,
    })
    .from(psychologists)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit);

  const ids = rows.map((r) => r.id);
  const firstSpecByPsy = new Map<string, string>();

  if (ids.length > 0) {
    const specs = await db
      .select({
        psychologistId: psychologistSpecialties.psychologistId,
        label: psychologistSpecialties.label,
      })
      .from(psychologistSpecialties)
      .where(inArray(psychologistSpecialties.psychologistId, ids))
      .orderBy(asc(psychologistSpecialties.psychologistId), asc(psychologistSpecialties.sortOrder));

    for (const s of specs) {
      if (!firstSpecByPsy.has(s.psychologistId)) firstSpecByPsy.set(s.psychologistId, s.label);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    displayName: (r.professionalName?.trim() || r.fullName).trim(),
    specialty: firstSpecByPsy.get(r.id) ?? r.specialty ?? "",
    profileImageUrl: r.profileImageUrl,
  }));
}
