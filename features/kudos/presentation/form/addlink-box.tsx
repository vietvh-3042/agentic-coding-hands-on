"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/primitives/dialog";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";
import { validateAddlinkFields, type AddlinkFieldErrors } from "@/features/kudos/domain/validation";

// base `no-unused-vars` cannot see these are type-only parameter names, not
// real declarations — see eslint.config.mjs's own note on the same limitation.
/* eslint-disable no-unused-vars */
export interface AddlinkBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires only on a successful "Lưu" — never on Hủy/Escape/backdrop. */
  onInsert: (text: string, url: string) => void;
}
/* eslint-enable no-unused-vars */

const INITIAL_FIELDS = { text: "", url: "" };

/**
 * Addlink Box — MoMorph "Add link" (screen OyDLDuSGEa, node 1002:12917). The
 * one toolbar button that never had a handler (A7-A9). Built on the shared
 * shadcn/Base UI `Dialog` — its Popup already handles Escape and backdrop
 * dismissal, so "Hủy/Escape/backdrop discard" (FN-6) needs no hand-rolled
 * listeners, only a plain `DialogClose` for the Hủy button. Single-instance:
 * the caller (`KudosContentEditor`) renders exactly one `AddlinkBox` gated by
 * one `open` boolean, mirroring `KudosFormModal`'s own gate.
 */
export default function AddlinkBox({ open, onOpenChange, onInsert }: AddlinkBoxProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState<AddlinkFieldErrors>({});

  // Reset the draft whenever the box transitions to open — adjusted during
  // render with a prev-open guard (react.dev's recommended alternative to a
  // sync effect) rather than an effect keyed on `open`.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setFields(INITIAL_FIELDS);
      setErrors({});
    }
  }

  const validateOnBlur = (field: "text" | "url") => {
    setErrors((prev) => ({ ...prev, [field]: validateAddlinkFields(fields.text, fields.url)[field] }));
  };

  const handleSave = () => {
    const nextErrors = validateAddlinkFields(fields.text, fields.url);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onInsert(fields.text.trim(), fields.url.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-188 flex-col gap-6 rounded-3xl border border-[#998C5F] bg-[#FFF8E1] p-10 sm:max-w-188"
      >
        <DialogTitle className="text-center text-[32px] leading-10 font-bold text-[#00101A]">
          {t("kudos:addlink.title")}
        </DialogTitle>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <label
              htmlFor="addlink-text"
              className="max-w-34.75 shrink-0 text-[22px] leading-7 font-bold text-[#00101A]"
            >
              {t("kudos:addlink.textLabel")}
            </label>
            <input
              id="addlink-text"
              type="text"
              // No native `maxLength` — the 100-char cap is a real validation
              // rule (`validateAddlinkFields`), not truncation. A hard
              // `maxLength` would silently swallow the overflow instead of
              // ever letting the user (or a test) see the "too long" error.
              value={fields.text}
              onChange={(event) => setFields((f) => ({ ...f, text: event.target.value }))}
              onBlur={() => validateOnBlur("text")}
              className={`h-14 flex-1 rounded-lg border bg-white px-6 text-base font-bold text-[#00101A] outline-none ${
                errors.text ? "border-[#CF1322]" : "border-[#998C5F]"
              }`}
            />
          </div>
          {errors.text && (
            <p className="ml-38.75 text-sm font-bold text-[#CF1322]">{t(`kudos:addlink.errors.text.${errors.text}`)}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <label
              htmlFor="addlink-url"
              className="max-w-34.75 shrink-0 text-[22px] leading-7 font-bold text-[#00101A]"
            >
              {t("kudos:addlink.linkLabel")}
            </label>
            <input
              id="addlink-url"
              type="text"
              // No native `maxLength` here either — same reasoning as Text above.
              value={fields.url}
              onChange={(event) => setFields((f) => ({ ...f, url: event.target.value }))}
              onBlur={() => validateOnBlur("url")}
              className={`h-14 flex-1 rounded-lg border bg-white px-6 text-base font-bold text-[#00101A] outline-none ${
                errors.url ? "border-[#CF1322]" : "border-[#998C5F]"
              }`}
            />
          </div>
          {errors.url && (
            <p className="ml-38.75 text-sm font-bold text-[#CF1322]">{t(`kudos:addlink.errors.url.${errors.url}`)}</p>
          )}
        </div>

        <div className="flex items-stretch gap-6">
          <DialogClose
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded border border-[#998C5F] bg-[#FFEA9E]/10 px-10 py-4 text-lg font-bold text-[#00101A] hover:bg-[#FFEA9E]/20"
              />
            }
          >
            {t("kudos:cancel")}
            <span aria-hidden>✕</span>
          </DialogClose>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFEA9E] p-4 text-lg font-bold text-[#00101A] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,234,158,0.45)]"
          >
            {t("kudos:addlink.save")}
            <CustomSvgIcon src="/kudos/icons/link.svg" className="size-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
