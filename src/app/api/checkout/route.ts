import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { stripe, getStripePriceId } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { psychologists, psychologistSubscriptions, users } from "@/lib/db/schema";

// ─── Validação do body ────────────────────────────────────────────────────────

const BodySchema = z.object({
  planSlug:      z.enum(["start", "destaque"]),
  billingPeriod: z.enum(["monthly", "semiannual"]),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const role = getRoleFromUser(user);
    if (role !== "PSYCHOLOGIST") {
      return NextResponse.json(
        { error: "Apenas psicólogos podem assinar planos." },
        { status: 403 },
      );
    }

    // 2. Busca o registro do psicólogo (join com users para pegar e-mail)
    const [psy] = await db
      .select({
        id:       psychologists.id,
        fullName: psychologists.fullName,
        email:    users.email,
      })
      .from(psychologists)
      .innerJoin(users, eq(psychologists.userId, users.id))
      .where(eq(psychologists.userId, user.id))
      .limit(1);

    if (!psy) {
      return NextResponse.json({ error: "Psicólogo não encontrado." }, { status: 404 });
    }

    // 3. Valida o body
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const { planSlug, billingPeriod } = parsed.data;

    // 4. Obtém o price ID
    let priceId: string;
    try {
      priceId = getStripePriceId(planSlug, billingPeriod);
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 },
      );
    }

    // 5. Recupera ou cria customer Stripe
    // Busca o externalCustomerId diretamente na tabela de assinaturas
    const [existingSub] = await db
      .select({ externalCustomerId: psychologistSubscriptions.externalCustomerId })
      .from(psychologistSubscriptions)
      .where(eq(psychologistSubscriptions.psychologistId, psy.id))
      .limit(1)
      .catch(() => []);

    let customerId = existingSub?.externalCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    psy.email ?? user.email ?? undefined,
        name:     psy.fullName ?? undefined,
        metadata: { psychologistId: psy.id },
      });
      customerId = customer.id;
    }

    // 6. URL base para redirects
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // 7. Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      mode:      "subscription",
      customer:  customerId,
      line_items: [{ price: priceId, quantity: 1 }],

      // Metadata na sessão — acessível diretamente no evento checkout.session.completed
      metadata: {
        psychologistId: psy.id,
        planSlug,
        billingPeriod,
      },

      // Metadata também na subscription — acessível em invoice.paid / subscription.updated
      subscription_data: {
        metadata: {
          psychologistId: psy.id,
          planSlug,
          billingPeriod,
        },
      },

      // Permite cupom de desconto no checkout (opcional)
      allow_promotion_codes: true,

      success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/checkout/cancelado`,

      locale: "pt-BR",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout/route] erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
