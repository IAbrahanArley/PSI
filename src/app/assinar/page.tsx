import Link from "next/link";
import Header from "@/layout/Header";
import CheckoutButton from "@/component/CheckoutButton";

// ─── Mensagens por motivo de bloqueio ────────────────────────────────────────

const MOTIVO_CONFIG: Record<
  string,
  { titulo: string; descricao: string; badge: string; badgeClass: string }
> = {
  trial_expirado: {
    badge: "Trial encerrado",
    badgeClass: "bg-warning text-dark",
    titulo: "Seu período de teste chegou ao fim",
    descricao:
      "Você utilizou os 7 dias gratuitos do plano Start. Para continuar atendendo seus pacientes e acessar o dashboard, escolha um plano abaixo.",
  },
  expirado: {
    badge: "Assinatura expirada",
    badgeClass: "bg-danger text-white",
    titulo: "Sua assinatura está inativa",
    descricao:
      "O período da sua assinatura encerrou. Renove agora para continuar atendendo sem interrupções.",
  },
  cancelado: {
    badge: "Assinatura cancelada",
    badgeClass: "bg-secondary text-white",
    titulo: "Assinatura encerrada",
    descricao:
      "Sua assinatura foi cancelada e o período pago chegou ao fim. Escolha um plano para retomar o acesso.",
  },
  pagamento_pendente: {
    badge: "Pagamento pendente",
    badgeClass: "bg-danger text-white",
    titulo: "Problema com seu pagamento",
    descricao:
      "Não conseguimos processar o pagamento da sua assinatura. Regularize a situação ou escolha uma nova forma de pagamento.",
  },
  sem_assinatura: {
    badge: "Sem assinatura",
    badgeClass: "bg-secondary text-white",
    titulo: "Nenhuma assinatura encontrada",
    descricao:
      "Não encontramos uma assinatura ativa para sua conta. Escolha um plano para começar.",
  },
};

const DEFAULT_MOTIVO = MOTIVO_CONFIG.expirado;

// ─── Página ──────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<{ motivo?: string }>;
};

export default async function AssinarPage({ searchParams }: Props) {
  const { motivo } = await searchParams;
  const config = (motivo && MOTIVO_CONFIG[motivo]) ? MOTIVO_CONFIG[motivo] : DEFAULT_MOTIVO;

  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner">
          <div className="container">

            {/* ── Banner de status ── */}
            <div className="text-center m-b40">
              <span className={`badge fs-6 px-3 py-2 m-b15 d-inline-block ${config.badgeClass}`}>
                {config.badge}
              </span>
              <h1 className="title m-b15">{config.titulo}</h1>
              <p className="text-muted mx-auto" style={{ maxWidth: 520 }}>
                {config.descricao}
              </p>
            </div>

            {/* ── Cards de planos ── */}
            <div className="row justify-content-center g-4 m-b40">

              {/* Plano Start */}
              <div className="col-lg-4 col-md-6">
                <div className="card h-100 border shadow-sm">
                  <div className="card-body d-flex flex-column p-4">
                    <h4 className="fw-bold m-b5">Start</h4>
                    <p className="text-muted small m-b20">
                      Ideal para quem está começando na plataforma.
                    </p>
                    <div className="m-b20">
                      <span className="fs-2 fw-bold text-primary">R$ 79</span>
                      <span className="text-muted">,90/mês</span>
                    </div>
                    <ul className="list-unstyled flex-grow-1 m-b30">
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Até <strong>10 pacientes</strong> ativos
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Perfil, prontuário e agenda completos
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Acesso à <strong>IA</strong>
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Suporte por e-mail
                      </li>
                      <li className="m-b10 text-muted">
                        <i className="feather icon-x me-2" />
                        Sem destaque na listagem
                      </li>
                    </ul>
                    <CheckoutButton planSlug="start" billingPeriod="monthly" className="btn btn-outline-primary w-100">
                      Assinar Essencial
                    </CheckoutButton>
                  </div>
                </div>
              </div>

              {/* Plano Destaque */}
              <div className="col-lg-4 col-md-6">
                <div className="card h-100 border-primary shadow" style={{ borderWidth: 2 }}>
                  <div className="card-header bg-primary text-white text-center py-2 fw-semibold">
                    ⭐ Mais escolhido
                  </div>
                  <div className="card-body d-flex flex-column p-4">
                    <h4 className="fw-bold m-b5">Destaque</h4>
                    <p className="text-muted small m-b20">
                      Visibilidade máxima e pacientes ilimitados.
                    </p>
                    <div className="m-b20">
                      <span className="fs-2 fw-bold text-primary">R$ 149</span>
                      <span className="text-muted">,90/mês</span>
                    </div>
                    <ul className="list-unstyled flex-grow-1 m-b30">
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Pacientes <strong>ilimitados</strong>
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        <strong>Aparece primeiro</strong> na listagem pública
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Perfil, prontuário e agenda completos
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Acesso à <strong>IA</strong>
                      </li>
                      <li className="m-b10">
                        <i className="feather icon-check text-success me-2" />
                        Suporte por <strong>e-mail + WhatsApp</strong>
                      </li>
                    </ul>
                    <CheckoutButton planSlug="destaque" billingPeriod="monthly" className="btn btn-primary w-100">
                      Assinar Premium
                    </CheckoutButton>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Rodapé ── */}
            <div className="text-center text-muted small">
              <p>
                Dúvidas?{" "}
                <Link href="mailto:info@clinicmaster.com.br" className="text-primary">
                  Entre em contato
                </Link>{" "}
                — respondemos por e-mail e WhatsApp.
              </p>
              <p>
                <Link href="/" className="text-muted">
                  ← Voltar para o início
                </Link>
              </p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
