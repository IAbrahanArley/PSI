import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";

const GENDER_VALUES = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

const ProfileSchema = z.object({
  fullName:   z.string().min(2, "Nome deve ter ao menos 2 caracteres.").max(120),
  phone:      z.string().max(20).optional().nullable(),
  whatsapp:   z.string().max(20).optional().nullable(),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD).").optional().nullable(),
  gender:     z.enum(GENDER_VALUES).optional().nullable(),
  state:      z.string().max(2).optional().nullable(),
  city:       z.string().max(100).optional().nullable(),
  avatarUrl:  z.string().url().optional().nullable(),
});

async function resolvePatient(userId: string) {
  const [row] = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return row ?? null;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const patient = await resolvePatient(user.id);
    if (!patient) return NextResponse.json({ profile: null });

    return NextResponse.json({
      profile: {
        id:        patient.id,
        fullName:  patient.fullName,
        email:     patient.email,
        phone:     patient.phone,
        whatsapp:  patient.whatsapp,
        birthDate: patient.birthDate,
        gender:    patient.gender,
        state:     patient.state,
        city:      patient.city,
        avatarUrl: patient.avatarUrl,
      },
    });
  } catch (err) {
    console.error("[patient/profile GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }

    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const patient = await resolvePatient(user.id);
    if (!patient) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }

    const data = parsed.data;
    await db
      .update(patients)
      .set({
        fullName:  data.fullName,
        phone:     data.phone     ?? null,
        whatsapp:  data.whatsapp  ?? null,
        birthDate: data.birthDate ?? null,
        gender:    data.gender    ?? null,
        state:     data.state     ?? null,
        city:      data.city      ?? null,
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl ?? null }),
        updatedAt: new Date(),
      })
      .where(eq(patients.id, patient.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[patient/profile PUT]", err);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
}
