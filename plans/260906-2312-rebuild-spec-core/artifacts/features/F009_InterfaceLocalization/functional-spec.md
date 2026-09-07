---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F009_InterfaceLocalization

**Priority**: P2
**Type**: ui
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F009 → SCR002, SCR004, SCR005, SCR006 → US003

## 1. Overview

**Problem:** The app's content is authored in both Vietnamese and English, but showing only one of
them would leave out readers who prefer the other — and whichever language a person picks needs to
keep showing as they move around the app, not reset on the next screen or reload.
**Solution:** A language selector sits in the shared header on every screen. Picking Vietnamese or
English immediately changes all the visible text to that language and remembers the choice, so the
same language keeps showing after a reload or moving to another screen. Vietnamese is shown by
default until a choice is made.
**Scope:** Switching the displayed language between Vietnamese and English from any screen;
remembering that choice in this browser across reloads and screen changes.
**Non-Scope:** Saving the chosen language to a person's own account so it follows them to a
different browser or device — the underlying account field exists but nothing in the app writes
to it yet (see `F011_ProfileSelfService`); any language beyond Vietnamese and English.

**Actors**

| Actor    | Description                                                  | Primary goal                                   |
| -------- | ------------------------------------------------------------ | ---------------------------------------------- |
| App User | Any visitor or signed-in member, on any of the app's screens | Read the interface in their preferred language |

## 2. Functional Capabilities

| ID     | Capability                | What the user can do                                                                                                                     | User Stories | Requirements                           | Business Rules                                 | Screens                        |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | ---------------------------------------------- | ------------------------------ |
| CAP-01 | Switch Interface Language | Switch the displayed language between Vietnamese and English from the shared header, on any screen, with the choice remembered afterward | US003        | FR-001, FR-002, FR-401, FR-402, FR-403 | BR-001, BR-002, BR-003, BR-004, BR-005, BR-006 | SCR002, SCR004, SCR005, SCR006 |

## 3. Open Decisions

None — no unresolved domain confirmations.

## 4. Requirements

### Foundation (0xx)

- **FR-001** Two languages are available, Vietnamese and English; if the remembered choice isn't
  one of these, the interface shows Vietnamese.
- **FR-002** The language selector is available in the shared header on every screen (Login,
  About, Award Information, Sun\* Kudos Board).

### Interaction (4xx)

- **FR-401** Selecting a language immediately changes all visible interface text to that language,
  without reloading the page.
- **FR-402** The selected language stays in effect after reloading the page or moving to another
  screen.
- **FR-403** The page's declared language always matches whichever language is currently showing.

## 5. Business Rules

- Any remembered language value that isn't Vietnamese or English is treated the same as no value
  at all, and Vietnamese is shown. (BR-001)
- If switching languages doesn't succeed, the interface keeps showing whatever language it was
  already showing, with no error message. (BR-002)
- The remembered language is refreshed to last another year every time it is set, including simply
  reloading the page. (BR-003)
- Any interface text with no translation for the current language falls back to its Vietnamese
  wording rather than showing a blank space or a raw code. (BR-004)
- The page's declared language is set from the remembered choice on first load, and again every
  time the language is switched. (BR-005)
- Each visit builds its own copy of the translation system from the remembered choice, so one
  visitor's language can never affect another visitor's page. (BR-006)

## 6. Screens

| Screen Name              | SCR###                 | What User Sees                                                                                                | What User Can Do |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------- |
| Login                    | SCR002_LoginScreen     | The language selector only, in the header (no notification or account menu — the visitor isn't signed in yet) | Switch language  |
| About / Homepage         | SCR004_AboutHomepage   | The language selector in the full header, alongside notifications and the account menu                        | Switch language  |
| Award Information        | SCR005_AwardInfoScreen | The language selector in the full header                                                                      | Switch language  |
| Sun\* Kudos — Live Board | SCR006_SunKudosBoard   | The language selector in the full header                                                                      | Switch language  |

### User Journey

1. A user arrives at any screen and sees the current language (Vietnamese by default) throughout
   the page.
2. The user opens the language selector in the header and picks the other language.
3. The interface immediately changes to the newly selected language; the same choice is still
   showing after a reload or moving to another screen.

## 7. User Stories

### US003_SwitchInterfaceLanguage — Switch Interface Language

**Actor:** App User
**Goal:** Switch the interface language between Vietnamese and English so I can read the app in
my preferred language.
**Business value:** Lets a visitor or member actually understand and use the app, instead of being
stuck with whichever language happens to be showing.

**Acceptance Criteria:**

- [ ] Selecting Vietnamese or English immediately changes all visible text to that language.
- [ ] The choice is still in effect after reloading the page or moving to another screen.
- [ ] The page's declared language always matches whatever is currently showing.
- [ ] Vietnamese is shown by default when no earlier choice is remembered.

## 8. Scenarios

### US003_SwitchInterfaceLanguage — Happy Path

**Given** the user has the Vietnamese interface visible, **When** the user selects "EN," **Then**
the interface immediately changes to English and stays in English after reloading the page.

### US003_SwitchInterfaceLanguage — Error: switch fails

**Given** the translation system rejects a switch (an internal failure), **When** the user selects
a language, **Then** the previously visible language stays showing, with no error message shown.

## 9. Edge Cases

| Scenario                                                                                            | What Happens                                                 | User-Facing Message      |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| The remembered language value is something other than Vietnamese or English (corrupted or tampered) | Treated the same as no remembered value; Vietnamese is shown | "None — silent handling" |
| Switching languages fails internally                                                                | The previously visible language stays showing                | "None — silent handling" |
| A screen shows text with no translation for the selected language                                   | The Vietnamese wording for that text is shown instead        | "None — silent handling" |
| No language has ever been chosen (first visit, nothing remembered)                                  | The interface shows Vietnamese by default                    | "None — silent handling" |

## 10. Edge Behaviours to Verify

- **FR-401** → Confirm selecting a language changes visible text immediately, without a page
  reload.
- **FR-402** → Confirm the selected language is still showing after reloading the page or moving
  to another screen.
- **FR-001** → Confirm a corrupted or missing remembered language falls back to Vietnamese, never
  a blank or broken state.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                           | Impact                                                                                                                                                                          | Status    |
| ------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | A failed language switch is caught and silently discarded — nothing is logged anywhere, unlike other similar failure handlers in this app (for example, signing out) that do log the underlying error | A real configuration problem causing every switch to fail (such as a corrupted translation bundle) would be invisible in application logs, not just to the person using the app | confirmed |

## 12. Dependencies

| Dependency              | Type    | Why this feature needs it                                                                                                                                                                                                   | Evidence                                                                                            |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| F011_ProfileSelfService | feature | If a member's chosen language should ever follow them to a new browser or device, it would need to be saved to their own account — no such save exists today; this feature only remembers the choice in the current browser | the account's language field exists but is unwritten by any code path (see F011_ProfileSelfService) |

## 13. Configuration

```text
Default language = Vietnamese                 # shown when no language has been chosen yet, or a remembered value isn't recognized
Supported languages = Vietnamese, English     # no other language is available today
```
