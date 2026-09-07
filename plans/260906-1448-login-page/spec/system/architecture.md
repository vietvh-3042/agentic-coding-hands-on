---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Architecture

> **Draft scope:** this narrative currently covers the authentication layer introduced by the
> Google Sign-In feature (F000_GoogleSignIn, draft) — the route guard, Supabase client
> factories, the OAuth callback route, and the session/cookie trust boundary. It does not
> describe the rest of the application's architecture; a full pass is a Core reconcile task once
> this and any other architecture-touching feature ships.

## System Architecture

```mermaid
graph TB
    subgraph "Browser"
        A[Login screen client components]
    end
    subgraph "Next.js 16 App Router — Node.js runtime"
        P["proxy.ts (planned) — session refresh + route guard"]
        CB["app/auth/callback/route.ts (planned) — code exchange"]
        SC["lib/supabase/server.ts (planned) — server client factory"]
        BC["lib/supabase/client.ts (planned) — browser client factory"]
        RSC[Protected route Server Components]
    end
    subgraph "Supabase — local stack"
        GT[Supabase Auth / GoTrue]
    end
    G[Google OAuth consent]

    A -->|signInWithOAuth via BC| GT
    GT --> G
    G -->|redirect w/ code or error| GT
    GT -->|redirect w/ code or error| CB
    CB -->|exchangeCodeForSession via SC| GT
    A -->|every request| P
    P -->|getUser via SC| GT
    RSC -->|getUser via SC| GT
```

## Tech Stack

| Layer                      | Technology                                                                     | Version              |
| -------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| Frontend                   | Next.js App Router, React                                                      | 16.3.1, 19.2.8       |
| Auth client (cookie-aware) | `@supabase/ssr`                                                                | ^0.12.6              |
| Auth client (core JS)      | `@supabase/supabase-js`                                                        | ^2.115.0             |
| Auth provider              | Supabase Auth (GoTrue) + Google OAuth                                          | local Supabase stack |
| Session transport          | HTTP cookie, `base64-`-prefixed (`sb-<project-ref>-auth-token`)                | —                    |
| Route guard                | `proxy.ts` (Next.js 16 Proxy, Node.js runtime — the `middleware.ts` successor) | Next.js 16.0.0+      |

## Data Flow

```mermaid
sequenceDiagram
    actor U as Sun* member
    participant Login as Login screen (browser)
    participant BC as Browser Supabase client (planned)
    participant GT as Supabase Auth (GoTrue)
    participant Google as Google OAuth
    participant CB as app/auth/callback/route.ts (planned)
    participant Proxy as proxy.ts (planned)

    U->>Login: click "LOGIN With Google"
    Login->>BC: signInWithOAuth({ provider: "google", redirectTo })
    BC->>GT: redirect to /auth/v1/authorize
    GT->>Google: redirect to Google consent
    Google-->>GT: redirect with code (or error on cancel/deny)
    GT-->>CB: redirect to /auth/callback?code=...
    CB->>GT: exchangeCodeForSession(code)
    GT-->>CB: session (access/refresh token)
    CB-->>U: redirect to /countdown or /about, session cookie set
    U->>Proxy: subsequent request to any protected route
    Proxy->>GT: getUser() (re-verify, never trust the cookie alone)
    GT-->>Proxy: user or null
    Proxy-->>U: allow, or redirect to /login
```

## Deployment View

N/A — no infrastructure-as-code found in this repository for the login/auth layer; the local
Supabase stack runs via the `supabase` CLI (Docker), not a checked-in docker-compose, Dockerfile,
or k8s manifest.

## Trust Boundaries

- **Browser ↔ Supabase Auth (GoTrue):** the only party that ever handles the Google OAuth code
  exchange is GoTrue — the app's own callback route only exchanges GoTrue's second-hop code, per
  the 3-hop flow above. `GOOGLE_CLIENT_SECRET` never reaches Next.js code; it is read by
  `supabase/config.toml`'s `env()` from a root `.env`, consumed entirely inside the Supabase CLI
  stack.
- **Proxy vs. Server Components:** the route guard's redirect is a UX convenience, not the only
  authorization boundary — a matcher change or a route moved outside its coverage could silently
  drop the guard. Every Server Component / Route Handler on a protected route independently calls
  `getUser()` (never `getSession()`) rather than trusting the proxy alone.
- **Cookie propagation:** `@supabase/ssr`'s `setAll` cookie adapter inside `proxy.ts` must write
  to both the mutated `request` and the rebuilt `NextResponse` — building a fresh `NextResponse`
  without copying the prior one's cookies desyncs browser and server auth state. The
  `NEXT_LOCALE` cookie set by the language selector must survive that same rebuild.

## Source References

TBD (draft) — `proxy.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, and
`app/auth/callback/route.ts` do not exist yet; this narrative is authored from the verified
`@supabase/ssr` v0.12 / Next.js 16 reference implementation documented in
`plans/260702-1448-login-page/research/researcher-260906-1503-supabase-google-oauth-next16.md`,
not from source in this repository. Existing, already-shipped files this layer builds on:
`components/login/hero-section.tsx:25-27` (current no-auth stand-in `onClick`),
`components/login/google-login-button.tsx:19-54` (loading/disabled UI already wired),
`app/layout.tsx:37-38` (the `NEXT_LOCALE` cookie read the proxy's rebuild must not break).
