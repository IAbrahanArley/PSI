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

export function TeamDetailBookingSection({ slug }: { slug: string | undefined }) {
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string> | null>(null);
  const [monthError, setMonthError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Date | undefined>();
  const [slotsRes, setSlotsRes] = useState<DaySlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<PublicDaySlotItem | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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

  const onSubmit = async (e: React.FormEvent) => {
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
            </Alert>
          ) : null}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Nome completo *</Form.Label>
              <Form.Control
                required
                value={fullName}
                onChange={(ev) => setFullName(ev.target.value)}
                maxLength={200}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">E-mail *</Form.Label>
              <Form.Control
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                maxLength={320}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Telefone *</Form.Label>
              <Form.Control
                required
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
                minLength={8}
                maxLength={40}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-white">Mensagem (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                maxLength={2000}
              />
            </Form.Group>
            <div className="team-detail-form-actions d-flex flex-wrap align-items-center gap-2">
              <Button type="submit" variant="light" disabled={submitting}>
                {submitting ? "Enviando…" : "Agendar"}
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
        </div>
      ) : null}
    </div>
  );
}
