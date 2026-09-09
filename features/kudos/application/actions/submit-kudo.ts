"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/infrastructure/supabase/server";
import { uploadKudoImages } from "@/features/kudos/infrastructure/upload-kudo-images";
import { validateKudoDraft, type KudoDraftFieldErrors } from "@/features/kudos/domain/validation";

/** Never thrown to the client (FN-5) — every failure path returns this shape. */
export type SubmitKudoResult = { ok: true } | { ok: false; error: string; fieldErrors?: KudoDraftFieldErrors };

function parseHashtagIds(formData: FormData): number[] {
  return formData
    .getAll("hashtagIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));
}

/**
 * Boundary parse: every field arrives as an untrusted `FormDataEntryValue`
 * and is coerced defensively rather than cast. No explicit return type here
 * on purpose — `images` stays typed as `File[]` (a `KudoImageFileLike[]`
 * subtype) so `uploadKudoImages` below can still call `.upload()` on each
 * entry, while `validateKudoDraft` only ever reads the shared `.type`/`.name`
 * shape.
 */
function parseDraft(formData: FormData) {
  const recipientIdRaw = formData.get("recipientId");
  const hashtagTitleRaw = formData.get("hashtagTitle");
  const messageRaw = formData.get("message");
  const anonymousNameRaw = formData.get("anonymousName");

  return {
    recipientId: typeof recipientIdRaw === "string" && recipientIdRaw.length > 0 ? recipientIdRaw : null,
    hashtagTitle: typeof hashtagTitleRaw === "string" ? hashtagTitleRaw : "",
    message: typeof messageRaw === "string" ? messageRaw : "",
    hashtagIds: parseHashtagIds(formData),
    images: formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0),
    isAnonymous: formData.get("isAnonymous") === "true",
    anonymousName: typeof anonymousNameRaw === "string" ? anonymousNameRaw : "",
  };
}

/**
 * Submits one write-Kudo draft: getUser() → re-validate every FN-5 rule
 * (recipient/hashtags existence included, not just shape) → upload images →
 * insert `kudos` → insert `kudo_hashtags` → revalidate the board.
 *
 * FR-602 is enforced structurally: `sender_id` is never read from `formData`,
 * only from the session `getUser()` resolves.
 */
export async function submitKudoAction(formData: FormData): Promise<SubmitKudoResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "unauthenticated" };
  }

  const draft = parseDraft(formData);
  const { valid, errors } = validateKudoDraft(draft);
  if (!valid) {
    return { ok: false, error: "validation", fieldErrors: errors };
  }

  // FN-5: a client-supplied id is a claim, not a fact — confirm the
  // recipient and every hashtag id genuinely exist before writing anything.
  const { data: recipient, error: recipientError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", draft.recipientId as string)
    .maybeSingle();

  if (recipientError || !recipient || typeof recipient.id !== "string") {
    return { ok: false, error: "validation", fieldErrors: { recipientId: "notFound" } };
  }

  const { data: matchedHashtags, error: hashtagError } = await supabase
    .from("hashtags")
    .select("id")
    .in("id", draft.hashtagIds);

  const matchedCount = (matchedHashtags ?? []).filter(
    (row): row is { id: number } => typeof row?.id === "number",
  ).length;

  if (hashtagError || matchedCount !== draft.hashtagIds.length) {
    return { ok: false, error: "validation", fieldErrors: { hashtagIds: "notFound" } };
  }

  let uploaded: Awaited<ReturnType<typeof uploadKudoImages>>;
  try {
    uploaded = await uploadKudoImages(supabase, user.id, draft.images);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "upload-failed" };
  }

  const { data: kudo, error: insertError } = await supabase
    .from("kudos")
    .insert({
      sender_id: user.id,
      receiver_id: recipient.id,
      // "Danh hiệu" (Figma Frame 552) — the Kudo's own heading. Previously
      // never written, so every kudo authored in-app fell back to the column
      // default ('') and rendered with an empty category chip on the board
      // and profile feeds.
      hashtag_title: draft.hashtagTitle.trim(),
      // Stored as plain trimmed text — no HTML wrapper/escaping. React
      // already escapes any string child on render, and the shared render
      // path (`lib/kudos/render-kudo-message.tsx`) only ever builds React
      // elements from this string, never `dangerouslySetInnerHTML`, so a
      // `<script>` payload here can never become live markup either way.
      message: draft.message.trim(),
      is_anonymous: draft.isAnonymous,
      anonymous_name: draft.isAnonymous ? draft.anonymousName.trim() : null,
      image_urls: uploaded.map((image) => image.publicUrl),
    })
    .select("id")
    .single();

  if (insertError || !kudo) {
    return { ok: false, error: insertError?.message ?? "insert-failed" };
  }

  const { error: joinError } = await supabase
    .from("kudo_hashtags")
    .insert(draft.hashtagIds.map((hashtagId) => ({ kudo_id: kudo.id, hashtag_id: hashtagId })));

  if (joinError) {
    // The kudo itself is safely stored; an untagged kudo is visible-but-
    // unfiltered, not corrupt (phase-07 Key Insights) — log and move on
    // rather than rolling back a successful, user-visible write.
    console.warn(`submitKudoAction: kudo ${kudo.id} inserted but kudo_hashtags failed: ${joinError.message}`);
  }

  revalidatePath("/sun-kudos");
  return { ok: true };
}
