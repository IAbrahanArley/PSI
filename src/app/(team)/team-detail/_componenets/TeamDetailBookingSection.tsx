"use client";

import { useCallback, useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isBefore, startOfDay, startOfMonth } from "date-fns";
import "react-day-picker/style.css";
import "./team-detail-booking.css";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Table from "react-bootstrap/Table";
import Link from "next/link";

import { supabaseClient } from "@/lib/db/supabase/client";
import type { User } from "@supabase/supabase-js";

type PublicDaySlotItem = {
  startIso: string;
  endIso: string;
  available: boolean;
  modality: "ONLINE" | "PRESENTIAL";
  addressId: string | null;
  startLabel: string;
  endLabel: string;
  addressLabel: string | null;
  slotKey: string;
};

type DaySlotsResponse = {
  timeZone: string;
  slots: PublicDaySlotItem[];
};

function slotLocationLabel(s: PublicDaySlotItem): string {
  if (s.modality === "ONLINE") return "Online";
  return s.addressLabel?.trim() || "Presencial";
}

function SlotsTable({
  slots,
  selectedKey,
  onSelect,
}: {
  slots: PublicDaySlotItem[];
  selectedKey: string | null;
  onSelect: (s: PublicDaySlotItem) => void;
}) {
  return (
    <Table responsive borderless hover={false} className="team-detail-slots-table table-dark">
      <thead>
        <tr>
          <th>Horário</th>
          <th>Local</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((s) => {
          const timeRange = `${s.startLabel} – ${s.endLabel}`;
          const loc = slotLocationLabel(s);
          const selected = selectedKey === s.slotKey;
          if (!s.available) {
            return (
              <tr key={s.slotKey} className="team-detail-slot-unavailable" aria-disabled title="Indisponível">
                <td>{timeRange}</td>
                <td>{loc}</td>
              </tr>
            );
          }
          return (
            <tr
              key={s.slotKey}
              role="button"
              tabIndex={0}
              className={`team-detail-slot-selectable${selected ? " team-detail-slot-selected" : ""}`}
              onClick={() => onSelect(s)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelect(s);
                }
              }}
            >
              <td className="fw-semibold">{timeRange}</td>
              <td>{loc}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

// ─── Login wall ───────────────────────────────────────────────────────────────

function LoginWall({ slug }: { slug: string | undefined }) {
  const redirectUrl = slug
    ? `/login/paciente?redirect=${encodeURIComponent(`/team-detail?slug=${slug}`)}`
    : "/login/paciente";

  return (
    <div className="text-center py-3">
      <div className="mb-3">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-10 mb-3"
          style={{ width: 56, height: 56 }}
        >
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3M4.5 10.5h15v9.75A1.5 1.5 0 0118 21.75H6A1.5 1.5 0 014.5 20.25V10.5z" />
          </svg>
        </span>
        <p className="text-white mb-1 fw-semibold">Faça login para agendar</p>
        <p className="text-white opacity-75 small mb-0">
          Para reservar uma consulta, entre com sua conta de paciente.
        </p>
      </div>
      <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
        <Link href={redirectUrl} className="btn btn-light">
          Entrar como paciente
        </Link>
        <Link href="/cadastro/paciente" className="btn btn-outline-light">
          Criar conta
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamDetailBookingSection({ slug }: { slug: string | undefined }) {
  // ── auth state ──────────────────────────────────────────────────────────────
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setAuthUser(u);
      const role = u?.app_metadata?.role ?? u?.user_metadata?.role ?? null;
      setAuthRole(role);
      setAuthLoading(false);
    });
  }, []);

  // ── calendar state ───────────────────────────────────────────────────────────
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string> | null>(null);
  const [monthError, setMonthError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Date | undefined>();
  const [slotsRes, setSlotsRes] = useState<DaySlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<PublicDaySlotItem | null>(null);

  // ── form fields (public / guest flow) ────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const isPatient = authRole === "PATIENT";
  const isOtherRole = !authLoading && authUser !== null && !isPatient;

  // ── load month dates ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug?.trim()) return;
    const y = displayMonth.getFullYear();
    const m = displayMonth.getMonth() + 1;
    setDatesWithSlots(null);
    setMonthError(null);
    const ac = new AbortController();
    fetch(
      `/api/public/psychologists/${encodeURIComponent(slug)}/calendar-month?year=${y}&month=${m}`,
      { signal: ac.signal },
    )
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setMonthError(data.error ?? "Não foi possível carregar o mês.");
          setDatesWithSlots(new Set());
          return;
        }
        setDatesWithSlots(new Set(Array.isArray(data.dates) ? data.dates : []));
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setMonthError("Falha de rede ao carregar o calendário.");
          setDatesWithSlots(new Set());
        }
      });
    return () => ac.abort();
  }, [slug, displayMonth]);

  // ── load day slots ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug?.trim() || !selected) {
      setSlotsRes(null);
      setSlotsError(null);
      return;
    }
    const dateStr = format(selected, "yyyy-MM-dd");
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    setSubmitMsg(null);
    const ac = new AbortController();
    fetch(`/api/public/psychologists/${encodeURIComponent(slug)}/day-slots?date=${dateStr}`, {
      signal: ac.signal,
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setSlotsRes(null);
          setSlotsError(data.error ?? "Não foi possível carregar os horários.");
          return;
        }
        setSlotsRes({
          timeZone: data.timeZone ?? "",
          slots: Array.isArray(data.slots) ? data.slots : [],
        });
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setSlotsRes(null);
          setSlotsError("Falha de rede.");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setSlotsLoading(false);
      });
    return () => ac.abort();
  }, [slug, selected]);

  const disabledDays = useCallback(
    (d: Date) => {
      if (isBefore(startOfDay(d), startOfDay(new Date()))) return true;
      if (datesWithSlots === null) return true;
      const key = format(d, "yyyy-MM-dd");
      return !datesWithSlots.has(key);
    },
    [datesWithSlots],
  );

  // ── submit ────────────────────────────────────────────────────────────────────

  const onSubmitAuthenticated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug?.trim() || !selectedSlot) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const r = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          startsAtIso: selectedSlot.startIso,
          endsAtIso: selectedSlot.endIso,
          modality: selectedSlot.modality,
          addressId: selectedSlot.modality === "ONLINE" ? null : selectedSlot.addressId,
          message: message.trim() || null,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSubmitMsg({ type: "err", text: data.error ?? "Não foi possível agendar." });
        return;
      }
      setSubmitMsg({
        type: "ok",
        text: "Consulta agendada com sucesso! Você pode acompanhar em Minhas Consultas.",
      });
      setMessage("");
      setSelectedSlot(null);
      setSelected(undefined);
    } catch {
      setSubmitMsg({ type: "err", text: "Falha de rede ao enviar." });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitPublic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug?.trim() || !selectedSlot) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const r = await fetch(`/api/public/psychologists/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim() || undefined,
          startsAtIso: selectedSlot.startIso,
          endsAtIso: selectedSlot.endIso,
          modality: selectedSlot.modality,
          addressId: selectedSlot.modality === "ONLINE" ? null : selectedSlot.addressId,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSubmitMsg({ type: "err", text: data.error ?? "Não foi possível agendar." });
        return;
      }
      setSubmitMsg({
        type: "ok",
        text: "Agendamento registrado! O profissional poderá entrar em contato para confirmar.",
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setSelectedSlot(null);
      setSelected(undefined);
    } catch {
      setSubmitMsg({ type: "err", text: "Falha de rede ao enviar." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────────

  if (!slug?.trim()) {
    return (
      <p className="text-white mb-0">
        Abra o perfil a partir da lista de especialistas para escolher data e horário.
      </p>
    );
  }

  return (
    <div className="text-start">
      {monthError ? <Alert variant="warning">{monthError}</Alert> : null}

      {/* Calendar */}
      <div className="bg-white text-dark rounded p-3 mb-4">
        <div className="d-flex justify-content-center team-detail-rdp">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              setSelected(d);
              setSelectedSlot(null);
              setSubmitMsg(null);
            }}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            locale={ptBR}
            captionLayout="label"
            navLayout="around"
            disabled={disabledDays}
            showOutsideDays
            formatters={{
              formatCaption: (date) =>
                format(date, "LLLL yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()),
            }}
          />
        </div>
      </div>

      {/* Day slots */}
      {selected ? (
        <div className="mb-4">
          <h4 className="text-white font-18 m-b15">
            {format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h4>
          {slotsLoading ? (
            <div className="text-white d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              Carregando horários…
            </div>
          ) : slotsError ? (
            <Alert variant="light">{slotsError}</Alert>
          ) : slotsRes && slotsRes.slots.length === 0 ? (
            <p className="text-white opacity-75 mb-0">Nenhum horário neste dia.</p>
          ) : slotsRes ? (
            (() => {
              const list = slotsRes.slots;
              const mid = Math.ceil(list.length / 2);
              const left = list.slice(0, mid);
              const right = list.slice(mid);
              const sel = selectedSlot?.slotKey ?? null;
              const pick = (s: PublicDaySlotItem) => {
                setSelectedSlot(s);
                setSubmitMsg(null);
              };
              return (
                <div className="team-detail-slots-tables row g-3">
                  <div className="col-12 col-lg-6">
                    <SlotsTable slots={left} selectedKey={sel} onSelect={pick} />
                  </div>
                  <div className="col-12 col-lg-6">
                    {right.length > 0 ? (
                      <SlotsTable slots={right} selectedKey={sel} onSelect={pick} />
                    ) : null}
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      ) : null}

      {/* Booking form — only shows after slot selection */}
      {selectedSlot ? (
        <div className="border border-light border-opacity-25 rounded p-3 bg-black bg-opacity-10">
          <h5 className="text-white font-16 m-b15">Confirmar horário</h5>
          <p className="text-white opacity-75 small mb-3">
            {selectedSlot.startLabel} – {selectedSlot.endLabel}
            {selectedSlot.modality === "ONLINE"
              ? " · Online"
              : selectedSlot.addressLabel
                ? ` · ${selectedSlot.addressLabel}`
                : ""}
          </p>

          {submitMsg ? (
            <Alert variant={submitMsg.type === "ok" ? "success" : "danger"} className="mb-3">
              {submitMsg.text}
              {submitMsg.type === "ok" && isPatient ? (
                <div className="mt-2">
                  <Link href="/dashboard/paciente/consultas" className="alert-link">
                    Ver minhas consultas →
                  </Link>
                </div>
              ) : null}
            </Alert>
          ) : null}

          {/* Auth loading */}
          {authLoading ? (
            <div className="text-white d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              Verificando sessão…
            </div>
          ) : isOtherRole ? (
            /* Logged in as non-patient */
            <Alert variant="warning">
              Você está logado como <strong>{authRole}</strong>. Para agendar, faça login como
              paciente.
            </Alert>
          ) : !authUser ? (
            /* Not logged in */
            <LoginWall slug={slug} />
          ) : (
            /* Authenticated patient */
            <Form onSubmit={onSubmitAuthenticated}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Mensagem para o profissional (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Ex.: prefiro sessão no período da tarde, tenho mobilidade reduzida…"
                  value={message}
                  onChange={(ev) => setMessage(ev.target.value)}
                  maxLength={2000}
                />
              </Form.Group>
              <div className="team-detail-form-actions d-flex flex-wrap align-items-center gap-2">
                <Button type="submit" variant="light" disabled={submitting}>
                  {submitting ? "Agendando…" : "Confirmar agendamento"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-white text-decoration-none"
                  onClick={() => setSelectedSlot(null)}
                >
                  Voltar aos horários
                </Button>
              </div>
            </Form>
          )}
        </div>
      ) : null}
    </div>
  );
}
