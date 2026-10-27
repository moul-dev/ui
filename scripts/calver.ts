/**
 * UTC CalVer helpers shared by `bun run bump` and its tests.
 *
 * Format: `YYYY.M.D` (no zero padding), with a `.N` suffix for every
 * additional release cut on the same UTC date: `2026.10.19` → `2026.10.19.1`
 * → `2026.10.19.2`. The next UTC day starts again at `YYYY.M.D`.
 */

export function calverBase(now: Date): string {
  return `${now.getUTCFullYear()}.${now.getUTCMonth() + 1}.${now.getUTCDate()}`
}

export function computeNextVersion(currentVersion: string, now: Date): string {
  const base = calverBase(now)
  if (currentVersion === base) return `${base}.1`

  const sameDay = currentVersion.match(
    new RegExp(`^${base.replace(/\./g, '\\.')}\\.(\\d+)$`),
  )
  if (sameDay) return `${base}.${Number(sameDay[1]) + 1}`

  return base
}

/** `YYYY-MM-DD` in UTC, used for changelog file names. */
export function utcIsoDate(now: Date): string {
  return now.toISOString().slice(0, 10)
}
