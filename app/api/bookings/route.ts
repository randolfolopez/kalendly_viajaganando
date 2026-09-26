import { NextResponse, type NextRequest } from "next/server";
import { bookingRequestSchema } from "@/lib/validation";
import { createBooking, BookingError } from "@/lib/booking";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildAttribution } from "@/lib/attribution";
import { BOOKED_COOKIE, BOOKED_COOKIE_OPTIONS } from "@/lib/booked-cookie";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`book:${ip}`, 10, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  }

  const attribution = buildAttribution({
    params: parsed.data.attribution,
    fbc: req.cookies.get("_fbc")?.value,
    fbp: req.cookies.get("_fbp")?.value,
    clientIp: req.headers.get("x-forwarded-for"),
    clientUserAgent: req.headers.get("user-agent"),
  });

  try {
    const booking = await createBooking({
      slug: parsed.data.slug,
      startUtc: new Date(parsed.data.startUtc),
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail,
      guestTimezone: parsed.data.guestTimezone,
      customAnswers: parsed.data.customAnswers,
      attribution,
    });
    // The token travels in an httpOnly cookie, never in the confirmation URL
    const res = NextResponse.json({ ok: true });
    res.cookies.set(BOOKED_COOKIE, booking.manageToken, BOOKED_COOKIE_OPTIONS);
    return res;
  } catch (err) {
    if (err instanceof BookingError) {
      console.error("[bookings] BookingError", err.code, err.message);
      const status = err.code === "slot_taken" ? 409 : err.code === "not_found" ? 404 : err.code === "calendar" ? 503 : 400;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    console.error("[bookings] unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "server", message }, { status: 500 });
  }
}
