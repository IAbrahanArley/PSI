"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Smile, CheckCircle2, BookOpen } from "lucide-react";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";

// ApexCharts não suporta SSR — importação dinâmica obrigatória
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Constantes ───────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { score: 1, emoji: "😞", label: "Muito mal",  color: "#ef4444" },
  { score: 2, emoji: "😕", label: "Mal",        color: "#f97316" },
  { score: 3, emoji: "😐", label: "Neutro",     color: "#eab308" },
  { score: 4, emoji: "🙂", label: "Bem",        color: "#22c55e" },
  { score: 5, emoji: "😄", label: "Ótimo",      color: "#3b82f6" },
];

type MoodEntry = { id: string; date: string; score: number; note: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function moodByScore(score: number) {
  return MOOD_OPTIONS.find((m) => m.score === score) ?? MOOD_OPTIONS[2];
}

// ─── Componente do gráfico (encapsula ApexCharts) ────────────────────────────

function MoodChart({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-4 text-muted small">
        Nenhuma entrada nos últimos 30 dias.
      </div>
    );
  }

  // Ordena por data ASC para o gráfico
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const categories = sorted.map((e) => formatDateLabel(e.date));
  const data       = sorted.map((e) => e.score);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom:    { enabled: false },
      sparkline: { enabled: false },
      fontFamily: "inherit",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom:    0.35,
        opacityTo:      0.02,
        stops:          [0, 100],
      },
    },
    colors: ["var(--bs-primary)"],
    xaxis: {
      categories,
      labels: { style: { fontSize: "11px" }, rotate: -30 },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },
    yaxis: {
      min: 1,
      max: 5,
      tickAmount: 4,
      labels: {
        formatter: (v: number) => {
          const m = MOOD_OPTIONS.find((o) => o.score === Math.round(v));
          return m ? m.emoji : String(v);
        },
        style: { fontSize: "14px" },
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) => {
          const m = moodByScore(Math.round(v));
          return `${m.emoji} ${m.label}`;
        },
      },
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
    },
  };

  return (
    <ReactApexChart
      type="area"
      height={220}
      series={[{ name: "Humor", data }]}
      options={options}
    />
  );
}

// ─── MoodDiary ────────────────────────────────────────────────────────────────

