---
source_artifact: docs/features/F008_AwardInformationBrowsing/technical-spec.md
claims_total: 5
claims_with_evidence: 5
confidence_derived: 1.0
generated_by: derive_confidence_report.py
---

# Confidence Report -- docs/features/F008_AwardInformationBrowsing/technical-spec.md

> **Self-reported citation-coverage stat -- NOT a correctness verification.** This report is derived deterministically by parsing the artifact's own inline `**Source:** file:line` citations and `[UNVERIFIED]`/`[INFERRED]`/`[NEEDS_DOMAIN_CONFIRMATION]` marker tags. It does NOT verify that citations are accurate or that claims are true. For blind truth verification, see `claude/skills/audit-doc-parity/`.

## Claims ↔ Evidence

Legend: `○` = cited (Source file:line present) · `△` = marker-tagged (uncertain, no citation).

| Claim                                          | Section              | Evidence (file:line)                              | Status ○/△ |
| ---------------------------------------------- | -------------------- | ------------------------------------------------- | ---------- |
| →                                              | 3. Actions           | app/award-info/page.tsx:30-48                     | ○          |
| →                                              | 3. Actions           | components/awards/award-detail-section.tsx:32-131 | ○          |
| (unlabeled claim)                              | 3. Actions           | components/awards/category-nav.tsx:31-93          | ○          |
| (`useState<string>`, initial value = the first | 4. Shared Foundation | components/awards/category-nav.tsx:33             | ○          |
| · `docs/generated/permissions-matrix.md` §     | 4. Shared Foundation | lib/supabase/proxy.ts:44-91                       | ○          |

## Missing Info

Candidate sections to check for `△` (marker-tagged) claims -- best-effort only, not authoritative:

_(none -- no marker-tagged claims)_

## Risk Flags

_(none)_
