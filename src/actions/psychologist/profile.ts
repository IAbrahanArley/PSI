"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
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

  const specialties = (input.specialties ?? []).map((s) => String(s).trim()).filter(Boolean);
  const skills = (input.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const awardsIn = input.awards ?? [];
  const curriculum = input.curriculum ?? emptyCurriculum();
  const firstSpecialty = specialties[0] ?? psy.specialty ?? null;

  await db.transaction(async (tx) => {
    await tx
      .update(psychologists)
      .set({
        professionalName: input.professionalName ?? null,
        bio: input.bio ?? null,
        crp: input.crp?.trim() || null,
        profileImageUrl: input.profileImageUrl ?? null,
        specialty: firstSpecialty,
        updatedAt: new Date(),
      })
      .where(eq(psychologists.id, psy.id));

    await tx.delete(psychologistSpecialties).where(eq(psychologistSpecialties.psychologistId, psy.id));
    for (let i = 0; i < specialties.length; i++) {
      await tx.insert(psychologistSpecialties).values({ psychologistId: psy.id, label: specialties[i], sortOrder: i });
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
