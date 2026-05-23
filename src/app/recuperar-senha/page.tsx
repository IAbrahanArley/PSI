"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Header from "@/layout/Header";

type ProfileKind = "paciente" | "psicologo";

function RecoverPasswordCard() {
  const searchParams = useSearchParams();
  const profileFromQuery = searchParams.get("perfil");
  const initialProfile: ProfileKind =
    profileFromQuery === "psicologo" ? "psicologo" : "paciente";

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileKind>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const backLoginHref = useMemo(
    () => (profile === "psicologo" ? "/login/psicologo" : "/login/paciente"),
    [profile],
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
      toast.success("Se o e-mail existir, voce recebera um link de recuperacao.");
    } catch {
      toast.error("Nao foi possivel enviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-md-5">
        <h1 className="title text-secondary m-b20">Recuperar senha</h1>
        <p className="text-muted m-b30">
          Informe o e-mail da conta para receber o link de redefinicao de senha.
        </p>

        {sent ? (
          <div className="alert alert-success">
            Solicitação enviada. Verifique sua caixa de entrada e tambem a pasta de spam.
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Perfil</label>
              <select
                className="form-select"
                value={profile}
                onChange={(e) => setProfile(e.target.value as ProfileKind)}
              >
                <option value="paciente">Paciente</option>
                <option value="psicologo">Psicologo</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="recover-email">
                E-mail
              </label>
              <input
                id="recover-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperacao"}
            </button>
            <Link href={backLoginHref} className="btn btn-outline-primary btn-lg">
              Voltar ao login
            </Link>
            <Link href="/login" className="btn btn-link">
              Escolher outro perfil
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6">
                <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
                  <RecoverPasswordCard />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
