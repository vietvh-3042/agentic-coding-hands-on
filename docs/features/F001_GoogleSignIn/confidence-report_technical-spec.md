---
source_artifact: docs/features/F001_GoogleSignIn/technical-spec.md
claims_total: 14
claims_with_evidence: 13
confidence_derived: 0.9286
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F001_GoogleSignIn/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                                                                       | Section              | Evidence (file:line)                                                 | Status ○/△ |
| --------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------- | ---------- |
| (unlabeled claim)                                                           | 3. Actions           | app/page.tsx:1-9                                                     | ○          |
| (unlabeled claim)                                                           | 3. Actions           | components/login/hero-section.tsx:37-58                              | ○          |
| (unlabeled claim)                                                           | 3. Actions           | components/login/google-login-button.tsx:1-40                        | ○          |
| (unlabeled claim)                                                           | 3. Actions           | app/auth/callback/route.ts:64-73                                     | ○          |
| (unlabeled claim)                                                           | 3. Actions           | app/auth/callback/route.ts:52-62                                     | ○          |
| (unlabeled claim)                                                           | 3. Actions           | lib/countdown-config.ts:25-28                                        | ○          |
| State** · `SM-001`: transition not confirmed from this function alone — the | 3. Actions           | —                                                                    | △          |
| (unlabeled claim)                                                           | 3. Actions           | supabase/migrations/20260722090000_create_profile_on_signup.sql:7-27 | ○          |
| (unlabeled claim)                                                           | 3. Actions           | proxy.ts:1-14                                                        | ○          |
| (unlabeled claim)                                                           | 3. Actions           | lib/supabase/proxy.ts:44-91                                          | ○          |
| (unlabeled claim)                                                           | 3. Actions           | components/homepage/user-menu.tsx:53-68                              | ○          |
| (Unauthenticated → Authenticated) ·                                         | 4. Shared Foundation | app/auth/callback/route.ts:64-73                                     | ○          |
| (unlabeled claim)                                                           | 4. Shared Foundation | components/login/hero-section.tsx:37-46                              | ○          |
| (unlabeled claim)                                                           | 4. Shared Foundation | app/auth/callback/route.ts:64-73                                     | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 3. Actions: State** · `SM-001`: transition not confirmed from this function alone — the

## Risk Flags

_(none)_
