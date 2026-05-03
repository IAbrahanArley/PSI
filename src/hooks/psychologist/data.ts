"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPsychologistAddresses, savePsychologistAddresses } from "@/actions/psychologist/addresses";
import { getPsychologistProfile, savePsychologistProfile } from "@/actions/psychologist/profile";
import { getPsychologistSocialLinks, savePsychologistSocialLinks } from "@/actions/psychologist/social-links";
import type {
  SavePsychologistAddressesInput,
  SavePsychologistProfileInput,
  SavePsychologistSocialLinksInput,
} from "@/actions/psychologist/types";

export const getPsychologistProfileQueryKey = () => ["psychologist-profile"] as const;
export const getPsychologistAddressesQueryKey = () => ["psychologist-addresses"] as const;
export const getPsychologistSocialLinksQueryKey = () => ["psychologist-social-links"] as const;

export function usePsychologistProfile() {
  return useQuery({
    queryKey: getPsychologistProfileQueryKey(),
    queryFn: () => getPsychologistProfile(),
  });
}

export function useSavePsychologistProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["save-psychologist-profile"],
    mutationFn: (input: SavePsychologistProfileInput) => savePsychologistProfile(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getPsychologistProfileQueryKey() });
    },
  });
}

export function usePsychologistAddresses() {
  return useQuery({
    queryKey: getPsychologistAddressesQueryKey(),
    queryFn: () => getPsychologistAddresses(),
  });
}

export function useSavePsychologistAddresses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["save-psychologist-addresses"],
    mutationFn: (input: SavePsychologistAddressesInput) => savePsychologistAddresses(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getPsychologistAddressesQueryKey() });
    },
  });
}

export function usePsychologistSocialLinks() {
  return useQuery({
    queryKey: getPsychologistSocialLinksQueryKey(),
    queryFn: () => getPsychologistSocialLinks(),
  });
}

export function useSavePsychologistSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["save-psychologist-social-links"],
    mutationFn: (input: SavePsychologistSocialLinksInput) => savePsychologistSocialLinks(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getPsychologistSocialLinksQueryKey() });
    },
  });
}
