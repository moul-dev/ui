'use client'

import {
  Badge,
  Button,
  type LogItem,
  Logs,
  SERVER_LOGS,
  Stat,
  Switch,
  tokens,
} from '@moul-dev/ui'
import { useCallback, useEffect, useState } from 'react'
import { ThemeSelector } from '@/components/theme-selector'

const SAMPLE_STREAM_EVENTS: string[] = [
  '2026/08/19 11:18:10 INFO HTTP request bytes_sent=230 ip="192.168.1.50" latency="1.45ms" method="GET" path="/api/health" status=200',
  '2026/08/19 11:18:14 DEBU Cache record validated component="redis" key="user_cache_01" ttl=3600',
  '2026/08/19 11:18:20 INFO HTTP request bytes_sent=3420 email="maria@example.com" ip="192.168.1.92" latency="6.82ms" method="POST" path="/api/mouls/posts/create" status=201 user_id="usr_01j7k9x9"',
  '2026/08/19 11:18:25 WARN High latency detected latency="124.5ms" path="/api/analytics/query" component="database"',
  '2026/08/19 11:18:31 ERRO Webhook delivery timed out endpoint="https://api.partner.io/v1/sync" error="context deadline exceeded" attempt=3',
  '2026/08/19 11:18:40 INFO Background compaction completed count=128 duration="45ms"',
]

