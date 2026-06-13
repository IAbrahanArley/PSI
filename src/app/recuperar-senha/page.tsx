"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/app/login/_components/AuthSplitLayout";

type ProfileKind = "paciente" | "psicologo";

const inputStyle = {
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: "0.95rem",
};

function RecoverPasswordContent() {
  const searchParams = useSearchParams();
  const profileFromQuery = searchParams.get("perfil");
  const initialProfile: ProfileKind = profileFromQuery === "psicologo" ? "psicologo" : "paciente";

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileKind>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isPsi = profile === "psicologo";
  const backLoginHref = useMemo(
    () => (isPsi ? "/login/psicologo" : "/login/paciente"),
    [isPsi],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profile }),
      });
      setSent(true);
      toast.success("Se o e-mail existir, você receberá um link de recuperação.");
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout role={profile}>
      {/* Tabs de perfil */}
      <div className="d-flex rounded-3 mb-4 p-1" style={{ background: "#f3f4f8" }}>
        <button
          type="button"
          onClick={() => setProfile("paciente")}
          className={`flex-grow-1 text-center py-2 rounded-2 fw-semibold border-0 ${
            !isPsi ? "bg-white text-primary shadow-sm" : "text-muted bg-transparent"
          }`}
          style={{ fontSize: "0.88rem" }}
        >
          Sou paciente
        </button>
        <button
          type="button"
          onClick={() => setProfile("psicologo")}
          className={`flex-grow-1 text-center py-2 rounded-2 fw-semibold border-0 ${
            isPsi ? "bg-white text-primary shadow-sm" : "text-muted bg-transparent"
          }`}
          style={{ fontSize: "0.88rem" }}
        >
          Sou psicólogo
        </button>
      </div>

      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Recuperar senha
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Informe o e-mail da conta e enviaremos um link para você redefinir sua senha.
      </p>

      {sent ? (
        <>
          <div
            className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4"
            style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: 36, height: 36, background: "#10b981" }}
            >
              <i className="feather icon-check text-white" />
            </span>
            <div>
              <p className="fw-semibold mb-1" style={{ color: "#065f46", fontSize: "0.95rem" }}>
                Link enviado!
              </p>
              <p className="mb-0" style={{ color: "#047857", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Verifique sua caixa de entrada (e a pasta de spam). O link expira em alguns minutos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSent(false)}
            className="btn btn-outline-primary btn-lg w-100 fw-semibold mb-3"
            style={{ borderRadius: 10, fontSize: "0.95rem", height: 50 }}
          >
            Enviar para outro e-mail
          </button>
          <Link
            href={backLoginHref}
            className="btn btn-primary btn-lg w-100 fw-semibold"
            style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
          >
            Voltar ao login
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label className="form-label fw-semibold small" htmlFor="recover-email" style={{ color: "#374151" }}>
              E-mail
            </label>
            <input
              id="recover-email"
              type="email"
              className="form-control form-control-lg"
              style={inputStyle}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-semibold"
            disabled={loading}
            style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                Enviando…
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </button>

          <div className="text-center mt-4">
            <Link href={backLoginHref} className="small text-muted text-decoration-none">
              ← Voltar ao login
            </Link>
          </div>
        </form>
      )}
    </AuthSplitLayout>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RecoverPasswordContent />
    </Suspense>
  );
}
