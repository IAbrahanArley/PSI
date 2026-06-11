"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Search,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MainReason =
  | "ansiedade" | "depressao" | "relacionamentos" | "autoconhecimento"
  | "luto" | "trauma" | "estresse" | "familia" | "orientacao_vocacional" | "outros";

type SymptomDuration = "lt1m" | "1to3m" | "3to6m" | "6to12m" | "gt1y";
type PreviousApproach = "tcc" | "psicanalise" | "humanista" | "sistemica" | "nao_sei" | "outra";
type Modality = "ONLINE" | "PRESENTIAL" | "NO_PREFERENCE";
type GenderPref = "MALE" | "FEMALE" | "NO_PREFERENCE";
type Day = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
type Period = "MORNING" | "AFTERNOON" | "EVENING";
type InvestmentRange = "up100" | "100to150" | "150to200" | "200plus" | "flexible";

export type AnamnesisData = {
  mainReasons:        MainReason[];
  symptomDuration:    SymptomDuration | "";
  hadPreviousTherapy: boolean | null;
  previousApproach:   PreviousApproach | null;
  preferredModality:  Modality | "";
  genderPreference:   GenderPref | "";
  availableDays:      Day[];
  availablePeriods:   Period[];
  investmentRange:    InvestmentRange | "";
  urgencyLevel:       number;
};

export type ExistingAnamnesis = Partial<AnamnesisData> & { completedAt?: string | null };

// ─── Labels de exibição ───────────────────────────────────────────────────────

const REASON_LABELS: Record<MainReason, string> = {
  ansiedade:             "Ansiedade",
  depressao:             "Depressão",
  relacionamentos:       "Relacionamentos",
  autoconhecimento:      "Autoconhecimento",
  luto:                  "Luto",
  trauma:                "Trauma",
  estresse:              "Estresse",
  familia:               "Questões familiares",
  orientacao_vocacional: "Orientação vocacional",
  outros:                "Outros",
};

const DURATION_LABELS: Record<SymptomDuration, string> = {
  lt1m:   "Menos de 1 mês",
  "1to3m":  "1 a 3 meses",
  "3to6m":  "3 a 6 meses",
  "6to12m": "6 meses a 1 ano",
  gt1y:   "Mais de 1 ano",
};

const APPROACH_LABELS: Record<PreviousApproach, string> = {
  tcc:        "Terapia Cognitivo-Comportamental (TCC)",
  psicanalise: "Psicanálise",
  humanista:  "Abordagem Humanista",
  sistemica:  "Terapia Sistêmica",
  nao_sei:    "Não sei ao certo",
  outra:      "Outra abordagem",
};

const MODALITY_LABELS: Record<Modality, string> = {
  ONLINE:        "Online",
  PRESENTIAL:    "Presencial",
  NO_PREFERENCE: "Sem preferência",
};

const GENDER_LABELS: Record<GenderPref, string> = {
  MALE:          "Masculino",
  FEMALE:        "Feminino",
  NO_PREFERENCE: "Sem preferência",
};

const DAY_LABELS: Record<Day, string> = {
  MON: "Seg", TUE: "Ter", WED: "Qua",
  THU: "Qui", FRI: "Sex", SAT: "Sáb", SUN: "Dom",
};

const PERIOD_LABELS: Record<Period, string> = {
  MORNING:   "Manhã",
  AFTERNOON: "Tarde",
  EVENING:   "Noite",
};

const INVESTMENT_LABELS: Record<InvestmentRange, string> = {
  up100:     "Até R$ 100",
  "100to150": "R$ 100 – R$ 150",
  "150to200": "R$ 150 – R$ 200",
  "200plus":  "Acima de R$ 200",
  flexible:  "Flexível",
};

const TOTAL_STEPS = 6;

