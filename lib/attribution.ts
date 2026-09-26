import type { BookingAttribution, BookingDoc } from "./types";

// Campaign params the landing (viajaganando.com) forwards to the booking page.
export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type AttributionParam = (typeof ATTRIBUTION_PARAMS)[number];

const MAX_LEN = 500;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v) return undefined;
  return v.slice(0, MAX_LEN);
}

/**
 * Normalizes client-sent attribution plus Pixel cookies.
 * - Drops unknown keys and empty / non-string values.
 * - Without an _fbc cookie but with fbclid, builds fbc in Meta's format
 *   (fb.1.<timestamp ms>.<fbclid>) for the Conversions API.
 */
export function buildAttribution(input: {
  params?: Partial<Record<string, unknown>> | null;
  fbc?: string | null;
  fbp?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  now?: Date;
}): BookingAttribution | null {
  const out: BookingAttribution = {};
  for (const key of ATTRIBUTION_PARAMS) {
    const v = clean(input.params?.[key]);
    if (v) out[key] = v;
  }

  const fbc = clean(input.fbc) ?? (out.fbclid ? `fb.1.${(input.now ?? new Date()).getTime()}.${out.fbclid}` : undefined);
  if (fbc) out.fbc = fbc;
  const fbp = clean(input.fbp);
  if (fbp) out.fbp = fbp;
  const ip = clean(input.clientIp?.split(",")[0]);
  if (ip) out.clientIp = ip;
  const ua = clean(input.clientUserAgent);
  if (ua) out.clientUserAgent = ua;

  return Object.keys(out).length > 0 ? out : null;
}

/**
 * A Lead counts once per new booking:
 * - Bookings created by a reschedule are not new leads.
 * - Once fired (leadTrackedAt), it never repeats in another tab or device.
 */
export function isLeadEligible(
  booking: Pick<BookingDoc, "rescheduledFromBookingId" | "leadTrackedAt" | "status">,
): boolean {
  if (booking.status !== "confirmed") return false;
  if (booking.rescheduledFromBookingId) return false;
  return !booking.leadTrackedAt;
}
