import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Folds text for accent-, case- and final-sigma-insensitive matching: NFD, combining marks (`\p{M}`) removed, lower-cased
 * with the locale rules, and the final sigma "ς" turned into "σ", so "Άννα", "ΑΝΝΑ" and "αννα", or "ΟΔΟΣ" and "οδος",
 * compare equal. Use it on both the query and the candidate.
 *
 * @param text the text to fold
 * @returns the folded text
 */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/ς/g, "σ");
}
