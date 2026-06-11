import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";

export default async function PacienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login/paciente");

  const role = getRoleFromUser(user);

  // ADMIN pode acessar qualquer área
  if (role === "ADMIN") {
    return <div className="container-fluid px-0">{children}</div>;
  }

  // Apenas PATIENT acessa a área do paciente
  if (role !== "PATIENT") {
    if (role === "PSYCHOLOGIST") redirect("/dashboard/psicologo/agenda");
    redirect("/login/paciente");
  }

  return <div className="container-fluid px-0">{children}</div>;
}
