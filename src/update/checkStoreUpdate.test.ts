import { describe, expect, it } from 'vitest'
import { compareVersions } from './checkStoreUpdate'

describe('compareVersions', () => {
  it('detects newer store versions', () => {
    expect(compareVersions('1.1', '1.0')).toBeGreaterThan(0)
    expect(compareVersions('1.0', '1.1')).toBeLessThan(0)
    expect(compareVersions('1.1', '1.1')).toBe(0)
    expect(compareVersions('1.1.0', '1.1')).toBe(0)
    expect(compareVersions('2.0', '1.9')).toBeGreaterThan(0)
  })
})
