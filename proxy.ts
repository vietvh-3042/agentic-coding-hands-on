import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts -> proxy.ts and the exported function
// middleware -> proxy. Proxy always executes on the Node.js server — this
// file and its config deliberately omit any execution-environment override,
// since setting one throws.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Excludes ALL of `_next` (and the `__nextjs*` dev endpoints), not just
  // `_next/static` and `_next/image`.
  //
  // Only excluding those two left Next's dev-only endpoints inside the
  // matcher, so the auth guard answered them: `/_next/hmr` got a 307 to
  // `/login`, which fails the WebSocket handshake
  // (`ERR_INVALID_HTTP_RESPONSE`) and takes HMR and the error overlay with
  // it. The visible symptom is worse than a missing refresh — under
  // `pnpm dev` the page renders but never hydrates, so every menu, dropdown
  // and modal is inert. Production was unaffected (these endpoints only
  // exist in dev), which is exactly why the E2E suite never caught it: its
  // `webServer` runs `pnpm build && pnpm start`.
  //
  // This does NOT widen access to any protected page. Nothing under `_next`
  // is an application route, and App Router client navigations fetch their
  // RSC payload from the route path itself (`/profile?_rsc=…`), which the
  // matcher still covers — so `updateSession` keeps guarding every real
  // route.
  matcher: ["/((?!_next|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
