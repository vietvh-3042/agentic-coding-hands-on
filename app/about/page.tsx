import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import SiteHeader from "@/components/homepage/site-header";
import HeroSection from "@/components/homepage/hero-section";
import AwardSection from "@/components/homepage/award-section";
import SunkudosSection from "@/components/homepage/sunkudos-section";
import WidgetButton from "@/components/homepage/widget-button";
import SiteFooter from "@/components/common/site-footer";

// SAA brand fonts. Sections consume these via the CSS variables below
// (--font-montserrat / --font-montserrat-alternates).
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-montserrat-alternates",
});

export const metadata: Metadata = {
  title: "Sun* Annual Awards 2025 — Root Further",
  description: "Sun* Annual Awards 2025 — Root Further. Award system and Sun* Kudos.",
};

// Homepage lives at /about: the site root (/) is the login screen, and users
// reach this page after login once the event has launched (see login flow).
export default function HomePage() {
  return (
    <div
      className={`${montserrat.variable} ${montserratAlternates.variable} relative min-h-screen w-full bg-[#00101A]`}
    >
      <SiteHeader />
      <main className="flex flex-col gap-30 pb-24">
        {/* Anchor targets for on-page nav (offset for the fixed h-20 header). */}
        <section id="about">
          <HeroSection />
        </section>
        <section id="awards">
          <AwardSection />
        </section>
        <section id="kudos">
          <SunkudosSection />
        </section>
      </main>
      <SiteFooter />
      <WidgetButton />
    </div>
  );
}
