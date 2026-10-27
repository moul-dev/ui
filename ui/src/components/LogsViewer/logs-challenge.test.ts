import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LogItem, LogLevel } from './Logs.types'
import { HighlightText, type MoulLogsViewer } from './LogsViewer'
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

describe('Adversarial Challenge: Milestone 1 Log Parsers & LogsViewer Logic', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('Dimension 1: normalizeLogLevel Adversarial Inputs', () => {
    it('handles empty, undefined, null, and whitespace without throwing', () => {
      expect(normalizeLogLevel()).toBe('info')
      expect(normalizeLogLevel(undefined)).toBe('info')
      expect(normalizeLogLevel('')).toBe('info')
      expect(normalizeLogLevel('   ')).toBe('info')
      expect(normalizeLogLevel('\t\r\n')).toBe('info')
    })

    it('handles heavily punctuated and bracketed inputs', () => {
      expect(normalizeLogLevel('[[[INFO]]]')).toBe('info')
      expect(normalizeLogLevel('<<<WARN>>>')).toBe('warn')
      expect(normalizeLogLevel('((ERROR))')).toBe('error')
      expect(normalizeLogLevel('---debug---')).toBe('debug')
      expect(normalizeLogLevel('!@#$%^fatal&*()')).toBe('fatal')
      expect(normalizeLogLevel('12345')).toBe('info')
      expect(normalizeLogLevel('???')).toBe('info')
    })

    it('handles mixed casing and whitespace padding', () => {
      expect(normalizeLogLevel('  iNfO  ')).toBe('info')
      expect(normalizeLogLevel('WaRnInG')).toBe('warn')
      expect(normalizeLogLevel('\nDeBuG\t')).toBe('debug')
      expect(normalizeLogLevel('CRITICAL')).toBe('fatal')
      expect(normalizeLogLevel('PANIC')).toBe('fatal')
    })

    it('probes prototype keys on normalizeLogLevel', () => {
      // In JS, plain object property access can hit Object.prototype
      const ctorResult = normalizeLogLevel('constructor')
      expect(typeof ctorResult).toBe('string')
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(
        ctorResult,
      )

      const toStringResult = normalizeLogLevel('toString')
      expect(typeof toStringResult).toBe('string')
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(
        toStringResult,
      )

      const protoResult = normalizeLogLevel('__proto__')
      expect(typeof protoResult).toBe('string')
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(
        protoResult,
      )

      const valueOfResult = normalizeLogLevel('valueOf')
      expect(typeof valueOfResult).toBe('string')
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(
        valueOfResult,
      )
    })

    it('probes non-string types safely if casted', () => {
      // Test how normalizeLogLevel reacts to non-string inputs at runtime
      try {
        const numResult = normalizeLogLevel(500 as unknown as string)
        expect(typeof numResult).toBe('string')
      } catch (err) {
        expect(err).toBeInstanceOf(TypeError)
      }
    })
  })

  describe('Dimension 2: parseAttributes Edge Cases & Adversarial Strings', () => {
    it('handles empty strings and whitespace strings', () => {
      expect(parseAttributes('')).toEqual({})
      expect(parseAttributes('   \t   \n  ')).toEqual({})
    })

    it('handles quoted attributes with multiple spaces, colons, and equal signs', () => {
      const input =
        'msg="hello world this is a test" endpoint="https://api.example.com/v1/auth?token=xyz:123&user=admin" title="Foo = Bar : Baz"'
      const attrs = parseAttributes(input)
      expect(attrs.msg).toBe('hello world this is a test')
      expect(attrs.endpoint).toBe(
        'https://api.example.com/v1/auth?token=xyz:123&user=admin',
      )
      expect(attrs.title).toBe('Foo = Bar : Baz')
    })

    it('handles single-quoted attributes with spaces and special characters', () => {
      const input =
        "user='alex smith' role='admin:super' note='nothing to see here'"
      const attrs = parseAttributes(input)
      expect(attrs.user).toBe('alex smith')
      expect(attrs.role).toBe('admin:super')
      expect(attrs.note).toBe('nothing to see here')
    })

    it('handles empty attribute values correctly', () => {
      const input = 'empty_dq="" empty_sq=\'\' valid="something"'
      const attrs = parseAttributes(input)
      expect(attrs.empty_dq).toBe('')
      expect(attrs.empty_sq).toBe('')
      expect(attrs.valid).toBe('something')
    })

    it('handles escaped quotes inside double and single quotes', () => {
      const input =
        'text="He said: \\"Hello World\\" today" sql=\'SELECT * FROM \\\'users\\\'\''
      const attrs = parseAttributes(input)
      expect(attrs.text).toBe('He said: "Hello World" today')
      expect(attrs.sql).toBe("SELECT * FROM 'users'")
    })

    it('handles type coercion for booleans, null, numbers, and strings', () => {
      const input =
        't=true f=false n=null zero=0 pos=100 neg=-42 float=3.14 exp=1e5 str="true" numStr="123"'
      const attrs = parseAttributes(input)
      expect(attrs.t).toBe(true)
      expect(attrs.f).toBe(false)
      expect(attrs.n).toBe(null)
      expect(attrs.zero).toBe(0)
      expect(attrs.pos).toBe(100)
      expect(attrs.neg).toBe(-42)
      expect(attrs.float).toBe(3.14)
      expect(attrs.exp).toBe(100000)
      // Note: parser coerces even quoted numbers/booleans if matching Number / 'true'
      expect(attrs.str).toBe(true)
      expect(attrs.numStr).toBe(123)
    })

    it('handles numeric edge cases: Infinity, -Infinity, NaN, 0x hex', () => {
      const input = 'nan=NaN inf=Infinity negInf=-Infinity hex=0x1f'
      const attrs = parseAttributes(input)
      expect(attrs.nan).toBe('NaN') // Number('NaN') is NaN so stays string
      expect(attrs.inf).toBe(Infinity)
      expect(attrs.negInf).toBe(-Infinity)
      expect(attrs.hex).toBe(31)
    })

    it('handles keys with dots, hyphens, and underscores', () => {
      const input =
        'user.profile.id=42 x-request-id="req_99" _internal_state="ok" a.b-c_d=1'
      const attrs = parseAttributes(input)
      expect(attrs['user.profile.id']).toBe(42)
      expect(attrs['x-request-id']).toBe('req_99')
      expect(attrs._internal_state).toBe('ok')
      expect(attrs['a.b-c_d']).toBe(1)
    })

    it('handles malformed attribute tokens without throwing or hanging', () => {
      const malformed =
        '=== key= key==val key="unclosed string at end key2=\'also unclosed ==='
      expect(() => parseAttributes(malformed)).not.toThrow()
      const attrs = parseAttributes(malformed)
      expect(typeof attrs).toBe('object')
      expect(attrs).not.toBeNull()
    })

    it('handles ANSI escape codes inside or around attributes', () => {
      const input =
        '\u001b[32mstatus\u001b[0m=200 msg="\u001b[31merror message\u001b[0m"'
      expect(() => parseAttributes(input)).not.toThrow()
    })

    it('handles prototype keys in attributes without polluting Object.prototype', () => {
      const input = '__proto__="evil" constructor=123 toString="test"'
      const attrs = parseAttributes(input)
      // Check that global Object prototype wasn't corrupted
      expect(({} as any).evil).toBeUndefined()
      // attrs can be iterated safely
      expect(() => Object.entries(attrs)).not.toThrow()
    })
  })

  describe('Dimension 3: stripAttributes Adversarial Behavior', () => {
    it('strips all types of trailing key-value attributes cleanly', () => {
      const raw =
        'Starting worker thread id=1 name="worker-main" active=true env=\'prod\''
      const clean = stripAttributes(raw)
      expect(clean).toBe('Starting worker thread')
    })

    it('leaves message untouched when no attributes exist', () => {
      expect(stripAttributes('Starting worker thread')).toBe(
        'Starting worker thread',
      )
      expect(stripAttributes('')).toBe('')
      expect(stripAttributes('   ')).toBe('')
    })

    it('handles attributes with spaces in quotes', () => {
      const raw =
        'Transaction aborted error="database connection timeout on pool worker 4" code=504'
      const clean = stripAttributes(raw)
      expect(clean).toBe('Transaction aborted')
    })

    it('evaluates behavior when attribute appears at line start (no leading space)', () => {
      const raw = 'error="timeout" something else'
      // Regex has \s+ before key, so index 0 attribute behaves without leading whitespace
      const clean = stripAttributes(raw)
      expect(typeof clean).toBe('string')
    })
  })

  describe('Dimension 4: parseLogLine Robustness & Edge Cases', () => {
    it('handles empty line and whitespace-only line', () => {
      const empty = parseLogLine('', 0)
      expect(empty.id).toBe('log-0')
      expect(empty.lineNumber).toBe(1)
      expect(empty.message).toBe('')
      expect(empty.level).toBe('info')

      const ws = parseLogLine('     \t    ', 5)
      expect(ws.id).toBe('log-5')
      expect(ws.lineNumber).toBe(6)
      expect(ws.message).toBe('')
      expect(ws.level).toBe('info')
    })

    it('handles lines with only timestamp or only level', () => {
      const onlyTime = parseLogLine('2026-10-17 11:16:49', 0)
      expect(onlyTime.id).toBe('log-0')
      expect(onlyTime.message).toBe('2026-10-17 11:16:49')
      expect(onlyTime.level).toBe('info')

      const onlyLevel = parseLogLine('[ERROR]', 1)
      expect(onlyLevel.id).toBe('log-1')
      expect(onlyLevel.message).toBe('[ERROR]')
    })

    it('handles line with timestamp and level but no message', () => {
      const timeAndLevel = parseLogLine('2026-10-17 11:16:49 INFO', 0)
      expect(timeAndLevel.id).toBe('log-0')
      expect(typeof timeAndLevel.message).toBe('string')
      expect(timeAndLevel.level).toBeDefined()
    })

    it('handles lines with multiple bracketed segments', () => {
      const line =
        '[2026-10-17 11:16:49] [INFO] [auth-service] [tenant-42] User session restored uid="u_123"'
      const parsed = parseLogLine(line, 2)
      expect(parsed.timestamp).toBe('2026-10-17 11:16:49')
      expect(parsed.level).toBe('info')
      expect(parsed.message).toContain('[auth-service]')
      expect(parsed.message).toContain('[tenant-42]')
      expect(parsed.attributes?.uid).toBe('u_123')
    })

    it('handles ISO 8601 timestamps with milliseconds and offsets', () => {
      const line1 =
        '2026-10-17T04:17:21.999Z [WARN] Memory threshold exceeded heap=85%'
      const parsed1 = parseLogLine(line1, 0)
      expect(parsed1.timestamp).toBe('2026-10-17T04:17:21.999Z')
      expect(parsed1.level).toBe('warn')

      const line2 =
        '2026/10/17 04:17:21+07:00 [ERROR] Connection refused host="10.0.0.1"'
      const parsed2 = parseLogLine(line2, 1)
      expect(parsed2.timestamp).toBe('2026/10/17 04:17:21+07:00')
      expect(parsed2.level).toBe('error')
    })

    it('handles JSON log parsing edge cases', () => {
      // 1. Pino / Bunyan format with numeric level
      const pinoLine = JSON.stringify({
        level: 30,
        time: 1729138641000,
        msg: 'Server started',
        port: 8080,
      })
      // Should not throw even with numeric level
      expect(() => parseLogLine(pinoLine, 0)).not.toThrow()
      const pinoParsed = parseLogLine(pinoLine, 0)
      expect(pinoParsed.message).toBeDefined()

      // 2. JSON with @timestamp and severity
      const esLine = JSON.stringify({
        '@timestamp': '2026-10-17T04:00:00Z',
        severity: 'critical',
        message: 'Disk space low',
        free: '1.2GB',
      })
      const esParsed = parseLogLine(esLine, 1)
      expect(esParsed.timestamp).toBe('2026-10-17T04:00:00Z')
      expect(esParsed.level).toBe('fatal')
      expect(esParsed.message).toBe('Disk space low')
      expect(esParsed.attributes?.free).toBe('1.2GB')

      // 3. JSON with missing message key (falls back to stringified json)
      const emptyMsgLine = JSON.stringify({
        time: '2026-10-17',
        level: 'info',
        status: 'OK',
      })
      const emptyMsgParsed = parseLogLine(emptyMsgLine, 2)
      expect(emptyMsgParsed.message).toBeDefined()
      expect(emptyMsgParsed.level).toBe('info')

      // 4. Broken JSON starting with { and ending with }
      const brokenJson = '{ "broken": json without quotes }'
      expect(() => parseLogLine(brokenJson, 3)).not.toThrow()
      const brokenParsed = parseLogLine(brokenJson, 3)
      expect(brokenParsed.message).toBe(brokenJson)
    })

    it('handles ANSI escape codes in log line safely', () => {
      const line =
        '\u001b[32m2026/08/19 11:16:49\u001b[0m \u001b[34mINFO\u001b[0m \u001b[1mService started\u001b[0m'
      expect(() => parseLogLine(line, 0)).not.toThrow()
      const parsed = parseLogLine(line, 0)
      expect(parsed.id).toBe('log-0')
      expect(parsed.raw).toBe(line)
    })

    it('handles massive log lines without memory explosion or ReDoS', () => {
      const massiveMessage = 'A'.repeat(50000)
      const line = `2026-10-17 11:16:49 INFO ${massiveMessage} key="value"`
      const t0 = performance.now()
      const parsed = parseLogLine(line, 0)
      const duration = performance.now() - t0
      expect(duration).toBeLessThan(500) // Must finish in under 500ms
      expect(parsed.attributes?.key).toBe('value')
    })
  })

  describe('Dimension 5: parseLogs Comprehensive & Array Handling', () => {
    it('handles empty inputs, undefined, null, and non-string inputs', () => {
      expect(parseLogs(undefined)).toEqual([])
      expect(parseLogs('')).toEqual([])
      expect(parseLogs(null as unknown as string)).toEqual([])
      expect(parseLogs(123 as unknown as string)).toEqual([])
    })

    it('handles Windows CRLF and Unix LF multiline strings with blank lines', () => {
      const multiline =
        '2026-10-17 11:16:49 INFO Line 1\r\n\r\n2026-10-17 11:16:50 WARN Line 2\n\n\n2026-10-17 11:16:51 ERROR Line 3\r\n'
      const parsed = parseLogs(multiline)
      expect(parsed).toHaveLength(3)
      expect(parsed[0].lineNumber).toBe(1)
      expect(parsed[1].lineNumber).toBe(2)
      expect(parsed[2].lineNumber).toBe(3)
    })

    it('handles array of LogItem objects and pre-parsed logs', () => {
      const input: (LogItem | string)[] = [
        '2026-10-17 11:16:49 INFO String item',
        {
          id: 'custom-id',
          message: 'Object item',
          level: 'WARN',
        },
        {
          message: 'Missing id item',
          level: 'fatal',
        } as LogItem,
      ]
      const parsed = parseLogs(input)
      expect(parsed).toHaveLength(3)
      expect(parsed[0].id).toBe('log-0')
      expect(parsed[1].id).toBe('custom-id')
      expect(parsed[1].level).toBe('warn')
      expect(parsed[2].id).toBe('log-2')
      expect(parsed[2].level).toBe('fatal')
    })

    it('probes array input with numeric or unconventional levels', () => {
      const input = [
        {
          id: 'item-1',
          message: 'Testing non-string level',
          level: 500 as unknown as string,
        },
      ]
      // Verify behavior on non-string level in array
      try {
        const parsed = parseLogs(input as LogItem[])
        expect(parsed[0].level).toBeDefined()
      } catch (err) {
        expect(err).toBeInstanceOf(TypeError)
      }
    })
  })

  describe('Dimension 6: HighlightText Helper Robustness', () => {
    it('handles empty text, empty query, and whitespace queries', () => {
      expect(HighlightText({ text: 'Hello World', query: '' })).toBe(
        'Hello World',
      )
      expect(HighlightText({ text: 'Hello World', query: '   ' })).toBe(
        'Hello World',
      )
      expect(HighlightText({ text: '', query: 'test' })).toBe('')
    })

    it('safely escapes special regex characters in search query', () => {
      const specialQueries = [
        '[error]',
        'user@domain.com',
        'c++?',
        'a(b)c',
        'val=100',
        '$100',
        'foo | bar',
        'path\\to\\file',
        'file.*.ts',
        'a^b',
      ]

      for (const query of specialQueries) {
        expect(() =>
          HighlightText({
            text: `prefix ${query} suffix`,
            query,
          }),
        ).not.toThrow()
      }
    })

    it('correctly handles consecutive matches in text without skipping', () => {
      const result = HighlightText({
        text: 'apple apple apple',
        query: 'apple',
      })
      expect(result).not.toBe('apple apple apple')
    })
  })

  describe('Dimension 7: MoulLogsViewer Adversarial States & Filtering', () => {
    it('handles logs with missing or irregular properties gracefully', async () => {
      const irregularLogs: LogItem[] = [
        { id: 1, message: 'Normal' },
        { id: 2, message: '', level: undefined },
        { id: 3, message: 'No timestamp', timestamp: undefined },
        {
          id: 4,
          message: 'Complex attrs',
          attributes: {
            nested: { foo: 'bar' } as unknown as string,
            num: 0,
            bool: false,
            nil: null,
            undef: undefined,
          },
        },
        {
          id: 'str-id',
          message: 'Special characters: <script>alert(1)</script>',
        },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${irregularLogs}></moul-logs-viewer>`,
      )
      expect(el).toBeDefined()
      const rows = el.shadowRoot?.querySelectorAll('.row')
      expect(rows?.length).toBe(5)
    })

    it('filters correctly across level categories including aliases', async () => {
      const testLogs: LogItem[] = [
        { id: 1, message: 'info log', level: 'info' },
        { id: 2, message: 'warn log', level: 'warn' },
        { id: 3, message: 'error log', level: 'error' },
        { id: 4, message: 'fatal log', level: 'fatal' },
        { id: 5, message: 'debug log', level: 'debug' },
        { id: 6, message: 'trace log', level: 'trace' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
      )

      // Test 'error' filter includes fatal
      el.filterLevel = 'error'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([3, 4])

      // Test 'debug' filter includes trace
      el.filterLevel = 'debug'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([5, 6])

      // Test 'warn' filter
      el.filterLevel = 'warn'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([2])

      // Test 'info' filter
      el.filterLevel = 'info'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([1])

      // Test 'all' filter
      el.filterLevel = 'all'
      await awaitUpdates(el)
      expect(el.filteredLogs.length).toBe(6)
    })

    it('searches inside message, level, timestamp, raw, and attribute keys/values', async () => {
      const testLogs: LogItem[] = [
        { id: 1, message: 'User signed in', timestamp: '2026-10-17 10:00:00' },
        {
          id: 2,
          message: 'Payment failed',
          attributes: { reason: 'card_expired' },
        },
        { id: 3, message: 'Cache miss', raw: 'cache_miss_raw_log_entry' },
        { id: 4, message: 'Critical alert', level: 'fatal' },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${testLogs}></moul-logs-viewer>`,
      )

      // Match attribute value
      el.searchQuery = 'card_expired'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([2])

      // Match attribute key
      el.searchQuery = 'reason'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([2])

      // Match raw
      el.searchQuery = 'cache_miss_raw'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([3])

      // Match timestamp
      el.searchQuery = '10:00:00'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([1])

      // Match level
      el.searchQuery = 'fatal'
      await awaitUpdates(el)
      expect(el.filteredLogs.map((l) => l.id)).toEqual([4])
    })

    it('supports inspector opening and displaying complex attributes safely', async () => {
      const logWithAttrs: LogItem[] = [
        {
          id: 'test-1',
          lineNumber: 1,
          message: 'Complex inspection',
          attributes: {
            service: 'payment',
            retries: 3,
            flag: true,
            details: 'none',
          },
          raw: 'full raw message here',
        },
      ]

      const el = await mount<MoulLogsViewer>(
        html`<moul-logs-viewer .logs=${logWithAttrs}></moul-logs-viewer>`,
      )

      // Click row to open inspector
      const row = el.shadowRoot?.querySelector<HTMLElement>('.row')
      row?.click()
      await awaitUpdates(el)

      expect(el.isInspectorOpen).toBe(true)
      expect(el.selectedId).toBe('test-1')
      const inspector = el.shadowRoot?.querySelector('.inspector-body')
      expect(inspector).not.toBeNull()
      expect(inspector?.textContent).toContain('payment')
      expect(inspector?.textContent).toContain('3')
      expect(inspector?.textContent).toContain('full raw message here')

      // Close inspector via close button
      const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
        '.inspector-close-btn',
      )
      closeBtn?.click()
      await awaitUpdates(el)

      expect(el.isInspectorOpen).toBe(false)
      expect(el.selectedId).toBeNull()
    })
  })

  describe('Dimension 8: Property-Based Stress Testing with fast-check', () => {
    it('parseLogLine never throws or crashes on arbitrary random strings', () => {
      fc.assert(
        fc.property(fc.string(), (randomString) => {
          const item = parseLogLine(randomString, 0)
          expect(item).toBeDefined()
          expect(typeof item.id).toBe('string')
          expect(typeof item.message).toBe('string')
          expect(typeof item.level).toBe('string')
          expect(item.raw).toBe(randomString)
        }),
        { numRuns: 200 },
      )
    })

    it('parseAttributes never throws on arbitrary random strings', () => {
      fc.assert(
        fc.property(fc.string(), (randomString) => {
          const attrs = parseAttributes(randomString)
          expect(attrs).toBeDefined()
          expect(typeof attrs).toBe('object')
        }),
        { numRuns: 200 },
      )
    })

    it('normalizeLogLevel always returns a valid LogLevel on arbitrary random strings', () => {
      const validLevels: LogLevel[] = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
      ]
      fc.assert(
        fc.property(fc.string(), (randomString) => {
          const level = normalizeLogLevel(randomString)
          expect(validLevels).toContain(level)
        }),
        { numRuns: 200 },
      )
    })

    it('stripAttributes never throws on arbitrary random strings', () => {
      fc.assert(
        fc.property(fc.string(), (randomString) => {
          const result = stripAttributes(randomString)
          expect(typeof result).toBe('string')
        }),
        { numRuns: 200 },
      )
    })
  })
})
