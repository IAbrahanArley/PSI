import { randomBytes } from "crypto";

/** Slug único para perfil público */
export function generatePsychologistSlug(firstName: string, lastName: string): string {
  const base = `${firstName} ${lastName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = randomBytes(4).toString("hex");
  return base ? `${base}-${suffix}` : `psicologo-${suffix}`;
}
