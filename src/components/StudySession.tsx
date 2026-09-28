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

const SWIPE_THRESHOLD_PX = 56
const DRAG_LOCK_PX = 10
const EXIT_DISTANCE_PX = 440
const SWIPE_ANIM_MS = 220
const ROTATE_PER_PX = 0.045

type SwipePhase = 'idle' | 'dragging' | 'returning'

type ExitOverlay = {
  word: Word
  x: number
  rotating: boolean
}

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

/** Card waiting underneath: next when idle/left, previous when dragging right. */
function peekUnderWord(
  words: Word[],
  index: number,
  offsetX: number,
  exitDir: -1 | 0 | 1,
): Word | null {
  const dir = exitDir !== 0 ? exitDir : offsetX > 12 ? 1 : offsetX < -12 ? -1 : 0
  if (dir > 0 && index > 0) return words[index - 1] ?? null
  if (dir < 0 && index < words.length - 1) return words[index + 1] ?? null
  if (index < words.length - 1) return words[index + 1] ?? null
  return null
}

function FlashcardFaces({
  word,
  interactive,
}: {
  word: Word
  interactive: boolean
}) {
  const hasMeaning = Boolean(word.meaning.trim())
  const meaningText = hasMeaning ? word.meaning : '—'

  return (
    <>
      <div
        className="flashcard-face flashcard-front"
        data-char-count={[...word.characters].length}
      >
        <div className="hanzi-stack">
          <span className="hanzi">{word.characters}</span>
          {interactive ? (
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
          ) : (
            <span className="speak-btn speak-btn-ghost" aria-hidden>
              <SpeakerIcon />
            </span>
          )}
        </div>
        {interactive ? (
          <span className="tap-hint">Tap to flip · Swipe for next</span>
        ) : null}
      </div>
      <div className="flashcard-face flashcard-back">
        <span className="pinyin">{word.pinyin}</span>
        <div className="card-line meaning-line">
          <span className="meaning">{meaningText}</span>
          {interactive && hasMeaning ? (
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
        {word.partOfSpeech ? <span className="pos">{word.partOfSpeech}</span> : null}
      </div>
    </>
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
  const [offsetX, setOffsetX] = useState(0)
  const [phase, setPhase] = useState<SwipePhase>('idle')
  const [exitOverlay, setExitOverlay] = useState<ExitOverlay | null>(null)
  /** While the top card is flying away, keep the revealed card pinned underneath. */
  const [pinnedUnder, setPinnedUnder] = useState<Word | null>(null)
  const word = words[index]
  const levelLabel = displayLabel(getLevelLabel(level))
  const pointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const offsetRef = useRef(0)
  const phaseRef = useRef<SwipePhase>('idle')
  const exitDirRef = useRef<-1 | 0 | 1>(0)
  const didSwipe = useRef(false)
  const animTimer = useRef<number | null>(null)
  const exitRaf = useRef<number | null>(null)

  const setPhaseBoth = (next: SwipePhase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const clearAnimTimer = () => {
    if (animTimer.current !== null) {
      window.clearTimeout(animTimer.current)
      animTimer.current = null
    }
    if (exitRaf.current !== null) {
      window.cancelAnimationFrame(exitRaf.current)
      exitRaf.current = null
    }
  }

  useEffect(() => {
    setFlipped(false)
  }, [word?.id, index])

  useEffect(() => () => clearAnimTimer(), [])

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

  const underWord =
    pinnedUnder ?? peekUnderWord(words, index, offsetX, exitDirRef.current)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current === 'returning' || exitOverlay) return
    pointerStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    didSwipe.current = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || e.pointerId !== start.pointerId) return
    if (phaseRef.current === 'returning' || exitOverlay) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y

    if (phaseRef.current !== 'dragging') {
      if (Math.abs(dx) < DRAG_LOCK_PX) return
      if (Math.abs(dx) <= Math.abs(dy)) {
        pointerStart.current = null
        e.currentTarget.releasePointerCapture?.(start.pointerId)
        return
      }
      didSwipe.current = true
      setPhaseBoth('dragging')
    }

    offsetRef.current = dx
    setOffsetX(dx)
  }

  const finishReturn = () => {
    offsetRef.current = 0
    exitDirRef.current = 0
    setOffsetX(0)
    setPhaseBoth('idle')
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start || e.pointerId !== start.pointerId) return

    e.currentTarget.releasePointerCapture?.(start.pointerId)

    if (phaseRef.current !== 'dragging') return

    const dx = offsetRef.current
    const goNext = dx < -SWIPE_THRESHOLD_PX && index < words.length - 1
    const goPrev = dx > SWIPE_THRESHOLD_PX && index > 0

    if (goNext || goPrev) {
      const delta = goNext ? 1 : -1
      const exitX = dx < 0 ? -EXIT_DISTANCE_PX : EXIT_DISTANCE_PX
      const revealed = words[index + delta]
      didSwipe.current = true

      // Fly only the leaving card; keep the revealed card pinned in place underneath.
      setExitOverlay({ word, x: dx, rotating: false })
      if (revealed) setPinnedUnder(revealed)
      offsetRef.current = 0
      exitDirRef.current = 0
      setOffsetX(0)
      setPhaseBoth('idle')
      setFlipped(false)
      onFlipNavigate(delta)

      clearAnimTimer()
      exitRaf.current = window.requestAnimationFrame(() => {
        setExitOverlay((prev) => (prev ? { ...prev, x: exitX, rotating: true } : null))
        animTimer.current = window.setTimeout(() => {
          setExitOverlay(null)
          setPinnedUnder(null)
          animTimer.current = null
        }, SWIPE_ANIM_MS)
      })
      return
    }

    exitDirRef.current = 0
    setPhaseBoth('returning')
    offsetRef.current = 0
    setOffsetX(0)
    clearAnimTimer()
    animTimer.current = window.setTimeout(finishReturn, SWIPE_ANIM_MS)
  }

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (start) {
      e.currentTarget.releasePointerCapture?.(start.pointerId)
    }
    if (phaseRef.current === 'dragging') {
      exitDirRef.current = 0
      setPhaseBoth('returning')
      offsetRef.current = 0
      setOffsetX(0)
      clearAnimTimer()
      animTimer.current = window.setTimeout(finishReturn, SWIPE_ANIM_MS)
    }
  }

  const onCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    if (phaseRef.current !== 'idle' || exitOverlay) return
    setFlipped((f) => !f)
  }

  const underScale = exitOverlay
    ? 1
    : 0.97 + Math.min(0.03, (Math.abs(offsetX) / EXIT_DISTANCE_PX) * 0.03)
  const topStyle =
    phase === 'idle' && offsetX === 0
      ? undefined
      : {
          transform: `translateX(${offsetX}px) rotate(${offsetX * ROTATE_PER_PX}deg)`,
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

      <div className="flashcard-stack">
        {underWord ? (
          <div
            className="flashcard flashcard-under"
            style={{ transform: `scale(${underScale})` }}
            aria-hidden="true"
          >
            <FlashcardFaces word={underWord} interactive={false} />
          </div>
        ) : null}

        {/* Hide the interactive top while the leaving card flies away, so it can't
            snap/slide back in over the card already revealed underneath. */}
        {exitOverlay ? null : (
          <div
            role="button"
            tabIndex={0}
            className={[
              'flashcard',
              'flashcard-top',
              flipped ? 'is-flipped' : '',
              phase === 'dragging' ? 'is-dragging' : '',
              phase === 'returning' ? 'is-swipe-animating' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={topStyle}
            onClick={onCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCardClick()
              }
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            aria-label={flipped ? 'Show character' : 'Show pinyin and meaning'}
          >
            <FlashcardFaces word={word} interactive />
          </div>
        )}

        {exitOverlay ? (
          <div
            className={[
              'flashcard',
              'flashcard-exit',
              exitOverlay.rotating ? 'is-swipe-animating' : 'is-dragging',
            ].join(' ')}
            style={{
              transform: `translateX(${exitOverlay.x}px) rotate(${exitOverlay.x * ROTATE_PER_PX}deg)`,
            }}
            aria-hidden="true"
          >
            <FlashcardFaces word={exitOverlay.word} interactive={false} />
          </div>
        ) : null}
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
