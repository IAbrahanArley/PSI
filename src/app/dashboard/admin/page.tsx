import Link from "next/link";

export default function DashboardAdminPage() {
  return (
    <div className="container-fluid px-0">
      <h1 className="title text-secondary m-b20">Painel de administracao</h1>
      <p className="text-muted m-b20">
        Gerencie configuracoes globais e organize o catalogo utilizado nas buscas publicas.
      </p>

      <div className="d-flex flex-wrap gap-2">
        <Link href="/dashboard/admin/especialidades" className="btn btn-primary">
          Gerenciar especialidades
        </Link>
        <Link href="/dashboard" className="btn btn-outline-primary">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
