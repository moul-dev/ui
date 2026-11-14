import { fixture, html } from '@open-wc/testing-helpers'
import fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion } from '../../test-setup'
import './CodeComparison'
import type { MoulCodeComparison } from './CodeComparison'
import { changedSpan, diffLines, markSpan, splitRows } from './diff'

const BEFORE = `import { a } from './a'
const x = 1
console.log(x)
export default x`

const AFTER = `import { a } from './a'
const x = 2
const y = 3
console.log(x)
export default x`

const shadow = (el: MoulCodeComparison) => el.shadowRoot as ShadowRoot
const diffGrid = (el: MoulCodeComparison) =>
  shadow(el).querySelector('[part~="diff"]') as HTMLElement
const cells = (el: MoulCodeComparison, kind: string) =>
  Array.from(
    diffGrid(el).querySelectorAll<HTMLElement>(`.cell[data-kind="${kind}"]`),
  ).map((cell) => cell.textContent?.slice(1))

describe('diffLines', () => {
  it('lists kept, removed and added lines, removals first in each run', () => {
    const lines = diffLines(BEFORE.split('\n'), AFTER.split('\n'))
    expect(lines.map((line) => line.kind)).toEqual([
      'same',
      'removed',
      'added',
      'added',
      'same',
      'same',
    ])
    expect(lines[1]).toEqual({ kind: 'removed', before: 1 })
    expect(lines[3]).toEqual({ kind: 'added', after: 2 })
    expect(lines[5]).toEqual({ kind: 'same', before: 3, after: 4 })
  })

  it('rebuilds both texts from its lines, for any input', () => {
    const lines = fc.array(fc.constantFrom('a', 'b', 'c', 'd', ''), {
      maxLength: 12,
    })
    fc.assert(
      fc.property(lines, lines, (before, after) => {
        const diff = diffLines(before, after)
        const kept = diff.filter((line) => line.kind !== 'added')
        const next = diff.filter((line) => line.kind !== 'removed')
        expect(kept.map((line) => before[line.before as number])).toEqual(
          before,
        )
        expect(next.map((line) => after[line.after as number])).toEqual(after)
      }),
    )
  })

  it('pairs removals with additions so the sides line up', () => {
    const rows = splitRows(diffLines(BEFORE.split('\n'), AFTER.split('\n')))
    expect(rows[1]).toEqual({ isChanged: true, before: 1, after: 1 })
    expect(rows[2]).toEqual({ isChanged: true, before: undefined, after: 2 })
    expect(rows).toHaveLength(5)
  })

  it('finds the part of an edited line that changed', () => {
    expect(changedSpan('const x = 1', 'const x = 22')).toEqual({
      before: [10, 11],
      after: [10, 12],
    })
    expect(changedSpan('abc', 'xyz')).toBeNull()
    const marked = markSpan(
      [
        { type: 'keyword', text: 'const' },
        { type: null, text: ' x = ' },
        { type: 'number', text: '22' },
      ],
      [10, 12],
    )
    expect(marked.filter((token) => token.isChange)).toEqual([
      { type: 'number', text: '22', isChange: true },
    ])
  })
})

