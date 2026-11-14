import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulButton } from '../Button/Button'
import type { MoulTimelineItem } from '../Timeline/TimelineItem'
import './HistoryLedger'
import type {
  HistoryRestoreDetail,
  HistoryVersion,
  MoulHistoryLedger,
} from './HistoryLedger'

const NOW = new Date('2026-11-14T12:00:00Z')

const VERSIONS: HistoryVersion[] = [
  {
    id: 'v3',
    label: 'Version 3',
    author: { name: 'Dara Sok' },
    timestamp: new Date(NOW.getTime() - 2 * 3_600_000),
    summary: 'Published the post',
    changes: [
      { field: 'Status', before: 'Draft', after: 'Published' },
      { field: 'Tags', before: null, after: ['news', 'release'] },
    ],
  },
  {
    id: 'v2',
    label: 'Version 2',
    author: 'Lina',
    timestamp: new Date(NOW.getTime() - 26 * 3_600_000).toISOString(),
    summary: 'Edited the title',
    changes: [{ field: 'Title', before: 'Hello', after: 'Hello, world' }],
  },
  { id: 'v1', label: 'Version 1', timestamp: NOW.getTime() - 9 * 86_400_000 },
]

async function mount(
  props: Partial<MoulHistoryLedger> = {},
): Promise<MoulHistoryLedger> {
  const ledger = document.createElement('moul-history-ledger')
  Object.assign(ledger, { versions: VERSIONS, current: 'v3', ...props })
  document.body.append(ledger)
  await settle(ledger)
  return ledger
}

async function settle(ledger: MoulHistoryLedger): Promise<void> {
  await ledger.updateComplete
  const timeline = ledger.shadowRoot?.querySelector('moul-timeline')
  await timeline?.updateComplete
  for (const item of rows(ledger)) await item.updateComplete
  for (const button of ledger.shadowRoot?.querySelectorAll('moul-button') ??
    []) {
    await (button as MoulButton).updateComplete
  }
}

const rows = (ledger: MoulHistoryLedger): MoulTimelineItem[] =>
  Array.from(ledger.shadowRoot?.querySelectorAll('moul-timeline-item') ?? [])

const restoreButton = (row: MoulTimelineItem) =>
  row.querySelector<MoulButton>('moul-button')
const toggle = (row: MoulTimelineItem) =>
  row.querySelector<HTMLButtonElement>('.toggle')
