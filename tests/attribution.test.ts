import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { buildAttribution, isLeadEligible } from "@/lib/attribution";

describe("buildAttribution", () => {
  it("keeps known params and drops unknown / empty ones", () => {
    const a = buildAttribution({
      params: { utm_source: "fb", utm_campaign: "f1", utm_term: "  ", evil: "x", utm_content: 42 },
    });
    expect(a).toEqual({ utm_source: "fb", utm_campaign: "f1" });
  });

  it("prefers the _fbc cookie over fbclid", () => {
    const a = buildAttribution({ params: { fbclid: "ABC" }, fbc: "fb.1.111.ABC" });
    expect(a?.fbc).toBe("fb.1.111.ABC");
    expect(a?.fbclid).toBe("ABC");
  });

  it("builds fbc from fbclid when the cookie is missing", () => {
    const a = buildAttribution({ params: { fbclid: "XYZ" }, now: new Date(1_700_000_000_000) });
    expect(a?.fbc).toBe("fb.1.1700000000000.XYZ");
  });

  it("keeps the first IP from x-forwarded-for and truncates long values", () => {
    const a = buildAttribution({ clientIp: "1.2.3.4, 10.0.0.1", clientUserAgent: "u".repeat(900) });
    expect(a?.clientIp).toBe("1.2.3.4");
    expect(a?.clientUserAgent).toHaveLength(500);
  });

  it("returns null when there is nothing to store", () => {
    expect(buildAttribution({ params: {} })).toBeNull();
    expect(buildAttribution({})).toBeNull();
  });
});

describe("isLeadEligible", () => {
  it("fires once for a new confirmed booking", () => {
    expect(isLeadEligible({ status: "confirmed" })).toBe(true);
    expect(isLeadEligible({ status: "confirmed", leadTrackedAt: null, rescheduledFromBookingId: null })).toBe(true);
    expect(isLeadEligible({ status: "confirmed", leadTrackedAt: new Date() })).toBe(false);
  });

  it("never fires for reschedules or inactive bookings", () => {
    expect(isLeadEligible({ status: "confirmed", rescheduledFromBookingId: new ObjectId() })).toBe(false);
    expect(isLeadEligible({ status: "cancelled" })).toBe(false);
    expect(isLeadEligible({ status: "rescheduled" })).toBe(false);
  });
});