// ─── Componentes de UI ────────────────────────────────────────────────────────

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-sm fw-semibold px-3 py-2 ${
        active
          ? "btn-primary"
          : "btn-outline-secondary"
      }`}
      style={{ borderRadius: 20, fontSize: "0.86rem", transition: "all 0.15s" }}
    >
      {active && <CheckCircle2 size={13} className="me-1" />}
      {children}
    </button>
  );
}

function OptionCard({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn w-100 text-start fw-semibold px-4 py-3 ${
        active ? "btn-primary" : "btn-outline-secondary"
      }`}
      style={{ borderRadius: 12, fontSize: "0.9rem", transition: "all 0.15s" }}
    >
      {active && <CheckCircle2 size={14} className="me-2" />}
      {children}
    </button>
  );
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const done    = n < current;
        const active  = n === current;
        return (
          <div key={n} className="d-flex align-items-center gap-2 flex-grow-1">
            <div
              className={`d-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0 ${
                done   ? "bg-success text-white"
                : active ? "bg-primary text-white"
                : "bg-light text-muted border"
              }`}
              style={{ width: 28, height: 28, fontSize: "0.75rem" }}
            >
              {done ? <CheckCircle2 size={14} /> : n}
            </div>
            {n < TOTAL_STEPS && (
              <div
                className="flex-grow-1"
                style={{
                  height: 3,
                  borderRadius: 4,
                  background: done ? "var(--bs-success)" : "#e5e7eb",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AnamneseFlow ─────────────────────────────────────────────────────────────

export function AnamneseFlow({ existing }: { existing: ExistingAnamnesis | null }) {
  const router = useRouter();
  const isEditing = !!existing?.completedAt;

  const [step, setStep]   = useState<number>(1);           // 1–6 = form, 7 = summary
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AnamnesisData>({
    mainReasons:        (existing?.mainReasons        as MainReason[])     ?? [],
    symptomDuration:    (existing?.symptomDuration    as SymptomDuration)  ?? "",
    hadPreviousTherapy: existing?.hadPreviousTherapy                       ?? null,
    previousApproach:   (existing?.previousApproach   as PreviousApproach) ?? null,
    preferredModality:  (existing?.preferredModality  as Modality)         ?? "",
    genderPreference:   (existing?.genderPreference   as GenderPref)       ?? "",
    availableDays:      (existing?.availableDays       as Day[])            ?? [],
    availablePeriods:   (existing?.availablePeriods    as Period[])         ?? [],
    investmentRange:    (existing?.investmentRange     as InvestmentRange)  ?? "",
    urgencyLevel:       existing?.urgencyLevel                             ?? 3,
  });

  // ── Toggles ────────────────────────────────────────────────────────────────

  function toggleMulti<T extends string>(field: keyof AnamnesisData, value: T) {
    setForm((prev) => {
      const arr = prev[field] as T[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  }

  function setSingle<T>(field: keyof AnamnesisData, value: T) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Validação por passo ────────────────────────────────────────────────────

  function canAdvance(): boolean {
    switch (step) {
      case 1: return form.mainReasons.length > 0;
      case 2: return !!form.symptomDuration;
      case 3: return form.hadPreviousTherapy !== null;
      case 4: return !!form.preferredModality && !!form.genderPreference;
      case 5: return form.availableDays.length > 0 && form.availablePeriods.length > 0;
      case 6: return !!form.investmentRange && form.urgencyLevel >= 1;
      default: return true;
    }
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/patient/anamnesis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          previousApproach: form.hadPreviousTherapy ? form.previousApproach : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível salvar. Tente novamente.");
        return;
      }
      toast.success(isEditing ? "Anamnese atualizada!" : "Anamnese concluída!");
      router.push("/dashboard/paciente/psicologos");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ── Renderização dos passos ────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Passo 1: Motivo ──────────────────────────────────────────────────
      case 1:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Por que você busca ajuda?
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Selecione todos os temas que fazem sentido para você. Não há resposta errada.
            </p>
            <div className="d-flex flex-wrap gap-2">
              {(Object.keys(REASON_LABELS) as MainReason[]).map((key) => (
                <Chip
                  key={key}
                  active={form.mainReasons.includes(key)}
                  onClick={() => toggleMulti("mainReasons", key)}
                >
                  {REASON_LABELS[key]}
                </Chip>
              ))}
            </div>
          </div>
        );

      // ── Passo 2: Duração ─────────────────────────────────────────────────
      case 2:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Há quanto tempo você está sentindo isso?
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Escolha a opção que melhor representa sua situação.
            </p>
            <div className="d-flex flex-column gap-2">
              {(Object.keys(DURATION_LABELS) as SymptomDuration[]).map((key) => (
                <OptionCard
                  key={key}
                  active={form.symptomDuration === key}
                  onClick={() => setSingle("symptomDuration", key)}
                >
                  {DURATION_LABELS[key]}
                </OptionCard>
              ))}
            </div>
          </div>
        );

      // ── Passo 3: Histórico ───────────────────────────────────────────────
      case 3:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Você já fez terapia antes?
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Isso nos ajuda a encontrar profissionais mais adequados ao seu momento.
            </p>
            <div className="d-flex gap-3 mb-4">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => {
                    setSingle("hadPreviousTherapy", val);
                    if (!val) setSingle("previousApproach", null);
                  }}
                  className={`btn flex-grow-1 fw-semibold py-3 ${
                    form.hadPreviousTherapy === val ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  style={{ borderRadius: 12 }}
                >
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>

            {form.hadPreviousTherapy === true && (
              <div>
                <p className="fw-semibold mb-3" style={{ fontSize: "0.9rem", color: "#374151" }}>
                  Qual abordagem você seguiu? (opcional)
                </p>
                <div className="d-flex flex-column gap-2">
                  {(Object.keys(APPROACH_LABELS) as PreviousApproach[]).map((key) => (
                    <OptionCard
                      key={key}
                      active={form.previousApproach === key}
                      onClick={() => setSingle("previousApproach", key)}
                    >
                      {APPROACH_LABELS[key]}
                    </OptionCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ── Passo 4: Modalidade e gênero ─────────────────────────────────────
      case 4:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Como prefere ser atendido?
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Suas preferências nos ajudam a filtrar os melhores perfis para você.
            </p>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Modalidade de atendimento
            </p>
            <div className="d-flex flex-column gap-2 mb-4">
              {(Object.keys(MODALITY_LABELS) as Modality[]).map((key) => (
                <OptionCard
                  key={key}
                  active={form.preferredModality === key}
                  onClick={() => setSingle("preferredModality", key)}
                >
                  {MODALITY_LABELS[key]}
                </OptionCard>
              ))}
            </div>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Preferência de gênero do profissional
            </p>
            <div className="d-flex gap-2">
              {(Object.keys(GENDER_LABELS) as GenderPref[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSingle("genderPreference", key)}
                  className={`btn flex-grow-1 fw-semibold py-2 ${
                    form.genderPreference === key ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  style={{ borderRadius: 12, fontSize: "0.86rem" }}
                >
                  {GENDER_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        );

      // ── Passo 5: Disponibilidade ─────────────────────────────────────────
      case 5:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Quando você tem disponibilidade?
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Selecione todos os dias e períodos em que você poderia ser atendido.
            </p>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Dias da semana
            </p>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {(Object.keys(DAY_LABELS) as Day[]).map((key) => (
                <Chip
                  key={key}
                  active={form.availableDays.includes(key)}
                  onClick={() => toggleMulti("availableDays", key)}
                >
                  {DAY_LABELS[key]}
                </Chip>
              ))}
            </div>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Períodos preferidos
            </p>
            <div className="d-flex gap-2">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleMulti("availablePeriods", key)}
                  className={`btn flex-grow-1 fw-semibold py-3 ${
                    form.availablePeriods.includes(key) ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  style={{ borderRadius: 12, fontSize: "0.86rem" }}
                >
                  {PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        );

      // ── Passo 6: Investimento e urgência ─────────────────────────────────
      case 6:
        return (
          <div>
            <h2 className="fw-bold mb-1" style={{ fontSize: "1.35rem", color: "#1a1a2e" }}>
              Investimento e urgência
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
              Essas informações são confidenciais e usadas apenas para indicações mais precisas.
            </p>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Faixa de investimento por sessão
            </p>
            <div className="d-flex flex-column gap-2 mb-4">
              {(Object.keys(INVESTMENT_LABELS) as InvestmentRange[]).map((key) => (
                <OptionCard
                  key={key}
                  active={form.investmentRange === key}
                  onClick={() => setSingle("investmentRange", key)}
                >
                  {INVESTMENT_LABELS[key]}
                </OptionCard>
              ))}
            </div>

            <p className="fw-semibold mb-2" style={{ fontSize: "0.88rem", color: "#374151" }}>
              Com que urgência você precisa de atendimento?
            </p>
            <div className="d-flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSingle("urgencyLevel", n)}
                  className={`btn flex-grow-1 fw-bold py-3 ${
                    form.urgencyLevel === n ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  style={{ borderRadius: 12 }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>Posso aguardar</span>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>Urgente</span>
            </div>
          </div>
        );

      // ── Tela 7: Resumo ───────────────────────────────────────────────────
      case 7:
        return <Summary form={form} />;

      default:
        return null;
    }
  }

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <div>
      {/* Cabeçalho */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <ClipboardList size={22} className="text-primary" />
        <h1 className="title mb-0">Minha anamnese</h1>
      </div>
      <p className="text-muted m-b30" style={{ fontSize: "0.92rem" }}>
        {isEditing
          ? "Atualize suas respostas a qualquer momento — suas indicações serão recalculadas."
          : "Responda com calma. São apenas 6 passos e levam menos de 5 minutos."}
      </p>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4" style={{ maxWidth: 620 }}>

          {/* Progresso (somente nos passos 1-6) */}
          {step <= TOTAL_STEPS && <StepProgress current={step} />}

          {/* Conteúdo do passo */}
          <div style={{ minHeight: 280 }}>
            {renderStep()}
          </div>

          {/* Navegação */}
          <div className={`d-flex mt-4 ${step > 1 ? "justify-content-between" : "justify-content-end"}`}>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => setStep((s) => s - 1)}
                style={{ borderRadius: 10 }}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
            )}

            {step <= TOTAL_STEPS && (
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                style={{ borderRadius: 10 }}
              >
                {step === TOTAL_STEPS ? "Ver resumo" : "Próximo"}
                <ArrowRight size={16} />
              </button>
            )}

            {step === 7 && (
              <button
                type="button"
                className="btn btn-success d-flex align-items-center gap-2 fw-semibold"
                onClick={() => void handleSave()}
                disabled={saving}
                style={{ borderRadius: 10, minWidth: 180 }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
                    Salvando…
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    {isEditing ? "Atualizar e buscar" : "Confirmar e buscar psicólogos"}
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Componente de Resumo ─────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="d-flex align-items-start gap-3 py-2 border-bottom">
      <span className="text-muted flex-shrink-0" style={{ fontSize: "0.83rem", minWidth: 160 }}>
        {label}
      </span>
      <span className="fw-semibold text-dark" style={{ fontSize: "0.88rem" }}>
        {value}
      </span>
    </div>
  );
}

function Summary({ form }: { form: AnamnesisData }) {
  const reasons = form.mainReasons
    .map((r) => REASON_LABELS[r as MainReason])
    .join(", ");

  const days = form.availableDays
    .map((d) => DAY_LABELS[d as Day])
    .join(", ");

  const periods = form.availablePeriods
    .map((p) => PERIOD_LABELS[p as Period])
    .join(", ");

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-1">
        <CheckCircle2 size={20} className="text-success" />
        <h2 className="fw-bold mb-0" style={{ fontSize: "1.25rem", color: "#1a1a2e" }}>
          Resumo das suas respostas
        </h2>
      </div>
      <p className="text-muted mb-4" style={{ fontSize: "0.88rem" }}>
        Confira suas informações antes de confirmar. Você pode voltar e editar qualquer passo.
      </p>

      <div className="mb-4">
        <SummaryRow label="Motivos" value={reasons || "—"} />
        <SummaryRow
          label="Duração dos sintomas"
          value={form.symptomDuration ? DURATION_LABELS[form.symptomDuration as SymptomDuration] : "—"}
        />
        <SummaryRow
          label="Terapia anterior"
          value={
            form.hadPreviousTherapy === null
              ? "—"
              : form.hadPreviousTherapy
              ? `Sim${form.previousApproach ? ` — ${APPROACH_LABELS[form.previousApproach as PreviousApproach]}` : ""}`
              : "Não"
          }
        />
        <SummaryRow
          label="Modalidade preferida"
          value={form.preferredModality ? MODALITY_LABELS[form.preferredModality as Modality] : "—"}
        />
        <SummaryRow
          label="Gênero do profissional"
          value={form.genderPreference ? GENDER_LABELS[form.genderPreference as GenderPref] : "—"}
        />
        <SummaryRow label="Dias disponíveis" value={days || "—"} />
        <SummaryRow label="Períodos" value={periods || "—"} />
        <SummaryRow
          label="Investimento por sessão"
          value={form.investmentRange ? INVESTMENT_LABELS[form.investmentRange as InvestmentRange] : "—"}
        />
        <SummaryRow
          label="Nível de urgência"
          value={`${form.urgencyLevel} / 5`}
        />
      </div>

      <div
        className="rounded-3 p-3 d-flex align-items-start gap-2"
        style={{ background: "#f0fdf4", fontSize: "0.82rem" }}
      >
        <CheckCircle2 size={15} className="text-success flex-shrink-0 mt-1" />
        <span className="text-muted">
          Suas respostas são <strong className="text-dark">confidenciais</strong> e usadas
          exclusivamente para indicar profissionais compatíveis, conforme a{" "}
          <strong className="text-dark">LGPD</strong>.
        </span>
      </div>
    </div>
  );
}
