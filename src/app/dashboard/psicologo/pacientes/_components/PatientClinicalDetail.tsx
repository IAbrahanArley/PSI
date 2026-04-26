"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { toast } from "sonner";

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
  tags: ClinicalTag[];
};

const NOTE_TYPES: { value: string; label: string }[] = [
  { value: "PROGRESS", label: "Evolução" },
  { value: "SESSION", label: "Sessão" },
  { value: "ADMINISTRATIVE", label: "Administrativo" },
  { value: "RISK_OR_SAFETY", label: "Risco / segurança" },
  { value: "OTHER", label: "Outro" },
];

const NOTE_TYPE_LABEL = Object.fromEntries(NOTE_TYPES.map((x) => [x.value, x.label]));

const CARE_STATUS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "PAUSED", label: "Pausado" },
  { value: "DISCHARGED", label: "Alta" },
];

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { credentials: "include", ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function PatientClinicalDetail() {
  const params = useParams();
  const patientId = typeof params?.patientId === "string" ? params.patientId : "";

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [care, setCare] = useState<CareRow | null>(null);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<string>("ACTIVE");
  const [savingCare, setSavingCare] = useState(false);

  const [tags, setTags] = useState<ClinicalTag[]>([]);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [appointments, setAppointments] = useState<ApptRow[]>([]);

  const [pinned, setPinned] = useState<NoteRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState("PROGRESS");
  const [noteAppointmentId, setNoteAppointmentId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  const loadCore = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [careRes, tagsRes, apRes, pinRes, notesRes] = await Promise.all([
        jsonFetch<{ care: CareRow }>(`/api/psychologist/clinical/patients/${patientId}/care`),
        jsonFetch<{ tags: ClinicalTag[] }>("/api/psychologist/clinical/tags"),
        jsonFetch<{ appointments: ApptRow[] }>(
          `/api/psychologist/clinical/patients/${patientId}/appointments?limit=20`,
        ),
        jsonFetch<{ notes: NoteRow[] }>(
          `/api/psychologist/clinical/notes?patientId=${encodeURIComponent(patientId)}&pinnedOnly=true`,
        ),
        jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(
          `/api/psychologist/clinical/notes?patientId=${encodeURIComponent(patientId)}&limit=15`,
        ),
      ]);
      setCare(careRes.care);
      setSummaryDraft(careRes.care.clinicalSummary ?? "");
      setStatusDraft(careRes.care.status);
      setTags(tagsRes.tags);
      setAppointments(apRes.appointments);
      setPinned(pinRes.notes);
      setNotes(notesRes.notes);
      setNextCursor(notesRes.nextCursor);
    } catch (e) {
      if (e instanceof Error && e.message.includes("não encontrado")) {
        setNotFound(true);
      } else {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  const loadMore = async () => {
    if (!patientId || !nextCursor) return;
    setLoadingMore(true);
    try {
      const url = new URL("/api/psychologist/clinical/notes", window.location.origin);
      url.searchParams.set("patientId", patientId);
      url.searchParams.set("limit", "15");
      url.searchParams.set("cursorCreatedAt", nextCursor.createdAt);
      url.searchParams.set("cursorId", nextCursor.id);
      const data = await jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(
        url.toString(),
      );
      setNotes((prev) => [...prev, ...data.notes]);
      setNextCursor(data.nextCursor);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar mais.");
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshNotesOnly = async () => {
    if (!patientId) return;
    try {
      const [pinRes, notesRes] = await Promise.all([
        jsonFetch<{ notes: NoteRow[] }>(
          `/api/psychologist/clinical/notes?patientId=${encodeURIComponent(patientId)}&pinnedOnly=true`,
        ),
        jsonFetch<{ notes: NoteRow[]; nextCursor: { createdAt: string; id: string } | null }>(
          `/api/psychologist/clinical/notes?patientId=${encodeURIComponent(patientId)}&limit=15`,
        ),
      ]);
      setPinned(pinRes.notes);
      setNotes(notesRes.notes);
      setNextCursor(notesRes.nextCursor);
    } catch {
      /* ignore */
    }
  };

  const onSaveCare = async () => {
    if (!patientId) return;
    setSavingCare(true);
    try {
      const data = await jsonFetch<{ care: CareRow }>(`/api/psychologist/clinical/patients/${patientId}/care`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusDraft,
          clinicalSummary: summaryDraft.trim() || null,
        }),
      });
      setCare(data.care);
      toast.success("Resumo e status salvos.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSavingCare(false);
    }
  };

  const onCreateTag = async () => {
    const label = newTagLabel.trim();
    if (!label) return;
    try {
      const data = await jsonFetch<{ tag: ClinicalTag }>("/api/psychologist/clinical/tags", {
        method: "POST",
        body: JSON.stringify({ label }),
      });
      setTags((prev) => [...prev, data.tag].sort((a, b) => a.label.localeCompare(b.label)));
      setNewTagLabel("");
      toast.success("Tag criada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar tag.");
    }
  };

  const onCreateNote = async () => {
    if (!patientId || !noteBody.trim()) {
      toast.error("Preencha o conteúdo da anotação.");
      return;
    }
    setSavingNote(true);
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
      setNoteTitle("");
      setNoteBody("");
      setNoteType("PROGRESS");
      setNoteAppointmentId("");
      setSelectedTagIds([]);
      toast.success("Anotação criada.");
      await refreshNotesOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar anotação.");
    } finally {
      setSavingNote(false);
    }
  };

  const togglePin = async (noteId: string, pinnedNow: boolean) => {
    try {
      await jsonFetch(`/api/psychologist/clinical/notes/${noteId}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !pinnedNow }),
      });
      await refreshNotesOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao fixar.");
    }
  };

  const removeNote = async (noteId: string) => {
    if (!window.confirm("Excluir esta anotação? (exclusão lógica — pode ser retida por política de guarda.)")) return;
    try {
      await jsonFetch(`/api/psychologist/clinical/notes/${noteId}`, { method: "DELETE" });
      toast.success("Anotação removida.");
      await refreshNotesOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!patientId) {
    return <Alert variant="warning">ID do paciente inválido.</Alert>;
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Carregando prontuário…
      </div>
    );
  }

  if (notFound) {
    return (
      <Alert variant="danger">
        Paciente não encontrado ou sem vínculo com sua prática.{" "}
        <Link href="/dashboard/psicologo/pacientes">Voltar à lista</Link>
      </Alert>
    );
  }

  const pinnedIds = new Set(pinned.map((n) => n.id));
  const timelineNotes = notes.filter((n) => !pinnedIds.has(n.id));

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 m-b30">
        <div>
          <Link href="/dashboard/psicologo/pacientes" className="small text-decoration-none text-muted">
            ← Pacientes
          </Link>
          <h1 className="h4 mt-1 mb-0 fw-semibold text-secondary">Prontuário</h1>
          <p className="small text-muted mb-0">Registro clínico leve — siga ética e LGPD.</p>
        </div>
      </div>

      <Row className="g-3 m-b30">
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">Resumo clínico e status</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Status do caso</Form.Label>
                <Form.Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                  {CARE_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Resumo (objetivos, linha de cuidado)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  placeholder="Texto breve para abertura da próxima sessão…"
                />
              </Form.Group>
              <Button variant="primary" size="sm" disabled={savingCare} onClick={onSaveCare}>
                {savingCare ? "Salvando…" : "Salvar resumo e status"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold">Nova anotação</Card.Header>
            <Card.Body>
              {noteType === "RISK_OR_SAFETY" ?
                <Alert variant="warning" className="py-2 small">
                  Use com responsabilidade. Em emergência, acione protocolos locais (SAMU, CVV, rede de apoio).
                </Alert>
              : null}
              <Row className="g-2">
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Título (opcional)</Form.Label>
                    <Form.Control value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Tipo</Form.Label>
                    <Form.Select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
                      {NOTE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-2">
                <Form.Label className="small text-muted">Vincular a consulta (opcional)</Form.Label>
                <Form.Select
                  value={noteAppointmentId}
                  onChange={(e) => setNoteAppointmentId(e.target.value)}
                >
                  <option value="">Nenhuma</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {formatDt(a.startsAt)} — {a.status} ({a.modality})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small text-muted">Conteúdo</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Anotação clínica objetiva…"
                />
              </Form.Group>
              <div className="mb-2">
                <span className="small text-muted d-block mb-1">Tags</span>
                <div className="d-flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Form.Check
                      key={t.id}
                      type="checkbox"
                      id={`tag-${t.id}`}
                      label={t.label}
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                      className="small"
                    />
                  ))}
                </div>
                <div className="d-flex gap-2 mt-2">
                  <Form.Control
                    size="sm"
                    placeholder="Nova tag"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    style={{ maxWidth: 200 }}
                  />
                  <Button size="sm" variant="outline-secondary" type="button" onClick={onCreateTag}>
                    Criar tag
                  </Button>
                </div>
              </div>
              <Button variant="success" size="sm" disabled={savingNote} onClick={onCreateNote}>
                {savingNote ? "Salvando…" : "Registrar anotação"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {pinned.length > 0 ?
        <div className="m-b30">
          <h2 className="h6 text-secondary fw-semibold m-b15">Fixadas</h2>
          <div className="d-flex flex-column gap-2">
            {pinned.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onTogglePin={() => togglePin(n.id, n.isPinned)}
                onDelete={() => removeNote(n.id)}
              />
            ))}
          </div>
        </div>
      : null}

      <h2 className="h6 text-secondary fw-semibold m-b15">Timeline</h2>
      <div className="d-flex flex-column gap-2">
        {timelineNotes.length === 0 && pinned.length === 0 ?
          <Alert variant="light" className="border">
            Nenhuma anotação ainda.
          </Alert>
        : null}
        {timelineNotes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            onTogglePin={() => togglePin(n.id, n.isPinned)}
            onDelete={() => removeNote(n.id)}
          />
        ))}
      </div>
      {nextCursor ?
        <div className="text-center mt-3">
          <Button variant="outline-primary" size="sm" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      : null}
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
}: {
  note: NoteRow;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="py-3">
        <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
          <div>
            <div className="small text-muted">{formatDt(note.createdAt)}</div>
            {note.title ?
              <div className="fw-semibold">{note.title}</div>
            : null}
            <Badge bg="light" text="dark" className="me-1 mt-1">
              {NOTE_TYPE_LABEL[note.noteType] ?? note.noteType}
            </Badge>
            {note.tags.map((t) => (
              <Badge key={t.id} bg="secondary" className="me-1 mt-1">
                {t.label}
              </Badge>
            ))}
          </div>
          <div className="d-flex gap-1 flex-shrink-0">
            <Button variant="outline-secondary" size="sm" onClick={onTogglePin}>
              {note.isPinned ? "Desafixar" : "Fixar"}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={onDelete}>
              Excluir
            </Button>
          </div>
        </div>
        <p className="mb-0 mt-2 small" style={{ whiteSpace: "pre-wrap" }}>
          {note.body}
        </p>
      </Card.Body>
    </Card>
  );
}
