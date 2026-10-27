/**
 * CalVer helpers shared by `bun run bump` and its tests.
 *
 * Moul UI and the Moul engine both version as `YYYY.MM.MICRO`
 * (https://calver.org): the UTC year, the UTC month, and a release counter
 * for that month. `MM` is the unpadded month (calver.org writes the padded
 * one as `0M`), which keeps every version valid SemVer for npm:
 *
 * - The first release of a UTC month is `YYYY.MM.0`: `2026.11.0`.
 * - Each later release that month adds one to `MICRO`: `2026.11.1`.
 */

export interface CalVer {
  year: number
  month: number
  micro: number
}

const CALVER_PATTERN = /^(\d{4})\.([1-9]|1[0-2])\.(0|[1-9]\d*)$/

export function parseCalVer(version: string): CalVer | undefined {
  const match = version.match(CALVER_PATTERN)
  if (!match) return undefined
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    micro: Number(match[3]),
  }
}

/** Orders two versions by release; a version that is not CalVer sorts first. */
export function compareCalVer(a: string, b: string): number {
  const left = parseCalVer(a)
  const right = parseCalVer(b)
  if (!left || !right) return (left ? 1 : 0) - (right ? 1 : 0)
  return (
    left.year - right.year ||
    left.month - right.month ||
    left.micro - right.micro
  )
}

export function computeNextVersion(currentVersion: string, now: Date): string {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const current = parseCalVer(currentVersion)

  if (current?.year === year && current.month === month) {
    return `${year}.${month}.${current.micro + 1}`
  }
  if (compareCalVer(currentVersion, `${year}.${month}.0`) > 0) {
    throw new Error(
      `${currentVersion} is from a later month than ${utcIsoDate(now)}. Pass --date=<YYYY-MM-DD> for a later UTC date.`,
    )
  }
  return `${year}.${month}.0`
}

/**
 * Changelog slug for a release: the version with dashes, `2026-11-0` for
 * `2026.11.0`. Dots would be dropped from the docs URL, and a date would
 * collide when two releases land on the same day.
 */
export function changelogSlug(version: string): string {
  if (!parseCalVer(version)) throw new Error(`${version} is not CalVer.`)
  return version.replaceAll('.', '-')
}

/** `YYYY-MM-DD` in UTC, used for the changelog `date`. */
export function utcIsoDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}
