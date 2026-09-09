import type { createClient } from "@/shared/infrastructure/supabase/server";

/** The client shape `createClient()` in `lib/supabase/server.ts` resolves to —
 *  typed off that factory directly since the `<Database>` generic isn't
 *  threaded through it (a known gap; see `lib/kudos/hashtags.ts`). */
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const KUDOS_IMAGES_BUCKET = "kudos-images";

export interface UploadedKudoImage {
  /** Storage object path, `{userId}/{uuid}-{filename}`. */
  path: string;
  /** Public URL, stored on the `kudos.image_urls` row. */
  publicUrl: string;
}

/**
 * Best-effort cleanup for a partially-uploaded batch. No storage DELETE
 * policy is asserted for this bucket beyond the caller's own prefix scoping
 * on INSERT, so a delete failure here is logged and swallowed rather than
 * thrown — an orphaned object in a public demo bucket is cosmetic, but a
 * `kudos` row with a partial `image_urls` would not be (see phase-07 risk
 * assessment).
 */
async function rollbackKudoImages(supabase: SupabaseServerClient, uploaded: UploadedKudoImage[]): Promise<void> {
  if (uploaded.length === 0) return;

  const { error } = await supabase.storage.from(KUDOS_IMAGES_BUCKET).remove(uploaded.map((image) => image.path));

  if (error) {
    console.warn(
      `uploadKudoImages: rollback delete failed, ${uploaded.length} object(s) orphaned under ` +
        `${KUDOS_IMAGES_BUCKET}/: ${error.message}`,
    );
  }
}

/**
 * Uploads every selected file to the caller's own `{userId}/…` prefix in the
 * public `kudos-images` bucket (the storage INSERT policy already scopes
 * writes there — see `20260716100000_write_kudos.sql`). Uploads happen
 * BEFORE the `kudos` row is inserted: if any file fails partway through, the
 * already-uploaded objects are deleted (best-effort) and the error is
 * rethrown, so no `kudos` row is ever written with a partial `image_urls`.
 *
 * Uploads are deliberately sequential (each `file` waits on the previous
 * one via `Array.prototype.reduce`, not a `for` loop — this project's lint
 * config bans loop statements in favor of array iteration) so a failure on
 * file N never leaves file N+1 dangling mid-upload.
 */
export async function uploadKudoImages(
  supabase: SupabaseServerClient,
  userId: string,
  files: File[],
): Promise<UploadedKudoImage[]> {
  return files.reduce<Promise<UploadedKudoImage[]>>(async (uploadedSoFarPromise, file) => {
    const uploaded = await uploadedSoFarPromise;
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(KUDOS_IMAGES_BUCKET).upload(path, file, {
      contentType: file.type,
    });

    if (error) {
      await rollbackKudoImages(supabase, uploaded);
      throw new Error(`uploadKudoImages: failed to upload "${file.name}": ${error.message}`);
    }

    const { data } = supabase.storage.from(KUDOS_IMAGES_BUCKET).getPublicUrl(path);
    return [...uploaded, { path, publicUrl: data.publicUrl }];
  }, Promise.resolve([]));
}
