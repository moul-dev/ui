import type { LogItem, LogLevel } from './Logs.types'

const LEVEL_MAP: Record<string, LogLevel> = {
  trace: 'trace',
  trac: 'trace',
  debug: 'debug',
  debu: 'debug',
  info: 'info',
  inf: 'info',
  warn: 'warn',
  warning: 'warn',
  error: 'error',
  erro: 'error',
  err: 'error',
  fatal: 'fatal',
  fata: 'fatal',
  panic: 'fatal',
  crit: 'fatal',
  critical: 'fatal',
}

/**
 * Normalizes any log level string into standard LogLevel.
 */
export function normalizeLogLevel(levelStr?: string): LogLevel {
  if (!levelStr) return 'info'
  const cleaned = levelStr.toLowerCase().replace(/[^a-z]/g, '')
  return LEVEL_MAP[cleaned] || 'info'
}

/**
 * Parses key="value" or key=value key-value pairs from a log string.
 */
export function parseAttributes(
  text: string,
): Record<string, string | number | boolean | null> {
  const attributes: Record<string, string | number | boolean | null> = {}

  // Regex matching key="val", key='val', or key=val (without spaces unless quoted)
  const regex =
    /([a-zA-Z0-9_.-]+)=(?:"((?:\\"|[^"])*)"|'((?:\\'|[^'])*)'|([^\s]+))/g
  let match: RegExpExecArray | null = regex.exec(text)

  while (match !== null) {
    const key = match[1]
    let value: string | number | boolean | null =
      match[2] !== undefined
        ? match[2].replace(/\\"/g, '"')
        : match[3] !== undefined
          ? match[3].replace(/\\'/g, "'")
          : match[4]

    if (value === 'true') {
      value = true
    } else if (value === 'false') {
      value = false
    } else if (value === 'null') {
      value = null
    } else if (!Number.isNaN(Number(value)) && value.trim() !== '') {
      value = Number(value)
    }

    attributes[key] = value
    match = regex.exec(text)
  }

  return attributes
}

/**
 * Strips key=value pairs from the string to obtain the clean base message.
 */
export function stripAttributes(text: string): string {
  const regex = /\s+[a-zA-Z0-9_.-]+=(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\s]+)/g
  return text.replace(regex, '').trim()
}

/**
 * Parses a single log line into a structured LogItem.
 */
export function parseLogLine(rawLine: string, index = 0): LogItem {
  const trimmed = rawLine.trim()
  if (!trimmed) {
    return {
      id: `log-${index}`,
      lineNumber: index + 1,
      message: '',
      raw: rawLine,
      level: 'info',
    }
  }

  // 1. Try parsing JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const json = JSON.parse(trimmed)
      const level = normalizeLogLevel(
        json.level || json.severity || json.lvl || json.status || 'info',
      )
      const timestamp =
        json.time ||
        json.timestamp ||
        json['@timestamp'] ||
        json.date ||
        undefined
      const message =
        json.msg ||
        json.message ||
        json.log ||
        json.text ||
        JSON.stringify(json)

      // Copy remaining keys as attributes
      const {
        level: _l,
        severity: _s,
        lvl: _lvl,
        time: _t,
        timestamp: _ts,
        ['@timestamp']: _ats,
        date: _d,
        msg: _m,
        message: _msg,
        ...restAttributes
      } = json

      return {
        id: json.id ?? `log-${index}`,
        lineNumber: index + 1,
        timestamp: timestamp ? String(timestamp) : undefined,
        level,
        message: String(message),
        attributes: restAttributes,
        raw: rawLine,
      }
    } catch {
      // Fallback to standard regex parsing
    }
  }

  // 2. Standard timestamp + level + message format (e.g. server.log)
  // Format: "2026/08/19 11:16:49 INFO Starting mould engine server addr=..."
  // or "[2026-08-19 11:16:49] [INFO] ..."
  const timestampLevelRegex =
    /^\[?(\d{4}[/-]\d{2}[/-]\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?)\]?\s+\[?([A-Z]{3,7})\]?\s+(.*)$/i

  const match = trimmed.match(timestampLevelRegex)
  if (match) {
    const timestamp = match[1]
    const levelStr = match[2]
    const rest = match[3]

    const attributes = parseAttributes(rest)
    const message = stripAttributes(rest) || rest

    return {
      id: `log-${index}`,
      lineNumber: index + 1,
      timestamp,
      level: normalizeLogLevel(levelStr),
      message,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      raw: rawLine,
    }
  }

  // 3. Fallback: line without explicit timestamp
  const attributes = parseAttributes(trimmed)
  const message = stripAttributes(trimmed) || trimmed

  return {
    id: `log-${index}`,
    lineNumber: index + 1,
    level: 'info',
    message,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    raw: rawLine,
  }
}

/**
 * Parses raw text or list of log strings into LogItem[].
 */
export function parseLogs(input?: string | (LogItem | string)[]): LogItem[] {
  if (!input) return []

  if (typeof input === 'string') {
    return input
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line, idx) => parseLogLine(line, idx))
  }

  if (Array.isArray(input)) {
    return input.map((item, idx) => {
      if (typeof item === 'string') {
        return parseLogLine(item, idx)
      }
      return {
        ...item,
        id: item.id ?? `log-${idx}`,
        lineNumber: item.lineNumber ?? idx + 1,
        level: normalizeLogLevel(item.level),
      }
    })
  }

  return []
}
