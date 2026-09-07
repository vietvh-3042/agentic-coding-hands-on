---
source_artifact: docs/features/F005_HashtagTaxonomy/technical-spec.md
claims_total: 18
claims_with_evidence: 18
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F005_HashtagTaxonomy/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                        | Section              | Evidence (file:line)                                       | Status ○/△ |
| ---------------------------- | -------------------- | ---------------------------------------------------------- | ---------- |
| →                            | 3. Actions           | components/kudos-board/highlight-filter-dropdown.tsx:75-78 | ○          |
| →                            | 3. Actions           | components/kudos-board/highlight-section.tsx:33            | ○          |
| →                            | 3. Actions           | components/kudos-board/highlight-section.tsx:68-74         | ○          |
| →                            | 3. Actions           | components/kudos-board/highlight-kudo-card.tsx:92-99       | ○          |
| →                            | 3. Actions           | components/kudos-board/highlight-section.tsx:93            | ○          |
| →                            | 3. Actions           | components/kudos-board/feed-kudo-post-card.tsx:111-119     | ○          |
| →                            | 3. Actions           | components/kudos-board/feed-list.tsx:98-103                | ○          |
| (unlabeled claim)            | 3. Actions           | components/kudos-board/feed-list.tsx:104-111               | ○          |
| (unlabeled claim)            | 3. Actions           | components/kudos-board/use-hashtag-filter.ts:24-36         | ○          |
| → _(F003, out of scope)_     | 3. Actions           | components/kudos/kudos-hashtag-input.tsx:38-57             | ○          |
| → _(F003, out of scope)_     | 3. Actions           | components/kudos/kudos-hashtag-input.tsx:109-120           | ○          |
| (derives/writes the state) · | 4. Shared Foundation | components/kudos-board/use-hashtag-filter.ts:15-39         | ○          |
| ·                            | 4. Shared Foundation | supabase/migrations/20260906191000_kudo_hashtags.sql:47-56 | ○          |
| ·                            | 4. Shared Foundation | supabase/migrations/20260906191000_kudo_hashtags.sql:73-78 | ○          |
| ·                            | 4. Shared Foundation | components/kudos-board/use-hashtag-filter.ts:24-36         | ○          |
| ·                            | 4. Shared Foundation | components/kudos-board/highlight-section.tsx:90            | ○          |
| ·                            | 4. Shared Foundation | components/kudos-board/highlight-filter-dropdown.tsx:76    | ○          |
| ·                            | 4. Shared Foundation | components/kudos-board/highlight-section.tsx:93            | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
