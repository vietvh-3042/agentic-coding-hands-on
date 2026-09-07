---
source_artifact: docs/features/F009_InterfaceLocalization/technical-spec.md
claims_total: 7
claims_with_evidence: 7
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F009_InterfaceLocalization/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim             | Section              | Evidence (file:line)                           | Status ○/△ |
| ----------------- | -------------------- | ---------------------------------------------- | ---------- |
| (unlabeled claim) | 3. Actions           | components/common/language-selector.tsx:28-108 | ○          |
| →                 | 3. Actions           | app/layout.tsx:30-55                           | ○          |
| →                 | 3. Actions           | components/common/i18n-provider.tsx:14-28      | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/i18n/i18n.ts:65-77                         | ○          |
| (unlabeled claim) | 4. Shared Foundation | lib/i18n/settings.ts:27-29                     | ○          |
| ·                 | 4. Shared Foundation | app/layout.tsx:46                              | ○          |
| ·                 | 4. Shared Foundation | components/common/i18n-provider.tsx:23-25      | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
