import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  catalogSpecialties,
  psychologistSpecialties,
  psychologistSubscriptions,
  psychologists,
  subscriptionPlans,
  users,
} from "@/lib/db/schema";
import { stripPhoneDigits } from "@/lib/phone";
import { generatePsychologistSlug } from "@/lib/slug";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import { issueActivationCode } from "@/lib/auth/account-activation";
import { resolveAppBaseUrl } from "@/lib/app-url";

type Body = {
  firstName?: string;
  lastName?: string;
  /** Uma ou mais especialidades do catálogo (`catalog_specialties.id`). */
  catalogSpecialtyIds?: string[];
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
          "DATABASE_URL não configurada. No Supabase: Settings → Database → copie a Connection string (URI) para o .env.local (é o Postgres, não é a URL https do projeto).",
      },
      { status: 503 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase Auth não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
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
  const phoneRaw = body.phone ?? "";
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const idsRaw = Array.isArray(body.catalogSpecialtyIds) ? body.catalogSpecialtyIds : [];
  const normalizedIds = [...new Set(idsRaw.map((id) => String(id).trim()).filter(Boolean))];

  if (firstName.length < 2) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }
  if (lastName.length < 2) {
    return NextResponse.json({ error: "Informe um sobrenome válido." }, { status: 400 });
  }

  let catalogOrdered: Array<{ id: string; name: string }>;

  if (normalizedIds.length > 0) {
    const rows = await db
      .select({ id: catalogSpecialties.id, name: catalogSpecialties.name })
      .from(catalogSpecialties)
      .where(and(inArray(catalogSpecialties.id, normalizedIds), eq(catalogSpecialties.isActive, true)));

    if (rows.length !== normalizedIds.length) {
      return NextResponse.json(
        { error: "Uma ou mais especialidades são inválidas ou estão indisponíveis." },
        { status: 400 },
      );
    }

    const byId = new Map(rows.map((r) => [r.id, r] as const));
    catalogOrdered = normalizedIds.map((id) => {
      const r = byId.get(id)!;
      return { id: r.id, name: r.name };
    });
  } else {
    return NextResponse.json({ error: "Selecione ao menos uma especialidade do catálogo." }, { status: 400 });
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
  const firstSpecialtyLabel = catalogOrdered[0]?.name ?? "";

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    // Conta nasce NAO confirmada — ativacao por codigo de 6 digitos via e-mail.
    email_confirm: false,
    app_metadata: { role: "PSYCHOLOGIST" },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Não foi possível criar o usuário." },
      { status: 400 }
    );
  }

  const userId = authData.user.id;
  const slug = generatePsychologistSlug(firstName, lastName);

  // Busca o plano "start" fora da transação (read-only, pode falhar sem rollback)
  const [startPlan] = await db
    .select({ id: subscriptionPlans.id, trialDays: subscriptionPlans.trialDays })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, "start"))
    .limit(1);

  if (!startPlan) {
    return NextResponse.json(
      { error: "Plano inicial não encontrado. Execute db:seed para cadastrar os planos." },
      { status: 500 },
    );
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + (startPlan.trialDays ?? 7));

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        fullName,
        role: "PSYCHOLOGIST",
      });

      const [psy] = await tx
        .insert(psychologists)
        .values({
          userId,
          slug,
          fullName,
          specialty: firstSpecialtyLabel,
          phone: phoneDigits,
          crp: null,
        })
        .returning({ id: psychologists.id });

      if (!psy) {
        throw new Error("no psychologist id");
      }

      for (let i = 0; i < catalogOrdered.length; i++) {
        const c = catalogOrdered[i];
        await tx.insert(psychologistSpecialties).values({
          psychologistId: psy.id,
          catalogSpecialtyId: c.id,
          label: c.name,
          sortOrder: i,
        });
      }

      // ── Cria a assinatura trial automaticamente no cadastro ──────────────────
      await tx.insert(psychologistSubscriptions).values({
        psychologistId: psy.id,
        planId:         startPlan.id,
        status:         "TRIAL",
        trialEndsAt,
      });
    });
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      {
        error:
          "Falha ao gravar no PostgreSQL (tabelas users/psychologists/especialidades). Confira DATABASE_URL, se aplicou migrations (`npm run db:migrate` ou `npm run db:push`) neste banco.",
      },
      { status: 500 },
    );
  }

  // Envia o codigo de ativacao (nao bloqueia o sucesso do cadastro se o e-mail falhar).
  try {
    await issueActivationCode({
      userId,
      email,
      name: fullName,
      baseUrl: resolveAppBaseUrl(req),
    });
  } catch (e) {
    console.error("[register-psychologist] issueActivationCode falhou", e);
  }

  return NextResponse.json({ ok: true, userId, requiresActivation: true, email });
}
