"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/db/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

type LoginRole = "PATIENT" | "PSYCHOLOGIST";

type Props = {
  expectedRole: LoginRole;
  signupHref:   string;
  alternateHref: string;
};

const defaultRedirectByRole: Record<LoginRole, string> = {
  PATIENT:      "/dashboard/paciente",
  PSYCHOLOGIST: "/dashboard/psicologo",
};

function isAllowedRedirect(role: LoginRole, path: string): boolean {
  if (path === "/dashboard") return true;
  if (role === "PATIENT") return path.startsWith("/dashboard/paciente");
  return path.startsWith("/dashboard/psicologo");
}

function safeRedirect(role: LoginRole, requestedPath: string | null): string {
  const fallback = defaultRedirectByRole[role];
  if (!requestedPath?.startsWith("/")) return fallback;
  return isAllowedRedirect(role, requestedPath) ? requestedPath : fallback;
}

export function RoleLoginForm({ expectedRole, signupHref, alternateHref }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const registeredRef   = useRef(false);
  const missingRoleRef  = useRef(false);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);

  const isPsi = expectedRole === "PSYCHOLOGIST";

  // ── Redireciona se já estiver logado com o papel correto ──────────────────
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        const role = u.app_metadata?.role ?? u.user_metadata?.role ?? null;
        if (role === expectedRole || role === "ADMIN") {
          const requested = searchParams.get("redirect");
          const next =
            role === "ADMIN"
              ? "/dashboard"
              : safeRedirect(expectedRole, requested);
          router.replace(next);
          return;
        }
      }
      setChecking(false);
    });
  }, [router, searchParams, expectedRole]);

  useEffect(() => {
    if (!registeredRef.current && searchParams.get("registered") === "1") {
      registeredRef.current = true;
      toast.success("Cadastro concluído! Entre com seu e-mail e senha.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!missingRoleRef.current && searchParams.get("error") === "missing_role") {
      missingRoleRef.current = true;
      toast.info("Entre novamente para concluir o acesso ao painel.", { duration: 6000 });
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("E-mail ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      const syncRes  = await fetch("/api/auth/sync-role", { method: "POST" });
      const syncBody = (await syncRes.json().catch(() => ({}))) as { role?: UserRole; error?: string };

      if (!syncRes.ok || !syncBody.role) {
        toast.error("Não foi possível concluir seu login. Tente novamente.");
        await supabaseClient.auth.signOut();
        return;
      }

      const syncedRole = syncBody.role;
      if (syncedRole !== expectedRole && syncedRole !== "ADMIN") {
        await supabaseClient.auth.signOut();
        toast.error(
          isPsi
            ? "Esta conta não tem acesso de psicólogo. Use o login de paciente."
            : "Esta conta não tem acesso de paciente. Use o login de psicólogo.",
        );
        return;
      }

      await supabaseClient.auth.refreshSession();
      toast.success("Bem-vindo de volta!");

      const requested = searchParams.get("redirect");
      const next = syncedRole === "ADMIN" ? "/dashboard" : safeRedirect(expectedRole, requested);
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Enquanto verifica a sessão não renderiza o form (evita flash)
  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <span className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Tabs de alternância ── */}
      <div
        className="d-flex rounded-3 mb-4 p-1"
        style={{ background: "#f3f4f8" }}
      >
        <Link
          href="/login/paciente"
          className={`flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold small transition-all ${
            !isPsi ? "bg-white text-primary shadow-sm" : "text-muted"
          }`}
          style={{ fontSize: "0.88rem" }}
        >
          Sou paciente
        </Link>
        <Link
          href="/login/psicologo"
          className={`flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold small ${
            isPsi ? "bg-white text-primary shadow-sm" : "text-muted"
          }`}
          style={{ fontSize: "0.88rem" }}
        >
          Sou psicólogo
        </Link>
      </div>

      {/* ── Cabeçalho ── */}
      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Bem-vindo de volta!
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Não tem conta?{" "}
        <Link href={signupHref} className="text-primary fw-semibold text-decoration-none">
          Criar conta agora, é grátis
        </Link>
        .
      </p>

      {/* ── Formulário ── */}
      <form onSubmit={onSubmit} noValidate>
        {/* E-mail */}
        <div className="mb-3">
          <label className="form-label fw-semibold small" htmlFor={`${expectedRole}-email`}
            style={{ color: "#374151" }}>
            E-mail
          </label>
          <input
            id={`${expectedRole}-email`}
            type="email"
            className="form-control form-control-lg"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.95rem" }}
          />
        </div>

        {/* Senha */}
        <div className="mb-1">
          <label className="form-label fw-semibold small" htmlFor={`${expectedRole}-password`}
            style={{ color: "#374151" }}>
            Senha
          </label>
          <div className="input-group">
            <input
              id={`${expectedRole}-password`}
              type={showPass ? "text" : "password"}
              className="form-control form-control-lg"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                borderRadius: "10px 0 0 10px",
                border: "1.5px solid #e5e7eb",
                borderRight: "none",
                fontSize: "0.95rem",
              }}
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

        {/* Esqueci a senha */}
        <div className="text-end mb-4">
          <Link
            href={`/recuperar-senha?perfil=${isPsi ? "psicologo" : "paciente"}`}
            className="small text-primary text-decoration-none"
          >
            Esqueci minha senha
          </Link>
        </div>

        {/* Botão entrar */}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 fw-semibold"
          disabled={loading}
          style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
              Entrando…
            </>
          ) : (
            "Entrar agora"
          )}
        </button>
      </form>

      {/* ── Rodapé ── */}
      <div className="text-center mt-4">
        <Link href="/" className="small text-muted text-decoration-none">
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
}
