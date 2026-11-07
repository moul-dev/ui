import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  bumpVersion,
  changelogSlug,
  compareSemVer,
  isPreid,
  parseSemVer,
  RELEASE_TYPES,
  utcIsoDate,
} from '../../scripts/semver'

describe('SemVer bump (Req 15.10, 15.11)', () => {
  it('bumps major, minor and patch from a release', () => {
    expect(bumpVersion('1.4.2', 'major')).toBe('2.0.0')
    expect(bumpVersion('1.4.2', 'minor')).toBe('1.5.0')
    expect(bumpVersion('1.4.2', 'patch')).toBe('1.4.3')
    expect(bumpVersion('0.9.9', 'minor')).toBe('0.10.0')
    expect(bumpVersion('1.9.0', 'minor')).toBe('1.10.0')
  })

  it('graduates a prerelease to the version it leads up to', () => {
    expect(bumpVersion('1.0.0-alpha.1', 'major')).toBe('1.0.0')
    expect(bumpVersion('1.0.0-alpha.1', 'minor')).toBe('1.0.0')
    expect(bumpVersion('1.0.0-alpha.1', 'patch')).toBe('1.0.0')
    expect(bumpVersion('1.5.0-beta.2', 'minor')).toBe('1.5.0')
    expect(bumpVersion('1.5.0-beta.2', 'major')).toBe('2.0.0')
    expect(bumpVersion('1.4.3-rc.1', 'patch')).toBe('1.4.3')
    expect(bumpVersion('1.4.3-rc.1', 'minor')).toBe('1.5.0')
  })

  it('advances the prerelease counter within a channel', () => {
    expect(bumpVersion('1.0.0-alpha.1', 'prerelease')).toBe('1.0.0-alpha.2')
    expect(bumpVersion('1.0.0-alpha.9', 'prerelease')).toBe('1.0.0-alpha.10')
    expect(bumpVersion('1.0.0-alpha', 'prerelease')).toBe('1.0.0-alpha.1')
    expect(bumpVersion('1.0.0-alpha.1', 'prerelease', 'alpha')).toBe(
      '1.0.0-alpha.2',
    )
  })

  it('moves to a later channel starting at 1', () => {
    expect(bumpVersion('1.0.0-alpha.4', 'prerelease', 'beta')).toBe(
      '1.0.0-beta.1',
    )
    expect(bumpVersion('1.0.0-beta.2', 'prerelease', 'rc')).toBe('1.0.0-rc.1')
  })

  it('refuses a channel that sorts before the current one', () => {
    expect(() => bumpVersion('1.0.0-beta.2', 'prerelease', 'alpha')).toThrow(
      /would not sort after/,
    )
  })

  it('opens a prerelease of the next version with --preid', () => {
    expect(bumpVersion('1.4.2', 'major', 'alpha')).toBe('2.0.0-alpha.1')
    expect(bumpVersion('1.4.2', 'minor', 'beta')).toBe('1.5.0-beta.1')
    expect(bumpVersion('1.4.2', 'patch', 'rc')).toBe('1.4.3-rc.1')
    expect(bumpVersion('1.0.0', 'prerelease', 'rc')).toBe('1.0.1-rc.1')
    expect(bumpVersion('1.0.0-alpha.3', 'major', 'alpha')).toBe('2.0.0-alpha.1')
  })

  it('needs a channel to start a prerelease from a release', () => {
    expect(() => bumpVersion('1.0.0', 'prerelease')).toThrow(/--preid/)
    expect(() => bumpVersion('1.0.0-1', 'prerelease')).toThrow(/--preid/)
    expect(bumpVersion('1.0.0-1', 'prerelease', 'alpha')).toBe('1.0.0-alpha.1')
  })

  it('accepts only channel names that start with a letter', () => {
    for (const valid of ['alpha', 'beta', 'rc', 'next-2']) {
      expect(isPreid(valid)).toBe(true)
    }
    for (const invalid of ['', '1', '2alpha', 'al.pha', 'al_pha']) {
      expect(isPreid(invalid)).toBe(false)
      expect(() => bumpVersion('1.0.0', 'minor', invalid)).toThrow(
        /prerelease channel/,
      )
    }
  })

  it('orders versions by SemVer precedence', () => {
    // The precedence example from semver.org, item 11.
    const ordered = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
      '1.0.1',
      '1.9.0',
      '1.10.0',
      '2.0.0-alpha.1',
      '2.0.0',
    ]
    for (let i = 1; i < ordered.length; i++) {
      expect(compareSemVer(ordered[i], ordered[i - 1])).toBeGreaterThan(0)
      expect(compareSemVer(ordered[i - 1], ordered[i])).toBeLessThan(0)
    }
    expect(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha.1')).toBe(0)
  })

  it('only ever produces SemVer that sorts after the previous version', () => {
    const step = fc.record({
      type: fc.constantFrom(...RELEASE_TYPES),
      preid: fc.option(fc.constantFrom('alpha', 'beta', 'rc'), {
        nil: undefined,
      }),
    })
    fc.assert(
      fc.property(fc.array(step, { minLength: 1, maxLength: 40 }), (steps) => {
        let version = '1.0.0-alpha.1'
        for (const { type, preid } of steps) {
          let next: string
          try {
            next = bumpVersion(version, type, preid)
          } catch {
            // Refusals (going back a channel, no channel to continue) are fine.
            continue
          }
          expect(parseSemVer(next)).toBeDefined()
          expect(compareSemVer(next, version)).toBeGreaterThan(0)
          version = next
        }
      }),
    )
  })

  it('parses SemVer without build metadata', () => {
    expect(parseSemVer('1.0.0-alpha.1')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: ['alpha', 1],
    })
    expect(parseSemVer('10.20.30')).toEqual({
      major: 10,
      minor: 20,
      patch: 30,
      prerelease: [],
    })
    for (const invalid of [
      'v1.0.0',
      '1.0',
      '1.0.0.0',
      '01.0.0',
      '1.0.0-',
      '1.0.0-alpha..1',
      '1.0.0-01',
      '1.0.0+build.1',
      '1.0.0-alpha_1',
      '99999999999999999.0.0',
    ]) {
      expect(parseSemVer(invalid)).toBeUndefined()
    }
  })

  it('names changelog entries after the version, one per release', () => {
    expect(changelogSlug('1.0.0-alpha.1')).toBe('1-0-0-alpha-1')
    expect(changelogSlug('1.2.0')).toBe('1-2-0')
    expect(() => changelogSlug('1.2')).toThrow()
  })

  it('formats changelog dates as UTC YYYY-MM-DD', () => {
    expect(utcIsoDate(new Date('2026-10-31T23:30:00-05:00'))).toBe('2026-11-01')
  })
})
