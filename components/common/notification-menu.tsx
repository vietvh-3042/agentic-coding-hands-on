"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/hooks/use-click-outside";

/** Bell/notification icon. Single-color -> inlined with currentColor. */
function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    // mm:I2167:9091;186:2101;186:2020;186:1420
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29C10 4.19 10 4.1 10 4C10 3.46957 10.2107 2.96086 10.5858 2.58579C10.9609 2.21071 11.4696 2 12 2C12.5304 2 13.0391 2.21071 13.4142 2.58579C13.7893 2.96086 14 3.46957 14 4C14 4.1 14 4.19 14 4.29C16.97 5.17 19 7.9 19 11V17L21 19ZM14 21C14 21.5304 13.7893 22.0391 13.4142 22.4142C13.0391 22.7893 12.5304 23 12 23C11.4696 23 10.9609 22.7893 10.5858 22.4142C10.2107 22.0391 10 21.5304 10 21"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Notification bell (spec A1.6). Presentational -- toggles a panel showing
 * an empty state; the static unread badge dot is kept as-is and no real
 * notification data is fetched.
 */
export default function NotificationMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    // mm:I2167:9091;186:2101
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex size-10 items-center justify-center rounded p-2.5 text-white transition-colors duration-200 hover:bg-white/10"
      >
        <IconBell className="size-6" aria-hidden="true" />
        {/* mm:I2167:9091;186:2101;186:2089 */}
        <span aria-hidden="true" className="absolute top-2.25 right-2.25 size-2 rounded-full bg-[#D4271D]" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-30 mt-1 w-64 rounded bg-[#101417] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        >
          <p className="text-center text-sm font-bold tracking-[0.1px] text-white/70">
            {t("common:notifications.empty")}
          </p>
        </div>
      )}
    </div>
  );
}
