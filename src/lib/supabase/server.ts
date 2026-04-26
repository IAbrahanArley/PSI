import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Para Server Components e Route Handlers (sessão via cookies). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* setAll chamado de Server Component — middleware renova a sessão */
          }
        },
      },
    }
  );
}
