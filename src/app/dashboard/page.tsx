import Link from "next/link";
import { getRoleFromUser } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromUser(user);

  return (
    <div className="container-fluid px-0">
      <h1 className="title text-secondary m-b20">Inicio do painel</h1>
      <p className="text-muted m-b30">
        Bem-vindo{user?.email ? `, ${user.email}` : ""}. Use os atalhos abaixo para acessar as areas disponiveis para o seu perfil.
      </p>

      <div className="d-flex flex-wrap gap-2">
        {(role === "ADMIN" || role === "PSYCHOLOGIST") && (
          <Link href="/dashboard/psicologo" className="btn btn-primary">
            Area do psicologo
          </Link>
        )}
        {(role === "ADMIN" || role === "PATIENT") && (
          <Link href="/dashboard/paciente" className="btn btn-secondary">
            Area do paciente
          </Link>
        )}
        {role === "ADMIN" && (
          <Link href="/dashboard/admin" className="btn btn-outline-primary">
            Administracao
          </Link>
        )}
      </div>
    </div>
  );
}
