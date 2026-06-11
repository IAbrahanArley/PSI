import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import {
  patients,
  patientAnamnesis,
  patientAiConversations,
  patientAiMessages,
} from "@/lib/db/schema";

// ─── Validação ────────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  /** Últimas mensagens para contexto (máx. 20) */
  messages:       z.array(MessageSchema).min(1).max(20),
});

// ─── Labels da anamnese para o prompt ────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  ansiedade:             "Ansiedade",
  depressao:             "Depressão",
  relacionamentos:       "Relacionamentos",
  autoconhecimento:      "Autoconhecimento",
  luto:                  "Luto",
  trauma:                "Trauma",
  estresse:              "Estresse",
  familia:               "Questões familiares",
  orientacao_vocacional: "Orientação vocacional",
  outros:                "Outros",
};

// ─── Sistema de prompt ────────────────────────────────────────────────────────

function buildSystemPrompt(anamnesis: {
  mainReasons: string[];
  hadPreviousTherapy: boolean | null;
  urgencyLevel: number | null;
} | null): string {
  const reasonsText = anamnesis?.mainReasons?.length
    ? anamnesis.mainReasons.map((r) => REASON_LABELS[r] ?? r).join(", ")
    : "não informado";

  const therapyText = anamnesis?.hadPreviousTherapy === true
    ? "já fez terapia anteriormente"
    : anamnesis?.hadPreviousTherapy === false
    ? "nunca fez terapia"
    : "histórico não informado";

  const urgencyText = anamnesis?.urgencyLevel
    ? `nível ${anamnesis.urgencyLevel}/5`
    : "não informado";

  return `Você é o Assistente Mindzinho — um assistente de bem-estar mental e apoio emocional.

## IDENTIDADE E LIMITES (INEGOCIÁVEIS)
- Você NÃO é terapeuta, psicólogo ou profissional de saúde mental.
- Você NÃO realiza terapia, NÃO diagnostica condições mentais e NÃO prescreve tratamentos.
- Você oferece: psicoeducação leve, técnicas de bem-estar baseadas em evidências (respiração, mindfulness, reestruturação cognitiva básica), escuta empática e incentivo a buscar ajuda profissional.
- Em qualquer situação de crise, risco de suicídio ou autolesão: mencione IMEDIATAMENTE o CVV (188, 24h, gratuito) e incentive a buscar atendimento de emergência.

## CONTEXTO DO USUÁRIO (confidencial, não mencione diretamente)
- Motivos de busca: ${reasonsText}
- Experiência com terapia: ${therapyText}
- Urgência percebida: ${urgencyText}

Use esse contexto para personalizar respostas sem expô-lo explicitamente.

## DIRETRIZES DE RESPOSTA
1. Responda sempre em português brasileiro, tom acolhedor e não julgamental.
2. Respostas concisas: máximo 3 parágrafos. Prefira bullets para técnicas e passos.
3. Nunca minimize sentimentos com frases como "isso é normal" ou "todo mundo sente isso".
4. Ao abordar temas difíceis, finalize lembrando que um psicólogo pode oferecer suporte mais profundo.
5. Se o usuário pedir diagnóstico, prognóstico ou tratamento: explique gentilmente que isso está fora do seu escopo e recomende um profissional.
6. Não invente informações — se não souber, diga que não sabe e sugira fontes confiáveis.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada. Adicione no .env.local e no painel da Vercel." },
      { status: 503 },
    );
  }

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
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { conversationId, messages } = parsed.data;

    // Resolve patient_id
    const [pat] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1);

    if (!pat) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

    // Carrega anamnese para contexto
    const [anamnesis] = await db
      .select({
        mainReasons:        patientAnamnesis.mainReasons,
        hadPreviousTherapy: patientAnamnesis.hadPreviousTherapy,
        urgencyLevel:       patientAnamnesis.urgencyLevel,
      })
      .from(patientAnamnesis)
      .where(eq(patientAnamnesis.patientId, pat.id))
      .limit(1);

    // Garante que a conversa existe no banco
    let convId = conversationId;
    if (!convId) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
        : "Nova conversa";

      const [conv] = await db
        .insert(patientAiConversations)
        .values({ patientId: pat.id, title })
        .returning({ id: patientAiConversations.id });

      convId = conv!.id;
    } else {
      // Atualiza updatedAt da conversa existente
      await db
        .update(patientAiConversations)
        .set({ updatedAt: new Date() })
        .where(eq(patientAiConversations.id, convId));
    }

    // Salva a última mensagem do usuário no banco (síncrono, antes de stremar)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      await db.insert(patientAiMessages).values({
        conversationId: convId,
        role:    "user",
        content: lastUserMsg.content,
      });
    }

    // Chama a API da Anthropic com streaming
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-opus-4-5",
        max_tokens: 1024,
        stream:     true,
        system:     buildSystemPrompt(anamnesis ?? null),
        messages:   messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text().catch(() => "Erro desconhecido.");
      console.error("[assistant/chat] Anthropic error:", anthropicRes.status, err);
      return NextResponse.json({ error: "Serviço de IA indisponível. Tente novamente." }, { status: 502 });
    }

    // Injeta o conversationId no início do stream para o cliente saber qual conversa foi criada
    const convHeader = `data: {"type":"conv_id","id":"${convId}"}\n\n`;

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Escreve o conv_id e depois passa o stream da Anthropic
    void (async () => {
      await writer.write(encoder.encode(convHeader));
      const reader = anthropicRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Conv-Id":     convId,
      },
    });
  } catch (err) {
    console.error("[assistant/chat]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
