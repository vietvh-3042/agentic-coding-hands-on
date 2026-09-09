"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { KUDOS_MAX_IMAGES } from "@/features/kudos/domain/config";
import { isAllowedImageFile } from "@/features/kudos/domain/validation";

export interface KudosImagePreview {
  file?: File;
  url: string;
}

// base `no-unused-vars` cannot see `images` below is a type-only parameter
// name, not a real declaration — see eslint.config.mjs's own note on the
// same limitation.
/* eslint-disable no-unused-vars */
export interface KudosImageUploadProps {
  images: KudosImagePreview[];
  onChange: (images: KudosImagePreview[]) => void;
}
/* eslint-enable no-unused-vars */

/**
 * "Image" attachment field — Figma node F (mms_F_Frame 537). Real file picker:
 * selected files get a local `URL.createObjectURL` preview with a remove
 * button, capped at 5, add button hides once full. `accept="image/*"` is only
 * a picker hint (bypassable via drag-and-drop or "all files"), so every
 * selected file is also checked against `isAllowedImageFile` (jpg/png, by MIME
 * AND extension) before a preview is created — rejects are reported inline and
 * never added to the draft. Object URLs are revoked on remove/unmount to avoid
 * leaking blob memory.
 */
export default function KudosImageUpload({ images, onChange }: KudosImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Keep the latest images in a ref so the unmount cleanup effect (which must
  // run with an empty dep array) can still revoke whatever is current then.
  // Synced in an effect — writing a ref during render is a React violation.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
    },
    [],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const room = KUDOS_MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    const accepted = picked.filter((file) => isAllowedImageFile(file));

    if (accepted.length < picked.length) {
      setError(t("kudos:image.invalidType"));
    } else {
      setError(null);
    }

    if (accepted.length > 0) {
      const next = accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      onChange([...images, ...next]);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (index: number) => {
    const target = images[index];
    URL.revokeObjectURL(target.url);
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        {images.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            className="relative size-20 shrink-0 rounded-[18px] border border-[#998C5F] bg-white"
          >
            {/* Rounding lives on the img (not overflow-hidden on the wrapper) so
                the absolutely-positioned ✕ badge can overlap the corner uncut. */}
            {/* Local blob preview — next/image cannot optimize object URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="size-full rounded-[17px] object-cover" />
            <button
              type="button"
              aria-label={t("kudos:image.remove", { index: i + 1 })}
              onClick={() => removeAt(i)}
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#D4271D] text-[10px] text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < KUDOS_MAX_IMAGES && (
          <label className="flex w-fit cursor-pointer flex-col items-center gap-0.5 rounded-lg border border-[#998C5F] bg-white px-3 py-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
            {/* "+ Image" bold navy + small gray "max 5" — Figma mms_F.5 button */}
            <span className="flex items-center gap-1 text-base leading-6 font-bold text-[#00101A]">
              <span aria-hidden>+</span>
              {t("kudos:image.add")}
            </span>
            <span className="text-xs font-bold text-[#999999]">{t("kudos:image.max")}</span>
          </label>
        )}
      </div>
      {error && <p className="text-sm font-bold text-[#CF1322]">{error}</p>}
    </div>
  );
}
