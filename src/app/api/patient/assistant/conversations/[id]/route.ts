import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patients, patientAiConversations, patientAiMessages } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

// ─── GET — mensagens de uma conversa ─────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const role = getRoleFromUser(user);
    if (role !== "PATIENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Verifica propriedade via join com patients
    const [pat] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);

    if (!pat) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

    const [conv] = await db
      .select({ id: patientAiConversations.id })
      .from(patientAiConversations)
      .where(eq(patientAiConversations.id, id))
      .limit(1);

    if (!conv) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

    const messages = await db
      .select({
        id:        patientAiMessages.id,
        role:      patientAiMessages.role,
        content:   patientAiMessages.content,
        createdAt: patientAiMessages.createdAt,
      })
      .from(patientAiMessages)
      .where(eq(patientAiMessages.conversationId, id))
      .orderBy(asc(patientAiMessages.createdAt))
      .limit(100);

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[conversations/[id] GET]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ─── DELETE — apaga uma conversa específica ───────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
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

    if (!pat) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

    await db
      .delete(patientAiConversations)
      .where(eq(patientAiConversations.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[conversations/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
