# HSK Deck — TODOs

## Before / after App Store submit

- [x] ~~Fix cold-launch black screen (~10s on first open)~~ — **skip for now**. Saw once in TestFlight; not reproducing on App Store install.

## Done for you (v1 / 1.1)

- [x] v1 features in code (see `V1.md`)
- [x] `npm test` green
- [x] `npm run cap:sync` (fresh web build into iOS)
- [x] Release archive for **1.1 (build 3)** — `build/HSK-Deck.xcarchive` (also in Xcode Organizer when archive step succeeds)
- [ ] CLI upload to App Store Connect — **blocked**: needs your Apple login in Xcode / App Store Connect (no API key on this machine)

Archive details: version **1.1**, build **3**, bundle ID `com.madebycaseyz.hskdeck`, team `493V3MBMB4`.

## Your steps (do these next)

### 1. Upload the archive (≈5 min)

1. Open **Xcode → Window → Organizer**.
2. Select the latest **HSK Deck / App** archive (1.1 / 3).
3. **Distribute App** → **App Store Connect** → **Upload**.
4. Keep automatic signing. Finish the wizard.

### 2. App Store Connect

- Attach the new **1.1** build once processing finishes.
- Paste **What’s New** from `V1.md`.
- Submit for review when ready.

### 3. Optional: TestFlight first

Install 1.1 via TestFlight and re-check audio, swipe motion, and review prompt on device.
