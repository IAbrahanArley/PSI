"use client";

import type { TeamFeaturedPsychologist } from "@/actions/psychologists/types";
import { TeamFeaturedPsychologistSection } from "@/component/TeamFeaturedPsychologistSection";
import { TeamPsychologistCard } from "@/component/TeamPsychologistCard";
import PageBanner from "@/component/PageBanner";
import { IMAGES } from "@/constant/theme";
import {
  usePublicSpecialtyLabels,
  useTeamAdvertisingPool,
  useTeamRegularInfinite,
} from "@/hooks/psychologists/queries";
import Header from "@/layout/Header";
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ROW_SIZE = 4;

function parseEspecialidadeParam(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const v = raw.trim();
  if (v.toLowerCase() === "todos") return null;
  return v;
}

function pickFeaturedForPage(
  pool: TeamFeaturedPsychologist[],
  pageIndex: number,
  cache: React.MutableRefObject<Map<number, string>>,
): TeamFeaturedPsychologist | null {
  if (!pool.length) return null;
  let id = cache.current.get(pageIndex);
  if (id && !pool.some((p) => p.id === id)) {
    cache.current.delete(pageIndex);
    id = undefined;
  }
  if (!id) {
    const idx = Math.floor(Math.random() * pool.length);
    id = pool[idx].id;
    cache.current.set(pageIndex, id);
  }
  return pool.find((p) => p.id === id) ?? null;
}

function TeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string | null>(null);
  const featuredPickCache = useRef<Map<number, string>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const specialtyFilter = useMemo(
    () => parseEspecialidadeParam(searchParams.get("especialidade")),
    [searchParams],
  );

  const selectValue = specialtyFilter ?? "todos";

  useEffect(() => {
    featuredPickCache.current = new Map();
  }, [specialtyFilter]);

  const { data: specialtyLabels = [], isLoading: labelsLoading } = usePublicSpecialtyLabels();
  const regular = useTeamRegularInfinite(specialtyFilter, ROW_SIZE);
  const advertising = useTeamAdvertisingPool(specialtyFilter);

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

  function onSpecialtyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const next = new URLSearchParams(searchParams.toString());
    if (v === "todos") {
      next.delete("especialidade");
    } else {
      next.set("especialidade", v);
    }
    const qs = next.toString();
    router.push(qs ? `/team?${qs}` : "/team");
  }

  const bannerTitle = specialtyFilter ? `Especialistas — ${specialtyFilter}` : "Nossos especialistas";

  const pages = regular.data?.pages ?? [];
  const pool = advertising.data ?? [];
  const poolReady = !advertising.isLoading;
  const hasAnyRegular = pages.some((p) => p.items.length > 0);
  const initialLoading = regular.isLoading && pages.length === 0;

  return (
    <>
      <Header />
      <main className="page-content">
        <PageBanner title={bannerTitle} bnrimage={IMAGES.Banner01.src} />
        <section className="content-inner">
          <div className="container">
            <div className="row m-b30 align-items-end">
              <div className="col-md-4 mt-3 mt-md-0">
                <label htmlFor="team-especialidade" className="form-label small mb-1">
                  Especialidade
                </label>
                <select
                  id="team-especialidade"
                  className="form-select form-select-sm"
                  value={selectValue}
                  onChange={onSpecialtyChange}
                  disabled={labelsLoading}
                >
                  <option value="todos">Todas as especialidades</option>
                  {specialtyLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {regular.isError ? (
              <div className="alert alert-danger" role="alert">
                {regular.error instanceof Error
                  ? regular.error.message
                  : "Não foi possível carregar a lista."}
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
                {specialtyFilter
                  ? `Nenhum profissional encontrado para a especialidade “${specialtyFilter}”.`
                  : "Nenhum profissional disponível no momento."}
              </div>
            ) : (
              <>
                {pages.map((page, pageIndex) => (
                  <Fragment key={`${specialtyFilter ?? "all"}-${pageIndex}`}>
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
                    {poolReady && pool.length > 0 ? (
                      (() => {
                        const featured = pickFeaturedForPage(pool, pageIndex, featuredPickCache);
                        return featured ? <TeamFeaturedPsychologistSection psychologist={featured} /> : null;
                      })()
                    ) : null}
                  </Fragment>
                ))}
                <div ref={loadMoreRef} className="py-4 text-center text-muted small">
                  {regular.isFetchingNextPage
                    ? "Carregando mais profissionais…"
                    : !regular.hasNextPage && hasAnyRegular
                      ? "Você viu todos os profissionais desta lista."
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
