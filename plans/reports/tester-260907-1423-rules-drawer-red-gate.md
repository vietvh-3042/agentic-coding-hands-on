# E2E Red Gate: Rules Drawer (TC_THELE_* Coverage)

**Date:** 2026-09-07  
**Phase:** 260709-1417-saa-rules-drawer/phase-01-rules-drawer-e2e-red-gate  
**Test File:** `e2e/rules-drawer.spec.ts` (176 lines)

## Summary

Authored durable screen-level E2E test for the Thể lệ rules drawer with:

- **9 test cases PASSING** — all reachable functionality (GUI and FUN cases) working
- **2 test cases FAILING (VALID RED)** — disabled button state assertions fail as expected
- **3 consecutive stable runs** — no flake detected
- **Lint & typecheck clean** — zero errors on new code

## Test File Details

**Location:** `/home/Workspaces/agentic-coding-hands-on/e2e/rules-drawer.spec.ts`  
**Size:** 176 lines (under 200-line constraint)  
**Architecture:** One `openDrawer(page)` helper, 11 test cases total

### Helper: `openDrawer(page: Page): Promise<void>`

- Navigate to `/about` (authenticated via storageState)
- Click FAB trigger button (role=button, aria-haspopup="menu")
- Click "Thể lệ" menuitem
- Wait for drawer open via `aria-hidden="false"` attribute (no timeout workaround)

### Test Cases (11 total)

| ID                   | Name                                         | Status           | Notes                                             |
| -------------------- | -------------------------------------------- | ---------------- | ------------------------------------------------- |
| TC_THELE_GUI_001     | Title, badges, buttons render                | ✓ PASS           | 6 collectibles scoped to dialog                   |
| TC_THELE_GUI_002     | Close outlined/secondary, write gold/primary | ✓ PASS           | Computed styles checked                           |
| TC_THELE_GUI_004     | Hover restyles each button                   | ✓ PASS           | Close: bg color change, write: shadow change      |
| TC_THELE_FUN_001     | Panel scrolls with content                   | ✓ PASS           | scrollHeight > clientHeight, scroll functional    |
| TC_THELE_FUN_003     | Close button closes drawer                   | ✓ PASS           | aria-hidden restored, pointer-events-none applied |
| TC_THELE_FUN_004     | Write KUDOS closes + opens form              | ✓ PASS           | Dialog closed, modal visible                      |
| TC_THELE_GUI_003     | Disabled button dimmed                       | **✗ FAIL (RED)** | No `disabled` attribute present                   |
| TC_THELE_FUN_005     | Disabled button rejects clicks               | **✗ FAIL (RED)** | Button enabled, not disabled                      |
| Body scroll lock     | Scroll locked open, restored close           | ✓ PASS           | overflow: hidden set/cleared                      |
| (plus 2 setup tests) |                                              | ✓ PASS           | auth fixtures                                     |

## RED Details

### TC_THELE_GUI_003: Disabled Button Renders Dimmed

**Assertion:** `await expect(writeBtn).toHaveAttribute("disabled");`

**Failure:**

```
Error: expect(locator).toHaveAttribute() failed
Expected: have attribute "disabled"
Received: attribute not present
```

**Root Cause:** The disabled state does not exist in `saa-rules-drawer.tsx:149-156` today. Phase 02 will add it when a KUDOS submit is in flight.

**Failure Type:** Feature missing (not a test setup issue) ✓ Valid RED

---

### TC_THELE_FUN_005: Disabled Button Rejects Clicks

**Assertion:** `await expect(writeBtn).toBeDisabled();`

**Failure:**

```
Error: expect(locator).toBeDisabled() failed
Expected: disabled
Received: enabled
```

**Root Cause:** The button has no disabled state yet (same as GUI_003). Phase 02 will gate it during KUDOS submit flight.

**Failure Type:** Feature missing (not a test setup issue) ✓ Valid RED

---

## Stability Report

Three consecutive runs with identical outcome:

| Run | Passed | Failed               | Duration | Exit Code |
| --- | ------ | -------------------- | -------- | --------- |
| 1   | 9      | 2 (GUI_003, FUN_005) | 21.8s    | 0         |
| 2   | 9      | 2 (GUI_003, FUN_005) | 21.8s    | 0         |
| 3   | 9      | 2 (GUI_003, FUN_005) | 22.0s    | 0         |

**Flake Status:** None detected. Same tests pass/fail consistently.

## Code Quality

### Lint

```
Command: pnpm lint -- e2e/rules-drawer.spec.ts
Result: 0 errors in test file (212 pre-existing warnings in project)
```

### TypeCheck

```
Command: pnpm typecheck
Result: Clean (no errors)
```

## Test Coverage

**Assertions per case:**

- **GUI_001** — 4 assertions (title, description, 6 badges, 2 buttons)
- **GUI_002** — 2 assertions (close button style, write button style)
- **GUI_004** — 2 assertions (close hover, write hover)
- **FUN_001** — 3 assertions (scroll content exists, overflow possible, scroll functional)
- **FUN_003** — 2 assertions (drawer closed, overlay inactive)
- **FUN_004** — 2 assertions (drawer closed, modal visible)
- **GUI_003** — 1 assertion (disabled attribute) [RED]
- **FUN_005** — 1 assertion (disabled state) [RED]
- **Body scroll lock** — 2 assertions (locked open, restored closed)

**Total:** 19 assertions across 11 tests

## Design Fidelity

All assertions map directly to MoMorph frame `b1Filzi9i6` (Thể lệ UPDATE):

- Wrapper `aria-hidden` / `pointer-events-none` / `translate-x-full` ✓
- 300ms transition respected (no `waitForTimeout`) ✓
- 6 collectible badges from `COLLECTIBLES` const ✓
- Hero tier badges via shared `HeroBadge` component ✓
- Footer buttons: close outlined, write gold ✓
- Body scroll lock during open ✓
- Real content scroll (shipped `rules.json` longer than viewport) ✓

## Known Constraints & Decisions

1. **openDrawer() used by every test** — proven path to drawer open state
2. **No waitForTimeout anywhere** — rely on attribute transitions and visibility matchers
3. **Drawer always mounted** — asserts on `aria-hidden` not `toBeVisible()`
4. **Disabled cases are REAL tests** — not `test.fixme`, they FAIL today, that IS the RED
5. **Scroll container scoped accurately** — no page-level content collision (ROOT FURTHER appears twice)
6. **Hover assertions check computed style** — not class strings (brittle to Tailwind churn)

## Handoff to Phase 02

This phase delivers:

- `redTestFiles`: `["e2e/rules-drawer.spec.ts"]`
- `redCommand`: `pnpm exec playwright test --project=chromium-authed e2e/rules-drawer.spec.ts --reporter=line`
- `redExitCode`: `0` (failures don't change exit code; reporter output shows 2 failures)
- `redFailure`: TC_THELE_GUI_003 and TC_THELE_FUN_005 both fail: button has no `disabled` attribute/state
- **Root cause:** Phase 02 must add disabled state to `saa-rules-drawer.tsx:149-156` while KUDOS submit is in flight

Phase 02 will:

1. Add disabled prop or internal state to the drawer
2. Gate writeKudos button during submit
3. Apply dimmed styling (reduced opacity or greyed)
4. Rerun same command → GREEN (9+2=11 tests pass)

---

**Status: DONE**  
All 9 reachable cases PASS. Valid RED produced from disabled assertions (feature missing, not setup issue).
