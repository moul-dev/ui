'use client'

import {
  Sidebar,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarAside,
  SidebarMain,
  Stat,
  PercentageCircle,
  PercentageBar,
  LineChart,
  BarChart,
  DoughnutChart,
  TopList,
  TextField,
  Switch,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
  tokens,
} from '@moul-dev/ui'
import React, { useState } from 'react'
import { Logo } from '@/components/logo'
import { ThemeSelector } from '@/components/theme-selector'

// ── Icons ────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const SystemIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const DocsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
  </svg>
)

// ── Mock Data ────────────────────────────────────────────────────────
const kFormatter = (val: number) => {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
  return val.toString()
}

const timeseriesData = [
  { time: '08:00', 'United States': 120, Europe: 80, Asia: 40 },
  { time: '10:00', 'United States': 310, Europe: 150, Asia: 90 },
  { time: '12:00', 'United States': 620, Europe: 240, Asia: 110 },
  { time: '14:00', 'United States': 780, Europe: 310, Asia: 160 },
  { time: '16:00', 'United States': 920, Europe: 430, Asia: 210 },
  { time: '18:00', 'United States': 850, Europe: 390, Asia: 190 },
  { time: '20:00', 'United States': 610, Europe: 280, Asia: 130 },
]

const countryData = [
  { name: 'United States', Requests: 8430 },
  { name: 'Germany', Requests: 4120 },
  { name: 'United Kingdom', Requests: 3290 },
  { name: 'Singapore', Requests: 2840 },
  { name: 'Japan', Requests: 1950 },
]

const deviceData = [
  { name: 'Desktop', value: 65 },
  { name: 'Mobile', value: 28 },
  { name: 'Tablet', value: 7 },
]

const recentActivity = [
  { label: 'api.moul.dev/v1/auth', value: 8930 },
  { label: 'api.moul.dev/v1/users', value: 4820 },
  { label: 'api.moul.dev/v1/metrics', value: 3190 },
  { label: 'api.moul.dev/v1/deploy', value: 1200 },
  { label: 'api.moul.dev/v1/health', value: 450 },
]

