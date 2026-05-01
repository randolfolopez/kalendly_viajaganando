import { MetaPixel } from "@/components/meta/MetaPixel";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <MetaPixel />
      {children}
    </div>
  );
}
