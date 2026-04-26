import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleFromUser } from "@/lib/auth/roles";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromUser(user);

  return (
    <div className="container-fluid px-0">
      <h1 className="title text-secondary m-b20">Início</h1>
      <p className="text-muted m-b30">
        Olá{user?.email ? `, ${user.email}` : ""}. Papel:{" "}
        <strong>{role ?? "—"}</strong>
      </p>
      <div className="d-flex flex-wrap gap-2">
        {(role === "ADMIN" || role === "PSYCHOLOGIST") && (
          <Link href="/dashboard/psicologo" className="btn btn-primary">
            Área do psicólogo
          </Link>
        )}
        {(role === "ADMIN" || role === "PATIENT") && (
          <Link href="/dashboard/paciente" className="btn btn-secondary">
            Área do paciente
          </Link>
        )}
        {role === "ADMIN" && (
          <Link href="/dashboard/admin" className="btn btn-outline-dark">
            Administração
          </Link>
        )}
      </div>
    </div>
  );
}
