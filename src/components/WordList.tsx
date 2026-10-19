import { getLevelLabel } from '../data/words'
import { getBasketForWord } from '../domain/decks'
import type { LevelProgress, Word } from '../domain/types'

type WordListProps = {
  level: number
  words: Word[]
  progress: LevelProgress
  onBack: () => void
}

function displayLabel(label: string): string {
  return label === '7-9' ? '7–9' : label
}

const badgeLabel = {
  main: 'M',
  know: 'K',
  review: 'R',
} as const

export function WordList({ level, words, progress, onBack }: WordListProps) {
  const label = displayLabel(getLevelLabel(level))

  return (
    <div className="page word-list-page">
      <button type="button" className="text-back" onClick={onBack}>
        ← Decks
      </button>

      <header className="hero compact">
        <p className="eyebrow">HSK {label}</p>
        <h1 className="brand">All words</h1>
        <p className="lede">{words.length} word{words.length === 1 ? '' : 's'}</p>
      </header>

      <ul className="word-list">
        {words.map((word) => {
          const basket = getBasketForWord(progress, word.id)
          return (
            <li key={word.id} className="word-list-row">
              <div className="word-list-main">
                <span className="word-list-hanzi">{word.characters}</span>
                <span className="word-list-pinyin">{word.pinyin}</span>
              </div>
              <span
                className={`word-list-badge basket-${basket}`}
                title={
                  basket === 'main'
                    ? 'Main deck'
                    : basket === 'know'
                      ? 'Know it well'
                      : 'Review again'
                }
              >
                {badgeLabel[basket]}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
