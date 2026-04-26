/** Estrutura do currículo (JSON em `psychologist_curriculum.content`) */
export type CurriculumItem = {
  id: string;
  title: string;
  subtitle?: string;
  period?: string;
  description?: string;
};

export type CurriculumSection = {
  id: string;
  title: string;
  items: CurriculumItem[];
};

export type CurriculumContent = {
  sections: CurriculumSection[];
};

export function emptyCurriculum(): CurriculumContent {
  return {
    sections: [
      {
        id: "formacao",
        title: "Formação acadêmica",
        items: [],
      },
      {
        id: "experiencia",
        title: "Experiência profissional",
        items: [],
      },
      {
        id: "complementar",
        title: "Formação complementar",
        items: [],
      },
    ],
  };
}
