const STORAGE_KEY = 'hsk-deck-review-prompt-v1'
export const REVIEW_PROMPT_EVERY_N_KNOWN = 10
export const SUPPORT_EMAIL = 'madebycaseyz@gmail.com'

export type ReviewPromptOutcome = 'none' | 'yes' | 'no'

export type ReviewPromptState = {
  outcome: ReviewPromptOutcome
  /** Know-count when the prompt was last shown / answered Not now */
  lastShownAtKnowCount: number
}

export function defaultReviewPromptState(): ReviewPromptState {
  return { outcome: 'none', lastShownAtKnowCount: 0 }
}

export function loadReviewPromptState(): ReviewPromptState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultReviewPromptState()
    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>
    return {
      outcome: parsed.outcome === 'yes' || parsed.outcome === 'no' ? parsed.outcome : 'none',
      lastShownAtKnowCount:
        typeof parsed.lastShownAtKnowCount === 'number' && parsed.lastShownAtKnowCount >= 0
          ? parsed.lastShownAtKnowCount
          : 0,
    }
  } catch {
    return defaultReviewPromptState()
  }
}

export function saveReviewPromptState(state: ReviewPromptState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function shouldShowReviewPrompt(
  knownCount: number,
  state: ReviewPromptState,
  options: { updatePromptVisible: boolean },
): boolean {
  if (options.updatePromptVisible) return false
  if (state.outcome !== 'none') return false
  return knownCount >= state.lastShownAtKnowCount + REVIEW_PROMPT_EVERY_N_KNOWN
}

export function markReviewPromptShown(
  _state: ReviewPromptState,
  knownCount: number,
): ReviewPromptState {
  return { outcome: 'none', lastShownAtKnowCount: knownCount }
}

export function markReviewYes(_state: ReviewPromptState, knownCount: number): ReviewPromptState {
  return { outcome: 'yes', lastShownAtKnowCount: knownCount }
}

export function markReviewNo(_state: ReviewPromptState, knownCount: number): ReviewPromptState {
  return { outcome: 'no', lastShownAtKnowCount: knownCount }
}

export function markReviewLater(_state: ReviewPromptState, knownCount: number): ReviewPromptState {
  return { outcome: 'none', lastShownAtKnowCount: knownCount }
}
