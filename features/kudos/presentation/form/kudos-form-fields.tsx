"use client";

import { useTranslation } from "react-i18next";
import type { Hashtag } from "@/features/kudos/domain/types";
import type { KudoDraftFieldErrors } from "@/features/kudos/domain/validation";
import KudosRecipientSelect, { type KudosRecipient } from "./kudos-recipient-select";
import KudosHashtagInput from "./kudos-hashtag-input";
import KudosImageUpload, { type KudosImagePreview } from "./kudos-image-upload";
import KudosTitleInput from "./kudos-title-input";
import { FieldLabel, FieldError } from "./kudos-field-label";

export interface KudosFormState {
  recipient: KudosRecipient | null;
  /** "Danh hiệu" (Figma Frame 552) — persisted as `kudos.hashtag_title`. */
  kudoTitle: string;
  content: string;
  hashtagIds: number[];
  images: KudosImagePreview[];
  anonymous: boolean;
  anonymousName: string;
}

export const INITIAL_KUDOS_FORM: KudosFormState = {
  recipient: null,
  kudoTitle: "",
  content: "",
  hashtagIds: [],
  images: [],
  anonymous: false,
  anonymousName: "",
};

/** The draft a freshly-opened form starts from: `INITIAL_KUDOS_FORM`, plus a
 *  pre-selected recipient when the caller already knows who is being thanked
 *  (the profile write-Kudo bar — `TC_WEB_PROFILE_FUN_007`). Lives here beside
 *  `INITIAL_KUDOS_FORM` so every "what does a blank draft look like" answer
 *  stays in one file. */
export function initialFormWithRecipient(recipient: KudosRecipient | null): KudosFormState {
  return recipient ? { ...INITIAL_KUDOS_FORM, recipient } : INITIAL_KUDOS_FORM;
}

/** Builds the `FormData` `submitKudoAction` expects from the draft state —
 *  kept alongside `KudosFormState` so the two shapes never drift apart. */
export function buildKudoSubmitFormData(form: KudosFormState): FormData {
  const formData = new FormData();
  formData.set("recipientId", form.recipient?.id ?? "");
  formData.set("hashtagTitle", form.kudoTitle);
  formData.set("message", form.content);
  form.hashtagIds.forEach((id) => formData.append("hashtagIds", String(id)));
  formData.set("isAnonymous", String(form.anonymous));
  formData.set("anonymousName", form.anonymousName);
  form.images.forEach((image) => {
    if (image.file) formData.append("images", image.file);
  });
  return formData;
}

function setFormField<K extends keyof KudosFormState>(
  onChange: KudosFormFieldsProps["onChange"],
  field: K,
  value: KudosFormState[K],
) {
  onChange((previous) => ({ ...previous, [field]: value }));
}

// base `no-unused-vars` cannot see `updater`/`prev` below are type-only
// parameter names, not real declarations — see eslint.config.mjs's own note
// on the same limitation.
/* eslint-disable no-unused-vars */
export interface KudosFormFieldsProps {
  /** The 13 canonical rows, resolved once on the page and passed down. */
  hashtags: Hashtag[];
  form: KudosFormState;
  errors: KudoDraftFieldErrors;
  /** `KudosContentEditor` (plus its own message error), injected rather than
   *  imported so this file owns the design's field ORDER while the modal keeps
   *  ownership of the editor's Addlink state. Figma puts the editor inside the
   *  "Content" group (I520:11647;520:9874) above hashtag and image — not after
   *  them, and not after the anonymous row. */
  editor: React.ReactNode;
  onChange: (updater: (prev: KudosFormState) => KudosFormState) => void;
}
/* eslint-enable no-unused-vars */

/**
 * Every field row of `KudosFormModal`, in the order Figma lays them out
 * (I520:11647): recipient -> Danh hiệu -> Content group (editor, hashtag,
 * image) -> anonymous. Extracted so the modal itself stays under the 200-line
 * budget (phase-07 NFR-1). Pure presentation over the parent-owned `form`
 * state; every field reports back through the single `onChange` updater so the
 * parent keeps one source of truth.
 */
export default function KudosFormFields({ hashtags, form, errors, editor, onChange }: KudosFormFieldsProps) {
  const { t } = useTranslation();
  const updateField = <K extends keyof KudosFormState>(field: K, value: KudosFormState[K]) =>
    setFormField(onChange, field, value);

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <FieldLabel required fixed>
            {t("kudos:recipient.label")}
          </FieldLabel>
          <KudosRecipientSelect
            value={form.recipient}
            invalid={!!errors.recipientId}
            onSelect={(recipient) => updateField("recipient", recipient)}
          />
        </div>
        {errors.recipientId && <FieldError>{t(`kudos:errors.recipient.${errors.recipientId}`)}</FieldError>}
      </div>

      {/* mm:I520:11647;1688:10448 (Frame 552) — "Danh hiệu", the Kudo's own heading. */}
      <KudosTitleInput
        value={form.kudoTitle}
        error={errors.hashtagTitle}
        onChange={(kudoTitle) => updateField("kudoTitle", kudoTitle)}
      />

      {/* mm:I520:11647;520:9874 ("Content") — editor, hashtag and image share a
          24px rhythm, tighter than the modal's own 32px between field groups. */}
      <div className="flex w-full flex-col gap-6">
        {editor}

        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <FieldLabel required>{t("kudos:hashtag.label")}</FieldLabel>
            <KudosHashtagInput
              hashtags={hashtags}
              tags={form.hashtagIds}
              onChange={(hashtagIds) => updateField("hashtagIds", hashtagIds)}
            />
          </div>
          {errors.hashtagIds && <FieldError>{t(`kudos:errors.hashtag.${errors.hashtagIds}`)}</FieldError>}
        </div>

        <div className="flex items-center gap-4">
          <FieldLabel>{t("kudos:image.label")}</FieldLabel>
          <KudosImageUpload images={form.images} onChange={(images) => updateField("images", images)} />
        </div>
      </div>

      {/* mms_G_Gửi ẩn danh (send anonymously) — 22px bold gray label per Figma */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-4 text-[22px] leading-7 font-bold text-[#999999]">
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                anonymous: event.target.checked,
                anonymousName: event.target.checked ? previous.anonymousName : "",
              }))
            }
            // `[color-scheme:light]` is required, not cosmetic: globals.css sets
            // `color-scheme: dark` site-wide, which paints the native box dark
            // — wrong on this modal's cream surface (Figma: white fill, #999
            // border, 4px radius).
            className="size-6 shrink-0 rounded border border-[#999999] accent-[#FFEA9E] scheme-light"
          />
          {t("kudos:anonymous")}
        </label>

        {form.anonymous && (
          <div className="flex flex-col gap-2 pl-10">
            <input
              type="text"
              value={form.anonymousName}
              onChange={(event) => updateField("anonymousName", event.target.value)}
              placeholder={t("kudos:anonymousName.placeholder")}
              className={`h-14 rounded-lg border bg-white px-6 text-base font-bold text-[#00101A] outline-none ${
                errors.anonymousName ? "border-[#CF1322]" : "border-[#998C5F]"
              }`}
            />
            {errors.anonymousName && <FieldError>{t(`kudos:errors.anonymousName.${errors.anonymousName}`)}</FieldError>}
          </div>
        )}
      </div>
    </>
  );
}
