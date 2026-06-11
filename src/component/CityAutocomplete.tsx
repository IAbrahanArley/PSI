"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CityOption = {
  key: string;           // lower-trim city name — used as URL param
  label: string;         // "São Paulo — SP"
  city: string;          // "São Paulo"
  state: string;         // "SP"
  hasPsychologist: boolean;
};

type IbgeCity = { key: string; nome: string; state: string };

// ─── Module-level IBGE cache (persists during the browser session) ────────────

let ibgeCache: IbgeCity[] | null = null;
let ibgePending: Promise<IbgeCity[]> | null = null;

async function loadIbgeCities(): Promise<IbgeCity[]> {
  if (ibgeCache) return ibgeCache;
  if (ibgePending) return ibgePending;

  ibgePending = (async () => {
    try {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
        { cache: "force-cache" },
      );
      if (!res.ok) throw new Error(`IBGE ${res.status}`);

      type IbgeRaw = {
        id: number;
        nome: string;
        microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } } | null;
        "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } } | null;
      };

      const raw: IbgeRaw[] = await res.json();

      ibgeCache = raw
        .map((m) => {
          // Some municipalities have null microrregiao (e.g. Boa Esperança do Norte/MT)
          // Fall back to regiao-imediata path
          const sigla =
            m.microrregiao?.mesorregiao?.UF?.sigla ??
            m["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ??
            "";
          return {
            key: m.nome.toLowerCase().trim(),
            nome: m.nome,
            state: sigla,
          };
        })
        .filter((m) => m.nome);

      return ibgeCache;
    } catch (e) {
      console.warn("[CityAutocomplete] IBGE fetch failed:", e);
      ibgePending = null; // allow retry
      return [];
    }
  })();

  return ibgePending;
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  /** Current selected key (lower-trim city name) */
  value: string;
  /** Called when user selects a city or clears the field */
  onSelect: (option: CityOption | null) => void;
  placeholder?: string;
  /** Bootstrap input size: "sm" | "lg" | "" */
  size?: "sm" | "lg" | "";
  /** Only show DB cities for this specialty slug */
  specialtyFilter?: string | null;
  /** Show "professionals" badge on DB cities */
  showBadge?: boolean;
  disabled?: boolean;
  id?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CityAutocomplete({
  value,
  onSelect,
  placeholder = "Digite a cidade…",
  size = "",
  specialtyFilter,
  showBadge = true,
  disabled = false,
  id,
}: Props) {
  const [inputVal, setInputVal]     = useState("");
  const [options, setOptions]       = useState<CityOption[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [dbCities, setDbCities]     = useState<Set<string>>(new Set());

  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(inputVal, 250);

  // ── Load DB cities once (or when specialty changes) ──────────────────────
  const loadDbCities = useCallback(async () => {
    try {
      const url = new URL("/api/public/cities/search", window.location.origin);
      if (specialtyFilter) url.searchParams.set("especialidade", specialtyFilter);
      const res = await fetch(url.toString());
      const data = (await res.json().catch(() => ({ cities: [] }))) as {
        cities: Array<{ key: string; city: string; state: string }>;
      };
      setDbCities(new Set((data.cities ?? []).map((c) => c.key)));
    } catch {
      /* ignore */
    }
  }, [specialtyFilter]);

  useEffect(() => { void loadDbCities(); }, [loadDbCities]);

  // ── Sync display label when controlled value changes externally ───────────
  useEffect(() => {
    if (!value) { setInputVal(""); return; }
    const opt = options.find((o) => o.key === value);
    if (opt) setInputVal(opt.label);
    // If options don't have it yet (e.g. initial load), reconstruct from key
    // e.g. value = "são paulo" → display as "são paulo" until IBGE loads
    else if (!inputVal) setInputVal(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ── Build options from IBGE + dbCities ───────────────────────────────────
  const buildOptions = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        if (!q || q.trim().length < 2) {
          // No query: show only DB cities
          const ibge = ibgeCache ?? await loadIbgeCities();
          const dbArr = [...dbCities]
            .map((key) => {
              const m = ibge.find((c) => c.key === key);
              return m
                ? { key, label: `${m.nome} — ${m.state}`, city: m.nome, state: m.state, hasPsychologist: true }
                : { key, label: key, city: key, state: "", hasPsychologist: true };
            })
            .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));
          setOptions(dbArr);
          return;
        }

        // With query: search IBGE + mark DB cities
        const ibge = await loadIbgeCities();
        const norm = q.trim().toLowerCase();

        // Remove accents for accent-insensitive matching
        const removeAccents = (s: string) =>
          s.normalize("NFD").replace(/[̀-ͯ]/g, "");
        const normNoAccent = removeAccents(norm);

        const scored = ibge
          .filter((m) => {
            const keyNA  = removeAccents(m.key);
            return keyNA.startsWith(normNoAccent) || keyNA.includes(normNoAccent);
          })
          .map((m) => ({
            m,
            score: removeAccents(m.key).startsWith(normNoAccent) ? 0 : 1,
          }))
          .sort((a, b) => a.score - b.score || a.m.nome.localeCompare(b.m.nome, "pt-BR"))
          .slice(0, 10);

        setOptions(
          scored.map(({ m }) => ({
            key: m.key,
            label: `${m.nome} — ${m.state}`,
            city: m.nome,
            state: m.state,
            hasPsychologist: dbCities.has(m.key),
          })),
        );
        setActiveIdx(-1);
      } finally {
        setLoading(false);
      }
    },
    [dbCities],
  );

  // ── Trigger search on debounced input ────────────────────────────────────
  useEffect(() => {
    if (open) void buildOptions(debouncedInput);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, dbCities]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleFocus() {
    setOpen(true);
    void buildOptions(inputVal);
    // Pre-load IBGE in background so it's ready when user types
    void loadIbgeCities();
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputVal(v);
    setOpen(true);
    if (!v.trim()) onSelect(null);
  }

  function handleSelect(opt: CityOption) {
    setInputVal(opt.label);
    setOpen(false);
    setActiveIdx(-1);
    onSelect(opt);
  }

  function handleClear() {
    setInputVal("");
    setOpen(false);
    onSelect(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); void buildOptions(inputVal); }
      return;
    }
    if (e.key === "ArrowDown")  { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); if (activeIdx >= 0 && options[activeIdx]) handleSelect(options[activeIdx]); }
    else if (e.key === "Escape")    { setOpen(false); setActiveIdx(-1); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const sizeClass = size ? `form-control-${size}` : "";
  const noQuery = !inputVal.trim() || inputVal.trim().length < 2;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Input */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          className={`form-control ${sizeClass}`}
          value={inputVal}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInput}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {inputVal && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute", right: 10, top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", padding: 0, lineHeight: 1,
              cursor: "pointer", color: "#6c757d", fontSize: "1.1rem",
            }}
            aria-label="Limpar cidade"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          className="dropdown-menu show w-100 py-1 shadow"
          style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 280, overflowY: "auto", zIndex: 1070 }}
          role="listbox"
        >
          {loading ? (
            <li className="dropdown-item-text text-muted small py-2 px-3">
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Buscando…
            </li>
          ) : options.length === 0 ? (
            <li className="dropdown-item-text text-muted small py-2 px-3">
              {inputVal.trim().length >= 2
                ? "Nenhuma cidade encontrada."
                : "Nenhuma cidade cadastrada ainda."}
            </li>
          ) : (
            <>
              {noQuery && options.length > 0 && (
                <li className="px-3 pt-2 pb-1">
                  <span className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Cidades com profissionais
                  </span>
                </li>
              )}

              {options.map((opt, i) => (
                <li key={opt.key}>
                  <button
                    type="button"
                    className={`dropdown-item d-flex align-items-center gap-2 ${i === activeIdx ? "active" : ""}`}
                    role="option"
                    aria-selected={opt.key === value}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt)}
                    style={{ fontSize: "0.88rem", cursor: "pointer" }}
                  >
                    <span className="flex-grow-1 text-truncate">{opt.label}</span>
                    {showBadge && opt.hasPsychologist && (
                      <span
                        className="badge bg-success-subtle text-success rounded-pill flex-shrink-0"
                        style={{ fontSize: "0.62rem" }}
                      >
                        profissionais
                      </span>
                    )}
                  </button>
                </li>
              ))}

              {!noQuery && (
                <>
                  <li><hr className="dropdown-divider my-1" /></li>
                  <li>
                    <span className="dropdown-item-text text-muted" style={{ fontSize: "0.7rem" }}>
                      Municípios: IBGE
                    </span>
                  </li>
                </>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
