import type { CurriculumContent } from "@/lib/types/psychologist-curriculum";
import type { PsychologistSocialNetwork } from "@/lib/psychologist-social-links";

export type PublicPsychologistSocialLink = {
  network: PsychologistSocialNetwork;
  url: string;
};

export type PublicPsychologist = {
  id: string;
  slug: string;
  displayName: string;
  specialty: string;
  profileImageUrl: string | null;
  socialLinks: PublicPsychologistSocialLink[];
};

/** Psicólogo em destaque publicitário (bloco largo na página /team). */
export type TeamFeaturedPsychologist = PublicPsychologist & {
  bio: string | null;
  skills: string[];
};

export type PsychologistPublicAddress = {
  id: string;
  label: string;
  /** Linha única para exibição (rua, bairro, cidade, CEP…). */
  formatted: string;
};

export type PsychologistWeeklyRow = {
  weekday: number;
  label: string;
  /** Ex.: "09:00 – 12:00 · 14:00 – 18:00" */
  rangesText: string;
};

export type PsychologistDetail = {
  id: string;
  slug: string;
  displayName: string;
  fullName: string;
  professionalName: string | null;
  crp: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  specialties: string[];
  skills: string[];
  awards: Array<{ id: string; title: string; link: string | null; imageUrl: string | null }>;
  curriculum: CurriculumContent;
  /** E-mail da conta (contato público). */
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  socialLinks: PublicPsychologistSocialLink[];
  addresses: PsychologistPublicAddress[];
  /** Blocos semanais AVAILABLE ativos, agrupados por dia. */
  weeklySchedule: PsychologistWeeklyRow[];
  /** Cidade/UF genéricos do cadastro (quando não há endereços detalhados). */
  city: string | null;
  state: string | null;
};
