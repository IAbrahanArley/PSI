/** Especialidades para cadastro / busca de psicólogos */
export const PSYCHOLOGY_SPECIALTIES = [
  "Psicologia Clínica",
  "Psicologia Infantil",
  "Psicologia do Adolescente",
  "Terapia de Casal",
  "Psicologia Familiar",
  "Neuropsicologia",
  "Psicologia Organizacional",
  "Luto e Trauma",
  "Ansiedade e Depressão",
  "TCC (Terapia Cognitivo-Comportamental)",
  "Psicologia Hospitalar",
  "Psicologia do Esporte",
  "Psicologia Jurídica",
  "Psicologia Social",
  "Psicologia Escolar",
  "Dependência Química",
  "Sexologia",
  "Psicologia Perinatal",
] as const;

export type PsychologySpecialty = (typeof PSYCHOLOGY_SPECIALTIES)[number];
