"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

export interface GoogleLoginButtonProps {
  /** Called when the user activates the button. Defaults to a no-op — backend wires real OAuth here. */
  onClick?: () => void;
  /** When true, shows a spinner and disables the button instead of the Google icon. */
  loading?: boolean;
  /** Extra classes for layout overrides from the parent. */
  className?: string;
}

/**
 * Presentational "LOGIN With Google" button.
 * Does not perform any OAuth itself — the backend track wires `onClick`.
 */
export default function GoogleLoginButton({
  onClick = () => {},
  loading = false,
  className = "",
}: GoogleLoginButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      data-testid="google-login-button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      className={`inline-flex items-center gap-2 rounded-lg bg-[#FFEA9E] px-4 py-3 shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,234,158,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md sm:px-6 sm:py-4 ${className}`}
    >
      <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold text-[#00101A] sm:text-[22px] sm:leading-7">
        {loading ? t("login:googleButton.signingIn") : t("login:googleButton.label")}
      </span>
      {loading ? (
        <span
          className="size-6 shrink-0 animate-spin rounded-full border-2 border-[#00101A]/30 border-t-[#00101A]"
          aria-hidden="true"
        />
      ) : (
        <Image src="/login/google-icon.png" alt="" width={24} height={24} aria-hidden="true" className="shrink-0" />
      )}
    </button>
  );
}
