/**
 * Turn raw Google-style category labels into short, natural phrases for prose
 * (e.g. city page intros). Omits entries that do not look tattoo- or body-art-related.
 */

const EXACT_PHRASE: Record<string, string> = {
  "tattoo shop": "tattoo shops",
  "tattoo parlor": "tattoo parlors",
  "tattoo studio": "tattoo studios",
  "tattoo artist": "tattoo artists",
  tatoueur: "tatoueurs",
  "tattoo and piercing shop": "tattoo and piercing shops",
  "tattoo & piercing shop": "tattoo & piercing shops",
  "estudio de tatuajes": "estudios de tatuajes",
  "salon de tatouage et piercing": "salons de tatouage et piercing",
};

const TATTOO_LIKE =
  /tattoo|tatou|tatuaj|piercing|body\s*art|ink|needle|flash|tatouage/i;

/** Labels that match common noise but are not tattoo or body art businesses. */
const NON_TATTOO =
  /auto\s+repair|collision|transmission|student\s+dormitory|orthodox\s+church|storage\s+facility|insurance\s+agency|urolog|nail\s+salon|manicure|pedicure/i;

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Fallback: lowercase prose, light plural / phrasing for service-style labels. */
function humanizeFallback(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "";
  if (s.endsWith(" service")) {
    return `${s.slice(0, -" service".length)} services`;
  }
  if (s.endsWith(" clinic")) {
    return s.replace(/ clinic$/, " clinics");
  }
  if (s.endsWith(" center")) {
    return s.replace(/ center$/, " centers");
  }
  if (s.endsWith("ist") && !/tattooist$|tatoueur$/.test(s)) {
    return `${s}s`;
  }
  if (!s.endsWith("s")) {
    return `${s}s`;
  }
  return s;
}

function phraseForLabel(raw: string): string | null {
  const key = normalizeKey(raw);
  if (!key) return null;
  if (NON_TATTOO.test(key)) return null;
  if (EXACT_PHRASE[key]) return EXACT_PHRASE[key];
  if (!TATTOO_LIKE.test(raw)) return null;
  return humanizeFallback(raw);
}

function oxfordJoin(items: string[]): string {
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * @param careTypes Raw labels from listings (dedupe before calling if needed).
 * @param maxItems Cap how many categories appear in the sentence (default 5).
 * @returns Clause starting with "including …" or a neutral fallback (no leading "including" duplicate in caller).
 */
export function formatCareTypesClause(
  careTypes: string[],
  maxItems = 5,
): string {
  const seen = new Set<string>();
  const phrases: string[] = [];
  for (const raw of careTypes) {
    const p = phraseForLabel(raw);
    if (!p || seen.has(p)) continue;
    seen.add(p);
    phrases.push(p);
    if (phrases.length >= maxItems) break;
  }
  if (phrases.length === 0) {
    return "including tattoo shops, tattoo and piercing shops, tattoo artists, body art studios, and professional piercers";
  }
  return `including ${oxfordJoin(phrases)}`;
}

/** Schema.org `Thing` entries for primary tattoo and body art categories on this directory. */
export function tattooCategorySchemaThings(): {
  "@type": "Thing";
  name: string;
}[] {
  return [
    { "@type": "Thing", name: "Tattoo Shop" },
    { "@type": "Thing", name: "Tattoo and Piercing Shop" },
    { "@type": "Thing", name: "Tattoo Artist" },
    { "@type": "Thing", name: "Tatoueur" },
    { "@type": "Thing", name: "Estudio de Tatuajes" },
    { "@type": "Thing", name: "Salon de Tatouage et Piercing" },
  ];
}

/** Default sentence when no care-type stats exist (FAQ answers, etc.). */
export const DEFAULT_TATTOO_CARE_TYPES_SENTENCE =
  "Tattoo Shop, Tattoo and Piercing Shop, Tattoo Artist, Tatoueur, Estudio de Tatuajes, Salon de Tatouage et Piercing";
