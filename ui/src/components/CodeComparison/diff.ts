import type { CodeToken } from '../../utils/highlight'

/** Above this many table cells (lines before × lines after, once the common ends are trimmed), the middle is shown as wholly replaced instead of diffed. */
const MAX_CELLS = 4_000_000

export type DiffKind = 'same' | 'removed' | 'added'

export interface DiffLine {
  kind: DiffKind
  /** 0-based line in the before text, for `same` and `removed`. */
  before?: number
  /** 0-based line in the after text, for `same` and `added`. */
  after?: number
}

/**
 * Compares two texts line by line and lists every line once, in reading
 * order, as kept, removed or added: the longest common subsequence of lines,
 * found after trimming the lines both texts start and end with. Within a run
 * of changes, removals come before additions.
 */
export function diffLines(before: string[], after: string[]): DiffLine[] {
  let start = 0
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start++
  }
  let endBefore = before.length
  let endAfter = after.length
  while (
    endBefore > start &&
    endAfter > start &&
    before[endBefore - 1] === after[endAfter - 1]
  ) {
    endBefore--
    endAfter--
  }

  const out: DiffLine[] = []
  for (let i = 0; i < start; i++)
    out.push({ kind: 'same', before: i, after: i })

  const n = endBefore - start
  const m = endAfter - start
  const middle: DiffLine[] = []
  if (n * m > MAX_CELLS) {
    for (let i = 0; i < n; i++)
      middle.push({ kind: 'removed', before: start + i })
    for (let j = 0; j < m; j++) middle.push({ kind: 'added', after: start + j })
  } else {
    // table[i][j]: the longest common run of before[i..] and after[j..].
    const width = m + 1
    const table = new Uint32Array((n + 1) * width)
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * width + j] =
          before[start + i] === after[start + j]
            ? (table[(i + 1) * width + j + 1] as number) + 1
            : Math.max(
                table[(i + 1) * width + j] as number,
                table[i * width + j + 1] as number,
              )
      }
    }
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (before[start + i] === after[start + j]) {
        middle.push({ kind: 'same', before: start + i, after: start + j })
        i++
        j++
      } else if (
        (table[(i + 1) * width + j] as number) >=
        (table[i * width + j + 1] as number)
      ) {
        middle.push({ kind: 'removed', before: start + i })
        i++
      } else {
        middle.push({ kind: 'added', after: start + j })
        j++
      }
    }
    for (; i < n; i++) middle.push({ kind: 'removed', before: start + i })
    for (; j < m; j++) middle.push({ kind: 'added', after: start + j })
  }

  // Removals first within each run of changes, as diffs are usually read.
  let run: DiffLine[] = []
  const flush = (): void => {
    out.push(...run.filter((line) => line.kind === 'removed'))
    out.push(...run.filter((line) => line.kind === 'added'))
    run = []
  }
  for (const line of middle) {
    if (line.kind === 'same') {
      flush()
      out.push(line)
    } else {
      run.push(line)
    }
  }
  flush()

  for (let k = 0; k < before.length - endBefore; k++) {
    out.push({ kind: 'same', before: endBefore + k, after: endAfter + k })
  }
  return out
}

/** One row of a side-by-side view: a line from each text, or a gap on one side. */
export interface SplitRow {
  isChanged: boolean
  before?: number
  after?: number
}

/** Pairs the removals and additions of each run of changes into rows, so the two sides line up. */
export function splitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let removed: number[] = []
  let added: number[] = []
  const flush = (): void => {
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      rows.push({ isChanged: true, before: removed[k], after: added[k] })
    }
    removed = []
    added = []
  }
  for (const line of lines) {
    if (line.kind === 'removed') removed.push(line.before as number)
    else if (line.kind === 'added') added.push(line.after as number)
    else {
      flush()
      rows.push({ isChanged: false, before: line.before, after: line.after })
    }
  }
  flush()
  return rows
}

/** How much of the longer line the shared start and end must cover before the changed part is worth marking. */
const MIN_SHARED = 0.3

/**
 * Where two versions of a line differ: the span between their common start
 * and common end, in each. Null when they share too little at the ends (less
 * than 30% of the longer line), so the whole line reads as changed and there
 * is nothing narrower worth pointing at.
 */
export function changedSpan(
  before: string,
  after: string,
): { before: [number, number]; after: [number, number] } | null {
  let start = 0
  const shortest = Math.min(before.length, after.length)
  while (start < shortest && before[start] === after[start]) start++
  let end = 0
  while (
    end < shortest - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end++
  }
  if (start + end < MIN_SHARED * Math.max(before.length, after.length)) {
    return null
  }
  return {
    before: [start, before.length - end],
    after: [start, after.length - end],
  }
}

export interface MarkedToken extends CodeToken {
  /** Inside the part of the line that changed. */
  isChange: boolean
}

/** Cuts tokens at `from` and `to` (character offsets in the line) and flags the pieces between them. */
export function markSpan(
  tokens: CodeToken[],
  span: [number, number] | null,
): MarkedToken[] {
  if (!span || span[0] >= span[1]) {
    return tokens.map((token) => ({ ...token, isChange: false }))
  }
  const [from, to] = span
  const out: MarkedToken[] = []
  let offset = 0
  for (const token of tokens) {
    const end = offset + token.text.length
    const cuts = [
      offset,
      Math.min(Math.max(from, offset), end),
      Math.min(Math.max(to, offset), end),
      end,
    ]
    for (let k = 0; k < 3; k++) {
      const text = token.text.slice(cuts[k] - offset, cuts[k + 1] - offset)
      if (text) out.push({ type: token.type, text, isChange: k === 1 })
    }
    offset = end
  }
  return out
}
