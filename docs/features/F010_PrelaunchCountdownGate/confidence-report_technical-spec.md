---
source_artifact: docs/features/F010_PrelaunchCountdownGate/technical-spec.md
claims_total: 10
claims_with_evidence: 9
confidence_derived: 0.9
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F010_PrelaunchCountdownGate/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                                                                              | Section              | Evidence (file:line)                           | Status ○/△ |
| ---------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------- | ---------- |
| (unlabeled claim)                                                                  | 3. Actions           | hooks/use-countdown.ts:41-47                   | ○          |
| (unlabeled claim)                                                                  | 3. Actions           | components/countdown/countdown-timer.tsx:36-41 | ○          |
| (unlabeled claim)                                                                  | 3. Actions           | hooks/use-countdown.ts:38-39                   | ○          |
| →                                                                                  | 3. Actions           | app/countdown/page.tsx:25-47                   | ○          |
| →                                                                                  | 3. Actions           | components/countdown/countdown-timer.tsx:32-67 | ○          |
| (unlabeled claim)                                                                  | 4. Shared Foundation | components/countdown/countdown-timer.tsx:38-50 | ○          |
| (unlabeled claim)                                                                  | 4. Shared Foundation | hooks/use-countdown.ts:38-50                   | ○          |
| `` whether the comment is stale or was always intended to describe page-level-only | 4. Shared Foundation | —                                              | △          |
| · owned by F001, cited here only as this screen's                                  | 4. Shared Foundation | lib/supabase/proxy.ts:12-14                    | ○          |
| · owned by F001, cited here only as this screen's                                  | 4. Shared Foundation | lib/supabase/proxy.ts:44-91                    | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

- 4. Shared Foundation: `` whether the comment is stale or was always intended to describe page-level-only

## Risk Flags

_(none)_
