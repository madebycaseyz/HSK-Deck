import { describe, expect, it } from 'vitest'
import {
  applyRating,
  emptyLevelProgress,
  getBasketForWord,
  getDeckWords,
} from './decks'
import type { Word } from './types'

const words: Word[] = [
  {
    id: 'a',
    level: 1,
    levelLabel: '1',
    characters: '一',
    pinyin: 'yī',
    partOfSpeech: '',
    meaning: 'one',
  },
  {
    id: 'b',
    level: 1,
    levelLabel: '1',
    characters: '二',
    pinyin: 'èr',
    partOfSpeech: '',
    meaning: 'two',
  },
  {
    id: 'c',
    level: 1,
    levelLabel: '1',
    characters: '三',
    pinyin: 'sān',
    partOfSpeech: '',
    meaning: 'three',
  },
]

describe('mutually exclusive decks', () => {
  it('puts unrated words only in main', () => {
    const progress = emptyLevelProgress()
    expect(getDeckWords(words, progress, 'main').map((w) => w.id)).toEqual(['a', 'b', 'c'])
    expect(getDeckWords(words, progress, 'know')).toEqual([])
    expect(getDeckWords(words, progress, 'review')).toEqual([])
  })

  it('moves a rated word out of main into know or review', () => {
    let progress = applyRating(emptyLevelProgress(), 'a', 'know')
    expect(getDeckWords(words, progress, 'main').map((w) => w.id)).toEqual(['b', 'c'])
    expect(getDeckWords(words, progress, 'know').map((w) => w.id)).toEqual(['a'])
    expect(getBasketForWord(progress, 'a')).toBe('know')

    progress = applyRating(progress, 'b', 'review')
    expect(getDeckWords(words, progress, 'main').map((w) => w.id)).toEqual(['c'])
    expect(getDeckWords(words, progress, 'review').map((w) => w.id)).toEqual(['b'])
  })

  it('re-rating moves between know and review', () => {
    let progress = applyRating(emptyLevelProgress(), 'a', 'know')
    progress = applyRating(progress, 'a', 'review')
    expect(getDeckWords(words, progress, 'know')).toEqual([])
    expect(getDeckWords(words, progress, 'review').map((w) => w.id)).toEqual(['a'])
    expect(getDeckWords(words, progress, 'main').map((w) => w.id)).toEqual(['b', 'c'])
  })
})
