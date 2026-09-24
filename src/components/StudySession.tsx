import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { getLevelLabel } from '../data/words'
import type { DeckKind, Rating, Word } from '../domain/types'
import { speak } from '../speech/speak'

type StudySessionProps = {
  level: number
  deck: DeckKind
  words: Word[]
  index: number
  complete: boolean
  onBack: () => void
  onFlipNavigate: (delta: number) => void
  onRate: (rating: Rating) => void
  onRestart: () => void
}

const deckTitles: Record<DeckKind, string> = {
  main: 'Main deck',
  know: 'I know it well',
  review: 'Review again',
}

const SWIPE_THRESHOLD_PX = 48

function displayLabel(label: string): string {
  return label === '7-9' ? '7–9' : label
}

function SpeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a4.5 4.5 0 010 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6a8 8 0 010 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StudySession({
  level,
  deck,
  words,
  index,
  complete,
  onBack,
  onFlipNavigate,
  onRate,
  onRestart,
}: StudySessionProps) {
  const [flipped, setFlipped] = useState(false)
  const word = words[index]
  const levelLabel = displayLabel(getLevelLabel(level))
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)

  useEffect(() => {
    setFlipped(false)
  }, [word?.id, index])

  if (complete) {
    return (
      <div className="page">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <div className="empty-state">
          <h1 className="brand">Deck complete</h1>
          <p className="lede">
            You’ve reached the end of {deckTitles[deck].toLowerCase()} for HSK {levelLabel}.
          </p>
          <div className="done-actions">
            <button type="button" className="rate-btn know" onClick={onRestart}>
              Start from beginning
            </button>
            <button type="button" className="secondary-btn" onClick={onBack}>
              Back to decks
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (words.length === 0 || !word) {
    return (
      <div className="page">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <div className="empty-state">
          <h1 className="brand">Nothing here yet</h1>
          <p className="lede">
            {deck === 'know' || deck === 'review'
              ? 'Rate words from the main deck to fill this list.'
              : 'No vocabulary loaded for this level.'}
          </p>
        </div>
      </div>
    )
  }

  const hasMeaning = Boolean(word.meaning.trim())
  const meaningText = hasMeaning ? word.meaning : '—'

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
    didSwipe.current = false
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return

    didSwipe.current = true
    // Swipe left → next; swipe right → previous
    if (dx < 0) {
      if (index < words.length - 1) onFlipNavigate(1)
    } else if (index > 0) {
      onFlipNavigate(-1)
    }
  }

  const onCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    setFlipped((f) => !f)
  }

  return (
    <div className="page study">
      <div className="study-top">
        <button type="button" className="text-back" onClick={onBack}>
          ← Decks
        </button>
        <p className="study-meta">
          HSK {levelLabel} · {deckTitles[deck]} · {index + 1}/{words.length}
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={onCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onCardClick()
          }
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
        aria-label={flipped ? 'Show character' : 'Show pinyin and meaning'}
      >
        <div
          className="flashcard-face flashcard-front"
          data-char-count={[...word.characters].length}
        >
          <div className="hanzi-stack">
            <span className="hanzi">{word.characters}</span>
            <button
              type="button"
              className="speak-btn"
              aria-label="Play Chinese pronunciation"
              onClick={(e) => {
                e.stopPropagation()
                speak(word.characters, 'zh-CN')
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <SpeakerIcon />
            </button>
          </div>
          <span className="tap-hint">Tap to flip · Swipe for next</span>
        </div>
        <div className="flashcard-face flashcard-back">
          <span className="pinyin">{word.pinyin}</span>
          <div className="card-line meaning-line">
            <span className="meaning">{meaningText}</span>
            {hasMeaning ? (
              <button
                type="button"
                className="speak-btn"
                aria-label="Play English meaning"
                onClick={(e) => {
                  e.stopPropagation()
                  speak(word.meaning, 'en-US')
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <SpeakerIcon />
              </button>
            ) : null}
          </div>
          {word.partOfSpeech ? (
            <span className="pos">{word.partOfSpeech}</span>
          ) : null}
        </div>
      </div>

      <div className="controls">
        <div className="rate-row">
          <button
            type="button"
            className="rate-btn review"
            onClick={(e) => {
              e.stopPropagation()
              onRate('review')
            }}
          >
            Review again
          </button>
          <button
            type="button"
            className="rate-btn know"
            onClick={(e) => {
              e.stopPropagation()
              onRate('know')
            }}
          >
            I know it well
          </button>
        </div>
      </div>
    </div>
  )
}
