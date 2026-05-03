"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import { usePsychologistAddresses, useSavePsychologistAddresses } from "@/hooks/psychologist/data";

type AddressDraft = {
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  reference: string;
};

const emptyAddress = (): AddressDraft => ({
  label: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  complement: "",
  reference: "",
});

export default function DashboardPsicologoEnderecosPage() {
  const [notFound, setNotFound] = useState(false);
  const [addresses, setAddresses] = useState<AddressDraft[]>([]);
  const { data, isLoading: loading } = usePsychologistAddresses();
  const saveAddressesMutation = useSavePsychologistAddresses();

  useEffect(() => {
    if (data === null) {
      setNotFound(true);
      return;
    }
    if (!data) return;

    setNotFound(false);
    setAddresses(
      Array.isArray(data)
        ? data.map((a) => ({
            label: a.label ?? "",
            street: a.street ?? "",
            number: a.number ?? "",
            neighborhood: a.neighborhood ?? "",
            city: a.city ?? "",
            state: a.state ?? "",
            zipCode: a.zipCode ?? "",
            complement: a.complement ?? "",
            reference: a.reference ?? "",
          }))
        : [],
    );
  }, [data]);

  async function onSave() {
    try {
      await saveAddressesMutation.mutateAsync({ addresses });
      toast.success("Enderecos salvos com sucesso.");
    } catch {
      toast.error("Nao foi possivel salvar os enderecos. Tente novamente.");
    }
  }

  function LoadingSkeleton() {
    return (
      <div>
        <div className="m-b20"><BootstrapSkeleton height="2.25rem" className="w-50" /></div>
        <div className="m-b20"><BootstrapSkeleton height="1.25rem" className="w-75" /></div>

        <div className="d-flex justify-content-end m-b20">
          <BootstrapSkeleton height="2.25rem" className="w-25" />
        </div>

        {[0, 1].map((idx) => (
          <div key={idx} className="card border-0 shadow-sm m-b20">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <BootstrapSkeleton height="1.25rem" className="w-25" />
              <BootstrapSkeleton height="2rem" className="w-25" />
            </div>
            <div className="card-body">
              <div className="row g-3">
                {[0, 1, 2, 3, 4, 5].map((field) => (
                  <div key={field} className="col-md-4">
                    <BootstrapSkeleton height="1rem" className="w-75 m-b10" />
                    <BootstrapSkeleton height="2.5rem" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  if (notFound) {
    return <div className="alert alert-info">Nao encontramos um cadastro de psicologo vinculado a esta conta.</div>;
  }

  return (
    <div>
      <h1 className="title m-b20">Enderecos de atendimento</h1>
      <p className="text-muted m-b30">
        Cadastre os locais onde voce atende presencialmente. Esses dados ajudam o paciente a escolher o melhor ponto de atendimento.
      </p>

      <div className="d-flex justify-content-end m-b20">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setAddresses((prev) => [...prev, emptyAddress()])}
        >
          + Adicionar endereco
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="card border-0 shadow-sm m-b30">
          <div className="card-body text-muted">Nenhum endereco cadastrado ainda.</div>
        </div>
      ) : (
        addresses.map((addr, idx) => (
          <div key={idx} className="card border-0 shadow-sm m-b20">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Endereco #{idx + 1}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setAddresses((prev) => prev.filter((_, i) => i !== idx))}
              >
                Remover
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Nome do local</label>
                  <input
                    className="form-control"
                    value={addr.label}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], label: e.target.value };
                        return next;
                      })
                    }
                    placeholder="Ex.: Clinica Centro"
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Rua</label>
                  <input
                    className="form-control"
                    value={addr.street}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], street: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Numero</label>
                  <input
                    className="form-control"
                    value={addr.number}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], number: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Bairro</label>
                  <input
                    className="form-control"
                    value={addr.neighborhood}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], neighborhood: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Cidade</label>
                  <input
                    className="form-control"
                    value={addr.city}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], city: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">UF</label>
                  <input
                    className="form-control"
                    value={addr.state}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], state: e.target.value.toUpperCase() };
                        return next;
                      })
                    }
                    maxLength={2}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">CEP</label>
                  <input
                    className="form-control"
                    value={addr.zipCode}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], zipCode: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Complemento</label>
                  <input
                    className="form-control"
                    value={addr.complement}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], complement: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Referencia</label>
                  <input
                    className="form-control"
                    value={addr.reference}
                    onChange={(e) =>
                      setAddresses((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], reference: e.target.value };
                        return next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void onSave()}
        disabled={saveAddressesMutation.isPending}
      >
        {saveAddressesMutation.isPending ? "Salvando..." : "Salvar enderecos"}
      </button>
    </div>
  );
}
