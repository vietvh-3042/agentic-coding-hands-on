"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ROUTERS } from "@/constants";

const baseClasses = "p-4 text-sm font-bold tracking-[0.1px]";
const activeClasses =
  "border-b border-[#FFEA9E] text-[#FFEA9E] [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";
const inactiveClasses = "rounded text-white transition-colors duration-200 hover:bg-white/10";

/**
 * Primary nav links: About SAA 2025 / Award Information / Sun* Kudos.
 *
 * Each item is a real route link (previously About/Kudos were homepage URL-hash
 * anchors with scrollspy). The active item is the one whose route matches the
 * current pathname.
 */
export default function NavLinks() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    // mm:I2167:9091;178:653
    <nav className="flex items-center gap-6">
      {ROUTERS.map(({ key, url }) => {
        const isActive = pathname === url;
        return (
          <Link
            key={url}
            href={url}
            aria-current={isActive ? "page" : undefined}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
          >
            {t(`nav:${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
