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

export function BookedTracker({ bookingId, eventTypeSlug, country }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.fbq) return;

    const dedupKey = `pixel-lead-${bookingId}`;
    if (sessionStorage.getItem(dedupKey)) return;

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

    sessionStorage.setItem(dedupKey, "1");
  }, [bookingId, eventTypeSlug, country]);

  return null;
}
