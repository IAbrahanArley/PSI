"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { defaultWeeklyBlock, weeklyScheduleFormSchema } from "./schema";
import type { WeeklyScheduleSubmitPayload } from "./types";
import { WeeklyBlockFields } from "./WeeklyBlockFields";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
] as const;

type AddressOption = {
  id: string;
  label: string;
};

type WeeklyScheduleFormProps = {
  addresses: AddressOption[];
  onSubmit: (payload: WeeklyScheduleSubmitPayload) => Promise<void> | void;
  isSubmitting?: boolean;
};

export function WeeklyScheduleForm({
  addresses,
  onSubmit,
  isSubmitting = false,
}: WeeklyScheduleFormProps) {
  const form = useForm({
    resolver: zodResolver(weeklyScheduleFormSchema),
    defaultValues: {
      weekday: 1,
      blocks: [defaultWeeklyBlock],
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "blocks",
  });

  const watchedBlocks = form.watch("blocks");
  const rootError =
    typeof form.formState.errors.blocks?.message === "string"
      ? form.formState.errors.blocks.message
      : null;

  const canSubmit = useMemo(() => !isSubmitting && !form.formState.isSubmitting, [isSubmitting, form.formState.isSubmitting]);

  return (
    <form
      className="d-flex flex-column gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <header>
        <h3 className="h5">Configuração semanal</h3>
        <p className="small text-muted mb-0">
          Selecione o dia, ajuste blocos de atendimento e depois salve via server action.
        </p>
      </header>

      <div className="col-lg-6">
        <label className="form-label small">Dia da semana</label>
        <select className="form-select" {...form.register("weekday", { valueAsNumber: true })}>
          {WEEKDAY_OPTIONS.map((weekday) => (
            <option key={weekday.value} value={weekday.value}>
              {weekday.label}
            </option>
          ))}
        </select>
      </div>

      <div className="d-flex flex-column gap-3">
        {fields.map((field, index) => (
          <WeeklyBlockFields
            key={field.id}
            index={index}
            register={form.register}
            errors={form.formState.errors}
            modality={watchedBlocks?.[index]?.modality ?? "ONLINE"}
            addresses={addresses}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {rootError ? <p className="small text-danger mb-0">{rootError}</p> : null}

      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => append(defaultWeeklyBlock)}
          disabled={!canSubmit}
        >
          Adicionar bloco
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Salvar configuração semanal
        </button>
      </div>
    </form>
  );
}