const panel = (ledger: MoulHistoryLedger, row: MoulTimelineItem) =>
  ledger.shadowRoot?.getElementById(
    toggle(row)?.getAttribute('aria-controls') ?? '',
  ) ?? null

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('<moul-history-ledger>', () => {
  it('lists every version on a compact timeline, newest first', async () => {
    const ledger = await mount()
    expect(customElements.get('moul-history-ledger')).toBeDefined()
    const timeline = ledger.shadowRoot?.querySelector('moul-timeline')
    expect(timeline?.getAttribute('density')).toBe('compact')
    expect(timeline?.getAttribute('progress')).toBe('none')
    expect(
      rows(ledger).map((row) => row.querySelector('.title')?.textContent),
    ).toEqual(['Version 3', 'Version 2', 'Version 1'])
  })

  it('marks the current version and gives it no Restore button', async () => {
    const ledger = await mount({ current: 'v2' })
    const [v3, v2] = rows(ledger)
    expect(v2.status).toBe('current')
    expect(v2.getAttribute('aria-current')).toBe('true')
    expect(v2.querySelector('moul-badge')?.textContent).toContain('Current')
    expect(restoreButton(v2)).toBeNull()
    expect(v3.hasAttribute('aria-current')).toBe(false)
    expect(restoreButton(v3)).not.toBeNull()
  })

  it('shows relative times with the full time in <time datetime>', async () => {
    const ledger = await mount()
    const [v3, v2, v1] = rows(ledger).map((row) => row.querySelector('time'))
    expect(v3?.textContent?.trim()).toBe('2 hours ago')
    expect(v2?.textContent?.trim()).toBe('yesterday')
    expect(v1?.textContent?.trim()).toBe('last week')
    expect(v3?.getAttribute('datetime')).toBe(
      new Date(NOW.getTime() - 2 * 3_600_000).toISOString(),
    )
    expect(v3?.getAttribute('title')).toBeTruthy()
  })

  it('shows the author with an avatar that screen readers skip', async () => {
    const ledger = await mount()
    const author = rows(ledger)[0].querySelector('.author')
    expect(author?.textContent).toContain('Dara Sok')
    expect(
      author?.querySelector('moul-avatar')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('formats changed values: empty, objects as JSON, or through valueFormatter', async () => {
    const ledger = await mount()
    const [v3] = rows(ledger)
    const values = Array.from(v3.querySelectorAll('.change')).map((li) => [
      li.querySelector('.before')?.textContent?.trim(),
      li.querySelector('.after')?.textContent?.trim(),
    ])
    expect(values).toEqual([
      ['Draft', 'Published'],
      ['Empty', '["news","release"]'],
    ])

    ledger.valueFormatter = (value) =>
      Array.isArray(value) ? value.join(', ') : String(value ?? '–')
    await settle(ledger)
    expect(v3.querySelectorAll('.after')[1]?.textContent?.trim()).toBe(
      'news, release',
    )
  })

  it('takes its words from labels, for another language', async () => {
    const ledger = await mount({
      labels: { restore: 'ស្ដារ', changes: (n: number) => `${n} ការផ្លាស់ប្ដូរ` },
    })
    const [v3, v2] = rows(ledger)
    expect(toggle(v3)?.textContent).toContain('2 ការផ្លាស់ប្ដូរ')
    expect(restoreButton(v2)?.textContent).toContain('ស្ដារ')
  })

  it('hides every Restore button when read-only', async () => {
    const ledger = await mount({ isReadOnly: true })
    expect(ledger.shadowRoot?.querySelectorAll('moul-button').length).toBe(0)
  })

  it('shows the empty slot when there are no versions', async () => {
    const ledger = await mount({ versions: [] })
    expect(
      ledger.shadowRoot?.querySelector('[part="empty"]')?.textContent,
    ).toContain('No history yet')
  })

  describe('restore', () => {
    it('fires a cancelable restore event and makes the version current', async () => {
      const ledger = await mount()
      const seen: HistoryVersion[] = []
      ledger.addEventListener('restore', (event) => {
        seen.push((event as CustomEvent<HistoryRestoreDetail>).detail.version)
      })
      restoreButton(rows(ledger)[1])?.click()
      await vi.waitFor(() => expect(ledger.current).toBe('v2'))
      expect(seen.map((version) => version.id)).toEqual(['v2'])
    })

    it('does nothing when the event is canceled', async () => {
      const ledger = await mount()
      ledger.addEventListener('restore', (event) => event.preventDefault())
      const button = restoreButton(rows(ledger)[1]) as MoulButton
      button.click()
      await settle(ledger)
      expect(ledger.current).toBe('v3')
      expect(button.state).toBe('idle')
    })

    it('shows a waitUntil promise pending, then restored', async () => {
      const ledger = await mount()
      let finish: () => void = () => {}
      ledger.addEventListener('restore', (event) => {
        ;(event as CustomEvent<HistoryRestoreDetail>).detail.waitUntil(
          new Promise<void>((resolve) => {
            finish = resolve
          }),
        )
      })
      const button = restoreButton(rows(ledger)[1]) as MoulButton
      button.click()
      await settle(ledger)
      expect(button.state).toBe('pending')
      expect(ledger.current).toBe('v3')
      // The other Restore buttons wait their turn.
      expect(restoreButton(rows(ledger)[2])?.isDisabled).toBe(true)

      finish()
      await vi.waitFor(() => expect(ledger.current).toBe('v2'))
      await settle(ledger)
      expect(button.state).toBe('success')
      // The button stays to show the result, now on the current row.
      expect(restoreButton(rows(ledger)[1])).toBe(button)
      expect(restoreButton(rows(ledger)[2])?.isDisabled).toBe(false)
    })

    it('shows a failure and keeps the current version when the promise rejects', async () => {
      const ledger = await mount()
      ledger.addEventListener('restore', (event) => {
        ;(event as CustomEvent<HistoryRestoreDetail>).detail.waitUntil(
          Promise.reject(new Error('offline')),
        )
      })
      const button = restoreButton(rows(ledger)[1]) as MoulButton
      button.click()
      await vi.waitFor(() => expect(button.state).toBe('error'))
      expect(ledger.current).toBe('v3')
    })

    it('leaves current alone when the app replaced versions during the restore', async () => {
      const ledger = await mount()
      let finish: () => void = () => {}
      ledger.addEventListener('restore', (event) => {
        ;(event as CustomEvent<HistoryRestoreDetail>).detail.waitUntil(
          new Promise<void>((resolve) => {
            finish = resolve
          }),
        )
      })
      const button = restoreButton(rows(ledger)[1]) as MoulButton
      button.click()
      await settle(ledger)
      ledger.versions = [
        { id: 'v4', label: 'Version 4', summary: 'Restored version 2' },
        ...VERSIONS,
      ]
      ledger.current = 'v4'
      finish()
      await vi.waitFor(() => expect(button.state).toBe('success'))
      expect(ledger.current).toBe('v4')
    })
  })

  describe('keyboard and screen readers', () => {
    it('names the list and each Restore button after its version', async () => {
      const ledger = await mount()
      expect(
        ledger.shadowRoot
          ?.querySelector('moul-timeline')
          ?.getAttribute('aria-label'),
      ).toBe('Version history')
      const name = restoreButton(rows(ledger)[1])
        ?.textContent?.replace(/\s+/g, ' ')
        .trim()
      expect(name?.startsWith('Restore Version 2')).toBe(true)
    })

    it('opens and closes the changes from a real button with aria-expanded', async () => {
      const ledger = await mount()
      const [v3] = rows(ledger)
      const button = toggle(v3) as HTMLButtonElement
      expect(button.type).toBe('button')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(panel(ledger, v3)?.hidden).toBe(true)

      button.click()
      await settle(ledger)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(panel(ledger, v3)?.hidden).toBe(false)
      expect(panel(ledger, v3)?.textContent).toContain('changed from')
    })

    it('moves focus to the row title when its focused Restore button goes away', async () => {
      vi.useRealTimers()
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
      vi.setSystemTime(NOW)
      const ledger = await mount()
      const row = rows(ledger)[1]
      const button = restoreButton(row) as MoulButton
      button.focus()
      button.click()
      await vi.waitFor(() => expect(ledger.current).toBe('v2'))
      Object.defineProperty(ledger.shadowRoot, 'activeElement', {
        configurable: true,
        get: () => button,
      })
      vi.advanceTimersByTime(1600)
      await settle(ledger)
      await Promise.resolve()
      delete (ledger.shadowRoot as unknown as { activeElement?: Element })
        .activeElement
      expect(restoreButton(row)).toBeNull()
      expect(ledger.shadowRoot?.activeElement).toBe(row.querySelector('.title'))
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    beforeEach(() => {
      motion = mockReducedMotion(true)
    })

    afterEach(() => {
      motion.restore()
    })

    it('opens and closes the changes at once', async () => {
      const ledger = await mount()
      const [v3] = rows(ledger)
      toggle(v3)?.click()
      await settle(ledger)
      expect(panel(ledger, v3)?.hidden).toBe(false)
      expect(panel(ledger, v3)?.hasAttribute('data-animating')).toBe(false)
      expect(panel(ledger, v3)?.style.height).toBe('')

      toggle(v3)?.click()
      await settle(ledger)
      expect(panel(ledger, v3)?.hidden).toBe(true)
    })
  })
})
