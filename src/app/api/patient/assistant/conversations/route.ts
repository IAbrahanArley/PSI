import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients, patientAiConversations, patientAiMessages } from "@/lib/db/schema";

// ─── GET — lista as conversas do paciente ─────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const [pat] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);

    if (!pat) return NextResponse.json({ conversations: [] });

    const conversations = await db
      .select({
        id:        patientAiConversations.id,
        title:     patientAiConversations.title,
        updatedAt: patientAiConversations.updatedAt,
      })
      .from(patientAiConversations)
      .where(eq(patientAiConversations.patientId, pat.id))
      .orderBy(desc(patientAiConversations.updatedAt))
      .limit(20);

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[assistant/conversations GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── DELETE — apaga todas as conversas do paciente ────────────────────────────

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    const [pat] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);

    if (!pat) return NextResponse.json({ ok: true });

    // As mensagens são removidas em cascata (FK ON DELETE CASCADE)
    await db
      .delete(patientAiConversations)
      .where(and(eq(patientAiConversations.patientId, pat.id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assistant/conversations DELETE]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