export function MoodDiary() {
  const today = todayStr();

  const [entries,      setEntries]      = useState<MoodEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [todayEntry,   setTodayEntry]   = useState<MoodEntry | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note,         setNote]         = useState("");

  // ── Carrega entradas ──────────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch("/api/patient/mood?days=30", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const list: MoodEntry[] = data.entries ?? [];
      setEntries(list);
      const existing = list.find((e) => e.date === today) ?? null;
      setTodayEntry(existing);
      if (existing) {
        setSelectedScore(existing.score);
        setNote(existing.note ?? "");
      }
    } catch {
      toast.error("Não foi possível carregar o diário.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  // ── Salva entrada de hoje ─────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedScore) { toast.error("Selecione como você está se sentindo."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/patient/mood", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ date: today, score: selectedScore, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar."); return; }
      toast.success(todayEntry ? "Registro atualizado!" : "Humor registrado!");
      await load();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── Últimos 7 dias ────────────────────────────────────────────────────────

  const last7: Array<{ dateStr: string; entry: MoodEntry | null }> = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { dateStr, entry: entries.find((e) => e.date === dateStr) ?? null };
  });

  // ── Média dos últimos 7 dias ──────────────────────────────────────────────

  const weekEntries = last7.map((d) => d.entry).filter(Boolean) as MoodEntry[];
  const weekAvg = weekEntries.length
    ? weekEntries.reduce((s, e) => s + e.score, 0) / weekEntries.length
    : null;

  // ── Streak (dias consecutivos com registro) ───────────────────────────────

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (entries.find((e) => e.date === ds)) streak++;
    else break;
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <BootstrapSkeleton height="2rem" className="w-40 mb-2" />
        <BootstrapSkeleton height="1rem" className="w-60 m-b30" />
        <div className="card border-0 shadow-sm m-b20">
          <div className="card-body p-4">
            <BootstrapSkeleton height="1.25rem" className="w-50 mb-4" />
            <div className="d-flex gap-3 mb-4">
              {[0,1,2,3,4].map((i) => <BootstrapSkeleton key={i} height="80px" className="flex-grow-1" />)}
            </div>
            <BootstrapSkeleton height="2.5rem" className="w-100" />
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <BootstrapSkeleton height="220px" className="w-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div>
      {/* Cabeçalho */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <Smile size={22} className="text-warning" />
        <h1 className="title mb-0">Diário de humor</h1>
      </div>
      <p className="text-muted m-b20" style={{ fontSize: "0.92rem" }}>
        Registre como você está se sentindo. Acompanhar seu humor ao longo do tempo faz diferença.
      </p>

      {/* Cards de stats */}
      <div className="row g-3 m-b20">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <p className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>
              {streak}
            </p>
            <p className="text-muted small mb-0">Dias seguidos</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <p className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>
              {weekAvg !== null ? weekAvg.toFixed(1) : "—"}
            </p>
            <p className="text-muted small mb-0">Média (7 dias)</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <p className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>
              {entries.length}
            </p>
            <p className="text-muted small mb-0">Registros (30d)</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <p className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>
              {todayEntry ? moodByScore(todayEntry.score).emoji : "—"}
            </p>
            <p className="text-muted small mb-0">Hoje</p>
          </div>
        </div>
      </div>

      {/* Check-in do dia */}
      <div className="card border-0 shadow-sm m-b20">
        <div className="card-header bg-white border-bottom px-4 py-3 d-flex align-items-center gap-2">
          <CheckCircle2 size={16} className={todayEntry ? "text-success" : "text-muted"} />
          <span className="fw-semibold small">
            {todayEntry ? "Registro de hoje (atualizar)" : "Como você está hoje?"}
          </span>
        </div>
        <div className="card-body p-4">

          {/* Botões de emoji */}
          <div className="d-flex gap-2 gap-md-3 mb-4 flex-wrap">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.score}
                type="button"
                onClick={() => setSelectedScore(m.score)}
                className={`btn d-flex flex-column align-items-center gap-1 flex-grow-1 py-3 ${
                  selectedScore === m.score ? "btn-primary shadow-sm" : "btn-outline-secondary"
                }`}
                style={{ borderRadius: 12, minWidth: 60 }}
              >
                <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{m.emoji}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Nota opcional */}
          <div className="mb-3">
            <label className="form-label fw-semibold small" style={{ color: "#374151" }}>
              Nota opcional <span className="text-muted fw-normal">(máx. 500 caracteres)</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              maxLength={500}
              placeholder="Como foi seu dia? O que influenciou seu humor?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ borderRadius: 8, fontSize: "0.88rem", resize: "vertical" }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 fw-semibold"
            onClick={() => void handleSave()}
            disabled={saving || !selectedScore}
            style={{ borderRadius: 10 }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
                Salvando…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                {todayEntry ? "Atualizar registro" : "Registrar humor"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Últimos 7 dias */}
      <div className="card border-0 shadow-sm m-b20">
        <div className="card-header bg-white border-bottom px-4 py-3">
          <span className="fw-semibold small">Últimos 7 dias</span>
        </div>
        <div className="card-body px-4 py-3">
          <div className="d-flex gap-2 flex-wrap">
            {last7.map(({ dateStr, entry }) => {
              const isToday = dateStr === today;
              const mood    = entry ? moodByScore(entry.score) : null;
              const [, mo, dy] = dateStr.split("-");
              return (
                <div
                  key={dateStr}
                  className={`d-flex flex-column align-items-center justify-content-center rounded-3 flex-grow-1 py-2 px-1 ${
                    isToday ? "border border-primary border-2" : "bg-light"
                  }`}
                  style={{ minWidth: 52 }}
                  title={dateStr}
                >
                  <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>
                    {mood ? mood.emoji : "·"}
                  </span>
                  <span className="text-muted" style={{ fontSize: "0.68rem", marginTop: 2 }}>
                    {dy}/{mo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gráfico histórico */}
      <div className="card border-0 shadow-sm m-b20">
        <div className="card-header bg-white border-bottom px-4 py-3 d-flex align-items-center gap-2">
          <BookOpen size={15} className="text-muted" />
          <span className="fw-semibold small">Evolução — últimos 30 dias</span>
        </div>
        <div className="card-body p-3">
          <MoodChart entries={entries} />
        </div>
      </div>

      {/* Histórico textual recente */}
      {entries.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom px-4 py-3">
            <span className="fw-semibold small">Histórico recente</span>
          </div>
          <ul className="list-group list-group-flush">
            {entries.slice(0, 10).map((e) => {
              const mood = moodByScore(e.score);
              const [yr, mo, dy] = e.date.split("-");
              return (
                <li key={e.id} className="list-group-item px-4 py-3 d-flex align-items-start gap-3">
                  <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>{mood.emoji}</span>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="fw-semibold small" style={{ color: mood.color }}>{mood.label}</span>
                      <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                        {dy}/{mo}/{yr}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-muted mb-0" style={{ fontSize: "0.83rem", lineHeight: 1.5 }}>
                        {e.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
