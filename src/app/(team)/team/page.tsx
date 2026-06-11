"use client";

import type { TeamFeaturedPsychologist } from "@/actions/psychologists/types";
import { TeamFeaturedPsychologistSection } from "@/component/TeamFeaturedPsychologistSection";
import { TeamPsychologistCard } from "@/component/TeamPsychologistCard";
import PageBanner from "@/component/PageBanner";
import { CityAutocomplete, type CityOption } from "@/component/CityAutocomplete";
import { IMAGES } from "@/constant/theme";
import {
  usePublicCatalogSpecialtyOptions,
  usePublicSearchFilters,
  useTeamAdvertisingPool,
  useTeamRegularInfinite,
} from "@/hooks/psychologists/queries";
import Header from "@/layout/Header";
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ROW_SIZE = 4;

/** Quantos destaques aparecem antes de cada fileira de psicólogos regulares. */
const FEATURED_PER_ROW = 2;

function parseListingParam(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const v = raw.trim();
  if (v.toLowerCase() === "todos") return null;
  return v;
}

/**
 * Seleciona até `FEATURED_PER_ROW` psicólogos distintos do pool para um dado pageIndex.
 * O resultado é cacheado por pageIndex para não mudar ao rolar a página.
 * Quando o pool é resetado (filtro muda), o cache é limpo externamente.
 */
function pickFeaturedPair(
  pool: TeamFeaturedPsychologist[],
  pageIndex: number,
  cache: React.MutableRefObject<Map<number, string[]>>,
): TeamFeaturedPsychologist[] {
  if (!pool.length) return [];

  // Valida o cache contra o pool atual (pode ter mudado com filtros)
  let ids = cache.current.get(pageIndex);
  if (ids) {
    ids = ids.filter((id) => pool.some((p) => p.id === id));
    if (ids.length === 0) {
      cache.current.delete(pageIndex);
      ids = undefined;
    }
  }

  if (!ids) {
    // Embaralha o pool e pega os primeiros FEATURED_PER_ROW distintos
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    ids = shuffled.slice(0, FEATURED_PER_ROW).map((p) => p.id);
    cache.current.set(pageIndex, ids);
  }

  return ids.map((id) => pool.find((p) => p.id === id)!).filter(Boolean);
}

function TeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string | null>(null);
  const featuredPickCache = useRef<Map<number, string[]>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const specialtyFilter = useMemo(
    () => parseListingParam(searchParams.get("especialidade")),
    [searchParams],
  );
  const cityFilter = useMemo(() => parseListingParam(searchParams.get("cidade")), [searchParams]);

  const selectSpecialtyValue = specialtyFilter ?? "todos";

  useEffect(() => {
    featuredPickCache.current = new Map();
  }, [specialtyFilter, cityFilter]);

  // City autocomplete: keep an option object to display the label
  const [cityOptionObj, setCityOptionObj] = useState<CityOption | null>(null);

  function handleCitySelect(opt: CityOption | null) {
    setCityOptionObj(opt);
    syncQuery(specialtyFilter, opt?.key ?? null);
  }

  const { data: specialtyOptions = [], isLoading: specialtiesLoading } = usePublicCatalogSpecialtyOptions();
  const { data: searchFilters } = usePublicSearchFilters();
  const regular = useTeamRegularInfinite(specialtyFilter, cityFilter, ROW_SIZE);
  const advertising = useTeamAdvertisingPool(specialtyFilter, cityFilter);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && regular.hasNextPage && !regular.isFetchingNextPage) {
          void regular.fetchNextPage();
        }
      },
      { rootMargin: "280px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [regular.hasNextPage, regular.isFetchingNextPage, regular.fetchNextPage]);

  function syncQuery(nextEspecialidade: string | null, nextCidadeKey: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (!nextEspecialidade) next.delete("especialidade");
    else next.set("especialidade", nextEspecialidade);
    if (!nextCidadeKey) next.delete("cidade");
    else next.set("cidade", nextCidadeKey);
    const qs = next.toString();
    router.push(qs ? `/team?${qs}` : "/team");
  }

  function onSpecialtyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    syncQuery(v === "todos" ? null : v, cityFilter);
  }

  const specialtyDisplayName =
    specialtyOptions.find((s) => s.slug === specialtyFilter)?.name ??
    searchFilters?.specialties?.find((s) => s.slug === specialtyFilter)?.name ??
    specialtyFilter;
  const cityDisplayLabel =
    cityOptionObj?.label ??
    searchFilters?.cities?.find((c) => c.key === cityFilter)?.label ??
    cityFilter ??
    "";

  const bannerPieces: string[] = [];
  bannerPieces.push("Especialistas");
  if (specialtyDisplayName) bannerPieces.push(specialtyDisplayName);
  if (cityDisplayLabel) bannerPieces.push(cityDisplayLabel);
  const bannerTitle = bannerPieces.join(" — ");

  const pages = regular.data?.pages ?? [];
  const pool = advertising.data ?? [];
  const poolReady = !advertising.isLoading;
  const hasAnyRegular = pages.some((p) => p.items.length > 0);
  const initialLoading = regular.isLoading && pages.length === 0;
  const labelsLoading = specialtiesLoading || !searchFilters;

  const pageKeyPrefix = `${specialtyFilter ?? "all"}-${cityFilter ?? "all"}`;

  return (
    <>
      <Header />
      <main className="page-content">
        <PageBanner title={bannerTitle} bnrimage={IMAGES.Banner01.src} />
        <section className="content-inner">
          <div className="container">
            <div className="row g-3 m-b30 align-items-end">
              <div className="col-md-4 mt-3 mt-md-0">
                <label htmlFor="team-especialidade" className="form-label small mb-1">
                  Especialidade
                </label>
                <select
                  id="team-especialidade"
                  className="form-select form-select-sm"
                  value={selectSpecialtyValue}
                  onChange={onSpecialtyChange}
                  disabled={labelsLoading}
                >
                  <option value="todos">Todas as especialidades</option>
                  {specialtyOptions.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mt-3 mt-md-0">
                <label htmlFor="team-cidade" className="form-label small mb-1">
                  Cidade
                </label>
                <CityAutocomplete
                  id="team-cidade"
                  value={cityFilter ?? ""}
                  onSelect={handleCitySelect}
                  placeholder="Todas as cidades"
                  size="sm"
                  specialtyFilter={specialtyFilter}
                  showBadge={true}
                  disabled={labelsLoading}
                />
              </div>
            </div>

            {regular.isError ? (
              <div className="alert alert-danger" role="alert">
                Não foi possível carregar a lista de especialistas agora.
              </div>
            ) : null}

            {advertising.isError ? (
              <div className="alert alert-warning" role="alert">
                Destaques publicitários indisponíveis no momento.
              </div>
            ) : null}

            {initialLoading ? (
              <p className="text-muted">Carregando profissionais…</p>
            ) : !hasAnyRegular && pool.length > 0 ? (
              <div className="d-flex flex-column gap-4">
                <p className="small text-muted mb-0">
                  Todos os perfis desta seleção estão em destaque publicitário ou ainda não há outros cadastros na
                  grade.
                </p>
                {pool.map((p) => (
                  <TeamFeaturedPsychologistSection key={p.id} psychologist={p} />
                ))}
              </div>
            ) : !hasAnyRegular && pool.length === 0 ? (
              <div className="alert alert-info mb-0">
                {(specialtyFilter || cityFilter) ?
                  <>
                    Nenhum profissional encontrado para estes filtros
                    {specialtyDisplayName ? ` — especialidade “${specialtyDisplayName}”` : ""}
                    {cityDisplayLabel ? ` — cidade “${cityDisplayLabel}”` : ""}
                    .
                  </>
                : "Nenhum profissional disponível no momento."}
              </div>
            ) : (
              <>
                {pages.map((page, pageIndex) => (
                  <Fragment key={`${pageKeyPrefix}-${pageIndex}`}>

                    {/* ── Par de destaques (aparece ANTES da fileira normal) ── */}
                    {poolReady && pool.length > 0 &&
                      pickFeaturedPair(pool, pageIndex, featuredPickCache).map((featured) => (
                        <TeamFeaturedPsychologistSection key={`feat-${pageIndex}-${featured.id}`} psychologist={featured} />
                      ))
                    }

                    {/* ── Fileira de psicólogos regulares ── */}
                    <div className="row">
                      {page.items.map((item, i) => (
                        <TeamPsychologistCard
                          key={item.id}
                          psychologist={item}
                          index={pageIndex * ROW_SIZE + i}
                          isActive={active === item.id}
                          onActivate={() => setActive(item.id)}
                        />
                      ))}
                    </div>

                  </Fragment>
                ))}
                <div ref={loadMoreRef} className="py-4 text-center text-muted small">
                  {regular.isFetchingNextPage ?
                    "Carregando mais profissionais…"
                  : !regular.hasNextPage && hasAnyRegular ?
                    "Você viu todos os profissionais desta lista."
                  : null}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function TeamFallback() {
  return (
    <>
      <Header />
      <main className="page-content">
        <PageBanner title="Nossos especialistas" bnrimage={IMAGES.Banner01.src} />
        <section className="content-inner">
          <div className="container py-5 text-muted">Carregando…</div>
        </section>
      </main>
    </>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<TeamFallback />}>
      <TeamContent />
    </Suspense>
  );
}
