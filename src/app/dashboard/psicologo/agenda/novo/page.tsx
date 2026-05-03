import Link from "next/link";

export default function AgendaNovoAgendamentoPage() {
  return (
    <div className="mx-auto card shadow-sm text-center" style={{ maxWidth: "32rem" }}>
      <div className="card-body p-4 p-md-5">
        <h1 className="h4 mb-0">Novo agendamento</h1>
        <p className="mt-3 small text-muted mb-0">
          Estamos finalizando esta tela. Em breve você poderá criar novos agendamentos por aqui com todos os campos do atendimento.
        </p>
        <Link href="/dashboard/psicologo/agenda" className="btn btn-primary mt-4">
          Voltar à agenda
        </Link>
      </div>
    </div>
  );
}
