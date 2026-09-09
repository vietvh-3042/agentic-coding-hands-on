import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import CountdownTimer from "@/features/countdown/presentation/countdown/countdown-timer";

// SAA brand font, exposed as --font-montserrat for the countdown components
// (same pattern as the other SAA pages).
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "The event starts in — Sun* Annual Awards 2025",
  description: "Sun* Annual Awards 2025 prelaunch countdown page — the event starts soon.",
};

/**
 * Countdown prelaunch page — Figma "Countdown - Prelaunch page" (2268:35127,
 * screen 8PJQswPZmU). Full-bleed background artwork + a dark Cover gradient for
 * text contrast, with the countdown block centered on top. Presentational: no
 * auth guard and no navigation lock (per plan clarifications).
 */
export default function CountdownPage() {
  return (
    <main className={`${montserrat.variable} relative min-h-screen w-full overflow-hidden bg-[#00101A]`}>
      {/* mm:2268:35129 MM_MEDIA_BG Image — full-bleed background artwork */}
      <Image src="/countdown/countdown-bg.png" alt="" fill priority sizes="100vw" className="object-cover" />

      {/* mm:2268:35130 Cover — dark gradient overlay boosting text contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(18deg, #00101A 15.48%, rgba(0, 18, 29, 0.46) 52.13%, rgba(0, 19, 32, 0.00) 63.41%)",
        }}
      />

      {/* mm:2268:35131 Bìa (Cover) — countdown block centered over the artwork */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6">
        <CountdownTimer />
      </div>
    </main>
  );
}
