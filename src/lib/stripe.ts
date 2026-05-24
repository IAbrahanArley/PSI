import Stripe from "stripe";

/**
 * Singleton lazy do cliente Stripe.
 * A instância só é criada na primeira chamada a `getStripe()`,
 * evitando erros de variável ausente durante o build estático da Vercel.
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY não configurado. " +
      "Adicione a variável de ambiente no painel da Vercel (Settings → Environment Variables).",
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });

  return _stripe;
}

/**
 * Proxy que se comporta como o objeto `stripe` mas inicializa de forma lazy.
 * Use `stripe.checkout.sessions.create(...)` normalmente — o cliente
 * só é instanciado quando a primeira chamada de API ocorre em runtime.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
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
