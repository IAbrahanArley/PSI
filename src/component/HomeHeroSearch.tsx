"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PublicSearchFiltersWire = {
  specialties: { slug: string; name: string }[];
  cities: { key: string; label: string }[];
};

export default function HomeHeroSearch() {
  const router = useRouter();
  const [filters, setFilters] = useState<PublicSearchFiltersWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/public/search-filters");
        const data = (await res.json().catch(() => ({}))) as PublicSearchFiltersWire;
        if (!cancelled && res.ok && data?.specialties) setFilters(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (specialty.trim()) p.set("especialidade", specialty.trim());
    if (city.trim()) p.set("cidade", city.trim());
    const qs = p.toString();
    router.push(qs ? `/team?${qs}` : "/team");
  }

  return (
    <>
      <h1 className="title wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
        Agende agora <br />
        Sua consulta <span className="text-primary"> </span>{" "}
        <span className="d-inline-flex align-middle" aria-hidden>
          <svg width={120} height={8} viewBox="0 0 120 8" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 6 Q60 0 120 6" stroke="currentColor" fill="none" strokeWidth={2} className="text-primary" />
          </svg>
        </span>
      </h1>
      <p className="text wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
        Centenas de profissionais qualificados para atender você
      </p>
      <div className="wow fadeInUp" data-wow-delay="0.6s" data-wow-duration="0.8s">
        <form className="row g-2 align-items-end" onSubmit={onSubmit}>
          <div className="col-md-5">
            <label htmlFor="home-specialty" className="visually-hidden">
              Especialidade
            </label>
            <select
              id="home-specialty"
              className="form-select form-select-lg"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={loading}
            >
              <option value="">Escolha a especialidade</option>
              {(filters?.specialties ?? []).map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="home-city" className="visually-hidden">
              Cidade
            </label>
            <select
              id="home-city"
              className="form-select form-select-lg"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
            >
              <option value="">Escolha a cidade</option>
              {(filters?.cities ?? []).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-lg btn-primary w-100">
              Pesquisar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
