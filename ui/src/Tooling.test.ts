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

describe('CalVer YYYY.MM.MICRO bump (Req 15.10, 15.11)', () => {
  const oct19 = new Date('2026-10-19T12:00:00Z')

  it('opens a UTC month at YYYY.MM.0 with an unpadded month', () => {
    expect(computeNextVersion('2026.9.28', oct19)).toBe('2026.10.0')
    expect(computeNextVersion('2025.12.4', oct19)).toBe('2026.10.0')
    expect(computeNextVersion('0.0.0', oct19)).toBe('2026.10.0')
    expect(
      computeNextVersion('2026.12.3', new Date('2027-01-01T00:00:00Z')),
    ).toBe('2027.1.0')
  })

  it('adds one to MICRO for every later release that month', () => {
    expect(computeNextVersion('2026.10.0', oct19)).toBe('2026.10.1')
    expect(computeNextVersion('2026.10.1', oct19)).toBe('2026.10.2')
    // Same-day releases are fine: MICRO is a counter, not a date.
    expect(computeNextVersion('2026.10.2', oct19)).toBe('2026.10.3')
    expect(computeNextVersion('2026.10.27', oct19)).toBe('2026.10.28')
    expect(
      computeNextVersion('2026.9.3', new Date('2026-09-01T00:00:00Z')),
    ).toBe('2026.9.4')
  })

  it('uses the UTC month, not local time', () => {
    // 23:30 at UTC-5 on Oct 31 is already Nov 1 in UTC.
    expect(
      computeNextVersion('2026.10.5', new Date('2026-10-31T23:30:00-05:00')),
    ).toBe('2026.11.0')
  })

  it('refuses to go back from a later month', () => {
    expect(() => computeNextVersion('2026.11.0', oct19)).toThrow(/later month/)
    expect(() => computeNextVersion('2027.1.0', oct19)).toThrow(/later month/)
  })

  it('orders versions numerically, not as strings', () => {
    expect(compareCalVer('2026.10.0', '2026.9.30')).toBeGreaterThan(0)
    expect(compareCalVer('2026.10.10', '2026.10.9')).toBeGreaterThan(0)
    expect(compareCalVer('2026.10.0', '0.0.0')).toBeGreaterThan(0)
  })

  it('only ever produces SemVer that sorts after the previous release', () => {
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
          maxLength: 40,
        }),
        (start, gaps) => {
          let version = '0.0.0'
          let now = start.getTime()
          for (const gap of gaps) {
            now += gap * day
            const next = computeNextVersion(version, new Date(now))
            expect(next).toMatch(SEMVER)
            expect(compareCalVer(next, version)).toBeGreaterThan(0)
            version = next
          }
        },
      ),
    )
  })

  it('parses only unpadded YYYY.MM.MICRO', () => {
    expect(parseCalVer('2026.10.27')).toEqual({
      year: 2026,
      month: 10,
      micro: 27,
    })
    expect(parseCalVer('2026.11.0')).toEqual({
      year: 2026,
      month: 11,
      micro: 0,
    })
    for (const invalid of [
      '2026.10.27.1',
      '2026.09.0',
      '2026.10.01',
      '2026.10',
      '2026.13.0',
      '2026.9.2-3.1',
    ]) {
      expect(parseCalVer(invalid)).toBeUndefined()
    }
  })

  it('names changelog entries after the version, one per release', () => {
    expect(changelogSlug('2026.11.0')).toBe('2026-11-0')
    expect(changelogSlug('2026.10.28')).toBe('2026-10-28')
    expect(() => changelogSlug('2026.10.28.1')).toThrow()
  })

  it('formats changelog dates as UTC YYYY-MM-DD', () => {
    expect(utcIsoDate(oct19)).toBe('2026-10-19')
  })
})
