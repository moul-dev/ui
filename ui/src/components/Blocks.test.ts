import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineElement } from '../utils/define-element'
import {
  type LogItem,
  Logs,
  LogsViewer,
  MoulLogs,
  MoulLogsViewer,
  normalizeLogLevel,
  parseAttributes,
  parseLogLine,
  parseLogs,
  SERVER_LOG_RAW,
  SERVER_LOGS,
  stripAttributes,
} from './LogsViewer'
import {
  MoulSidebar,
  MoulSidebarAside,
  MoulSidebarBrand,
  MoulSidebarDivider,
  MoulSidebarFooter,
  MoulSidebarGroup,
  MoulSidebarHeader,
  MoulSidebarItem,
  MoulSidebarMain,
  MoulSidebarUser,
  Sidebar,
  SidebarAside,
  SidebarBrand,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  SidebarUser,
  sidebarContext,
  useSidebar,
} from './Sidebar'

// Helper to await all pending Lit updates in the DOM tree
async function awaitTreeUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const descendants = Array.from(root.querySelectorAll('*'))
  for (const el of descendants) {
    if ('updateComplete' in el && (el as LitElement).updateComplete) {
      await (el as LitElement).updateComplete
    }
    const shadowDescendants = Array.from(
      el.shadowRoot?.querySelectorAll('*') ?? [],
    )
    for (const s of shadowDescendants) {
      if ('updateComplete' in s && (s as LitElement).updateComplete) {
        await (s as LitElement).updateComplete
      }
    }
  }
}

// Helper to mount templates into document.body
async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitTreeUpdates(element)
  return element
}

