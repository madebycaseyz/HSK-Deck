import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

type UpdatePromptProps = {
  storeVersion: string
  storeUrl: string
  onLater: () => void
}

export function UpdatePrompt({ storeVersion, storeUrl, onLater }: UpdatePromptProps) {
  const openStore = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: storeUrl })
      } else {
        window.open(storeUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open(storeUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="update-overlay" role="dialog" aria-labelledby="update-title" aria-modal="true">
      <div className="update-card">
        <p className="eyebrow">Update available</p>
        <h2 id="update-title" className="update-title">
          HSK Deck {storeVersion} is ready
        </h2>
        <p className="lede update-copy">
          A newer version is on the App Store with improvements and fixes.
        </p>
        <div className="update-actions">
          <button type="button" className="rate-btn know" onClick={() => void openStore()}>
            Update
          </button>
          <button type="button" className="secondary-btn" onClick={onLater}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
