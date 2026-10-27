/**
 * UTC CalVer helpers shared by `bun run bump` and its tests.
 *
 * Moul UI releases on the Moul engine's calendar. The engine tags the first
 * release of a month `v2026.10` and any later release that month by its date,
 * `v2026.10.27`. npm needs three SemVer parts without zero padding, so:
 *
 * - The first release of a UTC month is `YYYY.M.0`.
 * - Every later release that month is `YYYY.M.D`, its UTC day.
 *
 * Versions then sort in release order. A day holds one dated release, so a
 * second bump on the same UTC day is refused: `YYYY.M.D.N` is not SemVer and
 * npm rejects it.
 */

export interface CalVer {
  year: number
  month: number
  /** `0` for the monthly release, otherwise the UTC day of the release. */
  day: number
}

const CALVER_PATTERN = /^(\d{4})\.([1-9]|1[0-2])\.(0|[1-9]|[12]\d|3[01])$/

export function parseCalVer(version: string): CalVer | undefined {
  const match = version.match(CALVER_PATTERN)
  if (!match) return undefined
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

/** Orders two versions by release; a version that is not CalVer sorts first. */
export function compareCalVer(a: string, b: string): number {
  const left = parseCalVer(a)
  const right = parseCalVer(b)
  if (!left || !right) return (left ? 1 : 0) - (right ? 1 : 0)
  return (
    left.year - right.year || left.month - right.month || left.day - right.day
  )
}

export function computeNextVersion(currentVersion: string, now: Date): string {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  const monthly = `${year}.${month}.0`
  const dated = `${year}.${month}.${day}`

  if (compareCalVer(currentVersion, monthly) < 0) return monthly
  if (compareCalVer(currentVersion, dated) < 0) return dated

  if (currentVersion === dated) {
    throw new Error(
      `${currentVersion} is already the release for ${utcIsoDate(now)} (UTC), and a day holds one release. Bump again on the next UTC day.`,
    )
  }
  throw new Error(
    `${currentVersion} is newer than today's release ${dated}. Pass --date=<YYYY-MM-DD> for a later UTC date.`,
  )
}

/**
 * Changelog slug for a release, zero-padded like the engine's changelog
 * files: `2026-11` for `2026.11.0`, `2026-10-28` for `2026.10.28`.
 */
export function changelogSlug(version: string): string {
  const calver = parseCalVer(version)
  if (!calver) throw new Error(`${version} is not a CalVer version.`)
  const month = String(calver.month).padStart(2, '0')
  if (calver.day === 0) return `${calver.year}-${month}`
  return `${calver.year}-${month}-${String(calver.day).padStart(2, '0')}`
}

/** `YYYY-MM-DD` in UTC, used for changelog dates. */
export function utcIsoDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}
