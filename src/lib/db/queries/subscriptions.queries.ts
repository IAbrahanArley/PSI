import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistPatientCare, psychologistSubscriptions, subscriptionPlans } from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Leitura de assinatura
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a assinatura atual do psicólogo com todos os dados do plano embutidos.
 * Retorna `null` se o psicólogo ainda não tiver assinatura cadastrada.
 */
export async function dbGetPsychologistSubscriptionWithPlan(psychologistId: string) {
  const [row] = await db
    .select({
      // assinatura
      subscriptionId: psychologistSubscriptions.id,
      status: psychologistSubscriptions.status,
      trialEndsAt: psychologistSubscriptions.trialEndsAt,
      currentPeriodStart: psychologistSubscriptions.currentPeriodStart,
      currentPeriodEnd: psychologistSubscriptions.currentPeriodEnd,
      cancelledAt: psychologistSubscriptions.cancelledAt,
      // plano
      planId: subscriptionPlans.id,
      planSlug: subscriptionPlans.slug,
      planName: subscriptionPlans.name,
      maxActivePatients: subscriptionPlans.maxActivePatients,
      hasListingHighlight: subscriptionPlans.hasListingHighlight,
      hasAiAccess: subscriptionPlans.hasAiAccess,
      supportChannels: subscriptionPlans.supportChannels,
      trialDays: subscriptionPlans.trialDays,
    })
    .from(psychologistSubscriptions)
    .innerJoin(subscriptionPlans, eq(psychologistSubscriptions.planId, subscriptionPlans.id))
    .where(eq(psychologistSubscriptions.psychologistId, psychologistId))
    .limit(1);

  return row ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contagem de pacientes ativos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Conta quantos casos clínicos com status ACTIVE este psicólogo possui.
 * É este número que é comparado com `subscription_plans.max_active_patients`.
 */
export async function dbCountActivePatientsForPsychologist(psychologistId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(psychologistPatientCare)
    .where(
      and(
        eq(psychologistPatientCare.psychologistId, psychologistId),
        eq(psychologistPatientCare.status, "ACTIVE"),
      ),
    );

  return row?.total ?? 0;
}
