import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'
import {
  HighlightText,
  LogLevelBadge,
  Logs,
  LogsViewer,
  normalizeLogLevel,
  parseAttributes,
  parseLogLine,
  parseLogs,
  SERVER_LOG_RAW,
  SERVER_LOGS,
  stripAttributes,
} from './index'

describe('parseLogs utility', () => {
  test('normalizes various log level strings', () => {
    expect(normalizeLogLevel('INFO')).toBe('info')
    expect(normalizeLogLevel('DEBU')).toBe('debug')
    expect(normalizeLogLevel('WARN')).toBe('warn')
    expect(normalizeLogLevel('WARNING')).toBe('warn')
    expect(normalizeLogLevel('ERRO')).toBe('error')
    expect(normalizeLogLevel('ERROR')).toBe('error')
    expect(normalizeLogLevel('FATA')).toBe('fatal')
    expect(normalizeLogLevel('FATAL')).toBe('fatal')
    expect(normalizeLogLevel('TRACE')).toBe('trace')
    expect(normalizeLogLevel(undefined)).toBe('info')
  })

  test('parses key-value attributes with quoted strings, numbers, and booleans', () => {
    const text =
      'HTTP request bytes_sent=48 ip="127.0.0.1" latency="182.4µs" method="GET" path="/api/health" status=200 is_cached=true'
    const attrs = parseAttributes(text)

    expect(attrs).toEqual({
      bytes_sent: 48,
      ip: '127.0.0.1',
      latency: '182.4µs',
      method: 'GET',
      path: '/api/health',
      status: 200,
      is_cached: true,
    })

    expect(stripAttributes(text)).toBe('HTTP request')
  })

  test('parses standard server.log lines correctly', () => {
    const line =
      '2026/08/19 11:17:21 ERRO HTTP request bytes_sent=112 email="alex@example.com" ip="192.168.1.80" latency="14.85ms" method="POST" path="/api/mouls/orders/records" status=500 user_id="usr_01j7k9p2" error="database locked (sqlite busy)"'
    const parsed = parseLogLine(line, 8)

    expect(parsed.id).toBe('log-8')
    expect(parsed.lineNumber).toBe(9)
    expect(parsed.timestamp).toBe('2026/08/19 11:17:21')
    expect(parsed.level).toBe('error')
    expect(parsed.message).toBe('HTTP request')
    expect(parsed.attributes?.status).toBe(500)
    expect(parsed.attributes?.error).toBe('database locked (sqlite busy)')
    expect(parsed.attributes?.email).toBe('alex@example.com')
  })

  test('parses JSON format log lines', () => {
    const jsonLine = JSON.stringify({
      time: '2026-08-19T11:16:49Z',
      level: 'error',
      msg: 'Connection timeout',
      host: 'database.internal',
      retryCount: 3,
    })

    const parsed = parseLogLine(jsonLine, 0)
    expect(parsed.level).toBe('error')
    expect(parsed.message).toBe('Connection timeout')
    expect(parsed.timestamp).toBe('2026-08-19T11:16:49Z')
    expect(parsed.attributes?.host).toBe('database.internal')
    expect(parsed.attributes?.retryCount).toBe(3)
  })

  test('parses array of strings and object items with parseLogs', () => {
    const list = parseLogs([
      '2026/08/19 11:16:49 INFO Test line',
      { id: 'custom-1', message: 'Manual item', level: 'warn' },
    ])
    expect(list).toHaveLength(2)
    expect(list[0].level).toBe('info')
    expect(list[1].id).toBe('custom-1')
    expect(list[1].level).toBe('warn')
  })

  test('parses full server.log dataset via SERVER_LOGS', () => {
    expect(SERVER_LOGS.length).toBe(17)
    expect(SERVER_LOGS[0].message).toBe('Starting mould engine server')
    expect(SERVER_LOGS[0].attributes?.addr).toBe('http://localhost:8090')
    expect(SERVER_LOGS[16].level).toBe('fatal')
    expect(SERVER_LOGS[16].message).toBe('Server failed to run')
  })
})

