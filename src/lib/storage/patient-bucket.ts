/** Bucket público no Supabase Storage para avatares de pacientes.
 *  Crie o bucket "patient_avatars" no painel do Supabase com acesso público de leitura.
 *  Você pode sobrescrever o nome via variável de ambiente.
 */
export const PATIENT_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_PATIENT_STORAGE_BUCKET ?? "patient_avatars";
