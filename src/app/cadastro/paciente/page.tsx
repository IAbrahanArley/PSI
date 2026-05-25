"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/app/login/_components/AuthSplitLayout";
import { formatBrazilPhone, stripPhoneDigits } from "@/lib/phone";

const inputStyle = {
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: "0.95rem",
};

export default function CadastroPacientePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-patient", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          firstName,
          lastName,
          phone: stripPhoneDigits(phone),
          email,
          password,
        }),
      });
      if (!res.ok) {
        toast.error("Não foi possível concluir o cadastro. Revise os dados e tente novamente.");
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
    <AuthSplitLayout role="paciente">
      {/* Tabs */}
      <div className="d-flex rounded-3 mb-4 p-1" style={{ background: "#f3f4f8" }}>
        <Link
          href="/cadastro/paciente"
          className="flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold bg-white text-primary shadow-sm"
          style={{ fontSize: "0.88rem" }}
        >
          Sou paciente
        </Link>
        <Link
          href="/cadastro/psicologo"
          className="flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold text-muted"
          style={{ fontSize: "0.88rem" }}
        >
          Sou psicólogo
        </Link>
      </div>

      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Crie sua conta
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Já tem conta?{" "}
        <Link href="/login/paciente" className="text-primary fw-semibold text-decoration-none">
          Entrar agora
        </Link>
        .
      </p>

      <form onSubmit={onSubmit} noValidate>
        <div className="row g-3">
          <div className="col-6">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="firstName">
              Nome
            </label>
            <input
              id="firstName"
              className="form-control form-control-lg"
              style={inputStyle}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              minLength={2}
              autoComplete="given-name"
              placeholder="Ana"
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="lastName">
              Sobrenome
            </label>
            <input
              id="lastName"
              className="form-control form-control-lg"
              style={inputStyle}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              minLength={2}
              autoComplete="family-name"
              placeholder="Silva"
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="phone">
              Telefone (WhatsApp)
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              className="form-control form-control-lg"
              style={inputStyle}
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(formatBrazilPhone(e.target.value))}
              required
              autoComplete="tel"
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="form-control form-control-lg"
              style={inputStyle}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="password">
              Senha
            </label>
            <div className="input-group">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className="form-control form-control-lg"
                style={{ ...inputStyle, borderRadius: "10px 0 0 10px", borderRight: "none" }}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 fw-semibold mt-4"
          disabled={loading}
          style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
              Criando conta…
            </>
          ) : (
            "Criar conta grátis"
          )}
        </button>
      </form>

      <p className="text-muted text-center mt-3" style={{ fontSize: "0.78rem" }}>
        Ao criar sua conta, você concorda com nossos{" "}
        <Link href="/" className="text-primary text-decoration-none">Termos de Uso</Link>.
      </p>

      <div className="text-center mt-3">
        <Link href="/" className="small text-muted text-decoration-none">
          ← Voltar ao início
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