describe('LogLevelBadge component', () => {
  test('renders badge with uppercase level and aria-label', () => {
    const { getByText } = render(<LogLevelBadge level="error" />)
    const badge = getByText('ERROR')
    expect(badge).toBeInTheDocument()
    expect(badge.getAttribute('aria-label')).toBe('Level: error')
  })

  test('normalizes raw level strings and non-standard strings', () => {
    const { getByText: getByText1 } = render(<LogLevelBadge level="ERRO" />)
    expect(getByText1('ERROR')).toBeInTheDocument()

    const { getByText: getByText2 } = render(<LogLevelBadge level="warning" />)
    expect(getByText2('WARN')).toBeInTheDocument()

    const { getByText: getByText3 } = render(<LogLevelBadge level="fata" />)
    expect(getByText3('FATAL')).toBeInTheDocument()

    const { getByText: getByText4 } = render(<LogLevelBadge />)
    expect(getByText4('INFO')).toBeInTheDocument()
  })
})

describe('Logs component suite', () => {
  test('renders React Aria Table structure with ARIA roles', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <Logs
        ref={ref}
        data={SERVER_LOGS}
        title="Server Logs"
        aria-label="Server Log Stream"
      />,
    )

    expect(ref.current).toBeInTheDocument()
    expect(
      screen.getByRole('grid', { name: 'Server Log Stream' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Server Logs')).toBeInTheDocument()
    expect(screen.getByText('17 / 17 events')).toBeInTheDocument()

    // Table rows: 1 header row + 17 log rows
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(18)

    // Screen reader live region
    const liveRegion = screen.getByRole('status', {
      name: (_accessibleName, element) =>
        element.textContent?.includes('17 logs displayed') ?? false,
    })
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })

  test('renders directly from raw text string (server.log)', () => {
    render(<Logs text={SERVER_LOG_RAW} title="Raw Logs" />)

    expect(screen.getByText('Raw Logs')).toBeInTheDocument()
    expect(screen.getByText('Starting mould engine server')).toBeInTheDocument()
    expect(screen.getByText('Server failed to run')).toBeInTheDocument()
  })

  test('filters logs by severity level when level pill is clicked with radio group semantics', () => {
    render(<Logs data={SERVER_LOGS} />)

    // Radio group role
    const radioGroup = screen.getByRole('radiogroup', {
      name: 'Filter by level',
    })
    expect(radioGroup).toBeInTheDocument()

    // All pill should initially be checked
    const allPill = screen.getByRole('radio', { name: /All/i })
    expect(allPill).toHaveAttribute('aria-checked', 'true')

    // Initially 18 rows (1 header + 17 data)
    expect(screen.getAllByRole('row')).toHaveLength(18)

    // Click "Errors" filter
    const errorPill = screen.getByRole('radio', { name: /Errors/i })
    expect(errorPill).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(errorPill)
    expect(errorPill).toHaveAttribute('aria-checked', 'true')
    expect(allPill).toHaveAttribute('aria-checked', 'false')

    // There are 3 ERRO + 1 FATA = 4 error/fatal logs + 1 header row = 5 rows
    const rowsAfterErrorFilter = screen.getAllByRole('row')
    expect(rowsAfterErrorFilter).toHaveLength(5)

    // Click "Warnings" filter
    const warnPill = screen.getByRole('radio', { name: /Warnings/i })
    fireEvent.click(warnPill)
    expect(warnPill).toHaveAttribute('aria-checked', 'true')
    expect(errorPill).toHaveAttribute('aria-checked', 'false')

    // 3 WARN lines + 1 header = 4 rows
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  test('filters logs with search query', () => {
    render(<Logs data={SERVER_LOGS} />)

    const searchInput = screen.getByLabelText('Filter logs')
    fireEvent.change(searchInput, { target: { value: 'health' } })

    // Only the /api/health row + header row = 2 rows
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('/api/health')).toBeInTheDocument()
  })

  test('opens Drawer inspector when inspect button is clicked', () => {
    render(<Logs data={SERVER_LOGS} inspectorMode="drawer" />)

    const inspectBtn = screen.getByLabelText('Inspect line #1')
    fireEvent.click(inspectBtn)

    // Drawer opens with header title
    expect(screen.getByText('Log #1')).toBeInTheDocument()
    expect(screen.getByText('Structured Fields (3)')).toBeInTheDocument()
    expect(screen.getByText('JSON Object')).toBeInTheDocument()
  })

  test('navigates next and previous logs inside Drawer inspector', () => {
    render(
      <Logs
        data={SERVER_LOGS}
        inspectorMode="drawer"
        defaultSelectedKeys={['log-0']}
        defaultInspectorOpen={true}
      />,
    )

    expect(screen.getByText('Log #1')).toBeInTheDocument()

    // Click "Next →"
    const nextBtn = screen.getByLabelText('Next log')
    fireEvent.click(nextBtn)
    expect(screen.getByText('Log #2')).toBeInTheDocument()

    // Click "← Previous"
    const prevBtn = screen.getByLabelText('Previous log')
    fireEvent.click(prevBtn)
    expect(screen.getByText('Log #1')).toBeInTheDocument()
  })

  test('renders inline inspector panel when inspectorMode is inline', () => {
    render(
      <Logs
        data={SERVER_LOGS}
        inspectorMode="inline"
        defaultSelectedKeys={['log-0']}
      />,
    )

    expect(screen.getByText(/Log Inspector \(Line #1\)/i)).toBeInTheDocument()
    const messageElements = screen.getAllByText('Starting mould engine server')
    expect(messageElements.length).toBeGreaterThanOrEqual(2)
  })

  test('shows empty state when no logs match', () => {
    render(
      <Logs data={SERVER_LOGS} searchQuery="nonexistent-query-string-xyz" />,
    )

    expect(
      screen.getByText('No logs match your filter criteria'),
    ).toBeInTheDocument()
  })

  test('renders with compact and wrapLines prop configuration', () => {
    const { container } = render(
      <Logs data={SERVER_LOGS} compact wrapLines={false} />,
    )
    expect(container).toBeInTheDocument()
  })

  test('calls onClear and onCopy callbacks', () => {
    const onClearSpy = vi.fn()
    const onCopySpy = vi.fn()

    render(
      <Logs
        data={SERVER_LOGS}
        onClear={onClearSpy}
        onCopy={onCopySpy}
        defaultSelectedKeys={['log-0']}
      />,
    )

    const clearButton = screen.getByLabelText('Clear logs')
    fireEvent.click(clearButton)
    expect(onClearSpy).toHaveBeenCalledTimes(1)

    const copyAllButton = screen.getByLabelText('Copy filtered logs')
    fireEvent.click(copyAllButton)
    expect(onCopySpy).toHaveBeenCalled()
  })

  test('copies card content and displays succeed state with check icon', () => {
    const onCopySpy = vi.fn()

    render(
      <Logs
        data={SERVER_LOGS}
        inspectorMode="drawer"
        defaultSelectedKeys={['log-0']}
        defaultInspectorOpen={true}
        onCopy={onCopySpy}
      />,
    )

    const copyMsgBtn = screen.getByLabelText('Copy message')
    expect(copyMsgBtn).toBeInTheDocument()

    fireEvent.click(copyMsgBtn)
    expect(onCopySpy).toHaveBeenCalledWith('Starting mould engine server')
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument()
  })

  test('LogsViewer alias renders identically to Logs', () => {
    expect(LogsViewer).toBe(Logs)
    render(<LogsViewer data={SERVER_LOGS} title="Alias Test" />)
    expect(screen.getByText('Alias Test')).toBeInTheDocument()
  })

  test('toggles follow mode and calls onFollowChange', async () => {
    const onFollowChangeSpy = vi.fn()
    const { container } = render(
      <Logs
        data={SERVER_LOGS}
        defaultFollow={false}
        onFollowChange={onFollowChangeSpy}
      />,
    )

    const followBtn = screen.getByLabelText('Follow latest logs')
    expect(followBtn).toBeInTheDocument()
    expect(followBtn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(followBtn)
    expect(onFollowChangeSpy).toHaveBeenCalledWith(true)
    expect(screen.getByLabelText('Pause live follow')).toBeInTheDocument()

    // Allow microtasks from scrollToBottom to settle
    await Promise.resolve()

    // Find the scroll container
    const scrollContainer = container.querySelector('table')?.parentElement
    expect(scrollContainer).toBeInTheDocument()

    if (scrollContainer) {
      // Set initial bottom scroll position
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 1000,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 300,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 700,
        writable: true,
        configurable: true,
      })
      fireEvent.scroll(scrollContainer)

      // Simulate scrolling up (distanceFromBottom > 35 and scrollTop decreased with user interaction)
      fireEvent.wheel(scrollContainer)
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 100,
        writable: true,
        configurable: true,
      }) // distanceFromBottom = 600
      fireEvent.scroll(scrollContainer)
      expect(onFollowChangeSpy).toHaveBeenCalledWith(false)
      expect(screen.getByLabelText('Follow latest logs')).toBeInTheDocument()

      // Simulate scrolling back to the bottom with user interaction (distanceFromBottom <= 5)
      fireEvent.wheel(scrollContainer)
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 700,
        writable: true,
        configurable: true,
      }) // distanceFromBottom = 0
      fireEvent.scroll(scrollContainer)
      expect(onFollowChangeSpy).toHaveBeenCalledWith(true)
      expect(screen.getByLabelText('Pause live follow')).toBeInTheDocument()
    }
  })

  test('renders search filter input, level filter buttons, and action buttons in top toolbar', () => {
    const onClearSpy = vi.fn()
    const onDownloadSpy = vi.fn()
    render(
      <Logs
        data={SERVER_LOGS}
        title="App Logs"
        showToolbar={true}
        showFollowButton={true}
        onClear={onClearSpy}
        onDownload={onDownloadSpy}
      />,
    )

    // Search input
    const searchField = screen.getByLabelText('Filter logs')
    expect(searchField).toBeInTheDocument()

    // Filter level pills in ToggleButtonGroup
    const allRadio = screen.getByRole('radio', { name: /All/i })
    const errorRadio = screen.getByRole('radio', { name: /Errors/i })
    const warnRadio = screen.getByRole('radio', { name: /Warnings/i })
    const infoRadio = screen.getByRole('radio', { name: /Info/i })
    const debugRadio = screen.getByRole('radio', { name: /Debug/i })
    expect(allRadio).toBeInTheDocument()
    expect(errorRadio).toBeInTheDocument()
    expect(warnRadio).toBeInTheDocument()
    expect(infoRadio).toBeInTheDocument()
    expect(debugRadio).toBeInTheDocument()

    // Toolbar action buttons
    const followButton = screen.getByLabelText('Follow latest logs')
    const copyButton = screen.getByLabelText('Copy filtered logs')
    const exportButton = screen.getByLabelText('Export logs')
    const clearButton = screen.getByLabelText('Clear logs')
    expect(followButton).toBeInTheDocument()
    expect(copyButton).toBeInTheDocument()
    expect(exportButton).toBeInTheDocument()
    expect(clearButton).toBeInTheDocument()
  })
})

describe('HighlightText component', () => {
  test('renders plain text when no highlight is passed', () => {
    const { container } = render(<HighlightText text="Hello World" />)
    expect(container.textContent).toBe('Hello World')
    expect(container.querySelector('mark')).toBeNull()
  })

  test('wraps matched substring in mark tag with aria-label', () => {
    const { container } = render(
      <HighlightText text="Hello World" highlight="World" />,
    )
    const mark = container.querySelector('mark')
    expect(mark).not.toBeNull()
    expect(mark?.textContent).toBe('World')
    expect(mark?.getAttribute('aria-label')).toBe('highlighted match: World')
  })

  test('handles case-insensitive matches', () => {
    const { container } = render(
      <HighlightText text="Database Timeout Error" highlight="timeout" />,
    )
    const mark = container.querySelector('mark')
    expect(mark?.textContent).toBe('Timeout')
    expect(mark?.getAttribute('aria-label')).toBe('highlighted match: Timeout')
  })
})
