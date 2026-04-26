import { eq } from "drizzle-orm";
import { DashboardShell } from "./_components/DashboardShell";
import { getRoleFromUser } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromUser(user);

  const metaAvatar =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  let dbAvatar: string | null = null;
  if (user?.id && process.env.DATABASE_URL) {
    try {
      const [row] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      dbAvatar = row?.avatarUrl ?? null;
    } catch {
      /* banco indisponível — segue só com metadata */
    }
  }

  const userAvatarUrl = dbAvatar ?? metaAvatar;

  return (
    <DashboardShell
      userEmail={user?.email ?? null}
      userAvatarUrl={userAvatarUrl}
      role={role}
    >
      {children}
    </DashboardShell>
  );
}
