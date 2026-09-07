"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/hooks/use-click-outside";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import { KUDOS_MAX_HASHTAGS } from "@/constants";
import type { Hashtag } from "@/lib/kudos/types";

// base `no-unused-vars` cannot see `tags` below is a type-only parameter
// name, not a real declaration — see eslint.config.mjs's own note on the
// same limitation.
/* eslint-disable no-unused-vars */
export interface KudosHashtagInputProps {
  /** The 13 canonical rows (`public.hashtags`), resolved once on the page and
   *  passed down — this component never fetches them itself (`getHashtags()`
   *  is server-only). */
  hashtags: Hashtag[];
  /** Selected hashtag ids (`Hashtag.id`). */
  tags: number[];
  onChange: (tags: number[]) => void;
}
/* eslint-enable no-unused-vars */

const LISTBOX_ID = "kudos-hashtag-listbox";

/**
 * "Hashtag" field — MoMorph "Dropdown list hashtag" (screen p9zO-c4a4x, node
 * 1002:13013). The "+ Hashtag / max 5" button opens a fixed multi-select
 * dropdown of the canonical `hashtags` rows: each row toggles selection, a
 * check-in-circle marks selected rows, hover highlights, and once 5 are chosen
 * the unselected rows are disabled (spec A.1/D). Selected tags also render as
 * removable chips so the current choice stays visible when the dropdown closes.
 *
 * Deliberately a different interaction model than the board's hashtag filter
 * dropdown (single-select, closes on pick) — see clarifications.md.
 */
export default function KudosHashtagInput({ hashtags, tags, onChange }: KudosHashtagInputProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Clicking outside closes the hashtag dropdown.
  useClickOutside(rootRef, () => setOpen(false), open);

  const atMax = tags.length >= KUDOS_MAX_HASHTAGS;
  const labelFor = (id: number) => hashtags.find((h) => h.id === id)?.name ?? "";

  const toggleTag = (value: number) => {
    if (tags.includes(value)) {
      onChange(tags.filter((v) => v !== value));
    } else if (!atMax) {
      onChange([...tags, value]);
    }
  };

  const removeTag = (value: number) => onChange(tags.filter((v) => v !== value));

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-2 rounded-lg border border-[#998C5F] bg-white px-3 py-2 text-sm font-bold text-[#00101A]"
        >
          #{labelFor(tag)}
          <button
            type="button"
            aria-label={t("kudos:hashtag.remove", {
              tag: labelFor(tag),
            })}
            onClick={() => removeTag(tag)}
            className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D4271D] text-[10px] leading-none text-white"
          >
            ✕
          </button>
        </span>
      ))}

      {!atMax && (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={LISTBOX_ID}
          onClick={() => setOpen((prev) => !prev)}
          className="flex flex-col items-center gap-0.5 rounded-lg border border-[#998C5F] bg-white px-3 py-1.5"
        >
          {/* "+ Hashtag" bold navy + small gray "max 5" — Figma mms_E button */}
          <span className="flex items-center gap-1 text-base leading-6 font-bold text-[#00101A]">
            <span aria-hidden>+</span>
            {t("kudos:hashtag.add")}
          </span>
          <span className="text-xs font-bold text-[#999999]">{t("kudos:hashtag.max")}</span>
        </button>
      )}

      {open && (
        // mm:1002:13013 — dark dropdown of selectable hashtag rows.
        <ul
          id={LISTBOX_ID}
          role="listbox"
          aria-multiselectable
          aria-label={t("kudos:hashtag.label")}
          className="absolute top-[calc(100%+8px)] left-0 z-10 flex max-h-72 w-72 flex-col overflow-y-auto rounded-2xl bg-[#1B1C13] p-2 shadow-lg"
        >
          {hashtags.map((h) => {
            const selected = tags.includes(h.id);
            const disabled = !selected && atMax;
            return (
              <li key={h.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  onClick={() => toggleTag(h.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-base font-bold text-white transition-colors ${
                    selected ? "bg-white/10" : "hover:bg-white/5"
                  } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                >
                  <span>#{h.name}</span>
                  {selected && <CustomSvgIcon src="/kudos/icons/check-circle.svg" className="size-6" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
