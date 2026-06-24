/** Normalise DB/API values (legacy string or jsonb array) to string[]. */
export function parseStringArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    if (value.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        /* fall through */
      }
    }
    return [value.trim()];
  }
  return [];
}

const LEGACY_GENDER_MAP: Record<string, string> = {
  male: 'male',
  female: 'female',
  unisex: 'unisex',
  kids: 'kids',
  Male: 'male',
  Female: 'female',
  Unisex: 'unisex',
  Kids: 'kids',
  'For Her': 'female',
  'For Him': 'male',
};

/** Map stored gender tokens to canonical filter values. */
export function normalizeGenderValues(values: string[]): string[] {
  const out = new Set<string>();
  for (const raw of values) {
    const mapped = LEGACY_GENDER_MAP[raw] ?? raw.toLowerCase();
    if (mapped) out.add(mapped);
  }
  return [...out];
}
