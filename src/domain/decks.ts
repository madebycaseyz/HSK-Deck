import type { DeckKind, LevelProgress, ProgressStore, Rating, Word } from './types'

export function emptyLevelProgress(): LevelProgress {
  return {
    mainIndex: 0,
    ratings: {},
    knowIndex: 0,
    reviewIndex: 0,
  }
}

export function getDeckWords(
  mainWords: Word[],
  progress: LevelProgress,
  deck: DeckKind,
): Word[] {
  if (deck === 'main') return mainWords
  const rating: Rating = deck === 'know' ? 'know' : 'review'
  return mainWords.filter((w) => progress.ratings[w.id] === rating)
}

export function getDeckIndex(progress: LevelProgress, deck: DeckKind): number {
  if (deck === 'main') return progress.mainIndex
  if (deck === 'know') return progress.knowIndex
  return progress.reviewIndex
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

/** Apply rating (latest wins). Returns progress and whether the current deck list will shrink. */
export function applyRating(
  progress: LevelProgress,
  wordId: string,
  rating: Rating,
): LevelProgress {
  return {
    ...progress,
    ratings: {
      ...progress.ratings,
      [wordId]: rating,
    },
  }
}

export function withDeckIndex(
  progress: LevelProgress,
  deck: DeckKind,
  index: number,
): LevelProgress {
  if (deck === 'main') return { ...progress, mainIndex: index }
  if (deck === 'know') return { ...progress, knowIndex: index }
  return { ...progress, reviewIndex: index }
}

export function countRatings(progress: LevelProgress): { know: number; review: number } {
  let know = 0
  let review = 0
  for (const r of Object.values(progress.ratings)) {
    if (r === 'know') know += 1
    else if (r === 'review') review += 1
  }
  return { know, review }
}

/** Unique words marked “I know it well” across all levels. */
export function countKnownWords(store: ProgressStore): number {
  let know = 0
  for (const progress of Object.values(store)) {
    for (const r of Object.values(progress.ratings)) {
      if (r === 'know') know += 1
    }
  }
  return know
}
