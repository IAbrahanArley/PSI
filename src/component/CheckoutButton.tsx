"use client";

import { useState } from "react";

type Props = {
  planSlug:      "start" | "destaque";
  billingPeriod: "monthly" | "semiannual";
  className?:    string;
  children:      React.ReactNode;
};

/**
 * Botão que chama POST /api/checkout e redireciona para o Stripe Checkout.
 * Pode ser usado no PricingPlans.tsx ou na página /assinar.
 */
export default function CheckoutButton({ planSlug, billingPeriod, className, children }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planSlug, billingPeriod }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Se não autenticado, redireciona para login
        if (res.status === 401) {
          window.location.href = "/login/psicologo?redirect=/assinar";
          return;
        }
        setError(data.error ?? "Erro ao iniciar checkout. Tente novamente.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            Aguarde…
          </>
        ) : (
          children
        )}
      </button>
      {error && (
        <p className="text-danger small mt-2 mb-0">{error}</p>
      )}
    </div>
  );
}
