"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/app/login/_components/AuthSplitLayout";

const CODE_LEN = 6;

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = (searchParams.get("email") ?? "").trim();
  const roleParam = searchParams.get("role") === "psicologo" ? "psicologo" : "paciente";
  const loginHref = roleParam === "psicologo" ? "/login/psicologo" : "/login/paciente";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  // Contagem regressiva do cooldown de reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Foca o primeiro campo ao montar
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function setDigitAt(idx: number, value: string) {
    const clean = value.replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      if (clean.length <= 1) {
        next[idx] = clean;
      }
      return next;
    });
    if (clean && idx < CODE_LEN - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LEN);
    if (!pasted) return;
    const next = Array(CODE_LEN).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LEN - 1)]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < CODE_LEN - 1) inputsRef.current[idx + 1]?.focus();
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length !== CODE_LEN || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível ativar a conta.");
        setDigits(Array(CODE_LEN).fill(""));
        inputsRef.current[0]?.focus();
        return;
      }
      toast.success("Conta ativada! Você já pode entrar.");
      router.push(`${loginHref}?activated=1`);
    } catch {
      toast.error("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSeconds?: number };
      if (res.status === 429 && data.retryAfterSeconds) {
        setCooldown(data.retryAfterSeconds);
        toast.message(data.error ?? "Aguarde para reenviar.");
        return;
      }
      toast.success("Enviamos um novo código para o seu e-mail.");
      setCooldown(60);
    } catch {
      toast.error("Falha ao reenviar. Tente novamente.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthSplitLayout role={roleParam}>
      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Ative sua conta
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        {email ? (
          <>
            Enviamos um código de 6 dígitos para{" "}
            <strong className="text-dark">{email}</strong>. Digite-o abaixo para confirmar.
          </>
        ) : (
          "Digite o código de 6 dígitos que enviamos para o seu e-mail."
        )}
      </p>

      <form onSubmit={submit} noValidate>
        <div className="d-flex justify-content-between gap-2 mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => setDigitAt(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="form-control form-control-lg text-center fw-bold"
              style={{
                width: 52,
                height: 60,
                fontSize: "1.5rem",
                borderRadius: 12,
                border: "1.5px solid #e5e7eb",
              }}
              aria-label={`Dígito ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 fw-semibold"
          disabled={loading || code.length !== CODE_LEN}
          style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
              Ativando…
            </>
          ) : (
            "Ativar conta"
          )}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-muted mb-1" style={{ fontSize: "0.88rem" }}>
          Não recebeu o código?
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="btn btn-link p-0 fw-semibold text-decoration-none"
          style={{ fontSize: "0.9rem" }}
        >
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : resending ? "Reenviando…" : "Reenviar código"}
        </button>
      </div>

      <div className="text-center mt-4">
        <Link href={loginHref} className="small text-muted text-decoration-none">
          ← Voltar ao login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}

export default function AtivarContaPage() {
  return (
    <Suspense fallback={null}>
      <ActivateContent />
    </Suspense>
  );
}