export function SidebarPreview() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [allowNotifications, setAllowNotifications] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const deviceLegend = deviceData.map((d, i) => ({
    name: d.name,
    value: `${d.value}%`,
    color: (tokens as any)[`colorChart${(i % 8) + 1}`],
  }))

  return (
    <Sidebar
      isCollapsed={isCollapsed}
      onCollapseChange={setIsCollapsed}
      selectedKey={activeTab}
      onSelectionChange={setActiveTab}
      variant="solid"
      className="transition-colors duration-300"
    >

      {/* ── Sidebar Layout Left ── */}
      <SidebarAside
        showCollapseToggle={true}
        style={{
          '--sidebar-width': '240px',
          '--sidebar-collapsed-width': '68px',
        } as React.CSSProperties}
      >
        <SidebarHeader>
          <Logo iconOnly className="h-7 w-7 text-fd-primary flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-extrabold text-sm leading-tight whitespace-nowrap" style={{ color: tokens.colorFg }}>
                Moul UI
              </span>
              <span className="text-[10px] font-medium font-mono" style={{ color: tokens.colorFgSubtle }}>
                v0.1.0
              </span>
            </div>
          )}
        </SidebarHeader>

        <SidebarDivider />

        <SidebarGroup title="Workspace" collapsible={false}>
          <SidebarItem id="dashboard" icon={<HomeIcon />}>
            Dashboard
          </SidebarItem>
          <SidebarItem id="analytics" icon={<AnalyticsIcon />}>
            Analytics
          </SidebarItem>
          <SidebarItem id="system" icon={<SystemIcon />}>
            System Status
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup title="Account" collapsible={true}>
          <SidebarItem id="settings" icon={<SettingsIcon />}>
            Settings
          </SidebarItem>
        </SidebarGroup>

        <SidebarDivider />

        <SidebarFooter showBorder={false}>
          <div className="w-7 h-7 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
            A
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-[10px] overflow-hidden leading-tight">
              <span className="font-semibold" style={{ color: tokens.colorFg }}>Phearak S. Tha</span>
              <span className="truncate max-w-[120px]" style={{ color: tokens.colorFgSubtle }}>rak@moul.dev</span>
            </div>
          )}
        </SidebarFooter>
      </SidebarAside>

      {/* ── Main Workspace Area Right ── */}
      <SidebarMain>

        {/* Header */}
        <header
          className="h-20 border-b flex items-center justify-between px-8 z-10 flex-shrink-0"
          style={{
            borderColor: tokens.colorBorderSubtle,
            color: tokens.colorFg,
          }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize tracking-tight">
              {activeTab === 'system' ? 'System Status' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSelector />

            <a
              href="/docs/blocks/sidebar"
              className="inline-flex items-center justify-center gap-1.5 font-medium cursor-pointer border transition-colors h-8 px-3 text-xs rounded-lg shadow-xs hover:opacity-90"
              style={{
                backgroundColor: tokens.colorBgElevated,
                borderColor: tokens.colorBorderSubtle,
                color: tokens.colorFg,
              }}
            >
              <DocsIcon />
              <span>Docs</span>
            </a>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-8">

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Stat
                  label="Active Visitors"
                  value="12,842"
                  trend="+14.2%"
                  trendDirection="up"
                  trendLabel="vs last week"
                />
                <Stat
                  label="Average API Latency"
                  value="42ms"
                  trend="-8.4%"
                  trendDirection="down"
                  trendLabel="vs yesterday"
                />
                <Stat
                  label="Cache Hit Rate"
                  value="94.6%"
                  trend="Stable"
                  trendDirection="neutral"
                  trendLabel="vs last hour"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div
                  className="lg:col-span-8 p-6 rounded-2xl border shadow-xs flex flex-col"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: tokens.colorFgSubtle }}>
                    Traffic Performance
                  </h3>
                  <div className="flex-1 min-h-[300px]">
                    <LineChart
                      data={timeseriesData}
                      indexKey="time"
                      categories={['United States', 'Europe', 'Asia']}
                      valueFormatter={kFormatter}
                      height={320}
                    />
                  </div>
                </div>

                <div
                  className="lg:col-span-4 p-6 rounded-2xl border shadow-xs flex flex-col"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: tokens.colorFgSubtle }}>
                    Top API Endpoints
                  </h3>
                  <div className="flex-1 flex items-center">
                    <TopList data={recentActivity} valueFormatter={kFormatter} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div
                  className="lg:col-span-8 p-6 rounded-2xl border shadow-xs"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: tokens.colorFgSubtle }}>
                    Requests by Location
                  </h3>
                  <div className="min-h-[320px]">
                    <BarChart
                      data={countryData}
                      indexKey="name"
                      categories={['Requests']}
                      categorical
                      valueFormatter={kFormatter}
                      height={320}
                    />
                  </div>
                </div>

                <div
                  className="lg:col-span-4 p-6 rounded-2xl border shadow-xs flex flex-col justify-between"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <div>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: tokens.colorFgSubtle }}>
                      Device Split
                    </h3>
                    <div className="flex justify-center py-4">
                      <DoughnutChart
                        data={deviceData}
                        nameKey="name"
                        valueKey="value"
                        valueFormatter={(v) => `${v}%`}
                        height={200}
                      />
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 border-t pt-4"
                    style={{ borderColor: tokens.colorBorderSubtle }}
                  >
                    {deviceLegend.map((item) => (
                      <div key={item.name} className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-medium uppercase" style={{ color: tokens.colorFgSubtle }}>
                          {item.name}
                        </span>
                        <span className="text-sm font-bold mt-0.5" style={{ color: item.color }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className="p-6 rounded-2xl border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <PercentageCircle value={68} label="CPU Load" size={90} />
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold" style={{ color: tokens.colorFgSubtle }}>
                      Status
                    </span>
                    <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 mt-1">
                      Normal Operation
                    </p>
                  </div>
                </div>

                <div
                  className="p-6 rounded-2xl border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <PercentageCircle value={84} label="Memory Usage" size={90} color={tokens.colorChart2} />
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold" style={{ color: tokens.colorFgSubtle }}>
                      Status
                    </span>
                    <p className="text-sm font-bold text-amber-500 dark:text-amber-400 mt-1">
                      High Allocation
                    </p>
                  </div>
                </div>

                <div
                  className="p-6 rounded-2xl border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: tokens.colorBgElevated,
                    borderColor: tokens.colorBorderSubtle,
                    color: tokens.colorFg,
                  }}
                >
                  <PercentageCircle value={12} label="Disk IO" size={90} color={tokens.colorChart3} />
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold" style={{ color: tokens.colorFgSubtle }}>
                      Status
                    </span>
                    <p className="text-sm font-bold text-emerald-500 dark:text-emerald-400 mt-1">
                      Optimal
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="p-6 rounded-2xl border shadow-xs space-y-6"
                style={{
                  backgroundColor: tokens.colorBgElevated,
                  borderColor: tokens.colorBorderSubtle,
                  color: tokens.colorFg,
                }}
              >
                <h3 className="text-sm font-semibold" style={{ color: tokens.colorFgSubtle }}>
                  Background Tasks Queue
                </h3>
                <div className="space-y-4">
                  <PercentageBar value={95} label="Log Compilation Pipeline" size="md" color={tokens.colorChart7} />
                  <PercentageBar value={42} label="Elasticsearch Index Optimization" size="md" color={tokens.colorChart5} />
                  <PercentageBar value={15} label="S3 Archival Sync" size="md" color={tokens.colorChart6} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div
              className="max-w-xl rounded-2xl border p-8 shadow-xs space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{
                backgroundColor: tokens.colorBgElevated,
                borderColor: tokens.colorBorderSubtle,
                color: tokens.colorFg,
              }}
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">Console Configuration</h3>
                <p className="text-sm" style={{ color: tokens.colorFgSubtle }}>
                  Manage global simulation settings and components preview options.
                </p>
              </div>

              <div className="space-y-6">
                <TextField
                  label="Workspace Alias"
                  placeholder="Enter workspace name"
                  defaultValue="Moul Premium Workspace"
                  description="This changes the label displayed under account settings."
                />

                <div className="space-y-4 pt-2">
                  <Switch
                    isSelected={allowNotifications}
                    onChange={setAllowNotifications}
                  >
                    Allow Live Activity Stream
                  </Switch>

                  <Switch
                    isSelected={maintenanceMode}
                    onChange={setMaintenanceMode}
                  >
                    Simulate API Outage State
                  </Switch>
                </div>

                <div
                  className="space-y-3 pt-4 border-t"
                  style={{ borderColor: tokens.colorBorderSubtle }}
                >
                  <h4 className="text-sm font-semibold">Confirm Administrative Code</h4>
                  <p className="text-xs" style={{ color: tokens.colorFgSubtle }}>
                    A test verification input OTP for security authorization checks.
                  </p>

                  <div className="pt-2">
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={setOtpValue}
                      pattern={REGEXP_ONLY_DIGITS}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </SidebarMain>

      {/* ── Subtitle Floating Navigation Overlay ── */}
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border backdrop-blur-md select-none scale-100 hover:scale-105 transition-all duration-200"
        style={{
          backgroundColor: tokens.colorBgElevated,
          borderColor: tokens.colorBorder,
          color: tokens.colorFg,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">Live Demo View</span>
        </div>
        <div className="h-4 w-[1px]" style={{ backgroundColor: tokens.colorBorderSubtle }} />
        <a
          href="/docs/blocks/sidebar"
          className="text-xs font-bold hover:underline transition-all cursor-pointer flex items-center gap-1 focus:outline-none"
          style={{ color: tokens.colorFg }}
        >
          <span>Exit Preview</span>
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </a>
      </div>

    </Sidebar>
  )
}

