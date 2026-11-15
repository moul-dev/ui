import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { cdnProblems, staticImports } from '../../scripts/check-cdn'
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

describe('CDN build check', () => {
  // Minified the way Rolldown writes the CDN files: banner, then imports.
  const lit =
    '"use client";var e=globalThis;(e.litHtmlVersions??=[]).push(`3.3.3`),(e.reactiveElementVersions??=[]).push(`2.1.2`),(e.litElementVersions??=[]).push(`4.2.2`);export{e as t};'
  const motion =
    '"use client";var e=[`setup`,`read`,`resolveKeyframes`,`preUpdate`,`update`,`preRender`,`render`,`postRender`];export{e as t};'
  const build: Record<string, string> = {
    'moul-ui.js':
      '"use client";import{t as e}from"./chunks/lit.js";import{t}from"./chunks/motion.js";import"./chunks/shared.js";var n=()=>import(`./chunks/flow.js`);',
    'effects.js':
      '"use client";import{t as e}from"./chunks/lit.js";import{t}from"./chunks/motion.js";',
    'canvas.js':
      '"use client";var e={"moul-globe":()=>import(`./canvas/globe.js`)};',
    'canvas/globe.js':
      '"use client";import{t as e}from"../chunks/lit.js";import{t as n}from"../chunks/shared.js";',
    'chunks/flow.js': '"use client";var e=1;export{e as t};',
    'chunks/lit.js': lit,
    'chunks/motion.js': motion,
    'chunks/shared.js':
      '"use client";import{t as e}from"./lit.js";export{e as t};',
  }

  it('reads the static imports at the top of a minified file', () => {
    expect(staticImports('canvas/globe.js', build['canvas/globe.js'])).toEqual([
      'chunks/lit.js',
      'chunks/shared.js',
    ])
    // Side-effect imports count; `import()` further down does not.
    expect(staticImports('moul-ui.js', build['moul-ui.js'])).toEqual([
      'chunks/lit.js',
      'chunks/motion.js',
      'chunks/shared.js',
    ])
    expect(staticImports('canvas.js', build['canvas.js'])).toEqual([])
  })

  it('passes a build with one Lit, one motion and separate entries', () => {
    expect(cdnProblems(build)).toEqual([])
  })

  it('fails when Lit is bundled into a second file', () => {
    const problems = cdnProblems({
      ...build,
      'effects.js': build['effects.js'] + lit.replace('"use client";', ''),
    })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(
      /^lit is bundled 2 times, in chunks\/lit\.js, effects\.js\./,
    )
  })

  it('fails when motion is bundled into a second file', () => {
    const problems = cdnProblems({
      ...build,
      'moul-ui.js': build['moul-ui.js'] + motion.replace('"use client";', ''),
    })
    expect(problems).toEqual([
      expect.stringMatching(/^motion is bundled 2 times/),
    ])
  })

  it('fails when a runtime marker is missing, so the check cannot go blind', () => {
    expect(
      cdnProblems({ ...build, 'chunks/motion.js': '"use client";export{};' }),
    ).toEqual([expect.stringMatching(/^No CDN file carries motion's marker/)])
  })

  it('fails when the main entry imports the effects or a canvas entry', () => {
    expect(
      cdnProblems({
        ...build,
        'moul-ui.js': `"use client";import"./effects.js";${build['moul-ui.js'].slice(13)}`,
      }),
    ).toEqual([expect.stringMatching(/^moul-ui\.js imports effects\.js\./)])
  })

  it('fails when the canvas loader imports an element up front', () => {
    expect(
      cdnProblems({
        ...build,
        'canvas.js': '"use client";import"./canvas/globe.js";',
      }),
    ).toEqual([
      expect.stringMatching(/^canvas\.js imports canvas\/globe\.js, chunks\//),
    ])
  })

  it('fails when a canvas element reaches motion through a shared chunk', () => {
    expect(
      cdnProblems({
        ...build,
        'chunks/shared.js':
          '"use client";import{t as e}from"./lit.js";import"./motion.js";export{e as t};',
      }),
    ).toEqual([
      expect.stringMatching(
        /^canvas\/globe\.js loads motion \(chunks\/motion\.js\)/,
      ),
    ])
  })
})
