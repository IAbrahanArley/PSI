import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologists } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { dbGetPsychologistSubscriptionWithPlan } from "@/lib/db/queries/subscriptions.queries";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Avalia se a assinatura bloqueia o acesso ao dashboard agora.
 * Retorna o motivo para a query string da página /assinar, ou null se o acesso é permitido.
 */
function resolveBlockReason(
  sub: Awaited<ReturnType<typeof dbGetPsychologistSubscriptionWithPlan>>,
): string | null {
  if (!sub) return "sem_assinatura";

  const now = new Date();

  switch (sub.status) {
    case "EXPIRED":
      return "expirado";

    case "TRIAL":
      // Trial ativo mas já passou da data de vencimento
      if (sub.trialEndsAt && sub.trialEndsAt < now) return "trial_expirado";
      return null; // Trial ainda válido

    case "CANCELLED":
      // Cancelado mas ainda dentro do período pago → permite até o fim do período
      if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) return "cancelado";
      return null;

    case "PAST_DUE":
      // Pagamento atrasado — bloqueia imediatamente (personalize se quiser período de graça)
      return "pagamento_pendente";

    case "ACTIVE":
      return null; // Tudo certo
  }
}

// ─── layout ──────────────────────────────────────────────────────────────────

export default async function PsicologoLayout({ children }: { children: React.ReactNode }) {
  // 1. Usuário autenticado
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2. ADMIN passa direto — nunca bloqueado por plano
  const role = getRoleFromUser(user);
  if (role === "ADMIN") {
    return <div className="container-fluid px-0">{children}</div>;
  }

  // 3. Busca o registro do psicólogo
  const [psy] = await db
    .select({ id: psychologists.id })
    .from(psychologists)
    .where(eq(psychologists.userId, user.id))
    .limit(1);

  if (!psy) redirect("/login");

  // 4. Busca assinatura com dados do plano
  let blockReason: string | null = null;

  try {
    const sub = await dbGetPsychologistSubscriptionWithPlan(psy.id);
    blockReason = resolveBlockReason(sub);
  } catch {
    // Banco indisponível momentaneamente → não bloqueia (fail-open intencional)
    // Troque por `blockReason = "erro"` se preferir fail-safe
  }

  // 5. Redireciona para a página de upgrade se bloqueado
  if (blockReason) {
    redirect(`/assinar?motivo=${blockReason}`);
  }

  return <div className="container-fluid px-0">{children}</div>;
}
