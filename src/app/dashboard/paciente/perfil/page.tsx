"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRound, Save } from "lucide-react";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type GenderValue = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

type ProfileForm = {
  fullName:  string;
  phone:     string;
  whatsapp:  string;
  birthDate: string;
  gender:    GenderValue | "";
  state:     string;
  city:      string;
};

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "MALE",             label: "Masculino" },
  { value: "FEMALE",           label: "Feminino" },
  { value: "OTHER",            label: "Outro" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiro não informar" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO",
  "MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const inputStyle = { borderRadius: 8, fontSize: "0.9rem" };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [email,    setEmail]    = useState("");
  const [form,     setForm]     = useState<ProfileForm>({
    fullName:  "",
    phone:     "",
    whatsapp:  "",
    birthDate: "",
    gender:    "",
    state:     "",
    city:      "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/patient/profile", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.profile) return;
        const p = data.profile;
        setEmail(p.email ?? "");
        setForm({
          fullName:  p.fullName  ?? "",
          phone:     p.phone     ?? "",
          whatsapp:  p.whatsapp  ?? "",
          birthDate: p.birthDate ?? "",
          gender:    (p.gender   ?? "") as GenderValue | "",
          state:     p.state     ?? "",
          city:      p.city      ?? "",
        });
      } catch {
        toast.error("Não foi possível carregar seu perfil.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function set(field: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) {
      toast.error("Informe um nome válido.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/patient/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          gender:    form.gender    || null,
          birthDate: form.birthDate || null,
          phone:     form.phone     || null,
          whatsapp:  form.whatsapp  || null,
          state:     form.state     || null,
          city:      form.city      || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar."); return; }
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <BootstrapSkeleton height="2rem"  className="w-40 mb-2" />
        <BootstrapSkeleton height="1rem"  className="w-60 m-b30" />
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="row g-3 mb-3">
                <div className="col-md-6">
                  <BootstrapSkeleton height="1rem" className="w-40 mb-2" />
                  <BootstrapSkeleton height="2.5rem" />
                </div>
                <div className="col-md-6">
                  <BootstrapSkeleton height="1rem" className="w-40 mb-2" />
                  <BootstrapSkeleton height="2.5rem" />
                </div>
              </div>
            ))}
            <BootstrapSkeleton height="2.5rem" className="w-25 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        <UserRound size={22} className="text-primary" />
        <h1 className="title mb-0">Meu perfil</h1>
      </div>
      <p className="text-muted m-b30" style={{ fontSize: "0.92rem" }}>
        Mantenha seus dados atualizados para uma experiência mais personalizada.
      </p>

      <form onSubmit={(e) => void handleSave(e)} noValidate>
        <div className="card border-0 shadow-sm m-b20">
          <div className="card-header bg-white border-bottom px-4 py-3">
            <span className="fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
              Dados pessoais
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">

              {/* Nome completo */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Nome completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={inputStyle}
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ana Silva"
                  required
                  minLength={2}
                />
              </div>

              {/* E-mail (somente leitura) */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  className="form-control bg-light"
                  style={inputStyle}
                  value={email}
                  readOnly
                  tabIndex={-1}
                />
                <small className="text-muted">O e-mail não pode ser alterado aqui.</small>
              </div>

              {/* Data de nascimento */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Data de nascimento
                </label>
                <input
                  type="date"
                  className="form-control"
                  style={inputStyle}
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
              </div>

              {/* Gênero */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Gênero
                </label>
                <select
                  className="form-select"
                  style={inputStyle}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Prefiro não informar</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Telefone */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  className="form-control"
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* WhatsApp */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  WhatsApp
                </label>
                <input
                  type="tel"
                  className="form-control"
                  style={inputStyle}
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Estado */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Estado
                </label>
                <select
                  className="form-select"
                  style={inputStyle}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {BR_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Cidade
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={inputStyle}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="São Paulo"
                />
              </div>

            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
          disabled={saving}
          style={{ borderRadius: 10 }}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
              Salvando…
            </>
          ) : (
            <>
              <Save size={16} />
              Salvar alterações
            </>
          )}
        </button>
      </form>

      {/* LGPD */}
      <p className="text-muted mt-3" style={{ fontSize: "0.78rem" }}>
        Seus dados são protegidos pela <strong>LGPD</strong>. Para solicitar a exclusão da sua conta,
        entre em contato com nosso suporte.
      </p>
    </div>
  );
}
