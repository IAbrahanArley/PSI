"use client";

import { useInfiniteQuery, useQuery, type QueryClient } from "@tanstack/react-query";
import { getPsychologistBySlug } from "@/actions/psychologists/get-psychologist-by-slug";
import { getPublicPsychologists } from "@/actions/psychologists/get-public-psychologists";
import { getPublicCatalogSpecialtyOptions } from "@/actions/psychologists/get-public-specialty-options";
import { getTeamAdvertisingPool } from "@/actions/psychologists/get-team-advertising-pool";
import { getTeamRegularChunk } from "@/actions/psychologists/get-team-regular-chunk";

export const getPublicPsychologistsQueryKey = (limit = 4) => ["public-psychologists", limit] as const;

export const getTeamRegularInfiniteQueryKey = (
  specialty: string | null,
  city: string | null,
  pageSize: number,
  modality: string | null,
) => ["team-regular-infinite", specialty, city, pageSize, modality] as const;

export const getTeamAdvertisingPoolQueryKey = (
  specialty: string | null,
  city: string | null,
  modality: string | null,
) => ["team-advertising-pool", specialty, city, modality] as const;

export const getPsychologistBySlugQueryKey = (slug?: string) => ["psychologist-detail", slug ?? ""] as const;

export const getPublicCatalogSpecialtyOptionsQueryKey = () => ["public-catalog-specialty-options"] as const;

export const getPublicSearchFiltersQueryKey = () => ["public-search-filters"] as const;

export function usePublicPsychologists(limit = 4) {
  return useQuery({
    queryKey: getPublicPsychologistsQueryKey(limit),
    queryFn: () => getPublicPsychologists(limit),
  });
}

const TEAM_ROW_SIZE = 4;

/** Grade "normal" da /team (sem destaque publicitario), paginada para scroll infinito. */
export function useTeamRegularInfinite(
  specialty: string | null,
  city: string | null,
  pageSize = TEAM_ROW_SIZE,
  modality: "ONLINE" | "PRESENTIAL" | null = null,
) {
  return useInfiniteQuery({
    queryKey: getTeamRegularInfiniteQueryKey(specialty, city, pageSize, modality),
    queryFn: ({ pageParam }) =>
      getTeamRegularChunk({
        specialty: specialty ?? undefined,
        city: city ?? undefined,
        modality: modality ?? undefined,
        offset: pageParam as number,
        limit: pageSize,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
  });
}

/** Pool de psicologos com advertising_highlight (um sorteado por fileira na /team). */
export function useTeamAdvertisingPool(
  specialty: string | null,
  city: string | null,
  modality: "ONLINE" | "PRESENTIAL" | null = null,
) {
  return useQuery({
    queryKey: getTeamAdvertisingPoolQueryKey(specialty, city, modality),
    queryFn: () =>
      getTeamAdvertisingPool({
        specialty: specialty ?? undefined,
        city: city ?? undefined,
        modality: modality ?? undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicCatalogSpecialtyOptions() {
  return useQuery({
    queryKey: getPublicCatalogSpecialtyOptionsQueryKey(),
    queryFn: () => getPublicCatalogSpecialtyOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

type PublicSearchFiltersWire = {
  specialties: { slug: string; name: string }[];
  cities: { key: string; label: string }[];
};

export function usePublicSearchFilters() {
  return useQuery({
    queryKey: getPublicSearchFiltersQueryKey(),
    queryFn: async (): Promise<PublicSearchFiltersWire> => {
      const res = await fetch("/api/public/search-filters");
      const data = (await res.json().catch(() => ({}))) as PublicSearchFiltersWire;
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Nao foi possivel carregar filtros.");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** @deprecated Use {@link usePublicCatalogSpecialtyOptions} */
export function usePublicSpecialtyLabels() {
  return useQuery({
    queryKey: getPublicCatalogSpecialtyOptionsQueryKey(),
    queryFn: async () => {
      const opts = await getPublicCatalogSpecialtyOptions();
      return opts.map((o) => o.name);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePsychologistBySlug(slug?: string) {
  return useQuery({
    queryKey: getPsychologistBySlugQueryKey(slug),
    queryFn: () => getPsychologistBySlug(slug),
    enabled: Boolean(slug),
    // Perfis mudam pouco: 5 min fresco + 15 min em cache.
    // Revisitar o mesmo perfil dentro da janela mostra os dados na hora (sem skeleton).
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/** Prefetch do perfil — use ao passar o mouse/focar num card para navegacao instantanea. */
export function prefetchPsychologistBySlug(queryClient: QueryClient, slug: string) {
  return queryClient.prefetchQuery({
    queryKey: getPsychologistBySlugQueryKey(slug),
    queryFn: () => getPsychologistBySlug(slug),
    staleTime: 5 * 60_000,
  });
}
