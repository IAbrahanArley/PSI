"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit2,
  MapPin,
  Monitor,
  Phone,
  Pin,
  PinOff,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CareRow = {
  id: string;
  status: "ACTIVE" | "PAUSED" | "DISCHARGED";
  clinicalSummary: string | null;
  patientId: string;
};

type ClinicalTag = { id: string; label: string; color: string | null };

type ApptRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  modality: string;
};

type NoteRow = {
  id: string;
  title: string | null;
  body: string;
  noteType: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: ClinicalTag[];
};

type PatientProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  birthDate: string | null;
  gender: string | null;
  state: string | null;
  city: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type Anamnesis = {
  mainReasons: string[];
  symptomDuration: string | null;
  hadPreviousTherapy: boolean | null;
  previousApproach: string | null;
  preferredModality: string | null;
  genderPreference: string | null;
  availableDays: string[];
  availablePeriods: string[];
  investmentRange: string | null;
  urgencyLevel: number | null;
  completedAt: string | null;
};

// ─── Label maps ───────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  ansiedade: "Ansiedade", depressao: "Depressão", relacionamentos: "Relacionamentos",
  autoconhecimento: "Autoconhecimento", luto: "Luto / perda", trauma: "Trauma",
  estresse: "Estresse", familia: "Família", orientacao_vocacional: "Orientação vocacional",
  outros: "Outros",
};
const DURATION_LABELS: Record<string, string> = {
  lt1m: "Menos de 1 mês", "1to3m": "1 a 3 meses", "3to6m": "3 a 6 meses",
  "6to12m": "6 meses a 1 ano", gt1y: "Mais de 1 ano",
};
const APPROACH_LABELS: Record<string, string> = {
  tcc: "TCC", psicanalise: "Psicanálise", humanista: "Humanista",
  sistemica: "Sistêmica", nao_sei: "Não sei", outra: "Outra",
};
const MODALITY_LABELS: Record<string, string> = {
  ONLINE: "Online", PRESENTIAL: "Presencial", NO_PREFERENCE: "Sem preferência",
};
const GENDER_PREF_LABELS: Record<string, string> = {
  MALE: "Masculino", FEMALE: "Feminino", NO_PREFERENCE: "Sem preferência",
};
const DAY_LABELS: Record<string, string> = {
  MON: "Seg", TUE: "Ter", WED: "Qua", THU: "Qui", FRI: "Sex", SAT: "Sáb", SUN: "Dom",
};
const PERIOD_LABELS: Record<string, string> = {
  MORNING: "Manhã", AFTERNOON: "Tarde", EVENING: "Noite",
};
const INVESTMENT_LABELS: Record<string, string> = {
  up100: "Até R$ 100", "100to150": "R$ 100–150", "150to200": "R$ 150–200",
  "200plus": "Acima de R$ 200", flexible: "Flexível",
};
const NOTE_TYPES: { value: string; label: string }[] = [
  { value: "PROGRESS", label: "Evolução" },
  { value: "SESSION", label: "Sessão" },
  { value: "ADMINISTRATIVE", label: "Administrativo" },
  { value: "RISK_OR_SAFETY", label: "Risco / segurança" },
  { value: "OTHER", label: "Outro" },
];
const NOTE_TYPE_LABEL = Object.fromEntries(NOTE_TYPES.map((x) => [x.value, x.label]));
const NOTE_TYPE_COLOR: Record<string, string> = {
  PROGRESS: "primary", SESSION: "success", ADMINISTRATIVE: "secondary",
  RISK_OR_SAFETY: "danger", OTHER: "light",
};
const CARE_STATUSES = [
  { value: "ACTIVE", label: "Ativo", color: "success" },
  { value: "PAUSED", label: "Pausado", color: "warning" },
  { value: "DISCHARGED", label: "Alta", color: "secondary" },
];
const APPT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendada", CONFIRMED: "Confirmada", IN_PROGRESS: "Em andamento",
  COMPLETED: "Realizada", CANCELLED: "Cancelada", NO_SHOW: "Falta",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { credentials: "include", ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}
