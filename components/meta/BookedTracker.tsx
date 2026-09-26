"use client";

import { useEffect } from "react";

interface Props {
  bookingId: string;
  eventTypeSlug: string;
  country?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const RETRY_MS = 250;
const MAX_ATTEMPTS = 20; // ~5s for the Pixel stub to appear
// Guards against effect re-runs (React StrictMode, remounts) within one page load
const fired = new Set<string>();

// Rendered only when the server claimed the Lead for this booking (see booked/page.tsx),
// so it fires at most once per booking. eventID = bookingId for Conversions API dedup.
export function BookedTracker({ bookingId, eventTypeSlug, country }: Props) {
  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fire = () => {
      if (fired.has(bookingId)) return;
      if (!window.fbq) {
        if (++attempts < MAX_ATTEMPTS) timer = setTimeout(fire, RETRY_MS);
        return;
      }
      fired.add(bookingId);
      window.fbq(
        "track",
        "Lead",
        {
          value: 0,
          currency: "USD",
          content_name: eventTypeSlug,
          content_category: "booking",
          ...(country ? { country } : {}),
        },
        { eventID: bookingId },
      );
    };

    fire();
    return () => clearTimeout(timer);
  }, [bookingId, eventTypeSlug, country]);

  return null;
}
