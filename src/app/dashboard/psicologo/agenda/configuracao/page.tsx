import Link from "next/link";
import { AgendaExceptionsView } from "../_components/AgendaExceptionsView";
import { AgendaSettingsView } from "../_components/AgendaSettingsView";

export default function AgendaConfiguracaoPage() {
  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <Link href="/dashboard/psicologo/agenda" className="d-inline-block small fw-medium text-primary mb-2">
            ← Voltar à agenda
          </Link>
          <h1 className="title mb-0">Disponibilidade e exceções</h1>
          <p className="mt-1 small text-muted mb-0">Defina seus horários recorrentes e ajustes pontuais do calendário.</p>
        </div>
      </div>

      <AgendaSettingsView />
      <AgendaExceptionsView />
    </div>
  );
}
