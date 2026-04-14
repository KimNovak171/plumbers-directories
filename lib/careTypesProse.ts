/**
 * Turn raw Google-style category labels into short, natural phrases for prose
 * (e.g. city page intros). Omits entries that do not look plumbing-related.
 */

const EXACT_PHRASE: Record<string, string> = {
  plumber: "plumbers",
  "plumbing service": "plumbing services",
  "plumbing contractor": "plumbing contractors",
  "plumbing company": "plumbing companies",
  "plumbing repair": "plumbing repairs",
  "drain cleaning service": "drain cleaning services",
  "drain cleaning": "drain cleaning services",
  "septic system service": "septic system services",
  "septic service": "septic services",
  "septic tank service": "septic tank services",
  "water heater service": "water heater services",
  "water heater repair": "water heater repairs",
  "emergency plumber": "emergency plumbers",
  "licensed plumber": "licensed plumbers",
  "rooter service": "rooter services",
};

const PLUMBING_LIKE =
  /plumb|drain|septic|sewer|pipe|clog|water\s*heater|leak|hydro|rooter|slab|fixture|boiler|sump|backflow|repipe|gas\s*line/i;

/** Labels that match common noise but are not plumbing businesses. */
const NON_PLUMBING =
  /tatou|tatuaj|auto\s+repair|collision|transmission|student\s+dormitory|orthodox\s+church|storage\s+facility|insurance\s+agency|urolog|beauty|barbershop|spa|\bsalon\b|\bnail\b|manicure|pedicure/i;

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
  if (s.endsWith("ist") && !/plumber$/.test(s)) {
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
  if (NON_PLUMBING.test(key)) return null;
  if (EXACT_PHRASE[key]) return EXACT_PHRASE[key];
  if (!PLUMBING_LIKE.test(raw)) return null;
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
    return "including licensed plumbers, plumbing contractors, drain cleaning, septic system services, and water heater repair";
  }
  return `including ${oxfordJoin(phrases)}`;
}

/** Schema.org `Thing` entries for primary plumbing categories on this directory. */
export function plumberCategorySchemaThings(): {
  "@type": "Thing";
  name: string;
}[] {
  return [
    { "@type": "Thing", name: "Licensed Plumber" },
    { "@type": "Thing", name: "Plumbing Contractor" },
    { "@type": "Thing", name: "Plumbing Services" },
    { "@type": "Thing", name: "Drain Cleaning" },
    { "@type": "Thing", name: "Septic System Services" },
    { "@type": "Thing", name: "Drainage Services" },
  ];
}

/** Default sentence when no care-type stats exist (FAQ answers, etc.). */
export const DEFAULT_PLUMBER_CARE_TYPES_SENTENCE =
  "Licensed Plumber, Plumbing Contractor, Plumbing Services, Drain Cleaning, Septic System Services, Drainage Services";
