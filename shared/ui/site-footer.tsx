"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import { useTranslation } from "react-i18next";
import { ROUTERS } from "@/shared/config/navigation";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  display: "swap",
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/**
 * Footer nav = the shared `ROUTERS` (active = current page) plus a
 * "General Standards" link. That extra has no dedicated page yet, so it points
 * to the About page and never takes the active style (`matchActive: false`).
 */
const FOOTER_LINKS = [
  ...ROUTERS.map((route) => ({ ...route, matchActive: true })),
  { key: "generalStandards", url: "/about", matchActive: false },
];

const linkBase = "rounded p-4 text-base leading-6 font-bold tracking-[0.15px] text-white";
const linkActive = "bg-[#FFEA9E]/10 [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";
const linkInactive = "transition-colors duration-200 hover:bg-white/10";

/**
 * Site footer for the Homepage SAA screen: brand logo, secondary nav links
 * and copyright notice. Presentational only -- content is mock data
 * extracted verbatim from Figma, no client state, no real navigation targets.
 */
export default function SiteFooter() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    // mm:5001:14800
    <footer className="w-full border-t border-[#2E3940] bg-[#00101A] px-22.5 py-10">
      <div className="flex w-full items-center justify-between gap-8">
        {/* mm:I5001:14800;342:1407 */}
        <div className="flex items-center gap-20">
          {/* mm:I5001:14800;342:1408 */}
          <Link href="/about" aria-label="Sun* Annual Awards 2025 home" className="h-16 w-17.25">
            {/* mm:I5001:14800;342:1408;178:1030 */}
            <Image src="/homepage-saa/Footer_Logo.png" alt="Sun* Annual Awards 2025" width={69} height={64} />
          </Link>
          {/* mm:I5001:14800;342:1409 — route links, active = current page */}
          <nav className={`${montserrat.className} flex items-center gap-12 whitespace-nowrap`}>
            {FOOTER_LINKS.map(({ key, url, matchActive }, index) => {
              const isActive = matchActive && pathname === url;
              return (
                <Link
                  key={`${key}-${index}`}
                  href={url}
                  aria-current={isActive ? "page" : undefined}
                  className={`${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                  {t(`nav:${key}`)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* mm:I5001:14800;342:1413 */}
        <p className={`${montserratAlternates.className} text-center text-base leading-6 font-bold text-white`}>
          {t("common:copyright")}
        </p>
      </div>
    </footer>
  );
}
