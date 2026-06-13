import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients, users } from "@/lib/db/schema";
import { stripPhoneDigits } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import { issueActivationCode } from "@/lib/auth/account-activation";
import { resolveAppBaseUrl } from "@/lib/app-url";

type Body = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL nao configurada. No Supabase: Settings -> Database -> copie a Connection string (URI) para o .env.local.",
      },
      { status: 503 },
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase Auth nao configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const phoneDigits = stripPhoneDigits(body.phone ?? "");

  if (firstName.length < 2) {
    return NextResponse.json({ error: "Informe um nome valido." }, { status: 400 });
  }
  if (lastName.length < 2) {
    return NextResponse.json({ error: "Informe um sobrenome valido." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail invalido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json(
      { error: "Telefone invalido. Use DDD + numero (10 ou 11 digitos)." },
      { status: 400 },
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    // Conta nasce NAO confirmada — ativacao por codigo de 6 digitos via e-mail.
    email_confirm: false,
    app_metadata: { role: "PATIENT" },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Nao foi possivel criar o usuario." },
      { status: 400 },
    );
  }

  const userId = authData.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        fullName,
        role: "PATIENT",
      });

      const [existingGuest] = await tx
        .select({ id: patients.id })
        .from(patients)
        .where(sql`lower(trim(coalesce(${patients.email}, ''))) = ${email} and ${patients.userId} is null`)
        .limit(1);

      if (existingGuest) {
        await tx
          .update(patients)
          .set({
            userId,
            fullName,
            email,
            phone: phoneDigits,
            updatedAt: new Date(),
          })
          .where(eq(patients.id, existingGuest.id));
      } else {
        await tx.insert(patients).values({
          userId,
          fullName,
          email,
          phone: phoneDigits,
        });
      }
    });
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      {
        error:
          "Falha ao gravar no PostgreSQL (tabelas users/patients). Confira DATABASE_URL e se as migrations foram aplicadas no banco.",
      },
      { status: 500 },
    );
  }

  // Envia o codigo de ativacao (nao bloqueia o sucesso do cadastro se o e-mail falhar;
  // o usuario pode reenviar na tela de ativacao).
  try {
    await issueActivationCode({
      userId,
      email,
      name: fullName,
      baseUrl: resolveAppBaseUrl(req),
    });
  } catch (e) {
    console.error("[register-patient] issueActivationCode falhou", e);
  }

  return NextResponse.json({ ok: true, userId, requiresActivation: true, email });
}
