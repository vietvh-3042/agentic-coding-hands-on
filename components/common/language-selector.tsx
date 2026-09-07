"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cookieName, resolveLocale, type Locale } from "@/lib/i18n/settings";

interface LanguageOption {
  code: Locale;
  label: string;
  /** Flag asset (VN = Vietnam, EN = Union Jack per design). Optional so a
   *  future language without a flag falls back to a spacer. */
  flagSrc?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "VN", flagSrc: "/icons/flag_vn.svg" },
  { code: "en", label: "EN", flagSrc: "/icons/flag_en.svg" },
];

/**
 * Language selector (VN / EN). Switches the active i18next locale, persists
 * the choice to the NEXT_LOCALE cookie (so SSR picks it up on reload) and keeps
 * <html lang> in sync. Default is VN per design.
 */
export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = resolveLocale(i18n.language);
  const current = LANGUAGES.find((lang) => lang.code === selected) ?? LANGUAGES[0];

  const changeLanguage = (code: Locale) => {
    // changeLanguage is async but nothing here awaits it: the provider re-renders
    // from i18next's own event, not from this promise.
    i18n.changeLanguage(code).catch(() => {
      // A failed switch leaves the previous locale rendered, which is the
      // correct fallback — there is nothing further to recover here.
    });
    setOpen(false);
  };

  // Persist the active locale + keep <html lang> in sync (side effects belong in
  // an effect, not the click handler).
  useEffect(() => {
    document.cookie = `${cookieName}=${selected}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = selected;
  }, [selected]);

  // Clicking outside or Esc closes the dropdown.
  useClickOutside(rootRef, () => setOpen(false), open);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex cursor-pointer items-center gap-1 rounded p-3 text-white transition-colors duration-200 hover:bg-white/10"
      >
        <span className="flex items-center gap-1">
          {current.flagSrc ? (
            <Image src={current.flagSrc} alt="" width={24} height={24} aria-hidden="true" />
          ) : (
            <span className="size-6" aria-hidden="true" />
          )}
          <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px]">
            {current.label}
          </span>
        </span>
        <CustomSvgIcon
          src="/icons/icon_down.svg"
          className={`size-6 text-white transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute top-full right-0 z-30 mt-1 w-28 overflow-hidden rounded-md bg-[#101417] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected === lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm font-bold transition-colors duration-150 hover:bg-white/10 ${
                  selected === lang.code ? "text-[#FFEA9E]" : "text-white"
                }`}
              >
                {lang.flagSrc && <Image src={lang.flagSrc} alt="" width={16} height={16} aria-hidden="true" />}
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
