"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/layout/Header";
import { supabaseClient } from "@/lib/db/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      toast.error("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        toast.error("Nao foi possivel redefinir a senha agora.");
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      await supabaseClient.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Falha de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-4 p-md-5">
                    <h1 className="title text-secondary m-b20">Redefinir senha</h1>
                    <p className="text-muted m-b30">
                      Defina uma nova senha para sua conta.
                    </p>

                    {!ready ? (
                      <p className="text-muted mb-0">Carregando...</p>
                    ) : !canReset ? (
                      <div className="alert alert-warning">
                        Este link esta invalido ou expirou. Solicite um novo link de recuperacao.
                      </div>
                    ) : (
                      <form onSubmit={onSubmit} noValidate>
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label" htmlFor="new-password">
                              Nova senha
                            </label>
                            <input
                              id="new-password"
                              type="password"
                              className="form-control"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="new-password"
                              required
                              minLength={8}
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label" htmlFor="confirm-password">
                              Confirmar nova senha
                            </label>
                            <input
                              id="confirm-password"
                              type="password"
                              className="form-control"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                              required
                              minLength={8}
                            />
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 mt-4">
                          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar nova senha"}
                          </button>
                          <Link href="/recuperar-senha" className="btn btn-outline-primary btn-lg">
                            Solicitar novo link
                          </Link>
                        </div>
                      </form>
                    )}

                    <div className="mt-3">
                      <Link href="/login" className="small text-decoration-none">
                        Voltar para login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
