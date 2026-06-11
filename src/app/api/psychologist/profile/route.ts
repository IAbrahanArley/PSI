import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  catalogSpecialties,
  psychologistAwards,
  psychologistCurriculum,
  psychologistSkills,
  psychologistSpecialties,
  psychologists,
} from "@/lib/db/schema";
import type { CurriculumContent } from "@/lib/types/psychologist-curriculum";
import { emptyCurriculum } from "@/lib/types/psychologist-curriculum";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function GET() {
  const { user, error } = await getSessionUser();
  if (error || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);

  if (!psy) {
    return NextResponse.json({ error: "Perfil de psicólogo não encontrado." }, { status: 404 });
  }

  const specialties = await db
    .select()
    .from(psychologistSpecialties)
    .where(eq(psychologistSpecialties.psychologistId, psy.id))
    .orderBy(asc(psychologistSpecialties.sortOrder));

  const skills = await db
    .select()
    .from(psychologistSkills)
    .where(eq(psychologistSkills.psychologistId, psy.id))
    .orderBy(asc(psychologistSkills.sortOrder));

  const awards = await db
    .select()
    .from(psychologistAwards)
    .where(eq(psychologistAwards.psychologistId, psy.id))
    .orderBy(asc(psychologistAwards.sortOrder));

  const [cvRow] = await db
    .select()
    .from(psychologistCurriculum)
    .where(eq(psychologistCurriculum.psychologistId, psy.id))
    .limit(1);

  let specialtyList = specialties.map((s) => s.label);
  if (specialtyList.length === 0 && psy.specialty) {
    specialtyList = [psy.specialty];
  }

  const catalogSpecialtyIds = specialties
    .map((s) => s.catalogSpecialtyId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const curriculum = (cvRow?.content as CurriculumContent | undefined) ?? emptyCurriculum();

  return NextResponse.json({
    psychologist: {
      id: psy.id,
      fullName: psy.fullName,
      professionalName: psy.professionalName,
      bio: psy.bio,
      crp: psy.crp,
      profileImageUrl: psy.profileImageUrl,
      slug: psy.slug,
      city: psy.city,
      state: psy.state,
    },
    catalogSpecialtyIds,
    specialties: specialtyList,
    skills: skills.map((s) => s.label),
    awards: awards.map((a) => ({
      id: a.id,
      title: a.title,
      link: a.link,
      imageUrl: a.imageUrl,
    })),
    curriculum,
  });
}

type PutBody = {
  professionalName?: string | null;
  bio?: string | null;
  crp?: string | null;
  profileImageUrl?: string | null;
  city?: string | null;
  state?: string | null;
  catalogSpecialtyIds?: string[];
  specialties?: string[];
  skills?: string[];
  awards?: Array<{ title: string; link?: string | null; imageUrl?: string | null }>;
  curriculum?: CurriculumContent;
};

export async function PUT(req: Request) {
  const { user, error } = await getSessionUser();
  if (error || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  let body: PutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);

  if (!psy) {
    return NextResponse.json({ error: "Perfil de psicólogo não encontrado." }, { status: 404 });
  }

  const legacySpecialties = (body.specialties ?? []).map((s) => String(s).trim()).filter(Boolean);
  const skills = (body.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const awardsIn = body.awards ?? [];
  const curriculum = body.curriculum ?? emptyCurriculum();

  let firstSpecialtyLabel: string | null;
  let specialtyInserts: Array<{ catalogSpecialtyId: string | null; label: string }>;

  const catalogIncoming = body.catalogSpecialtyIds;
  const useExplicitCatalogPayload = catalogIncoming !== undefined;

  try {
    if (useExplicitCatalogPayload) {
      const normalizedIds = [...new Set(catalogIncoming!.map((id) => String(id).trim()).filter(Boolean))];
      if (!normalizedIds.length) {
        return NextResponse.json({ error: "Selecione ao menos uma especialidade do catálogo." }, { status: 400 });
      }
      const rows = await db
        .select({ id: catalogSpecialties.id, name: catalogSpecialties.name })
        .from(catalogSpecialties)
        .where(and(inArray(catalogSpecialties.id, normalizedIds), eq(catalogSpecialties.isActive, true)));

      if (rows.length !== normalizedIds.length) {
        return NextResponse.json(
          { error: "Uma ou mais especialidades são inválidas ou estão indisponíveis." },
          { status: 400 },
        );
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
          professionalName: body.professionalName ?? null,
          bio: body.bio ?? null,
          crp: body.crp?.trim() || null,
          profileImageUrl: body.profileImageUrl ?? null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
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
        await tx.insert(psychologistSkills).values({
          psychologistId: psy.id,
          label: skills[i],
          sortOrder: i,
        });
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
        await tx.insert(psychologistCurriculum).values({
          psychologistId: psy.id,
          content: curriculum,
        });
      }
    });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
