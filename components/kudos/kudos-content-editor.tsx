"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import { KUDOS_MESSAGE_MAX_LENGTH } from "@/lib/kudos/kudo-validation";
import AddlinkBox from "./addlink-box";

// base `no-unused-vars` cannot see these are type-only parameter names, not
// real declarations — see eslint.config.mjs's own note on the same limitation.
/* eslint-disable no-unused-vars */
export interface KudosContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Controlled by the parent (not local state) so `KudosFormModal`'s own
   *  Escape handler can tell an Addlink Box is open and skip closing itself —
   *  two document-level "Escape closes" listeners would otherwise both fire
   *  on the same keypress and close both dialogs at once. */
  addlinkOpen: boolean;
  onAddlinkOpenChange: (open: boolean) => void;
}
/* eslint-enable no-unused-vars */

/** Toolbar buttons in Figma's own order — mms_C.1_bold .. mms_C.6_quote. The
 *  icons are the design's own 24px assets (MM_MEDIA_Bold .. MM_MEDIA_Quote,
 *  exported to `public/kudos/icons/`), not text glyphs; `link.svg` was already
 *  vendored for another surface and is the same node. C.5 (link) is the one
 *  button in this row with a real handler — see `onClick` below. */
const TOOLBAR_ICONS = [
  { key: "bold", src: "/kudos/icons/bold.svg" },
  { key: "italic", src: "/kudos/icons/italic.svg" },
  { key: "strike", src: "/kudos/icons/strikethrough.svg" },
  { key: "list", src: "/kudos/icons/number-list.svg" },
  { key: "link", src: "/kudos/icons/link.svg" },
  { key: "quote", src: "/kudos/icons/quote.svg" },
] as const;

/** mms_C cell — 56x40 with a 1px #998C5F divider on its right edge. The block's
 *  outer border and the row's `border-b` supply the remaining edges, so each
 *  boundary stays a single 1px line rather than two abutting borders. */
const TOOLBAR_CELL_CLASSES =
  "flex h-10 w-14 shrink-0 items-center justify-center border-r border-[#998C5F] text-[#00101A] hover:bg-[#FFEA9E]/20";

/**
 * Kudo content editor — Figma nodes C/D (mms_C_Chức năng, mms_D_text filed).
 * The toolbar's bold/italic/strike/list/quote buttons stay presentational/
 * no-op per clarification #3 (no WYSIWYG lib) and D002 (only the link button
 * ships this phase); the actual content lives in a plain `<textarea>`. The
 * link button (C.5) opens the Addlink Box (A7-A9) and, on save, splices
 * `[text](url)` into the draft at the caret. The community-standards
 * ("Tiêu chuẩn cộng đồng") link is a no-op placeholder.
 */
export default function KudosContentEditor({
  value,
  onChange,
  addlinkOpen,
  onAddlinkOpenChange,
}: KudosContentEditorProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertLink = (text: string, url: string) => {
    const markdown = `[${text}](${url})`;
    const textarea = textareaRef.current;
    // Fall back to appending at the end if the caret position is unknown.
    const caret = textarea ? textarea.selectionStart : value.length;
    const next = `${value.slice(0, caret)}${markdown}${value.slice(caret)}`;
    onChange(next);
    // Return focus + caret after the inserted link once React commits the
    // new value — a synchronous `focus()` here would race that update.
    requestAnimationFrame(() => {
      if (!textarea) return;
      const nextCaret = caret + markdown.length;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const overLimit = value.length > KUDOS_MESSAGE_MAX_LENGTH;

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full flex-col overflow-hidden rounded-lg border border-[#998C5F]">
        {/* Toolbar row sits on the modal's cream bg (only the textarea is white);
            every icon cell gets a right separator, incl. the last one before the
            community-standards zone — per the Figma render. */}
        <div className="flex items-center border-b border-[#998C5F]">
          {TOOLBAR_ICONS.map(({ key, src }) => (
            <button
              key={key}
              type="button"
              aria-label={t(`kudos:toolbar.${key}`)}
              // Only C.5 (link) acts: the other five stay presentational per
              // clarification #3 (no WYSIWYG lib) and D002.
              onClick={key === "link" ? () => onAddlinkOpenChange(true) : undefined}
              className={TOOLBAR_CELL_CLASSES}
            >
              <CustomSvgIcon src={src} className="size-6" />
            </button>
          ))}
          {/* mm:I520:11647;3053:11619 — fills the rest of the 672px row (336px
              at design width), text centered, radius supplied by the wrapper. */}
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="flex h-10 flex-1 items-center justify-center px-4 text-base leading-6 font-bold tracking-[0.15px] whitespace-nowrap text-[#E46060] underline"
          >
            {t("kudos:editor.communityStandard")}
          </a>
        </div>
        {/* mms_D_text filed — fixed 200px white box, radius 0 0 8 8 via wrapper */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("kudos:editor.placeholder")}
          className="h-50 w-full resize-none bg-white px-6 py-0 text-base font-bold text-[#00101A] outline-none"
        />
      </div>
      {/* mms_D.1_Gợi ý + character counter (BR-001/FR-601: a UX signal only —
          the real 500-char control is `submitKudoAction`'s server-side check). */}
      <div className="mt-1 flex items-center justify-between">
        <p className="text-base font-bold tracking-[0.5px] text-[#00101A]">{t("kudos:editor.hint")}</p>
        <p className={`text-sm font-bold ${overLimit ? "text-[#CF1322]" : "text-[#999999]"}`}>
          {value.length}/{KUDOS_MESSAGE_MAX_LENGTH}
        </p>
      </div>
      <AddlinkBox open={addlinkOpen} onOpenChange={onAddlinkOpenChange} onInsert={insertLink} />
    </div>
  );
}
