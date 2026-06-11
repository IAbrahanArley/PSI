import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { patientAiConversations, patientAiMessages } from "@/lib/db/schema";

const BodySchema = z.object({
  conversationId: z.string().uuid(),
  role:           z.enum(["user", "assistant"]),
  content:        z.string().min(1).max(8000),
});

/** Salva uma mensagem no banco — chamado pelo cliente após o stream completar. */
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

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
    }

    // Verifica que a conversa pertence ao usuário (segurança)
    const [conv] = await db
      .select({ id: patientAiConversations.id })
      .from(patientAiConversations)
      .where(eq(patientAiConversations.id, parsed.data.conversationId))
      .limit(1);

    if (!conv) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

    await db.insert(patientAiMessages).values({
      conversationId: parsed.data.conversationId,
      role:           parsed.data.role,
      content:        parsed.data.content,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assistant/messages POST]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
