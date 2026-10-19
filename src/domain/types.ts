export type Rating = 'know' | 'review'

export type DeckKind = 'main' | 'know' | 'review'

export type Word = {
  id: string
  level: number
  /** Display label such as "1" or "7-9" */
  levelLabel: string
  characters: string
  pinyin: string
  partOfSpeech: string
  meaning: string
}

export type LevelProgress = {
  /** Index into the main deck word list */
  mainIndex: number
  /** Latest rating per word id. Unrated = main; know/review leave main. */
  ratings: Record<string, Rating>
  knowIndex: number
  reviewIndex: number
}

export type ProgressStore = Record<string, LevelProgress>
