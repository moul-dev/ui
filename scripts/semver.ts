/**
 * SemVer helpers shared by `bun run bump` and its tests.
 *
 * `@moul-dev/web-component` and the Moul engine both version with SemVer 2.0.0
 * (https://semver.org): `MAJOR.MINOR.PATCH`, optionally followed by a
 * prerelease such as `-alpha.1`. Prereleases count from 1 within a channel
 * (`1.0.0-alpha.1`, `1.0.0-alpha.2`, then `1.0.0-beta.1`), and the engine tags
 * the same versions with a leading `v`.
 *
 * Build metadata (`+…`) is not accepted: npm ignores it when ordering
 * versions, so it can never tell two releases apart.
 */

export interface SemVer {
  major: number
  minor: number
  patch: number
  /** Dot-separated prerelease identifiers; numeric ones are numbers. */
  prerelease: Array<string | number>
}

export const RELEASE_TYPES = ['major', 'minor', 'patch', 'prerelease'] as const
export type ReleaseType = (typeof RELEASE_TYPES)[number]

const NUMBER = '0|[1-9]\\d*'
const IDENTIFIER = `${NUMBER}|\\d*[A-Za-z-][0-9A-Za-z-]*`
const SEMVER_PATTERN = new RegExp(
  `^(${NUMBER})\\.(${NUMBER})\\.(${NUMBER})(?:-((?:${IDENTIFIER})(?:\\.(?:${IDENTIFIER}))*))?$`,
)
/** A prerelease channel name: starts with a letter so the counter after it stays numeric. */
const PREID_PATTERN = /^[A-Za-z][0-9A-Za-z-]*$/

export function isReleaseType(value: string): value is ReleaseType {
  return (RELEASE_TYPES as readonly string[]).includes(value)
}

export function isPreid(value: string): boolean {
  return PREID_PATTERN.test(value)
}

export function parseSemVer(version: string): SemVer | undefined {
  const match = version.match(SEMVER_PATTERN)
  if (!match) return undefined
  const [major, minor, patch] = [match[1], match[2], match[3]].map(Number)
  const prerelease = match[4]
    ? match[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id))
    : []
  const numbers = [major, minor, patch, ...prerelease].filter(
    (part) => typeof part === 'number',
  )
  if (!numbers.every(Number.isSafeInteger)) return undefined
  return { major, minor, patch, prerelease }
}

export function formatSemVer(version: SemVer): string {
  const core = `${version.major}.${version.minor}.${version.patch}`
  return version.prerelease.length > 0
    ? `${core}-${version.prerelease.join('.')}`
    : core
}

function mustParse(version: string): SemVer {
  const parsed = parseSemVer(version)
  if (!parsed) {
    throw new Error(
      `"${version}" is not SemVer (MAJOR.MINOR.PATCH with an optional -prerelease).`,
    )
  }
  return parsed
}

function compareIdentifiers(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  // Numeric identifiers always have lower precedence than alphanumeric ones.
  if (typeof a === 'number') return -1
  if (typeof b === 'number') return 1
  return a < b ? -1 : a > b ? 1 : 0
}

/** Orders two versions by SemVer precedence: negative, zero, or positive. */
export function compareSemVer(a: string, b: string): number {
  const left = mustParse(a)
  const right = mustParse(b)
  const core =
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch
  if (core !== 0) return core

  // A release sorts after every prerelease of the same version.
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length
  }
  const length = Math.min(left.prerelease.length, right.prerelease.length)
  for (let i = 0; i < length; i++) {
    const order = compareIdentifiers(left.prerelease[i], right.prerelease[i])
    if (order !== 0) return order
  }
  return left.prerelease.length - right.prerelease.length
}

/**
 * The version after `current` for a release type.
 *
 * Without `preid`, `major`, `minor` and `patch` release the next version of
 * that kind. A prerelease graduates to the version it was leading up to when
 * that is enough (`1.0.0-alpha.3` + `major` = `1.0.0`, as with `npm version`).
 *
 * With `preid`, they open a prerelease of the next version instead
 * (`1.2.3` + `minor --preid=beta` = `1.3.0-beta.1`).
 *
 * `prerelease` advances the counter of the current channel
 * (`1.0.0-alpha.1` → `1.0.0-alpha.2`), moves to another channel with `preid`
 * (`1.0.0-alpha.2` + `--preid=beta` → `1.0.0-beta.1`), or opens a prerelease
 * of the next patch from a release (`1.0.0` + `--preid=rc` → `1.0.1-rc.1`).
 *
 * The result always sorts after `current`; anything else throws.
 */
export function bumpVersion(
  current: string,
  type: ReleaseType,
  preid?: string,
): string {
  const version = mustParse(current)
  if (preid !== undefined && !isPreid(preid)) {
    throw new Error(
      `"${preid}" is not a prerelease channel. Use letters, digits and hyphens, starting with a letter (alpha, beta, rc).`,
    )
  }

  const { major, minor, patch, prerelease } = version
  const isPrerelease = prerelease.length > 0
  let next: SemVer

  switch (type) {
    case 'major':
      next =
        isPrerelease && minor === 0 && patch === 0 && !preid
          ? { major, minor: 0, patch: 0, prerelease: [] }
          : { major: major + 1, minor: 0, patch: 0, prerelease: [] }
      break
    case 'minor':
      next =
        isPrerelease && patch === 0 && !preid
          ? { major, minor, patch: 0, prerelease: [] }
          : { major, minor: minor + 1, patch: 0, prerelease: [] }
      break
    case 'patch':
      next =
        isPrerelease && !preid
          ? { major, minor, patch, prerelease: [] }
          : { major, minor, patch: patch + 1, prerelease: [] }
      break
    case 'prerelease': {
      if (!isPrerelease) {
        if (!preid) {
          throw new Error(
            `${current} is a release. Pass --preid=<alpha|beta|rc> to start a prerelease of the next patch, or bump major or minor with --preid.`,
          )
        }
        next = { major, minor, patch: patch + 1, prerelease: [preid, 1] }
        break
      }
      const channel = preid ?? prerelease[0]
      if (typeof channel !== 'string') {
        throw new Error(
          `${current} has no prerelease channel to continue. Pass --preid=<alpha|beta|rc>.`,
        )
      }
      const last = prerelease[prerelease.length - 1]
      next =
        prerelease[0] === channel && typeof last === 'number'
          ? {
              major,
              minor,
              patch,
              prerelease: [...prerelease.slice(0, -1), last + 1],
            }
          : { major, minor, patch, prerelease: [channel, 1] }
      break
    }
  }

  if (preid && type !== 'prerelease') next.prerelease = [preid, 1]

  const result = formatSemVer(next)
  if (compareSemVer(result, current) <= 0) {
    throw new Error(
      `${result} would not sort after ${current}. Prerelease channels sort alphabetically (alpha < beta < rc).`,
    )
  }
  return result
}

/**
 * Changelog slug for a release: the version with dashes, `1-0-0-alpha-1` for
 * `1.0.0-alpha.1`. The docs slugger drops dots, which would run the numbers
 * together.
 */
export function changelogSlug(version: string): string {
  mustParse(version)
  return version.replaceAll('.', '-')
}

/** `YYYY-MM-DD` in UTC, used for the changelog `date`. */
export function utcIsoDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}
