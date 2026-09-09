import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/shared/infrastructure/supabase/server";
import { isBeforeLaunch } from "@/features/countdown/domain/config";

/**
 * OAuth code-exchange callback for Supabase Google sign-in.
 *
 * Reads exactly one inbound parameter — `code` — and reflects none back into
 * any redirect target. This is a deliberate open-redirect countermeasure
 * (DEC-001): the post-login destination is always recomputed here from
 * `isBeforeLaunch()`, never taken from the request (no `next` param is ever
 * read or honored).
 *
 * Any missing `code` or a failed exchange collapses to the same opaque
 * `/login?error=oauth_failed` redirect (DEC-003) — cancel, deny, expired
 * code, and a missing code are indistinguishable to the client on purpose.
 */

/**
 * Every exit from this route uses `redirect()` from `next/navigation`, which
 * emits a HOST-RELATIVE `Location` — never an absolute URL.
 *
 * This is load-bearing, not stylistic. Both `new URL(request.url).origin` and
 * `request.nextUrl` resolve to the server's OWN configured hostname under
 * `next start` (`localhost:3000`) and ignore the inbound Host header — verified
 * with `curl -H "Host: 127.0.0.1:3000"`, which still produced a
 * `http://localhost:3000/...` Location. Building an absolute redirect from
 * either would send a user who signed in at `http://127.0.0.1:3000` over to
 * `localhost:3000`. Cookies are host-scoped, so the session cookie just written
 * for `127.0.0.1` would never be sent back, the proxy guard would see no user,
 * and they would bounce to /login — sign-in silently never sticking, on one of
 * the two hosts this app is reachable on.
 *
 * A relative Location keeps the browser on whichever host it was already using.
 */
/**
 * Exchanges the OAuth code for a session, converting BOTH failure shapes into
 * one boolean.
 *
 * `exchangeCodeForSession` normally reports failure via `{ error }`, but it can
 * also throw outright — a network failure reaching GoTrue, a malformed
 * response, or the `handle_new_user` trigger erroring on first sign-in. Route
 * Handlers are NOT covered by `error.tsx` boundaries, so an escaping exception
 * becomes a bare 500 instead of the `/login?error=oauth_failed` redirect this
 * route promises (DEC-003).
 *
 * Kept as its own function so the try/catch cannot accidentally enclose a
 * `redirect()` call: `redirect()` signals by THROWING `NEXT_REDIRECT`, so
 * catching around one would swallow the redirect and break the route.
 */
async function exchangeCode(code: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  } catch {
    // Deliberately opaque: cancel, deny, expired code, and an infrastructure
    // fault are all indistinguishable to the client (DEC-003).
    return false;
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const signedIn = code ? await exchangeCode(code) : false;

  if (signedIn) {
    redirect(isBeforeLaunch() ? "/countdown" : "/about");
  }

  redirect("/login?error=oauth_failed");
}