function fmtDateOnly(iso: string) {
  try { return new Date(iso).toLocaleDateString("pt-BR"); }
  catch { return iso; }
}
function calcAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const diff = Date.now() - new Date(birthDate).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} anos`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="small text-muted d-block" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span className="small">{value}</span>
    </div>
  );
}

function Chip({ label, color = "secondary" }: { label: string; color?: string }) {
  return (
    <span className={`badge rounded-pill bg-${color}-subtle text-${color} border border-${color}-subtle me-1 mb-1`} style={{ fontSize: "0.75rem", fontWeight: 500 }}>
      {label}
    </span>
  );
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

function TabOverview({
  patient, care, appointments, tags,
  summaryDraft, setSummaryDraft,
  statusDraft, setStatusDraft,
  savingCare, onSaveCare,
}: {
  patient: PatientProfile;
  care: CareRow | null;
  appointments: ApptRow[];
  tags: ClinicalTag[];
  summaryDraft: string;
  setSummaryDraft: (v: string) => void;
  statusDraft: string;
  setStatusDraft: (v: string) => void;
  savingCare: boolean;
  onSaveCare: () => void;
}) {
  const recent = appointments.slice(0, 5);
  return (
    <div className="row g-3">
      {/* Demographics */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2 py-3">
            <User size={15} className="text-muted" /> Dados do paciente
          </div>
          <div className="card-body">
            <InfoRow label="Nome completo" value={patient.fullName} />
            <InfoRow label="E-mail" value={patient.email} />
            <InfoRow label="Telefone" value={patient.phone} />
            <InfoRow label="WhatsApp" value={patient.whatsapp} />
            <InfoRow label="Data de nascimento" value={patient.birthDate ? `${fmtDateOnly(patient.birthDate)} (${calcAge(patient.birthDate)})` : null} />
            <InfoRow label="Gênero" value={patient.gender === "MALE" ? "Masculino" : patient.gender === "FEMALE" ? "Feminino" : patient.gender === "OTHER" ? "Outro" : patient.gender === "PREFER_NOT_TO_SAY" ? "Prefere não dizer" : patient.gender} />
            <InfoRow label="Localização" value={[patient.city, patient.state].filter(Boolean).join(", ") || null} />
            <InfoRow label="Paciente desde" value={fmtDateOnly(patient.createdAt)} />
          </div>
        </div>
      </div>

      {/* Care summary */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2 py-3">
            <ClipboardList size={15} className="text-muted" /> Resumo clínico
          </div>
          <div className="card-body d-flex flex-column gap-3">
            <div>
              <label className="form-label small text-muted mb-1">Status do caso</label>
              <select className="form-select form-select-sm" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {CARE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex-grow-1">
              <label className="form-label small text-muted mb-1">Resumo / objetivos de trabalho</label>
              <textarea
                className="form-control form-control-sm"
                rows={6}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                placeholder="Objetivos terapêuticos, hipóteses de trabalho, observações iniciais…"
              />
            </div>
            <button className="btn btn-primary btn-sm" disabled={savingCare} onClick={onSaveCare}>
              {savingCare ? "Salvando…" : "Salvar resumo"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent appointments */}
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-white fw-semibold d-flex align-items-center gap-2 py-3">
            <CalendarCheck size={15} className="text-muted" /> Últimas consultas
          </div>
          <div className="card-body p-0">
            {recent.length === 0 ? (
              <p className="small text-muted p-3 mb-0">Nenhuma consulta registrada.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {recent.map((a) => (
                  <li key={a.id} className="list-group-item px-3 py-2">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="small fw-medium">{fmtDate(a.startsAt)}</div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                          {a.modality === "ONLINE" ? <Monitor size={11} className="text-muted" /> : <MapPin size={11} className="text-muted" />}
                          <span className="text-muted">{a.modality === "ONLINE" ? "Online" : "Presencial"}</span>
                        </div>
                      </div>
                      <span className={`badge bg-${a.status === "COMPLETED" ? "success" : a.status === "CANCELLED" ? "danger" : "primary"}-subtle text-${a.status === "COMPLETED" ? "success" : a.status === "CANCELLED" ? "danger" : "primary"} small`}>
                        {APPT_STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Anamnese ─────────────────────────────────────────────────────────────

function TabAnamnese({ anamnesis }: { anamnesis: Anamnesis | null }) {
  if (!anamnesis) {
    return (
      <div className="text-center py-5 text-muted">
        <ClipboardList size={40} className="mb-3 opacity-40" />
        <p className="mb-0">Este paciente ainda não preencheu a anamnese.</p>
      </div>
    );
  }

  const urgencyLabels = ["", "Pode aguardar", "Baixa", "Moderada", "Alta", "Urgente"];

  return (
    <div className="row g-3">
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold py-3">Motivo da busca</div>
          <div className="card-body">
            <div className="mb-3">
              <span className="small text-muted d-block mb-1">Principais motivos</span>
              <div>
                {anamnesis.mainReasons.length
                  ? anamnesis.mainReasons.map((r) => <Chip key={r} label={REASON_LABELS[r] ?? r} color="primary" />)
                  : <span className="text-muted small">Não informado</span>}
              </div>
            </div>
            <InfoRow label="Duração dos sintomas" value={anamnesis.symptomDuration ? DURATION_LABELS[anamnesis.symptomDuration] ?? anamnesis.symptomDuration : null} />
            {anamnesis.urgencyLevel != null && (
              <div className="mb-2">
                <span className="small text-muted d-block mb-1">Urgência percebida</span>
                <div className="d-flex align-items-center gap-2">
                  <div className="progress flex-grow-1" style={{ height: 8 }}>
                    <div
                      className={`progress-bar ${anamnesis.urgencyLevel >= 4 ? "bg-danger" : anamnesis.urgencyLevel >= 3 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${(anamnesis.urgencyLevel / 5) * 100}%` }}
                    />
                  </div>
                  <span className="small fw-semibold">{urgencyLabels[anamnesis.urgencyLevel] ?? anamnesis.urgencyLevel}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold py-3">Histórico e preferências</div>
          <div className="card-body">
            <InfoRow label="Terapia anterior" value={anamnesis.hadPreviousTherapy === true ? "Sim" : anamnesis.hadPreviousTherapy === false ? "Não" : null} />
            {anamnesis.hadPreviousTherapy && (
              <InfoRow label="Abordagem anterior" value={anamnesis.previousApproach ? APPROACH_LABELS[anamnesis.previousApproach] ?? anamnesis.previousApproach : "Não informada"} />
            )}
            <InfoRow label="Modalidade preferida" value={anamnesis.preferredModality ? MODALITY_LABELS[anamnesis.preferredModality] ?? anamnesis.preferredModality : null} />
            <InfoRow label="Preferência de gênero" value={anamnesis.genderPreference ? GENDER_PREF_LABELS[anamnesis.genderPreference] ?? anamnesis.genderPreference : null} />
            <InfoRow label="Investimento por sessão" value={anamnesis.investmentRange ? INVESTMENT_LABELS[anamnesis.investmentRange] ?? anamnesis.investmentRange : null} />
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold py-3">Disponibilidade</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="small text-muted d-block mb-1">Dias disponíveis</span>
                <div>
                  {anamnesis.availableDays.length
                    ? anamnesis.availableDays.map((d) => <Chip key={d} label={DAY_LABELS[d] ?? d} color="secondary" />)
                    : <span className="text-muted small">Não informado</span>}
                </div>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block mb-1">Períodos</span>
                <div>
                  {anamnesis.availablePeriods.length
                    ? anamnesis.availablePeriods.map((p) => <Chip key={p} label={PERIOD_LABELS[p] ?? p} color="secondary" />)
                    : <span className="text-muted small">Não informado</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Consultas ────────────────────────────────────────────────────────────

function TabConsultas({ appointments }: { appointments: ApptRow[] }) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <CalendarCheck size={40} className="mb-3 opacity-40" />
        <p className="mb-0">Nenhuma consulta registrada com este paciente.</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    COMPLETED: "success", CANCELLED: "danger", NO_SHOW: "warning",
    SCHEDULED: "primary", CONFIRMED: "info", IN_PROGRESS: "warning",
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Data e hora</th>
              <th>Modalidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="small fw-medium">{fmtDate(a.startsAt)}</td>
                <td className="small">
                  <span className="d-flex align-items-center gap-1">
                    {a.modality === "ONLINE" ? <Monitor size={13} className="text-muted" /> : <MapPin size={13} className="text-muted" />}
                    {a.modality === "ONLINE" ? "Online" : "Presencial"}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${statusColor[a.status] ?? "secondary"}-subtle text-${statusColor[a.status] ?? "secondary"} small`}>
                    {APPT_STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Note form ─────────────────────────────────────────────────────────────────

function NoteForm({
  appointments, tags,
  onTagCreated, onNoteCreated,
  patientId,
}: {
  appointments: ApptRow[];
  tags: ClinicalTag[];
  onTagCreated: (tag: ClinicalTag) => void;
  onNoteCreated: () => void;
  patientId: string;
}) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState("PROGRESS");
  const [noteAppointmentId, setNoteAppointmentId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const onCreateTag = async () => {
    const label = newTagLabel.trim();
    if (!label) return;
    try {
      const data = await jsonFetch<{ tag: ClinicalTag }>("/api/psychologist/clinical/tags", {
        method: "POST",
        body: JSON.stringify({ label }),
      });
      onTagCreated(data.tag);
      setNewTagLabel("");
      toast.success("Tag criada.");
    } catch { toast.error("Não foi possível criar a tag."); }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) { toast.error("Preencha o conteúdo da anotação."); return; }
    setSaving(true);
    try {
      await jsonFetch("/api/psychologist/clinical/notes", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          title: noteTitle.trim() || null,
          body: noteBody.trim(),
          noteType,
          appointmentId: noteAppointmentId || null,
          tagIds: selectedTagIds.length ? selectedTagIds : undefined,
        }),
      });
      setNoteTitle(""); setNoteBody(""); setNoteType("PROGRESS");
      setNoteAppointmentId(""); setSelectedTagIds([]);
      toast.success("Anotação registrada.");
      onNoteCreated();
    } catch { toast.error("Não foi possível salvar a anotação."); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={onSubmit}>
      {noteType === "RISK_OR_SAFETY" && (
        <div className="alert alert-danger d-flex align-items-start gap-2 py-2 small mb-3">
          <AlertTriangle size={14} className="flex-shrink-0 mt-1" />
          Use com responsabilidade. Em emergência, acione protocolos locais (SAMU, CVV, rede de apoio).
        </div>
      )}
      <div className="row g-2 mb-2">
        <div className="col-md-6">
          <label className="form-label small text-muted mb-1">Título (opcional)</label>
          <input className="form-control form-control-sm" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} maxLength={200} />
        </div>
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">Tipo</label>
          <select className="form-select form-select-sm" value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small text-muted mb-1">Vincular à sessão</label>
          <select className="form-select form-select-sm" value={noteAppointmentId} onChange={(e) => setNoteAppointmentId(e.target.value)}>
            <option value="">Nenhuma</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>{fmtDate(a.startsAt)} — {APPT_STATUS_LABEL[a.status] ?? a.status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2">
        <label className="form-label small text-muted mb-1">Conteúdo da anotação *</label>
        <textarea
          className="form-control"
          rows={6}
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Anotação clínica objetiva — use linguagem técnica, evite dados desnecessários (LGPD)…"
          required
        />
        <div className="text-end">
          <span className="small text-muted">{noteBody.length} / 20.000</span>
        </div>
      </div>
      <div className="mb-3">
        <span className="small text-muted d-block mb-1">Tags</span>
        <div className="d-flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <label key={t.id} className={`badge fw-normal border cursor-pointer ${selectedTagIds.includes(t.id) ? "bg-primary text-white border-primary" : "bg-light text-dark border-secondary"}`} style={{ cursor: "pointer" }}>
              <input type="checkbox" className="d-none" checked={selectedTagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
              {t.label}
            </label>
          ))}
        </div>
        <div className="d-flex gap-2">
          <input className="form-control form-control-sm" style={{ maxWidth: 200 }} placeholder="Nova tag…" value={newTagLabel} onChange={(e) => setNewTagLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onCreateTag(); } }} />
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCreateTag}>Criar</button>
        </div>
      </div>
      <button type="submit" className="btn btn-success btn-sm" disabled={saving}>
        {saving ? "Salvando…" : "Registrar evolução"}
      </button>
    </form>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────

