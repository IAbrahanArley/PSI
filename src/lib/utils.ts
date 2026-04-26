import { clsx, type ClassValue } from "clsx";

/** Junta classes condicionalmente (substitui cn + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}
