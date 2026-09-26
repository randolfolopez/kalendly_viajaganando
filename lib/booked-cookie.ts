// The confirmation page (/[slug]/booked) reads the manageToken from this cookie
// instead of the URL: the Meta Pixel sends the full URL with every event, and the
// token grants cancel/reschedule access.
export const BOOKED_COOKIE = "kb_booked";

export const BOOKED_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 1 day: covers refreshes of the confirmation page
};
