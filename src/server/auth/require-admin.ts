import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAuthError("Não autenticado.");
  }

  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);

  if (row?.role !== "ADMIN") {
    throw new AdminAuthError("Apenas administradores podem realizar esta ação.");
  }

  return { userId: user.id };
}
