"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Save, Trash2, UserRound } from "lucide-react";
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
  { value: "MALE",              label: "Masculino"          },
  { value: "FEMALE",            label: "Feminino"           },
  { value: "OTHER",             label: "Outro"              },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiro não informar" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO",
  "MA","MT","MS","MG","PA","PB","PR","PE","PI",
  "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

/** Paletas de gradiente para o avatar padrão (rotação pelo codepoint da inicial). */
const AVATAR_GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#3b82f6", "#06b6d4"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#ef4444"],
  ["#ec4899", "#8b5cf6"],
  ["#14b8a6", "#3b82f6"],
  ["#f97316", "#ef4444"],
];

function getGradient(name: string): [string, string] {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx] as [string, string];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function PatientAvatar({
  avatarUrl,
  fullName,
  size = 110,
}: {
  avatarUrl: string | null;
  fullName: string;
  size?: number;
}) {
  const initials = getInitials(fullName || "?");
  const [g1, g2] = getGradient(initials);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="Foto de perfil"
        style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", display: "block" }}
        className="border border-3 border-white shadow"
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
        fontSize: Math.round(size * 0.34),
        fontWeight: 700,
        letterSpacing: "0.04em",
        userSelect: "none",
        flexShrink: 0,
      }}
      className="border border-3 border-white shadow"
      aria-label={`Avatar padrão — ${initials}`}
    >
      {initials}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [email,      setEmail]      = useState("");
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [form,       setForm]       = useState<ProfileForm>({
    fullName: "", phone: "", whatsapp: "", birthDate: "", gender: "", state: "", city: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/patient/profile", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.profile) return;
        const p = data.profile;
        setEmail(p.email ?? "");
        setAvatarUrl(p.avatarUrl ?? null);
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

  // ── Upload photo ──────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Use JPG, PNG, WebP ou GIF.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/patient/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro no upload."); return; }
      setAvatarUrl(data.url);
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro de conexão no upload.");
    } finally {
      setUploading(false);
    }
  }

  // ── Remove photo ──────────────────────────────────────────────────────────
  async function handleRemovePhoto() {
    setUploading(true);
    try {
      const res = await fetch("/api/patient/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...buildPayload(), avatarUrl: null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao remover foto."); return; }
      setAvatarUrl(null);
      toast.success("Foto removida.");
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setUploading(false);
    }
  }

  // ── Save form ─────────────────────────────────────────────────────────────
  function buildPayload() {
    return {
      ...form,
      gender:    form.gender    || null,
      birthDate: form.birthDate || null,
      phone:     form.phone     || null,
      whatsapp:  form.whatsapp  || null,
      state:     form.state     || null,
      city:      form.city      || null,
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) { toast.error("Informe um nome válido."); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/patient/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
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

  function set(field: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <BootstrapSkeleton height="2rem"    className="w-40 mb-2" />
        <BootstrapSkeleton height="1rem"    className="w-60 m-b30" />
        {/* Avatar skeleton */}
        <div className="d-flex align-items-center gap-4 mb-4">
          <span className="placeholder rounded-circle d-block bg-secondary opacity-25"
            style={{ width: 110, height: 110, flexShrink: 0 }} />
          <div className="flex-grow-1">
            <BootstrapSkeleton height="1rem"  className="w-50 mb-2" />
            <BootstrapSkeleton height="2rem"  className="w-25" />
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="row g-3 mb-3">
                <div className="col-md-6"><BootstrapSkeleton height="1rem" className="w-40 mb-2" /><BootstrapSkeleton height="2.5rem" /></div>
                <div className="col-md-6"><BootstrapSkeleton height="1rem" className="w-40 mb-2" /><BootstrapSkeleton height="2.5rem" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const inputStyle = { borderRadius: 8, fontSize: "0.9rem" };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        <UserRound size={22} className="text-primary" />
        <h1 className="title mb-0">Meu perfil</h1>
      </div>
      <p className="text-muted m-b30" style={{ fontSize: "0.92rem" }}>
        Mantenha seus dados atualizados para uma experiência mais personalizada.
      </p>

      {/* ── Avatar section ── */}
      <div className="card border-0 shadow-sm m-b20">
        <div className="card-header bg-white border-bottom px-4 py-3">
          <span className="fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "0.05em" }}>
            Foto de perfil
          </span>
        </div>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* Avatar + overlay */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <PatientAvatar avatarUrl={avatarUrl} fullName={form.fullName} size={110} />

              {/* Camera overlay button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  position: "absolute", bottom: 4, right: 4,
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#fff", border: "1px solid #d1d5db",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                }}
                aria-label="Alterar foto"
                title="Alterar foto"
              >
                {uploading
                  ? <span className="spinner-border spinner-border-sm text-primary" style={{ width: 14, height: 14 }} />
                  : <Camera size={15} className="text-muted" />
                }
              </button>
            </div>

            {/* Texto + ações */}
            <div className="min-w-0">
              <p className="mb-1 fw-semibold" style={{ fontSize: "0.9rem" }}>{form.fullName || "Seu nome"}</p>
              <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                JPG, PNG, WebP ou GIF · máx. 5 MB · opcional
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera size={14} />
                  {avatarUrl ? "Trocar foto" : "Adicionar foto"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    onClick={() => void handleRemovePhoto()}
                    disabled={uploading}
                  >
                    <Trash2 size={14} />
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="d-none"
            onChange={(e) => void handleFileChange(e)}
          />
        </div>
      </div>

      {/* ── Profile form ── */}
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
                  type="text" className="form-control" style={inputStyle}
                  value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ana Silva" required minLength={2}
                />
              </div>

              {/* E-mail (read-only) */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>E-mail</label>
                <input
                  type="email" className="form-control bg-light" style={inputStyle}
                  value={email} readOnly tabIndex={-1}
                />
                <small className="text-muted">O e-mail não pode ser alterado aqui.</small>
              </div>

              {/* Data de nascimento */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
                  Data de nascimento
                </label>
                <input
                  type="date" className="form-control" style={inputStyle}
                  value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)}
                />
              </div>

              {/* Gênero */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>Gênero</label>
                <select className="form-select" style={inputStyle} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Prefiro não informar</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Telefone */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>Telefone</label>
                <input
                  type="tel" className="form-control" style={inputStyle}
                  value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* WhatsApp */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>WhatsApp</label>
                <input
                  type="tel" className="form-control" style={inputStyle}
                  value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Estado */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>Estado</label>
                <select className="form-select" style={inputStyle} value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Selecione</option>
                  {BR_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Cidade */}
              <div className="col-md-4">
                <label className="form-label fw-semibold small" style={{ color: "#374151" }}>Cidade</label>
                <input
                  type="text" className="form-control" style={inputStyle}
                  value={form.city} onChange={(e) => set("city", e.target.value)}
                  placeholder="São Paulo"
                />
              </div>

            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
          disabled={saving || uploading}
          style={{ borderRadius: 10 }}
        >
          {saving ? (
            <><span className="spinner-border spinner-border-sm" role="status" aria-hidden />Salvando…</>
          ) : (
            <><Save size={16} />Salvar alterações</>
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
