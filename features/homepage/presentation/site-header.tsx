"use client";

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import LanguageSelector from "@/shared/ui/language-selector";
import NavLinks from "@/shared/ui/nav-links";
import NotificationMenu from "@/shared/ui/notification-menu";
import UserMenu from "./user-menu";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  display: "swap",
});

/**
 * Fixed top navigation for the Homepage SAA screen: brand logo, primary nav
 * links (route-based active state), language selector, notification bell
 * and user-profile menu. Visual design is unchanged from the Figma spec --
 * this component only adds route navigation and presentational dropdown
 * behavior (see nav-links / language-menu / notification-menu / user-menu).
 */
export default function SiteHeader() {
  return (
    // mm:2167:9091
    <header className={`${montserrat.className} fixed inset-x-0 top-0 z-20 h-20 bg-[#101417]/80 py-3`}>
      <div className="mx-auto flex size-full max-w-306 items-center justify-between">
        {/* mm:I2167:9091;186:2166 */}
        <div className="flex items-center gap-16">
          {/* mm:I2167:9091;178:1033 */}
          <Link href="/about" aria-label="Sun* Annual Awards 2025 home">
            <Image src="/homepage-saa/Header_Logo.png" alt="Sun* Annual Awards 2025" width={52} height={48} priority />
          </Link>
          <NavLinks />
        </div>

        {/* mm:I2167:9091;186:1601 */}
        <div className="flex items-center gap-4">
          <NotificationMenu />
          <LanguageSelector />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
