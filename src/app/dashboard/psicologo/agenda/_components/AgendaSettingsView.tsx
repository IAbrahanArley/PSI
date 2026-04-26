"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCreateWeeklyRule,
  useDeleteWeeklyRule,
  useWeeklyAvailabilityRules,
} from "@/hooks/psychologist/agenda";
import { usePsychologistAddresses } from "@/hooks/psychologist/data";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { WEEKDAY_LABELS } from "./agenda-utils";
import { WeeklyScheduleForm } from "./weekly-form/WeeklyScheduleForm";
import type { WeeklyScheduleSubmitPayload } from "./weekly-form/types";

export function AgendaSettingsView() {
  const { data: rules = [], isLoading } = useWeeklyAvailabilityRules();
  const { data: addressesRaw } = usePsychologistAddresses();
  const addresses = addressesRaw ?? [];
  const createRule = useCreateWeeklyRule();
  const deleteRule = useDeleteWeeklyRule();

  const [isSavingForm, setIsSavingForm] = useState(false);

  const byDay = useMemo(() => {
    const m = new Map<number, typeof rules>();
    for (const r of rules) {
      const w = r.weekday;
      const arr = m.get(w) ?? [];
      arr.push(r);
      m.set(w, arr);
    }
    return m;
  }, [rules]);

  async function onSaveWeeklyDayConfig(payload: WeeklyScheduleSubmitPayload) {
    setIsSavingForm(true);
    try {
      await Promise.all(
        payload.blocks.map((block, index) =>
          createRule.mutateAsync({
            weekday: payload.weekday,
            startTime: block.startTime,
            endTime: block.endTime,
            ruleType: "AVAILABLE",
            modality: block.modality,
            addressId: block.modality === "PRESENTIAL" ? block.addressId : null,
            sortOrder: index,
            isActive: block.isActive,
          }),
        ),
      );
      toast.success("Configuração semanal salva.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setIsSavingForm(false);
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Remover este bloco?")) return;
    try {
      await deleteRule.mutateAsync({ id });
      toast.success("Removido.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  if (isLoading) {
    return <BootstrapSkeleton height="16rem" />;
  }

  return (
    <div className="d-flex flex-column gap-4">
      <section className="card">
        <div className="card-body">
          <WeeklyScheduleForm
            addresses={addresses}
            isSubmitting={isSavingForm || createRule.isPending}
            onSubmit={onSaveWeeklyDayConfig}
          />
          {addresses.length === 0 ? (
            <p className="small text-muted mt-3 mb-0">Cadastre ao menos um endereço para usar blocos presenciais.</p>
          ) : null}
        </div>
      </section>

      {[0, 1, 2, 3, 4, 5, 6].map((d) => {
        const list = byDay.get(d) ?? [];
        return (
          <section key={d} className="card">
            <div className="card-body py-3">
              <h4 className="h6 mb-2">{WEEKDAY_LABELS[d]}</h4>
              {list.length === 0 ? (
                <p className="small text-muted mb-0">Nenhum bloco.</p>
              ) : (
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {list.map((r) => (
                    <li
                      key={r.id}
                      className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded p-2 small"
                    >
                      <span>
                        <strong>{r.startTime}</strong> – <strong>{r.endTime}</strong>
                        {" · "}
                        {r.ruleType === "AVAILABLE" ? "Disponível" : "Indisponível"}
                        {" · "}
                        {r.modality === "ONLINE" ? "Online" : "Presencial"}
                        {r.addressId && addresses.find((x) => x.id === r.addressId)
                          ? ` · ${addresses.find((x) => x.id === r.addressId)?.label}`
                          : ""}
                      </span>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void onRemove(r.id)}>
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
