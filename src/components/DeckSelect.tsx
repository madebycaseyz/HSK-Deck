import type { DeckKind } from '../domain/types'
import { getLevelLabel } from '../data/words'

type DeckSelectProps = {
  level: number
  /** Unrated words remaining in main */
  mainCount: number
  /** Full level vocabulary size */
  totalCount: number
  knowCount: number
  reviewCount: number
  resumeIndex: number
  onBack: () => void
  onSelect: (deck: DeckKind) => void
  onOpenWordList: () => void
}

function displayLabel(label: string): string {
  return label === '7-9' ? '7–9' : label
}

export function DeckSelect({
  level,
  mainCount,
  totalCount,
  knowCount,
  reviewCount,
  resumeIndex,
  onBack,
  onSelect,
  onOpenWordList,
}: DeckSelectProps) {
  const resumeLabel =
    mainCount > 0
      ? `Resume at word ${resumeIndex + 1} of ${mainCount}`
      : knowCount + reviewCount > 0
        ? 'All words sorted — nothing left in main'
        : 'No words yet'
  const label = displayLabel(getLevelLabel(level))

  return (
    <div className="page">
      <button type="button" className="text-back" onClick={onBack}>
        ← Levels
      </button>

      <header className="hero compact">
        <p className="eyebrow">HSK Deck</p>
        <h1 className="brand">Level {label}</h1>
        <p className="lede">Choose a deck to study.</p>
      </header>

      <div className="deck-list">
        <button
          type="button"
          className="deck-btn"
          onClick={() => onSelect('main')}
          disabled={mainCount === 0}
        >
          <span className="deck-name">Main deck</span>
          <span className="deck-meta">{resumeLabel}</span>
        </button>
        <button
          type="button"
          className="deck-btn"
          onClick={() => onSelect('know')}
          disabled={knowCount === 0}
        >
          <span className="deck-name">Know it well</span>
          <span className="deck-meta">
            {knowCount === 0 ? 'No words yet' : `${knowCount} word${knowCount === 1 ? '' : 's'}`}
          </span>
        </button>
        <button
          type="button"
          className="deck-btn"
          onClick={() => onSelect('review')}
          disabled={reviewCount === 0}
        >
          <span className="deck-name">Review again</span>
          <span className="deck-meta">
            {reviewCount === 0
              ? 'No words yet'
              : `${reviewCount} word${reviewCount === 1 ? '' : 's'}`}
          </span>
        </button>
      </div>

      <button type="button" className="text-link word-list-link" onClick={onOpenWordList}>
        All words ({totalCount})
      </button>
    </div>
  )
}
