"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPsychologistBySlug } from "@/actions/psychologists/get-psychologist-by-slug";
import { getPublicPsychologists } from "@/actions/psychologists/get-public-psychologists";
import { getPublicSpecialtyLabels } from "@/actions/psychologists/get-public-specialty-labels";
import { getTeamAdvertisingPool } from "@/actions/psychologists/get-team-advertising-pool";
import { getTeamRegularChunk } from "@/actions/psychologists/get-team-regular-chunk";

export const getPublicPsychologistsQueryKey = (limit = 4) => ["public-psychologists", limit] as const;
export const getTeamRegularInfiniteQueryKey = (specialty: string | null, pageSize: number) =>
  ["team-regular-infinite", specialty, pageSize] as const;
export const getTeamAdvertisingPoolQueryKey = (specialty: string | null) =>
  ["team-advertising-pool", specialty] as const;
export const getPsychologistBySlugQueryKey = (slug?: string) => ["psychologist-detail", slug ?? ""] as const;
export const getPublicSpecialtyLabelsQueryKey = () => ["public-specialty-labels"] as const;

export function usePublicPsychologists(limit = 4) {
  return useQuery({
    queryKey: getPublicPsychologistsQueryKey(limit),
    queryFn: () => getPublicPsychologists(limit),
  });
}

const TEAM_ROW_SIZE = 4;

/** Grade “normal” da /team (sem destaque publicitário), paginada para scroll infinito. */
export function useTeamRegularInfinite(specialty: string | null, pageSize = TEAM_ROW_SIZE) {
  return useInfiniteQuery({
    queryKey: getTeamRegularInfiniteQueryKey(specialty, pageSize),
    queryFn: ({ pageParam }) =>
      getTeamRegularChunk({
        specialty: specialty ?? undefined,
        offset: pageParam as number,
        limit: pageSize,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
  });
}

/** Pool de psicólogos com `advertising_highlight` (um sorteado por fileira na /team). */
export function useTeamAdvertisingPool(specialty: string | null) {
  return useQuery({
    queryKey: getTeamAdvertisingPoolQueryKey(specialty),
    queryFn: () => getTeamAdvertisingPool(specialty),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublicSpecialtyLabels() {
  return useQuery({
    queryKey: getPublicSpecialtyLabelsQueryKey(),
    queryFn: () => getPublicSpecialtyLabels(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePsychologistBySlug(slug?: string) {
  return useQuery({
    queryKey: getPsychologistBySlugQueryKey(slug),
    queryFn: () => getPsychologistBySlug(slug),
    enabled: Boolean(slug),
  });
}
