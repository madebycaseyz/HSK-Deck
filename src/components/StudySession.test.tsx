import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StudySession } from './StudySession'
import type { Word } from '../domain/types'

vi.mock('../data/words', () => ({
  getLevelLabel: () => '1',
}))

const speakMock = vi.fn()
vi.mock('../speech/speak', () => ({
  speak: (...args: unknown[]) => speakMock(...args),
}))

const sampleWords: Word[] = [
  {
    id: '1',
    level: 1,
    levelLabel: '1',
    characters: '你好',
    pinyin: 'nǐ hǎo',
    partOfSpeech: '感',
    meaning: 'hello',
  },
  {
    id: '2',
    level: 1,
    levelLabel: '1',
    characters: '谢谢',
    pinyin: 'xièxie',
    partOfSpeech: '动',
    meaning: 'thanks',
  },
  {
    id: '3',
    level: 1,
    levelLabel: '1',
    characters: '空',
    pinyin: 'kōng',
    partOfSpeech: '',
    meaning: '',
  },
]

function renderSession(
  overrides: Partial<Parameters<typeof StudySession>[0]> = {},
) {
  const props = {
    level: 1,
    deck: 'main' as const,
    words: sampleWords,
    index: 0,
    complete: false,
    onBack: vi.fn(),
    onFlipNavigate: vi.fn(),
    onRate: vi.fn(),
    onRestart: vi.fn(),
    ...overrides,
  }
  return { ...render(<StudySession {...props} />), props }
}

describe('StudySession v1', () => {
  beforeEach(() => {
    speakMock.mockReset()
  })

  it('has no arrow navigation buttons', () => {
    renderSession()
    expect(screen.queryByRole('button', { name: 'Previous card' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next card' })).toBeNull()
  })

  it('plays Chinese TTS without flipping the card', async () => {
    const user = userEvent.setup()
    renderSession()

    const card = screen.getByRole('button', { name: /Show pinyin and meaning/i })
    expect(card).not.toHaveClass('is-flipped')
    await user.click(screen.getByRole('button', { name: 'Play Chinese pronunciation' }))
    expect(speakMock).toHaveBeenCalledWith('你好', 'zh-CN')
    expect(card).not.toHaveClass('is-flipped')
  })

  it('plays English TTS on the back for meanings', async () => {
    const user = userEvent.setup()
    renderSession()

    await user.click(screen.getByRole('button', { name: /Show pinyin and meaning/i }))
    expect(screen.getByText('hello')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play English meaning' }))
    expect(speakMock).toHaveBeenCalledWith('hello', 'en-US')
  })

  it('hides English speaker when meaning is empty', async () => {
    const user = userEvent.setup()
    renderSession({ index: 2, words: sampleWords })

    await user.click(screen.getByRole('button', { name: /Show pinyin and meaning/i }))
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play English meaning' })).toBeNull()
  })

  it('swipes left to go next and right to go previous', () => {
    vi.useFakeTimers()
    const { props } = renderSession({ index: 1 })
    const card = screen.getByRole('button', { name: /Show pinyin and meaning/i })

    card.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, clientY: 100, bubbles: true, pointerId: 1 }),
    )
    card.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 120, clientY: 102, bubbles: true, pointerId: 1 }),
    )
    card.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 100, clientY: 105, bubbles: true, pointerId: 1 }),
    )
    expect(props.onFlipNavigate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(220)
    expect(props.onFlipNavigate).toHaveBeenCalledWith(1)

    vi.mocked(props.onFlipNavigate).mockClear()

    card.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true, pointerId: 2 }),
    )
    card.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 180, clientY: 100, bubbles: true, pointerId: 2 }),
    )
    card.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 200, clientY: 100, bubbles: true, pointerId: 2 }),
    )
    vi.advanceTimersByTime(220)
    expect(props.onFlipNavigate).toHaveBeenCalledWith(-1)

    vi.useRealTimers()
  })

  it('still rates words', async () => {
    const user = userEvent.setup()
    const { props } = renderSession()
    await user.click(screen.getByRole('button', { name: 'I know it well' }))
    expect(props.onRate).toHaveBeenCalledWith('know')
  })
})
