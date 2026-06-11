import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { stripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { psychologists, psychologistSubscriptions } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const role = getRoleFromUser(user);
    if (role !== "PSYCHOLOGIST") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Busca o psicólogo
    const [psy] = await db
      .select({ id: psychologists.id })
      .from(psychologists)
      .where(eq(psychologists.userId, user.id))
      .limit(1);

    if (!psy) {
      return NextResponse.json({ error: "Psicólogo não encontrado." }, { status: 404 });
    }

    // Busca o customer ID externo
    const [sub] = await db
      .select({ externalCustomerId: psychologistSubscriptions.externalCustomerId })
      .from(psychologistSubscriptions)
      .where(eq(psychologistSubscriptions.psychologistId, psy.id))
      .limit(1);

    if (!sub?.externalCustomerId) {
      return NextResponse.json(
        { error: "Nenhuma assinatura Stripe encontrada. Assine um plano primeiro." },
        { status: 400 },
      );
    }

    // URL de retorno
    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.externalCustomerId,
      return_url: `${origin}/dashboard/psicologo/assinatura`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[billing-portal] erro:", err);
    return NextResponse.json({ error: "Erro ao abrir portal de cobrança." }, { status: 500 });
  }
}
