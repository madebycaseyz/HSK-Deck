import { describe, expect, it } from 'vitest'
import {
  defaultReviewPromptState,
  markReviewLater,
  markReviewNo,
  markReviewYes,
  shouldShowReviewPrompt,
} from './reviewPrompt'

describe('shouldShowReviewPrompt', () => {
  it('shows at 10 known words the first time', () => {
    const state = defaultReviewPromptState()
    expect(shouldShowReviewPrompt(9, state, { updatePromptVisible: false })).toBe(false)
    expect(shouldShowReviewPrompt(10, state, { updatePromptVisible: false })).toBe(true)
  })

  it('asks again only after 10 more known words following Not now', () => {
    const afterLater = markReviewLater(defaultReviewPromptState(), 10)
    expect(shouldShowReviewPrompt(10, afterLater, { updatePromptVisible: false })).toBe(false)
    expect(shouldShowReviewPrompt(19, afterLater, { updatePromptVisible: false })).toBe(false)
    expect(shouldShowReviewPrompt(20, afterLater, { updatePromptVisible: false })).toBe(true)
  })

  it('never shows after Yes or Not really', () => {
    const yes = markReviewYes(defaultReviewPromptState(), 10)
    const no = markReviewNo(defaultReviewPromptState(), 10)
    expect(shouldShowReviewPrompt(100, yes, { updatePromptVisible: false })).toBe(false)
    expect(shouldShowReviewPrompt(100, no, { updatePromptVisible: false })).toBe(false)
  })

  it('hides while update prompt is visible', () => {
    expect(
      shouldShowReviewPrompt(10, defaultReviewPromptState(), { updatePromptVisible: true }),
    ).toBe(false)
  })
})
