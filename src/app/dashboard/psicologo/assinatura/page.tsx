"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Zap, Star, CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import CheckoutButton from "@/component/CheckoutButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "CANCELLED" | "PAST_DUE" | "EXPIRED";

type Subscription = {
  subscriptionId: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  planId: string;
  planSlug: string;
  planName: string;
  maxActivePatients: number | null;
  hasListingHighlight: boolean;
  hasAiAccess: boolean;
  supportChannels: string[];
  trialDays: number;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
};

type BillingPeriod = "monthly" | "semiannual";

// ─── Constantes de exibição ───────────────────────────────────────────────────

const PLAN_DISPLAY = {
  start: {
    label: "Start",
    color: "primary",
    monthlyPrice: "R$ 79,90",
    semiannualPrice: "R$ 399,00",
    semiannualMonthly: "R$ 66,50",
    icon: <Zap size={22} />,
    features: [
      "Até 10 pacientes ativos",
      "Trial gratuito de 7 dias",
      "Acesso completo ao perfil",
      "Ferramentas de IA",
      "Suporte por e-mail",
    ],
  },
  destaque: {
    label: "Destaque",
    color: "warning",
    monthlyPrice: "R$ 149,90",
    semiannualPrice: "R$ 749,00",
    semiannualMonthly: "R$ 124,83",
    icon: <Star size={22} />,
    features: [
      "Pacientes ilimitados",
      "Aparece em destaque na listagem",
      "Acesso completo ao perfil",
      "Ferramentas de IA",
      "Suporte por e-mail + WhatsApp",
    ],
  },
} as const;

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  TRIAL: {
    label: "Período de teste",
    badgeClass: "bg-info text-dark",
    icon: <Clock size={14} className="me-1" />,
  },
  ACTIVE: {
    label: "Ativo",
    badgeClass: "bg-success",
    icon: <CheckCircle2 size={14} className="me-1" />,
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClass: "bg-secondary",
    icon: <XCircle size={14} className="me-1" />,
  },
  PAST_DUE: {
    label: "Pagamento pendente",
    badgeClass: "bg-danger",
    icon: <AlertCircle size={14} className="me-1" />,
  },
  EXPIRED: {
    label: "Expirado",
    badgeClass: "bg-secondary",
    icon: <XCircle size={14} className="me-1" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AssinaturaPage() {
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ── Busca a assinatura atual ────────────────────────────────────────────────
  async function loadSubscription() {
    try {
      const res = await fetch("/api/psychologist/subscription", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar assinatura.");
      setSubscription(data.subscription ?? null);
    } catch {
      setSubscription(null);
      toast.error("Não foi possível carregar os dados da assinatura.");
    }
  }

  useEffect(() => {
    void loadSubscription();
  }, []);

  // ── Portal de cobrança Stripe ───────────────────────────────────────────────
  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/psychologist/billing-portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível abrir o portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setPortalLoading(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (subscription === undefined) {
    return <LoadingSkeleton />;
  }

  const status = subscription?.status ?? null;
  const planSlug = (subscription?.planSlug ?? "start") as "start" | "destaque";
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const hasStripeSubscription = !!subscription?.externalCustomerId;

  // Datas relevantes
  const renewalDate =
    status === "TRIAL" ? subscription?.trialEndsAt : subscription?.currentPeriodEnd;
  const daysLeft = daysUntil(renewalDate ?? null);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <CreditCard size={22} className="text-primary" />
        <h1 className="title mb-0">Minha assinatura</h1>
      </div>
      <p className="text-muted m-b30" style={{ fontSize: "0.92rem" }}>
        Gerencie seu plano, cobranças e faturas.
      </p>

      {/* ── Card: plano atual ─────────────────────────────────────────────── */}
      {subscription ? (
        <div className="card border-0 shadow-sm m-b30">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="fw-bold fs-5">
                    Plano {PLAN_DISPLAY[planSlug as keyof typeof PLAN_DISPLAY]?.label ?? subscription.planName}
                  </span>
                  {statusConfig && (
                    <span
                      className={`badge d-inline-flex align-items-center ${statusConfig.badgeClass}`}
                      style={{ fontSize: "0.78rem" }}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                {/* Informações de período */}
                <div className="d-flex flex-wrap gap-3 small text-muted">
                  {status === "TRIAL" && subscription.trialEndsAt && (
                    <span>
                      <strong className="text-dark">Teste grátis até:</strong>{" "}
                      {formatDate(subscription.trialEndsAt)}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span
                          className={`ms-2 badge ${daysLeft <= 2 ? "bg-danger" : "bg-info text-dark"}`}
                        >
                          {daysLeft === 0 ? "Expira hoje" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""}`}
                        </span>
                      )}
                    </span>
                  )}
                  {status === "ACTIVE" && subscription.currentPeriodEnd && (
                    <span>
                      <strong className="text-dark">Renova em:</strong>{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className="ms-2 badge bg-light text-dark border">
                          {daysLeft} dia{daysLeft !== 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  )}
                  {status === "CANCELLED" && subscription.currentPeriodEnd && (
                    <span>
                      <strong className="text-dark">Acesso até:</strong>{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  )}
                  {status === "PAST_DUE" && (
                    <span className="text-danger fw-semibold">
                      Pagamento falhou. Atualize seu método de pagamento.
                    </span>
                  )}
                  {status === "EXPIRED" && (
                    <span className="text-muted">
                      Assinatura expirada. Escolha um plano abaixo para continuar.
                    </span>
                  )}
                  <span>
                    <strong className="text-dark">Pacientes:</strong>{" "}
                    {subscription.maxActivePatients === null
                      ? "Ilimitados"
                      : `Até ${subscription.maxActivePatients}`}
                  </span>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="d-flex flex-wrap gap-2">
                {hasStripeSubscription && (
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                    onClick={() => void openBillingPortal()}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
                    ) : (
                      <CreditCard size={15} />
                    )}
                    Gerenciar cobranças
                  </button>
                )}
                {(status === "ACTIVE" || status === "PAST_DUE") && hasStripeSubscription && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <XCircle size={15} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 m-b30">
          <AlertCircle size={18} />
          <span>
            Nenhuma assinatura encontrada. Escolha um plano abaixo para começar.
          </span>
        </div>
      )}

      {/* ── Seção: escolha de plano ───────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <h2 className="fw-semibold mb-0" style={{ fontSize: "1.15rem" }}>
          {status === "ACTIVE" ? "Mudar de plano" : "Escolha seu plano"}
        </h2>

        {/* Toggle mensal / semestral */}
        <div
          className="d-inline-flex rounded-pill p-1"
          style={{ background: "#f3f4f8", fontSize: "0.85rem" }}
        >
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`btn btn-sm rounded-pill px-3 py-1 border-0 fw-semibold ${
              billingPeriod === "monthly" ? "bg-white shadow-sm text-primary" : "text-muted"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("semiannual")}
            className={`btn btn-sm rounded-pill px-3 py-1 border-0 fw-semibold ${
              billingPeriod === "semiannual" ? "bg-white shadow-sm text-primary" : "text-muted"
            }`}
          >
            Semestral
            <span className="ms-1 badge bg-success" style={{ fontSize: "0.7rem" }}>
              -17%
            </span>
          </button>
        </div>
      </div>

      <div className="row g-3 m-b30">
        {(["start", "destaque"] as const).map((slug) => {
          const plan = PLAN_DISPLAY[slug];
          const isCurrent = planSlug === slug && (status === "ACTIVE" || status === "TRIAL");
          const price =
            billingPeriod === "monthly" ? plan.monthlyPrice : plan.semiannualPrice;
          const priceNote =
            billingPeriod === "semiannual"
              ? `${plan.semiannualMonthly}/mês`
              : null;

          return (
            <div key={slug} className="col-md-6">
              <div
                className={`card h-100 border-0 shadow-sm ${isCurrent ? "border border-primary" : ""}`}
                style={{
                  borderWidth: isCurrent ? "2px !important" : undefined,
                  outline: isCurrent ? "2px solid var(--bs-primary)" : undefined,
                }}
              >
                <div className="card-body p-4 d-flex flex-column">
                  {/* Header do plano */}
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className={`text-${plan.color}`}>{plan.icon}</span>
                    <span className="fw-bold fs-5">{plan.label}</span>
                    {isCurrent && (
                      <span className="badge bg-primary ms-auto" style={{ fontSize: "0.72rem" }}>
                        Plano atual
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="mb-3">
                    <span className="fw-bold" style={{ fontSize: "1.75rem" }}>
                      {billingPeriod === "semiannual" ? plan.semiannualPrice : price}
                    </span>
                    <span className="text-muted small ms-1">
                      /{billingPeriod === "monthly" ? "mês" : "semestre"}
                    </span>
                    {priceNote && (
                      <div className="small text-success fw-semibold mt-1">{priceNote}</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="list-unstyled flex-grow-1 mb-4" style={{ fontSize: "0.88rem" }}>
                    {plan.features.map((feat) => (
                      <li key={feat} className="d-flex align-items-start gap-2 mb-2">
                        <CheckCircle2
                          size={15}
                          className={`text-${plan.color} flex-shrink-0 mt-1`}
                        />
                        <span className="text-muted">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      disabled
                    >
                      Plano atual
                    </button>
                  ) : (
                    <CheckoutButton
                      planSlug={slug}
                      billingPeriod={billingPeriod}
                      className={`btn btn-${slug === "destaque" ? "warning" : "primary"} w-100 fw-semibold`}
                    >
                      {status === "ACTIVE" ? "Mudar para este plano" : "Assinar agora"}
                    </CheckoutButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Aviso sobre upgrade via Stripe ───────────────────────────────── */}
      {hasStripeSubscription && (status === "ACTIVE" || status === "PAST_DUE") && (
        <div className="alert alert-light border d-flex align-items-start gap-2 m-b30">
          <RefreshCw size={16} className="text-primary flex-shrink-0 mt-1" />
          <div className="small text-muted">
            <strong className="text-dark">Downgrade ou upgrade?</strong> Use o botão{" "}
            <strong>Gerenciar cobranças</strong> acima para alterar seu plano diretamente no
            portal do Stripe, com pró-rato calculado automaticamente.
          </div>
        </div>
      )}

      {/* ── Modal de cancelamento ─────────────────────────────────────────── */}
      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            setShowCancelModal(false);
            void openBillingPortal();
          }}
        />
      )}
    </div>
  );
}

// ─── Skeleton de carregamento ─────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      <BootstrapSkeleton height="2rem" className="w-50 mb-2" />
      <BootstrapSkeleton height="1rem" className="w-75 m-b30" />

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-body p-4">
          <BootstrapSkeleton height="1.5rem" className="w-50 mb-3" />
          <BootstrapSkeleton height="1rem" className="w-75 mb-2" />
          <BootstrapSkeleton height="1rem" className="w-50" />
        </div>
      </div>

      <BootstrapSkeleton height="1.25rem" className="w-25 mb-3" />
      <div className="row g-3">
        {[0, 1].map((i) => (
          <div key={i} className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <BootstrapSkeleton height="1.5rem" className="w-50 mb-3" />
                <BootstrapSkeleton height="2.5rem" className="w-40 mb-3" />
                {[0, 1, 2, 3].map((j) => (
                  <BootstrapSkeleton key={j} height="1rem" className="w-100 mb-2" />
                ))}
                <BootstrapSkeleton height="2.5rem" className="w-100 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal de confirmação de cancelamento ─────────────────────────────────────

function CancelModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.5)", zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 shadow-lg p-4"
        style={{ zIndex: 1050, width: "min(94vw, 460px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
      >
        <div className="d-flex align-items-center gap-2 mb-3">
          <XCircle size={20} className="text-danger flex-shrink-0" />
          <h5 className="mb-0 fw-bold" id="cancel-modal-title">
            Cancelar assinatura
          </h5>
        </div>

        <p className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
          Você será redirecionado ao portal de cobrança do Stripe para confirmar o cancelamento.
        </p>
        <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
          Seu acesso permanece ativo até o final do período pago atual.
        </p>

        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Ir para o portal e cancelar
          </button>
        </div>
      </div>
    </>
  );
}
