import { InAppReview } from '@capacitor-community/in-app-review'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { APP_BUNDLE_ID } from '../version'

async function openWriteReviewPage(): Promise<void> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(APP_BUNDLE_ID)}&t=${Date.now()}`,
    )
    if (res.ok) {
      const data = (await res.json()) as {
        results?: Array<{ trackId?: number; trackViewUrl?: string }>
      }
      const app = data.results?.[0]
      const url = app?.trackId
        ? `https://apps.apple.com/app/id${app.trackId}?action=write-review`
        : app?.trackViewUrl
      if (url) {
        if (Capacitor.isNativePlatform()) await Browser.open({ url })
        else window.open(url, '_blank', 'noopener,noreferrer')
        return
      }
    }
  } catch {
    // fall through
  }
}

/** Ask for a rating via StoreKit when possible; otherwise open the write-review URL. */
export async function requestAppReview(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await InAppReview.requestReview()
      return
    }
  } catch {
    // fall through to URL
  }
  await openWriteReviewPage()
}
