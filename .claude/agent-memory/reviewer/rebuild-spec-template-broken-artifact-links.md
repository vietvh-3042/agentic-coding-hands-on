---
name: rebuild-spec-template-broken-artifact-links
description: technical-spec-template.md's § 5.5 example links are broken (wrong depth/filename), causing generated feature specs to inherit dead docs/ links
metadata:
  type: project
---

`claude/skills/rebuild-spec/templates/technical-spec-template.md:554-563`'s § 5.5 Artifact
References example uses `../../docs/system/system-overview.md` / `../../docs/generated/*.md` as
the sample link paths. Once a technical-spec.md is promoted to its final location
(`docs/features/F0xx_Name/technical-spec.md`), those paths resolve wrong two ways: (1) the extra
`docs/` prefix double-nests (`docs/docs/system/...`), and (2) the filename `system-overview.md`
does not exist — the real file is `docs/system/overview.md`. The correct relative path from that
location is `../../system/overview.md` and `../../generated/{file}.md` (2 levels up lands at
`docs/`, not repo root).

Found during FS.5 batch-2 review (F006/F007/F008/F009/F010,
plans/260906-2312-rebuild-spec-core) — F006 and F010 happened to get the depth right (F010 still
got the filename wrong), F007 invented a third, shallower-still variant, and F008/F009 copied the
template's broken example verbatim, extra `docs/` and all.

**Why:** this is a template-level defect, not a per-feature authoring mistake — every other
feature spec generated from this template (all 13, not just this batch) likely carries the same
dead links, since nothing in the deterministic validator (`validate_feature_spec.py`) checks that
a § 5.5 `File` column link actually resolves to a real path.

**How to apply:** when reviewing any other FS.5 batch from this same rebuild-spec run (or any
future run using this template), check § 5.5 link paths against the real `docs/system/` /
`docs/generated/` contents rather than assuming template-copied paths are correct by construction.
Flag the template fix once to the orchestrator rather than re-deriving this per batch — see
[[rebuild-spec-reviewer-conventions]] if that memory exists.

**2026-09-07 update:** coordinator applied a corpus-wide fix (8 of 13 specs affected, including a
third triple-dot variant in F011 I hadn't seen) and I re-verified it against the real `docs/`
tree — all links now resolve. The template file itself
(`$HOME/.claude/skills/rebuild-spec/templates/technical-spec-template.md:554-563`) is still
unfixed and lives outside any single repo (user's global kit) — I recommended flagging it to the
kit owner separately, since the corpus fix only closes the symptom for this project; the next
project running this skill from a clean kit checkout will regenerate the same broken example
paths, and nothing in `validate_feature_spec.py` checks § 5.5 link-target existence, so it won't
resurface as an automatic WARN/FAIL next time either.
