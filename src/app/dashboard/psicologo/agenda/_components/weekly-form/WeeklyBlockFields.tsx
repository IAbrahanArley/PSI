"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { WeeklyScheduleFormSchema } from "./schema";

type AddressOption = {
  id: string;
  label: string;
};

type WeeklyBlockFieldsProps = {
  index: number;
  register: UseFormRegister<WeeklyScheduleFormSchema>;
  errors: FieldErrors<WeeklyScheduleFormSchema>;
  modality: WeeklyScheduleFormSchema["blocks"][number]["modality"];
  addresses: AddressOption[];
  onRemove: () => void;
  canRemove: boolean;
};

function getErrorMessage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "message" in value) {
    const msg = (value as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
  }
  return null;
}

export function WeeklyBlockFields({
  index,
  register,
  errors,
  modality,
  addresses,
  onRemove,
  canRemove,
}: WeeklyBlockFieldsProps) {
  const blockErrors = errors.blocks?.[index];

  return (
    <article className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <h4 className="h6 mb-0">Bloco {index + 1}</h4>
          {canRemove ? (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRemove}>
              Remover
            </button>
          ) : null}
        </div>

        <div className="row g-3">
          <div className="col-md-6 col-lg-4">
            <label className="form-label small">Hora inicial</label>
            <input type="time" className="form-control form-control-sm" {...register(`blocks.${index}.startTime`)} />
            {getErrorMessage(blockErrors?.startTime) ? (
              <div className="invalid-feedback d-block small text-danger">{getErrorMessage(blockErrors?.startTime)}</div>
            ) : null}
          </div>

          <div className="col-md-6 col-lg-4">
            <label className="form-label small">Hora final</label>
            <input type="time" className="form-control form-control-sm" {...register(`blocks.${index}.endTime`)} />
            {getErrorMessage(blockErrors?.endTime) ? (
              <div className="invalid-feedback d-block small text-danger">{getErrorMessage(blockErrors?.endTime)}</div>
            ) : null}
          </div>

          <div className="col-md-6 col-lg-4">
            <label className="form-label small">Modalidade</label>
            <select className="form-select form-select-sm" {...register(`blocks.${index}.modality`)}>
              <option value="ONLINE">ONLINE</option>
              <option value="PRESENTIAL">PRESENTIAL</option>
            </select>
          </div>

          {modality === "PRESENTIAL" ? (
            <div className="col-12">
              <label className="form-label small">Endereço</label>
              <select className="form-select form-select-sm" {...register(`blocks.${index}.addressId`)}>
                <option value="">Selecione um endereço</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}
                  </option>
                ))}
              </select>
              {getErrorMessage(blockErrors?.addressId) ? (
                <div className="invalid-feedback d-block small text-danger">{getErrorMessage(blockErrors?.addressId)}</div>
              ) : null}
            </div>
          ) : null}

          <div className="col-md-6 col-lg-4">
            <label className="form-label small">Duração da sessão (min)</label>
            <input
              type="number"
              min={15}
              step={5}
              className="form-control form-control-sm"
              {...register(`blocks.${index}.sessionDurationMinutes`, { valueAsNumber: true })}
            />
            {getErrorMessage(blockErrors?.sessionDurationMinutes) ? (
              <div className="invalid-feedback d-block small text-danger">
                {getErrorMessage(blockErrors?.sessionDurationMinutes)}
              </div>
            ) : null}
          </div>

          <div className="col-md-6 col-lg-4">
            <label className="form-label small">Buffer entre sessões (min)</label>
            <input
              type="number"
              min={0}
              step={5}
              className="form-control form-control-sm"
              {...register(`blocks.${index}.bufferBetweenSessionsMinutes`, { valueAsNumber: true })}
            />
            {getErrorMessage(blockErrors?.bufferBetweenSessionsMinutes) ? (
              <div className="invalid-feedback d-block small text-danger">
                {getErrorMessage(blockErrors?.bufferBetweenSessionsMinutes)}
              </div>
            ) : null}
          </div>

          <div className="col-12 col-lg-4 d-flex align-items-end">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" {...register(`blocks.${index}.isActive`)} id={`block-active-${index}`} />
              <label className="form-check-label small" htmlFor={`block-active-${index}`}>
                Bloco ativo
              </label>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
