export const PSYCHOLOGIST_SOCIAL_NETWORKS = [
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "X",
  "YOUTUBE",
] as const;

export type PsychologistSocialNetwork = (typeof PSYCHOLOGIST_SOCIAL_NETWORKS)[number];

export const SOCIAL_NETWORK_META: Record<
  PsychologistSocialNetwork,
  { label: string; iconClassName: string; placeholder: string }
> = {
  INSTAGRAM: {
    label: "Instagram",
    iconClassName: "fa-brands fa-instagram",
    placeholder: "https://instagram.com/seu-perfil",
  },
  LINKEDIN: {
    label: "LinkedIn",
    iconClassName: "fa-brands fa-linkedin",
    placeholder: "https://linkedin.com/in/seu-perfil",
  },
  FACEBOOK: {
    label: "Facebook",
    iconClassName: "fa-brands fa-facebook-f",
    placeholder: "https://facebook.com/seu-perfil",
  },
  X: {
    label: "X",
    iconClassName: "fa-brands fa-x-twitter",
    placeholder: "https://x.com/seu-perfil",
  },
  YOUTUBE: {
    label: "YouTube",
    iconClassName: "fa-brands fa-youtube",
    placeholder: "https://youtube.com/@seu-canal",
  },
};

export function isPsychologistSocialNetwork(value: string): value is PsychologistSocialNetwork {
  return (PSYCHOLOGIST_SOCIAL_NETWORKS as readonly string[]).includes(value);
}

export function normalizeSocialNetwork(value: string | null | undefined): PsychologistSocialNetwork | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return isPsychologistSocialNetwork(normalized) ? normalized : null;
}

export function normalizeSocialUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Informe um link http ou https.");
  }

  return url.toString();
}
