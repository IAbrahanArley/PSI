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
  title: string;
  description: string;
  signupHref: string;
  signupLabel: string;
  alternateHref: string;
  alternateLabel: string;
};

const defaultRedirectByRole: Record<LoginRole, string> = {
  PATIENT: "/dashboard/paciente",
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

export function RoleLoginForm({
  expectedRole,
  title,
  description,
  signupHref,
  signupLabel,
  alternateHref,
  alternateLabel,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredToastShown = useRef(false);
  const missingRoleToastShown = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (registeredToastShown.current) return;
    if (searchParams.get("registered") === "1") {
      registeredToastShown.current = true;
      toast.success("Cadastro concluido! Entre com seu e-mail e senha.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (missingRoleToastShown.current) return;
    if (searchParams.get("error") === "missing_role") {
      missingRoleToastShown.current = true;
      toast.info("Entre novamente para concluir o acesso ao painel.", { duration: 6000 });
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("Nao foi possivel entrar. Verifique e-mail e senha.");
        return;
      }

      const syncRes = await fetch("/api/auth/sync-role", { method: "POST" });
      const syncBody = (await syncRes.json().catch(() => ({}))) as { role?: UserRole; error?: string };
      if (!syncRes.ok || !syncBody.role) {
        toast.error("Nao foi possivel concluir seu login agora. Tente novamente.");
        await supabaseClient.auth.signOut();
        return;
      }

      const syncedRole = syncBody.role;
      if (syncedRole !== expectedRole && syncedRole !== "ADMIN") {
        await supabaseClient.auth.signOut();
        toast.error(
          expectedRole === "PATIENT"
            ? "Esta conta nao tem acesso de paciente. Use o login de psicologo."
            : "Esta conta nao tem acesso de psicologo. Use o login de paciente.",
        );
        return;
      }

      await supabaseClient.auth.refreshSession();
      toast.success("Login realizado com sucesso!");

      const requested = searchParams.get("redirect");
      const next = syncedRole === "ADMIN" ? "/dashboard" : safeRedirect(expectedRole, requested);
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-md-5">
        <h2 className="title text-secondary m-b20">{title}</h2>
        <p className="text-muted m-b30">{description}</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor={`${expectedRole}-login-email`}>
                E-mail
              </label>
              <input
                id={`${expectedRole}-login-email`}
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor={`${expectedRole}-login-password`}>
                Senha
              </label>
              <input
                id={`${expectedRole}-login-password`}
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center mt-4">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <Link href={signupHref} className="btn btn-outline-primary btn-lg">
              {signupLabel}
            </Link>
            <Link href={alternateHref} className="btn btn-outline-secondary btn-lg">
              {alternateLabel}
            </Link>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-3">
            <Link
              href={`/recuperar-senha?perfil=${expectedRole === "PATIENT" ? "paciente" : "psicologo"}`}
              className="small text-decoration-none"
            >
              Esqueci minha senha
            </Link>
            <Link href="/" className="small text-decoration-none">
              Voltar ao inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
