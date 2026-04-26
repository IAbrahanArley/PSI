"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PSYCHOLOGY_SPECIALTIES } from "@/constant/psychologySpecialties";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  invalid?: boolean;
};

export default function SpecialtyCombobox({
  id = "specialty",
  name = "specialty",
  value,
  onChange,
  required,
  className = "",
  invalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...PSYCHOLOGY_SPECIALTIES];
    return PSYCHOLOGY_SPECIALTIES.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={`position-relative ${className}`}>
      <label htmlFor={id} className="form-label">
        Especialidade
      </label>
      <div className="input-group">
        <span className="input-group-text bg-white">
          <i className="feather icon-search" aria-hidden />
        </span>
        <input
          id={id}
          name={name}
          type="text"
          className={`form-control ${invalid ? "is-invalid" : ""}`}
          autoComplete="off"
          placeholder="Digite para buscar..."
          value={query}
          required={required}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChange("");
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          className="list-group position-absolute w-100 shadow-sm mt-1"
          style={{ zIndex: 20, maxHeight: 220, overflowY: "auto" }}
          role="listbox"
        >
          {filtered.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="list-group-item list-group-item-action py-2 text-start border-0 rounded-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(item);
                  setQuery(item);
                  setOpen(false);
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query.trim() && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow-sm mt-1 p-2 small text-muted"
          style={{ zIndex: 20 }}
        >
          Nenhuma especialidade encontrada.
        </div>
      )}
    </div>
  );
}
