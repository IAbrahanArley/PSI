"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  catalogSpecialties,
  psychologistAwards,
  psychologistCurriculum,
  psychologistSkills,
  psychologistSpecialties,
  psychologists,
} from "@/lib/db/schema";
import { emptyCurriculum } from "@/lib/types/psychologist-curriculum";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PsychologistProfileData, SavePsychologistProfileInput } from "./types";

async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function getPsychologistProfile(): Promise<PsychologistProfileData | null> {
  const { user, error } = await getSessionUser();
  if (error || !user) throw new Error("Não autenticado.");

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") throw new Error("Sem permissão.");

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) return null;

  const [specialties, skills, awards, cvRow] = await Promise.all([
    db
      .select()
      .from(psychologistSpecialties)
      .where(eq(psychologistSpecialties.psychologistId, psy.id))
      .orderBy(asc(psychologistSpecialties.sortOrder)),
    db
      .select()
      .from(psychologistSkills)
      .where(eq(psychologistSkills.psychologistId, psy.id))
      .orderBy(asc(psychologistSkills.sortOrder)),
    db
      .select()
      .from(psychologistAwards)
      .where(eq(psychologistAwards.psychologistId, psy.id))
      .orderBy(asc(psychologistAwards.sortOrder)),
    db.select().from(psychologistCurriculum).where(eq(psychologistCurriculum.psychologistId, psy.id)).limit(1),
  ]);

  let specialtyList = specialties.map((s) => s.label);
  if (specialtyList.length === 0 && psy.specialty) specialtyList = [psy.specialty];

  const catalogSpecialtyIds = specialties
    .map((s) => s.catalogSpecialtyId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  return {
    psychologist: {
      id: psy.id,
      fullName: psy.fullName,
      professionalName: psy.professionalName,
      bio: psy.bio,
      crp: psy.crp,
      profileImageUrl: psy.profileImageUrl,
      slug: psy.slug,
    },
    catalogSpecialtyIds,
    specialties: specialtyList,
    skills: skills.map((s) => s.label),
    awards: awards.map((a) => ({ id: a.id, title: a.title, link: a.link, imageUrl: a.imageUrl })),
    curriculum: (cvRow[0]?.content ?? emptyCurriculum()) as PsychologistProfileData["curriculum"],
  };
}

export async function savePsychologistProfile(input: SavePsychologistProfileInput) {
  const { user, error } = await getSessionUser();
  if (error || !user) throw new Error("Não autenticado.");

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") throw new Error("Sem permissão.");

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) throw new Error("Perfil de psicólogo não encontrado.");

  const legacySpecialties = (input.specialties ?? []).map((s) => String(s).trim()).filter(Boolean);
  const skills = (input.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const awardsIn = input.awards ?? [];
  const curriculum = input.curriculum ?? emptyCurriculum();

  let firstSpecialtyLabel: string | null;
  let specialtyInserts: Array<{ catalogSpecialtyId: string | null; label: string }>;

  const catalogIncoming = input.catalogSpecialtyIds;
  const useExplicitCatalogPayload = catalogIncoming !== undefined;

  if (useExplicitCatalogPayload) {
    const normalizedIds = [...new Set(catalogIncoming!.map((id) => String(id).trim()).filter(Boolean))];
    if (!normalizedIds.length) {
      throw new Error("Selecione ao menos uma especialidade do catálogo.");
    }
    const rows = await db
      .select({ id: catalogSpecialties.id, name: catalogSpecialties.name })
      .from(catalogSpecialties)
      .where(and(inArray(catalogSpecialties.id, normalizedIds), eq(catalogSpecialties.isActive, true)));

    if (rows.length !== normalizedIds.length) {
      throw new Error("Uma ou mais especialidades são inválidas ou estão indisponíveis.");
    }

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    specialtyInserts = normalizedIds.map((id) => {
      const r = byId.get(id)!;
      return { catalogSpecialtyId: r.id, label: r.name };
    });
    firstSpecialtyLabel = specialtyInserts[0]?.label ?? psy.specialty ?? null;
  } else if (legacySpecialties.length > 0) {
    specialtyInserts = legacySpecialties.map((label) => ({ catalogSpecialtyId: null, label }));
    firstSpecialtyLabel = legacySpecialties[0] ?? psy.specialty ?? null;
  } else {
    firstSpecialtyLabel = psy.specialty ?? null;
    specialtyInserts = [];
  }

  await db.transaction(async (tx) => {
    await tx
      .update(psychologists)
      .set({
        professionalName: input.professionalName ?? null,
        bio: input.bio ?? null,
        crp: input.crp?.trim() || null,
        profileImageUrl: input.profileImageUrl ?? null,
        specialty: firstSpecialtyLabel,
        updatedAt: new Date(),
      })
      .where(eq(psychologists.id, psy.id));

    await tx.delete(psychologistSpecialties).where(eq(psychologistSpecialties.psychologistId, psy.id));
    for (let i = 0; i < specialtyInserts.length; i++) {
      const row = specialtyInserts[i];
      await tx.insert(psychologistSpecialties).values({
        psychologistId: psy.id,
        catalogSpecialtyId: row.catalogSpecialtyId,
        label: row.label,
        sortOrder: i,
      });
    }

    await tx.delete(psychologistSkills).where(eq(psychologistSkills.psychologistId, psy.id));
    for (let i = 0; i < skills.length; i++) {
      await tx.insert(psychologistSkills).values({ psychologistId: psy.id, label: skills[i], sortOrder: i });
    }

    await tx.delete(psychologistAwards).where(eq(psychologistAwards.psychologistId, psy.id));
    for (let i = 0; i < awardsIn.length; i++) {
      const a = awardsIn[i];
      if (!a?.title?.trim()) continue;
      await tx.insert(psychologistAwards).values({
        psychologistId: psy.id,
        title: a.title.trim(),
        link: a.link?.trim() || null,
        imageUrl: a.imageUrl?.trim() || null,
        sortOrder: i,
      });
    }

    const [existingCv] = await tx
      .select()
      .from(psychologistCurriculum)
      .where(eq(psychologistCurriculum.psychologistId, psy.id))
      .limit(1);

    if (existingCv) {
      await tx
        .update(psychologistCurriculum)
        .set({ content: curriculum, updatedAt: new Date() })
        .where(eq(psychologistCurriculum.psychologistId, psy.id));
    } else {
      await tx.insert(psychologistCurriculum).values({ psychologistId: psy.id, content: curriculum });
    }
  });

  return { ok: true };
}
