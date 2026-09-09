"use client";

import { useState } from "react";
import type { DrawnSecretBoxIcon } from "@/features/kudos/application/actions/open-secret-box";

interface SecretBoxRevealPanelProps {
  icon: DrawnSecretBoxIcon;
  /** Localized alt text for the badge image (i18n-owned by the caller). */
  badgeAlt: string;
}

/**
 * The "opened" box illustration for the secret-box success state (MoMorph
 * J3-4YFIpMM, spec row C: "Khung minh họa hộp quà mở ... hình ảnh mở ra là
 * hình ảnh huy hiệu nhận được"). Reuses the same box-closed.svg frame as the
 * unopened shell — no distinct "opened box" asset exists — with the drawn
 * badge centered on top.
 *
 * `secret_box_icons.image_url` points at `/profile/icons/icon-N.svg`, which
 * does not exist on disk yet (clarifications.md, 2026-09-06 run 2 — no
 * artwork was ever supplied). The <img> stays wired to the real column so
 * dropping the artwork files in later needs no code change; `onError`
 * (which also covers TC 43badf5d's "corrupt/missing badge image" case)
 * swaps to a name-text fallback the moment — as today — the file 404s.
 */
export default function SecretBoxRevealPanel({ icon, badgeAlt }: SecretBoxRevealPanelProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(icon.imageUrl) && !imageFailed;

  return (
    <>
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/kudos/secret-box/box-closed.svg)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-10">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- badge is a runtime-drawn DB record, not a static-import-able asset
          <img
            src={icon.imageUrl ?? undefined}
            alt={badgeAlt}
            data-testid="secret-box-badge-image"
            className="max-h-full max-w-full object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            data-testid="secret-box-badge-name"
            className="rounded-lg bg-black/50 px-6 py-4 text-center text-[22px] leading-7 font-bold text-[#FFEA9E]"
          >
            {icon.name}
          </span>
        )}
      </div>
    </>
  );
}
