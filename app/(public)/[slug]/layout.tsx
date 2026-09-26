import { MetaPixel } from "@/components/meta/MetaPixel";
import { AttributionCapture } from "@/components/meta/AttributionCapture";

// Pixel + attribution only on the booking funnel (/[slug], /confirm, /booked).
// The manage page (/b/[token]) stays out: its URL carries the manage token.
export default function BookingFunnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MetaPixel />
      <AttributionCapture />
      {children}
    </>
  );
}
