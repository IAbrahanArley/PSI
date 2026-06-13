"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/app/login/_components/AuthSplitLayout";
import { supabaseClient } from "@/lib/db/supabase/client";

const inputStyle = {
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: "0.95rem",
};

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    let active = true;

    void supabaseClient.auth.getSession().then(({ data }) => {
      if (!active) return;
      setCanReset(Boolean(data.session));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setCanReset(Boolean(session));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        toast.error("Não foi possível redefinir a senha agora.");
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      await supabaseClient.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout role="paciente">
      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Redefinir senha
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Crie uma nova senha para acessar sua conta.
      </p>

      {!ready ? (
        <div className="d-flex align-items-center justify-content-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      ) : !canReset ? (
        <>
          <div
            className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: 36, height: 36, background: "#f59e0b" }}
            >
              <i className="feather icon-alert-triangle text-white" />
            </span>
            <div>
              <p className="fw-semibold mb-1" style={{ color: "#92400e", fontSize: "0.95rem" }}>
                Link inválido ou expirado
              </p>
              <p className="mb-0" style={{ color: "#b45309", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Este link de recuperação não é mais válido. Solicite um novo para continuar.
              </p>
            </div>
          </div>
          <Link
            href="/recuperar-senha"
            className="btn btn-primary btn-lg w-100 fw-semibold"
            style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
          >
            Solicitar novo link
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label fw-semibold small" htmlFor="new-password" style={{ color: "#374151" }}>
              Nova senha
            </label>
            <div className="input-group">
              <input
                id="new-password"
                type={showPass ? "text" : "password"}
                className="form-control form-control-lg"
                style={{ ...inputStyle, borderRadius: "10px 0 0 10px", borderRight: "none" }}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPass((p) => !p)}
                tabIndex={-1}
                style={{ borderRadius: "0 10px 10px 0", border: "1.5px solid #e5e7eb", borderLeft: "none" }}
              >
                <i className={`feather ${showPass ? "icon-eye-off" : "icon-eye"}`} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold small" htmlFor="confirm-password" style={{ color: "#374151" }}>
              Confirmar nova senha
            </label>
            <input
              id="confirm-password"
              type={showPass ? "text" : "password"}
              className="form-control form-control-lg"
              style={inputStyle}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
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
                Salvando…
              </>
            ) : (
              "Salvar nova senha"
            )}
          </button>
        </form>
      )}

      <div className="text-center mt-4">
        <Link href="/login" className="small text-muted text-decoration-none">
          ← Voltar ao login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
