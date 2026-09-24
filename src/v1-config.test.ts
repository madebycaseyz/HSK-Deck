import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('v1 config contracts', () => {
  it('does not load LXGW CDN webfont in index.html', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).not.toMatch(/lxgw|jsdelivr\.net\/npm\/@hanzi/i)
  })

  it('uses a single system Chinese stack without LXGW for hanzi', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf8')
    expect(css).not.toMatch(/LXGW WenKai/)
    expect(css).toMatch(/--font-hanzi:\s*'PingFang SC'/)
  })

  it('keeps a fixed hanzi size with half-em sides for 3-char words', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf8')
    expect(css).toMatch(/\.flashcard\s*\{[^}]*container-type:\s*inline-size/s)
    expect(css).toMatch(
      /\.flashcard-front\s*\{[^}]*font-size:\s*min\(6\.25rem,\s*calc\(100cqi\s*\/\s*4\)\)/s,
    )
    expect(css).toMatch(/\.flashcard-front\s*\{[^}]*padding-inline:\s*1em/s)
    expect(css).toMatch(
      /\.flashcard-front\[data-char-count=['"]3['"]\]\s*\{[^}]*padding-inline:\s*0\.5em/s,
    )
    expect(css).not.toMatch(/\.hanzi\s*\{[^}]*font-size:\s*clamp\(3\.5rem/s)
  })
})
