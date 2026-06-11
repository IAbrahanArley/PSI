import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients, patientAnamnesis } from "@/lib/db/schema";

// ─── Validação ────────────────────────────────────────────────────────────────

const MAIN_REASON_VALUES = [
  "ansiedade", "depressao", "relacionamentos", "autoconhecimento",
  "luto", "trauma", "estresse", "familia", "orientacao_vocacional", "outros",
] as const;

const DURATION_VALUES = ["lt1m", "1to3m", "3to6m", "6to12m", "gt1y"] as const;
const APPROACH_VALUES = ["tcc", "psicanalise", "humanista", "sistemica", "nao_sei", "outra"] as const;
const MODALITY_VALUES = ["ONLINE", "PRESENTIAL", "NO_PREFERENCE"] as const;
const GENDER_PREF_VALUES = ["MALE", "FEMALE", "NO_PREFERENCE"] as const;
const DAY_VALUES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const PERIOD_VALUES = ["MORNING", "AFTERNOON", "EVENING"] as const;
const INVESTMENT_VALUES = ["up100", "100to150", "150to200", "200plus", "flexible"] as const;

const AnamnesisSchema = z.object({
  mainReasons:        z.array(z.enum(MAIN_REASON_VALUES)).min(1, "Selecione ao menos um motivo."),
  symptomDuration:    z.enum(DURATION_VALUES),
  hadPreviousTherapy: z.boolean(),
  previousApproach:   z.enum(APPROACH_VALUES).optional().nullable(),
  preferredModality:  z.enum(MODALITY_VALUES),
  genderPreference:   z.enum(GENDER_PREF_VALUES),
  availableDays:      z.array(z.enum(DAY_VALUES)).min(1, "Selecione ao menos um dia."),
  availablePeriods:   z.array(z.enum(PERIOD_VALUES)).min(1, "Selecione ao menos um período."),
  investmentRange:    z.enum(INVESTMENT_VALUES),
  urgencyLevel:       z.number().int().min(1).max(5),
});

// ─── Helper: busca o patient_id pelo user autenticado ────────────────────────

async function resolvePatientId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

// ─── GET — retorna anamnese atual ────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const patientId = await resolvePatientId(user.id);
    if (!patientId) return NextResponse.json({ anamnesis: null });

    const [row] = await db
      .select()
      .from(patientAnamnesis)
      .where(eq(patientAnamnesis.patientId, patientId))
      .limit(1);

    return NextResponse.json({ anamnesis: row ?? null });
  } catch (err) {
    console.error("[patient/anamnesis GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── POST — cria ou atualiza (upsert) ────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Garante que o perfil de paciente existe
    const patientId = await resolvePatientId(user.id);
    if (!patientId) {
      return NextResponse.json(
        { error: "Perfil de paciente não encontrado. Contate o suporte." },
        { status: 404 },
      );
    }

    // Valida body
    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }

    const parsed = AnamnesisSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const data = parsed.data;
    const now  = new Date();

    // Verifica se já existe para saber se é primeira vez (completedAt)
    const [existing] = await db
      .select({ completedAt: patientAnamnesis.completedAt })
      .from(patientAnamnesis)
      .where(eq(patientAnamnesis.patientId, patientId))
      .limit(1);

    const completedAt = existing?.completedAt ?? now;

    // Upsert via INSERT … ON CONFLICT DO UPDATE
    const [saved] = await db
      .insert(patientAnamnesis)
      .values({
        patientId,
        mainReasons:        data.mainReasons,
        symptomDuration:    data.symptomDuration,
        hadPreviousTherapy: data.hadPreviousTherapy,
        previousApproach:   data.previousApproach ?? null,
        preferredModality:  data.preferredModality,
        genderPreference:   data.genderPreference,
        availableDays:      data.availableDays,
        availablePeriods:   data.availablePeriods,
        investmentRange:    data.investmentRange,
        urgencyLevel:       data.urgencyLevel,
        completedAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: patientAnamnesis.patientId,
        set: {
          mainReasons:        data.mainReasons,
          symptomDuration:    data.symptomDuration,
          hadPreviousTherapy: data.hadPreviousTherapy,
          previousApproach:   data.previousApproach ?? null,
          preferredModality:  data.preferredModality,
          genderPreference:   data.genderPreference,
          availableDays:      data.availableDays,
          availablePeriods:   data.availablePeriods,
          investmentRange:    data.investmentRange,
          urgencyLevel:       data.urgencyLevel,
          updatedAt:          now,
          // completedAt não muda em atualizações
        },
      })
      .returning({ id: patientAnamnesis.id });

    const isNew = !existing?.completedAt;
    return NextResponse.json({ ok: true, id: saved?.id, isNew });
  } catch (err) {
    console.error("[patient/anamnesis POST]", err);
    return NextResponse.json({ error: "Erro ao salvar anamnese." }, { status: 500 });
  }
}
