import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "./enums";
import { psychologists } from "./psychologists";

// ─────────────────────────────────────────────────────────────────────────────
// subscription_plans
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Catálogo de planos disponíveis na plataforma.
 *
 * Planos atuais:
 *  - "start"    → até 10 pacientes ativos, trial 7 dias, suporte por e-mail.
 *  - "destaque" → pacientes ilimitados, aparece primeiro na listagem, suporte e-mail + WhatsApp.
 *
 * Ambos os planos incluem acesso à IA e todas as features de perfil sem restrição
 * (notas, prontuário, tags, prêmios, currículo, endereços, redes sociais).
 *
 * `max_active_patients = NULL` significa ilimitado.
 * `support_channels`   é um array de texto, ex.: ["email"] ou ["email", "whatsapp"].
 */
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Identificador de negócio único. Usado no código para verificar permissões. */
    slug: text("slug").notNull().unique(),

    name: text("name").notNull(),
    description: text("description"),

    /** Preço mensal em BRL; NULL = plano sem cobrança recorrente (ex.: trial only). */
    priceBrl: numeric("price_brl", { precision: 10, scale: 2 }),

    /** Dias de trial gratuito ao ativar o plano pela primeira vez. 0 = sem trial. */
    trialDays: integer("trial_days").notNull().default(0),

    /**
     * Máximo de pacientes com status ACTIVE em `psychologist_patient_care`.
     * NULL = sem limite (plano Destaque).
     */
    maxActivePatients: integer("max_active_patients"),

    /**
     * Quando true, o psicólogo aparece no topo da listagem pública (/team)
     * e tem `advertising_highlight = true` sincronizado em `psychologists`.
     */
    hasListingHighlight: boolean("has_listing_highlight").notNull().default(false),

    /** Acesso às funcionalidades de IA da plataforma. */
    hasAiAccess: boolean("has_ai_access").notNull().default(true),

    /**
     * Canais de suporte disponíveis para o plano.
     * Valores possíveis: "email" | "whatsapp"
     * Ex.: ["email"] ou ["email", "whatsapp"]
     */
    supportChannels: text("support_channels")
      .array()
      .notNull()
      .default(sql`ARRAY['email']::text[]`),

    /** Se false, o plano não aparece na tela de escolha (desativado pelo admin). */
    isActive: boolean("is_active").notNull().default(true),

    /** Ordem de exibição na tela de planos (menor = primeiro). */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activeIdx: index("subscription_plans_active_idx").on(t.isActive, t.sortOrder),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// psychologist_subscriptions
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Assinatura atual de cada psicólogo — um registro por psicólogo (UNIQUE).
 *
 * Ciclo de vida típico:
 *
 *   Cadastro → [TRIAL] → upgrade pago → [ACTIVE] → renovação automática
 *                      → sem upgrade  → [EXPIRED] → banner de upgrade
 *   [ACTIVE] → cancelamento → [CANCELLED] → fim do período → [EXPIRED]
 *   [ACTIVE] → falha no pagamento → [PAST_DUE] → resolução → [ACTIVE]
 *                                              → não resolve → [EXPIRED]
 *
 * Regras de negócio:
 *  - `trial_ends_at` obrigatório quando status = TRIAL (verificado na aplicação).
 *  - `current_period_start` / `current_period_end` preenchidos ao ativar pagamento.
 *  - Ao assinar o plano Destaque, sincronizar `psychologists.advertising_highlight = true`.
 *  - Ao cancelar/expirar o plano Destaque, sincronizar `advertising_highlight = false`.
 */
export const psychologistSubscriptions = pgTable(
  "psychologist_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Um psicólogo tem no máximo uma assinatura ativa por vez. */
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" })
      .unique(),

    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),

    status: subscriptionStatusEnum("status").notNull().default("TRIAL"),

    /**
     * Data/hora de expiração do trial (só relevante quando status = TRIAL).
     * NULL para planos sem trial (Destaque) ou após upgrade.
     */
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),

    /** Início do período de cobrança atual. NULL durante trial. */
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),

    /** Fim do período de cobrança atual. NULL durante trial. */
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

    /** Preenchido quando o psicólogo ou o admin cancela. */
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    /** Motivo opcional do cancelamento. */
    cancelReason: text("cancel_reason"),

    /**
     * Referência externa ao gateway de pagamento (ex.: ID do customer no Stripe/Asaas).
     * Facilita reconciliação e webhooks sem busca extra.
     */
    externalCustomerId: text("external_customer_id"),

    /**
     * ID da assinatura no gateway de pagamento.
     * Permite cancelar/pausar via API sem manter estado local duplicado.
     */
    externalSubscriptionId: text("external_subscription_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    /** Garante unicidade nomeada para uso em upserts. */
    psychologistUidx: uniqueIndex("psychologist_subscriptions_psychologist_uidx").on(
      t.psychologistId,
    ),

    /** Queries de monitoramento: todos os trials prestes a expirar, todos os PAST_DUE, etc. */
    statusIdx: index("psychologist_subscriptions_status_idx").on(t.status),

    /** Busca rápida por ID externo ao processar webhooks do gateway. */
    externalSubIdx: index("psychologist_subscriptions_external_sub_idx").on(
      t.externalSubscriptionId,
    ),

    /**
     * Garante que status TRIAL sempre tenha trial_ends_at preenchido,
     * e que status não-TRIAL não carregue trial_ends_at (evita confusão).
     */
    trialConsistency: check(
      "psychologist_subscriptions_trial_consistency",
      sql`(
        (status = 'TRIAL'  AND trial_ends_at IS NOT NULL) OR
        (status <> 'TRIAL' AND trial_ends_at IS NULL)
      )`,
    ),
  }),
);
