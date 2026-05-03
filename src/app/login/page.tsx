"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Header from "@/layout/Header";
import { supabaseClient } from "@/lib/db/supabase/client";

function LoginForm() {
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
      toast.success("Cadastro concluído! Entre com seu e-mail e senha.");
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (missingRoleToastShown.current) return;
    if (searchParams.get("error") === "missing_role") {
      missingRoleToastShown.current = true;
      toast.info(
        "Entre novamente para carregar seu papel no sistema. Se acabou de cadastrar, faça login uma vez.",
        { duration: 6000 }
      );
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error("Não foi possível entrar. Verifique e-mail e senha.");
        return;
      }

      const syncRes = await fetch("/api/auth/sync-role", { method: "POST" });
      if (!syncRes.ok) {
        toast.error("Não foi possível concluir seu login agora. Tente novamente.");
        await supabaseClient.auth.signOut();
        return;
      }

      await supabaseClient.auth.refreshSession();

      toast.success("Login realizado com sucesso!");
      const next = searchParams.get("redirect") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-md-5">
        <h2 className="title text-secondary m-b20">Entrar</h2>
        <p className="text-muted m-b30">Entre com o e-mail e a senha da sua conta para acessar o painel.</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label" htmlFor="login-email">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="login-password">
                Senha
              </label>
              <input
                id="login-password"
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
            <Link href="/cadastro/psicologo" className="btn btn-outline-primary btn-lg">
              Cadastro de psicólogo
            </Link>
            <Link href="/" className="btn btn-link">
              Voltar ao início
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6">
                <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
                  <LoginForm />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
