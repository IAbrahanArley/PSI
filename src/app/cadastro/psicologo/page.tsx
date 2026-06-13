"use client";

import { useEffect, useState } from "react";
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

type SpecialtyOption = { id: string; name: string };

export default function CadastroPsicologoPage() {
  const router = useRouter();

  // Campos
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [phone,      setPhone]      = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  // Especialidades
  const [specialties,    setSpecialties]    = useState<SpecialtyOption[]>([]);
  const [loadingSpecs,   setLoadingSpecs]   = useState(true);
  const [specsError,     setSpecsError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/public/catalog-specialties", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { items?: Array<{ id: string; name: string }> };
        if (!res.ok) throw new Error("falha");
        const items = Array.isArray(data.items) ? data.items : [];
        setSpecialties(items.map((i) => ({ id: String(i.id), name: String(i.name) })));
      } catch {
        setSpecsError("Não foi possível carregar as especialidades. Recarregue a página.");
      } finally {
        setLoadingSpecs(false);
      }
    }
    void load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!specialtyId) {
      toast.error("Selecione sua especialidade principal.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-psychologist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          firstName,
          lastName,
          catalogSpecialtyIds: [specialtyId],
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
      // Conta criada não confirmada → ativar por código enviado ao e-mail.
      router.push(`/ativar-conta?role=psicologo&email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout role="psicologo">
      {/* Tabs */}
      <div className="d-flex rounded-3 mb-4 p-1" style={{ background: "#f3f4f8" }}>
        <Link
          href="/cadastro/paciente"
          className="flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold text-muted"
          style={{ fontSize: "0.88rem" }}
        >
          Sou paciente
        </Link>
        <Link
          href="/cadastro/psicologo"
          className="flex-grow-1 text-center text-decoration-none py-2 rounded-2 fw-semibold bg-white text-primary shadow-sm"
          style={{ fontSize: "0.88rem" }}
        >
          Sou psicólogo
        </Link>
      </div>

      <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Crie seu perfil
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Já tem conta?{" "}
        <Link href="/login/psicologo" className="text-primary fw-semibold text-decoration-none">
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
              placeholder="Carlos"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              minLength={2}
              autoComplete="given-name"
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
              placeholder="Oliveira"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              minLength={2}
              autoComplete="family-name"
            />
          </div>

          {/* Especialidade — select */}
          <div className="col-12">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }} htmlFor="specialty">
              Especialidade principal
            </label>
            {specsError ? (
              <p className="small text-danger mb-0">{specsError}</p>
            ) : (
              <select
                id="specialty"
                className="form-select form-select-lg"
                style={inputStyle}
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                required
                disabled={loadingSpecs}
              >
                <option value="">
                  {loadingSpecs ? "Carregando especialidades…" : "Selecione sua especialidade"}
                </option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <small className="text-muted">
              Você pode adicionar mais especialidades depois, no seu perfil.
            </small>
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
              E-mail profissional
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
          disabled={loading || loadingSpecs}
          style={{ borderRadius: 10, fontSize: "1rem", height: 52 }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
              Criando perfil…
            </>
          ) : (
            "Criar meu perfil grátis"
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
