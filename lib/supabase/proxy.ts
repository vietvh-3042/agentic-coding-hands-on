import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBeforeLaunch } from "@/lib/countdown-config";

/**
 * A path is public when it does not require authentication: the login page
 * itself and anything under /auth (the OAuth callback route family). Every
 * other path reachable through the proxy matcher is protected. Single source
 * of truth, shared by both the unauthenticated and authenticated branches
 * below — do not duplicate this list.
 */
function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/auth");
}

/**
 * Builds a redirect that PRESERVES any cookies Supabase refreshed during this
 * request.
 *
 * `getUser()` can rotate the access/refresh token, in which case the cookie
 * adapter's `setAll` has already written the new pair onto `supabaseResponse`.
 * Returning a bare `NextResponse.redirect()` would discard them and leave the
 * browser holding the pre-rotation refresh token. With
 * `enable_refresh_token_rotation = true` in supabase/config.toml that old
 * token is invalid once the reuse interval lapses, so the very next request
 * fails to refresh and the user is silently signed out — the "randomly logged
 * out" failure this module's cookie handling exists to prevent.
 */
function redirectPreservingCookies(request: NextRequest, pathname: string, source: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/**
 * Refreshes the Supabase session cookie on every request and enforces the
 * route guard. Returns the exact `supabaseResponse` object built during the
 * cookie refresh unless a redirect is required — constructing any other
 * response without copying `supabaseResponse`'s cookies onto it first would
 * desync browser and server auth state and log users out at random.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Write to the *request* so downstream code in this same
          //    invocation (the getUser() call below) sees fresh cookies.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 2. Rebuild the response from the mutated request, then write the
          //    same cookies onto the *response* so the browser gets them too.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient() and the call below. A
  // simple mistake here can make it very hard to debug users being randomly
  // logged out. auth.getUser() is used deliberately — it re-verifies the
  // token against the Auth server rather than trusting the locally-stored,
  // unverified session cookie the way a lighter-weight read would.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    return redirectPreservingCookies(request, "/login", supabaseResponse);
  }

  if (user && pathname === "/login") {
    return redirectPreservingCookies(request, isBeforeLaunch() ? "/countdown" : "/about", supabaseResponse);
  }

  // Rebuilding NextResponse.next({ request }) above carries forward every
  // cookie already on the request (including NEXT_LOCALE, set client-side by
  // the language selector) — no separate copy step is needed here.
  return supabaseResponse;
}
