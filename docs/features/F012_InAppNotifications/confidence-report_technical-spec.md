---
source_artifact: docs/features/F012_InAppNotifications/technical-spec.md
claims_total: 2
claims_with_evidence: 2
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F012_InAppNotifications/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                              | Section              | Evidence (file:line)                                      | Status ○/△ |
| ---------------------------------- | -------------------- | --------------------------------------------------------- | ---------- |
| (whole file — no deeper call chain | 3. Actions           | components/common/notification-menu.tsx:1-61              | ○          |
| ·                                  | 4. Shared Foundation | supabase/migrations/20260723090000_notifications.sql:1-32 | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
