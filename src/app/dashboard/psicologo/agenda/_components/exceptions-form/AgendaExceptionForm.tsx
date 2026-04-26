"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { agendaExceptionFormSchema, defaultAgendaExceptionFormValues } from "./schema";
import type { AgendaExceptionSubmitPayload } from "./types";

type AddressOption = {
  id: string;
  label: string;
};

type AgendaExceptionFormProps = {
  addresses: AddressOption[];
  onSubmit: (payload: AgendaExceptionSubmitPayload) => Promise<void> | void;
  isSubmitting?: boolean;
};

function getErrorMessage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "message" in value) {
    const maybe = (value as { message?: unknown }).message;
    return typeof maybe === "string" ? maybe : null;
  }
  return null;
}

export function AgendaExceptionForm({
  addresses,
  onSubmit,
  isSubmitting = false,
}: AgendaExceptionFormProps) {
  const form = useForm({
    resolver: zodResolver(agendaExceptionFormSchema),
    defaultValues: defaultAgendaExceptionFormValues,
  });

  const kind = form.watch("kind");
  const modality = form.watch("modality");
  const isInterval = kind !== "INACTIVE_DAY";

  const errors = form.formState.errors;

  return (
    <form
      className="d-flex flex-column gap-3"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        form.reset({
          ...defaultAgendaExceptionFormValues,
          exceptionDate: values.exceptionDate,
        });
      })}
    >
      <header>
        <h3 className="h5">Nova exceção</h3>
        <p className="small text-muted mb-0">Configure indisponibilidades e disponibilidades pontuais por data.</p>
      </header>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Data</label>
          <input type="date" className="form-control form-control-sm" {...form.register("exceptionDate")} />
          {getErrorMessage(errors.exceptionDate) ? (
            <div className="small text-danger mt-1">{getErrorMessage(errors.exceptionDate)}</div>
          ) : null}
        </div>

        <div className="col-md-6">
          <label className="form-label small">Tipo da exceção</label>
          <select className="form-select form-select-sm" {...form.register("kind")}>
            <option value="INACTIVE_DAY">Indisponível o dia todo</option>
            <option value="INACTIVE_INTERVAL">Indisponível em intervalo</option>
            <option value="ACTIVE_OVERRIDE_INTERVAL">Disponibilidade customizada</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label small">Modalidade</label>
          <select
            className="form-select form-select-sm"
            {...form.register("modality", {
              onChange: (event) => {
                if (event.target.value === "ONLINE") {
                  form.setValue("addressId", null, { shouldValidate: true });
                }
              },
            })}
          >
            <option value="ONLINE">ONLINE</option>
            <option value="PRESENTIAL">PRESENCIAL</option>
          </select>
        </div>

        {modality === "PRESENTIAL" ? (
          <div className="col-md-6">
            <label className="form-label small">Endereço</label>
            <select
              className="form-select form-select-sm"
              {...form.register("addressId", {
                setValueAs: (value) => (value ? value : null),
              })}
            >
              <option value="">Selecione um endereço</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label}
                </option>
              ))}
            </select>
            {getErrorMessage(errors.addressId) ? (
              <div className="small text-danger mt-1">{getErrorMessage(errors.addressId)}</div>
            ) : null}
          </div>
        ) : null}

        {isInterval ? (
          <>
            <div className="col-md-6">
              <label className="form-label small">Hora inicial</label>
              <input
                type="time"
                className="form-control form-control-sm"
                {...form.register("startTime", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              {getErrorMessage(errors.startTime) ? (
                <div className="small text-danger mt-1">{getErrorMessage(errors.startTime)}</div>
              ) : null}
            </div>

            <div className="col-md-6">
              <label className="form-label small">Hora final</label>
              <input
                type="time"
                className="form-control form-control-sm"
                {...form.register("endTime", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              {getErrorMessage(errors.endTime) ? (
                <div className="small text-danger mt-1">{getErrorMessage(errors.endTime)}</div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <div>
        <label className="form-label small">Observação (opcional)</label>
        <textarea
          rows={3}
          className="form-control form-control-sm"
          placeholder="Ex.: congresso, ajuste de horário, encaixes especiais"
          {...form.register("note")}
        />
      </div>

      <div className="form-check">
        <input type="checkbox" className="form-check-input" id="exception-active" {...form.register("isActive")} />
        <label className="form-check-label small" htmlFor="exception-active">
          Exceção ativa
        </label>
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || form.formState.isSubmitting}>
          Salvar exceção
        </button>
      </div>
    </form>
  );
}
