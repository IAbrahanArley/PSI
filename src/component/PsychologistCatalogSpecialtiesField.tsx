"use client";

import { useEffect, useMemo, useState } from "react";

export type CatalogOption = { id: string; name: string };

export default function PsychologistCatalogSpecialtiesField({
  label = "Especialidades do catálogo",
  helper = "Escolha uma ou mais. As opções são cadastradas pelo administrador.",
  value,
  onChange,
  disabled,
}: {
  label?: string;
  helper?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<CatalogOption[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/public/catalog-specialties", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { items?: Array<{ id: string; name: string }> };
        if (!res.ok) throw new Error("Falha ao carregar especialidades.");
        const items = Array.isArray(data.items) ? data.items : [];
        if (!cancelled) {
          setOptions(items.map((i) => ({ id: String(i.id), name: String(i.name) })));
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar as especialidades agora.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => o.name.toLowerCase().includes(qq));
  }, [options, q]);

  function toggle(id: string) {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  }

  return (
    <div>
      <label className="form-label">{label}</label>
      {helper ? (
        <p className="small text-muted m-b10">{helper}</p>
      ) : null}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Filtrar por nome…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled || loading || !!error}
      />
      {loading ? <p className="small text-muted mb-0">Carregando catálogo…</p> : null}
      {error ? (
        <p className="small text-danger mb-0">{error}</p>
      ) : (
        <>
          {!loading && options.length === 0 ? (
            <p className="small text-warning mb-0">
              O catálogo ainda está vazio. Solicite ao administrador que cadastre especialidades.
            </p>
          ) : null}
          <div className="row g-2">
            {filtered.map((opt) => {
              const checked = value.includes(opt.id);
              return (
                <div key={opt.id} className="col-md-6">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(opt.id)}
                    className={`btn btn-sm w-100 text-start ${checked ? "btn-primary" : "btn-outline-secondary"}`}
                  >
                    {checked ? (
                      <i className="fa fa-check-circle me-2" aria-hidden />
                    ) : (
                      <span className="me-4" aria-hidden />
                    )}
                    <span>{opt.name}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
