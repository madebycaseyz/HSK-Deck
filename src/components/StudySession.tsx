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
  onRequestComplete: () => void
  onDismissComplete: () => void
  onRate: (rating: Rating) => void
  onRestart: () => void
}

const deckTitles: Record<DeckKind, string> = {
  main: 'Main deck',
  know: 'Know it well',
  review: 'Review again',
}

const SWIPE_THRESHOLD_PX = 56
const DRAG_LOCK_PX = 10
const EXIT_DISTANCE_PX = 440
const SWIPE_ANIM_MS = 220
const ROTATE_PER_PX = 0.045

type SwipePhase = 'idle' | 'dragging' | 'returning'

type FlyCard = {
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
  onRequestComplete,
  onDismissComplete,
  onRate,
  onRestart,
}: StudySessionProps) {
  const [flipped, setFlipped] = useState(false)
  const [offsetX, setOffsetX] = useState(0)
  const [phase, setPhase] = useState<SwipePhase>('idle')
  /** Leaving card flying left (next). */
  const [exitOverlay, setExitOverlay] = useState<FlyCard | null>(null)
  /** Previous card sliding in from the left (take back). */
  const [enterOverlay, setEnterOverlay] = useState<FlyCard | null>(null)
  const [pinnedUnder, setPinnedUnder] = useState<Word | null>(null)
  const word = words[index]
  const levelLabel = displayLabel(getLevelLabel(level))
  const pointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const offsetRef = useRef(0)
  const phaseRef = useRef<SwipePhase>('idle')
  const didSwipe = useRef(false)
  const animTimer = useRef<number | null>(null)
  const busy = exitOverlay !== null || enterOverlay !== null

  const setPhaseBoth = (next: SwipePhase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const clearAnimTimer = () => {
    if (animTimer.current !== null) {
      window.clearTimeout(animTimer.current)
      animTimer.current = null
    }
  }

  const afterPaint = (fn: () => void) => {
    clearAnimTimer()
    animTimer.current = window.setTimeout(fn, 0)
  }

  useEffect(() => {
    setFlipped(false)
  }, [word?.id, index])

  useEffect(() => () => clearAnimTimer(), [])

  const onCompletePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Don't capture when pressing buttons — that blocks click handlers.
    if ((e.target as HTMLElement | null)?.closest?.('button')) return
    pointerStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    didSwipe.current = false
  }

  const onCompletePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return
    if (dx > 0 && words.length > 0) {
      didSwipe.current = true
      onDismissComplete()
    }
  }

  if (complete) {
    return (
      <div
        className="page study deck-complete"
        onPointerDown={onCompletePointerDown}
        onPointerUp={onCompletePointerUp}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
      >
        <div className="study-top">
          <button
            type="button"
            className="text-back"
            onClick={onBack}
            onPointerDown={(e) => e.stopPropagation()}
          >
            ← Decks
          </button>
        </div>
        <div className="deck-complete-body">
          <p className="eyebrow">Done</p>
          <h1 className="brand">Deck complete</h1>
          <p className="lede">
            You’ve reached the end of {deckTitles[deck].toLowerCase()} for HSK {levelLabel}.
          </p>
          <div className="done-actions">
            <button
              type="button"
              className="rate-btn know"
              onClick={onRestart}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Start from beginning
            </button>
          </div>
          {words.length > 0 ? (
            <p className="tap-hint complete-hint">Swipe right to go back</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (words.length === 0 || !word) {
    return (
      <div className="page study">
        <div className="study-top">
          <button type="button" className="text-back" onClick={onBack}>
            ← Decks
          </button>
        </div>
        <div className="deck-complete-body">
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

  const prevWord = index > 0 ? words[index - 1] : null
  const nextWord = index < words.length - 1 ? words[index + 1] : null

  /** While dragging left, next sits under; while dragging right, current stays and prev peeks in. */
  const underWord =
    pinnedUnder ??
    (offsetX < -12 || exitOverlay ? nextWord : null)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current === 'returning' || busy) return
    pointerStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    didSwipe.current = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || e.pointerId !== start.pointerId) return
    if (phaseRef.current === 'returning' || busy) return

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
    const goComplete = dx < -SWIPE_THRESHOLD_PX && index >= words.length - 1
    const goPrev = dx > SWIPE_THRESHOLD_PX && index > 0

    if (goNext) {
      const revealed = words[index + 1]
      didSwipe.current = true
      setExitOverlay({ word, x: dx, rotating: false })
      if (revealed) setPinnedUnder(revealed)
      offsetRef.current = 0
      setOffsetX(0)
      setPhaseBoth('idle')
      setFlipped(false)
      onFlipNavigate(1)

      afterPaint(() => {
        setExitOverlay((prev) =>
          prev ? { ...prev, x: -EXIT_DISTANCE_PX, rotating: true } : null,
        )
        animTimer.current = window.setTimeout(() => {
          setExitOverlay(null)
          setPinnedUnder(null)
          animTimer.current = null
        }, SWIPE_ANIM_MS)
      })
      return
    }

    if (goComplete) {
      didSwipe.current = true
      setExitOverlay({ word, x: dx, rotating: false })
      offsetRef.current = 0
      setOffsetX(0)
      setPhaseBoth('idle')
      setFlipped(false)
      afterPaint(() => {
        setExitOverlay((prev) =>
          prev ? { ...prev, x: -EXIT_DISTANCE_PX, rotating: true } : null,
        )
        animTimer.current = window.setTimeout(() => {
          setExitOverlay(null)
          onRequestComplete()
          animTimer.current = null
        }, SWIPE_ANIM_MS)
      })
      return
    }

    if (goPrev && prevWord) {
      didSwipe.current = true
      // Previous card slides in from the left; current stays put underneath.
      setEnterOverlay({ word: prevWord, x: Math.min(0, dx - EXIT_DISTANCE_PX), rotating: false })
      offsetRef.current = 0
      setOffsetX(0)
      setPhaseBoth('idle')
      setFlipped(false)

      afterPaint(() => {
        setEnterOverlay((prev) => (prev ? { ...prev, x: 0, rotating: true } : null))
        animTimer.current = window.setTimeout(() => {
          onFlipNavigate(-1)
          setEnterOverlay(null)
          animTimer.current = null
        }, SWIPE_ANIM_MS)
      })
      return
    }

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
    if (phaseRef.current !== 'idle' || busy) return
    setFlipped((f) => !f)
  }

  const draggingLeft = offsetX < 0
  const draggingRight = offsetX > 0 && prevWord

  const topStyle =
    phase === 'idle' && offsetX === 0
      ? undefined
      : draggingRight
        ? undefined // current stays put while previous enters
        : {
            transform: `translateX(${offsetX}px) rotate(${offsetX * ROTATE_PER_PX}deg)`,
          }

  const underScale =
    exitOverlay || enterOverlay
      ? 1
      : draggingLeft
        ? 0.97 + Math.min(0.03, (Math.abs(offsetX) / EXIT_DISTANCE_PX) * 0.03)
        : 0.97

  const liveEnterX = draggingRight
    ? Math.min(0, offsetX - EXIT_DISTANCE_PX)
    : null

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
        {underWord && !draggingRight ? (
          <div
            className="flashcard flashcard-under"
            style={{ transform: `scale(${underScale})` }}
            aria-hidden="true"
          >
            <FlashcardFaces word={underWord} interactive={false} />
          </div>
        ) : null}

        {/* Current card — hidden only while exiting left */}
        {exitOverlay ? null : (
          <div
            role="button"
            tabIndex={0}
            className={[
              'flashcard',
              'flashcard-top',
              flipped ? 'is-flipped' : '',
              phase === 'dragging' && draggingLeft ? 'is-dragging' : '',
              phase === 'returning' ? 'is-swipe-animating' : '',
              enterOverlay ? 'flashcard-under-current' : '',
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

        {/* Live previous card while dragging right */}
        {liveEnterX !== null && prevWord && !enterOverlay ? (
          <div
            className="flashcard flashcard-enter is-dragging"
            style={{
              transform: `translateX(${liveEnterX}px) rotate(${liveEnterX * ROTATE_PER_PX}deg)`,
            }}
            aria-hidden="true"
          >
            <FlashcardFaces word={prevWord} interactive={false} />
          </div>
        ) : null}

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

        {enterOverlay ? (
          <div
            className={[
              'flashcard',
              'flashcard-enter',
              enterOverlay.rotating ? 'is-swipe-animating' : 'is-dragging',
            ].join(' ')}
            style={{
              transform: `translateX(${enterOverlay.x}px) rotate(${enterOverlay.x * ROTATE_PER_PX}deg)`,
            }}
            aria-hidden="true"
          >
            <FlashcardFaces word={enterOverlay.word} interactive={false} />
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
            Know it well
          </button>
        </div>
      </div>
    </div>
  )
}
