---
source_artifact: docs/features/F004_KudoHearts/technical-spec.md
claims_total: 10
claims_with_evidence: 10
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F004_KudoHearts/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim             | Section              | Evidence (file:line)                                                        | Status ○/△ |
| ----------------- | -------------------- | --------------------------------------------------------------------------- | ---------- |
| (unlabeled claim) | 3. Actions           | supabase/migrations/20260722100000_kudo_hearts.sql:8-14                     | ○          |
| (unlabeled claim) | 3. Actions           | supabase/migrations/20260722100000_kudo_hearts.sql:41-47                    | ○          |
| (unlabeled claim) | 3. Actions           | supabase/migrations/20260906193000_resolve_heart_value_no_definer.sql:20-39 | ○          |
| (unlabeled claim) | 3. Actions           | supabase/migrations/20260722100000_kudo_hearts.sql:74-76                    | ○          |
| →                 | 3. Actions           | components/kudos-board/heart-button.tsx:52-113                              | ○          |
| →                 | 3. Actions           | app/sun-kudos/actions/heart-kudo.ts:52-97                                   | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/heart-button.tsx:7-17                                | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/heart-button.tsx:62-63                               | ○          |
| (unlabeled claim) | 4. Shared Foundation | app/sun-kudos/actions/heart-kudo.ts:53-56                                   | ○          |
| (unlabeled claim) | 4. Shared Foundation | app/sun-kudos/actions/heart-kudo.ts:84-87                                   | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
