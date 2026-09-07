---
source_artifact: docs/features/F003_KudoAuthoring/technical-spec.md
claims_total: 31
claims_with_evidence: 31
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F003_KudoAuthoring/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                                            | Section              | Evidence (file:line)                                     | Status ○/△ |
| ------------------------------------------------ | -------------------- | -------------------------------------------------------- | ---------- |
| (unlabeled claim)                                | 3. Actions           | components/homepage/widget-button.tsx:47-96              | ○          |
| (unlabeled claim)                                | 3. Actions           | components/homepage/saa-rules-drawer.tsx:151             | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos-board/write-kudos-bar.tsx:13-16         | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/write-kudos-bar-button.tsx:23-34        | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/kudos-form-modal.tsx:38                 | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/kudos-form-modal.tsx:93-101             | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/kudo-validation.ts:81-86                       | ○          |
| (unlabeled claim)                                | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:62-65               | ○          |
| hashtag count doesn't equal the requested count. | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:69-90               | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/kudo-validation.ts:30-37                       | ○          |
| re-checked server-side in `validateKudoDraft`. · | 3. Actions           | lib/kudos/kudo-validation.ts:88-98                       | ○          |
| `getUser()` directly.                            | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:99-103              | ○          |
| retry.                                           | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:121-130             | ○          |
| text, brackets included.                         | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:104-109             | ○          |
| text, brackets included.                         | 3. Actions           | lib/kudos/render-kudo-message.tsx:23-30                  | ○          |
| text, brackets included.                         | 3. Actions           | lib/kudos/render-kudo-message.tsx:44-50                  | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/kudos-form-modal.tsx:108-120            | ○          |
| (unlabeled claim)                                | 3. Actions           | app/sun-kudos/actions/submit-kudo.ts:49-134              | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/kudo-validation.ts:74-105                      | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/upload-kudo-images.ts:51-71                    | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/kudo-validation.ts:112-121                     | ○          |
| (unlabeled claim)                                | 3. Actions           | lib/kudos/kudo-validation.ts:124-140                     | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/kudos-content-editor.tsx:52-67          | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/kudos-content-editor.tsx:89-97          | ○          |
| (unlabeled claim)                                | 3. Actions           | components/kudos/addlink-box.tsx:31-58                   | ○          |
| (unlabeled claim)                                | 4. Shared Foundation | components/kudos/kudos-form-modal.tsx:28                 | ○          |
| (unlabeled claim)                                | 4. Shared Foundation | components/kudos/kudos-form-modal.tsx:43                 | ○          |
| (unlabeled claim)                                | 4. Shared Foundation | components/kudos/kudos-form-modal.tsx:108-120            | ○          |
| ·                                                | 4. Shared Foundation | app/sun-kudos/actions/submit-kudo.ts:52-59               | ○          |
| ·                                                | 4. Shared Foundation | supabase/migrations/20260716100000_write_kudos.sql:13-15 | ○          |
| (unlabeled claim)                                | 4. Shared Foundation | lib/kudos/upload-kudo-images.ts:51-71                    | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
