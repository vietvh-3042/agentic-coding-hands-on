---
authored_by: rebuild-spec
---

<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F010_PrelaunchCountdownGate

**Priority**: P2
**Type**: ui
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F010_PrelaunchCountdownGate → SCR003_CountdownScreen

## 1. Overview

**Problem:** Before the Sun\* Annual Awards event officially begins, a signed-in visitor should
see how long is left until it starts, and should not be stuck watching a countdown once the wait
is actually over.
**Solution:** A dedicated Countdown screen shows a live Days/Hours/Minutes/Seconds countdown to
the configured launch time, then automatically takes the visitor to the homepage the instant it
reaches zero — no click required.
**Scope:** Show a ticking countdown to the configured launch time; automatically continue to the
homepage once the countdown finishes.
**Non-Scope:** Does not provide any way to view or change the launch date from the UI; does not
keep the launch date shown here in agreement with the date shown on other screens — see § 11
RISK-01.

**Actors**

| Actor             | Description                                                                   | Primary goal                                                                                         |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Signed-in visitor | Anyone who has completed Google sign-in and is waiting for the event to start | Know how much longer until the event starts, and move on to the real site automatically once it does |

## 2. Functional Capabilities

| ID     | Capability                          | What the user can do                                                                                | User Stories                    | Requirements                           | Business Rules                  | Screens |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------- | ------------------------------- | ------- |
| CAP-01 | Prelaunch Countdown & Auto-Continue | Watch a live countdown to launch and get taken to the homepage automatically the moment it finishes | — (none; `[IPE_ZERO]`, see § 7) | FR-001, FR-101, FR-201, FR-401, FR-601 | BR-001, BR-002, DEC-001, SM-001 | SCR003  |

## 3. Open Decisions

| D### | Decision                                                                                                                                                                                                                                                                                           | Default proposal                                                                                                                                                                                                | Rationale                                                                                              | Blocks work |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| D001 | Three different "event launch" instants exist at once — the seeded database value (2026-07-21), the environment setting this page actually counts down to (2026-12-31), and a separately hardcoded date on the homepage (2026-12-26). Which one is the actual, intended launch date going forward? | Keep the environment setting (2026-12-31) as authoritative, since it is the only one that actually drives this page and the post-login routing decision — update the homepage's hardcoded date to match instead | This page's value is the most load-bearing today: it gates where a signed-in visitor lands after login | yes         |

## 4. Requirements

### Foundation (0xx)

- **FR-001** The countdown target is read from a single environment setting rather than being hardcoded in the page.

### Navigation (1xx)

- **FR-101** A signed-in visitor lands on this screen automatically right after signing in, or by revisiting the Login screen while already signed in, whenever the event has not yet started.

### Countdown (Prelaunch) (2xx)

- **FR-201** The screen shows four ticking counters — Days, Hours, Minutes, Seconds — counting down to the launch time, updating every second.

### Interaction (4xx)

- **FR-401** The instant all four counters reach zero, the visitor is automatically taken to the homepage, with no click required.

### Security (6xx)

- **FR-601** This screen requires an active session, the same as every other non-public page on the site.

## 5. Business Rules

- The countdown recalculates itself every second while the page stays open. (BR-001)
- Before the countdown has finished loading in the browser, all four counters briefly show zero instead of the real remaining time, so the page never flashes mismatched numbers. (BR-002)
- The moment the countdown finishes, the page automatically continues to the homepage. (DEC-001)
- The countdown display moves through a loading state, a ticking state, and an expired state that triggers the automatic hand-off to the homepage. (SM-001)

## 6. Screens

| Screen Name           | SCR###                 | What User Sees                                                                                                                         | What User Can Do                                                                                           |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Countdown (Prelaunch) | SCR003_CountdownScreen | Full-screen background artwork with a dark overlay, and a centered countdown showing Days/Hours/Minutes/Seconds remaining until launch | Nothing — there are no buttons, links, or inputs on this screen; it counts down and then leaves on its own |

### User Journey

1. A signed-in visitor arrives at the Countdown (Prelaunch) screen, right after signing in or by
   revisiting the Login screen while already signed in, before the event has started.
2. The countdown ticks down, second by second.
3. The instant it reaches zero, the visitor is automatically taken to the About / Homepage screen
   — no click needed.

## 7. User Stories

N/A — this screen has zero interactive elements (`[IPE_ZERO]` per `user-stories.md`'s Screen→US
Map). The only thing that happens on this screen is the automatic expiry hand-off to the homepage
(DEC-001), which is not user-triggered, so no `US###` is attributed to this feature.

## 8. Scenarios

N/A — no user stories declared in § 7 to scenario against (`[IPE_ZERO]`).

## 9. Edge Cases

| Scenario                                                     | What Happens                                                                                                                                                          | User-Facing Message                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| The launch-time setting is missing in a deployed environment | The countdown target falls back to about 8 seconds after the page loads, so the countdown finishes almost immediately and the page leaves for the homepage right away | "None — silent handling, no message shown"            |
| The launch-time setting has an unreadable value              | The countdown behaves as if the event has already started                                                                                                             | "None — silent handling, page behaves as post-launch" |
| The countdown reaches zero while the page is open            | The page automatically takes the visitor to the homepage                                                                                                              | "None — no message, seamless navigation"              |
| The session expires while the countdown is still running     | The next click or reload sends the visitor to the Login screen instead of continuing the countdown                                                                    | "None — visitor is simply shown the Login screen"     |

## 10. Edge Behaviours to Verify

- **FR-201** → Confirm all four counters (Days/Hours/Minutes/Seconds) update every second and never show a negative number.
- **FR-401** → Confirm the page actually leaves for the homepage the instant all four counters hit zero, with no further click needed.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                                                                                                                     | Impact                                                                                                                                                                              | Status    |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | Three different "event launch" instants exist in the codebase at once: the database-seeded value (2026-07-21), the environment setting this page actually reads (2026-12-31), and a third, separately hardcoded date on the homepage screen (2026-12-26) — a five-day gap between what this page and the homepage each display. | A visitor who looks at both this page and the homepage sees two different countdowns to what is supposed to be the same event; the database value is never read by any page at all. | confirmed |
| RISK-02 | risk        | If the environment setting this page reads is ever missing in a deployed environment, the countdown target silently falls back to roughly 8 seconds after the page loads, so the countdown finishes almost immediately.                                                                                                         | Anyone visiting this page in that environment would see the prelaunch countdown finish almost instantly and get bounced to the homepage before the event has actually started.      | confirmed |

## 12. Dependencies

| Dependency                      | Type    | Why this feature needs it                                                                                                                                                    | Evidence                              |
| ------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| F001_GoogleSignIn               | feature | This screen is only reachable while signed in; the session gate and the post-login/post-logout routing that sends a visitor here are both owned by F001, not by this feature | SCR003 entry points in screen-flow.md |
| Launch-time environment setting | config  | Supplies the instant this page counts down to; see § 13                                                                                                                      | FR-001                                |

## 13. Configuration

```text
NEXT_PUBLIC_LAUNCH_AT = 2026-12-31T18:00:00+07:00   # the launch instant this countdown page counts down to (currently 5 days later than the homepage's own separately-configured date — see RISK-01)
```
