import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  changelogSlug,
  compareCalVer,
  computeNextVersion,
  parseCalVer,
  utcIsoDate,
} from '../../scripts/calver'

// SemVer 2.0 core version: three numeric parts without leading zeros.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

describe('UTC CalVer bump (Req 15.10, 15.11)', () => {
  const oct19 = new Date('2026-10-19T12:00:00Z')

  it('opens a month with the monthly release YYYY.M.0', () => {
    expect(computeNextVersion('2026.9.28', oct19)).toBe('2026.10.0')
    expect(computeNextVersion('2025.12.31', oct19)).toBe('2026.10.0')
    expect(computeNextVersion('0.0.0', oct19)).toBe('2026.10.0')
    expect(
      computeNextVersion('2026.12.30', new Date('2027-01-01T00:00:00Z')),
    ).toBe('2027.1.0')
  })

  it('dates every later release that month YYYY.M.D', () => {
    expect(computeNextVersion('2026.10.0', oct19)).toBe('2026.10.19')
    expect(computeNextVersion('2026.10.16', oct19)).toBe('2026.10.19')
  })

  it('cuts the monthly and a dated release on the same day', () => {
    const nov3 = new Date('2026-11-03T08:00:00Z')
    const monthly = computeNextVersion('2026.10.27', nov3)
    expect(monthly).toBe('2026.11.0')
    expect(computeNextVersion(monthly, nov3)).toBe('2026.11.3')
  })

  it('refuses a second dated release on the same UTC day', () => {
    expect(() => computeNextVersion('2026.10.19', oct19)).toThrow(
      /already the release for 2026-10-19/,
    )
  })

  it('refuses to go back from a newer version', () => {
    expect(() => computeNextVersion('2026.10.20', oct19)).toThrow(/newer/)
    expect(() => computeNextVersion('2026.11.0', oct19)).toThrow(/newer/)
  })

  it('uses the UTC date, not local time', () => {
    // 23:30 at UTC-5 on Oct 18 is already Oct 19 in UTC.
    expect(
      computeNextVersion('2026.10.0', new Date('2026-10-18T23:30:00-05:00')),
    ).toBe('2026.10.19')
  })

  it('does not confuse dates that share a prefix', () => {
    // 2026.1.1 is a prefix of 2026.1.19, and 2026.1.0 must sort before both.
    const jan19 = new Date('2026-01-19T00:00:00Z')
    expect(computeNextVersion('2026.1.1', jan19)).toBe('2026.1.19')
    expect(compareCalVer('2026.1.19', '2026.1.1')).toBeGreaterThan(0)
    expect(compareCalVer('2026.10.0', '2026.9.30')).toBeGreaterThan(0)
  })

  it('only ever produces SemVer that sorts in release order', () => {
    const day = 24 * 60 * 60 * 1000
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2026-01-01T00:00:00Z'),
          max: new Date('2030-12-31T00:00:00Z'),
          noInvalidDate: true,
        }),
        fc.array(fc.integer({ min: 0, max: 40 }), {
          minLength: 1,
          maxLength: 30,
        }),
        (start, gaps) => {
          let version = '0.0.0'
          let now = start.getTime()
          for (const gap of gaps) {
            now += gap * day
            let next: string
            try {
              next = computeNextVersion(version, new Date(now))
            } catch {
              // Only a repeat on the same UTC day is refused.
              expect(gap).toBe(0)
              continue
            }
            expect(next).toMatch(SEMVER)
            expect(compareCalVer(next, version)).toBeGreaterThan(0)
            version = next
          }
        },
      ),
    )
  })

  it('parses only unpadded YYYY.M.0 and YYYY.M.D', () => {
    expect(parseCalVer('2026.10.27')).toEqual({
      year: 2026,
      month: 10,
      day: 27,
    })
    expect(parseCalVer('2026.11.0')).toEqual({ year: 2026, month: 11, day: 0 })
    for (const invalid of [
      '2026.10.27.1',
      '2026.09.07',
      '2026.10',
      '2026.13.1',
      '2026.10.32',
      '2026.9.2-3.1',
    ]) {
      expect(parseCalVer(invalid)).toBeUndefined()
    }
  })

  it('names changelog entries like the engine: YYYY-MM, then YYYY-MM-DD', () => {
    expect(changelogSlug('2026.11.0')).toBe('2026-11')
    expect(changelogSlug('2026.11.4')).toBe('2026-11-04')
    expect(changelogSlug('2026.10.27')).toBe('2026-10-27')
  })

  it('formats changelog dates as UTC YYYY-MM-DD', () => {
    expect(utcIsoDate(oct19)).toBe('2026-10-19')
  })
})
