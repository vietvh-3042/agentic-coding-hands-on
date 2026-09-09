"use client";

import { useTranslation } from "react-i18next";
import type { KudoDraftErrorCode } from "@/features/kudos/domain/validation";
import { FieldLabel, FieldError, FIELD_CONTENT_INDENT } from "./kudos-field-label";

// base `no-unused-vars` cannot see `value` below is a type-only parameter
// name, not a real declaration — see eslint.config.mjs's own note on the
// same limitation.
/* eslint-disable no-unused-vars */
export interface KudosTitleInputProps {
  value: string;
  error?: KudoDraftErrorCode;
  onChange: (value: string) => void;
}
/* eslint-enable no-unused-vars */

/**
 * "Danh hiệu" field — Figma Frame 552 (I520:11647;1688:10448), the row between
 * the recipient select and the content editor. Persisted as
 * `kudos.hashtag_title` and read back as the card's category chip by both
 * `lib/kudos/board-query-helpers.ts` and `lib/profile/feed-queries.ts`.
 *
 * Required per the design's `*` marker; no length cap is applied because the
 * design states none (Frame 552 has no spec row of its own).
 *
 * Deliberately no trailing icon: the Figma node has an `IC` child but it
 * renders blank (checked against the frame render), unlike the recipient row's
 * dropdown chevron.
 */
export default function KudosTitleInput({ value, error, onChange }: KudosTitleInputProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <FieldLabel required fixed>
          {t("kudos:kudoTitle.label")}
        </FieldLabel>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("kudos:kudoTitle.placeholder")}
          aria-label={t("kudos:kudoTitle.label")}
          className={`h-14 flex-1 rounded-lg border bg-white px-6 text-base font-bold text-[#00101A] outline-none ${
            error ? "border-[#CF1322]" : "border-[#998C5F]"
          }`}
        />
      </div>
      {/* Two-line grey helper, left-aligned to the input rather than the label. */}
      <p
        className={`${FIELD_CONTENT_INDENT} text-base leading-6 font-bold tracking-[0.15px] whitespace-pre-line text-[#999999]`}
      >
        {t("kudos:kudoTitle.hint")}
      </p>
      {error && <FieldError>{t(`kudos:errors.kudoTitle.${error}`)}</FieldError>}
    </div>
  );
}