// Sun and Moon icons for direct light/dark toggling
const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export function LogsPreview() {
  const [logsList, setLogsList] = useState<LogItem[]>(SERVER_LOGS)
  const [isLiveStreaming, setIsLiveStreaming] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [, setForceTick] = useState(0)

  // Synchronize with DOM dark mode and style mutations seamlessly
  const syncThemeState = useCallback(() => {
    if (typeof document === 'undefined') return
    const isCurrentlyDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.documentElement.style.colorScheme === 'dark'

    setIsDark(isCurrentlyDark)
    setForceTick((t) => t + 1)
  }, [])

  useEffect(() => {
    syncThemeState()

    // MutationObserver to watch class/style/data-theme changes on <html>
    const observer = new MutationObserver(syncThemeState)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    })

    window.addEventListener('storage', syncThemeState)
    window.addEventListener('moul-theme-change', syncThemeState)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', syncThemeState)
      window.removeEventListener('moul-theme-change', syncThemeState)
    }
  }, [syncThemeState])

  const toggleDarkMode = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    const nextDark = !isCurrentlyDark
    setIsDark(nextDark)

    if (nextDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('theme', 'light')
    }

    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new CustomEvent('moul-theme-change'))
    setForceTick((t) => t + 1)
  }

  // Live stream simulator
  useEffect(() => {
    if (!isLiveStreaming) return

    let currentIdx = 0
    const timer = setInterval(() => {
      const rawLine: string =
        SAMPLE_STREAM_EVENTS[currentIdx] ??
        '2026/08/19 11:18:10 INFO HTTP request bytes_sent=230 ip="192.168.1.50" latency="1.45ms" method="GET" path="/api/health" status=200'

      currentIdx = (currentIdx + 1) % SAMPLE_STREAM_EVENTS.length

      const level: 'info' | 'warn' | 'error' | 'debug' = rawLine.includes(
        'ERRO',
      )
        ? 'error'
        : rawLine.includes('WARN')
          ? 'warn'
          : rawLine.includes('DEBU')
            ? 'debug'
            : 'info'

      setLogsList((curr: LogItem[]) => [
        ...curr,
        {
          id: `stream-${Date.now()}-${currentIdx}`,
          raw: rawLine,
          message: rawLine,
          lineNumber: curr.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          level,
        },
      ])
    }, 2500)

    return () => clearInterval(timer)
  }, [isLiveStreaming])

  // Summary stats
  const totalLogs = logsList.length
  const errorCount = logsList.filter(
    (l) => l.level === 'error' || l.level === 'fatal',
  ).length
  const warnCount = logsList.filter((l) => l.level === 'warn').length
  const errorRate =
    totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : '0'

  const handleAddSample = (level: 'info' | 'warn' | 'error') => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
    let sample = ''
    if (level === 'error') {
      sample = `${timestamp} ERRO Database transaction aborted error="deadlock detected" isolation="serializable" txID="tx_${Date.now().toString(36)}"`
    } else if (level === 'warn') {
      sample = `${timestamp} WARN Memory usage reached threshold usage="82%" threshold="80%" component="worker_pool"`
    } else {
      sample = `${timestamp} INFO User authenticated email="user_${Math.floor(Math.random() * 1000)}@moul.dev" method="oauth2" status=200`
    }

    setLogsList((curr: LogItem[]) => [
      ...curr,
      {
        id: `manual-${Date.now()}`,
        raw: sample,
        message: sample,
        lineNumber: curr.length + 1,
        timestamp: timestamp.slice(11),
        level,
      },
    ])
  }

  const handleReset = () => {
    setLogsList(SERVER_LOGS)
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: tokens.colorBg,
        color: tokens.colorFg,
      }}
    >
      {/* ── Top Navigation Bar ── */}
      <header
        className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200 backdrop-blur-md"
        style={{
          backgroundColor: tokens.colorBgElevated,
          borderColor: tokens.colorBorderSubtle,
          color: tokens.colorFg,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-xs">
            M
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-sm leading-tight"
                style={{ color: tokens.colorFg }}
              >
                Moul Log Engine
              </span>
              <Badge variant="success">Active</Badge>
            </div>
            <span
              className="text-[11px] font-mono leading-tight"
              style={{ color: tokens.colorFgSubtle }}
            >
              cluster: us-east-1a • runtime: v2026.08
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-xs transition-colors"
            style={{
              backgroundColor: tokens.colorBgSubtle,
              borderColor: tokens.colorBorderSubtle,
            }}
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className="text-xs font-medium"
              style={{ color: tokens.colorFg }}
            >
              Live Stream
            </span>
            <Switch
              aria-label="Toggle Live Streaming"
              isSelected={isLiveStreaming}
              onChange={setIsLiveStreaming}
            />
          </div>

          {/* Quick Light/Dark Mode Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onPress={toggleDarkMode}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>

          <ThemeSelector />

          <a
            href="/docs/blocks/logs"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shadow-xs hover:opacity-80"
            style={{
              backgroundColor: tokens.colorBgElevated,
              borderColor: tokens.colorBorderSubtle,
              color: tokens.colorFg,
            }}
          >
            ← Docs
          </a>
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Metric Cards Row using Moul UI Stat component */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat
            variant="elevated"
            label="Total Events"
            value={totalLogs}
            trend="Stream"
            trendDirection="neutral"
          />

          <Stat
            variant="elevated"
            label="Error Rate"
            value={`${errorRate}%`}
            trend={`${errorCount} errors`}
            trendDirection={errorCount > 0 ? 'down' : 'neutral'}
          />

          <Stat
            variant="elevated"
            label="Warnings"
            value={warnCount}
            trend={`${warnCount} warn`}
            trendDirection={warnCount > 0 ? 'neutral' : 'up'}
          />

          <Stat
            variant="elevated"
            label="Avg Latency"
            value="3.12ms"
            trend="-14%"
            trendDirection="up"
            trendLabel="vs p99"
          />
        </div>

        {/* Quick Simulation Bar */}
        <div
          className="flex items-center justify-between p-3.5 rounded-xl border shadow-xs flex-wrap gap-2 transition-colors duration-200"
          style={{
            backgroundColor: tokens.colorBgElevated,
            borderColor: tokens.colorBorderSubtle,
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-semibold"
              style={{ color: tokens.colorFgSubtle }}
            >
              Simulate Events:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleAddSample('info')}
            >
              + Info Log
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => handleAddSample('warn')}
            >
              + Warning Log
            </Button>
            <Button
              variant="danger"
              size="sm"
              onPress={() => handleAddSample('error')}
            >
              + Error Log
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onPress={handleReset}>
              Reset to server.log
            </Button>
          </div>
        </div>

        {/* ── Main Logs Component (Drawer Inspector Enabled) ── */}
        <div
          className="rounded-2xl border shadow-md overflow-hidden transition-colors duration-200"
          style={{
            borderColor: tokens.colorBorderSubtle,
            backgroundColor: tokens.colorBg,
          }}
        >
          <Logs
            data={logsList}
            title="Mould Engine Server Logs"
            inspectorMode="drawer"
            drawerPlacement="right"
            drawerSize="md"
            defaultSelectedKeys={['log-8']}
            maxHeight="580px"
          />
        </div>
      </main>
    </div>
  )
}
