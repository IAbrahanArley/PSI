import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurado no .env.local");
}

/**
 * Singleton do cliente Stripe para uso em Server Components, API Routes e Server Actions.
 * Nunca importe este módulo em código cliente ("use client").
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

// ─── Mapa de price IDs por plano e período ────────────────────────────────────

/**
 * Slugs dos planos — devem coincidir com a coluna `slug` em `subscription_plans`.
 * "start"    → Plano Essencial (até 10 pacientes, trial 7 dias)
 * "destaque" → Plano Premium   (ilimitado, destaque na listagem)
 */
export type PlanSlug = "start" | "destaque";
export type BillingPeriod = "monthly" | "semiannual";

/**
 * Retorna o Price ID do Stripe para a combinação plano + período.
 * Lança erro se a variável de ambiente não estiver configurada.
 */
export function getStripePriceId(slug: PlanSlug, period: BillingPeriod): string {
  const map: Record<PlanSlug, Record<BillingPeriod, string | undefined>> = {
    start: {
      monthly:    process.env.STRIPE_PRICE_ESSENCIAL_MONTHLY,
      semiannual: process.env.STRIPE_PRICE_ESSENCIAL_SEMIANNUAL,
    },
    destaque: {
      monthly:    process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      semiannual: process.env.STRIPE_PRICE_PREMIUM_SEMIANNUAL,
    },
  };

  const priceId = map[slug]?.[period];
  if (!priceId || priceId.startsWith("price_XXXX")) {
    throw new Error(
      `Price ID do Stripe não configurado para o plano "${slug}" (${period}). ` +
      `Preencha as variáveis STRIPE_PRICE_* no .env.local.`,
    );
  }

  return priceId;
}

// ─── Labels legíveis ──────────────────────────────────────────────────────────

export const PLAN_LABELS: Record<PlanSlug, string> = {
  start:    "Plano Essencial",
  destaque: "Plano Premium",
};

export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly:    "Mensal",
  semiannual: "Semestral",
};
