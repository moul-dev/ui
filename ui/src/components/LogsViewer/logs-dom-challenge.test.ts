import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SERVER_LOG_RAW, SERVER_LOGS } from './exampleLogs'
import './Logs'
import './LogsViewer'
import type { MoulLogs } from './Logs'
import type { LogItem } from './Logs.types'
import type { MoulLogsViewer } from './LogsViewer'

async function awaitUpdates(element: Element): Promise<void> {
  if ('updateComplete' in element && (element as LitElement).updateComplete) {
    await (element as LitElement).updateComplete
  }
  const children = Array.from(element.shadowRoot?.querySelectorAll('*') ?? [])
  await Promise.all(
    children.map((child) => {
      if ('updateComplete' in child && (child as LitElement).updateComplete) {
        return (child as LitElement).updateComplete
      }
      return Promise.resolve()
    }),
  )
}

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitUpdates(element)
  return element
}

describe('Empirical Challenge: MoulLogsViewer and MoulLogs DOM & Reactive Behaviors', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('Dimension 1: Filter Level Changes & DOM Rendering', () => {
    it('filters rows correctly for error level (showing both error and fatal)', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      // Total logs in fixture is 17:
      // info: 10, warn: 2, error: 3, fatal: 1, debug: 1
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)

      // 1. Programmatic filterLevel change
      el.filterLevel = 'error'
      await awaitUpdates(el)

      const errorRows = el.shadowRoot?.querySelectorAll('.row')
      expect(errorRows?.length).toBe(4) // 3 ERRO + 1 FATA

      // Verify the rendered badges are strictly error or fatal
      const badges = Array.from(
        el.shadowRoot?.querySelectorAll('.level-badge') ?? [],
      ).map((b) => b.textContent?.trim().toLowerCase())
      expect(badges).toEqual(['error', 'error', 'error', 'fatal'])

      // Check counts badge
      const countBadge = el.shadowRoot?.querySelector('.counts-badge')
      expect(countBadge?.textContent?.trim()).toContain('4 / 17 events')
    })

    it('filters rows correctly for warn level', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      el.filterLevel = 'warn'
      await awaitUpdates(el)

      const warnRows = el.shadowRoot?.querySelectorAll('.row')
      expect(warnRows?.length).toBe(3) // 3 WARN lines in SERVER_LOGS fixture

      const badges = Array.from(
        el.shadowRoot?.querySelectorAll('.level-badge') ?? [],
      ).map((b) => b.textContent?.trim().toLowerCase())
      expect(badges).toEqual(['warn', 'warn', 'warn'])

      const countBadge = el.shadowRoot?.querySelector('.counts-badge')
      expect(countBadge?.textContent?.trim()).toContain('3 / 17 events')
    })

    it('filters rows correctly for debug level (showing both debug and trace)', async () => {
      const customLogs: LogItem[] = [
        { id: 1, message: 'trace 1', level: 'trace' },
        { id: 2, message: 'debug 1', level: 'debug' },
        { id: 3, message: 'info 1', level: 'info' },
      ]
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${customLogs}></moul-logs-viewer>`,
      )

      el.filterLevel = 'debug'
      await awaitUpdates(el)

      const debugRows = el.shadowRoot?.querySelectorAll('.row')
      expect(debugRows?.length).toBe(2) // trace + debug
    })

    it('reacts to clicking filter pill buttons and dispatches filterlevelchange and filterchange', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const levelEvents: unknown[] = []
      const filterEvents: unknown[] = []
      el.addEventListener('filterlevelchange', (e) =>
        levelEvents.push((e as CustomEvent).detail),
      )
      el.addEventListener('filterchange', (e) =>
        filterEvents.push((e as CustomEvent).detail),
      )

      const warnPill = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="warn"]',
      )
      expect(warnPill).not.toBeNull()
      warnPill?.click()
      await awaitUpdates(el)

      expect(el.filterLevel).toBe('warn')
      expect(warnPill?.classList.contains('active')).toBe(true)
      expect(warnPill?.getAttribute('aria-pressed')).toBe('true')
      expect(levelEvents).toEqual([{ filterLevel: 'warn' }])
      expect(filterEvents).toEqual([{ filterLevel: 'warn', searchQuery: '' }])

      // Click 'all' pill
      const allPill = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="all"]',
      )
      allPill?.click()
      await awaitUpdates(el)

      expect(el.filterLevel).toBe('all')
      expect(allPill?.classList.contains('active')).toBe(true)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)
    })

    it('reacts to HTML attribute filter-level changes', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      el.setAttribute('filter-level', 'error')
      await awaitUpdates(el)

      expect(el.filterLevel).toBe('error')
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(4)

      el.setAttribute('filter-level', 'warn')
      await awaitUpdates(el)

      expect(el.filterLevel).toBe('warn')
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(3)
    })
  })

  describe('Dimension 2: Search Query with Regex Metacharacters', () => {
    it('handles search queries containing regex characters without crashing or throwing SyntaxError', async () => {
      const trickyLogs: LogItem[] = [
        { id: '1', message: 'Standard log message' },
        { id: '2', message: 'Regex character .* inside message' },
        { id: '3', message: 'Bracket test [error] code=404' },
        { id: '4', message: 'Parenthesis test (null_pointer)' },
        { id: '5', message: 'Plus sign test c++ runtime error' },
        { id: '6', message: 'Backslash path C:\\Users\\Admin' },
        { id: '7', message: 'Curly brace {json_payload: true}' },
        { id: '8', message: 'Question mark is this ok?' },
        { id: '9', message: 'Pipe delimiter foo | bar' },
        { id: '10', message: 'Anchor caret ^start and dollar $end' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${trickyLogs}></moul-logs-viewer>`,
      )

      const testQueries = [
        '.*',
        '[',
        ']',
        '[error]',
        '(',
        ')',
        '(null_pointer)',
        '+',
        'c++',
        '\\',
        'C:\\',
        '{',
        '}',
        '?',
        '|',
        '^',
        '$',
        '[[[',
        '(.*?)',
        '\\d+',
      ]

      for (const query of testQueries) {
        expect(() => {
          el.searchQuery = query
        }).not.toThrow()

        await awaitUpdates(el)

        // Ensure rendering didn't fail
        const table = el.shadowRoot?.querySelector('.logs-table')
        expect(table).not.toBeNull()
      }
    })

    it('matches and highlights special characters correctly', async () => {
      const logs: LogItem[] = [
        { id: '1', message: 'Call to function(arg) failed' },
        { id: '2', message: 'Unrelated message' },
      ]
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${logs}></moul-logs-viewer>`,
      )

      el.searchQuery = '(arg)'
      await awaitUpdates(el)

      expect(el.filteredLogs.length).toBe(1)
      expect(el.filteredLogs[0].id).toBe('1')

      // Check DOM row message contains mark.highlight
      const mark = el.shadowRoot?.querySelector('mark.highlight')
      expect(mark).not.toBeNull()
      expect(mark?.textContent).toBe('(arg)')
    })

    it('handles search input events and clear button correctly', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const searchInput =
        el.shadowRoot?.querySelector<HTMLInputElement>('.search-input')
      expect(searchInput).not.toBeNull()

      // Simulate typing into search box
      searchInput!.value = 'webhook'
      searchInput!.dispatchEvent(new Event('input'))
      await awaitUpdates(el)

      expect(el.searchQuery).toBe('webhook')
      expect(el.filteredLogs.length).toBe(1)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // Clear button should now be visible
      const clearBtn =
        el.shadowRoot?.querySelector<HTMLButtonElement>('.search-clear-btn')
      expect(clearBtn).not.toBeNull()

      clearBtn?.click()
      await awaitUpdates(el)

      expect(el.searchQuery).toBe('')
      expect(el.filteredLogs.length).toBe(17)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)
    })
  })

  describe('Dimension 3: Timestamp Toggle DOM Rendering', () => {
    it('cleanly renders timestamps when enabled and completely removes .cell-time when disabled', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      // Initially enabled by default
      expect(el.showTimestamps).toBe(true)
      let timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(17)
      expect(timeCells?.[0].textContent?.trim()).toBe('2026/08/19 11:16:49')

      const timeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[title="Toggle timestamps"]',
      )
      expect(timeBtn?.classList.contains('active')).toBe(true)
      expect(timeBtn?.getAttribute('aria-pressed')).toBe('true')

      // Toggle off via button click
      timeBtn?.click()
      await awaitUpdates(el)

      expect(el.showTimestamps).toBe(false)
      timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(0)
      expect(timeBtn?.classList.contains('active')).toBe(false)
      expect(timeBtn?.getAttribute('aria-pressed')).toBe('false')

      // Toggle back on via programmatic property
      el.showTimestamps = true
      await awaitUpdates(el)

      timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(17)
      expect(timeBtn?.classList.contains('active')).toBe(true)
    })

    it('hides timestamps when showTimestamps property is initialized to false', async () => {
      const el = await mount<MoulLogsViewer>(
        html`
          <moul-logs-viewer
            .logs=${SERVER_LOGS}
            .showTimestamps=${false}
          ></moul-logs-viewer>
        `,
      )

      expect(el.showTimestamps).toBe(false)
      expect(el.shadowRoot?.querySelectorAll('.cell-time').length).toBe(0)

      el.showTimestamps = true
      await awaitUpdates(el)

      expect(el.shadowRoot?.querySelectorAll('.cell-time').length).toBe(17)
    })
  })

  describe('Dimension 4: Line Wrapping Toggle and CSS Classes', () => {
    it('toggles wrap-lines and no-wrap classes on .scroll-container', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const scrollBox = el.shadowRoot?.querySelector('.scroll-container')
      expect(scrollBox).not.toBeNull()
      expect(scrollBox?.classList.contains('no-wrap')).toBe(true)
      expect(scrollBox?.classList.contains('wrap-lines')).toBe(false)

      const wrapBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[title="Toggle line wrapping"]',
      )
      expect(wrapBtn?.classList.contains('active')).toBe(false)
      expect(wrapBtn?.getAttribute('aria-pressed')).toBe('false')

      // Click wrap toggle button
      wrapBtn?.click()
      await awaitUpdates(el)

      expect(el.wrapLines).toBe(true)
      expect(scrollBox?.classList.contains('wrap-lines')).toBe(true)
      expect(scrollBox?.classList.contains('no-wrap')).toBe(false)
      expect(wrapBtn?.classList.contains('active')).toBe(true)
      expect(wrapBtn?.getAttribute('aria-pressed')).toBe('true')

      // Click again to unwrap
      wrapBtn?.click()
      await awaitUpdates(el)

      expect(el.wrapLines).toBe(false)
      expect(scrollBox?.classList.contains('no-wrap')).toBe(true)
      expect(scrollBox?.classList.contains('wrap-lines')).toBe(false)
    })

    it('reacts to wrap-lines attribute dynamically', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      el.setAttribute('wrap-lines', '')
      await awaitUpdates(el)

      const scrollBox = el.shadowRoot?.querySelector('.scroll-container')
      expect(el.wrapLines).toBe(true)
      expect(scrollBox?.classList.contains('wrap-lines')).toBe(true)

      el.removeAttribute('wrap-lines')
      await awaitUpdates(el)

      expect(el.wrapLines).toBe(false)
      expect(scrollBox?.classList.contains('no-wrap')).toBe(true)
    })
  })

  describe('Dimension 5: MoulLogs Companion Parsing & Forwarding', () => {
    it('parses raw multiline text property and forwards parsed items to inner viewer', async () => {
      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${SERVER_LOG_RAW}></moul-logs>`,
      )

      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)

      expect(innerViewer?.logs.length).toBe(17)
      expect(innerViewer?.shadowRoot?.querySelectorAll('.row').length).toBe(17)
    })

    it('dynamically updates inner viewer when raw property changes', async () => {
      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${SERVER_LOG_RAW}></moul-logs>`,
      )

      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)
      expect(innerViewer?.logs.length).toBe(17)

      // Update raw to single line
      el.raw = '2026/10/17 12:00:00 INFO Brand new log line addr="127.0.0.1"'
      await awaitUpdates(el)
      await awaitUpdates(innerViewer!)

      expect(innerViewer?.logs.length).toBe(1)
      expect(innerViewer?.shadowRoot?.querySelectorAll('.row').length).toBe(1)
      expect(
        innerViewer?.shadowRoot
          ?.querySelector('.cell-message')
          ?.textContent?.trim(),
      ).toContain('Brand new log line')
    })

    it('forwards filterLevel, searchQuery, and wrapLines reactively to inner viewer', async () => {
      const el = await mount<MoulLogs>(
        html`
          <moul-logs
            .raw=${SERVER_LOG_RAW}
            filter-level="error"
            search-query="webhook"
            ?wrap-lines=${true}
          ></moul-logs>
        `,
      )

      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)

      expect(innerViewer?.filterLevel).toBe('error')
      expect(innerViewer?.searchQuery).toBe('webhook')
      expect(innerViewer?.wrapLines).toBe(true)

      const rows = innerViewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)

      const scrollBox =
        innerViewer?.shadowRoot?.querySelector('.scroll-container')
      expect(scrollBox?.classList.contains('wrap-lines')).toBe(true)

      // Dynamically update on parent <moul-logs>
      el.filterLevel = 'warn'
      el.searchQuery = ''
      el.wrapLines = false
      await awaitUpdates(el)
      await awaitUpdates(innerViewer!)

      expect(innerViewer?.filterLevel).toBe('warn')
      expect(innerViewer?.searchQuery).toBe('')
      expect(innerViewer?.wrapLines).toBe(false)

      expect(innerViewer?.shadowRoot?.querySelectorAll('.row').length).toBe(3)
      expect(scrollBox?.classList.contains('no-wrap')).toBe(true)
    })

    it('forwards boolean properties defaulting to true to inner viewer via property bindings', async () => {
      const el = await mount<MoulLogs>(
        html`
          <moul-logs
            .raw=${SERVER_LOG_RAW}
            .showTimestamps=${false}
            .showLineNumbers=${false}
            .showLevels=${false}
            .showToolbar=${false}
            .virtualized=${false}
          ></moul-logs>
        `,
      )

      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)

      expect(el.showTimestamps).toBe(false)
      expect(innerViewer?.showTimestamps).toBe(false)
      expect(
        innerViewer?.shadowRoot?.querySelectorAll('.cell-time').length,
      ).toBe(0)

      expect(el.showLineNumbers).toBe(false)
      expect(innerViewer?.showLineNumbers).toBe(false)
      expect(
        innerViewer?.shadowRoot?.querySelectorAll('.cell-line').length,
      ).toBe(0)

      expect(el.showLevels).toBe(false)
      expect(innerViewer?.showLevels).toBe(false)
      expect(
        innerViewer?.shadowRoot?.querySelectorAll('.cell-level').length,
      ).toBe(0)

      expect(el.showToolbar).toBe(false)
      expect(innerViewer?.showToolbar).toBe(false)
      expect(innerViewer?.shadowRoot?.querySelector('.toolbar')).toBeNull()

      expect(el.virtualized).toBe(false)
      expect(innerViewer?.virtualized).toBe(false)
    })

    it('renders cleanly without crashing when JSON log contains level: constructor', async () => {
      const evilJson = JSON.stringify({
        level: 'constructor',
        msg: 'unhandled prototype crash',
      })

      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${evilJson}></moul-logs>`,
      )
      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)

      const rows = innerViewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
      const badge = innerViewer?.shadowRoot?.querySelector('.level-badge')
      expect(badge?.textContent?.trim()).toBe('info')
    })

    it('parses textContent when raw property is not provided', async () => {
      const rawText = `2026/08/19 11:16:49 INFO Line 1\n2026/08/19 11:16:50 WARN Line 2`
      const el = await mount<MoulLogs>(html`<moul-logs>${rawText}</moul-logs>`)

      const innerViewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).not.toBeNull()
      await awaitUpdates(innerViewer!)

      expect(innerViewer?.logs.length).toBe(2)
      expect(innerViewer?.shadowRoot?.querySelectorAll('.row').length).toBe(2)
    })
  })

  describe('Dimension 6: Additional Display & Reactive Controls', () => {
    it('toggles line numbers and level badges correctly', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      expect(el.shadowRoot?.querySelectorAll('.cell-line').length).toBe(17)
      expect(el.shadowRoot?.querySelectorAll('.cell-level').length).toBe(17)

      el.showLineNumbers = false
      el.showLevels = false
      await awaitUpdates(el)

      expect(el.shadowRoot?.querySelectorAll('.cell-line').length).toBe(0)
      expect(el.shadowRoot?.querySelectorAll('.cell-level').length).toBe(0)
    })

    it('toggles toolbar visibility cleanly without affecting log rows', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      expect(el.shadowRoot?.querySelector('.toolbar')).not.toBeNull()
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)

      el.showToolbar = false
      await awaitUpdates(el)

      expect(el.shadowRoot?.querySelector('.toolbar')).toBeNull()
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)
    })

    it('applies compact row styling when compact is true', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS} ?compact=${true}></moul-logs-viewer>`,
      )

      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.[0].classList.contains('compact')).toBe(true)

      el.compact = false
      await awaitUpdates(el)

      expect(rows?.[0].classList.contains('compact')).toBe(false)
    })

    it('dispatches logselect and rowclick events with item payload on row click', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      let selectDetail: unknown = null
      let clickDetail: unknown = null
      el.addEventListener('logselect', (e) => {
        selectDetail = (e as CustomEvent).detail
      })
      el.addEventListener('rowclick', (e) => {
        clickDetail = (e as CustomEvent).detail
      })

      const firstRow = el.shadowRoot?.querySelector<HTMLElement>('.row')
      firstRow?.click()
      await awaitUpdates(el)

      expect(selectDetail).toEqual({ log: SERVER_LOGS[0] })
      expect(clickDetail).toEqual({ log: SERVER_LOGS[0] })
      expect(el.selectedId).toBe(SERVER_LOGS[0].id)
      expect(el.isInspectorOpen).toBe(true)
    })
  })
})