function NoteCard({
  note, allTags,
  onTogglePin, onDelete, onUpdate,
}: {
  note: NoteRow;
  allTags: ClinicalTag[];
  onTogglePin: () => void;
  onDelete: () => void;
  onUpdate: (updated: Partial<NoteRow>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title ?? "");
  const [editBody, setEditBody] = useState(note.body);
  const [editType, setEditType] = useState(note.noteType);
  const [editTagIds, setEditTagIds] = useState(note.tags.map((t) => t.id));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bodyPreview = note.body.length > 200 && !expanded ? note.body.slice(0, 200) + "…" : note.body;

  const onSaveEdit = async () => {
    setSaving(true);
    try {
      await jsonFetch(`/api/psychologist/clinical/notes/${note.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim() || null,
          body: editBody.trim(),
          noteType: editType,
          tagIds: editTagIds,
        }),
      });
      onUpdate({
        title: editTitle.trim() || null,
        body: editBody.trim(),
        noteType: editType,
        tags: allTags.filter((t) => editTagIds.includes(t.id)),
      });
      setEditing(false);
      toast.success("Anotação atualizada.");
    } catch { toast.error("Não foi possível atualizar a anotação."); }
    finally { setSaving(false); }
  };

  const toggleEditTag = (id: string) =>
    setEditTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const color = NOTE_TYPE_COLOR[note.noteType] ?? "secondary";

  return (
    <div className={`card border-0 shadow-sm border-start border-4 border-${color}`} style={{ borderLeftWidth: 4 }}>
      <div className="card-body py-3">
        {!editing ? (
          <>
            <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start mb-2">
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <span className="small text-muted">{fmtDate(note.createdAt)}</span>
                  {note.createdAt !== note.updatedAt && <span className="small text-muted fst-italic">(editado)</span>}
                  <span className={`badge bg-${color}-subtle text-${color} small`}>{NOTE_TYPE_LABEL[note.noteType] ?? note.noteType}</span>
                  {note.isPinned && <span className="badge bg-warning-subtle text-warning small">📌 Fixada</span>}
                  {note.tags.map((t) => (
                    <span key={t.id} className="badge bg-secondary-subtle text-secondary small">{t.label}</span>
                  ))}
                </div>
                {note.title && <div className="fw-semibold small mb-1">{note.title}</div>}
              </div>
              <div className="d-flex gap-1 flex-shrink-0">
                <button type="button" className="btn btn-link btn-sm text-muted p-1" title={note.isPinned ? "Desafixar" : "Fixar"} onClick={onTogglePin}>
                  {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                <button type="button" className="btn btn-link btn-sm text-muted p-1" title="Editar" onClick={() => { setEditing(true); setEditTitle(note.title ?? ""); setEditBody(note.body); setEditType(note.noteType); setEditTagIds(note.tags.map((t) => t.id)); }}>
                  <Edit2 size={14} />
                </button>
                {!confirmDelete ? (
                  <button type="button" className="btn btn-link btn-sm text-danger p-1" title="Excluir" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="d-flex align-items-center gap-1">
                    <button type="button" className="btn btn-danger btn-sm py-0 px-2" style={{ fontSize: "0.75rem" }} onClick={onDelete}>Confirmar</button>
                    <button type="button" className="btn btn-outline-secondary btn-sm py-0 px-2" style={{ fontSize: "0.75rem" }} onClick={() => setConfirmDelete(false)}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="small mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{bodyPreview}</p>
            {note.body.length > 200 && (
              <button type="button" className="btn btn-link btn-sm text-muted p-0 mt-1 d-flex align-items-center gap-1" onClick={() => setExpanded((v) => !v)}>
                {expanded ? <><ChevronUp size={13} /> Ver menos</> : <><ChevronDown size={13} /> Ver mais</>}
              </button>
            )}
          </>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small fw-semibold">Editando anotação</span>
              <button type="button" className="btn btn-link btn-sm text-muted p-0" onClick={() => setEditing(false)}><X size={14} /></button>
            </div>
            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <input className="form-control form-control-sm" placeholder="Título (opcional)" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} />
              </div>
              <div className="col-md-6">
                <select className="form-select form-select-sm" value={editType} onChange={(e) => setEditType(e.target.value)}>
                  {NOTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <textarea className="form-control form-control-sm mb-2" rows={5} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            <div className="d-flex flex-wrap gap-2 mb-2">
              {allTags.map((t) => (
                <label key={t.id} className={`badge fw-normal border ${editTagIds.includes(t.id) ? "bg-primary text-white border-primary" : "bg-light text-dark border-secondary"}`} style={{ cursor: "pointer" }}>
                  <input type="checkbox" className="d-none" checked={editTagIds.includes(t.id)} onChange={() => toggleEditTag(t.id)} />
                  {t.label}
                </label>
              ))}
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-success btn-sm d-flex align-items-center gap-1" disabled={saving} onClick={onSaveEdit}>
                <Save size={13} /> {saving ? "Salvando…" : "Salvar"}
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Evolução Clínica ─────────────────────────────────────────────────────

function TabEvolucao({
  patientId, appointments, tags, pinned, notes, nextCursor,
  onTagCreated, onNoteCreated, onTogglePin, onDeleteNote, onUpdateNote, onLoadMore, loadingMore,
}: {
  patientId: string;
  appointments: ApptRow[];
  tags: ClinicalTag[];
  pinned: NoteRow[];
  notes: NoteRow[];
  nextCursor: { createdAt: string; id: string } | null;
  onTagCreated: (tag: ClinicalTag) => void;
  onNoteCreated: () => void;
  onTogglePin: (noteId: string, isPinned: boolean) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (noteId: string, patch: Partial<NoteRow>) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
}) {
  const pinnedIds = new Set(pinned.map((n) => n.id));
  const timeline = notes.filter((n) => !pinnedIds.has(n.id));

  return (
    <div className="row g-4">
      {/* Form column */}
      <div className="col-xl-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold py-3 d-flex align-items-center gap-2">
            <Edit2 size={15} className="text-muted" /> Nova evolução clínica
          </div>
          <div className="card-body">
            <NoteForm
              patientId={patientId}
              appointments={appointments}
              tags={tags}
              onTagCreated={onTagCreated}
              onNoteCreated={onNoteCreated}
            />
          </div>
        </div>
      </div>

      {/* Timeline column */}
      <div className="col-xl-7">
        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Pin size={14} className="text-warning" />
              <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: "0.06em" }}>Fixadas</span>
            </div>
            <div className="d-flex flex-column gap-2">
              {pinned.map((n) => (
                <NoteCard
                  key={n.id} note={n} allTags={tags}
                  onTogglePin={() => onTogglePin(n.id, n.isPinned)}
                  onDelete={() => onDeleteNote(n.id)}
                  onUpdate={(patch) => onUpdateNote(n.id, patch)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: "0.06em" }}>Timeline</span>
        </div>
        {timeline.length === 0 && pinned.length === 0 && (
          <div className="text-center py-4 text-muted">
            <Edit2 size={32} className="mb-2 opacity-40" />
            <p className="small mb-0">Nenhuma anotação ainda. Use o formulário ao lado para registrar a primeira evolução.</p>
          </div>
        )}
        <div className="d-flex flex-column gap-2">
          {timeline.map((n) => (
            <NoteCard
              key={n.id} note={n} allTags={tags}
              onTogglePin={() => onTogglePin(n.id, n.isPinned)}
              onDelete={() => onDeleteNote(n.id)}
              onUpdate={(patch) => onUpdateNote(n.id, patch)}
            />
          ))}
        </div>
        {nextCursor && (
          <div className="text-center mt-3">
            <button className="btn btn-outline-primary btn-sm" disabled={loadingMore} onClick={onLoadMore}>
              {loadingMore ? "Carregando…" : "Carregar mais anotações"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = "overview" | "evolucao" | "anamnese" | "consultas";

export function PatientClinicalDetail() {
  const params = useParams();
  const patientId = typeof params?.patientId === "string" ? params.patientId : "";

  const [tab, setTab] = useState<Tab>("evolucao");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Data
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null);
  const [care, setCare] = useState<CareRow | null>(null);
  const [tags, setTags] = useState<ClinicalTag[]>([]);
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [pinned, setPinned] = useState<NoteRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Care form
  const [summaryDraft, setSummaryDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState("ACTIVE");
  const [savingCare, setSavingCare] = useState(false);

  const loadCore = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [profileRes, tagsRes, apRes, pinRes, notesRes] = await Promise.all([
        jsonFetch<{ patient: PatientProfile; anamnesis: Anamnesis | null }>(
          `/api/psychologist/clinical/patients/${patientId}/profile`,
        ),
        jsonFetch<{ tags: ClinicalTag[] }>("/api/psychologist/clinical/tags"),
        jsonFetch<{ appointments: ApptRow[] }>(
          `/api/psychologist/clinical/patients/${patientId}/appointments?limit=50`,
        ),
        jsonFetch<{ notes: NoteRow[] }>(
          `/api/psychologist/clinical/notes?patientId=${patientId}&pinnedOnly=true`,
        ),
        jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(
          `/api/psychologist/clinical/notes?patientId=${patientId}&limit=15`,
        ),
      ]);

      setPatient(profileRes.patient);
      setAnamnesis(profileRes.anamnesis);

      // Load care separately (may not exist yet)
      try {
        const careRes = await jsonFetch<{ care: CareRow }>(
          `/api/psychologist/clinical/patients/${patientId}/care`,
        );
        setCare(careRes.care);
        setSummaryDraft(careRes.care.clinicalSummary ?? "");
        setStatusDraft(careRes.care.status);
      } catch { /* care may not exist yet */ }

      setTags(tagsRes.tags);
      setAppointments(apRes.appointments);
      setPinned(pinRes.notes);
      setNotes(notesRes.notes);
      setNextCursor(notesRes.nextCursor);
    } catch (e) {
      if (e instanceof Error && (e.message.includes("não encontrado") || e.message.includes("sem vínculo"))) {
        setNotFound(true);
      } else {
        toast.error("Não foi possível carregar o prontuário.");
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { loadCore(); }, [loadCore]);

  const refreshNotes = useCallback(async () => {
    if (!patientId) return;
    try {
      const [pinRes, notesRes] = await Promise.all([
        jsonFetch<{ notes: NoteRow[] }>(
          `/api/psychologist/clinical/notes?patientId=${patientId}&pinnedOnly=true`,
        ),
        jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(
          `/api/psychologist/clinical/notes?patientId=${patientId}&limit=15`,
        ),
      ]);
      setPinned(pinRes.notes);
      setNotes(notesRes.notes);
      setNextCursor(notesRes.nextCursor);
    } catch { /* ignore */ }
  }, [patientId]);

  const loadMore = async () => {
    if (!patientId || !nextCursor) return;
    setLoadingMore(true);
    try {
      const url = new URL("/api/psychologist/clinical/notes", window.location.origin);
      url.searchParams.set("patientId", patientId);
      url.searchParams.set("limit", "15");
      url.searchParams.set("cursorCreatedAt", nextCursor.createdAt);
      url.searchParams.set("cursorId", nextCursor.id);
      const data = await jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(url.toString());
      setNotes((prev) => [...prev, ...data.notes]);
      setNextCursor(data.nextCursor);
    } catch { toast.error("Não foi possível carregar mais anotações."); }
    finally { setLoadingMore(false); }
  };

  const onSaveCare = async () => {
    if (!patientId) return;
    setSavingCare(true);
    try {
      const data = await jsonFetch<{ care: CareRow }>(
        `/api/psychologist/clinical/patients/${patientId}/care`,
        { method: "PATCH", body: JSON.stringify({ status: statusDraft, clinicalSummary: summaryDraft.trim() || null }) },
      );
      setCare(data.care);
      toast.success("Resumo clínico salvo.");
    } catch { toast.error("Não foi possível salvar o resumo."); }
    finally { setSavingCare(false); }
  };

  const onTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      await jsonFetch(`/api/psychologist/clinical/notes/${noteId}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !isPinned }),
      });
      await refreshNotes();
    } catch { toast.error("Não foi possível atualizar a fixação."); }
  };

  const onDeleteNote = async (noteId: string) => {
    try {
      await jsonFetch(`/api/psychologist/clinical/notes/${noteId}`, { method: "DELETE" });
      toast.success("Anotação removida.");
      await refreshNotes();
    } catch { toast.error("Não foi possível excluir a anotação."); }
  };

  const onUpdateNote = (noteId: string, patch: Partial<NoteRow>) => {
    const apply = (prev: NoteRow[]) => prev.map((n) => n.id === noteId ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n);
    setPinned(apply);
    setNotes(apply);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!patientId) return <div className="alert alert-warning">ID do paciente inválido.</div>;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-border-sm text-primary me-2" />
        Carregando prontuário…
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="alert alert-danger">
        Paciente não encontrado ou sem vínculo com sua prática.{" "}
        <Link href="/dashboard/psicologo/pacientes">Voltar à lista</Link>
      </div>
    );
  }

  const careStatus = CARE_STATUSES.find((s) => s.value === (care?.status ?? statusDraft));
  const age = calcAge(patient.birthDate);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "evolucao",  label: "Evolução Clínica", icon: <Edit2 size={14} /> },
    { id: "overview",  label: "Visão Geral",       icon: <User size={14} /> },
    { id: "anamnese",  label: "Anamnese",          icon: <ClipboardList size={14} /> },
    { id: "consultas", label: "Consultas",         icon: <CalendarCheck size={14} /> },
  ];

  return (
    <div>
      {/* ── Patient header ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3 px-4">
          <div className="d-flex align-items-start gap-3 flex-wrap">
            {/* Avatar */}
            {patient.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.avatarUrl} alt="" className="rounded-circle border object-fit-cover flex-shrink-0" style={{ width: 52, height: 52 }} />
            ) : (
              <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0 fw-bold" style={{ width: 52, height: 52, fontSize: "1.2rem" }}>
                {patient.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                <h1 className="h5 fw-semibold mb-0">{patient.fullName}</h1>
                {careStatus && (
                  <span className={`badge bg-${careStatus.color}-subtle text-${careStatus.color}`}>
                    {careStatus.label}
                  </span>
                )}
                {anamnesis?.urgencyLevel != null && anamnesis.urgencyLevel >= 4 && (
                  <span className="badge bg-danger-subtle text-danger d-flex align-items-center gap-1">
                    <AlertTriangle size={11} /> Urgência alta
                  </span>
                )}
              </div>
              <div className="d-flex flex-wrap gap-3 small text-muted">
                {age && <span>{age}</span>}
                {patient.email && <span>{patient.email}</span>}
                {(patient.phone || patient.whatsapp) && (
                  <span className="d-flex align-items-center gap-1">
                    <Phone size={12} />
                    {patient.phone ?? patient.whatsapp}
                  </span>
                )}
                {(patient.city || patient.state) && (
                  <span className="d-flex align-items-center gap-1">
                    <MapPin size={12} />
                    {[patient.city, patient.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <Link href="/dashboard/psicologo/pacientes" className="btn btn-outline-secondary btn-sm flex-shrink-0">
              ← Pacientes
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map((t) => (
          <li key={t.id} className="nav-item">
            <button
              type="button"
              className={`nav-link d-flex align-items-center gap-2 ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span className="d-none d-sm-inline">{t.label}</span>
              <span className="d-sm-none">{t.label.split(" ")[0]}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* ── Tab content ── */}
      {tab === "overview" && (
        <TabOverview
          patient={patient} care={care} appointments={appointments} tags={tags}
          summaryDraft={summaryDraft} setSummaryDraft={setSummaryDraft}
          statusDraft={statusDraft} setStatusDraft={setStatusDraft}
          savingCare={savingCare} onSaveCare={onSaveCare}
        />
      )}

      {tab === "evolucao" && (
        <TabEvolucao
          patientId={patientId} appointments={appointments} tags={tags}
          pinned={pinned} notes={notes} nextCursor={nextCursor}
          onTagCreated={(tag) => setTags((prev) => [...prev, tag].sort((a, b) => a.label.localeCompare(b.label)))}
          onNoteCreated={refreshNotes}
          onTogglePin={onTogglePin}
          onDeleteNote={onDeleteNote}
          onUpdateNote={onUpdateNote}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
        />
      )}

      {tab === "anamnese" && <TabAnamnese anamnesis={anamnesis} />}

      {tab === "consultas" && <TabConsultas appointments={appointments} />}
    </div>
  );
}
