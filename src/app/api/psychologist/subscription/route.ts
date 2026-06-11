import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { psychologists, psychologistSubscriptions } from "@/lib/db/schema";
import { dbGetPsychologistSubscriptionWithPlan } from "@/lib/db/queries/subscriptions.queries";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const role = getRoleFromUser(user);
    if (role !== "PSYCHOLOGIST") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    }

    // Busca o psicólogo
    const [psy] = await db
      .select({ id: psychologists.id })
      .from(psychologists)
      .where(eq(psychologists.userId, user.id))
      .limit(1);

    if (!psy) {
      return NextResponse.json({ error: "Psicólogo não encontrado." }, { status: 404 });
    }

    // Busca assinatura + plano
    const subscription = await dbGetPsychologistSubscriptionWithPlan(psy.id);

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // Busca IDs externos (necessário para o portal do Stripe)
    const [subExternal] = await db
      .select({
        externalCustomerId: psychologistSubscriptions.externalCustomerId,
        externalSubscriptionId: psychologistSubscriptions.externalSubscriptionId,
      })
      .from(psychologistSubscriptions)
      .where(eq(psychologistSubscriptions.psychologistId, psy.id))
      .limit(1);

    return NextResponse.json({
      subscription: {
        ...subscription,
        externalCustomerId: subExternal?.externalCustomerId ?? null,
        externalSubscriptionId: subExternal?.externalSubscriptionId ?? null,
      },
    });
  } catch (err) {
    console.error("[psychologist/subscription] erro:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
