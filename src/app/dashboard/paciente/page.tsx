import Link from "next/link";

export default function DashboardPacientePage() {
  return (
    <div className="container-fluid px-0">
      <h1 className="title text-secondary m-b20">Paciente</h1>
      <p className="text-muted m-b20">Área exclusiva para perfis com papel PATIENT (ou ADMIN).</p>
      <Link href="/dashboard" className="btn btn-outline-secondary">
        Voltar ao início do painel
      </Link>
    </div>
  );
}
