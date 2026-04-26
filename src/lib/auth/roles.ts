import type { User } from "@supabase/supabase-js";

/** Espelha `user_role` em `src/lib/db/schema/enums.ts` */
export type UserRole = "ADMIN" | "PATIENT" | "PSYCHOLOGIST";

export function getRoleFromUser(user: User | null): UserRole | null {
  const r = user?.app_metadata?.role;
  if (r === "ADMIN" || r === "PATIENT" || r === "PSYCHOLOGIST") return r;
  return null;
}

/** ADMIN acessa qualquer área restrita. */
export function canAccessDashboardPath(role: UserRole | null, pathname: string): boolean {
  if (!role) return false;
  if (role === "ADMIN") return true;
  if (pathname.startsWith("/dashboard/admin")) return false;
  if (pathname.startsWith("/dashboard/psicologo")) return role === "PSYCHOLOGIST";
  if (pathname.startsWith("/dashboard/paciente")) return role === "PATIENT";
  return true;
}
