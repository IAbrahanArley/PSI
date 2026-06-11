"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CityAutocomplete, type CityOption } from "./CityAutocomplete";

type SpecialtyOption = { slug: string; name: string };

export default function HomeHeroSearch() {
  const router = useRouter();
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("");
  const [cityKey, setCityKey] = useState("");
  const [cityOption, setCityOption] = useState<CityOption | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/public/search-filters");
        const data = (await res.json().catch(() => ({}))) as {
          specialties?: SpecialtyOption[];
        };
        if (!cancelled && res.ok && Array.isArray(data?.specialties)) {
          setSpecialties(data.specialties);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  function onCitySelect(opt: CityOption | null) {
    setCityOption(opt);
    setCityKey(opt?.key ?? "");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (specialty.trim()) p.set("especialidade", specialty.trim());
    if (cityKey.trim()) p.set("cidade", cityKey.trim());
    const qs = p.toString();
    router.push(qs ? `/team?${qs}` : "/team");
  }

  return (
    <>
      <h1 className="title wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
        Agende agora <br />
        Sua consulta{" "}
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
          {/* Specialty */}
          <div className="col-md-5">
            <label htmlFor="home-specialty" className="visually-hidden">Especialidade</label>
            <select
              id="home-specialty"
              className="form-select form-select-lg"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={loading}
            >
              <option value="">Escolha a especialidade</option>
              {specialties.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* City autocomplete */}
          <div className="col-md-4">
            <label htmlFor="home-city" className="visually-hidden">Cidade</label>
            <CityAutocomplete
              id="home-city"
              value={cityKey}
              onSelect={onCitySelect}
              placeholder="Cidade (opcional)"
              size="lg"
              specialtyFilter={specialty || null}
              showBadge={true}
            />
          </div>

          <div className="col-md-3">
            <button type="submit" className="btn btn-lg btn-primary w-100">
              Pesquisar
            </button>
          </div>
        </form>

        {/* Hint when city has no professionals */}
        {cityOption && !cityOption.hasPsychologist && (
          <p className="small text-warning-emphasis mt-2 mb-0">
            Ainda não há profissionais cadastrados em{" "}
            <strong>{cityOption.city}</strong>. Experimente buscar por atendimento online.
          </p>
        )}
      </div>
    </>
  );
}
