import type { CurriculumContent } from "@/lib/types/psychologist-curriculum";

export type PsychologistProfileData = {
  psychologist: {
    id: string;
    fullName: string;
    professionalName: string | null;
    bio: string | null;
    crp: string | null;
    profileImageUrl: string | null;
    slug: string;
  };
  specialties: string[];
  skills: string[];
  awards: Array<{ id: string; title: string; link: string | null; imageUrl: string | null }>;
  curriculum: CurriculumContent;
};

export type SavePsychologistProfileInput = {
  professionalName?: string | null;
  bio?: string | null;
  crp?: string | null;
  profileImageUrl?: string | null;
  specialties?: string[];
  skills?: string[];
  awards?: Array<{ title: string; link?: string | null; imageUrl?: string | null }>;
  curriculum?: CurriculumContent;
};

export type PsychologistAddress = {
  id: string;
  label: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  complement: string | null;
  reference: string | null;
};

export type SavePsychologistAddressesInput = {
  addresses: Array<{
    label?: string;
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    complement?: string | null;
    reference?: string | null;
  }>;
};
