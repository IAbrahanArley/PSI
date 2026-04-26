import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sincroniza `app_metadata.role` no JWT a partir de `public.users`
 * (útil para contas criadas antes de `app_metadata` no cadastro).
 */
export async function POST() {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "DATABASE_URL não configurada." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  if (!row) {
    return NextResponse.json({ error: "Usuário não encontrado no banco." }, { status: 404 });
  }

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: { role: row.role },
  });

  return NextResponse.json({ ok: true, role: row.role });
}
