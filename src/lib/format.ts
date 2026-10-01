/** Status chip colors of the CMS mockup (`statusStyle` in iGuide CMS.html). */
export function statusChipStyle(status: string): { background: string; color: string } {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "READY":
    case "LIVE":
    case "SUCCESS":
      return { background: "rgba(15,122,110,0.1)", color: "#0f7a6e" };
    case "SUSPENDED":
    case "PENDING":
      return { background: "rgba(154,98,0,0.1)", color: "#9a6200" };
    case "FAILED":
    case "DENIED":
      return { background: "rgba(192,24,94,0.1)", color: "#c0185e" };
    default:
      return { background: "#f3f4f6", color: "#374151" };
  }
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "4 Sep 2026", as in the mockup. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date);
}

const GREEK_TO_LATIN: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
  ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps",
  ω: "o",
};

/**
 * Derives a Catalogue slug (lowercase letters, digits, and hyphens) from a name. Accents are removed
 * and Greek letters transliterated, so "Κάστρο Ναυπλίου" becomes "kastro-nayplioy".
 */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[α-ω]/g, (c) => GREEK_TO_LATIN[c] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
