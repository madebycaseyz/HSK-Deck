import { describe, expect, it, vi, beforeEach } from 'vitest'
import { speak } from './speak'

class FakeUtterance {
  text: string
  lang = ''
  voice: SpeechSynthesisVoice | null = null
  constructor(text: string) {
    this.text = text
  }
}

describe('speak', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })

  it('no-ops when speechSynthesis is missing', () => {
    vi.stubGlobal('speechSynthesis', undefined)
    expect(() => speak('你好', 'zh-CN')).not.toThrow()
  })

  it('no-ops on empty text', () => {
    const cancel = vi.fn()
    const speakFn = vi.fn()
    vi.stubGlobal('speechSynthesis', { cancel, speak: speakFn, getVoices: () => [] })
    speak('   ', 'zh-CN')
    expect(speakFn).not.toHaveBeenCalled()
  })

  it('cancels then speaks with the given lang', () => {
    const cancel = vi.fn()
    const speakFn = vi.fn()
    vi.stubGlobal('speechSynthesis', {
      cancel,
      speak: speakFn,
      getVoices: () => [{ lang: 'zh-CN', name: 'Tingting' }],
    })

    speak('你好', 'zh-CN')

    expect(cancel).toHaveBeenCalledOnce()
    expect(speakFn).toHaveBeenCalledOnce()
    const utterance = speakFn.mock.calls[0]![0] as FakeUtterance
    expect(utterance.text).toBe('你好')
    expect(utterance.lang).toBe('zh-CN')
  })
})
