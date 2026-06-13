import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyActivationCode } from "@/lib/auth/account-activation";

const BodySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos."),
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
    return NextResponse.json({ error: "Informe um e-mail válido e o código de 6 dígitos." }, { status: 422 });
  }

  const result = await verifyActivationCode(parsed.data);

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  switch (result.reason) {
    case "no_code":
      return NextResponse.json(
        { error: "Nenhum código pendente para este e-mail. Solicite um novo." },
        { status: 400 },
      );
    case "expired":
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 410 },
      );
    case "too_many_attempts":
      return NextResponse.json(
        { error: "Muitas tentativas. Solicite um novo código." },
        { status: 429 },
      );
    case "invalid":
    default:
      return NextResponse.json({ error: "Código incorreto. Verifique e tente novamente." }, { status: 400 });
  }
}
