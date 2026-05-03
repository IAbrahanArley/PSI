"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import {
  usePsychologistSocialLinks,
  useSavePsychologistSocialLinks,
} from "@/hooks/psychologist/data";
import {
  PSYCHOLOGIST_SOCIAL_NETWORKS,
  SOCIAL_NETWORK_META,
  type PsychologistSocialNetwork,
} from "@/lib/psychologist-social-links";

type SocialLinkDraft = {
  network: PsychologistSocialNetwork;
  url: string;
};

function firstAvailableNetwork(links: SocialLinkDraft[]) {
  return (
    PSYCHOLOGIST_SOCIAL_NETWORKS.find((network) => !links.some((link) => link.network === network)) ?? "INSTAGRAM"
  );
}

export default function DashboardPsicologoRedesSociaisPage() {
  const [notFound, setNotFound] = useState(false);
  const [links, setLinks] = useState<SocialLinkDraft[]>([]);
  const { data, isLoading: loading } = usePsychologistSocialLinks();
  const saveSocialLinksMutation = useSavePsychologistSocialLinks();

  useEffect(() => {
    if (data === null) {
      setNotFound(true);
      return;
    }
    if (!data) return;

    setNotFound(false);
    setLinks(data.map((link) => ({ network: link.network, url: link.url })));
  }, [data]);

  const canAddMore = links.length < PSYCHOLOGIST_SOCIAL_NETWORKS.length;
  const usedNetworks = useMemo(() => new Set(links.map((link) => link.network)), [links]);

  function addLink() {
    setLinks((prev) => [...prev, { network: firstAvailableNetwork(prev), url: "" }]);
  }

  function updateLink(index: number, patch: Partial<SocialLinkDraft>) {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveSocialLinksMutation.mutateAsync({ links });
      toast.success("Redes sociais salvas com sucesso.");
    } catch {
      toast.error("Nao foi possivel salvar as redes sociais. Tente novamente.");
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
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="card border-0 shadow-sm m-b20">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <BootstrapSkeleton height="1rem" className="w-50 m-b10" />
                  <BootstrapSkeleton height="2.5rem" />
                </div>
                <div className="col-md-8">
                  <BootstrapSkeleton height="1rem" className="w-50 m-b10" />
                  <BootstrapSkeleton height="2.5rem" />
                </div>
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
    <form onSubmit={onSave}>
      <h1 className="title m-b20">Redes sociais</h1>
      <p className="text-muted m-b30">
        Cadastre os links oficiais para que pacientes encontrem seus canais publicos com facilidade.
      </p>

      <div className="d-flex justify-content-end m-b20">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={addLink}
          disabled={!canAddMore || saveSocialLinksMutation.isPending}
        >
          + Adicionar rede
        </button>
      </div>

      {links.length === 0 ? (
        <div className="card border-0 shadow-sm m-b30">
          <div className="card-body text-muted">Nenhuma rede social cadastrada ainda.</div>
        </div>
      ) : (
        links.map((link, idx) => {
          const availableOptions = PSYCHOLOGIST_SOCIAL_NETWORKS.filter(
            (network) => network === link.network || !usedNetworks.has(network),
          );
          const meta = SOCIAL_NETWORK_META[link.network];

          return (
            <div key={`${link.network}-${idx}`} className="card border-0 shadow-sm m-b20">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-semibold d-flex align-items-center gap-2">
                  <i className={meta.iconClassName} aria-hidden />
                  {meta.label}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={saveSocialLinksMutation.isPending}
                >
                  Remover
                </button>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Rede</label>
                    <select
                      className="form-select"
                      value={link.network}
                      onChange={(e) => updateLink(idx, { network: e.target.value as PsychologistSocialNetwork })}
                      disabled={saveSocialLinksMutation.isPending}
                    >
                      {availableOptions.map((network) => (
                        <option key={network} value={network}>
                          {SOCIAL_NETWORK_META[network].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Link</label>
                    <input
                      className="form-control"
                      value={link.url}
                      onChange={(e) => updateLink(idx, { url: e.target.value })}
                      placeholder={meta.placeholder}
                      inputMode="url"
                      disabled={saveSocialLinksMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <button type="submit" className="btn btn-primary" disabled={saveSocialLinksMutation.isPending}>
        {saveSocialLinksMutation.isPending ? "Salvando..." : "Salvar redes sociais"}
      </button>
    </form>
  );
}
