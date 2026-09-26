import { ATTRIBUTION_PARAMS } from "./attribution";

const STORAGE_KEY = "kb_attribution";

// Stores utm_* / fbclid from the current URL for the rest of the session.
// The booking flow drops the query string on its way to /confirm, so the form
// reads them back from here. A new set of params replaces the old one (last touch).
export function captureAttribution(search: string): void {
  const params = new URLSearchParams(search);
  const found: Record<string, string> = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const v = params.get(key);
    if (v) found[key] = v;
  }
  if (Object.keys(found).length === 0) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch {
    // sessionStorage unavailable (private mode / blocked) — attribution is best-effort
  }
}

export function readAttribution(): Record<string, string> | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && (ATTRIBUTION_PARAMS as readonly string[]).includes(k)) out[k] = v.slice(0, 500);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}
