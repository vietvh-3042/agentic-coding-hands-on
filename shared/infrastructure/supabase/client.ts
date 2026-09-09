import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client factory. Create a fresh client inside each
 * component/handler that needs it — do not hoist to a module-level singleton,
 * per the official example's guidance for serverless/edge runtimes.
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
