import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Meta Pixel: fbevents.js + config load from connect.facebook.net; events go to
// www.facebook.com/tr (fetch/beacon, or image for the noscript fallback)
const META_SCRIPT = "https://connect.facebook.net";
const META_EVENTS = "https://www.facebook.com";

const scriptSrc = isDev
  ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${META_SCRIPT}`
  : `script-src 'self' 'unsafe-inline' ${META_SCRIPT}`;

const connectSrc = isDev
  ? `connect-src 'self' ws: wss: ${META_EVENTS} ${META_SCRIPT}`
  : `connect-src 'self' ${META_EVENTS} ${META_SCRIPT}`;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: ${META_EVENTS}`,
      "font-src 'self' https://fonts.gstatic.com",
      connectSrc,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const config: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
