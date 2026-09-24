import { useState } from 'react'
import { SUPPORT_EMAIL } from '../review/reviewPrompt'

type ReviewPromptProps = {
  onYes: () => void
  onNotReally: () => void
  onNotNow: () => void
}

export function ReviewPrompt({ onYes, onNotReally, onNotNow }: ReviewPromptProps) {
  const [mode, setMode] = useState<'ask' | 'support'>('ask')

  if (mode === 'support') {
    return (
      <div className="update-overlay" role="dialog" aria-labelledby="support-title" aria-modal="true">
        <div className="update-card">
          <p className="eyebrow">Feedback</p>
          <h2 id="support-title" className="update-title">
            Thanks for telling us
          </h2>
          <p className="lede update-copy">
            Questions or feedback? Email{' '}
            <a className="support-email" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <div className="update-actions">
            <a className="rate-btn know support-mail-btn" href={`mailto:${SUPPORT_EMAIL}`}>
              Email support
            </a>
            <button type="button" className="secondary-btn" onClick={onNotReally}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="update-overlay" role="dialog" aria-labelledby="review-title" aria-modal="true">
      <div className="update-card">
        <p className="eyebrow">Quick question</p>
        <h2 id="review-title" className="update-title">
          Enjoying HSK Deck?
        </h2>
        <p className="lede update-copy">
          If it’s helping you study, a short App Store rating means a lot.
        </p>
        <div className="update-actions">
          <button type="button" className="rate-btn know" onClick={onYes}>
            Yes
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setMode('support')}
          >
            Not really
          </button>
          <button type="button" className="secondary-btn" onClick={onNotNow}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
