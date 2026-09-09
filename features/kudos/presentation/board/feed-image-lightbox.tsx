"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface FeedImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-size viewer opened when an attachment thumbnail (`C.3.6_Image đính
 * kèm`) is clicked. Not part of the Figma design itself — a standard
 * lightbox pattern to satisfy the "click → open full-size image" behavior
 * from the task brief.
 */
export default function FeedImageLightbox({ src, alt, onClose }: FeedImageLightboxProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
      onClick={onClose}
    >
      <div
        className="relative aspect-square max-h-[80vh] w-full max-w-180"
        onClick={(event) => event.stopPropagation()}
      >
        <Image src={src} alt={alt} fill className="rounded-2xl object-contain" sizes="720px" />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("kudosFeed:lightbox.close")}
        className="absolute top-6 right-6 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
      >
        {t("kudosFeed:lightbox.close")}
      </button>
    </div>
  );
}
