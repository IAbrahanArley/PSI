"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSkills, psychologistSpecialties, psychologists } from "@/lib/db/schema";
import type { TeamFeaturedPsychologist } from "./types";
import { normalizeListingCity } from "@/lib/listing-city";
import { publicPsychologistListingWhere } from "./team-feed-where";
import { getPublicSocialLinksByPsychologistIds } from "./social-links";

function normalizeSpecialty(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t.toLowerCase() === "todos") return null;
  return t;
}

/** Todos os psicologos com destaque publicitario (para sortear um por fileira na /team). */
export async function getTeamAdvertisingPool(input?: {
  specialty?: string | null;
  city?: string | null;
  modality?: "ONLINE" | "PRESENTIAL" | null;
}): Promise<TeamFeaturedPsychologist[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  const specialtyNorm = normalizeSpecialty(input?.specialty ?? null);
  const cityKey = normalizeListingCity(input?.city ?? null);

  const base = await publicPsychologistListingWhere({
    specialtyParam: specialtyNorm,
    cityParam: cityKey,
    modality: input?.modality ?? null,
  });
  const whereClause = and(base, eq(psychologists.advertisingHighlight, true));

  const rows = await db
    .select({
      id: psychologists.id,
      slug: psychologists.slug,
      fullName: psychologists.fullName,
      professionalName: psychologists.professionalName,
      specialty: psychologists.specialty,
      profileImageUrl: psychologists.profileImageUrl,
      bio: psychologists.bio,
    })
    .from(psychologists)
    .where(whereClause)
    .orderBy(asc(psychologists.professionalName), asc(psychologists.fullName));

  const ids = rows.map((r) => r.id);
  const firstSpecByPsy = new Map<string, string>();
  const skillsByPsy = new Map<string, string[]>();
  const socialLinksByPsy = await getPublicSocialLinksByPsychologistIds(ids);

  if (ids.length > 0) {
    const [specs, skills] = await Promise.all([
      db
        .select({
          psychologistId: psychologistSpecialties.psychologistId,
          label: psychologistSpecialties.label,
        })
        .from(psychologistSpecialties)
        .where(inArray(psychologistSpecialties.psychologistId, ids))
        .orderBy(asc(psychologistSpecialties.psychologistId), asc(psychologistSpecialties.sortOrder)),
      db
        .select({
          psychologistId: psychologistSkills.psychologistId,
          label: psychologistSkills.label,
        })
        .from(psychologistSkills)
        .where(inArray(psychologistSkills.psychologistId, ids))
        .orderBy(asc(psychologistSkills.psychologistId), asc(psychologistSkills.sortOrder)),
    ]);

    for (const s of specs) {
      if (!firstSpecByPsy.has(s.psychologistId)) firstSpecByPsy.set(s.psychologistId, s.label);
    }
    for (const s of skills) {
      const arr = skillsByPsy.get(s.psychologistId) ?? [];
      arr.push(s.label);
      skillsByPsy.set(s.psychologistId, arr);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    displayName: (r.professionalName?.trim() || r.fullName).trim(),
    specialty: firstSpecByPsy.get(r.id) ?? r.specialty ?? "",
    profileImageUrl: r.profileImageUrl,
    socialLinks: socialLinksByPsy.get(r.id) ?? [],
    bio: r.bio,
    skills: skillsByPsy.get(r.id) ?? [],
  }));
}
