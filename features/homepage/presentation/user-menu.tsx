"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/shared/hooks/use-click-outside";
import { createClient } from "@/shared/infrastructure/supabase/client";

/** User-profile icon. Single-color -> inlined with currentColor. */
function IconUserProfile(props: React.SVGProps<SVGSVGElement>) {
  return (
    // mm:I2167:9091;186:1597;186:1420
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 4C13.0609 4 14.0783 4.42143 14.8284 5.17157C15.5786 5.92172 16 6.93913 16 8C16 9.06087 15.5786 10.0783 14.8284 10.8284C14.0783 11.5786 13.0609 12 12 12C10.9391 12 9.92172 11.5786 9.17157 10.8284C8.42143 10.0783 8 9.06087 8 8C8 6.93913 8.42143 5.92172 9.17157 5.17157C9.92172 4.42143 10.9391 4 12 4ZM12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

const MENU_ITEM_CLASSES =
  "block w-full px-4 py-3 text-left text-sm font-bold tracking-[0.1px] text-white transition-colors duration-200 hover:bg-white/10";

/**
 * User-profile avatar (spec A1.8). Toggles a menu with Profile / Admin
 * Dashboard / Sign out. "Profile" links to `/profile`; "Sign out" terminates
 * the Supabase session and sends the user to the login page. "Admin
 * Dashboard" is still inert — see the note at its markup.
 */
export default function UserMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useClickOutside(containerRef, () => setOpen(false), open);

  /**
   * Ends the session via the browser Supabase client. `signOut()` clears the
   * same auth cookies `lib/supabase/proxy.ts` reads on the server -- the
   * browser client stores its session in cookies (not localStorage), so this
   * is not merely local client state.
   *
   * On failure the menu stays open and closed state is never optimistically
   * applied, so the UI never claims the user is signed out while the server
   * still holds a valid session -- the error is logged rather than swallowed.
   *
   * `router.refresh()` clears the client-side Router Cache so a subsequent
   * navigation back to a protected route re-runs the server request (and
   * therefore the proxy's auth guard) instead of serving a cached payload
   * captured while the user was still authenticated.
   */
  async function handleSignOut() {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out failed:", error);
        return;
      }
    } catch (error) {
      console.error("Sign out failed:", error);
      return;
    }
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    // mm:I2167:9091;186:1597
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="User profile"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex size-10 items-center justify-center rounded border border-[#998C5F] bg-transparent p-2.5 text-white"
      >
        <IconUserProfile className="size-6" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="menu"
          aria-label="User menu"
          className="absolute top-full right-0 z-30 mt-1 w-48 overflow-hidden rounded bg-[#101417] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        >
          <li role="none">
            {/* The only entry point into `/profile` — the route shipped before
                anything linked to it, so this was a bare <button> that did
                nothing. Closes the menu on navigate so it isn't left hanging
                open over the new page. */}
            <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={MENU_ITEM_CLASSES}>
              {t("common:userMenu.profile")}
            </Link>
          </li>
          <li role="none">
            {/* Deliberately still inert: an Admin Dashboard needs the
                server-resolved `profiles.role` gate and an `/admin` route,
                both of which belong to the deferred phase 06
                (`plans/260906-1903-profile-and-menus/phase-06-*`). Wiring it
                now would point at a 404 and imply a gate that does not exist. */}
            <button type="button" role="menuitem" className={MENU_ITEM_CLASSES}>
              {t("common:userMenu.adminDashboard")}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleSignOut();
              }}
              className={MENU_ITEM_CLASSES}
            >
              {t("common:userMenu.signOut")}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
