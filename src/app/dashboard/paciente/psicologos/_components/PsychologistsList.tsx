"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowRight,
  ClipboardList,
  Filter,
  Laptop,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  Star,
  User,
} from "lucide-react";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import type { PsychologistCard } from "@/app/api/patient/psychologists/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MatchTier = { label: string; badgeClass: string };

function getMatchTier(score: number): MatchTier {
  if (score >= 80) return { label: `${score}% compatível`, badgeClass: "bg-success" };
  if (score >= 60) return { label: `${score}% compatível`, badgeClass: "bg-primary" };
  if (score >= 40) return { label: `${score}% compatível`, badgeClass: "bg-warning text-dark" };
  return         { label: `${score}% compatível`, badgeClass: "bg-secondary" };
}

function formatPrice(price: string | null): string {
  if (!price) return "Sob consulta";
  const n = parseFloat(price);
  if (isNaN(n)) return "Sob consulta";
  return `R$ ${n.toFixed(2).replace(".", ",")} / sessão`;
}

function whatsappLink(number: string | null, name: string): string {
  if (!number) return "#";
  const digits = number.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Olá, ${name}! Vi seu perfil no Mindzinho e gostaria de agendar uma sessão.`,
  );
  return `https://wa.me/55${digits}?text=${text}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex gap-3 mb-3">
          <BootstrapSkeleton height="72px" className="rounded-circle flex-shrink-0" />
          <div className="flex-grow-1">
            <BootstrapSkeleton height="1.1rem" className="w-50 mb-2" />
            <BootstrapSkeleton height="0.85rem" className="w-75 mb-2" />
            <BootstrapSkeleton height="0.85rem" className="w-40" />
          </div>
        </div>
        <BootstrapSkeleton height="0.85rem" className="w-100 mb-1" />
        <BootstrapSkeleton height="0.85rem" className="w-75 mb-3" />
        <div className="d-flex gap-2">
          <BootstrapSkeleton height="2.2rem" className="flex-grow-1" />
          <BootstrapSkeleton height="2.2rem" className="flex-grow-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Card de psicólogo ────────────────────────────────────────────────────────

function PsyCard({ psy }: { psy: PsychologistCard }) {
  const tier   = getMatchTier(psy.matchScore);
  const name   = psy.professionalName ?? psy.fullName;
  const bioStr = psy.bio
    ? psy.bio.length > 160 ? psy.bio.slice(0, 160) + "…" : psy.bio
    : null;

  return (
    <div
      className={`card border-0 shadow-sm h-100 ${psy.advertisingHighlight ? "border-top border-warning border-3" : ""}`}
      style={{ borderTopWidth: psy.advertisingHighlight ? "3px !important" : undefined }}
    >
      {psy.advertisingHighlight && (
        <div
          className="px-3 py-1 d-flex align-items-center gap-1"
          style={{ background: "#fffbeb", borderRadius: "0.375rem 0.375rem 0 0", fontSize: "0.75rem" }}
        >
          <Star size={12} className="text-warning" fill="currentColor" />
          <span className="fw-semibold text-warning-emphasis">Profissional em destaque</span>
        </div>
      )}

      <div className="card-body p-4 d-flex flex-column gap-3">
        {/* Cabeçalho: foto + nome + badge de match */}
        <div className="d-flex align-items-start gap-3">
          <div className="flex-shrink-0">
            {psy.profileImageUrl ? (
              <Image
                src={psy.profileImageUrl}
                alt={name}
                width={64}
                height={64}
                className="rounded-circle object-fit-cover border"
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-light border"
                style={{ width: 64, height: 64 }}
              >
                <User size={28} className="text-muted" />
              </div>
            )}
          </div>

          <div className="flex-grow-1 min-width-0">
            <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
              <p className="fw-bold mb-0" style={{ fontSize: "0.97rem", color: "#1a1a2e" }}>
                {name}
              </p>
              <span className={`badge flex-shrink-0 ${tier.badgeClass}`} style={{ fontSize: "0.72rem" }}>
                {tier.label}
              </span>
            </div>

            {/* Modalidades */}
            <div className="d-flex flex-wrap gap-1 mt-1">
              {psy.offersOnline && (
                <span className="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                  <Laptop size={11} /> Online
                </span>
              )}
              {psy.offersPresential && (
                <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                  <MapPin size={11} /> Presencial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Especialidades */}
        {psy.specialties.length > 0 && (
          <div className="d-flex flex-wrap gap-1">
            {psy.specialties.slice(0, 4).map((s) => (
              <span
                key={s}
                className="badge bg-light text-dark border fw-normal"
                style={{ fontSize: "0.72rem" }}
              >
                {s}
              </span>
            ))}
            {psy.specialties.length > 4 && (
              <span className="badge bg-light text-muted border fw-normal" style={{ fontSize: "0.72rem" }}>
                +{psy.specialties.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {bioStr && (
          <p className="text-muted mb-0" style={{ fontSize: "0.83rem", lineHeight: 1.55 }}>
            {bioStr}
          </p>
        )}

        {/* Preço */}
        <p className="fw-semibold mb-0 text-primary" style={{ fontSize: "0.88rem" }}>
          {formatPrice(psy.sessionPrice)}
        </p>

        {/* Match reasons */}
        {psy.matchReasons.length > 0 && (
          <div className="d-flex flex-wrap gap-1">
            {psy.matchReasons.map((r) => (
              <span
                key={r}
                className="badge bg-success bg-opacity-10 text-success fw-normal"
                style={{ fontSize: "0.72rem" }}
              >
                ✓ {r}
              </span>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="d-flex gap-2 mt-auto pt-1">
          {psy.whatsapp && (
            <a
              href={whatsappLink(psy.whatsapp, name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{ borderRadius: 8, fontSize: "0.83rem" }}
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
          <Link
            href={`/psicologo/${psy.slug}`}
            className="btn btn-outline-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            style={{ borderRadius: 8, fontSize: "0.83rem" }}
          >
            Ver perfil
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── PsychologistsList ────────────────────────────────────────────────────────

type FilterState = {
  modality: "ALL" | "ONLINE" | "PRESENTIAL";
  minScore: number;
  search:   string;
};

export function PsychologistsList({ hasAnamnesis }: { hasAnamnesis: boolean }) {
  const [psychologists, setPsychologists] = useState<PsychologistCard[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filters, setFilters]             = useState<FilterState>({
    modality: "ALL",
    minScore: 0,
    search:   "",
  });

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch("/api/patient/psychologists", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar.");
      setPsychologists(data.psychologists ?? []);
    } catch {
      toast.error("Não foi possível carregar os psicólogos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  // ── Filtros aplicados no cliente (dados já estão ranqueados da API) ─────────

  const filtered = useMemo(() => {
    return psychologists.filter((p) => {
      if (filters.modality === "ONLINE"     && !p.offersOnline)     return false;
      if (filters.modality === "PRESENTIAL" && !p.offersPresential) return false;
      if (p.matchScore < filters.minScore)                          return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [
          p.fullName, p.professionalName, p.bio, p.approach, ...p.specialties,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [psychologists, filters]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Cabeçalho */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <Search size={22} className="text-primary" />
        <h1 className="title mb-0">Encontrar psicólogo</h1>
      </div>
      <p className="text-muted m-b20" style={{ fontSize: "0.92rem" }}>
        Profissionais ordenados por compatibilidade com o seu perfil.
      </p>

      {/* Banner: sem anamnese */}
      {!hasAnamnesis && (
        <div
          className="alert border-0 d-flex align-items-start gap-3 m-b20 rounded-3 p-3"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)" }}
        >
          <ClipboardList size={20} className="text-primary flex-shrink-0 mt-1" />
          <div>
            <p className="fw-semibold mb-1 small">Melhore suas indicações</p>
            <p className="text-muted mb-2" style={{ fontSize: "0.82rem" }}>
              Preencha sua anamnese para que o score de compatibilidade reflita exatamente o que você busca.
            </p>
            <Link
              href="/dashboard/paciente/anamnese"
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
              style={{ borderRadius: 8 }}
            >
              <ClipboardList size={13} />
              Preencher agora
            </Link>
          </div>
        </div>
      )}

      {/* Barra de filtros */}
      <div
        className="card border-0 shadow-sm p-3 m-b20 d-flex flex-wrap gap-3 align-items-end"
        style={{ flexDirection: "row" }}
      >
        {/* Busca por texto */}
        <div className="flex-grow-1" style={{ minWidth: 200 }}>
          <label className="form-label small fw-semibold mb-1" style={{ color: "#374151" }}>
            <Filter size={13} className="me-1" />
            Buscar por nome ou especialidade
          </label>
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Ex.: ansiedade, TCC, Carlos…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            style={{ borderRadius: 8 }}
          />
        </div>

        {/* Modalidade */}
        <div>
          <label className="form-label small fw-semibold mb-1" style={{ color: "#374151" }}>
            Modalidade
          </label>
          <div className="d-flex gap-1">
            {(["ALL", "ONLINE", "PRESENTIAL"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, modality: m }))}
                className={`btn btn-sm ${filters.modality === m ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ borderRadius: 8, fontSize: "0.8rem" }}
              >
                {m === "ALL" ? "Todos" : m === "ONLINE" ? "Online" : "Presencial"}
              </button>
            ))}
          </div>
        </div>

        {/* Score mínimo */}
        <div>
          <label className="form-label small fw-semibold mb-1" style={{ color: "#374151" }}>
            Score mínimo: <strong>{filters.minScore}%</strong>
          </label>
          <input
            type="range"
            className="form-range"
            min={0} max={80} step={10}
            value={filters.minScore}
            onChange={(e) => setFilters((f) => ({ ...f, minScore: Number(e.target.value) }))}
            style={{ width: 120 }}
          />
        </div>

        {/* Recarregar */}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          onClick={() => void load()}
          disabled={loading}
          style={{ borderRadius: 8, fontSize: "0.8rem", height: 32, alignSelf: "flex-end" }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-muted small m-b20">
          {filtered.length === 0
            ? "Nenhum profissional encontrado com os filtros aplicados."
            : `${filtered.length} profissional${filtered.length > 1 ? "is" : ""} encontrado${filtered.length > 1 ? "s" : ""}`}
        </p>
      )}

      {/* Grid de cards */}
      {loading ? (
        <div className="row g-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="col-md-6 col-xl-4">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <Search size={36} className="text-muted mb-3" />
            <p className="fw-semibold mb-1">Nenhum resultado encontrado</p>
            <p className="text-muted small mb-3">
              Tente remover alguns filtros ou ajuste o score mínimo.
            </p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setFilters({ modality: "ALL", minScore: 0, search: "" })}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((psy) => (
            <div key={psy.id} className="col-md-6 col-xl-4">
              <PsyCard psy={psy} />
            </div>
          ))}
        </div>
      )}

      {/* Spin CSS */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
