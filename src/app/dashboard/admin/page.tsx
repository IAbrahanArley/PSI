import Link from "next/link";

export default function DashboardAdminPage() {
  return (
    <div className="container-fluid px-0">
      <h1 className="title text-secondary m-b20">Administração</h1>
      <p className="text-muted m-b20">Área exclusiva para papel ADMIN.</p>
      <Link href="/dashboard" className="btn btn-outline-secondary">
        Voltar ao início do painel
      </Link>
    </div>
  );
}