describe('<moul-code-comparison>', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  it('marks removed and added lines, side by side, with gaps to keep them level', async () => {
    const el = await fixture<MoulCodeComparison>(
      html`<moul-code-comparison
        language="ts"
        .beforeCode=${BEFORE}
        .afterCode=${AFTER}
      ></moul-code-comparison>`,
    )
    expect(diffGrid(el).classList.contains('split')).toBe(true)
    expect(cells(el, 'removed')).toEqual(['const x = 1'])
    expect(cells(el, 'added')).toEqual(['const x = 2', 'const y = 3'])
    expect(
      diffGrid(el).querySelectorAll('.cell[data-kind="empty"]'),
    ).toHaveLength(1)
    // The edited value is singled out within its line.
    const change = diffGrid(el).querySelector(
      '.cell[data-kind="added"] .change',
    )
    expect(change?.textContent).toBe('2')
    expect(
      shadow(el)
        .querySelector('[part~="stats"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim(),
    ).toBe('−1 +2')
  })

  it('shows one column with layout="unified" and when the container is narrow', async () => {
    const el = await fixture<MoulCodeComparison>(
      html`<moul-code-comparison
        layout="unified"
        .beforeCode=${BEFORE}
        .afterCode=${AFTER}
      ></moul-code-comparison>`,
    )
    expect(diffGrid(el).classList.contains('unified')).toBe(true)
    expect(cells(el, 'removed')).toEqual(['const x = 1'])
    const nums = Array.from(diffGrid(el).querySelectorAll('.num')).map(
      (num) => num.textContent,
    )
    // Old and new numbers for each line: kept, removed, added, added, kept, kept.
    expect(nums).toEqual([
      '1',
      '1',
      '2',
      '',
      '',
      '2',
      '',
      '3',
      '3',
      '4',
      '4',
      '5',
    ])

    el.layout = 'split'
    el.getBoundingClientRect = () => ({ width: 320 }) as DOMRect
    ;(el as unknown as { measure(): void }).measure()
    await el.updateComplete
    expect(diffGrid(el).classList.contains('unified')).toBe(true)
  })

  it('reads the two versions from the markup', async () => {
    const host = document.createElement('div')
    host.innerHTML = `<moul-code-comparison>
      <script type="text/plain" data-label="v1.ts" data-language="ts">let a = 1</script>
      <script type="text/plain" data-label="v2.ts">let a = 2</script>
    </moul-code-comparison>`
    document.body.append(host)
    const el = host.firstElementChild as MoulCodeComparison
    await el.updateComplete
    expect(cells(el, 'removed')).toEqual(['let a = 1'])
    expect(
      Array.from(shadow(el).querySelectorAll('[part~="label"]')).map(
        (l) => l.textContent,
      ),
    ).toEqual(['v1.ts', 'v2.ts'])
    expect(diffGrid(el).querySelector('.tok-keyword')?.textContent).toBe('let')
    host.remove()
  })

  it('copies either side and says so', async () => {
    const onCopy = vi.fn()
    const el = await fixture<MoulCodeComparison>(
      html`<moul-code-comparison
        before-code="a"
        after-code="b"
        @codecopy=${onCopy}
      ></moul-code-comparison>`,
    )
    const buttons = shadow(el).querySelectorAll<HTMLButtonElement>(
      '[part~="copy-button"]',
    )
    expect(
      Array.from(buttons).map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Copy Before', 'Copy After'])
    buttons[0].click()
    await vi.waitFor(() => expect(onCopy).toHaveBeenCalled())
    await el.updateComplete
    expect(writeText).toHaveBeenCalledWith('a')
    expect(onCopy.mock.calls[0][0].detail).toEqual({
      code: 'a',
      side: 'before',
      isCopied: true,
    })
    expect(buttons[0].hasAttribute('data-copied')).toBe(true)
    expect(buttons[1].hasAttribute('data-copied')).toBe(false)
    expect(shadow(el).querySelector('[role="status"]')?.textContent).toBe(
      'Copied',
    )
  })

  describe('keyboard and screen readers', () => {
    it('hides the coloured view and gives screen readers a plain reading', async () => {
      const el = await fixture<MoulCodeComparison>(
        html`<moul-code-comparison
          before-label="Old"
          after-label="New"
          removed-label="Gone"
          .beforeCode=${BEFORE}
          .afterCode=${AFTER}
        ></moul-code-comparison>`,
      )
      expect(diffGrid(el).getAttribute('aria-hidden')).toBe('true')
      const reading = shadow(el).querySelector('.sr-only[role="group"]')
      expect(reading?.getAttribute('aria-label')).toBe(
        'Changes from Old to New',
      )
      const lines = Array.from(reading?.querySelectorAll('p') ?? []).map((p) =>
        p.textContent?.replace(/\s+/g, ' ').trim(),
      )
      expect(lines[0]).toBe('Gone: 1. Added: 2.')
      expect(lines.slice(1, 5)).toEqual([
        "import { a } from './a'",
        'Gone: const x = 1',
        'Added: const x = 2',
        'Added: const y = 3',
      ])
    })

    it('reaches the copy buttons with Tab', async () => {
      const el = await fixture<MoulCodeComparison>(
        html`<moul-code-comparison before-code="a" after-code="b"></moul-code-comparison>`,
      )
      const buttons = shadow(el).querySelectorAll('button')
      expect(buttons).toHaveLength(2)
      for (const button of buttons) {
        expect(button.type).toBe('button')
        expect(button.closest('[aria-hidden="true"]')).toBeNull()
      }
    })
  })

  describe('reduced motion', () => {
    it('renders the same static comparison', async () => {
      const motion = mockReducedMotion(true)
      const el = await fixture<MoulCodeComparison>(
        html`<moul-code-comparison before-code="a" after-code="b"></moul-code-comparison>`,
      )
      expect(cells(el, 'removed')).toEqual(['a'])
      expect(cells(el, 'added')).toEqual(['b'])
      motion.restore()
    })
  })
})