describe('Composite Block Components Suite (`ui/src/components/Blocks.test.ts`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Idempotent Registration & Class Identity (Dimension 6)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 6: Idempotent Registration & Custom Element Contracts', () => {
    const ALL_12_BLOCK_TAGS = [
      'moul-logs',
      'moul-logs-viewer',
      'moul-sidebar',
      'moul-sidebar-aside',
      'moul-sidebar-main',
      'moul-sidebar-header',
      'moul-sidebar-brand',
      'moul-sidebar-group',
      'moul-sidebar-item',
      'moul-sidebar-divider',
      'moul-sidebar-footer',
      'moul-sidebar-user',
    ] as const

    it('BLK-REG-01: registers all 12 composite block custom elements', () => {
      for (const tag of ALL_12_BLOCK_TAGS) {
        const ctor = customElements.get(tag)
        expect(ctor).toBeDefined()
        expect(typeof ctor).toBe('function')
      }
    })

    it('BLK-REG-02: exports canonical and Moul* prefixed alias pairs identically', () => {
      expect(MoulLogs).toBe(Logs)
      expect(MoulLogsViewer).toBe(LogsViewer)
      expect(MoulSidebar).toBe(Sidebar)
      expect(MoulSidebarAside).toBe(SidebarAside)
      expect(MoulSidebarMain).toBe(SidebarMain)
      expect(MoulSidebarHeader).toBe(SidebarHeader)
      expect(MoulSidebarBrand).toBe(SidebarBrand)
      expect(MoulSidebarGroup).toBe(SidebarGroup)
      expect(MoulSidebarItem).toBe(SidebarItem)
      expect(MoulSidebarDivider).toBe(SidebarDivider)
      expect(MoulSidebarFooter).toBe(SidebarFooter)
      expect(MoulSidebarUser).toBe(SidebarUser)
      expect(sidebarContext).toBeDefined()
      expect(useSidebar()).toBeUndefined()
    })

    it('BLK-REG-03: supports idempotent defineElement() re-registration without throwing or collision', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      defineElement('moul-logs', MoulLogs)
      defineElement('moul-logs-viewer', MoulLogsViewer)
      defineElement('moul-sidebar', MoulSidebar)
      defineElement('moul-sidebar-aside', MoulSidebarAside)
      defineElement('moul-sidebar-main', MoulSidebarMain)
      defineElement('moul-sidebar-header', MoulSidebarHeader)
      defineElement('moul-sidebar-brand', MoulSidebarBrand)
      defineElement('moul-sidebar-group', MoulSidebarGroup)
      defineElement('moul-sidebar-item', MoulSidebarItem)
      defineElement('moul-sidebar-divider', MoulSidebarDivider)
      defineElement('moul-sidebar-footer', MoulSidebarFooter)
      defineElement('moul-sidebar-user', MoulSidebarUser)

      expect(warnSpy).toHaveBeenCalledTimes(12)
      for (const tag of ALL_12_BLOCK_TAGS) {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `Custom element "${tag}" is already registered.`,
          ),
        )
      }
      warnSpy.mockRestore()
    })

    it('BLK-REG-04: creates valid instances via document.createElement()', () => {
      const logs = document.createElement('moul-logs')
      expect(logs).toBeInstanceOf(MoulLogs)
      expect(logs.tagName.toLowerCase()).toBe('moul-logs')

      const viewer = document.createElement('moul-logs-viewer')
      expect(viewer).toBeInstanceOf(MoulLogsViewer)
      expect(viewer.tagName.toLowerCase()).toBe('moul-logs-viewer')

      const sidebar = document.createElement('moul-sidebar')
      expect(sidebar).toBeInstanceOf(MoulSidebar)
      expect(sidebar.tagName.toLowerCase()).toBe('moul-sidebar')

      const item = document.createElement('moul-sidebar-item')
      expect(item).toBeInstanceOf(MoulSidebarItem)
      expect(item.tagName.toLowerCase()).toBe('moul-sidebar-item')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Pure Log Parsing Edge Cases & Robustness (Dimension 1)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 1: Pure Log Parser Utilities Edge Cases', () => {
    it('BLK-PRS-01: normalizeLogLevel handles standard, abbreviated, bracketed, and uppercase levels', () => {
      expect(normalizeLogLevel('INFO')).toBe('info')
      expect(normalizeLogLevel('info')).toBe('info')
      expect(normalizeLogLevel('inf')).toBe('info')
      expect(normalizeLogLevel('DEBU')).toBe('debug')
      expect(normalizeLogLevel('debug')).toBe('debug')
      expect(normalizeLogLevel('WARN')).toBe('warn')
      expect(normalizeLogLevel('warning')).toBe('warn')
      expect(normalizeLogLevel('ERRO')).toBe('error')
      expect(normalizeLogLevel('error')).toBe('error')
      expect(normalizeLogLevel('err')).toBe('error')
      expect(normalizeLogLevel('FATAL')).toBe('fatal')
      expect(normalizeLogLevel('fatal')).toBe('fatal')
      expect(normalizeLogLevel('panic')).toBe('fatal')
      expect(normalizeLogLevel('crit')).toBe('fatal')
      expect(normalizeLogLevel('critical')).toBe('fatal')
      expect(normalizeLogLevel('TRACE')).toBe('trace')
      expect(normalizeLogLevel('trac')).toBe('trace')
      expect(normalizeLogLevel('[WARN]')).toBe('warn')
      expect(normalizeLogLevel('[ERROR]')).toBe('error')
      expect(normalizeLogLevel('')).toBe('info')
      expect(normalizeLogLevel(undefined)).toBe('info')
      expect(normalizeLogLevel('unknown_xyz')).toBe('info')
    })

    it('BLK-PRS-02: normalizeLogLevel handles Pino and Bunyan numeric log levels', () => {
      expect(normalizeLogLevel(10)).toBe('trace')
      expect(normalizeLogLevel(20)).toBe('debug')
      expect(normalizeLogLevel(30)).toBe('info')
      expect(normalizeLogLevel(40)).toBe('warn')
      expect(normalizeLogLevel(50)).toBe('error')
      expect(normalizeLogLevel(60)).toBe('fatal')
      expect(normalizeLogLevel(99)).toBe('info')
      expect(normalizeLogLevel(-1)).toBe('info')
      expect(normalizeLogLevel(0)).toBe('info')
    })

    it('BLK-PRS-03: normalizeLogLevel protects against prototype collisions and pollution', () => {
      const protoKeys = [
        'constructor',
        'toString',
        'valueOf',
        '__proto__',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
      ]
      for (const key of protoKeys) {
        const result = normalizeLogLevel(key)
        expect(typeof result).toBe('string')
        expect(result).toBe('info')
      }
    })

    it('BLK-PRS-04: parseAttributes parses double-quoted, single-quoted, and unquoted typed values', () => {
      const raw =
        'ip="192.168.1.1" port=8080 active=true dryRun=false retries=3 duration="42.5ms" empty="" single=\'val\' nullable=null'
      const attrs = parseAttributes(raw)

      expect(attrs.ip).toBe('192.168.1.1')
      expect(attrs.port).toBe(8080)
      expect(attrs.active).toBe(true)
      expect(attrs.dryRun).toBe(false)
      expect(attrs.retries).toBe(3)
      expect(attrs.duration).toBe('42.5ms')
      expect(attrs.empty).toBe('')
      expect(attrs.single).toBe('val')
      expect(attrs.nullable).toBe(null)
    })

    it('BLK-PRS-05: parseAttributes handles escaped quotes and complex JSON-like text', () => {
      const raw =
        'query="SELECT * FROM users WHERE status=\\"active\\"" err=\'connection \\\'timeout\\\'\''
      const attrs = parseAttributes(raw)

      expect(attrs.query).toBe('SELECT * FROM users WHERE status="active"')
      expect(attrs.err).toBe("connection 'timeout'")
    })

    it('BLK-PRS-06: parseAttributes guards against prototype mutation on result container', () => {
      const raw =
        '__proto__="polluted" constructor="hacked" toString="hijacked" regular=123'
      const attrs = parseAttributes(raw)

      expect(attrs.regular).toBe(123)
      expect(Object.hasOwn(attrs, '__proto__')).toBe(true)
      expect(({} as any).polluted).toBeUndefined()
    })

    it('BLK-PRS-07: ReDoS resilience benchmark parses 50,000-character line in < 50ms', () => {
      const massiveNoise = 'X'.repeat(50000)
      const line = `2026-10-17 12:00:00 INFO ${massiveNoise} request_id="req-999" status=200`

      const start = performance.now()
      const parsed = parseLogLine(line, 1)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(parsed.level).toBe('info')
      expect(parsed.attributes?.request_id).toBe('req-999')
      expect(parsed.attributes?.status).toBe(200)
    })

    it('BLK-PRS-08: stripAttributes cleans attribute pairs and preserves core message', () => {
      const text =
        'Worker dispatched task payload successfully cluster="us-east-1" job_id=4592 status="healthy"'
      const stripped = stripAttributes(text)

      expect(stripped).toBe('Worker dispatched task payload successfully')
      expect(stripped).not.toContain('cluster=')
      expect(stripped).not.toContain('job_id=')
    })

    it('BLK-PRS-09: parseLogLine extracts ISO8601, RFC3339 timestamps and log levels', () => {
      const l1 = parseLogLine(
        '2026-10-17T08:30:15.123Z [ERROR] Failed to connect to Redis host="10.0.0.1"',
        42,
      )
      expect(l1.id).toBe('log-42')
      expect(l1.lineNumber).toBe(43)
      expect(l1.timestamp).toBe('2026-10-17T08:30:15.123Z')
      expect(l1.level).toBe('error')
      expect(l1.message).toBe('Failed to connect to Redis')
      expect(l1.attributes?.host).toBe('10.0.0.1')

      const l2 = parseLogLine(
        '2026-10-17 12:15:00 WARN Disk space running low threshold=90%',
        1,
      )
      expect(l2.timestamp).toBe('2026-10-17 12:15:00')
      expect(l2.level).toBe('warn')
      expect(l2.message).toBe('Disk space running low')
      expect(l2.attributes?.threshold).toBe('90%')
    })

    it('BLK-PRS-10: parseLogs processes multiline strings with LF and CRLF and sparse arrays', () => {
      const multiline =
        '2026-10-17 10:00:00 INFO First message\r\n2026-10-17 10:00:01 WARN Second message\n2026-10-17 10:00:02 ERROR Third message'
      const parsed = parseLogs(multiline)

      expect(parsed).toHaveLength(3)
      expect(parsed[0].level).toBe('info')
      expect(parsed[1].level).toBe('warn')
      expect(parsed[2].level).toBe('error')

      // Sparse array resilience
      const sparse = [
        '2026-10-17 10:00:00 INFO Line 1',
        null as any,
        undefined as any,
        '2026-10-17 10:00:01 ERROR Line 2',
      ]
      const parsedSparse = parseLogs(sparse)
      expect(parsedSparse).toHaveLength(2)
      expect(parsedSparse[0].level).toBe('info')
      expect(parsedSparse[1].level).toBe('error')
    })

    it('BLK-PRS-11: SERVER_LOG_RAW and SERVER_LOGS fixtures are valid and match', () => {
      expect(typeof SERVER_LOG_RAW).toBe('string')
      expect(SERVER_LOG_RAW.length).toBeGreaterThan(100)
      expect(Array.isArray(SERVER_LOGS)).toBe(true)
      expect(SERVER_LOGS.length).toBeGreaterThan(0)
      expect(SERVER_LOGS[0]).toHaveProperty('id')
      expect(SERVER_LOGS[0]).toHaveProperty('level')
      expect(SERVER_LOGS[0]).toHaveProperty('message')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. moul-logs-viewer & moul-logs Rendering & Interactions (Dimension 2)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 2: LogsViewer & Logs Component Rendering & Controls', () => {
    const testLogs: LogItem[] = [
      {
        id: '1',
        lineNumber: 1,
        timestamp: '2026-10-17 11:00:00',
        level: 'info',
        message: 'Application starting up',
        attributes: { env: 'production', v: '2.0.0' },
      },
      {
        id: '2',
        lineNumber: 2,
        timestamp: '2026-10-17 11:00:01',
        level: 'warn',
        message: 'High latency detected in upstream',
        attributes: { latency: '450ms', endpoint: '/api/v1/checkout' },
      },
      {
        id: '3',
        lineNumber: 3,
        timestamp: '2026-10-17 11:00:02',
        level: 'error',
        message: 'Failed to process payment for user',
        attributes: { uid: 'usr_8892', code: 'CARD_DECLINED' },
      },
      {
        id: '4',
        lineNumber: 4,
        timestamp: '2026-10-17 11:00:03',
        level: 'debug',
        message: 'Cache hit on session token store',
        attributes: { hit: true, key: 'sess_123' },
      },
    ]

    it('BLK-VWR-01: renders log rows with timestamp, level badge, line number, and message', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
      )

      expect(viewer).toBeDefined()
      const rows = viewer.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(4)

      const firstRow = rows?.[0]
      expect(firstRow?.querySelector('.cell-line')?.textContent?.trim()).toBe(
        '1',
      )
      expect(firstRow?.querySelector('.cell-time')?.textContent?.trim()).toBe(
        '2026-10-17 11:00:00',
      )
      expect(firstRow?.querySelector('.cell-level')?.textContent?.trim()).toBe(
        'info',
      )
      expect(
        firstRow?.querySelector('.cell-message')?.textContent?.trim(),
      ).toContain('Application starting up')
      expect(firstRow?.querySelector('.cell-message')?.textContent).toContain(
        'env=',
      )
      expect(firstRow?.querySelector('.cell-message')?.textContent).toContain(
        'production',
      )
    })

    it('BLK-VWR-02: filters rows reactively when filterLevel changes', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs} .filterLevel=${'error'}></moul-logs-viewer>`,
      )

      let rows = viewer.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
      expect(
        rows?.[0].querySelector('.cell-message')?.textContent?.trim(),
      ).toContain('Failed to process payment')

      viewer.filterLevel = 'warn'
      await awaitTreeUpdates(viewer)
      rows = viewer.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)
      expect(
        rows?.[0].querySelector('.cell-message')?.textContent?.trim(),
      ).toContain('High latency detected')

      viewer.filterLevel = 'all'
      await awaitTreeUpdates(viewer)
      rows = viewer.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(4)
    })

    it('BLK-VWR-03: filters and highlights search query tokens in messages', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs} .searchQuery=${'payment'}></moul-logs-viewer>`,
      )

      const rows = viewer.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(1)

      const mark = rows?.[0].querySelector('mark')
      expect(mark).toBeDefined()
      expect(mark?.textContent?.toLowerCase()).toBe('payment')
    })

    it('BLK-VWR-04: toggles timestamp column display via showTimestamps property', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs} .showTimestamps=${false}></moul-logs-viewer>`,
      )

      let times = viewer.shadowRoot?.querySelectorAll('.cell-time')
      expect(times?.length).toBe(0)

      viewer.showTimestamps = true
      await awaitTreeUpdates(viewer)
      times = viewer.shadowRoot?.querySelectorAll('.cell-time')
      expect(times?.length).toBe(4)
    })

    it('BLK-VWR-05: toggles line wrapping via wrapLines property', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs} .wrapLines=${true}></moul-logs-viewer>`,
      )

      const scrollContainer =
        viewer.shadowRoot?.querySelector('.scroll-container')
      expect(scrollContainer?.classList.contains('wrap-lines')).toBe(true)

      viewer.wrapLines = false
      await awaitTreeUpdates(viewer)
      expect(scrollContainer?.classList.contains('wrap-lines')).toBe(false)
    })

    it('BLK-VWR-06: row click opens inspector drawer and dispatches logselect event', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
      )

      const selectSpy = vi.fn()
      viewer.addEventListener('logselect', selectSpy)

      const secondRow =
        viewer.shadowRoot?.querySelectorAll<HTMLElement>('.row')[1]
      secondRow?.click()
      await awaitTreeUpdates(viewer)

      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(selectSpy.mock.calls[0][0].detail.log.id).toBe('2')
      expect(viewer.isInspectorOpen).toBe(true)
      expect(viewer.selectedId).toBe('2')

      const inspector = viewer.shadowRoot?.querySelector('.inspector-body')
      expect(inspector).not.toBeNull()
      expect(inspector?.textContent).toContain('endpoint')
      expect(inspector?.textContent).toContain('/api/v1/checkout')
    })

    it('BLK-VWR-07: row keyboard activation (Enter) opens inspector drawer', async () => {
      const viewer = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
      )

      const thirdRow =
        viewer.shadowRoot?.querySelectorAll<HTMLElement>('.row')[2]
      thirdRow?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitTreeUpdates(viewer)

      expect(viewer.isInspectorOpen).toBe(true)
      expect(viewer.selectedId).toBe('3')
    })

    it('BLK-LOG-01: moul-logs parses raw string property and passes items to moul-logs-viewer', async () => {
      const rawText = `2026-10-17 12:00:00 INFO Server boot complete host="0.0.0.0" port=9000
2026-10-17 12:00:01 ERROR Unhandled database rejection db="postgres"`

      const logsEl = await mount<MoulLogs>(
        html`<moul-logs .raw=${rawText}></moul-logs>`,
      )

      expect(logsEl).toBeInstanceOf(MoulLogs)
      expect(logsEl.parsedLogs).toHaveLength(2)

      const innerViewer =
        logsEl.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      expect(innerViewer).toBeDefined()
      await awaitTreeUpdates(innerViewer!)

      const rows = innerViewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(2)
      expect(
        rows?.[0].querySelector('.cell-message')?.textContent?.trim(),
      ).toContain('Server boot complete')
    })

    it('BLK-LOG-02: moul-logs parses slotted multiline text content', async () => {
      const logsEl = await mount<MoulLogs>(
        html`<moul-logs>
2026-10-17 13:00:00 WARN Slotted message item=apple count=5
2026-10-17 13:00:01 INFO Slotted message item=banana count=10
        </moul-logs>`,
      )

      expect(logsEl.parsedLogs.length).toBeGreaterThanOrEqual(2)
      const innerViewer =
        logsEl.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
      await awaitTreeUpdates(innerViewer!)
      const rows = innerViewer?.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. moul-sidebar Context Propagation (Dimension 3)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 3: Sidebar Context Distribution via @lit/context', () => {
    it('BLK-CTX-01: distributes default context to all 9 child elements', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar>
            <moul-sidebar-aside>
              <moul-sidebar-header>
                <moul-sidebar-brand title="TestBrand"></moul-sidebar-brand>
              </moul-sidebar-header>
              <moul-sidebar-group label="Navigation">
                <moul-sidebar-item key="dash" label="Dashboard"></moul-sidebar-item>
              </moul-sidebar-group>
              <moul-sidebar-divider></moul-sidebar-divider>
              <moul-sidebar-footer>
                <moul-sidebar-user name="Alex Smith"></moul-sidebar-user>
              </moul-sidebar-footer>
            </moul-sidebar-aside>
            <moul-sidebar-main>
              <p>Main content</p>
            </moul-sidebar-main>
          </moul-sidebar>
        `,
      )

      const aside = sidebar.querySelector(
        'moul-sidebar-aside',
      ) as MoulSidebarAside
      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      const user = sidebar.querySelector('moul-sidebar-user') as MoulSidebarUser
      const header = sidebar.querySelector(
        'moul-sidebar-header',
      ) as MoulSidebarHeader
      const group = sidebar.querySelector(
        'moul-sidebar-group',
      ) as MoulSidebarGroup

      expect(aside.collapsed).toBe(false)
      expect(aside.dense).toBe(false)
      expect(aside.layout).toBe('sidebar-framed')
      expect(item.collapsed).toBe(false)
      expect(item.dense).toBe(false)
      expect(user.collapsed).toBe(false)
      expect(user.dense).toBe(false)
      expect(header.collapsed).toBe(false)
      expect(header.dense).toBe(false)
      expect(group.collapsed).toBe(false)
      expect(group.dense).toBe(false)
    })

    it('BLK-CTX-02: toggling collapsed on moul-sidebar reactively propagates to all descendants', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .collapsed=${false}>
            <moul-sidebar-aside>
              <moul-sidebar-brand title="Brand"></moul-sidebar-brand>
              <moul-sidebar-group label="Menu">
                <moul-sidebar-item key="home" label="Home"></moul-sidebar-item>
              </moul-sidebar-group>
              <moul-sidebar-user name="User Name"></moul-sidebar-user>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const aside = sidebar.querySelector(
        'moul-sidebar-aside',
      ) as MoulSidebarAside
      const brand = sidebar.querySelector(
        'moul-sidebar-brand',
      ) as MoulSidebarBrand
      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      const user = sidebar.querySelector('moul-sidebar-user') as MoulSidebarUser

      expect(aside.collapsed).toBe(false)
      expect(brand.collapsed).toBe(false)
      expect(item.collapsed).toBe(false)
      expect(user.collapsed).toBe(false)

      sidebar.collapsed = true
      await awaitTreeUpdates(sidebar)

      expect(aside.collapsed).toBe(true)
      expect(brand.collapsed).toBe(true)
      expect(item.collapsed).toBe(true)
      expect(user.collapsed).toBe(true)
    })

    it('BLK-CTX-03: toggling dense on moul-sidebar propagates dense to child components', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .dense=${false}>
            <moul-sidebar-aside>
              <moul-sidebar-group label="Section">
                <moul-sidebar-item key="docs" label="Docs"></moul-sidebar-item>
              </moul-sidebar-group>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const aside = sidebar.querySelector(
        'moul-sidebar-aside',
      ) as MoulSidebarAside
      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem

      expect(aside.dense).toBe(false)
      expect(item.dense).toBe(false)

      sidebar.dense = true
      await awaitTreeUpdates(sidebar)

      expect(aside.dense).toBe(true)
      expect(item.dense).toBe(true)
    })

    it('BLK-CTX-04: toggling layout updates aside and main components', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .layout=${'sidebar-framed'}>
            <moul-sidebar-aside></moul-sidebar-aside>
            <moul-sidebar-main></moul-sidebar-main>
          </moul-sidebar>
        `,
      )

      const aside = sidebar.querySelector(
        'moul-sidebar-aside',
      ) as MoulSidebarAside
      const main = sidebar.querySelector('moul-sidebar-main') as MoulSidebarMain

      expect(aside.layout).toBe('sidebar-framed')
      expect(main.layout).toBe('sidebar-framed')

      sidebar.layout = 'main-framed'
      await awaitTreeUpdates(sidebar)

      expect(aside.layout).toBe('main-framed')
      expect(main.layout).toBe('main-framed')
    })

    it('BLK-CTX-05: changing selectedKey on moul-sidebar activates matching item', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .selectedKey=${'first'}>
            <moul-sidebar-aside>
              <moul-sidebar-item key="first" label="First"></moul-sidebar-item>
              <moul-sidebar-item key="second" label="Second"></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item1 = sidebar.querySelector(
        'moul-sidebar-item[key="first"]',
      ) as MoulSidebarItem
      const item2 = sidebar.querySelector(
        'moul-sidebar-item[key="second"]',
      ) as MoulSidebarItem

      expect(item1.isSelected).toBe(true)
      expect(item2.isSelected).toBe(false)

      sidebar.selectedKey = 'second'
      await awaitTreeUpdates(sidebar)

      expect(item1.isSelected).toBe(false)
      expect(item2.isSelected).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. moul-sidebar-group Collapse & Pure CSS Grid (Dimension 4)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 4: SidebarGroup Collapse State & Pure CSS Grid Structure', () => {
    it('BLK-GRP-01: renders group header button with aria-expanded attribute', async () => {
      const group = await mount<MoulSidebarGroup>(
        html`
          <moul-sidebar-group label="Settings" .collapsible=${true} .collapsed=${false}>
            <moul-sidebar-item key="acc" label="Account"></moul-sidebar-item>
          </moul-sidebar-group>
        `,
      )

      const header = group.shadowRoot?.querySelector<HTMLButtonElement>(
        '[part="group-header"]',
      )
      expect(header).toBeDefined()
      expect(header?.getAttribute('aria-expanded')).toBe('true')
      expect(header?.querySelector('.group-title')?.textContent?.trim()).toBe(
        'Settings',
      )
      expect(header?.querySelector('svg.chevron')).toBeDefined()
    })

    it('BLK-GRP-02: toggling collapsed property inverts aria-expanded', async () => {
      const group = await mount<MoulSidebarGroup>(
        html`
          <moul-sidebar-group label="Section" .collapsible=${true} .collapsed=${false}>
            <moul-sidebar-item key="1" label="One"></moul-sidebar-item>
          </moul-sidebar-group>
        `,
      )

      const header = group.shadowRoot?.querySelector('[part="group-header"]')
      expect(header?.getAttribute('aria-expanded')).toBe('true')

      group.collapsed = true
      await awaitTreeUpdates(group)
      expect(header?.getAttribute('aria-expanded')).toBe('false')
    })

    it('BLK-GRP-03: clicking group header toggles collapsed state and dispatches collapse event', async () => {
      const group = await mount<MoulSidebarGroup>(
        html`
          <moul-sidebar-group label="Files" .collapsible=${true} .collapsed=${false}>
            <moul-sidebar-item key="f1" label="File 1"></moul-sidebar-item>
          </moul-sidebar-group>
        `,
      )

      const collapseSpy = vi.fn()
      group.addEventListener('collapsechange', collapseSpy)

      const header = group.shadowRoot?.querySelector<HTMLButtonElement>(
        '[part="group-header"]',
      )
      header?.click()
      await awaitTreeUpdates(group)

      expect(group.collapsed).toBe(true)
      expect(collapseSpy).toHaveBeenCalledTimes(1)
      expect(collapseSpy.mock.calls[0][0].detail.collapsed).toBe(true)

      // Click again to reopen
      header?.click()
      await awaitTreeUpdates(group)
      expect(group.collapsed).toBe(false)
      expect(collapseSpy).toHaveBeenCalledTimes(2)
      expect(collapseSpy.mock.calls[1][0].detail.collapsed).toBe(false)
    })

    it('BLK-GRP-04: keyboard Enter/Space on group header toggles collapse state', async () => {
      const group = await mount<MoulSidebarGroup>(
        html`
          <moul-sidebar-group label="Keyboard" .collapsible=${true} .collapsed=${false}>
            <moul-sidebar-item key="k1" label="Item 1"></moul-sidebar-item>
          </moul-sidebar-group>
        `,
      )

      const header = group.shadowRoot?.querySelector<HTMLButtonElement>(
        '[part="group-header"]',
      )
      header?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitTreeUpdates(group)
      expect(group.collapsed).toBe(true)

      header?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitTreeUpdates(group)
      expect(group.collapsed).toBe(false)
    })

    it('BLK-GRP-05: verifies pure CSS grid structure without JS runtime height measurements', async () => {
      const group = await mount<MoulSidebarGroup>(
        html`
          <moul-sidebar-group label="CSS Grid Test" .collapsible=${true} .collapsed=${false}>
            <moul-sidebar-item key="item" label="Child Item"></moul-sidebar-item>
          </moul-sidebar-group>
        `,
      )

      const itemsWrapper = group.shadowRoot?.querySelector('.group-items')
      const innerWrapper = group.shadowRoot?.querySelector('.group-items-inner')

      expect(itemsWrapper).toBeDefined()
      expect(innerWrapper).toBeDefined()
      expect(itemsWrapper?.classList.contains('expanded')).toBe(true)
      expect(itemsWrapper?.classList.contains('collapsed')).toBe(false)

      group.collapsed = true
      await awaitTreeUpdates(group)

      expect(itemsWrapper?.classList.contains('collapsed')).toBe(true)
      expect(itemsWrapper?.classList.contains('expanded')).toBe(false)

      // Confirm styles define CSS grid transitions without runtime inline style overrides
      expect(itemsWrapper?.getAttribute('style')).toBeNull()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. moul-sidebar-item Selection, Active Indicator & Tooltips (Dimension 5)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 5: SidebarItem Selection, Active Pill & Collapsed Tooltips', () => {
    it('BLK-ITM-01: clicking unselected item dispatches selectionchange event on item and sidebar', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar>
            <moul-sidebar-aside>
              <moul-sidebar-item key="analytics" label="Analytics"></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      const sidebarSpy = vi.fn()
      const itemSpy = vi.fn()

      sidebar.addEventListener('selectionchange', sidebarSpy)
      item.addEventListener('selectionchange', itemSpy)

      const button = item.shadowRoot?.querySelector<HTMLButtonElement>('.item')
      button?.click()
      await awaitTreeUpdates(sidebar)

      expect(itemSpy).toHaveBeenCalledTimes(1)
      expect(itemSpy.mock.calls[0][0].detail.selectedKey).toBe('analytics')
      expect(sidebarSpy).toHaveBeenCalledTimes(1)
      expect(sidebarSpy.mock.calls[0][0].detail.selectedKey).toBe('analytics')
      expect(sidebar.selectedKey).toBe('analytics')
      expect(item.isSelected).toBe(true)
    })

    it('BLK-ITM-02: keyboard Enter or Space activates selection', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar>
            <moul-sidebar-aside>
              <moul-sidebar-item key="reports" label="Reports"></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      const selectSpy = vi.fn()
      sidebar.addEventListener('selectionchange', selectSpy)

      const button = item.shadowRoot?.querySelector<HTMLButtonElement>('.item')
      button?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitTreeUpdates(sidebar)

      expect(selectSpy).toHaveBeenCalledTimes(1)
      expect(sidebar.selectedKey).toBe('reports')
      expect(item.isSelected).toBe(true)
    })

    it('BLK-ITM-03: disabled item suppresses selection events and has aria-disabled', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar>
            <moul-sidebar-aside>
              <moul-sidebar-item key="disabled-key" label="Locked" .isDisabled=${true}></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      const selectSpy = vi.fn()
      sidebar.addEventListener('selectionchange', selectSpy)

      const button = item.shadowRoot?.querySelector<HTMLButtonElement>('.item')
      expect(button?.hasAttribute('disabled')).toBe(true)

      button?.click()
      await awaitTreeUpdates(sidebar)

      expect(selectSpy).not.toHaveBeenCalled()
      expect(item.isSelected).toBe(false)
    })

    it('BLK-ITM-04: selected item renders active pill indicator in shadow DOM', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .selectedKey=${'active-one'}>
            <moul-sidebar-aside>
              <moul-sidebar-item key="active-one" label="Active One"></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      expect(item.isSelected).toBe(true)

      const trigger = item.shadowRoot?.querySelector('.item')
      expect(trigger?.classList.contains('item')).toBe(true)

      const indicator = item.shadowRoot?.querySelector('[part="indicator"]')
      expect(indicator).toBeDefined()
    })

    it('BLK-ITM-05: wraps trigger in moul-tooltip when collapsed to icon-only mode', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .collapsed=${false}>
            <moul-sidebar-aside>
              <moul-sidebar-item key="overview" label="Overview"></moul-sidebar-item>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const item = sidebar.querySelector('moul-sidebar-item') as MoulSidebarItem
      let tooltip = item.shadowRoot?.querySelector('moul-tooltip')
      expect(tooltip).toBeNull()

      sidebar.collapsed = true
      await awaitTreeUpdates(sidebar)

      tooltip = item.shadowRoot?.querySelector('moul-tooltip')
      expect(tooltip).toBeDefined()
      expect(tooltip?.getAttribute('content')).toBe('Overview')
      expect(tooltip?.getAttribute('placement')).toBe('right')
    })

    it('BLK-ITM-06: moul-sidebar-user wraps avatar in moul-tooltip when collapsed', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .collapsed=${false}>
            <moul-sidebar-aside>
              <moul-sidebar-user name="Jane Doe" email="jane@example.com"></moul-sidebar-user>
            </moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const user = sidebar.querySelector('moul-sidebar-user') as MoulSidebarUser
      let tooltip = user.shadowRoot?.querySelector('moul-tooltip')
      expect(tooltip).toBeNull()

      sidebar.collapsed = true
      await awaitTreeUpdates(sidebar)

      tooltip = user.shadowRoot?.querySelector('moul-tooltip')
      expect(tooltip).toBeDefined()
      expect(tooltip?.getAttribute('content')).toBe(
        'Jane Doe • jane@example.com',
      )
      expect(tooltip?.getAttribute('placement')).toBe('right')
    })

    it('BLK-ITM-07: collapse toggle button on aside invokes toggleCollapse on parent sidebar', async () => {
      const sidebar = await mount<MoulSidebar>(
        html`
          <moul-sidebar .collapsed=${false}>
            <moul-sidebar-aside .showCollapseToggle=${true}></moul-sidebar-aside>
          </moul-sidebar>
        `,
      )

      const aside = sidebar.querySelector(
        'moul-sidebar-aside',
      ) as MoulSidebarAside
      const collapseChangeSpy = vi.fn()
      sidebar.addEventListener('collapsechange', collapseChangeSpy)

      const toggleBtn =
        aside.shadowRoot?.querySelector<HTMLButtonElement>('.toggle-button')
      expect(toggleBtn).toBeDefined()

      toggleBtn?.click()
      await awaitTreeUpdates(sidebar)

      expect(sidebar.collapsed).toBe(true)
      expect(collapseChangeSpy).toHaveBeenCalledTimes(1)
      expect(collapseChangeSpy.mock.calls[0][0].detail.collapsed).toBe(true)

      toggleBtn?.click()
      await awaitTreeUpdates(sidebar)
      expect(sidebar.collapsed).toBe(false)
      expect(collapseChangeSpy).toHaveBeenCalledTimes(2)
      expect(collapseChangeSpy.mock.calls[1][0].detail.collapsed).toBe(false)
    })
  })
})
