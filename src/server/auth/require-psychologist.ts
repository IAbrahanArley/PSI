import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologists } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class PsychologistAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PsychologistAuthError";
  }
}

export type PsychologistSessionContext = {
  userId: string;
  psychologistId: string;
};

/**
 * Garante Supabase autenticado, papel psicólogo/admin e linha em `psychologists`.
 * Camada server-only: use em services e actions (não exporte para o client).
 */
export async function requirePsychologist(): Promise<PsychologistSessionContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new PsychologistAuthError("Não autenticado.");
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    throw new PsychologistAuthError("Sem permissão.");
  }

  const [psy] = await db
    .select({ id: psychologists.id })
    .from(psychologists)
    .where(eq(psychologists.userId, user.id))
    .limit(1);

  if (!psy) {
    throw new PsychologistAuthError("Perfil de psicólogo não encontrado.");
  }

  return { userId: user.id, psychologistId: psy.id };
}
