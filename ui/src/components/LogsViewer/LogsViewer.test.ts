import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { triggerResize } from '../../test-setup'
import { defineElement } from '../../utils/define-element'
import type { MoulDrawer } from '../Drawer/Drawer'
import { SERVER_LOG_RAW, SERVER_LOGS } from './exampleLogs'
import { MoulLogs } from './Logs'
import type { LogFilterLevel } from './Logs.types'
import { MoulLogsViewer } from './LogsViewer'
import {
  normalizeLogLevel,
  parseAttributes,
  parseLogLine,
  parseLogs,
  stripAttributes,
} from './parseLogs'

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

describe('Milestone 1: Logs Viewer and Pure Parser Verification', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('Pure Log Parsers', () => {
    it('normalizeLogLevel normalizes standard and abbreviated levels', () => {
      expect(normalizeLogLevel('INFO')).toBe('info')
      expect(normalizeLogLevel('inf')).toBe('info')
      expect(normalizeLogLevel('DEBU')).toBe('debug')
      expect(normalizeLogLevel('debug')).toBe('debug')
      expect(normalizeLogLevel('WARN')).toBe('warn')
      expect(normalizeLogLevel('warning')).toBe('warn')
      expect(normalizeLogLevel('ERRO')).toBe('error')
      expect(normalizeLogLevel('error')).toBe('error')
      expect(normalizeLogLevel('err')).toBe('error')
      expect(normalizeLogLevel('FATA')).toBe('fatal')
      expect(normalizeLogLevel('fatal')).toBe('fatal')
      expect(normalizeLogLevel('panic')).toBe('fatal')
      expect(normalizeLogLevel('crit')).toBe('fatal')
      expect(normalizeLogLevel('critical')).toBe('fatal')
      expect(normalizeLogLevel('TRACE')).toBe('trace')
      expect(normalizeLogLevel('trac')).toBe('trace')
      expect(normalizeLogLevel('[WARN]')).toBe('warn')
      expect(normalizeLogLevel(undefined)).toBe('info')
      expect(normalizeLogLevel('')).toBe('info')
      expect(normalizeLogLevel('unknown_xyz')).toBe('info')
      // Pino/Bunyan numeric levels
      expect(normalizeLogLevel(10)).toBe('trace')
      expect(normalizeLogLevel(20)).toBe('debug')
      expect(normalizeLogLevel(30)).toBe('info')
      expect(normalizeLogLevel(40)).toBe('warn')
      expect(normalizeLogLevel(50)).toBe('error')
      expect(normalizeLogLevel(60)).toBe('fatal')
      // Prototype key safety
      expect(normalizeLogLevel('constructor')).toBe('info')
      expect(normalizeLogLevel('toString')).toBe('info')
      expect(normalizeLogLevel('valueOf')).toBe('info')
      expect(normalizeLogLevel('__proto__')).toBe('info')
    })

    it('parseAttributes extracts quoted, single-quoted, and unquoted values with coercion', () => {
      const text =
        'addr="http://localhost:8090" count=12 active=true debug=false nullable=null latency="182.4µs" simple=hello'
      const attrs = parseAttributes(text)

      expect(attrs.addr).toBe('http://localhost:8090')
      expect(attrs.count).toBe(12)
      expect(attrs.active).toBe(true)
      expect(attrs.debug).toBe(false)
      expect(attrs.nullable).toBe(null)
      expect(attrs.latency).toBe('182.4µs')
      expect(attrs.simple).toBe('hello')
    })

    it('parseAttributes handles escaped quotes and complex strings', () => {
      const text =
        'err="Post \\"https://webhook.site/test\\": context deadline exceeded" url=\'https://webhook.site\''
      const attrs = parseAttributes(text)

      expect(attrs.err).toBe(
        'Post "https://webhook.site/test": context deadline exceeded',
      )
      expect(attrs.url).toBe('https://webhook.site')
    })

    it('parseAttributes returns empty object for strings without attributes', () => {
      expect(parseAttributes('')).toEqual({})
      expect(parseAttributes('Simple plain text without attributes')).toEqual(
        {},
      )
    })

    it('stripAttributes removes trailing key=value pairs and trims clean message', () => {
      const raw = 'HTTP request completed status=200 latency="12ms"'
      expect(stripAttributes(raw)).toBe('HTTP request completed')

      const noAttrs = 'Server started gracefully'
      expect(stripAttributes(noAttrs)).toBe('Server started gracefully')
    })

    it('parseLogLine handles standard server.log format', () => {
      const line =
        '2026/08/19 11:16:49 INFO Starting mould engine server addr="http://localhost:8090" env="development"'
      const parsed = parseLogLine(line, 0)

      expect(parsed.id).toBe('log-0')
      expect(parsed.lineNumber).toBe(1)
      expect(parsed.timestamp).toBe('2026/08/19 11:16:49')
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Starting mould engine server')
      expect(parsed.attributes).toEqual({
        addr: 'http://localhost:8090',
        env: 'development',
      })
      expect(parsed.raw).toBe(line)
    })

    it('parseLogLine handles JSON formatted lines', () => {
      const jsonLine = JSON.stringify({
        time: '2026-10-17T04:00:00Z',
        level: 'warn',
        msg: 'High memory usage',
        heapUsed: 125000000,
        component: 'gc',
      })
      const parsed = parseLogLine(jsonLine, 3)

      expect(parsed.id).toBe('log-3')
      expect(parsed.lineNumber).toBe(4)
      expect(parsed.timestamp).toBe('2026-10-17T04:00:00Z')
      expect(parsed.level).toBe('warn')
      expect(parsed.message).toBe('High memory usage')
      expect(parsed.attributes).toEqual({
        heapUsed: 125000000,
        component: 'gc',
      })
    })

    it('parseLogLine handles unstructured fallback lines', () => {
      const plain = 'Just an ordinary log notice'
      const parsed = parseLogLine(plain, 10)

      expect(parsed.id).toBe('log-10')
      expect(parsed.lineNumber).toBe(11)
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Just an ordinary log notice')
      expect(parsed.attributes).toBeUndefined()
    })

    it('parseLogLine handles empty lines safely', () => {
      const parsed = parseLogLine('', 0)
      expect(parsed.id).toBe('log-0')
      expect(parsed.message).toBe('')
      expect(parsed.level).toBe('info')
    })

    it('parseLogs parses multiline strings and arrays', () => {
      const rawText = `2026/08/19 11:16:49 INFO First line\n2026/08/19 11:16:50 WARN Second line`
      const logs = parseLogs(rawText)

      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('info')
      expect(logs[1].level).toBe('warn')

      expect(parseLogs(undefined)).toEqual([])
      expect(parseLogs('')).toEqual([])
    })

    it('SERVER_LOG_RAW and SERVER_LOGS verify 17 fixture entries', () => {
      expect(typeof SERVER_LOG_RAW).toBe('string')
      expect(SERVER_LOGS).toHaveLength(17)
      expect(SERVER_LOGS[0].level).toBe('info')
      expect(SERVER_LOGS[0].attributes?.addr).toBe('http://localhost:8090')
      expect(SERVER_LOGS[16].level).toBe('fatal')
    })
  })

  describe('MoulLogsViewer Component', () => {
    it('mounts and renders log items with line numbers, levels, and timestamps', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(17)

      const firstRow = rows?.[0]
      expect(firstRow?.querySelector('.cell-line')?.textContent?.trim()).toBe(
        '1',
      )
      expect(firstRow?.querySelector('.cell-level')?.textContent?.trim()).toBe(
        'info',
      )
      expect(firstRow?.querySelector('.cell-time')?.textContent?.trim()).toBe(
        '2026/08/19 11:16:49',
      )
    })

    it('filters rows by level pill selection', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const errorBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="error"]',
      )
      expect(errorBtn).not.toBeNull()

      errorBtn?.click()
      await awaitUpdates(el)

      expect(el.filterLevel).toBe('error')
      // 3 ERRO + 1 FATA = 4 rows
      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(4)
    })

    it('filters rows by text search query', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      el.searchQuery = 'alex@example.com'
      await awaitUpdates(el)

      const rows = el.shadowRoot?.querySelectorAll('.row')
      // 2 events have email="alex@example.com"
      expect(rows?.length).toBe(2)

      const badge = el.shadowRoot?.querySelector('.counts-badge')
      expect(badge?.textContent?.trim()).toContain('2 / 17 events')
    })

    it('renders empty state when query matches zero logs', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      el.searchQuery = 'nonexistent_pattern_xyz_123'
      await awaitUpdates(el)

      const empty = el.shadowRoot?.querySelector('.empty-state')
      expect(empty).not.toBeNull()
      expect(empty?.textContent).toContain('No logs match your filter criteria')
    })

    it('toggles timestamp visibility', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      expect(el.shadowRoot?.querySelector('.cell-time')).not.toBeNull()

      el.showTimestamps = false
      await awaitUpdates(el)

      expect(el.shadowRoot?.querySelector('.cell-time')).toBeNull()
    })

    it('toggles line wrapping class', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const scrollBox = el.shadowRoot?.querySelector('.scroll-container')
      expect(scrollBox?.classList.contains('no-wrap')).toBe(true)

      el.wrapLines = true
      await awaitUpdates(el)

      expect(scrollBox?.classList.contains('wrap-lines')).toBe(true)
    })

    it('opens the log detail drawer on row click and closes it from the close button', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const drawer = el.shadowRoot?.querySelector<MoulDrawer>('moul-drawer')
      expect(drawer).not.toBeNull()
      expect(drawer?.isOpen).toBe(false)

      const rows = el.shadowRoot?.querySelectorAll<HTMLElement>('.row')
      expect(rows?.[0]).toBeDefined()

      rows?.[0].click()
      await awaitUpdates(el)

      expect(el.isInspectorOpen).toBe(true)
      expect(el.selectedId).toBe('log-0')
      expect(drawer?.isOpen).toBe(true)
      expect(drawer?.textContent).toContain('Log details')
      expect(drawer?.textContent).toContain(SERVER_LOGS[0].message)
      expect(drawer?.textContent).toContain('addr')
      expect(drawer?.textContent).toContain('http://localhost:8090')

      const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.inspector-close-btn',
      )
      closeBtn?.click()
      await awaitUpdates(el)

      expect(el.isInspectorOpen).toBe(false)
      expect(el.selectedId).toBeNull()
      expect(drawer?.isOpen).toBe(false)
    })

    it('opening another row swaps the drawer content', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )
      const rows = el.shadowRoot?.querySelectorAll<HTMLElement>('.row')

      rows?.[0].click()
      await awaitUpdates(el)
      rows?.[2].click()
      await awaitUpdates(el)

      const drawer = el.shadowRoot?.querySelector<MoulDrawer>('moul-drawer')
      expect(el.selectedId).toBe(SERVER_LOGS[2].id)
      expect(drawer?.isOpen).toBe(true)
      expect(drawer?.textContent).toContain(SERVER_LOGS[2].message)
      expect(drawer?.textContent).not.toContain(SERVER_LOGS[0].message)
    })

    it('closes the drawer on Escape without leaking openchange out of the viewer', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )
      const openChangeSpy = vi.fn()
      el.addEventListener('openchange', openChangeSpy)

      el.shadowRoot?.querySelector<HTMLElement>('.row')?.click()
      await awaitUpdates(el)

      const drawer = el.shadowRoot?.querySelector<MoulDrawer>('moul-drawer')
      drawer?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitUpdates(el)

      expect(drawer?.isOpen).toBe(false)
      expect(el.isInspectorOpen).toBe(false)
      expect(el.selectedId).toBeNull()
      expect(openChangeSpy).not.toHaveBeenCalled()
    })

    it('dispatches filterlevelchange and filterchange events on level change', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      let levelEventDetail: { filterLevel: LogFilterLevel } | null = null
      el.addEventListener('filterlevelchange', (e: Event) => {
        levelEventDetail = (e as CustomEvent).detail
      })

      const warnBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.filter-pill[data-level="warn"]',
      )
      warnBtn?.click()
      await awaitUpdates(el)

      expect(levelEventDetail).toEqual({ filterLevel: 'warn' })
    })

    it('supports keyboard row selection via Enter and Space keys', async () => {
      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${SERVER_LOGS}></moul-logs-viewer>`,
      )

      const firstRow = el.shadowRoot?.querySelector<HTMLElement>('.row')
      expect(firstRow).not.toBeNull()
      expect(firstRow?.getAttribute('tabindex')).toBe('0')

      firstRow?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitUpdates(el)

      expect(el.selectedId).toBe(SERVER_LOGS[0].id)
      expect(el.isInspectorOpen).toBe(true)

      // Close inspector
      el.isInspectorOpen = false
      el.selectedId = null
      await awaitUpdates(el)

      const secondRow = el.shadowRoot?.querySelectorAll<HTMLElement>('.row')[1]
      secondRow?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitUpdates(el)

      expect(el.selectedId).toBe(SERVER_LOGS[1].id)
      expect(el.isInspectorOpen).toBe(true)
    })

    it('activates virtualization and updates layout when container dimensions are established with >50 items', async () => {
      const manyLogs = Array.from({ length: 80 }, (_, i) => ({
        id: `item-${i}`,
        lineNumber: i + 1,
        message: `Log line message ${i}`,
        level: 'info' as const,
      }))

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${manyLogs}></moul-logs-viewer>`,
      )

      const scrollContainer = el.shadowRoot?.querySelector('.scroll-container')
      expect(scrollContainer).not.toBeNull()

      triggerResize(scrollContainer!, { width: 800, height: 600 })
      await awaitUpdates(el)

      expect(el.virtualized).toBe(true)
      const table = el.shadowRoot?.querySelector('.logs-table')
      expect(table).not.toBeNull()
    })
  })

  describe('MoulLogs Companion Component', () => {
    it('mounts with raw string property and parses logs into viewer', async () => {
      const el = await mount<MoulLogs>(
        html`<moul-logs .raw=${SERVER_LOG_RAW}></moul-logs>`,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitUpdates(viewer!)

      const rows = viewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(17)
    })

    it('forwards filterLevel and searchQuery to inner viewer', async () => {
      const el = await mount<MoulLogs>(
        html`
          <moul-logs
            .raw=${SERVER_LOG_RAW}
            filter-level="error"
            search-query="webhook"
          ></moul-logs>
        `,
      )

      const viewer =
        el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(viewer).not.toBeNull()
      await awaitUpdates(viewer!)

      expect(viewer?.filterLevel).toBe('error')
      expect(viewer?.searchQuery).toBe('webhook')

      const rows = viewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
    })
  })

  describe('Idempotent Registration', () => {
    it('registers custom elements without throwing on duplicate calls', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      defineElement('moul-logs-viewer', MoulLogsViewer)
      defineElement('moul-logs', MoulLogs)

      expect(warnSpy).toHaveBeenCalled()
    })
  })
})
