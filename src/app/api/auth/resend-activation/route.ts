import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { issueActivationCode } from "@/lib/auth/account-activation";
import { resolveAppBaseUrl } from "@/lib/app-url";
import { normalizeEmail } from "@/lib/auth/verification-code";

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "DATABASE_URL não configurada." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 422 });
  }

  const email = normalizeEmail(parsed.data.email);

  const [user] = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${email}`)
    .limit(1);

  // Resposta genérica para não revelar se o e-mail existe (anti-enumeração).
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const result = await issueActivationCode({
    userId: user.id,
    email,
    name: user.fullName,
    baseUrl: resolveAppBaseUrl(req),
    enforceCooldown: true,
  });

  if (!result.ok && result.reason === "cooldown") {
    return NextResponse.json(
      { error: `Aguarde ${result.retryAfterSeconds}s para reenviar.`, retryAfterSeconds: result.retryAfterSeconds },
      { status: 429 },
    );
  }

  return NextResponse.json({ ok: true });
}
