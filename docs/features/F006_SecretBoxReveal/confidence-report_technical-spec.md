---
source_artifact: docs/features/F006_SecretBoxReveal/technical-spec.md
claims_total: 14
claims_with_evidence: 14
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F006_SecretBoxReveal/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim             | Section              | Evidence (file:line)                                           | Status ○/△ |
| ----------------- | -------------------- | -------------------------------------------------------------- | ---------- |
| (unlabeled claim) | 3. Actions           | components/kudos-board/sidebar-stats.tsx:64-75                 | ○          |
| (unlabeled claim) | 3. Actions           | components/kudos-board/sidebar-gift-dialog.tsx:40-58           | ○          |
| (unlabeled claim) | 3. Actions           | app/sun-kudos/actions/open-secret-box.ts:94-112                | ○          |
| →                 | 3. Actions           | components/kudos-board/sidebar-gift-dialog.tsx:60-74           | ○          |
| →                 | 3. Actions           | app/sun-kudos/actions/open-secret-box.ts:47-83                 | ○          |
| (unlabeled claim) | 4. Shared Foundation | supabase/migrations/20260906192500_secret_box_draw.sql:44-57   | ○          |
| (unlabeled claim) | 4. Shared Foundation | supabase/migrations/20260906192500_secret_box_draw.sql:130-131 | ○          |
| (unlabeled claim) | 4. Shared Foundation | app/sun-kudos/actions/open-secret-box.ts:47-57                 | ○          |
| (unlabeled claim) | 4. Shared Foundation | app/sun-kudos/actions/open-secret-box.ts:94-101                | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/sidebar-gift-dialog.tsx:58              | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/sidebar-gift-dialog.tsx:104-109         | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/sidebar-gift-dialog.tsx:115             | ○          |
| (unlabeled claim) | 4. Shared Foundation | supabase/migrations/20260906192500_secret_box_draw.sql:79-81   | ○          |
| (unlabeled claim) | 4. Shared Foundation | supabase/migrations/20260906192500_secret_box_draw.sql:83-99   | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
