import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { psychologists, users } from "@/lib/db/schema";
import { PSYCHOLOGY_SPECIALTIES } from "@/constant/psychologySpecialties";
import { stripPhoneDigits } from "@/lib/phone";
import { generatePsychologistSlug } from "@/lib/slug";
import { supabaseServer } from "@/lib/db/supabase/server";

type Body = {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const specialty = (body.specialty ?? "").trim();
  const phoneRaw = body.phone ?? "";
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (firstName.length < 2) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }
  if (lastName.length < 2) {
    return NextResponse.json({ error: "Informe um sobrenome válido." }, { status: 400 });
  }
  if (!PSYCHOLOGY_SPECIALTIES.includes(specialty as (typeof PSYCHOLOGY_SPECIALTIES)[number])) {
    return NextResponse.json({ error: "Selecione uma especialidade válida." }, { status: 400 });
  }

  const phoneDigits = stripPhoneDigits(phoneRaw);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json(
      { error: "Telefone inválido. Use DDD + número (10 ou 11 dígitos)." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Não foi possível criar o usuário." },
      { status: 400 }
    );
  }

  const userId = authData.user.id;
  const slug = generatePsychologistSlug(firstName, lastName);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        fullName,
        role: "PSYCHOLOGIST",
      });

      await tx.insert(psychologists).values({
        userId,
        slug,
        fullName,
        specialty,
        phone: phoneDigits,
        crp: null,
      });
    });
  } catch (e) {
    await supabaseServer.auth.admin.deleteUser(userId);
    console.error("register-psychologist db error:", e);
    return NextResponse.json(
      { error: "Erro ao salvar cadastro. Tente novamente ou use outro e-mail." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, userId });
}
