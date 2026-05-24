"use client";

import { useState } from "react";
import CheckoutButton from "@/component/CheckoutButton";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DISCOUNT_RATE   = 0.10; // 10% de desconto semestral
const SEMESTER_MONTHS = 6;

// ─── Helpers de preço ─────────────────────────────────────────────────────────

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Formata número como string BRL: 1234.5 → "1.234,50" */
function brl(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function semiAnnualMonthly(monthlyPrice: number): number {
  return round2(monthlyPrice * (1 - DISCOUNT_RATE));
}

function semiAnnualTotal(monthlyPrice: number): number {
  return round2(semiAnnualMonthly(monthlyPrice) * SEMESTER_MONTHS);
}

// ─── Dados dos planos ─────────────────────────────────────────────────────────

const PLANS = [
  {
    slug: "start",
    badge: null as string | null,
    highlightBadge: null as string | null,
    name: "Plano Essencial",
    monthlyPrice: 75.90,
    trial: "7 dias grátis para começar",
    description: "Ideal para psicólogos que estão dando os primeiros passos na plataforma.",
    cta: "Começar grátis",
    ctaHref: "/cadastro",
    ctaClass: "btn btn-lg btn-outline-primary w-100",
    highlighted: false,
    delay: "0.2s",
    features: [
      { label: "Até 10 pacientes ativos",       included: true  },
      { label: "Acesso à IA",                   included: true  },
      { label: "Perfil profissional completo",   included: true  },
      { label: "Prontuário e notas clínicas",    included: true  },
      { label: "Agenda online",                  included: true  },
      { label: "Suporte por e-mail",             included: true  },
      { label: "Destaque na listagem",           included: false },
      { label: "Suporte via WhatsApp",           included: false },
    ],
  },
  {
    slug: "destaque",
    badge: "Mais popular" as string | null,
    highlightBadge: "Seu perfil em destaque" as string | null,
    name: "Plano Premium",
    monthlyPrice: 139.90,
    trial: null as string | null,
    description: "Para psicólogos que querem máxima visibilidade e crescimento acelerado.",
    cta: "Assinar Premium",
    ctaHref: "/cadastro",
    ctaClass: "btn btn-lg btn-secondary w-100",
    highlighted: true,
    delay: "0.4s",
    features: [
      { label: "Pacientes ilimitados",           included: true  },
      { label: "Acesso à IA",                   included: true  },
      { label: "Perfil profissional completo",   included: true  },
      { label: "Prontuário e notas clínicas",    included: true  },
      { label: "Agenda online",                  included: true  },
      { label: "Aparece primeiro na listagem",   included: true  },
      { label: "Suporte por e-mail",             included: true  },
      { label: "Suporte via WhatsApp",           included: true  },
    ],
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PricingPlans() {
  const [isSemestral, setIsSemestral] = useState(false);

  return (
    <section className="content-inner-2 bg-light">
      <div className="container">

        {/* ── Cabeçalho ── */}
        <div className="section-head style-1 text-center m-b40">
        
          <h2
            className="title m-b15 wow fadeInUp"
            data-wow-delay="0.2s"
            data-wow-duration="0.8s"
          >
            Planos que crescem com você <br /> psicólogo
          </h2>
          <p
            className="text-muted mx-auto wow fadeInUp"
            style={{ maxWidth: 520 }}
            data-wow-delay="0.3s"
            data-wow-duration="0.8s"
          >
            Escolha o plano ideal para o seu momento. Comece grátis e faça upgrade quando quiser,
            sem fidelidade.
          </p>
        </div>

        {/* ── Toggle mensal / semestral ── */}
        <div
          className="d-flex align-items-center justify-content-center gap-3 m-b40 wow fadeInUp"
          data-wow-delay="0.35s"
          data-wow-duration="0.8s"
        >
          <span
            className={`fw-semibold small ${!isSemestral ? "text-primary" : "text-muted"}`}
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setIsSemestral(false)}
          >
            Mensal
          </span>

          {/* Switch Bootstrap */}
          <div className="form-check form-switch m-0 p-0" style={{ lineHeight: 0 }}>
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="billing-toggle"
              checked={isSemestral}
              onChange={(e) => setIsSemestral(e.target.checked)}
              style={{ width: "3rem", height: "1.5rem", cursor: "pointer" }}
            />
            <label className="visually-hidden" htmlFor="billing-toggle">
              Alternar entre cobrança mensal e semestral
            </label>
          </div>

          <span
            className={`fw-semibold small d-flex align-items-center gap-2 ${isSemestral ? "text-primary" : "text-muted"}`}
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setIsSemestral(true)}
          >
            Semestral
            <span className="badge bg-success text-white px-2 py-1 rounded-pill" style={{ fontSize: "0.7rem" }}>
              −10%
            </span>
          </span>
        </div>

        {/* ── Cards ── */}
        <div className="row justify-content-center g-4">
          {PLANS.map((plan) => {
            const monthly   = plan.monthlyPrice;
            const effMonth  = isSemestral ? semiAnnualMonthly(monthly) : monthly;
            const totalSem  = isSemestral ? semiAnnualTotal(monthly)   : null;

            return (
              <div
                key={plan.slug}
                className="col-xl-4 col-md-6 wow fadeInUp"
                data-wow-delay={plan.delay}
                data-wow-duration="0.8s"
                style={{ marginBottom: "20px" }}
              >
                <div
                  className={`h-100 rounded-4 overflow-hidden d-flex flex-column ${
                    plan.highlighted
                      ? "bg-primary text-white shadow-lg"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  {/* Cabeçalho do card */}
                  <div
                    className={`px-4 pt-4 pb-3 ${
                      plan.highlighted
                        ? "border-bottom border-white border-opacity-25"
                        : "border-bottom"
                    }`}
                  >
                    {/* Nome + badge */}
                    <div className="d-flex align-items-center flex-wrap gap-2 m-b5">
                      <h3
                        className={`fw-bold m-b0 ${plan.highlighted ? "text-white" : "text-secondary"}`}
                      >
                        {plan.name}
                      </h3>
                      {plan.badge && (
                        <span className="badge bg-secondary text-white px-2 py-1 rounded-pill" style={{ fontSize: "0.72rem" }}>
                          ⭐ {plan.badge}
                        </span>
                      )}
                    </div>

                    <p
                      className={`small m-b20 ${plan.highlighted ? "text-white opacity-75" : "text-muted"}`}
                    >
                      {plan.description}
                    </p>

                    {/* Preço */}
                    <div className="m-b8">
                      {/* Preço riscado — só aparece no modo semestral */}
                      {isSemestral && (
                        <div
                          className={`small fw-semibold mb-1 ${plan.highlighted ? "text-white opacity-50" : "text-muted"}`}
                          style={{ textDecoration: "line-through" }}
                        >
                          de R$ {brl(monthly)}/mês
                        </div>
                      )}

                      {/* Preço efetivo */}
                      <div className="d-flex align-items-end gap-1">
                        <span
                          className={`fw-bold lh-1 ${plan.highlighted ? "text-white" : "text-primary"}`}
                          style={{ fontSize: "2.6rem" }}
                        >
                          R$ {brl(effMonth)}
                        </span>
                        <span
                          className={`fw-semibold mb-1 ${plan.highlighted ? "text-white opacity-75" : "text-muted"}`}
                          style={{ fontSize: "1rem" }}
                        >
                          /mês
                        </span>
                      </div>

                      {/* Total cobrado no semestre */}
                      {totalSem !== null && (
                        <div
                          className={`small mt-1 ${plan.highlighted ? "text-white opacity-75" : "text-muted"}`}
                        >
                          cobrado R$ {brl(totalSem)} a cada 6 meses
                        </div>
                      )}
                    </div>

                    {/* Badge de trial / destaque */}
                    <div className="mt-3">
                      {plan.trial ? (
                        <span className="badge bg-success text-white px-3 py-2 rounded-pill small fw-semibold">
                          <i className="feather icon-gift me-1" />
                          {plan.trial}
                        </span>
                      ) : plan.highlightBadge ? (
                        <span className="badge bg-warning text-dark px-3 py-2 rounded-pill small fw-semibold">
                          <i className="feather icon-star me-1" />
                          {plan.highlightBadge}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Lista de features */}
                  <div className="px-4 py-3 flex-grow-1">
                    <ul className="list-unstyled m-b0">
                      {plan.features.map((f) => (
                        <li key={f.label} className="d-flex align-items-center gap-2 m-b12">
                          {f.included ? (
                            <span
                              className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
                                plan.highlighted ? "bg-white bg-opacity-25" : "bg-primary bg-opacity-10"
                              }`}
                              style={{ width: 24, height: 24 }}
                            >
                              <i
                                className={`feather icon-check ${plan.highlighted ? "text-white" : "text-primary"}`}
                                style={{ fontSize: "0.8rem" }}
                              />
                            </span>
                          ) : (
                            <span
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-secondary bg-opacity-10"
                              style={{ width: 24, height: 24 }}
                            >
                              <i className="feather icon-x text-muted" style={{ fontSize: "0.8rem" }} />
                            </span>
                          )}
                          <span
                            className={`small ${
                              f.included
                                ? plan.highlighted ? "text-white" : "text-dark"
                                : "text-muted"
                            }`}
                          >
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    <CheckoutButton
                      planSlug={plan.slug as "start" | "destaque"}
                      billingPeriod={isSemestral ? "semiannual" : "monthly"}
                      className={plan.ctaClass}
                    >
                      {plan.cta}
                      <span className="ms-2">
                        <i className="feather icon-arrow-right" />
                      </span>
                    </CheckoutButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
