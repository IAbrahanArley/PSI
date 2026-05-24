import {
  dbCountActivePatientsForPsychologist,
  dbGetPsychologistSubscriptionWithPlan,
} from "@/lib/db/queries/subscriptions.queries";

// ─────────────────────────────────────────────────────────────────────────────
// Erro tipado de limite de plano
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lançado quando uma operação viola o limite do plano atual.
 * Capturado nas actions para retornar `{ ok: false, error, limitReached: true }`.
 */
export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly current: number,
    public readonly max: number,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leitura do plano atual
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna os dados do plano ativo do psicólogo.
 * Lança `Error` se o psicólogo não tiver assinatura cadastrada.
 */
export async function getPsychologistPlanService(psychologistId: string) {
  const sub = await dbGetPsychologistSubscriptionWithPlan(psychologistId);
  if (!sub) {
    throw new Error("Assinatura não encontrada. Contate o suporte.");
  }
  return sub;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificação de limite de pacientes
// ─────────────────────────────────────────────────────────────────────────────

export type PatientLimitCheckResult = {
  /** Se o psicólogo pode adicionar mais um paciente */
  allowed: boolean;
  /** Total de pacientes ativos no momento */
  current: number;
  /** Limite do plano (null = ilimitado) */
  max: number | null;
  /** Slug do plano atual ("start" | "destaque") */
  planSlug: string;
};

/**
 * Verifica se o psicólogo pode vincular um novo paciente ativo.
 *
 * Regras:
 *  - Se não tiver assinatura → bloqueia (não deveria chegar aqui, mas fail-safe).
 *  - Se `max_active_patients = null` → ilimitado, sempre permite.
 *  - Se já tiver `current >= max` → bloqueia.
 *  - Assinaturas EXPIRED ou CANCELLED → bloqueia independente do limite.
 */
export async function checkPatientLimitService(
  psychologistId: string,
): Promise<PatientLimitCheckResult> {
  const sub = await dbGetPsychologistSubscriptionWithPlan(psychologistId);

  if (!sub) {
    return { allowed: false, current: 0, max: 0, planSlug: "none" };
  }

  // Assinatura expirada ou cancelada → bloqueia tudo
  if (sub.status === "EXPIRED" || sub.status === "CANCELLED") {
    const current = await dbCountActivePatientsForPsychologist(psychologistId);
    return {
      allowed: false,
      current,
      max: sub.maxActivePatients,
      planSlug: sub.planSlug,
    };
  }

  // Plano sem limite de pacientes (Destaque)
  if (sub.maxActivePatients === null) {
    const current = await dbCountActivePatientsForPsychologist(psychologistId);
    return { allowed: true, current, max: null, planSlug: sub.planSlug };
  }

  // Plano com limite (Start → 10)
  const current = await dbCountActivePatientsForPsychologist(psychologistId);
  const allowed = current < sub.maxActivePatients;

  return {
    allowed,
    current,
    max: sub.maxActivePatients,
    planSlug: sub.planSlug,
  };
}

/**
 * Versão que lança `PlanLimitError` ao invés de retornar `allowed: false`.
 * Use dentro de services para interromper o fluxo com mensagem clara.
 */
export async function assertPatientLimitService(psychologistId: string): Promise<void> {
  const result = await checkPatientLimitService(psychologistId);

  if (!result.allowed) {
    const sub = await dbGetPsychologistSubscriptionWithPlan(psychologistId);

    if (sub?.status === "EXPIRED" || sub?.status === "CANCELLED") {
      throw new PlanLimitError(
        "Sua assinatura está inativa. Renove para continuar atendendo novos pacientes.",
        result.current,
        result.max ?? 0,
      );
    }

    throw new PlanLimitError(
      `Você atingiu o limite de ${result.max} pacientes ativos do plano ${result.planSlug === "start" ? "Start" : "Destaque"}. Faça upgrade para o plano Destaque e atenda sem limites.`,
      result.current,
      result.max ?? 0,
    );
  }
}
