/** Speak text with the device/browser TTS engine. */
export function speak(text: string, lang: string): void {
  const trimmed = text.trim()
  if (!trimmed) return
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = lang

  const voices = window.speechSynthesis.getVoices()
  const exact = voices.find((v) => v.lang === lang)
  const prefix = lang.split('-')[0] ?? lang
  const fuzzy = voices.find((v) => v.lang === prefix || v.lang.startsWith(`${prefix}-`))
  utterance.voice = exact ?? fuzzy ?? null

  window.speechSynthesis.speak(utterance)
}
