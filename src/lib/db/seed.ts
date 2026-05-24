/**
 * Seed: Planos de assinatura
 * ─────────────────────────────────────────────────────────────────────────────
 * Executa com:  npm run db:seed
 *
 * Idempotente — usa upsert por `slug`. Pode ser rodado quantas vezes quiser:
 *   - Se o plano não existir → cria.
 *   - Se já existir → atualiza os campos (exceto id e created_at).
 *
 * Para ajustar preços, altere os campos `priceBrl` abaixo e rode novamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { subscriptionPlans } from "./schema/subscriptions";

// ─── conexão direta (seed roda fora do Next.js) ───────────────────────────────
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error("❌  DATABASE_URL não encontrada. Configure .env.local antes de rodar o seed.");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// ─── definição dos planos ─────────────────────────────────────────────────────
const plans = [
  {
    // ── PLANO START ─────────────────────────────────────────────────────────
    slug: "start",
    name: "Start",
    description:
      "Ideal para psicólogos que estão começando na plataforma. Inclui 7 dias grátis e acesso a todas as funcionalidades essenciais.",

    // 💰 Altere o preço quando definir o valor comercial (ex.: "79.90")
    priceBrl: "79.90",

    trialDays: 7,

    // Limite de pacientes ativos — ao atingir 10, bloqueia novos vínculos
    maxActivePatients: 10,

    hasListingHighlight: false,
    hasAiAccess: true,

    // Suporte apenas por e-mail
    supportChannels: ["email"],

    isActive: true,
    sortOrder: 0,
  },
  {
    // ── PLANO DESTAQUE ───────────────────────────────────────────────────────
    slug: "destaque",
    name: "Destaque",
    description:
      "Para psicólogos que querem máxima visibilidade. Apareça em primeiro na listagem, atenda pacientes ilimitados e conte com suporte prioritário.",

    // 💰 Altere o preço quando definir o valor comercial (ex.: "149.90")
    priceBrl: "149.90",

    trialDays: 0,

    // NULL = sem limite de pacientes
    maxActivePatients: null,

    hasListingHighlight: true,
    hasAiAccess: true,

    // Suporte por e-mail + WhatsApp
    supportChannels: ["email", "whatsapp"],

    isActive: true,
    sortOrder: 1,
  },
] as const;

// ─── upsert ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Iniciando seed de planos...\n");

  for (const plan of plans) {
    const existing = await db
      .select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, plan.slug))
      .limit(1);

    if (existing.length === 0) {
      // ── INSERT ─────────────────────────────────────────────────────────────
      const [created] = await db
        .insert(subscriptionPlans)
        .values({
          ...plan,
          supportChannels: [...plan.supportChannels],
        })
        .returning({ id: subscriptionPlans.id, slug: subscriptionPlans.slug });

      console.log(`  ✅  Plano criado   → [${created.slug}]  id: ${created.id}`);
    } else {
      // ── UPDATE (sem tocar em id / created_at) ──────────────────────────────
      const [updated] = await db
        .update(subscriptionPlans)
        .set({
          name: plan.name,
          description: plan.description,
          priceBrl: plan.priceBrl,
          trialDays: plan.trialDays,
          maxActivePatients: plan.maxActivePatients,
          hasListingHighlight: plan.hasListingHighlight,
          hasAiAccess: plan.hasAiAccess,
          supportChannels: [...plan.supportChannels],
          isActive: plan.isActive,
          sortOrder: plan.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.slug, plan.slug))
        .returning({ id: subscriptionPlans.id, slug: subscriptionPlans.slug });

      console.log(`  🔄  Plano atualizado→ [${updated.slug}]  id: ${updated.id}`);
    }
  }

  // ── resumo final ────────────────────────────────────────────────────────────
  const all = await db
    .select({
      slug: subscriptionPlans.slug,
      name: subscriptionPlans.name,
      priceBrl: subscriptionPlans.priceBrl,
      trialDays: subscriptionPlans.trialDays,
      maxActivePatients: subscriptionPlans.maxActivePatients,
      hasListingHighlight: subscriptionPlans.hasListingHighlight,
      supportChannels: subscriptionPlans.supportChannels,
    })
    .from(subscriptionPlans)
    .orderBy(subscriptionPlans.sortOrder);

  console.log("\n📋  Planos no banco:\n");
  console.table(
    all.map((p) => ({
      slug: p.slug,
      name: p.name,
      "preço (R$)": p.priceBrl ?? "—",
      "trial (dias)": p.trialDays,
      "máx. pacientes": p.maxActivePatients ?? "ilimitado",
      destaque: p.hasListingHighlight ? "✅" : "❌",
      suporte: p.supportChannels?.join(" + ") ?? "—",
    })),
  );

  console.log("\n✅  Seed concluído!\n");
  await client.end();
}

seed().catch((err) => {
  console.error("❌  Erro no seed:", err);
  client.end();
  process.exit(1);
});
