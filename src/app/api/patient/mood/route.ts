import { and, desc, eq, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients, patientMoodEntries } from "@/lib/db/schema";

async function resolvePatientId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

const MoodSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  score: z.number().int().min(1).max(5),
  note:  z.string().max(500).optional().nullable(),
});

// ─── GET — últimas N entradas ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const patientId = await resolvePatientId(user.id);
    if (!patientId) return NextResponse.json({ entries: [] });

    // Calcula data de corte: hoje - N dias (padrão 30)
    const daysParam = req.nextUrl.searchParams.get("days");
    const days = Math.min(90, Math.max(7, parseInt(daysParam ?? "30", 10)));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

    const entries = await db
      .select({
        id:    patientMoodEntries.id,
        date:  patientMoodEntries.date,
        score: patientMoodEntries.score,
        note:  patientMoodEntries.note,
      })
      .from(patientMoodEntries)
      .where(
        and(
          eq(patientMoodEntries.patientId, patientId),
          gte(patientMoodEntries.date, cutoffStr),
        ),
      )
      .orderBy(desc(patientMoodEntries.date));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[patient/mood GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── POST — upsert de uma entrada ────────────────────────────────────────────

export async function POST(req: Request) {
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

    const parsed = MoodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const patientId = await resolvePatientId(user.id);
    if (!patientId) {
      return NextResponse.json({ error: "Perfil de paciente não encontrado." }, { status: 404 });
    }

    const { date, score, note } = parsed.data;
    const now = new Date();

    await db
      .insert(patientMoodEntries)
      .values({ patientId, date, score, note: note ?? null, updatedAt: now })
      .onConflictDoUpdate({
        target: [patientMoodEntries.patientId, patientMoodEntries.date],
        set:    { score, note: note ?? null, updatedAt: now },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[patient/mood POST]", err);
    return NextResponse.json({ error: "Erro ao salvar humor." }, { status: 500 });
  }
}
