import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client factory for Server Components, Route Handlers,
 * and Server Actions. `cookies()` is async in Next.js 15/16 — must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // `setAll` was called from a Server Component, which cannot write
          // cookies (a Next.js constraint, not a Supabase quirk). Safe to
          // swallow only because proxy.ts refreshes the session cookie on
          // every request — that refresh, not this one, is what keeps the
          // session alive.
        }
      },
    },
  });
}
