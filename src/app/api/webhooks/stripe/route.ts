import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  psychologistSubscriptions,
  psychologists,
  subscriptionPlans,
} from "@/lib/db/schema";

// ─── Configuração do Next.js ──────────────────────────────────────────────────
export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(epoch: number | null | undefined): Date | null {
  return epoch ? new Date(epoch * 1000) : null;
}

/**
 * Extrai start/end do período atual a partir dos items da subscription.
 * No Stripe v22, current_period_start/end estão em cada SubscriptionItem.
 */
function extractPeriod(sub: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = sub.items?.data?.[0];
  return {
    start: toDate(item?.current_period_start),
    end:   toDate(item?.current_period_end),
  };
}

/**
 * Atualiza `psychologists.advertising_highlight` conforme o slug do plano.
 * Plano "destaque" → highlight true; qualquer outro → highlight false.
 */
async function syncAdvertisingHighlight(psychologistId: string, planSlug: string) {
  await db
    .update(psychologists)
    .set({ advertisingHighlight: planSlug === "destaque" })
    .where(eq(psychologists.id, psychologistId));
}

/**
 * Busca o planId pelo slug. Retorna null se não encontrado.
 */
async function getPlanIdBySlug(slug: string): Promise<string | null> {
  const [plan] = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, slug))
    .limit(1);
  return plan?.id ?? null;
}

// ─── Handlers por evento ──────────────────────────────────────────────────────

/**
 * checkout.session.completed
 * Primeira compra (ou reativação via Checkout) concluída com sucesso.
 * A metadata está em session.metadata (definida ao criar a sessão).
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const meta           = session.metadata as Record<string, string> | null;
  const psychologistId = meta?.psychologistId;
  const planSlug       = meta?.planSlug;

  if (!psychologistId || !planSlug) {
    console.warn("[stripe/webhook] checkout.session.completed sem metadata", session.id);
    return;
  }

  const planId = await getPlanIdBySlug(planSlug);
  if (!planId) {
    console.error("[stripe/webhook] plano não encontrado:", planSlug);
    return;
  }

  // Recupera a subscription para pegar o período atual (items[0].current_period_*)
  const stripeSubId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!stripeSubId) {
    console.error("[stripe/webhook] subscription ID ausente na session", session.id);
    return;
  }

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data"],
  });

  const { start, end } = extractPeriod(stripeSub);

  await db
    .insert(psychologistSubscriptions)
    .values({
      psychologistId,
      planId,
      status:                 "ACTIVE",
      trialEndsAt:            null,
      currentPeriodStart:     start,
      currentPeriodEnd:       end,
      externalCustomerId:     session.customer as string,
      externalSubscriptionId: stripeSubId,
    })
    .onConflictDoUpdate({
      target: psychologistSubscriptions.psychologistId,
      set: {
        planId,
        status:                 "ACTIVE",
        trialEndsAt:            null,
        currentPeriodStart:     start,
        currentPeriodEnd:       end,
        externalCustomerId:     session.customer as string,
        externalSubscriptionId: stripeSubId,
        cancelledAt:            null,
        cancelReason:           null,
        updatedAt:              new Date(),
      },
    });

  await syncAdvertisingHighlight(psychologistId, planSlug);
  console.log(`[stripe/webhook] Assinatura ativada: psy=${psychologistId} plan=${planSlug}`);
}

/**
 * invoice.paid
 * Renovação bem-sucedida de um período.
 * No Stripe v22, a subscription está em invoice.parent.subscription_details.subscription
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails) return;

  const stripeSubId = typeof subDetails.subscription === "string"
    ? subDetails.subscription
    : subDetails.subscription?.id;

  if (!stripeSubId) return;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data"],
  });

  const psychologistId = stripeSub.metadata?.psychologistId;
  const planSlug       = stripeSub.metadata?.planSlug;
  const { start, end } = extractPeriod(stripeSub);

  if (!psychologistId) {
    console.warn("[stripe/webhook] invoice.paid sem psychologistId na subscription", stripeSubId);
    return;
  }

  await db
    .update(psychologistSubscriptions)
    .set({
      status:             "ACTIVE",
      currentPeriodStart: start,
      currentPeriodEnd:   end,
      cancelledAt:        null,
      cancelReason:       null,
      updatedAt:          new Date(),
    })
    .where(eq(psychologistSubscriptions.externalSubscriptionId, stripeSubId));

  if (planSlug) await syncAdvertisingHighlight(psychologistId, planSlug);
  console.log(`[stripe/webhook] Fatura paga (renovação): sub=${stripeSubId}`);
}

/**
 * invoice.payment_failed
 * Pagamento falhou — marca como PAST_DUE.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details;
  if (!subDetails) return;

  const stripeSubId = typeof subDetails.subscription === "string"
    ? subDetails.subscription
    : subDetails.subscription?.id;

  if (!stripeSubId) return;

  await db
    .update(psychologistSubscriptions)
    .set({
      status:    "PAST_DUE",
      updatedAt: new Date(),
    })
    .where(eq(psychologistSubscriptions.externalSubscriptionId, stripeSubId));

  console.log(`[stripe/webhook] Pagamento falhou: sub=${stripeSubId}`);
}

/**
 * customer.subscription.deleted
 * Assinatura cancelada / expirada no Stripe.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const psychologistId = subscription.metadata?.psychologistId;

  const finalStatus: "CANCELLED" | "EXPIRED" =
    subscription.cancellation_details?.reason === "cancellation_requested"
      ? "CANCELLED"
      : "EXPIRED";

  await db
    .update(psychologistSubscriptions)
    .set({
      status:      finalStatus,
      cancelledAt: new Date(),
      cancelReason: subscription.cancellation_details?.reason ?? null,
      updatedAt:   new Date(),
    })
    .where(eq(psychologistSubscriptions.externalSubscriptionId, subscription.id));

  if (psychologistId) {
    await db
      .update(psychologists)
      .set({ advertisingHighlight: false })
      .where(eq(psychologists.id, psychologistId));
  }

  console.log(`[stripe/webhook] Assinatura encerrada (${finalStatus}): sub=${subscription.id}`);
}

/**
 * customer.subscription.updated
 * Mudança de plano (upgrade/downgrade) ou reativação.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const psychologistId = subscription.metadata?.psychologistId;
  const planSlug       = subscription.metadata?.planSlug;

  if (!psychologistId || !planSlug) return;
  if (subscription.status !== "active") return;

  const planId = await getPlanIdBySlug(planSlug);
  if (!planId) return;

  const { start, end } = extractPeriod(subscription);

  await db
    .update(psychologistSubscriptions)
    .set({
      planId,
      status:             "ACTIVE",
      currentPeriodStart: start,
      currentPeriodEnd:   end,
      updatedAt:          new Date(),
    })
    .where(eq(psychologistSubscriptions.externalSubscriptionId, subscription.id));

  await syncAdvertisingHighlight(psychologistId, planSlug);
  console.log(`[stripe/webhook] Assinatura atualizada: psy=${psychologistId} plan=${planSlug}`);
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET não configurado");
    return NextResponse.json({ error: "Configuração inválida." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Falha na verificação da assinatura:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] Erro ao processar evento ${event.type}:`, err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
