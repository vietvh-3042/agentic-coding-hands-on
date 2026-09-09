"use client";

import { useTranslation } from "react-i18next";

/** Fixed bottom copyright bar. */
export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center border-t border-[#2E3940] p-6 sm:px-10 lg:px-22.5">
      <p className="text-center font-(family-name:--font-montserrat-alternates) text-base leading-6 font-bold text-white">
        {t("common:copyright")}
      </p>
    </footer>
  );
}
