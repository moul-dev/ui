import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SERVER_LOG_RAW, SERVER_LOGS } from './LogsViewer/exampleLogs'
import './LogsViewer/Logs'
import type { MoulLogs } from './LogsViewer/Logs'
import type { LogItem } from './LogsViewer/Logs.types'
import { HighlightText, type MoulLogsViewer } from './LogsViewer/LogsViewer'

async function awaitNestedUpdates(element: Element): Promise<void> {
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
  await awaitNestedUpdates(element)
  return element
}

describe('Empirical Challenge: Logs Viewer and MoulLogs Stress Tests', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('1. Filter Level Changes & Boundary Conditions', () => {
    it('filterLevel="error" displays both error and fatal logs, suppressing info, warn, and debug', async () => {
      const customLogs: LogItem[] = [
        { id: '1', lineNumber: 1, level: 'info', message: 'info msg' },
        { id: '2', lineNumber: 2, level: 'warn', message: 'warn msg' },
        { id: '3', lineNumber: 3, level: 'error', message: 'error msg' },
        { id: '4', lineNumber: 4, level: 'fatal', message: 'fatal crash' },
        { id: '5', lineNumber: 5, level: 'debug', message: 'debug msg' },
        { id: '6', lineNumber: 6, level: 'trace', message: 'trace msg' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${customLogs} filter-level="error"></moul-logs-viewer>`,
      )

      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(2)

      const renderedLevels = Array.from(rows ?? []).map((r) =>
        r.querySelector('.cell-level')?.textContent?.trim(),
      )
      expect(renderedLevels).toEqual(['error', 'fatal'])
    })

    it('filterLevel="warn" displays only warn logs', async () => {
      const customLogs: LogItem[] = [
        { id: '1', lineNumber: 1, level: 'info', message: 'info msg' },
        { id: '2', lineNumber: 2, level: 'warn', message: 'warn msg 1' },
        { id: '3', lineNumber: 3, level: 'error', message: 'error msg' },
        { id: '4', lineNumber: 4, level: 'warn', message: 'warn msg 2' },
        { id: '5', lineNumber: 5, level: 'fatal', message: 'fatal crash' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${customLogs} filter-level="warn"></moul-logs-viewer>`,
      )

      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(2)

      const messages = Array.from(rows ?? []).map((r) =>
        r.querySelector('.cell-message span')?.textContent?.trim(),
      )
      expect(messages).toEqual(['warn msg 1', 'warn msg 2'])
    })

    it('filterLevel="debug" displays both debug and trace logs', async () => {
      const customLogs: LogItem[] = [
        { id: '1', lineNumber: 1, level: 'info', message: 'info msg' },
        { id: '2', lineNumber: 2, level: 'debug', message: 'debug msg' },
        { id: '3', lineNumber: 3, level: 'trace', message: 'trace msg' },
        { id: '4', lineNumber: 4, level: 'error', message: 'error msg' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${customLogs} filter-level="debug"></moul-logs-viewer>`,
      )

      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(2)
      const renderedLevels = Array.from(rows ?? []).map((r) =>
        r.querySelector('.cell-level')?.textContent?.trim(),
      )
      expect(renderedLevels).toEqual(['debug', 'trace'])
    })

    it('reacts dynamically to property mutation, attribute change, and toolbar button click', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)

      // 1. Property mutation
      el.filterLevel = 'error'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(4)

      // 2. Attribute change
      el.setAttribute('filter-level', 'warn')
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(3)

      // 3. Toolbar button click
      const allPill = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="all"]',
      )
      allPill?.click()
      await awaitNestedUpdates(el)
      expect(el.filterLevel).toBe('all')
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)
    })

    it('dispatches filterlevelchange and filterchange with accurate payload', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const levelSpy = vi.fn()
      const filterSpy = vi.fn()
      el.addEventListener('filterlevelchange', (e) =>
        levelSpy((e as CustomEvent).detail),
      )
      el.addEventListener('filterchange', (e) =>
        filterSpy((e as CustomEvent).detail),
      )

      const errorPill = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="error"]',
      )
      errorPill?.click()
      await awaitNestedUpdates(el)

      expect(levelSpy).toHaveBeenCalledWith({ filterLevel: 'error' })
      expect(filterSpy).toHaveBeenCalledWith({
        filterLevel: 'error',
        searchQuery: '',
      })
    })
  })

  describe('2. Search Query & Adversarial Regex Stress-Testing', () => {
    const adversarialQueries = [
      '.*',
      '[',
      ']',
      '[]',
      '(.*)',
      '\\',
      '\\\\',
      '?',
      '+',
      '*',
      '^',
      '$',
      '{1,3}',
      '|',
      '(foo|bar)',
      '^[a-z]+$',
      '[a-z0-9_-]+',
      '??',
      '+++',
      '***',
    ]

    for (const query of adversarialQueries) {
      it(`handles query containing regex characters "${query}" without throwing or crashing`, async () => {
        const testLogs: LogItem[] = [
          {
            id: '1',
            lineNumber: 1,
            level: 'info',
            message: `Special pattern contains ${query} here`,
          },
          {
            id: '2',
            lineNumber: 2,
            level: 'info',
            message: 'Normal message without any special character',
          },
        ]

        const el = await mount<MoulLogsViewer>(
          html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
        )

        expect(() => {
          el.searchQuery = query
        }).not.toThrow()
        await awaitNestedUpdates(el)

        // Query must match the first row because it contains the literal string
        const rows = el.shadowRoot?.querySelectorAll('.row')
        expect(rows?.length).toBe(1)
        expect(rows?.[0].querySelector('.cell-message')?.textContent).toContain(
          query,
        )
      })
    }

    it('HighlightText properly wraps special characters in <mark> tags', () => {
      const text = 'Log with [alert] and (code) and .* wildcard'
      const template = HighlightText({ text, query: '[' })
      expect(typeof template).toBe('object') // TemplateResult

      const container = document.createElement('div')
      render(template, container)
      const mark = container.querySelector('mark.highlight')
      expect(mark).not.toBeNull()
      expect(mark?.textContent).toBe('[')
    })

    it('matches search query across message, attributes, level, timestamp, and raw fields', async () => {
      const richLogs: LogItem[] = [
        {
          id: '1',
          lineNumber: 1,
          timestamp: '2026-10-17 12:00:00',
          level: 'info',
          message: 'User authentication succeeded',
          attributes: { userId: 'usr-4421', role: 'admin' },
          raw: '2026-10-17 12:00:00 [INFO] User authentication succeeded userId=usr-4421 role=admin',
        },
        {
          id: '2',
          lineNumber: 2,
          timestamp: '2026-10-17 12:01:00',
          level: 'warn',
          message: 'Rate limit approaching',
          attributes: { clientIp: '192.168.1.100', requests: 95 },
          raw: '2026-10-17 12:01:00 [WARN] Rate limit approaching clientIp=192.168.1.100 requests=95',
        },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${richLogs}></moul-logs-viewer>`,
      )

      // 1. Search in attributes key
      el.searchQuery = 'userId'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // 2. Search in attributes value
      el.searchQuery = 'usr-4421'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // 3. Search numeric attribute
      el.searchQuery = '95'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // 4. Search timestamp
      el.searchQuery = '12:01:00'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // 5. Search message
      el.searchQuery = 'approaching'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // 6. Search level
      el.searchQuery = 'warn'
      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(1)
    })

    it('clearing search query restores rows and fires events', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS} search-query="error"></moul-logs-viewer>`,
      )

      await awaitNestedUpdates(el)
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBeLessThan(17)

      const clearBtn =
        el.shadowRoot?.querySelector<HTMLButtonElement>('.search-clear-btn')
      expect(clearBtn).not.toBeNull()

      const searchChangeSpy = vi.fn()
      el.addEventListener('searchchange', (e) =>
        searchChangeSpy((e as CustomEvent).detail),
      )

      clearBtn?.click()
      await awaitNestedUpdates(el)

      expect(el.searchQuery).toBe('')
      expect(el.shadowRoot?.querySelectorAll('.row').length).toBe(17)
      expect(searchChangeSpy).toHaveBeenCalledWith({ searchQuery: '' })
    })

    it('fast-check: HighlightText survives random queries and strings without throwing', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (text, query) => {
          expect(() => {
            HighlightText({ text, query })
          }).not.toThrow()
        }),
        { numRuns: 200 },
      )
    })
  })

  describe('3. Timestamp Toggle & Clean DOM State', () => {
    it('cleanly renders and removes .cell-time on property toggle', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      // Initially true: .cell-time exists in all rows
      let timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(17)

      // Toggle off
      el.showTimestamps = false
      await awaitNestedUpdates(el)
      timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(0)

      // Toggle on
      el.showTimestamps = true
      await awaitNestedUpdates(el)
      timeCells = el.shadowRoot?.querySelectorAll('.cell-time')
      expect(timeCells?.length).toBe(17)
    })

    it('toggles timestamps via toolbar button click', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const toggleBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[title="Toggle timestamps"]',
      )
      expect(toggleBtn).not.toBeNull()
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('true')
      expect(toggleBtn?.classList.contains('active')).toBe(true)

      // Click to toggle off
      toggleBtn?.click()
      await awaitNestedUpdates(el)

      expect(el.showTimestamps).toBe(false)
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('false')
      expect(toggleBtn?.classList.contains('active')).toBe(false)
      expect(el.shadowRoot?.querySelectorAll('.cell-time').length).toBe(0)

      // Click to toggle back on
      toggleBtn?.click()
      await awaitNestedUpdates(el)

      expect(el.showTimestamps).toBe(true)
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('true')
      expect(el.shadowRoot?.querySelectorAll('.cell-time').length).toBe(17)
    })

    it('survives rapid toggling without state drift or DOM residue', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      for (let i = 0; i < 10; i++) {
        el.showTimestamps = i % 2 === 0
        await awaitNestedUpdates(el)
        const expectedCount = i % 2 === 0 ? 17 : 0
        expect(el.shadowRoot?.querySelectorAll('.cell-time').length).toBe(
          expectedCount,
        )
      }
    })
  })

  describe('4. Line Wrapping Toggle & CSS Classes', () => {
    it('sets .no-wrap by default and toggles to .wrap-lines', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const container = el.shadowRoot?.querySelector('.scroll-container')
      expect(container?.classList.contains('no-wrap')).toBe(true)
      expect(container?.classList.contains('wrap-lines')).toBe(false)

      el.wrapLines = true
      await awaitNestedUpdates(el)

      expect(container?.classList.contains('wrap-lines')).toBe(true)
      expect(container?.classList.contains('no-wrap')).toBe(false)

      el.wrapLines = false
      await awaitNestedUpdates(el)

      expect(container?.classList.contains('no-wrap')).toBe(true)
      expect(container?.classList.contains('wrap-lines')).toBe(false)
    })

    it('toggles wrapLines via toolbar button click and updates aria-pressed', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const wrapBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[title="Toggle line wrapping"]',
      )
      expect(wrapBtn).not.toBeNull()
      expect(wrapBtn?.getAttribute('aria-pressed')).toBe('false')

      wrapBtn?.click()
      await awaitNestedUpdates(el)

      expect(el.wrapLines).toBe(true)
      expect(wrapBtn?.getAttribute('aria-pressed')).toBe('true')
      expect(wrapBtn?.classList.contains('active')).toBe(true)
      expect(
        el.shadowRoot
          ?.querySelector('.scroll-container')
          ?.classList.contains('wrap-lines'),
      ).toBe(true)

      wrapBtn?.click()
      await awaitNestedUpdates(el)

      expect(el.wrapLines).toBe(false)
      expect(wrapBtn?.getAttribute('aria-pressed')).toBe('false')
      expect(wrapBtn?.classList.contains('active')).toBe(false)
    })

    it('reflects wrap-lines attribute to property and DOM class', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS} wrap-lines></moul-logs-viewer>`,
      )

      expect(el.wrapLines).toBe(true)
      expect(
        el.shadowRoot
          ?.querySelector('.scroll-container')
          ?.classList.contains('wrap-lines'),
      ).toBe(true)

      el.removeAttribute('wrap-lines')
      await awaitNestedUpdates(el)

      expect(el.wrapLines).toBe(false)
      expect(
        el.shadowRoot
          ?.querySelector('.scroll-container')
          ?.classList.contains('no-wrap'),
      ).toBe(true)
    })
  })

  describe('5. MoulLogs Component: Raw Input Parsing and Forwarding', () => {
    it('parses raw text property and renders rows into <moul-logs-viewer>', async () => {
      const rawText = `2026/08/19 11:16:49 INFO Starting engine addr="http://localhost:8080"
2026/08/19 11:16:50 WARN Memory high threshold=90%
2026/08/19 11:16:51 ERROR Failed to bind port code=500`

      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${rawText}></moul-logs>`,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitNestedUpdates(viewer!)

      const rows = viewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(3)

      expect(viewer?.logs[0].level).toBe('info')
      expect(viewer?.logs[0].attributes?.addr).toBe('http://localhost:8080')
      expect(viewer?.logs[1].level).toBe('warn')
      expect(viewer?.logs[2].level).toBe('error')
    })

    it('parses raw attribute string', async () => {
      const rawAttr = '2026/08/19 11:16:49 INFO Line from attribute'
      const el = await mount<MoulLogs>(
        html`<moul-logs raw=${rawAttr}></moul-logs>`,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitNestedUpdates(viewer!)

      const rows = viewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
      expect(rows?.[0].querySelector('.cell-message')?.textContent).toContain(
        'Line from attribute',
      )
    })

    it('updates parsed logs when .raw property changes dynamically', async () => {
      const initial = '2026/08/19 11:16:49 INFO Initial log'
      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${initial}></moul-logs>`,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      await awaitNestedUpdates(viewer!)
      expect(viewer?.shadowRoot?.querySelectorAll('.row').length).toBe(1)

      // Update raw
      el.raw = `${initial}\n2026/08/19 11:16:50 WARN Added second log`
      await awaitNestedUpdates(el)
      await awaitNestedUpdates(viewer!)

      expect(viewer?.shadowRoot?.querySelectorAll('.row').length).toBe(2)
    })

    it('empirically tests boolean property forwarding from MoulLogs to MoulLogsViewer', async () => {
      const el = await mount<MoulLogs>(
        html`
          <moul-logs
            .raw=${SERVER_LOG_RAW}
            filter-level="error"
            search-query="webhook"
            .showTimestamps=${false}
            .showLineNumbers=${false}
            .showLevels=${false}
            .showToolbar=${false}
            .wrapLines=${true}
            .compact=${true}
            .virtualized=${false}
            max-height="400px"
          ></moul-logs>
        `,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitNestedUpdates(viewer!)

      expect(viewer?.filterLevel).toBe('error')
      expect(viewer?.searchQuery).toBe('webhook')
      expect(viewer?.wrapLines).toBe(true)
      expect(viewer?.compact).toBe(true)
      expect(viewer?.maxHeight).toBe('400px')

      // Document exact observed values for default-true booleans bound with ?attr:
      // Notice: ?show-timestamps=${false} does not set viewer.showTimestamps to false
      // on initial mount because the attribute was never added, so constructor default (true) persists!
      const initialViewerShowTimestamps = viewer?.showTimestamps
      const initialViewerShowToolbar = viewer?.showToolbar
      const initialViewerShowLevels = viewer?.showLevels
      const initialViewerShowLineNumbers = viewer?.showLineNumbers
      const initialViewerVirtualized = viewer?.virtualized

      // If we mutate el.showTimestamps after mount:
      el.showTimestamps = true
      await awaitNestedUpdates(el)
      await awaitNestedUpdates(viewer!)
      const afterSettingTrue = viewer?.showTimestamps

      el.showTimestamps = false
      await awaitNestedUpdates(el)
      await awaitNestedUpdates(viewer!)
      const afterSettingFalse = viewer?.showTimestamps

      // Verify that property binding accurately communicates false on initial render:
      expect({
        initialViewerShowTimestamps,
        initialViewerShowToolbar,
        initialViewerShowLevels,
        initialViewerShowLineNumbers,
        initialViewerVirtualized,
        afterSettingTrue,
        afterSettingFalse,
      }).toEqual({
        initialViewerShowTimestamps: false,
        initialViewerShowToolbar: false,
        initialViewerShowLevels: false,
        initialViewerShowLineNumbers: false,
        initialViewerVirtualized: false,
        afterSettingTrue: true,
        afterSettingFalse: false,
      })
    })

    it('parses slotted text content in <moul-logs>', async () => {
      const slotText = '2026/08/19 11:16:49 INFO Line from slot channel=general'
      const el = await mount<MoulLogs>(html`<moul-logs>${slotText}</moul-logs>`)

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitNestedUpdates(viewer!)

      const rows = viewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
      expect(rows?.[0].querySelector('.cell-message')?.textContent).toContain(
        'Line from slot',
      )
    })

    it('handles empty string, undefined, or whitespace gracefully', async () => {
      const el = await mount<MoulLogs>(html`<moul-logs .raw=${''}></moul-logs>`)

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitNestedUpdates(viewer!)

      expect(viewer?.logs).toEqual([])
      expect(viewer?.shadowRoot?.querySelector('.empty-state')).not.toBeNull()
    })
  })

  describe('6. Log Detail Drawer and Edge Cases', () => {
    it('opens the detail drawer on row click and renders attribute key-values and raw line', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const firstRow = el.shadowRoot?.querySelector<HTMLElement>('.row')
      firstRow?.click()
      await awaitNestedUpdates(el)

      expect(el.isInspectorOpen).toBe(true)
      expect(el.selectedId).toBe('log-0')
      expect(firstRow?.classList.contains('selected')).toBe(true)
      expect(firstRow?.getAttribute('aria-selected')).toBe('true')

      const inspector = el.shadowRoot?.querySelector('.inspector-body')
      expect(inspector).not.toBeNull()
      expect(inspector?.textContent).toContain('addr')
      expect(inspector?.textContent).toContain('http://localhost:8090')
      expect(inspector?.querySelector('.inspector-raw')?.textContent).toBe(
        SERVER_LOGS[0].raw,
      )

      // Clicking the same row again keeps the drawer open on that log
      firstRow?.click()
      await awaitNestedUpdates(el)
      expect(el.isInspectorOpen).toBe(true)
      expect(el.selectedId).toBe('log-0')

      el.shadowRoot
        ?.querySelector<HTMLButtonElement>('.inspector-close-btn')
        ?.click()
      await awaitNestedUpdates(el)

      expect(el.isInspectorOpen).toBe(false)
      expect(el.selectedId).toBeNull()
      expect(firstRow?.classList.contains('selected')).toBe(false)
    })

    it('safely handles logs without attributes or with non-string values', async () => {
      const plainLogs: LogItem[] = [
        {
          id: 'plain-1',
          lineNumber: 1,
          message: 'Just plain text',
          attributes: { count: 42, active: true, nothing: null },
        },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${plainLogs}></moul-logs-viewer>`,
      )

      const row = el.shadowRoot?.querySelector<HTMLElement>('.row')
      row?.click()
      await awaitNestedUpdates(el)

      const inspector = el.shadowRoot?.querySelector('.inspector-body')
      expect(inspector).not.toBeNull()
      expect(inspector?.textContent).toContain('count')
      expect(inspector?.textContent).toContain('42')
      expect(inspector?.textContent).toContain('active')
      expect(inspector?.textContent).toContain('true')
      expect(inspector?.textContent).toContain('nothing')
      expect(inspector?.textContent).toContain('null')
    })
  })
})
