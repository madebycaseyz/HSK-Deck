# HSK Deck — TODOs

## Before / after App Store submit

- [x] ~~Fix cold-launch black screen (~10s on first open)~~ — **skip for now**. Saw once in TestFlight; not reproducing on App Store install.

## Done for you (v1.2 / 1.2)

- [x] v1.2 features in code (see `V1.2.md`)
- [x] `npm test` green
- [x] Amplitude key baked into web build via `.env.local` at sync time
- [x] `npm run cap:sync` (fresh web build into iOS)
- [x] Release archive for **1.2 (build 5)** — `build/HSK-Deck.xcarchive` (also in Xcode Organizer)
- [ ] Upload to TestFlight / App Store Connect — needs your Apple login in Xcode Organizer

Archive details: version **1.2**, build **5**, bundle ID `com.madebycaseyz.hskdeck`, team `493V3MBMB4`.

## Your steps (do these next)

### 1. Upload to TestFlight (≈5 min)

1. Open **Xcode → Window → Organizer**.
2. Select the latest **HSK Deck** archive (**1.2 / 5**).
3. **Distribute App** → **App Store Connect** → **Upload**.
4. Keep automatic signing. Finish the wizard.
5. In [App Store Connect](https://appstoreconnect.apple.com) → TestFlight: wait for processing, then add yourself as tester / enable the build.

### 2. App Store listing (when ready for public 1.2)

- Attach build **1.2 (5)** to the iOS version.
- Paste What’s New from `V1.2.md`.
- Update privacy answers if needed (Amplitude = analytics data).
