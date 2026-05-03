"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSpecialties, psychologists } from "@/lib/db/schema";
import type { PublicPsychologist } from "./types";
import { normalizeListingCity } from "@/lib/listing-city";
import { publicPsychologistListingWhere } from "./team-feed-where";
import { getPublicSocialLinksByPsychologistIds } from "./social-links";

export type TeamRegularChunk = {
  items: PublicPsychologist[];
  nextOffset: number;
  hasMore: boolean;
};

function normalizeSpecialty(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t.toLowerCase() === "todos") return null;
  return t;
}

export async function getTeamRegularChunk(input: {
  specialty?: string | null;
  /** Valor para filtro `lower(trim(psychologists.city))`. */
  city?: string | null;
  offset: number;
  limit: number;
}): Promise<TeamRegularChunk> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { items: [], nextOffset: 0, hasMore: false };
  }

  const specialty = normalizeSpecialty(input.specialty ?? null);
  const cityKey = normalizeListingCity(input.city ?? null);
  const offset = Math.max(0, input.offset);
  const limit = Math.min(Math.max(1, input.limit), 24);
  const fetchN = limit + 1;

  const base = await publicPsychologistListingWhere({
    specialtyParam: specialty,
    cityParam: cityKey,
  });
  const whereClause = and(base, eq(psychologists.advertisingHighlight, false));

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
    .orderBy(asc(psychologists.professionalName), asc(psychologists.fullName))
    .offset(offset)
    .limit(fetchN);

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const ids = slice.map((r) => r.id);
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

  const items: PublicPsychologist[] = slice.map((r) => ({
    id: r.id,
    slug: r.slug,
    displayName: (r.professionalName?.trim() || r.fullName).trim(),
    specialty: firstSpecByPsy.get(r.id) ?? r.specialty ?? "",
    profileImageUrl: r.profileImageUrl,
    socialLinks: socialLinksByPsy.get(r.id) ?? [],
  }));

  return {
    items,
    nextOffset: offset + items.length,
    hasMore,
  };
}
