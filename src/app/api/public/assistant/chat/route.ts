import { and, asc, eq, ilike, inArray, notInArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { catalogSpecialties, psychologistSpecialties, psychologists } from "@/lib/db/schema";
import { normalizeListingCity } from "@/lib/listing-city";

// ─── Rate limiting (in-memory, per IP) ───────────────────────────────────────

type RateBucket = { count: number; resetAt: number };
const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT = 40;         // messages per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PsyCard = {
  id: string;
  slug: string;
  displayName: string;
  specialty: string;
  profileImageUrl: string | null;
  city: string | null;
  state: string | null;
  offersOnline: boolean;
  offersPresential: boolean;
  sessionPrice: string | null;
};

// ─── DB query for matching psychologists ─────────────────────────────────────

async function findMatchingPsychologists(input: {
  specialtyText?: string;
  city?: string;
  modality?: "ONLINE" | "PRESENTIAL" | "any";
  limit?: number;
}): Promise<PsyCard[]> {
  const limit = input.limit ?? 3;
  const cityNorm = normalizeListingCity(input.city ?? null);

  // Build where clauses
  const conditions: ReturnType<typeof sql>[] = [
    notInArray(psychologists.status, ["REJECTED", "INACTIVE"]) as unknown as ReturnType<typeof sql>,
  ];

  // Specialty text search (try catalog first, fall back to label text)
  if (input.specialtyText?.trim()) {
    const term = `%${input.specialtyText.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`exists (
          select 1 from psychologist_specialties ps
          inner join catalog_specialties cs on cs.id = ps.catalog_specialty_id
          where ps.psychologist_id = ${psychologists.id}
          and (lower(cs.name) like ${term} or lower(cs.slug) like ${term})
        )`,
        sql`exists (
          select 1 from psychologist_specialties ps
          where ps.psychologist_id = ${psychologists.id}
          and lower(coalesce(ps.label,'')) like ${term}
        )`,
        sql`lower(coalesce(${psychologists.specialty},'')) like ${term}`,
      ) as unknown as ReturnType<typeof sql>,
    );
  }

  // Modality
  if (input.modality === "ONLINE") {
    conditions.push(sql`${psychologists.offersOnline} = true` as unknown as ReturnType<typeof sql>);
  } else if (input.modality === "PRESENTIAL") {
    conditions.push(sql`${psychologists.offersPresential} = true` as unknown as ReturnType<typeof sql>);
  }

  // City
  if (cityNorm) {
    conditions.push(
      sql`lower(trim(coalesce(${psychologists.city},''))) = ${cityNorm}` as unknown as ReturnType<typeof sql>,
    );
  }

  const rows = await db
    .select({
      id:              psychologists.id,
      slug:            psychologists.slug,
      fullName:        psychologists.fullName,
      professionalName: psychologists.professionalName,
      specialty:       psychologists.specialty,
      profileImageUrl: psychologists.profileImageUrl,
      city:            psychologists.city,
      state:           psychologists.state,
      offersOnline:    psychologists.offersOnline,
      offersPresential: psychologists.offersPresential,
      sessionPrice:    psychologists.sessionPrice,
    })
    .from(psychologists)
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(asc(psychologists.professionalName), asc(psychologists.fullName))
    .limit(limit);

  if (!rows.length) return [];

  // Fetch first specialty label for each psychologist
  const ids = rows.map((r) => r.id);
  const specs = await db
    .select({ psychologistId: psychologistSpecialties.psychologistId, label: psychologistSpecialties.label })
    .from(psychologistSpecialties)
    .where(inArray(psychologistSpecialties.psychologistId, ids))
    .orderBy(asc(psychologistSpecialties.psychologistId), asc(psychologistSpecialties.sortOrder));

  const firstSpecMap = new Map<string, string>();
  for (const s of specs) {
    if (!firstSpecMap.has(s.psychologistId)) firstSpecMap.set(s.psychologistId, s.label);
  }

  return rows.map((r) => ({
    id:              r.id,
    slug:            r.slug,
    displayName:     (r.professionalName?.trim() || r.fullName).trim(),
    specialty:       firstSpecMap.get(r.id) ?? r.specialty ?? "Psicologia",
    profileImageUrl: r.profileImageUrl,
    city:            r.city,
    state:           r.state,
    offersOnline:    r.offersOnline,
    offersPresential: r.offersPresential,
    sessionPrice:    r.sessionPrice,
  }));
}

// ─── Anthropic tool definition ────────────────────────────────────────────────

const FIND_PSY_TOOL = {
  name: "find_psychologist",
  description:
    "Busca psicólogos na plataforma compatíveis com os critérios coletados. Use assim que tiver ao menos o motivo principal ou especialidade desejada. Não espere ter todos os campos — use os que o usuário forneceu.",
  input_schema: {
    type: "object",
    properties: {
      specialtyText: {
        type: "string",
        description:
          "Motivo/especialidade em texto livre (ex: 'ansiedade', 'tcc', 'relacionamentos', 'luto'). Deixe vazio para busca geral.",
      },
      city: {
        type: "string",
        description:
          "Cidade do usuário em texto simples (ex: 'São Paulo'). Deixe vazio se o usuário preferir online ou não informou.",
      },
      modality: {
        type: "string",
        enum: ["ONLINE", "PRESENTIAL", "any"],
        description: "Modalidade preferida.",
      },
    },
    required: [],
  },
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o **Mindzinho** — assistente virtual da plataforma de psicologia online.

## FOCO (INEGOCIÁVEL)
Você só pode ajudar com dois temas:
1. **Dúvidas sobre a plataforma** — para pacientes e psicólogos
2. **Busca e sugestão de psicólogos compatíveis** para quem precisa de atendimento

Para qualquer outro assunto (política, culinária, código, etc.): explique gentilmente que seu foco é a plataforma e a busca de psicólogos, e redirecione para esses temas.

## DÚVIDAS QUE VOCÊ RESPONDE

**Para pacientes:**
- Como se cadastrar e usar a plataforma
- Como funciona o agendamento (online e presencial)
- Como cancelar uma consulta
- Preços e planos
- Privacidade e sigilo
- Como encontrar o psicólogo certo

**Para psicólogos:**
- Como se cadastrar na plataforma
- Planos e assinaturas disponíveis
- Como funciona a agenda e o recebimento de pacientes
- Requisitos (CRP, verificação de conta)
- Como aparecer nas buscas

## BUSCA DE PSICÓLOGOS
Quando o visitante quiser encontrar um psicólogo:
- Faça até 2 perguntas rápidas para entender as necessidades
- Pergunta 1: O que está buscando / motivo / especialidade
- Pergunta 2 (opcional): Prefere online ou presencial? Se presencial, qual cidade?
- Após coletar informações básicas, use a ferramenta \`find_psychologist\` imediatamente
- Se não houver resultados, sugira ampliar os critérios (ex: buscar online ao invés de presencial)
- Apresente os resultados de forma acolhedora e encoraje o agendamento

## REGRAS IMPORTANTES
- NÃO realize diagnósticos, NÃO ofereça suporte terapêutico aprofundado
- Em situações de crise ou risco: mencione o CVV (188, 24h, gratuito) e sugira buscar emergência
- Tom: acolhedor, objetivo e informativo
- Respostas curtas: máximo 3 parágrafos ou 5 bullets
- Idioma: sempre português brasileiro
- Quando sugerir psicólogos, NÃO liste os nomes no texto — os cards serão exibidos automaticamente na interface`;

// ─── Validation ────────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Assistente temporariamente indisponível." },
      { status: 503 },
    );
  }

  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas mensagens. Aguarde um momento e tente novamente." },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { messages } = parsed.data;

  // ── First Anthropic call ──────────────────────────────────────────────────
  async function callAnthropic(msgs: typeof messages, toolResult?: { toolUseId: string; content: string }) {
    const anthropicMessages: unknown[] = msgs.map((m) => ({ role: m.role, content: m.content }));

    // If we have a tool result to inject, add it
    if (toolResult) {
      // Pop the last assistant message (which contained the tool_use) and re-add with tool result
      const lastAssistantIdx = [...anthropicMessages].reverse().findIndex(
        (m) => (m as { role: string }).role === "assistant",
      );
      // Add tool_result as a user turn
      anthropicMessages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolResult.toolUseId,
            content: toolResult.content,
          },
        ],
      });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5",
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        tools:      [FIND_PSY_TOOL],
        messages:   anthropicMessages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Erro desconhecido.");
      console.error("[public/assistant/chat] Anthropic error:", res.status, errText);
      throw new Error("Serviço de IA indisponível.");
    }

    return res.json() as Promise<{
      stop_reason: string;
      content: Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
      >;
    }>;
  }

  try {
    let aiResponse = await callAnthropic(messages);
    let foundPsychologists: PsyCard[] = [];

    // ── Handle tool use (one level deep) ─────────────────────────────────
    if (aiResponse.stop_reason === "tool_use") {
      const toolUseBlock = aiResponse.content.find((b) => b.type === "tool_use");
      if (toolUseBlock && toolUseBlock.type === "tool_use" && toolUseBlock.name === "find_psychologist") {
        const toolInput = toolUseBlock.input as {
          specialtyText?: string;
          city?: string;
          modality?: "ONLINE" | "PRESENTIAL" | "any";
        };

        // Run DB query
        foundPsychologists = await findMatchingPsychologists({
          specialtyText: toolInput.specialtyText,
          city:          toolInput.city,
          modality:      toolInput.modality,
          limit:         3,
        });

        // Build tool result
        const toolResultContent =
          foundPsychologists.length > 0
            ? `Encontrei ${foundPsychologists.length} psicólogo(s) compatível(is). Os cards serão exibidos automaticamente na interface. Apresente uma mensagem acolhedora incentivando o usuário a verificar os profissionais sugeridos e agendar uma consulta. Não liste nomes ou detalhes — os cards já aparecem.`
            : "Nenhum psicólogo encontrado com esses critérios. Sugira ao usuário ampliar os critérios (ex: buscar online, trocar a especialidade, ou remover o filtro de cidade).";

        // Second call with tool result — reconstruct messages including tool_use block
        const msgsWithTool: unknown[] = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          {
            role: "assistant",
            content: aiResponse.content, // includes the tool_use block
          },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolUseBlock.id,
                content: toolResultContent,
              },
            ],
          },
        ];

        const secondRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key":         process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type":      "application/json",
          },
          body: JSON.stringify({
            model:      "claude-haiku-4-5",
            max_tokens: 1024,
            system:     SYSTEM_PROMPT,
            tools:      [FIND_PSY_TOOL],
            messages:   msgsWithTool,
          }),
        });

        if (secondRes.ok) {
          aiResponse = await secondRes.json() as typeof aiResponse;
        }
      }
    }

    // ── Extract final text ────────────────────────────────────────────────
    const replyText = aiResponse.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({
      reply:         replyText || "Desculpe, não consegui gerar uma resposta. Tente novamente.",
      psychologists: foundPsychologists.length > 0 ? foundPsychologists : undefined,
    });
  } catch (err) {
    console.error("[public/assistant/chat]", err);
    const msg = err instanceof Error ? err.message : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
