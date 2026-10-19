import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  calverBase,
  computeNextVersion,
  utcIsoDate,
} from '../../scripts/calver'

describe('UTC CalVer bump (Req 15.10, 15.11)', () => {
  const oct19 = new Date('2026-10-19T12:00:00Z')

  it('derives YYYY.M.D from the UTC date without zero padding', () => {
    expect(calverBase(new Date('2026-01-05T00:00:00Z'))).toBe('2026.1.5')
    expect(calverBase(oct19)).toBe('2026.10.19')
  })

  it('uses the UTC date, not local time', () => {
    // 23:30 at UTC-5 on Oct 18 is already Oct 19 in UTC.
    expect(calverBase(new Date('2026-10-18T23:30:00-05:00'))).toBe('2026.10.19')
  })

  it('starts a new date at YYYY.M.D', () => {
    expect(computeNextVersion('2026.10.16', oct19)).toBe('2026.10.19')
    expect(computeNextVersion('2026.10.18.4', oct19)).toBe('2026.10.19')
    expect(computeNextVersion('0.0.0', oct19)).toBe('2026.10.19')
  })

  it('appends .1 on the second bump of the same UTC date', () => {
    expect(computeNextVersion('2026.10.19', oct19)).toBe('2026.10.19.1')
  })

  it('increments N on every subsequent same-day bump', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), (n) => {
        expect(computeNextVersion(`2026.10.19.${n}`, oct19)).toBe(
          `2026.10.19.${n + 1}`,
        )
      }),
    )
  })

  it('does not confuse dates that share a prefix', () => {
    // 2026.1.1 is a prefix of 2026.1.19 — must not be treated as same-day.
    const jan1 = new Date('2026-01-01T00:00:00Z')
    expect(computeNextVersion('2026.1.19', jan1)).toBe('2026.1.1')
  })

  it('formats changelog dates as UTC YYYY-MM-DD', () => {
    expect(utcIsoDate(oct19)).toBe('2026-10-19')
  })
})
