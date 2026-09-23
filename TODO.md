# HSK Deck — TODOs

## Before / after App Store submit

- [ ] **Fix cold-launch black screen (~10s on first open)**  
  Keep splash visible until React + vocab are ready (Capacitor Splash Screen and/or instant HTML loading state). Avoid blocking first paint on the remote CJK webfont CDN. Confirm release builds don’t feel this slow.

## Done for you (2026-07-31)

- [x] `npm run cap:sync` (fresh web build into iOS)
- [x] Release archive created (`build/HSK-Deck.xcarchive`, also copied into Xcode Organizer)
- [ ] CLI upload to App Store Connect — **blocked**: needs your Apple login in Xcode / App Store Connect (no API key on this machine)

Archive details: version **1.0**, build **1**, bundle ID `com.madebycaseyz.hskdeck`, team `493V3MBMB4`.

## Your steps (do these next)

### 1. Upload the archive (≈5 min)

1. Open **Xcode → Window → Organizer** (or **Product → Archive**; the prepared archive should already be listed).
2. Select **HSK Deck / App** archive from today.
3. **Distribute App** → **App Store Connect** → **Upload**.
4. Keep automatic signing. Finish the wizard.
5. If it complains about no app record: create the app in App Store Connect first (step 2), then retry upload.

### 2. Create the App Store Connect listing

Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**:

| Field | Suggested value |
|---|---|
| Platforms | iOS |
| Name | HSK Deck |
| Primary language | English (U.S.) |
| Bundle ID | `com.madebycaseyz.hskdeck` (must match exactly) |
| SKU | `hsk-deck` (any unique string you like) |

### 3. Fill listing + attach build

**Subtitle (30 chars):** `HSK flashcards, offline`

**Description (draft):**
```
HSK Deck helps you study New HSK vocabulary with simple flashcards.

• Levels 1–6 plus the combined 7–9 band
• Flip cards for pinyin and meaning
• Mark words as “I know it well” or “Review again”
• Resume where you left off in each main deck
• Progress stays on your device — no account required

Built for focused practice, not ads or accounts.
```

**Keywords (draft, comma-separated, ≤100 chars):**
```
HSK,Chinese,flashcards,Mandarin,vocabulary,pinyin,study,New HSK
```

Also needed:
- [ ] Screenshots (required): iPhone 6.7" and/or 6.5" sizes — take from your phone or Simulator
- [ ] Privacy policy URL (required even for local-only apps) — host a short page somewhere (GitHub Pages is fine)
- Support URL: use your public Google Site (or any public help page)
- [ ] Age rating questionnaire
- [ ] App Privacy: if still local-only, declare **no data collected**
- [ ] Select the uploaded build once processing finishes (often 5–30 min)

### 4. Optional: TestFlight first

App Store Connect → your app → **TestFlight** → add yourself as Internal Tester → install via the TestFlight app. Good for checking the black-screen issue on a store-like install.

### 5. Submit for Review

When listing + build are ready → **Add for Review** → **Submit**.
