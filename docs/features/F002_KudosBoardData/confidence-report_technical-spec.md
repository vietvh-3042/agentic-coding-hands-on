---
source_artifact: docs/features/F002_KudosBoardData/technical-spec.md
claims_total: 20
claims_with_evidence: 20
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F002_KudosBoardData/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim             | Section              | Evidence (file:line)                                            | Status ○/△ |
| ----------------- | -------------------- | --------------------------------------------------------------- | ---------- |
| →                 | 3. Actions           | app/sun-kudos/page.tsx:64-93                                    | ○          |
| →                 | 3. Actions           | lib/kudos/hashtags.ts:15-28                                     | ○          |
| →                 | 3. Actions           | components/kudos-board/highlight-carousel.tsx:30-146            | ○          |
| (unlabeled claim) | 3. Actions           | components/kudos-board/use-copy-link-toast.tsx:1-39             | ○          |
| →                 | 3. Actions           | components/kudos-board/spotlight-board.tsx:34-132               | ○          |
| →                 | 3. Actions           | components/kudos-board/feed-list.tsx:36-131                     | ○          |
| →                 | 3. Actions           | components/kudos-board/feed-kudo-post-card.tsx:30-163           | ○          |
| ·                 | 4. Shared Foundation | lib/supabase/proxy.ts:12                                        | ○          |
| ·                 | 4. Shared Foundation | lib/supabase/proxy.ts:79-80                                     | ○          |
| ·                 | 4. Shared Foundation | app/sun-kudos/page.tsx:68-71                                    | ○          |
| ·                 | 4. Shared Foundation | supabase/migrations/20260906191500_profile_stats_view.sql:17-31 | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/kudos/hashtags.ts:36-40                                     | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/star-tier-badge.tsx:18-32                | ○          |
| (unlabeled claim) | 4. Shared Foundation | app/sun-kudos/page.tsx:89                                       | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/highlight-section.tsx:90                 | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/kudos/board-aggregates.ts:42-62                             | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/kudos/board-queries.ts:33-74                                | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/feed-list.tsx:67-96                      | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/kudos/hashtags.ts:36-40                                     | ○          |
| (unlabeled claim) | 4. Shared Foundation | components/kudos-board/spotlight-layout.ts:9-32                 | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
