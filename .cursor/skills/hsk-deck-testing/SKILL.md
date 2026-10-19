---
name: hsk-deck-testing
description: >-
  HSK Deck testing strategy: Vitest/RTL automated tests, per-feature success
  criteria in version docs, cap:sync before iPhone QA, Amplitude event-logging
  verification, and ship-gate checklist. Use when adding features, writing
  tests, verifying analytics, updating V1.x.md testing sections, preparing
  phone QA, or shipping an App Store build.
---

# HSK Deck testing

## Split: automate what the agent can verify; phone for feel

| Layer | Tool | Owns |
|-------|------|------|
| Automated | `npm test` (Vitest + RTL + jsdom) | Logic, event wiring, UI contracts, CSS/config invariants |
| Manual web | `npm run dev` | Quick layout sanity |
| Analytics verify | Playwright probe + Amplitude Live Events | Events actually reach Amplitude |
| Manual device | `npm run cap:sync` → Xcode Run / TestFlight | Audio, swipe feel, real StoreKit, visuals, cold start |

Do **not** treat a feature as done until automated tests are green **and** the version doc’s manual checklist for that feature is written (and ideally run on phone before ship).

## When implementing a feature

1. Prefer **unit** tests for pure logic (`src/domain/`, helpers under `src/speech/`, `src/review/`, `src/update/`).
2. Prefer **component** tests for interactive UI (`StudySession`, prompts) — fire events, assert callbacks/DOM; mock `speak`, data loaders, plugins.
3. Prefer **config contract** tests (read CSS/HTML as text) for “must not regress” layout/font rules (e.g. no LXGW CDN, hanzi sizing).
4. Skip heavy E2E (Playwright) for product UI unless asked — exception: **Amplitude verification** below.
5. Update the version doc (`V1.md` / `V1.2.md` …) with:

```markdown
### N. Feature name

**Success (manual)**
- …
**Success (automated)** — `path/to/test.ts`
```

## Commands

```bash
npm test              # required after substantive changes
npm run test:watch    # while iterating
npm run build         # typecheck + production bundle
npm run cap:sync      # BEFORE any iPhone Run / Archive
npm run dev           # web QA (must restart after changing .env.local)
```

**Critical:** iOS loads the synced `dist` into `ios/App/App/public`. Skipping `cap:sync` tests a stale build.

## What belongs where

**Automate**

- Deck/rating rules (mutual exclusivity, re-rate moves)
- Swipe → `onFlipNavigate` / complete callbacks (pointer events + fake timers if needed)
- TTS called with correct lang; speaker does not flip card
- Review/update prompt pure rules
- Renames / presence of UI controls (e.g. no arrows, no “Back to decks”)
- CSS/HTML contracts for size/font

**Manual (physical iPhone)**

- Hear Chinese/English TTS
- Swipe motion feel (follow finger, take-back, spring back)
- Hanzi size, clipping, vertical center
- Cold-start font flash
- Store update prompt vs live App Store version
- Native review sheet / mailto

## Amplitude event-logging verification

Do **not** assume the key works just because HTTP key-check succeeded, or that the app is logging just because `track()` exists. Verify end-to-end.

### Setup

1. Key in `.env.local` as `VITE_AMPLITUDE_API_KEY=…` (gitignored via `*.local`; see `.env.example`).
2. **Restart** `npm run dev` after changing the key (Vite only reads env at startup).
3. For iOS: key must be present at **`npm run cap:sync` / `build` time** — otherwise Amplitude is tree-shaken out of the bundle.

### Quick key check (API only — not app instrumentation)

```bash
# POST one event to api2.amplitude.com/2/httpapi with the key from .env.local
# Success: HTTP 200 and events_ingested >= 1
```

This only proves the **key** is valid. It does **not** prove the web/iOS app is calling `track`.

### App instrumentation check (required)

1. Start `npm run dev`.
2. Run the Playwright probe:

```bash
node scripts/amplitude-probe.mjs
```

3. Success criteria in the probe output:
   - Requests to `api2.amplitude.com/2/httpapi`
   - Responses with `"code":200` and `events_ingested` ≥ 1
   - Console includes `[amplitude] initialized` and `[amplitude] track …`
   - At least one real product event (e.g. `app_open`, `level_selected`) and/or probe events (`agent_probe_event`)

4. In Amplitude UI: **Live events** / User Lookup, last 24h — confirm those event names (not only a one-off `amplitude_key_check`).

### Manual browser check

- Open localhost with DevTools console: expect `[amplitude] track app_open` on load.
- Disable ad blockers / privacy extensions on localhost (they often block `api2.amplitude.com`).
- Click a level → expect `level_selected` in console and Live Events.

### Implementation notes (`src/analytics/amplitude.ts`)

- Init is async; `track` must wait for init (or queue until ready) so `app_open` is not dropped.
- Flush aggressively during QA (`flushIntervalMillis` / `flushQueueSize` / `flush()` after track).
- Dev-only `console.info` for init/track helps local verification.

## Ship gate (every release)

Copy into the version doc and tick before upload:

- [ ] `npm test` green
- [ ] Manual checks on a **physical iPhone** (after fresh `cap:sync`)
- [ ] If analytics ships: Amplitude probe / Live Events confirmed with key baked into the build
- [ ] Marketing/build version bumped
- [ ] Archive uploaded / released
- [ ] Version doc What’s New matches the build
