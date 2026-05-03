"use server";

import { asc, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSpecialties, psychologists } from "@/lib/db/schema";
import type { PublicPsychologist } from "./types";
import { normalizeListingCity } from "@/lib/listing-city";
import { publicPsychologistListingWhere } from "./team-feed-where";
import { getPublicSocialLinksByPsychologistIds } from "./social-links";

export type GetPublicPsychologistsOptions = {
  limit?: number;
  /** Slug do catálogo ou label legado (case-insensitive). Omitir, vazio ou "todos" = todos. */
  specialty?: string | null;
  /** Valor exibido em filtros: `lower(trim(cidade))`. */
  city?: string | null;
  /** Lista inicial: aleatória (home) ou por nome (time). */
  order?: "random" | "name";
};

function normalizeSpecialtyRaw(raw: string | null | undefined): string | null {
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
  let cityRaw: string | null | undefined;
  let order: "random" | "name" = "random";

  if (typeof limitOrOptions === "number") {
    limit = limitOrOptions;
  } else {
    limit = limitOrOptions.limit ?? 4;
    specialtyRaw = limitOrOptions.specialty;
    cityRaw = limitOrOptions.city;
    order = limitOrOptions.order ?? "random";
  }

  if (!Number.isFinite(limit) || limit < 1) limit = 4;
  if (limit > 100) limit = 100;

  const specialtyFilter = normalizeSpecialtyRaw(specialtyRaw ?? null);
  const cityKey = normalizeListingCity(cityRaw ?? null);

  const whereClause = await publicPsychologistListingWhere({
    specialtyParam: specialtyFilter,
    cityParam: cityKey,
  });

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

  const socialLinksByPsy = await getPublicSocialLinksByPsychologistIds(ids);

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
    socialLinks: socialLinksByPsy.get(r.id) ?? [],
  }));
}
