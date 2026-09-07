"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { useTranslation } from "react-i18next";
import type { Hashtag } from "@/lib/kudos/types";
import type { KudoDraftFieldErrors } from "@/lib/kudos/kudo-validation";
import { submitKudoAction } from "@/app/sun-kudos/actions/submit-kudo";
import KudosContentEditor from "./kudos-content-editor";
import KudosFormActions from "./kudos-form-actions";
import KudosFormFields, { buildKudoSubmitFormData, type KudosFormState } from "./kudos-form-fields";
import { initialFormWithRecipient } from "./kudos-form-fields";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
});

export interface KudosFormModalProps {
  open: boolean;
  onClose: () => void;
  /** The 13 canonical rows for the hashtag picker (`getHashtags()`, resolved
   *  once on the server and threaded down — this file never fetches them
   *  itself). Optional so existing callers that don't supply it yet still
   *  compile; without it the picker simply has no rows to offer. */
  hashtags?: Hashtag[];
  /** Pre-selects the recipient for entry points that already know who is
   *  being thanked — the profile write-Kudo bar (`TC_WEB_PROFILE_FUN_007`).
   *  `null` by default, so the homepage/board compose flows are unchanged.
   *  The field stays editable and no suggestion list opens over it. */
  recipient?: KudosFormState["recipient"];
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

/**
 * Write-KUDOS form modal — Figma "Viết Kudo" (fileKey 9ypp4enmFmdK3YAFJLIu6C,
 * screenId ihQ26W78P2, node 520:11602). Centered dialog over a dimmed
 * backdrop, mirrors the SaaRulesDrawer shell pattern (Esc-close, body-scroll-
 * lock). Submits through the real `submitKudoAction` Server Action; the
 * field rows and blank-draft helpers live in `KudosFormFields` to keep this
 * file under the 200-line budget.
 */
export default function KudosFormModal({ open, onClose, hashtags = [], recipient = null }: KudosFormModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState<KudosFormState>(() => initialFormWithRecipient(recipient));
  const [errors, setErrors] = useState<KudoDraftFieldErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [addlinkOpen, setAddlinkOpen] = useState(false);

  const handleClose = () => {
    form.images.forEach((img) => URL.revokeObjectURL(img.url));
    setForm(initialFormWithRecipient(recipient));
    setErrors({});
    setStatus("idle");
    onClose();
  };

  const isValid = useMemo(
    () =>
      form.recipient !== null &&
      form.kudoTitle.trim() !== "" &&
      form.content.trim() !== "" &&
      form.hashtagIds.length > 0 &&
      (!form.anonymous || form.anonymousName.trim() !== ""),
    [form.anonymous, form.anonymousName, form.content, form.hashtagIds.length, form.kudoTitle, form.recipient],
  );

  // Lock body scroll while the modal is open (mirrors SaaRulesDrawer).
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Esc closes — but only when the Addlink Box isn't the one open on top of
  // this modal; otherwise its own Escape handling would fire alongside ours
  // and close both dialogs on the same keypress. No dep array: re-subscribing
  // each render is a cheap listener swap and keeps handleClose/addlinkOpen
  // (both recreated per render) always current.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !addlinkOpen) handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Reset the draft on every open — blank, or just the caller's `recipient`.
  // No "edit" flow exists (no UPDATE policy on `kudos`; a pre-filled resubmit
  // would create a second row). Pre-selecting WHO is thanked is not an edit.
  // Adjusted during render via a prev-open guard (react.dev's recommended
  // alternative) rather than setState inside a useEffect body.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setForm(initialFormWithRecipient(recipient));
      setErrors({});
      setStatus("idle");
    }
  }

  // No client-side re-run of `validateKudoDraft` here on purpose (BR-001/
  // FR-601): the message-length counter is UX only, so this handler always
  // calls the real Server Action — `submitKudoAction` is the sole enforcer
  // of the 500-char cap and every other FN-5 rule. `isValid` above only
  // gates the button on the *required-field* rules (FN-7), not on length.
  const handleSubmit = async () => {
    setStatus("submitting");
    const result = await submitKudoAction(buildKudoSubmitFormData(form));
    if (!result.ok) {
      setStatus("error");
      setErrors(result.fieldErrors ?? {});
      return;
    }

    setStatus("success");
    router.refresh();
    window.setTimeout(() => handleClose(), 1200);
  };

  return (
    <div
      aria-hidden={!open}
      // z-40, deliberately BELOW the shared shadcn Dialog's z-50 (see
      // components/ui/dialog.tsx) — the Addlink Box renders through that
      // primitive and must stack above this hand-rolled shell, not under it.
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("kudos:title")}
        className={`${montserrat.className} relative flex max-h-[90vh] w-full max-w-188 flex-col gap-8 overflow-y-auto rounded-[24px] bg-[#FFF8E1] p-10 shadow-2xl transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-2xl font-bold text-[#00101A]">✓ {t("kudos:success")}</p>
          </div>
        ) : (
          <>
            <h2 className="text-center text-[32px] leading-10 font-bold text-[#00101A]">{t("kudos:title")}</h2>

            {/* Editor as a slot: Figma puts it inside the "Content" group above
                hashtag/image, but its Addlink open-state must stay owned here
                (the Escape handler above reads it). */}
            <KudosFormFields
              hashtags={hashtags}
              form={form}
              errors={errors}
              onChange={(updater) => setForm(updater)}
              editor={
                <div className="flex w-full flex-col gap-2">
                  <KudosContentEditor
                    value={form.content}
                    onChange={(content) => setForm((f) => ({ ...f, content }))}
                    addlinkOpen={addlinkOpen}
                    onAddlinkOpenChange={setAddlinkOpen}
                  />
                  {errors.message && (
                    <p className="text-center text-sm font-bold text-[#CF1322]">
                      {t(`kudos:errors.message.${errors.message}`)}
                    </p>
                  )}
                </div>
              }
            />

            {status === "error" && !Object.keys(errors).length && (
              <p className="text-center text-base font-bold text-[#CF1322]">{t("kudos:errors.generic")}</p>
            )}

            <KudosFormActions
              canSubmit={isValid}
              submitting={status === "submitting"}
              onCancel={handleClose}
              onSubmit={() => {
                handleSubmit();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
