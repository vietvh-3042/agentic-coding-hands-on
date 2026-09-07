import { KUDOS_MAX_HASHTAGS, KUDOS_MAX_IMAGES } from "@/constants";

/**
 * Shared validation rules for the write-Kudo form (Figma "Viết Kudo",
 * ihQ26W78P2) and its `submitKudoAction` server twin. Kept dependency-free
 * (no Supabase, no DOM) so both the client component and the Server Action
 * import the exact same rule set — the client renders the errors, the
 * server enforces them. BR-001/FR-601: the 500-char cap is a real control,
 * not just a UX counter, so it MUST be checked here and re-checked in the
 * action, never trusted from the client alone.
 */

/** Message body cap (clarifications.md, 2026-09-06 "gap resolution"). */
export const KUDOS_MESSAGE_MAX_LENGTH = 500;

/** BR-003: only these image types are accepted, checked by MIME and extension. */
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

/** The minimal file shape a validity check needs — satisfied by both a
 *  browser `File` and a plain `{ type, name }` literal built from `FormData`. */
export interface KudoImageFileLike {
  type: string;
  name: string;
}

/** `accept="image/*"` is a picker hint, not a validation — bypassable by
 *  drag-and-drop or "all files". Check both the reported MIME type and the
 *  file extension so a renamed `.txt` can't slip past a spoofed MIME. */
export function isAllowedImageFile(file: KudoImageFileLike): boolean {
  const dotIndex = file.name.lastIndexOf(".");
  const extension = dotIndex === -1 ? "" : file.name.slice(dotIndex).toLowerCase();
  return (
    (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type) &&
    (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension)
  );
}

/** Field-level error codes — resolved to copy via the `kudos:errors.*` i18n keys. */
export type KudoDraftErrorCode = "required" | "tooLong" | "tooMany" | "invalidType" | "notFound";

export interface KudoDraftInput {
  /** Resolved `profiles.id` of the recipient, or `null` before one is picked. */
  recipientId: string | null;
  /** "Danh hiệu" — the Kudo's own heading (Figma Frame 552, `kudos.hashtag_title`).
   *  Required by the design's `*` marker; read back as the card's category chip
   *  by both `lib/kudos/board-query-helpers.ts` and `lib/profile/feed-queries.ts`. */
  hashtagTitle: string;
  /** Raw textarea content, unescaped and untrimmed (matches what the counter shows). */
  message: string;
  /** Selected `hashtags.id` values. */
  hashtagIds: number[];
  /** Selected image files, described by MIME type + filename only. */
  images: KudoImageFileLike[];
  isAnonymous: boolean;
  anonymousName: string;
}

export interface KudoDraftFieldErrors {
  recipientId?: KudoDraftErrorCode;
  hashtagTitle?: KudoDraftErrorCode;
  message?: KudoDraftErrorCode;
  hashtagIds?: KudoDraftErrorCode;
  images?: KudoDraftErrorCode;
  anonymousName?: KudoDraftErrorCode;
}

export interface KudoDraftValidation {
  valid: boolean;
  errors: KudoDraftFieldErrors;
}

/**
 * Validates a write-Kudo draft against every FN-5 rule. Pure and synchronous
 * — existence checks (does this recipient/hashtag id actually exist) are a
 * separate, async, server-only concern (`submitKudoAction` queries the DB for
 * those) because a client-side validator cannot answer them offline.
 */
export function validateKudoDraft(input: KudoDraftInput): KudoDraftValidation {
  const errors: KudoDraftFieldErrors = {};

  if (!input.recipientId) {
    errors.recipientId = "required";
  }

  if (input.hashtagTitle.trim().length === 0) {
    errors.hashtagTitle = "required";
  }

  const trimmedMessage = input.message.trim();
  if (trimmedMessage.length === 0) {
    errors.message = "required";
  } else if (input.message.length > KUDOS_MESSAGE_MAX_LENGTH) {
    errors.message = "tooLong";
  }

  if (input.hashtagIds.length === 0) {
    errors.hashtagIds = "required";
  } else if (input.hashtagIds.length > KUDOS_MAX_HASHTAGS) {
    errors.hashtagIds = "tooMany";
  }

  if (input.images.length > KUDOS_MAX_IMAGES) {
    errors.images = "tooMany";
  } else if (input.images.some((image) => !isAllowedImageFile(image))) {
    errors.images = "invalidType";
  }

  if (input.isAnonymous && input.anonymousName.trim().length === 0) {
    errors.anonymousName = "required";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export interface AddlinkFieldErrors {
  text?: KudoDraftErrorCode;
  url?: KudoDraftErrorCode;
}

/** A5/A6/A7 — Addlink Box "Link" field: `http(s)` scheme, 5-2048 chars. */
export function isValidKudoLink(value: string): boolean {
  if (value.length < 5 || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Addlink Box validation (FN-6/A7-A9) — Text 1-100 non-whitespace, Link per `isValidKudoLink`. */
export function validateAddlinkFields(text: string, url: string): AddlinkFieldErrors {
  const errors: AddlinkFieldErrors = {};
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    errors.text = "required";
  } else if (text.length > 100) {
    errors.text = "tooLong";
  }

  if (url.length === 0) {
    errors.url = "required";
  } else if (!isValidKudoLink(url)) {
    errors.url = "invalidType";
  }

  return errors;
}
