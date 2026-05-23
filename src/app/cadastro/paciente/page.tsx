"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/layout/Header";
import { formatBrazilPhone, stripPhoneDigits } from "@/lib/phone";

export default function CadastroPacientePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: stripPhoneDigits(phone),
          email,
          password,
        }),
      });
      if (!res.ok) {
        toast.error("Nao foi possivel concluir o cadastro. Revise os dados e tente novamente.");
        return;
      }
      setPassword("");
      router.push("/login/paciente?registered=1");
    } catch {
      toast.error("Falha de rede. Tente novamente.");
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
              <div className="col-lg-8 col-xl-7">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-4 p-md-5">
                    <h1 className="title text-secondary m-b20">Cadastro de paciente</h1>
                    <p className="text-muted m-b30">
                      Crie sua conta para acompanhar seus atendimentos no painel de paciente.
                    </p>
                    <form onSubmit={onSubmit} noValidate>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="firstName">
                            Nome
                          </label>
                          <input
                            id="firstName"
                            className="form-control"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            minLength={2}
                            autoComplete="given-name"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="lastName">
                            Sobrenome
                          </label>
                          <input
                            id="lastName"
                            className="form-control"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            minLength={2}
                            autoComplete="family-name"
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="phone">
                            Telefone (WhatsApp)
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            className="form-control"
                            inputMode="numeric"
                            placeholder="(00) 00000-0000"
                            value={phone}
                            onChange={(e) => setPhone(formatBrazilPhone(e.target.value))}
                            required
                            autoComplete="tel"
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="email">
                            E-mail
                          </label>
                          <input
                            id="email"
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="password">
                            Senha
                          </label>
                          <input
                            id="password"
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                          />
                          <small className="text-muted">Minimo de 8 caracteres.</small>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-4">
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                          {loading ? "Cadastrando..." : "Criar conta"}
                        </button>
                        <Link href="/login/paciente" className="btn btn-outline-primary btn-lg">
                          Ja tenho conta
                        </Link>
                        <Link href="/" className="btn btn-outline-secondary btn-lg">
                          Voltar
                        </Link>
                      </div>
                    </form>
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
