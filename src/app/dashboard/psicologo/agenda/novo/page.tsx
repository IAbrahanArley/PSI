import Link from "next/link";

export default function AgendaNovoAgendamentoPage() {
  return (
    <div className="mx-auto card shadow-sm text-center" style={{ maxWidth: "32rem" }}>
      <div className="card-body p-4 p-md-5">
        <h1 className="h4 mb-0">Novo agendamento</h1>
        <p className="mt-3 small text-muted mb-0">
          Esta tela será preenchida com o formulário que chama{" "}
          <code className="rounded bg-light border px-1 small">createPsychologistAppointmentAction</code>.
        </p>
        <Link href="/dashboard/psicologo/agenda" className="btn btn-primary mt-4">
          Voltar à agenda
        </Link>
      </div>
    </div>
  );
}
