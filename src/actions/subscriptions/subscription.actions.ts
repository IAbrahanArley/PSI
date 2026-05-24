"use server";

import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";
import {
  checkPatientLimitService,
  getPsychologistPlanService,
  PlanLimitError,
} from "@/services/subscriptions/subscription.service";

function authError(e: unknown): { ok: false; error: string } {
  if (e instanceof PsychologistAuthError) return { ok: false, error: e.message };
  throw e;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plano atual
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna os dados do plano ativo do psicólogo logado.
 * Use para exibir badge de plano, canais de suporte e features no dashboard.
 */
export async function actionGetMyPlan() {
  try {
    const ctx = await requirePsychologist();
    const plan = await getPsychologistPlanService(ctx.psychologistId);
    return { ok: true as const, plan };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificação de limite de pacientes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o psicólogo logado ainda pode adicionar um paciente.
 *
 * Use na UI antes de exibir o botão/formulário "Adicionar paciente":
 *
 * ```tsx
 * const result = await actionCheckPatientLimit();
 * if (result.ok && !result.allowed) {
 *   return <UpgradeBanner current={result.current} max={result.max} />;
 * }
 * ```
 *
 * Retorno:
 *  - `allowed`  — se pode adicionar mais um paciente
 *  - `current`  — quantos pacientes ativos tem agora
 *  - `max`      — limite do plano (null = ilimitado)
 *  - `planSlug` — "start" | "destaque"
 */
export async function actionCheckPatientLimit() {
  try {
    const ctx = await requirePsychologist();
    const result = await checkPatientLimitService(ctx.psychologistId);
    return { ok: true as const, ...result };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}
