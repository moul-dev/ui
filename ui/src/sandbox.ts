/**
 * Moul UI - Pure Lit Web Components Interactive Kitchen Sink Sandbox
 *
 * Demonstrates all 6 component categories within a top-level <moul-sidebar> shell:
 * 1. Actions (Button, ButtonGroup, ToggleButton, ToggleButtonGroup)
 * 2. Surfaces & Feedback (Card, Alert, Badge, Avatar, Typography, Separator, Kbd, Spinner, Skeleton, ProgressBar, TagGroup, EmptyState, Table, Toast)
 * 3. Overlays & Navigation (Modal, AlertDialog, Drawer, Popover, Tooltip, CommandPalette, Tabs, Breadcrumbs, Pagination, Link)
 * 4. Forms & Inputs (Form, TextField, TextArea, NumberField, SearchField, InputOTP, Select, ComboBox, Switch, Slider, Checkbox, CheckboxGroup, RadioGroup, DatePicker, Calendar)
 * 5. Charts & Analytics (LineChart, AreaChart, BarChart, DoughnutChart, HeatmapChart, FunnelChart, Stat, PercentageBar, PercentageCircle, TopList)
 * 6. Composite Blocks (Sidebar, SidebarUser, Logs, LogsViewer)
 *
 * Supports interactive light/dark theme toggling via document.documentElement.dataset.theme.
 * Zero React or JSX dependencies.
 */

import {
  type CSSResultGroup,
  css,
  html,
  LitElement,
  nothing,
  type TemplateResult,
} from 'lit'
import { defineElement } from './utils/define-element'
import './index'
import { fireConfetti } from './effects'
import {
  type CommandPaletteItemData,
  type FileUploadContext,
  type MoulActivityFeed,
  type MoulAnimatedList,
  type MoulButton,
  type MoulChat,
  type MoulFocusMode,
  type MoulLineChart,
  type MoulNotificationBell,
  type MoulNumberTicker,
  type MoulResultCard,
  type MoulSlideToConfirm,
  type MoulStepper,
  type MoulTour,
  type PromptSubmitDetail,
  SERVER_LOG_RAW,
  SERVER_LOGS,
  type TableColumn,
  toastQueue,
} from './index'

const TABLE_COLUMNS: TableColumn[] = [
  { key: 'name', title: 'User' },
  { key: 'role', title: 'Role' },
  {
    key: 'status',
    title: 'Status',
    filterOptions: ['Active', 'In Review', 'Away'].map((value) => ({
      value,
      label: value,
    })),
  },
  { key: 'activity', title: 'Last Active', sortable: false },
]

const SB_AGENT_STEPS = [
  {
    id: 'plan',
    title: 'Reading the question',
    detail: 'The newest posts are wanted.',
    duration: 420,
  },
  {
    id: 'list',
    tool: 'list_records',
    title: 'Read the newest posts',
    input: { collection: 'posts', sort: '-created', perPage: 3 },
    output: { items: [{ id: 'rec_8f2k', title: 'Release notes' }] },
    duration: 980,
  },
]

const SB_CHAT_ANSWER = [
  'There are **3 collections**:',
  '',
  '| Collection | Records |',
  '| :-- | --: |',
  '| `posts` | 128 |',
  '| `users` | 42 |',
  '| `comments` | 1,204 |',
  '',
  'Ask for one by name to see its fields.',
].join('\n')

const SB_VERSIONS = [
  {
    id: 'v3',
    label: 'Published',
    author: 'Kim Ly',
    timestamp: Date.now() - 2 * 3_600_000,
    summary: 'Status set to published',
    changes: [{ field: 'Status', before: 'Draft', after: 'Published' }],
  },
  {
    id: 'v2',
    label: 'Title edited',
    author: 'Dara',
    timestamp: Date.now() - 26 * 3_600_000,
    changes: [{ field: 'Title', before: 'Hello', after: 'Hello, world' }],
  },
  {
    id: 'v1',
    label: 'Created',
    author: 'Dara',
    timestamp: Date.now() - 3 * 86_400_000,
  },
]

const SB_FILES = [
  'src/index.ts',
  'src/components/Button.ts',
  'src/components/CodeBlock.ts',
  'src/styles/style.css',
  'docs/index.mdx',
  'package.json',
  'README.md',
]

const SB_GRAPH = {
  nodes: [
    { id: 'web', label: 'Web app', group: 'Clients' },
    { id: 'admin', label: 'Admin console', group: 'Clients' },
    { id: 'api', label: 'API', group: 'Services' },
    { id: 'auth', label: 'Auth', group: 'Services' },
    { id: 'db', label: 'Postgres', group: 'Data' },
    { id: 'files', label: 'File store', group: 'Data' },
  ],
  links: [
    { source: 'web', target: 'api' },
    { source: 'admin', target: 'api' },
    { source: 'api', target: 'auth' },
    { source: 'api', target: 'db' },
    { source: 'api', target: 'files' },
    { source: 'auth', target: 'db' },
  ],
}

const SB_CODE_TABS = [
  { label: 'bun', code: 'bun add @moul-dev/web-component' },
  { label: 'npm', code: 'npm install @moul-dev/web-component' },
  { label: 'pnpm', code: 'pnpm add @moul-dev/web-component' },
]

/** Pretends to upload a file in about two seconds, reporting progress. */
const fakeUpload = (_file: File, { signal, onProgress }: FileUploadContext) =>
  new Promise((resolve, reject) => {
    let percent = 0
    const timer = setInterval(() => {
      percent += 10
      onProgress(Math.min(percent, 100))
      if (percent >= 100) {
        clearInterval(timer)
        resolve({ ok: true })
      }
    }, 200)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      reject(signal.reason)
    })
  })

const TABLE_DATA: Record<string, unknown>[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Staff Engineer',
    status: 'Active',
    activity: '2m ago',
  },
  {
    id: '2',
    name: 'Marcus Brody',
    role: 'Product Designer',
    status: 'In Review',
    activity: '15m ago',
  },
  {
    id: '3',
    name: 'Elena Rostova',
    role: 'DevOps Lead',
    status: 'Active',
    activity: '1h ago',
  },
  {
    id: '4',
    name: 'Devon Vance',
    role: 'Security Architect',
    status: 'Away',
    activity: '3h ago',
  },
]

// Two weeks of daily points for the stat sparklines, ending Oct 20.
const STAT_DAYS = Array.from({ length: 14 }, (_, i) => `Oct ${7 + i}`)

const CHART_DATA: Record<string, unknown>[] = [
  { month: 'Jan', desktop: 186, mobile: 80, revenue: 2400 },
  { month: 'Feb', desktop: 305, mobile: 200, revenue: 3800 },
  { month: 'Mar', desktop: 237, mobile: 120, revenue: 2900 },
  { month: 'Apr', desktop: 273, mobile: 190, revenue: 3200 },
  { month: 'May', desktop: 209, mobile: 130, revenue: 2800 },
  { month: 'Jun', desktop: 314, mobile: 240, revenue: 4100 },
]

const DOUGHNUT_DATA = [
  { label: 'Direct', value: 440 },
  { label: 'Organic', value: 320 },
  { label: 'Referral', value: 180 },
  { label: 'Social', value: 110 },
]

const TOP_LIST_DATA = [
  { label: 'Chrome', value: 65 },
  { label: 'Safari', value: 19 },
  { label: 'Firefox', value: 10 },
  { label: 'Edge', value: 6 },
]

/** Seeded PRNG so the demo calendar looks the same on every reload. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A year of commit-like events ending today: busy weekdays, quiet weekends, a few idle weeks.
const ACTIVITY_EVENTS = (() => {
  const random = mulberry32(7)
  const today = new Date()
  const hours = [9, 10, 10, 11, 11, 13, 14, 14, 15, 15, 16, 17, 20, 22]
  const events: { date: Date; value: number }[] = []
  const idleWeeks = new Set(
    Array.from({ length: 54 }, (_, week) => week).filter(() => random() < 0.1),
  )
  for (let back = 370; back >= 0; back--) {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - back,
    )
    const isWeekend = day.getDay() === 0 || day.getDay() === 6
    if (idleWeeks.has(Math.floor(back / 7)) && random() < 0.85) continue
    if (random() < (isWeekend ? 0.55 : 0.12)) continue
    const count = Math.round(random() ** 1.6 * (isWeekend ? 6 : 13)) + 1
    for (let i = 0; i < count; i++) {
      const hour = hours[Math.floor(random() * hours.length)]
      events.push({
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour),
        value: 1,
      })
    }
  }
  return events
})()

const FUNNEL_DATA = [
  { label: 'Visited site', value: 48200 },
  { label: 'Signed up', value: 15840 },
  { label: 'Created project', value: 9120 },
  { label: 'Invited a teammate', value: 4210 },
  { label: 'Started paid plan', value: 1380 },
]

const COMMAND_ITEMS: CommandPaletteItemData[] = [
  { id: 'new', title: 'New project', group: 'Create', shortcut: '⌘N' },
  { id: 'invite', title: 'Invite teammate', group: 'Create' },
  {
    id: 'deploy',
    title: 'Deploy to production',
    group: 'Actions',
    description: 'Promote the latest preview',
  },
  { id: 'logs', title: 'Open logs', group: 'Actions', shortcut: '⌘L' },
  { id: 'theme', title: 'Toggle theme', group: 'Preferences' },
]

type ToastPlacement = typeof toastQueue.placement

const TOAST_PLACEMENTS: ToastPlacement[] = [
  'top-start',
  'top-center',
  'top-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
]

export class MoulSandbox extends LitElement {
  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      min-height: 100vh;
      width: 100%;
      background-color: var(--color-bg, #09090b);
      color: var(--color-fg, #fafafa);
      font-family: var(--font-family-base, 'Google Sans', system-ui, -apple-system, sans-serif);
      box-sizing: border-box;
    }

    *, *::before, *::after {
      box-sizing: inherit;
    }

    moul-sidebar {
      min-height: 100vh;
      width: 100%;
    }

    .sandbox-content {
      padding: var(--spacing-6, 1.5rem);
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 1.5rem);
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-4, 1rem);
      padding-bottom: var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1));
    }

    .brand-title {
      font-size: var(--font-size-2xl, 1.5rem);
      font-weight: var(--font-weight-bold, 700);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .brand-desc {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle, #a1a1aa);
      margin: 0.25rem 0 0 0;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      flex-wrap: wrap;
    }

    .category-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 1rem);
      padding: var(--spacing-4, 1rem) 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      padding-bottom: var(--spacing-2, 0.5rem);
    }

    .section-title {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-semibold, 600);
      margin: 0;
    }

    .section-subtitle {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #a1a1aa);
      margin: 0;
    }

    .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--spacing-4, 1rem);
    }

    .stat-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .demo-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      background: var(--color-surface, #ffffff);
      box-shadow: var(--shadow-surface);
      border-radius: var(--radius-surface, 1.5rem);
      padding: var(--spacing-4, 1rem);
    }

    .group-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-fg-subtle, #a1a1aa);
    }

    .demo-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      flex-wrap: wrap;
    }

    .demo-col {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
    }

    .feed-item {
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
      background: var(--color-bg-subtle);
      font-size: var(--font-size-sm, 0.875rem);
    }

    .logo-box {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm, 0.375rem);
      background: var(--color-primary-500, #6366f1);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .popover-box {
      padding: var(--spacing-3, 0.75rem);
      max-width: 220px;
    }
  `

  static override properties = {
    selectedCategory: { type: String, state: true },
    theme: { type: String, state: true },
    counter: { type: Number, state: true },
    isPending: { type: Boolean, state: true },
    isModalOpen: { type: Boolean, state: true },
    isAlertModalOpen: { type: Boolean, state: true },
    isCommandPaletteOpen: { type: Boolean, state: true },
    activeDrawer: { type: String, state: true },
    toggleKey: { type: String, state: true },
    sliderValue: { type: Number, state: true },
    switchValue: { type: Boolean, state: true },
    currentPage: { type: Number, state: true },
    selectedTab: { type: String, state: true },
    textValue: { type: String, state: true },
    activityMode: { type: String, state: true },
  }

  declare selectedCategory: string
  declare theme: 'light' | 'dark'
  declare counter: number
  declare isPending: boolean
  declare isModalOpen: boolean
  declare isAlertModalOpen: boolean
  declare isCommandPaletteOpen: boolean
  declare activeDrawer: '' | 'left' | 'right' | 'bottom'
  declare toggleKey: string
  declare sliderValue: number
  declare switchValue: boolean
  declare currentPage: number
  declare selectedTab: string
  declare textValue: string
  declare activityMode: 'calendar' | 'hour'

  constructor() {
    super()
    this.selectedCategory = 'all'
    this.theme = 'dark'
    this.counter = 0
    this.isPending = false
    this.isModalOpen = false
    this.isAlertModalOpen = false
    this.isCommandPaletteOpen = false
    this.activeDrawer = ''
    this.toggleKey = 'day'
    this.sliderValue = 42
    this.switchValue = true
    this.currentPage = 1
    this.selectedTab = 'overview'
    this.textValue = 'Hello Web Components'
    this.activityMode = 'calendar'
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (typeof document !== 'undefined') {
      const currentTheme =
        document.documentElement.dataset.theme ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
      document.documentElement.dataset.theme = currentTheme
      this.theme = currentTheme === 'dark' ? 'dark' : 'light'
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  public toggleTheme(): void {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark'
    this.theme = nextTheme
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = nextTheme
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    toastQueue.add({
      title: 'Theme Toggled',
      description: `Active color scheme is now ${nextTheme}.`,
      tone: 'primary',
      duration: 2500,
    })
  }

  private triggerUndoToast(): void {
    toastQueue.add({
      title: '3 rows deleted',
      description: 'They stay in the trash for 30 days.',
      duration: 8000,
      showCountdown: true,
      action: {
        label: 'Undo',
        onAction: () =>
          toastQueue.add({
            title: 'Rows restored',
            tone: 'success',
            duration: 2500,
          }),
      },
    })
  }

  private triggerStackedToasts(): void {
    toastQueue.isStacked = true
    ;['Build queued', 'Preview ready', 'Tests passed'].forEach((title, i) => {
      setTimeout(() => toastQueue.add({ title, duration: 5000 }), i * 180)
    })
  }

  /** Pretends to take a payment: pending for a moment, then success and confetti. */
  private async runPayment(): Promise<void> {
    const card = this.renderRoot.querySelector<MoulResultCard>('#sb-result')
    if (!card) return
    card.status = 'pending'
    card.heading = 'Processing payment'
    card.description = 'This takes a few seconds.'
    await new Promise((resolve) => setTimeout(resolve, 1600))
    card.status = 'success'
    card.heading = 'Payment sent'
    card.description = '$42.00 to Dara Sok.'
    void fireConfetti({ origin: card })
  }

  private sandboxEventCount = 0

  /** Adds a made-up event to the top of the sandbox feed and the bell. */
  private addSandboxEvent(): void {
    const events = [
      'Invoice #1043 paid',
      'New sign-up from Battambang',
      'Backup finished',
      'Deploy to production succeeded',
    ]
    const text = events[this.sandboxEventCount++ % events.length]
    const feed = this.renderRoot.querySelector<MoulAnimatedList>('#sb-feed')
    const bell = this.renderRoot.querySelector<MoulNotificationBell>('#sb-bell')
    if (feed) {
      const item = document.createElement('div')
      item.className = 'feed-item'
      item.textContent = text
      feed.prepend(item)
      const extra = feed.items.slice(4)
      for (const old of extra) void feed.removeItem(old)
    }
    if (bell) {
      const item = document.createElement('div')
      item.textContent = text
      bell.prepend(item)
      bell.count += 1
    }
  }

  private sandboxRequestCount = 0

  private pushSandboxRequest(): void {
    const feed = this.renderRoot.querySelector<MoulActivityFeed>('#sb-activity')
    const n = ++this.sandboxRequestCount
    const status = [200, 201, 404, 500][n % 4] as number
    feed?.push({
      id: `sb-${n}`,
      title: `${status === 201 ? 'POST' : 'GET'} /api/records/${n}`,
      badge: String(status),
      tone: status >= 500 ? 'error' : status >= 400 ? 'warning' : 'success',
      timestamp: Date.now(),
      payload: { status, record: { id: n, title: `Record ${n}` } },
    })
    const chart = this.renderRoot.querySelector<MoulLineChart>('#sb-live')
    chart?.push({ t: `#${n}`, value: 40 + Math.round(Math.random() * 50) })
  }

  private sandboxChatCount = 0

  /** A scripted agent: one tool call, then a streamed answer. */
  private async answerSandboxChat(
    e: CustomEvent<PromptSubmitDetail>,
  ): Promise<void> {
    const chat = e.currentTarget as MoulChat
    const n = ++this.sandboxChatCount
    const reply = `a${n}`
    chat.push(
      { id: `u${n}`, role: 'user', content: e.detail.value },
      { id: reply, role: 'assistant', status: 'pending' },
    )
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await wait(500)
    chat.pushSteps(reply, {
      id: 'call',
      tool: 'list_collections',
      title: 'List the collections',
      input: {},
      status: 'running',
      startedAt: Date.now(),
    })
    await wait(900)
    chat.pushSteps(reply, {
      id: 'call',
      status: 'done',
      output: ['posts', 'users', 'comments'],
      endedAt: Date.now(),
    })
    for (let i = 0; i < SB_CHAT_ANSWER.length; i += 6) {
      if (!chat.messages.some((m) => m.id === reply && m.status !== 'done'))
        return
      chat.appendText(reply, SB_CHAT_ANSWER.slice(i, i + 6))
      await wait(30)
    }
    chat.updateMessage(reply, { status: 'done' })
  }

  private stopSandboxChat(e: Event): void {
    const chat = e.currentTarget as MoulChat
    const busy = chat.messages.find(
      (m) =>
        m.role === 'assistant' && m.status !== 'done' && m.status !== 'error',
    )
    if (busy) chat.updateMessage(busy.id, { status: 'done' })
  }

  private handleSidebarSelect(e: CustomEvent<{ selectedKey: string }>): void {
    if (e.detail?.selectedKey) {
      this.selectedCategory = e.detail.selectedKey
    }
  }

  private triggerToast(
    tone: 'primary' | 'accent' | 'success' | 'warning' | 'error',
  ): void {
    toastQueue.add({
      title: `${tone.toUpperCase()} Notification`,
      description: `Dispatched toast notification with ${tone} semantic tone.`,
      tone,
      duration: 3500,
    })
  }

  private triggerPlacedToast(placement: ToastPlacement): void {
    toastQueue.placement = placement
    toastQueue.add({
      title: `Placed at ${placement}`,
      description: 'Bottom regions stack upward, top regions stack downward.',
      tone: 'primary',
      duration: 3500,
    })
  }

  private handleCommandSelect(
    e: CustomEvent<{ item: CommandPaletteItemData }>,
  ): void {
    const { item } = e.detail
    if (item.id === 'theme') {
      this.toggleTheme()
      return
    }
    toastQueue.add({
      title: item.title,
      description: `Command "${item.id}" selected from the palette.`,
      tone: 'primary',
      duration: 2500,
    })
  }

  private handleDrawerOpenChange(e: CustomEvent<{ isOpen: boolean }>): void {
    if (!e.detail.isOpen) {
      this.activeDrawer = ''
    }
  }

  private handleFormSubmit(e: CustomEvent<{ formData: FormData }>): void {
    const fields = Array.from(e.detail.formData.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')
    toastQueue.add({
      title: 'Form Submitted',
      description: fields || 'No named fields were submitted.',
      tone: 'success',
      duration: 3500,
    })
  }

  private renderActionsSection(): TemplateResult {
    return html`
      <div class="category-section" id="actions">
        <div class="section-header">
          <h3 class="section-title">1. Actions & Toggles</h3>
          <p class="section-subtitle">moul-button, moul-button-group, moul-split-button, moul-theme-toggle, moul-slide-to-confirm, moul-toggle-button, moul-toggle-button-group</p>
        </div>

        <div class="demo-group">
          <span class="group-label">Button Variants</span>
          <div class="demo-row">
            <moul-button variant="primary">Primary</moul-button>
            <moul-button variant="secondary">Secondary</moul-button>
            <moul-button variant="tertiary">Tertiary</moul-button>
            <moul-button variant="outline">Outline</moul-button>
            <moul-button variant="ghost">Ghost</moul-button>
            <moul-button variant="danger">Danger</moul-button>
            <moul-button variant="danger-soft">Danger Soft</moul-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Sizes & Interactive States</span>
          <div class="demo-row">
            <moul-button size="sm">Small</moul-button>
            <moul-button size="md">Medium</moul-button>
            <moul-button size="lg">Large</moul-button>
            <moul-button
              ?is-pending=${this.isPending}
              @click=${() => {
                this.isPending = !this.isPending
              }}
            >
              ${this.isPending ? 'Pending State' : 'Toggle Pending'}
            </moul-button>
            <moul-button is-disabled>Disabled Button</moul-button>
            <moul-button
              variant="outline"
              @click=${() => {
                this.counter++
              }}
            >
              Interactive Counter: ${this.counter}
            </moul-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Button States</span>
          <div class="demo-row">
            <moul-button
              @press=${(e: Event) =>
                (e.currentTarget as MoulButton)
                  .run(
                    () => new Promise((resolve) => setTimeout(resolve, 1200)),
                  )
                  .catch(() => {})}
            >
              Save
              <span slot="pending">Saving…</span>
              <span slot="success">Saved</span>
            </moul-button>
            <moul-button
              variant="outline"
              @press=${(e: Event) =>
                (e.currentTarget as MoulButton)
                  .run(
                    () =>
                      new Promise((_, reject) =>
                        setTimeout(
                          () => reject(new Error('Network error')),
                          1200,
                        ),
                      ),
                  )
                  .catch(() => {})}
            >
              Publish
              <span slot="error">Try again</span>
            </moul-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Split Buttons</span>
          <div class="demo-row">
            <moul-split-button
              menu-label="More deploy options"
              @press=${() => this.triggerToast('success')}
              @action=${(e: CustomEvent<{ value: string }>) =>
                console.log('[sandbox] split action', e.detail.value)}
            >
              Deploy
              <moul-menu-item slot="menu" value="staging">Deploy to staging</moul-menu-item>
              <moul-menu-separator slot="menu"></moul-menu-separator>
              <moul-menu-item slot="menu" value="schedule">Schedule deploy…</moul-menu-item>
            </moul-split-button>
            <moul-split-button variant="outline" menu-label="More save options">
              Save
              <moul-menu-item slot="menu" value="save-as">Save as…</moul-menu-item>
            </moul-split-button>
            <moul-split-button is-disabled>
              Deploy
              <moul-menu-item slot="menu" value="staging">Deploy to staging</moul-menu-item>
            </moul-split-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Theme Toggle</span>
          <div class="demo-row">
            <moul-theme-toggle></moul-theme-toggle>
            <moul-theme-toggle modes="light dark" variant="outline"></moul-theme-toggle>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Button Group & Toggle Controls</span>
          <div class="demo-row">
            <moul-button-group spacing="none">
              <moul-button variant="outline">Left</moul-button>
              <moul-button variant="outline">Center</moul-button>
              <moul-button variant="outline">Right</moul-button>
            </moul-button-group>

            <moul-toggle-button value="starred" aria-label="Toggle favorite">
              ★ Starred
            </moul-toggle-button>

            <moul-toggle-button-group
              selected-key=${this.toggleKey}
              @change=${(e: Event) => {
                const target = e.target as HTMLElement & {
                  selectedKey?: string
                }
                if (target?.selectedKey) {
                  this.toggleKey = target.selectedKey
                }
              }}
            >
              <moul-toggle-button value="day">Day</moul-toggle-button>
              <moul-toggle-button value="week">Week</moul-toggle-button>
              <moul-toggle-button value="month">Month</moul-toggle-button>
            </moul-toggle-button-group>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Slide to Confirm</span>
          <moul-slide-to-confirm
            tone="error"
            label="Slide to delete project"
            confirmed-label="Deleted"
            style="max-width: 22rem;"
            @confirm=${(e: Event) => {
              const slider = e.currentTarget as MoulSlideToConfirm
              setTimeout(() => slider.reset(), 1500)
            }}
          ></moul-slide-to-confirm>
        </div>
      </div>
    `
  }

  private renderSurfacesSection(): TemplateResult {
    return html`
      <div class="category-section" id="surfaces">
        <div class="section-header">
          <h3 class="section-title">2. Surfaces & Feedback</h3>
          <p class="section-subtitle">moul-card, moul-alert, moul-badge, moul-avatar, moul-typography, moul-separator, moul-skeleton, moul-tag-group, moul-empty-state, moul-accordion, moul-icon-morph, moul-number-ticker, moul-spinner, moul-animated-list, moul-notification-bell, moul-step-loader, moul-result-card, moul-pull-to-refresh, moul-expandable-card, moul-table, moul-toast, toastQueue</p>
        </div>

        <div class="section-grid">
          <moul-card tone="primary" variant="flat">
            <moul-card-header>
              <h4 style="margin: 0;">Flat Surface Card</h4>
            </moul-card-header>
            <moul-card-body>
              <p style="margin: 0; font-size: 0.875rem;">
                Standard surface container adhering to the OKLCH design token scale.
              </p>
            </moul-card-body>
            <moul-card-footer>
              <moul-badge tone="primary">Primary Tone</moul-badge>
            </moul-card-footer>
          </moul-card>

          <moul-card tone="accent" variant="bordered">
            <moul-card-header>
              <h4 style="margin: 0;">Bordered Card</h4>
            </moul-card-header>
            <moul-card-body>
              <p style="margin: 0; font-size: 0.875rem;">
                Bordered surface with subtle container outline.
              </p>
            </moul-card-body>
            <moul-card-footer>
              <moul-badge tone="accent">Accent Tone</moul-badge>
            </moul-card-footer>
          </moul-card>

          <moul-card tone="success" variant="glass">
            <moul-card-header>
              <h4 style="margin: 0;">Glass Surface</h4>
            </moul-card-header>
            <moul-card-body>
              <p style="margin: 0; font-size: 0.875rem;">
                Backdrop-filter blur progressive enhancement with solid fallback.
              </p>
            </moul-card-body>
            <moul-card-footer>
              <moul-badge tone="success">Glassmorphism</moul-badge>
            </moul-card-footer>
          </moul-card>
        </div>

        <div class="demo-group">
          <span class="group-label">Typography & Separators</span>
          <moul-typography variant="h1">Display heading</moul-typography>
          <moul-typography variant="h3">Section heading</moul-typography>
          <moul-typography variant="body">
            Body copy sits comfortably at 16px with a 1.5 line height.
          </moul-typography>
          <moul-typography variant="caption">Caption — secondary detail</moul-typography>
          <moul-separator></moul-separator>
          <div class="demo-row" style="height: 1.5rem;">
            <moul-typography variant="code">bun add @moul-dev/web-component</moul-typography>
            <moul-separator orientation="vertical"></moul-separator>
            <moul-typography variant="body" tone="success">Toned text</moul-typography>
            <moul-separator orientation="vertical"></moul-separator>
            <moul-typography variant="body" tone="error">Error tone</moul-typography>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Semantic Alerts</span>
          <div class="demo-col">
            <moul-alert tone="primary" title="Information Note" description="System update scheduled for 02:00 UTC." is-dismissible></moul-alert>
            <moul-alert tone="success" title="Deployment Successful" description="Release v2026.10 deployed to edge cluster." is-dismissible></moul-alert>
            <moul-alert tone="warning" title="Resource Utilization" description="Memory threshold at 84% on worker node." is-dismissible></moul-alert>
            <moul-alert tone="error" title="Certificate Alert" description="TLS certificate renewals required within 48 hours." is-dismissible></moul-alert>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Avatars, Badges & Feedback Controls</span>
          <div class="demo-row">
            <moul-avatar name="Sarah Chen" status="online" size="lg"></moul-avatar>
            <moul-avatar name="Marcus Brody" status="away" size="md"></moul-avatar>
            <moul-avatar name="Elena Rostova" status="busy" size="md"></moul-avatar>
            <moul-avatar-group max="3">
              <moul-avatar name="Devon Vance" size="sm"></moul-avatar>
              <moul-avatar name="Alex Miller" size="sm"></moul-avatar>
              <moul-avatar name="Jordan Reed" size="sm"></moul-avatar>
              <moul-avatar name="Taylor Swift" size="sm"></moul-avatar>
            </moul-avatar-group>

            <moul-badge tone="primary">Primary</moul-badge>
            <moul-badge tone="success" is-dot>Live</moul-badge>
            <moul-badge tone="warning">Pending</moul-badge>
            <moul-badge tone="error">Failed</moul-badge>

            <moul-spinner size="sm"></moul-spinner>
            <moul-spinner size="md"></moul-spinner>
            <moul-kbd>⌘</moul-kbd>
            <moul-kbd>K</moul-kbd>
          </div>

          <moul-progress-bar value="68" tone="primary" show-label label="Processing Pipeline"></moul-progress-bar>
        </div>

        <div class="section-grid">
          <div class="demo-group">
            <span class="group-label">Skeleton Placeholders</span>
            <div class="demo-row" style="flex-wrap: nowrap; align-items: flex-start;">
              <moul-skeleton shape="circle" width="3rem" height="3rem"></moul-skeleton>
              <div class="demo-col" style="flex: 1; gap: 0.5rem;">
                <moul-skeleton shape="line" width="60%" variant="pulse"></moul-skeleton>
                <moul-skeleton shape="line" width="90%" variant="wave"></moul-skeleton>
                <moul-skeleton shape="rect" height="4rem" variant="wave"></moul-skeleton>
              </div>
            </div>
          </div>

          <div class="demo-group">
            <span class="group-label">Tag Groups</span>
            <moul-tag-group label="Stack" selection-mode="multiple">
              <moul-tag key="astro">Astro</moul-tag>
              <moul-tag key="lit" is-selected>Lit</moul-tag>
              <moul-tag key="ts" is-selected>TypeScript</moul-tag>
              <moul-tag key="bun">Bun</moul-tag>
            </moul-tag-group>
            <moul-tag-group label="Filters" is-removable>
              <moul-tag key="prod" tone="success">production</moul-tag>
              <moul-tag key="ap" tone="accent">ap-southeast</moul-tag>
              <moul-tag key="err" tone="error">errors only</moul-tag>
            </moul-tag-group>
          </div>
        </div>

        <moul-empty-state variant="glass">
          <span slot="icon" style="font-size: 1.75rem;">📦</span>
          <span slot="title">No deployments yet</span>
          <span slot="description">Push a commit or trigger a build to see it here.</span>
          <div slot="actions" class="demo-row">
            <moul-button size="sm" @click=${() => this.triggerToast('success')}>
              New deployment
            </moul-button>
            <moul-button size="sm" variant="ghost">Read the docs</moul-button>
          </div>
        </moul-empty-state>

        <div class="demo-group">
          <span class="group-label">Toast Tones & Placement</span>
          <div class="demo-row">
            <moul-button variant="secondary" @click=${() => this.triggerToast('primary')}>Primary</moul-button>
            <moul-button variant="secondary" @click=${() => this.triggerToast('accent')}>Accent</moul-button>
            <moul-button variant="secondary" @click=${() => this.triggerToast('success')}>Success</moul-button>
            <moul-button variant="secondary" @click=${() => this.triggerToast('warning')}>Warning</moul-button>
            <moul-button variant="secondary" @click=${() => this.triggerToast('error')}>Error</moul-button>
          </div>
          <div class="demo-row">
            ${TOAST_PLACEMENTS.map(
              (placement) => html`
                <moul-button
                  variant="outline"
                  size="sm"
                  @click=${() => this.triggerPlacedToast(placement)}
                >
                  ${placement}
                </moul-button>
              `,
            )}
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Accordion & Icon Morph</span>
          <moul-accordion variant="separated">
            <moul-accordion-item value="shipping" heading="How long does shipping take?" is-open>
              Next day inside Phnom Penh, two to three days elsewhere.
            </moul-accordion-item>
            <moul-accordion-item value="returns" heading="Can I return an item?">
              Within 30 days, unused and in its original packaging.
            </moul-accordion-item>
            <moul-accordion-item value="sso" heading="Single sign-on" is-disabled>
              Available on the Business plan.
            </moul-accordion-item>
          </moul-accordion>
          <div class="demo-row">
            <moul-button
              variant="secondary"
              is-icon
              aria-label="Toggle menu icon"
              @click=${(e: Event) => {
                const icon = (e.currentTarget as HTMLElement).querySelector(
                  'moul-icon-morph',
                )
                if (icon) icon.name = icon.name === 'close' ? 'menu' : 'close'
              }}
            >
              <moul-icon-morph name="menu"></moul-icon-morph>
            </moul-button>
            <moul-button
              variant="secondary"
              is-icon
              aria-label="Toggle play icon"
              @click=${(e: Event) => {
                const icon = (e.currentTarget as HTMLElement).querySelector(
                  'moul-icon-morph',
                )
                if (icon) icon.name = icon.name === 'pause' ? 'play' : 'pause'
              }}
            >
              <moul-icon-morph name="play"></moul-icon-morph>
            </moul-button>
            <moul-button
              variant="secondary"
              is-icon
              aria-label="Toggle sun icon"
              @click=${(e: Event) => {
                const icon = (e.currentTarget as HTMLElement).querySelector(
                  'moul-icon-morph',
                )
                if (icon) icon.name = icon.name === 'moon' ? 'sun' : 'moon'
              }}
            >
              <moul-icon-morph name="sun"></moul-icon-morph>
            </moul-button>
            <moul-icon-morph name="loader" size="md"></moul-icon-morph>
          </div>
        </div>

        <div class="section-grid">
          <div class="demo-group">
            <span class="group-label">Number Ticker & Badge Counts</span>
            <div class="demo-row">
              <moul-number-ticker
                id="sb-ticker"
                value="1280"
                from="0"
                style="font-size: 2rem; font-weight: 600;"
              ></moul-number-ticker>
              <moul-badge id="sb-count" tone="error" variant="solid" count="3"></moul-badge>
              <moul-badge count="120"></moul-badge>
              <moul-badge tone="success" is-live>Live</moul-badge>
              <moul-badge tone="success" is-dot is-live aria-label="Online"></moul-badge>
            </div>
            <div class="demo-row">
              <moul-button
                size="sm"
                variant="secondary"
                @click=${() => {
                  const ticker =
                    this.renderRoot.querySelector<MoulNumberTicker>(
                      '#sb-ticker',
                    )
                  const badge = this.renderRoot.querySelector<
                    HTMLElement & { count?: number }
                  >('#sb-count')
                  if (ticker) ticker.value += Math.round(Math.random() * 400)
                  if (badge) badge.count = (badge.count ?? 0) + 1
                }}
              >
                Bump
              </moul-button>
            </div>
          </div>

          <div class="demo-group">
            <span class="group-label">Loaders & Step Loader</span>
            <div class="demo-row" style="color: var(--color-accent);">
              <moul-spinner variant="ring"></moul-spinner>
              <moul-spinner variant="dots"></moul-spinner>
              <moul-spinner variant="shape"></moul-spinner>
              <moul-spinner variant="orbit"></moul-spinner>
            </div>
            <moul-step-loader
              label="Publishing site"
              interval="1200"
              loop
              style="max-height: 7rem;"
              .steps=${['Checking files', 'Uploading', 'Building', 'Publishing']}
            ></moul-step-loader>
          </div>

          <div class="demo-group">
            <span class="group-label">Result Card & Confetti</span>
            <moul-result-card
              id="sb-result"
              heading="Payment sent"
              description="$42.00 to Dara Sok."
            >
              <moul-button slot="actions" variant="primary" @click=${() => this.runPayment()}>
                Pay again
              </moul-button>
            </moul-result-card>
          </div>

          <div class="demo-group">
            <span class="group-label">Undo & Stacked Toasts</span>
            <div class="demo-row">
              <moul-button variant="danger-soft" @click=${() => this.triggerUndoToast()}>
                Delete rows
              </moul-button>
              <moul-button variant="secondary" @click=${() => this.triggerStackedToasts()}>
                Send three, stacked
              </moul-button>
            </div>
          </div>

          <div class="demo-group">
            <span class="group-label">Animated List & Notification Bell</span>
            <div class="demo-row">
              <moul-button size="sm" variant="secondary" @click=${() => this.addSandboxEvent()}>
                Add event
              </moul-button>
              <moul-notification-bell id="sb-bell" count="2">
                <moul-button slot="header-actions" size="sm" variant="ghost">Mark all read</moul-button>
                <div>Deploy finished</div>
                <div>New sign-up</div>
              </moul-notification-bell>
            </div>
            <moul-animated-list id="sb-feed" delay="400" is-live>
              <div class="feed-item">Payment received</div>
              <div class="feed-item">New sign-up</div>
              <div class="feed-item">Deploy finished</div>
            </moul-animated-list>
          </div>

          <div class="demo-group">
            <span class="group-label">Pull to Refresh</span>
            <moul-pull-to-refresh
              style="height: 12rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg, 0.75rem);"
              @refresh=${(
                e: CustomEvent<{ waitUntil(p: Promise<unknown>): void }>,
              ) =>
                e.detail.waitUntil(
                  new Promise((resolve) => setTimeout(resolve, 1200)),
                )}
            >
              <ul style="margin: 0; padding: var(--spacing-3, 0.75rem) var(--spacing-6, 1.5rem);">
                <li>Invoice #1042 paid</li>
                <li>New sign-up from Siem Reap</li>
                <li>Backup finished</li>
                <li>Deploy to staging succeeded</li>
              </ul>
            </moul-pull-to-refresh>
          </div>

          <div class="demo-group">
            <span class="group-label">Expandable Card</span>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: var(--spacing-3, 0.75rem);">
              <moul-expandable-card size="sm">
                <div slot="media" style="background: var(--color-accent);"></div>
                <h3 style="margin: 0;">Koh Rong Samloem</h3>
                <span>Island · 3 nights</span>
                <div slot="details">
                  <p>Quiet island off Sihanoukville, with a long white beach and no cars.</p>
                  <moul-button variant="primary">Book</moul-button>
                </div>
              </moul-expandable-card>
              <moul-expandable-card size="sm">
                <div slot="media" style="background: var(--color-success-solid);"></div>
                <h3 style="margin: 0;">Kampot</h3>
                <span>River town · 2 nights</span>
                <div slot="details">
                  <p>Pepper farms, a slow river and the old French quarter.</p>
                  <moul-button variant="primary">Book</moul-button>
                </div>
              </moul-expandable-card>
            </div>
          </div>
        </div>

        <moul-card>
          <moul-card-header>
            <h4 style="margin: 0;">Interactive Data Table</h4>
          </moul-card-header>
          <moul-card-body>
            <moul-table
              id="sandbox-table"
              aria-label="Team members"
              .columns=${TABLE_COLUMNS}
              .data=${TABLE_DATA}
              .renderExpanded=${(row: { name: string; role: string }) =>
                html`<span class="muted">${row.name} works as ${row.role}.</span>`}
              is-searchable
              is-sortable
              is-selectable
            >
              <moul-button slot="toolbar" size="sm" variant="secondary">Export</moul-button>
            </moul-table>
            <moul-selection-toolbar for="sandbox-table" position="sticky">
              <moul-button size="sm" variant="secondary">Archive</moul-button>
              <moul-button size="sm" variant="secondary">Export</moul-button>
              <moul-button size="sm" variant="danger-soft">Delete</moul-button>
            </moul-selection-toolbar>
          </moul-card-body>
        </moul-card>
      </div>
    `
  }

  private renderOverlaysSection(): TemplateResult {
    return html`
      <div class="category-section" id="overlays">
        <div class="section-header">
          <h3 class="section-title">3. Overlays & Navigation</h3>
          <p class="section-subtitle">moul-modal, moul-alert-dialog, moul-drawer, moul-popover, moul-tooltip, moul-command-palette, moul-dropdown-menu, moul-stepper, moul-tree, moul-hover-card, moul-tour, moul-focus-mode, moul-tabs, moul-breadcrumbs, moul-pagination, moul-link</p>
        </div>

        <div class="demo-group">
          <span class="group-label">Dialog Triggers & Overlays</span>
          <div class="demo-row">
            <moul-button
              variant="primary"
              @click=${() => {
                this.isModalOpen = true
              }}
            >
              Open Modal Dialog
            </moul-button>

            <moul-button
              variant="danger"
              @click=${() => {
                this.isAlertModalOpen = true
              }}
            >
              Open Alert Dialog
            </moul-button>

            <moul-popover placement="bottom">
              <moul-button slot="trigger" variant="outline">Trigger Popover</moul-button>
              <div class="popover-box">
                <h5 style="margin: 0 0 6px;">Popover Surface</h5>
                <p style="margin: 0; font-size: 0.8125rem; color: var(--color-fg-subtle);">
                  Renders into the native top-layer via Popover API.
                </p>
              </div>
            </moul-popover>

            <moul-tooltip content="Accessible tooltip description" placement="top">
              <moul-button variant="ghost">Hover for Tooltip</moul-button>
            </moul-tooltip>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Drawers & Command Palette</span>
          <div class="demo-row">
            <moul-button
              variant="secondary"
              @click=${() => {
                this.activeDrawer = 'right'
              }}
            >
              Right Drawer
            </moul-button>
            <moul-button
              variant="secondary"
              @click=${() => {
                this.activeDrawer = 'left'
              }}
            >
              Left Drawer
            </moul-button>
            <moul-button
              variant="secondary"
              @click=${() => {
                this.activeDrawer = 'bottom'
              }}
            >
              Bottom Sheet
            </moul-button>
            <moul-button
              variant="outline"
              @click=${() => {
                this.isCommandPaletteOpen = true
              }}
            >
              Open Command Palette
              <moul-kbd slot="suffix">⌘K</moul-kbd>
            </moul-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Dropdown Menus</span>
          <div class="demo-row">
            <moul-dropdown-menu
              @action=${(e: CustomEvent<{ value: string }>) =>
                console.log('[sandbox] menu action', e.detail.value)}
            >
              <moul-button slot="trigger" variant="outline">Actions</moul-button>
              <moul-menu-item value="edit" shortcut="⌘E">Edit</moul-menu-item>
              <moul-menu-item value="duplicate">Duplicate</moul-menu-item>
              <moul-menu-item value="archive" is-disabled>Archive</moul-menu-item>
              <moul-menu-separator></moul-menu-separator>
              <moul-menu-item value="delete" variant="danger">Delete</moul-menu-item>
            </moul-dropdown-menu>
            <moul-dropdown-menu variant="gooey" placement="bottom-end">
              <moul-button slot="trigger" variant="secondary">View</moul-button>
              <moul-menu-item type="checkbox" value="grid" is-checked>Show grid</moul-menu-item>
              <moul-menu-group label="Sort by">
                <moul-menu-item type="radio" value="name" is-checked>Name</moul-menu-item>
                <moul-menu-item type="radio" value="date">Date</moul-menu-item>
              </moul-menu-group>
            </moul-dropdown-menu>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Stepper</span>
          <moul-stepper id="sandbox-stepper">
            <moul-step label="Cart" description="3 items">
              <p style="margin: 0; font-size: 0.875rem;">Two shirts and a cap.</p>
            </moul-step>
            <moul-step label="Delivery">
              <moul-text-field label="Address" placeholder="Street 240, Phnom Penh"></moul-text-field>
            </moul-step>
            <moul-step label="Payment">
              <p style="margin: 0; font-size: 0.875rem;">Pay on delivery.</p>
            </moul-step>
            <moul-step label="Done">
              <p style="margin: 0; font-size: 0.875rem;">Order placed.</p>
            </moul-step>
          </moul-stepper>
          <div class="demo-row">
            <moul-button
              variant="secondary"
              @click=${() =>
                this.renderRoot
                  .querySelector<MoulStepper>('#sandbox-stepper')
                  ?.previous()}
            >
              Back
            </moul-button>
            <moul-button
              @click=${() =>
                this.renderRoot
                  .querySelector<MoulStepper>('#sandbox-stepper')
                  ?.next()}
            >
              Next
            </moul-button>
          </div>
        </div>

        <div class="demo-group">
          <span class="group-label">Tree</span>
          <moul-tree label="Project files" style="max-width: 20rem;">
            <moul-tree-item value="src" label="src" is-expanded>
              <moul-tree-item value="src/components" label="components" is-expanded>
                <moul-tree-item value="src/components/button.ts" label="button.ts" is-selected></moul-tree-item>
                <moul-tree-item value="src/components/tree.ts" label="tree.ts"></moul-tree-item>
              </moul-tree-item>
              <moul-tree-item value="src/index.ts" label="index.ts"></moul-tree-item>
              <moul-tree-item value="src/legacy.ts" label="legacy.ts" is-disabled></moul-tree-item>
            </moul-tree-item>
            <moul-tree-item value="docs" label="docs">
              <moul-tree-item value="docs/intro.md" label="intro.md"></moul-tree-item>
            </moul-tree-item>
            <moul-tree-item value="package.json" label="package.json"></moul-tree-item>
          </moul-tree>
        </div>

        <div class="demo-group">
          <span class="group-label">Tabs & Roving Focus</span>
          <moul-tabs
            selected-key=${this.selectedTab}
            @click=${(e: Event) => {
              const target = e.target as HTMLElement & { key?: string }
              if (target?.key) this.selectedTab = target.key
            }}
          >
            <moul-tab key="overview">Overview</moul-tab>
            <moul-tab key="analytics">Analytics</moul-tab>
            <moul-tab key="reports">Reports</moul-tab>

            <moul-tab-panel key="overview">
              <p style="padding: 12px 0; margin: 0; font-size: 0.875rem;">
                Overview dashboard with animated indicator and FLIP layout transitions.
              </p>
            </moul-tab-panel>
            <moul-tab-panel key="analytics">
              <p style="padding: 12px 0; margin: 0; font-size: 0.875rem;">
                Analytics telemetry stream and aggregated metrics panel.
              </p>
            </moul-tab-panel>
            <moul-tab-panel key="reports">
              <p style="padding: 12px 0; margin: 0; font-size: 0.875rem;">
                Compliance verification audit reports and logs export.
              </p>
            </moul-tab-panel>
          </moul-tabs>
        </div>

        <div class="demo-group">
          <span class="group-label">Breadcrumbs, Links & Pagination</span>
          <div class="demo-col">
            <moul-breadcrumbs>
              <moul-breadcrumb-item href="#">Workspace</moul-breadcrumb-item>
              <moul-breadcrumb-item href="#">Design System</moul-breadcrumb-item>
              <moul-breadcrumb-item is-current>Kitchen Sink</moul-breadcrumb-item>
            </moul-breadcrumbs>

            <div class="demo-row">
              <moul-link href="#">Default link</moul-link>
              <moul-link href="#" variant="subtle">Subtle link</moul-link>
              <moul-link href="#" variant="underline">Underlined</moul-link>
              <moul-link href="https://developer.mozilla.org" is-external>MDN</moul-link>
              <moul-link href="#" is-disabled>Disabled</moul-link>
            </div>

            <moul-pagination
              total-pages="10"
              .currentPage=${this.currentPage}
              @pagechange=${(e: CustomEvent<{ page: number }>) => {
                this.currentPage = e.detail.page
              }}
            ></moul-pagination>
          </div>
        </div>

        <div class="section-grid">
          <div class="demo-group">
            <span class="group-label">Tooltip & Hover Card</span>
            <div class="demo-row">
              <moul-tooltip content="Follows the pointer" follow="pointer">
                <moul-button variant="secondary" style="width: 14rem;">Wide trigger</moul-button>
              </moul-tooltip>
              <moul-hover-card>
                <a slot="trigger" href="#">@sophea</a>
                <div style="width: 14rem;">
                  <strong>Sophea Chan</strong>
                  <p style="margin: var(--spacing-1, 0.25rem) 0 var(--spacing-3, 0.75rem);">
                    Designer in Phnom Penh
                  </p>
                  <moul-button size="sm">Follow</moul-button>
                </div>
              </moul-hover-card>
            </div>
          </div>

          <div class="demo-group">
            <span class="group-label">Tour & Focus Mode</span>
            <div class="demo-row">
              <moul-button id="sb-tour-new">New project</moul-button>
              <moul-button
                id="sb-tour-start"
                variant="outline"
                @click=${() =>
                  this.renderRoot.querySelector<MoulTour>('#sb-tour')?.start()}
              >
                Take the tour
              </moul-button>
              <moul-button
                variant="secondary"
                @click=${() =>
                  this.renderRoot
                    .querySelector<MoulFocusMode>('#sb-focus')
                    ?.toggle()}
              >
                Focus
              </moul-button>
            </div>
            <moul-tour id="sb-tour">
              <moul-tour-step heading="Welcome">A quick look around.</moul-tour-step>
              <moul-tour-step target="#sb-tour-new" heading="Start a project">
                Everything lives in a project.
              </moul-tour-step>
              <moul-tour-step target="#sb-focus" heading="Write without distraction" placement="top">
                Focus mode dims everything else.
              </moul-tour-step>
            </moul-tour>
            <moul-focus-mode id="sb-focus">
              <moul-text-area label="Draft"></moul-text-area>
            </moul-focus-mode>
          </div>
        </div>
      </div>
    `
  }

  private renderFormsSection(): TemplateResult {
    return html`
      <div class="category-section" id="forms">
        <div class="section-header">
          <h3 class="section-title">4. Forms & Inputs</h3>
          <p class="section-subtitle">moul-form, moul-text-field, moul-text-area, moul-number-field, moul-input-otp, moul-select, moul-combobox, moul-switch, moul-slider, moul-checkbox-group, moul-date-picker, moul-calendar, moul-file-upload</p>
        </div>

        <div class="section-grid">
          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Text & Numeric Inputs</h4>
            </moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-text-field
                  label="Display Name"
                  placeholder="Enter name..."
                  .value=${this.textValue}
                  @input=${(e: Event) => {
                    this.textValue = (e.target as HTMLInputElement).value
                  }}
                ></moul-text-field>
                <moul-text-field label="Email Address" type="email" placeholder="alex@example.com"></moul-text-field>
                <moul-search-field label="Resource Query" placeholder="Search components..."></moul-search-field>
                <moul-number-field label="Allocated Workers" value="4" min="1" max="64"></moul-number-field>
                <moul-text-area
                  label="Release notes"
                  placeholder="Summarize what changed…"
                  rows="3"
                  auto-resize
                  description="Markdown is supported."
                ></moul-text-area>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Select & Date Pickers</h4>
            </moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-select label="Environment Tier" selected-key="staging">
                  <moul-select-item key="dev">Development</moul-select-item>
                  <moul-select-item key="staging">Staging</moul-select-item>
                  <moul-select-item key="prod">Production</moul-select-item>
                </moul-select>

                <moul-combobox label="Frontend Runtime" placeholder="Choose runtime...">
                  <moul-combobox-item key="lit">Lit 3 Web Components</moul-combobox-item>
                  <moul-combobox-item key="vanilla">Vanilla TypeScript</moul-combobox-item>
                  <moul-combobox-item key="vite">Vite Engine</moul-combobox-item>
                </moul-combobox>

                <moul-date-picker label="Target Release Date"></moul-date-picker>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Switches, Sliders & Radios</h4>
            </moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-slider
                  label="Throughput Limit"
                  min="0"
                  max="100"
                  .value=${this.sliderValue}
                  @input=${(e: Event) => {
                    this.sliderValue = Number(
                      (e.target as HTMLInputElement).value,
                    )
                  }}
                ></moul-slider>

                <moul-switch
                  label="Enable telemetry reporting"
                  ?is-checked=${this.switchValue}
                  @change=${(e: Event) => {
                    this.switchValue = (
                      e.target as HTMLElement & { isChecked: boolean }
                    ).isChecked
                  }}
                ></moul-switch>

                <moul-checkbox label="Verify package signatures" is-checked></moul-checkbox>

                <moul-checkbox-group label="Target Platforms" orientation="horizontal">
                  <moul-checkbox value="web" is-checked>Web</moul-checkbox>
                  <moul-checkbox value="ios">iOS</moul-checkbox>
                  <moul-checkbox value="android">Android</moul-checkbox>
                </moul-checkbox-group>

                <moul-radio-group label="Replication Strategy" value="multi-region">
                  <moul-radio value="single">Single Zone</moul-radio>
                  <moul-radio value="multi-region">Multi-Region</moul-radio>
                </moul-radio-group>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Calendar & One-Time Code</h4>
            </moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-calendar value="2026-10-19" min-date="2026-10-05"></moul-calendar>
                <moul-input-otp
                  label="Verification code"
                  length="6"
                  @complete=${(e: CustomEvent<{ value: string }>) => {
                    toastQueue.add({
                      title: 'Code Entered',
                      description: `Received one-time code ${e.detail.value}.`,
                      tone: 'success',
                      duration: 2500,
                    })
                  }}
                ></moul-input-otp>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">File Upload</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-file-upload
                label="Attachments"
                description="Images or PDFs, up to 5 MB each."
                accept="image/*,.pdf"
                max-size="5242880"
                is-multiple
                .upload=${fakeUpload}
              ></moul-file-upload>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Form Submission</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-form @submit=${this.handleFormSubmit}>
                <div class="demo-col">
                  <moul-text-field name="username" label="Username" placeholder="alice" is-required></moul-text-field>
                  <moul-select name="role" label="Role" selected-key="editor">
                    <moul-select-item key="viewer">Viewer</moul-select-item>
                    <moul-select-item key="editor">Editor</moul-select-item>
                    <moul-select-item key="admin">Admin</moul-select-item>
                  </moul-select>
                  <moul-switch name="notify" is-checked>Email me about activity</moul-switch>
                  <moul-button type="submit">Create account</moul-button>
                </div>
              </moul-form>
            </moul-card-body>
          </moul-card>
        </div>
      </div>
    `
  }

  private renderChartsSection(): TemplateResult {
    return html`
      <div class="category-section" id="charts">
        <div class="section-header">
          <h3 class="section-title">5. Charts & Analytics</h3>
          <p class="section-subtitle">moul-line-chart, moul-area-chart, moul-bar-chart, moul-doughnut-chart, moul-heatmap-chart, moul-funnel-chart, moul-stat</p>
        </div>

        <div class="section-grid stat-grid">
          <moul-stat
            label="Revenue"
            value="45896"
            prefix="$"
            trend="up"
            trend-value="8.2%"
            description="Last 14 days"
            .sparklineData=${[38200, 36900, 37600, 36400, 39800, 41000, 42300, 41400, 41200, 43500, 43000, 41600, 44800, 45896]}
            .sparklineLabels=${STAT_DAYS}
          ></moul-stat>
          <moul-stat
            label="Active users"
            value="10067"
            trend="up"
            trend-value="20%"
            description="Last 14 days"
            color="var(--color-chart-5)"
            .sparklineData=${[8100, 8150, 8150, 8300, 8280, 8450, 8600, 8700, 9000, 9050, 9512, 9600, 9810, 10067]}
            .sparklineLabels=${STAT_DAYS}
          ></moul-stat>
          <moul-stat
            label="Conversion"
            value="3.26"
            suffix="%"
            trend="up"
            trend-value="6.7%"
            description="Last 14 days"
            color="var(--color-chart-2)"
            .sparklineData=${[2.62, 2.66, 2.64, 2.86, 2.98, 3.02, 3.28, 3.22, 3.3, 3.12, 3.24, 3.08, 3.2, 3.26]}
            .sparklineLabels=${STAT_DAYS}
          ></moul-stat>
          <moul-stat
            label="Churn"
            value="1.93"
            suffix="%"
            trend="down"
            trend-value="26%"
            is-lower-better
            description="Last 14 days"
            color="var(--color-chart-3)"
            .sparklineData=${[2.62, 2.58, 2.5, 2.42, 2.34, 2.26, 2.16, 2.08, 2.04, 2.04, 2.08, 2.08, 2.1, 1.93]}
            .sparklineLabels=${STAT_DAYS}
          ></moul-stat>
        </div>

        <moul-chart-container title="Activity" description="Daily contributions">
          <moul-tabs
            slot="header"
            selected-key=${this.activityMode}
            @selectionchange=${(e: CustomEvent<{ selectedKey: string }>) => {
              this.activityMode =
                e.detail.selectedKey === 'hour' ? 'hour' : 'calendar'
            }}
          >
            <moul-tab key="calendar">Calendar</moul-tab>
            <moul-tab key="hour">By hour</moul-tab>
          </moul-tabs>
          <moul-heatmap-chart
            .data=${ACTIVITY_EVENTS}
            mode=${this.activityMode}
          ></moul-heatmap-chart>
        </moul-chart-container>

        <div class="section-grid">
          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Line Chart — Traffic by Platform</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-line-chart
                .data=${CHART_DATA}
                x-key="month"
                .series=${[
                  { key: 'desktop', label: 'Desktop' },
                  { key: 'mobile', label: 'Mobile' },
                ]}
                height="260"
              ></moul-line-chart>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Area Chart — Gross Revenue</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-area-chart
                .data=${CHART_DATA}
                x-key="month"
                .series=${[{ key: 'revenue', label: 'Revenue ($)' }]}
                height="260"
              ></moul-area-chart>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Bar Chart — Client Distribution</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-bar-chart
                .data=${CHART_DATA}
                x-key="month"
                .series=${[{ key: 'desktop', label: 'Requests' }]}
                height="260"
              ></moul-bar-chart>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Doughnut Chart — Acquisition Channel</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-doughnut-chart
                .data=${DOUGHNUT_DATA}
                center-label="Total"
                center-sublabel="1,050"
                height="260"
              ></moul-doughnut-chart>
            </moul-card-body>
          </moul-card>
        </div>

        <div class="section-grid">
          <moul-chart-container title="Signup funnel" description="Visit to paid, last 30 days">
            <moul-funnel-chart .data=${FUNNEL_DATA}></moul-funnel-chart>
          </moul-chart-container>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Resource Allocation & Capacity</h4>
            </moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-percentage-bar label="Memory Consumption" value="74" tone="primary"></moul-percentage-bar>
                <moul-percentage-bar label="Storage Utilization" value="89" tone="warning"></moul-percentage-bar>
                <div class="demo-row">
                  <moul-percentage-circle value="84" tone="success"></moul-percentage-circle>
                  <moul-percentage-circle value="52" tone="accent"></moul-percentage-circle>
                </div>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header>
              <h4 style="margin: 0;">Browser Performance Share</h4>
            </moul-card-header>
            <moul-card-body>
              <moul-top-list .data=${TOP_LIST_DATA} show-rank multi-color></moul-top-list>
            </moul-card-body>
          </moul-card>
        </div>
      </div>
    `
  }

  private renderDeveloperSection(): TemplateResult {
    return html`
      <div class="category-section" id="developer">
        <div class="section-header">
          <h3 class="section-title">6. Data & Developer</h3>
          <p class="section-subtitle">moul-timeline, moul-history-ledger, moul-activity-feed, moul-code-block, moul-code-comparison, moul-terminal, moul-file-tree, moul-relationship-graph</p>
        </div>

        <div class="section-grid">
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Record history</h4></moul-card-header>
            <moul-card-body>
              <moul-history-ledger .versions=${SB_VERSIONS} current="v3"></moul-history-ledger>
            </moul-card-body>
          </moul-card>
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Timeline</h4></moul-card-header>
            <moul-card-body>
              <moul-timeline density="compact" progress="status" label="Release">
                <moul-timeline-item heading="Planned" meta="Nov 2" status="complete" tone="success">Scope agreed.</moul-timeline-item>
                <moul-timeline-item heading="In review" meta="Today" status="current">Two approvals left.</moul-timeline-item>
                <moul-timeline-item heading="Released" status="upcoming"></moul-timeline-item>
              </moul-timeline>
            </moul-card-body>
          </moul-card>
        </div>

        <div class="section-grid">
          <div class="demo-col">
            <div class="demo-row">
              <moul-button size="sm" variant="secondary" @click=${this.pushSandboxRequest}>Push request</moul-button>
            </div>
            <moul-activity-feed id="sb-activity" label="Requests" style="--activity-feed-max-height: 18rem"></moul-activity-feed>
          </div>
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Live line chart</h4></moul-card-header>
            <moul-card-body>
              <moul-line-chart id="sb-live" is-live max-points="20" x-key="t" height="200" label="Response time"></moul-line-chart>
              <moul-doughnut-chart shape="half" height="160" value="64" center-sublabel="Quota"></moul-doughnut-chart>
            </moul-card-body>
          </moul-card>
        </div>

        <div class="section-grid">
          <div class="demo-col">
            <moul-code-block language="bash" sync-key="sb-pm" .tabs=${SB_CODE_TABS}></moul-code-block>
            <moul-code-comparison
              language="ts"
              before-code=${'button.onPress = () => save()'}
              after-code=${"button.addEventListener('press', () => save())"}
            ></moul-code-comparison>
            <moul-terminal label="zsh" is-static>
              <moul-terminal-line is-command>bun test</moul-terminal-line>
              <moul-terminal-line tone="success">✓ 213 pass</moul-terminal-line>
            </moul-terminal>
          </div>
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Files and dependencies</h4></moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-file-tree label="Project files" .files=${SB_FILES} .expanded=${['src', 'src/components']}></moul-file-tree>
                <moul-relationship-graph label="Service map" .nodes=${SB_GRAPH.nodes} .links=${SB_GRAPH.links}></moul-relationship-graph>
              </div>
            </moul-card-body>
          </moul-card>
        </div>
      </div>
    `
  }

  private renderAiSection(): TemplateResult {
    return html`
      <div class="category-section" id="ai">
        <div class="section-header">
          <h3 class="section-title">7. AI Kit</h3>
          <p class="section-subtitle">moul-chat, moul-prompt-input, moul-streaming-response, moul-agent-activity, moul-thinking-indicator</p>
        </div>

        <div class="section-grid">
          <moul-card style="grid-column: 1 / -1">
            <moul-card-header><h4 style="margin: 0;">Chat</h4></moul-card-header>
            <moul-card-body>
              <moul-chat
                style="height: 32rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden"
                .conversations=${[{ id: 'c1', title: 'Collections', group: 'Today' }]}
                .suggestions=${['Which collections are there?', 'Show me the newest posts']}
                .placeholders=${['Ask about your collections…', 'Find a record…']}
                @promptsubmit=${this.answerSandboxChat}
                @stop=${this.stopSandboxChat}
              ></moul-chat>
            </moul-card-body>
          </moul-card>
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Agent activity</h4></moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-thinking-indicator label="Searching records"></moul-thinking-indicator>
                <moul-agent-activity .steps=${SB_AGENT_STEPS}></moul-agent-activity>
              </div>
            </moul-card-body>
          </moul-card>
          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Answer and composer</h4></moul-card-header>
            <moul-card-body>
              <div class="demo-col">
                <moul-streaming-response .content=${SB_CHAT_ANSWER}></moul-streaming-response>
                <moul-prompt-input allow-attachments .models=${[
                  { value: 'sonnet', label: 'Sonnet' },
                  { value: 'opus', label: 'Opus' },
                ]}></moul-prompt-input>
              </div>
            </moul-card-body>
          </moul-card>
        </div>
      </div>
    `
  }

  private renderLandingSection(): TemplateResult {
    return html`
      <div class="category-section" id="landing">
        <div class="section-header">
          <h3 class="section-title">8. Landing Kit</h3>
          <p class="section-subtitle">moul-reveal, moul-text-entrance, moul-typewriter, moul-word-rotate, moul-scramble, moul-gradient-text, moul-highlight, moul-marquee, moul-bento-grid, moul-browser-frame, moul-phone-frame, moul-scroll-progress; button effects</p>
        </div>

        <div class="section-grid">
          <moul-card style="grid-column: 1 / -1">
            <moul-card-header><h4 style="margin: 0;">Hero</h4></moul-card-header>
            <moul-card-body>
              <h2 style="margin: 0; font-size: 2.25rem; line-height: 1.1;">
                <moul-text-entrance by="words">Web components for</moul-text-entrance>
                <moul-word-rotate .words=${['dashboards', 'landing pages', 'AI chat']}>dashboards</moul-word-rotate>
              </h2>
              <moul-reveal delay="200">
                <p style="color: var(--color-fg-subtle);">
                  Plain HTML tags with <moul-highlight delay="600">motion built in</moul-highlight>,
                  <moul-gradient-text>switched off</moul-gradient-text> for readers who ask for less.
                </p>
              </moul-reveal>
              <div class="demo-row">
                <moul-button effect="shimmer">Shimmer<span slot="hover">Get started →</span></moul-button>
                <moul-button effect="rainbow">Rainbow</moul-button>
                <moul-button effect="neon" variant="secondary">Neon</moul-button>
                <moul-button is-pulsing>Pulse</moul-button>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Text effects</h4></moul-card-header>
            <moul-card-body>
              <p><moul-typewriter .words=${['Build.', 'Ship.', 'Repeat.']} is-looping></moul-typewriter></p>
              <p><moul-scramble trigger="hover">Hover to decode</moul-scramble></p>
              <p><moul-gradient-text effect="shine">A light sweeps across</moul-gradient-text></p>
              <p><moul-highlight effect="circle" tone="error">circled</moul-highlight> and <moul-highlight effect="box" tone="success">boxed</moul-highlight></p>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Marquee</h4></moul-card-header>
            <moul-card-body>
              <moul-marquee fade-edges pause-on-hover>
                ${[
                  'Astro',
                  'Vue',
                  'Svelte',
                  'React 19',
                  'Lit',
                  'Plain HTML',
                ].map((name) => html`<moul-badge>${name}</moul-badge>`)}
              </moul-marquee>
            </moul-card-body>
          </moul-card>

          <moul-card style="grid-column: 1 / -1">
            <moul-card-header><h4 style="margin: 0;">Bento grid</h4></moul-card-header>
            <moul-card-body>
              <moul-reveal stagger="90">
                <moul-bento-grid columns="3">
                  <moul-bento-card col-span="2">
                    <h3 slot="heading" style="margin: 0;">Motion as markup</h3>
                    Text effects and reveals are attributes, not scripts.
                    <moul-link slot="action" href="#">See the kit →</moul-link>
                  </moul-bento-card>
                  <moul-bento-card>
                    <h3 slot="heading" style="margin: 0;">Reduced motion</h3>
                    Every effect has a still version.
                  </moul-bento-card>
                  <moul-bento-card>
                    <h3 slot="heading" style="margin: 0;">Both themes</h3>
                    Colours come from tokens.
                  </moul-bento-card>
                  <moul-bento-card col-span="2">
                    <h3 slot="heading" style="margin: 0;">Frames</h3>
                    Browser and phone mock-ups in CSS.
                  </moul-bento-card>
                </moul-bento-grid>
              </moul-reveal>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Browser frame</h4></moul-card-header>
            <moul-card-body>
              <moul-browser-frame url="moul.dev/admin">
                <div style="padding: 1.5rem; background: var(--color-bg-subtle);">
                  <moul-stat label="Requests" value="128430" trend="up" trend-value="+8%"></moul-stat>
                </div>
              </moul-browser-frame>
            </moul-card-body>
          </moul-card>

          <moul-card>
            <moul-card-header><h4 style="margin: 0;">Phone frames</h4></moul-card-header>
            <moul-card-body>
              <div class="demo-row" style="justify-content: center;">
                <moul-phone-frame style="--phone-frame-width: 9rem"></moul-phone-frame>
                <moul-phone-frame variant="android" style="--phone-frame-width: 9rem"></moul-phone-frame>
              </div>
            </moul-card-body>
          </moul-card>

          <moul-card style="grid-column: 1 / -1">
            <moul-card-header><h4 style="margin: 0;">Scroll progress</h4></moul-card-header>
            <moul-card-body>
              <moul-scroll-progress for="sb-scroll-panel" placement="inline"></moul-scroll-progress>
              <div id="sb-scroll-panel" style="height: 8rem; overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 1rem;">
                ${Array.from({ length: 12 }, (_, i) => html`<p>Paragraph ${i + 1} of a panel that scrolls.</p>`)}
              </div>
            </moul-card-body>
          </moul-card>
        </div>
      </div>
    `
  }

  private renderBackgroundsSection(): TemplateResult {
    const tile =
      'display: grid; place-content: center; gap: 0.25rem; min-height: 11rem; padding: 1.5rem; text-align: center; border-radius: var(--radius-xl, 1rem); border: 1px solid var(--color-border)'
    return html`
      <div class="category-section" id="backgrounds">
        <div class="section-header">
          <h3 class="section-title">9. Backgrounds &amp; Light</h3>
          <p class="section-subtitle">moul-pattern, moul-perspective-grid, moul-ripple, moul-aurora, moul-noise, moul-beams, moul-light-rays, moul-spotlight, moul-border-beam, moul-shine-border, moul-backlight, moul-focus-group, moul-edge-blur, moul-orbit; card effects</p>
        </div>

        <div class="section-grid">
          <moul-pattern variant="grid" fade="radial" is-animated style=${tile}>
            <strong>Pattern</strong><span>grid, radial fade, lit cells</span>
          </moul-pattern>
          <moul-perspective-grid style=${tile}>
            <strong>Perspective grid</strong><span>floor</span>
          </moul-perspective-grid>
          <moul-ripple count="4" style="min-height: 11rem">
            <moul-button size="sm">Ripple</moul-button>
          </moul-ripple>
          <moul-aurora variant="blobs" style=${tile}>
            <strong>Aurora</strong><span>blobs</span>
          </moul-aurora>
          <moul-noise style="border-radius: var(--radius-xl, 1rem)">
            <moul-aurora style=${`${tile}; border-radius: inherit`}>
              <strong>Noise</strong><span>over an aurora</span>
            </moul-aurora>
          </moul-noise>
          <moul-beams variant="lines" style=${tile}>
            <strong>Beams</strong><span>lines</span>
          </moul-beams>
          <moul-light-rays style=${tile}>
            <strong>Light rays</strong><span>seven rays</span>
          </moul-light-rays>
          <moul-spotlight variant="lamp" style=${`${tile}; padding-top: 3rem`}>
            <strong>Spotlight</strong><span>lamp</span>
          </moul-spotlight>
          <moul-border-beam>
            <moul-card>
              <moul-card-header>Border beam</moul-card-header>
              <moul-card-body>A light travels round the edge.</moul-card-body>
            </moul-card>
          </moul-border-beam>
          <moul-shine-border>
            <moul-card>
              <moul-card-header>Shine border</moul-card-header>
              <moul-card-body>Colours drift round the edge.</moul-card-body>
            </moul-card>
          </moul-shine-border>
          <moul-card effect="spotlight glow" is-interactive>
            <moul-card-header>Card effects</moul-card-header>
            <moul-card-body>Spotlight and glow; point at it or tab to it.</moul-card-body>
          </moul-card>
          <moul-card effect="glare" is-interactive>
            <moul-card-header>Glare</moul-card-header>
            <moul-card-body>A band of light sweeps across on hover.</moul-card-body>
          </moul-card>
          <moul-backlight blur="24" style="display: grid; place-items: center; padding: 1.5rem">
            <div style="width: 10rem; height: 6.5rem; border-radius: 0.75rem; background: linear-gradient(var(--color-chart-4), var(--color-chart-3) 55%, var(--color-chart-5))"></div>
          </moul-backlight>
          <moul-orbit radius="64" show-path pause-on-hover style="justify-self: center">
            <moul-avatar name="Sophea Chan" size="sm"></moul-avatar>
            <moul-avatar name="Dara Kim" size="sm"></moul-avatar>
            <moul-avatar name="Vanna Ly" size="sm"></moul-avatar>
            <moul-badge slot="center" tone="primary">Orbit</moul-badge>
          </moul-orbit>
          <moul-edge-blur aria-label="Recent deploys" style="height: 11rem; border-radius: var(--radius-xl, 1rem); border: 1px solid var(--color-border)">
            <div style="display: grid; gap: 0.5rem; padding: 1rem">
              ${[
                'api-gateway',
                'billing-worker',
                'search-index',
                'web-app',
                'docs-site',
                'mailer',
                'scheduler',
              ].map(
                (name) =>
                  html`<moul-card variant="flat"><strong>${name}</strong> deployed</moul-card>`,
              )}
            </div>
          </moul-edge-blur>
        </div>

        <moul-focus-group style="margin-top: var(--spacing-4, 1rem)">
          <moul-card><moul-card-header>Previews</moul-card-header><moul-card-body>Focus group: point at one card.</moul-card-body></moul-card>
          <moul-card><moul-card-header>Logs</moul-card-header><moul-card-body>The others blur and dim.</moul-card-body></moul-card>
          <moul-card><moul-card-header>Rollbacks</moul-card-header><moul-card-body>Keyboard focus works too.</moul-card-body></moul-card>
        </moul-focus-group>
      </div>
    `
  }

  private renderSiteSection(): TemplateResult {
    const panel =
      'border: 1px solid var(--color-border); border-radius: var(--radius-xl, 1rem)'
    const phnomPenh = { lat: 11.56, lng: 104.92, label: 'Phnom Penh' }
    return html`
      <div class="category-section" id="site">
        <div class="section-header">
          <h3 class="section-title">10. Navigation &amp; Media</h3>
          <p class="section-subtitle">moul-navbar, moul-banner, moul-navigation-menu, moul-dock, moul-progress-nav, moul-carousel, moul-image-slider, moul-compare, moul-video-dialog, moul-world-map; expanding search</p>
        </div>

        <div id="sandbox-navbar" style=${`height: 14rem; overflow: auto; ${panel}`}>
          <moul-navbar for="sandbox-navbar" variant="floating" effect="glass shrink" hide-on-scroll collapse-below="520">
            <moul-banner slot="banner" hide-on-scroll is-dismissable>Site kit is here. <a href="#">Read more</a></moul-banner>
            <a slot="brand" href="#">Moul</a>
            <moul-navigation-menu>
              <moul-navigation-menu-item label="Products">
                <moul-navigation-menu-link href="#" label="Components" description="Ninety elements."></moul-navigation-menu-link>
                <moul-navigation-menu-link href="#" label="Landing kit" description="Text effects and frames."></moul-navigation-menu-link>
              </moul-navigation-menu-item>
              <moul-navigation-menu-item label="Pricing" href="#"></moul-navigation-menu-item>
            </moul-navigation-menu>
            <moul-search-field slot="actions" is-expandable label="Search"></moul-search-field>
          </moul-navbar>
          <div style="height: 40rem; padding: 1.5rem">Scroll this box: the banner slides away, the bar narrows to glass, then hides until you scroll back up.</div>
        </div>

        <div class="section-grid" style="margin-top: var(--spacing-4, 1rem)">
          <div style="display: grid; place-items: center; min-height: 9rem">
            <moul-dock label="Sandbox dock">
              <moul-dock-item label="Home" is-active>🏠</moul-dock-item>
              <moul-dock-item label="Mail">✉️</moul-dock-item>
              <moul-dock-separator></moul-dock-separator>
              <moul-dock-item label="Music">🎵</moul-dock-item>
            </moul-dock>
          </div>
          <moul-compare label="Compare two fills" before-label="Flat" after-label="Gradient" style="max-width: 28rem">
            <div slot="before" style="aspect-ratio: 16 / 10; background: var(--color-bg-subtle)"></div>
            <div slot="after" style="aspect-ratio: 16 / 10; background: linear-gradient(135deg, var(--color-chart-1), var(--color-chart-3))"></div>
          </moul-compare>
          <moul-video-dialog src="https://www.youtube-nocookie.com/embed/VIDEO_ID" label="Watch the tour" style="max-width: 20rem">
            <div slot="thumbnail" style="aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--color-chart-2), var(--color-chart-5))"></div>
          </moul-video-dialog>
          <moul-carousel label="Sandbox slides" style="--carousel-slide-size: 70%">
            ${['One', 'Two', 'Three', 'Four'].map(
              (name) =>
                html`<moul-card><moul-card-header>Slide ${name}</moul-card-header><moul-card-body>Drag, swipe or use the arrows.</moul-card-body></moul-card>`,
            )}
          </moul-carousel>
          <moul-image-slider label="Sandbox slideshow" interval="0" style="--image-slider-height: 12rem">
            ${['--color-chart-1', '--color-chart-4', '--color-chart-6'].map(
              (token) =>
                html`<div role="img" aria-label="A field of colour" style=${`background: var(${token})`}></div>`,
            )}
            <div slot="overlay"><strong>Image slider</strong></div>
          </moul-image-slider>
          <moul-world-map
            label="Routes from Phnom Penh"
            show-labels
            .arcs=${[
              {
                from: phnomPenh,
                to: { lat: 38.72, lng: -9.14, label: 'Lisbon' },
              },
              {
                from: phnomPenh,
                to: { lat: 35.68, lng: 139.69, label: 'Tokyo' },
              },
            ]}
          ></moul-world-map>
        </div>

        <div id="sandbox-article" style=${`height: 14rem; overflow: auto; margin-top: var(--spacing-4, 1rem); padding: 0 1.5rem; ${panel}`}>
          <moul-progress-nav for="sandbox-article" placement="inline" is-always-visible style="position: sticky; top: 0.75rem; z-index: 1"></moul-progress-nav>
          ${['Planning', 'Getting there', 'Where to stay', 'Eating'].map(
            (heading) =>
              html`<h4>${heading}</h4><p style="min-height: 8rem">Scroll this box: the pill follows the heading you are under.</p>`,
          )}
        </div>
      </div>
    `
  }

  private renderBlocksSection(): TemplateResult {
    return html`
      <div class="category-section" id="blocks">
        <div class="section-header">
          <h3 class="section-title">10. Composite Blocks</h3>
          <p class="section-subtitle">moul-logs-viewer, moul-logs, moul-sidebar, moul-sidebar-user</p>
        </div>

        <moul-card>
          <moul-card-header>
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <h4 style="margin: 0;">Virtualized Streaming Logs Viewer</h4>
              <moul-badge tone="success">@lit-labs/virtualizer</moul-badge>
            </div>
          </moul-card-header>
          <moul-card-body>
            <moul-logs
              .raw=${SERVER_LOG_RAW}
              show-toolbar
              show-timestamps
              show-levels
              wrap-lines
              max-height="340px"
            ></moul-logs>
          </moul-card-body>
        </moul-card>

        <moul-card>
          <moul-card-header>
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <h4 style="margin: 0;">Logs Viewer — Pre-Parsed Entries</h4>
              <moul-badge tone="accent">.logs property</moul-badge>
            </div>
          </moul-card-header>
          <moul-card-body>
            <moul-logs-viewer
              .logs=${SERVER_LOGS}
              compact
              max-height="300px"
              search-placeholder="Filter parsed entries..."
            ></moul-logs-viewer>
          </moul-card-body>
        </moul-card>
      </div>
    `
  }

  protected override render(): TemplateResult {
    const isAll = this.selectedCategory === 'all'

    return html`
      <moul-sidebar
        layout="sidebar-framed"
        selected-key=${this.selectedCategory}
        @selectionchange=${this.handleSidebarSelect}
      >
        <moul-sidebar-aside show-collapse-toggle aria-label="Sandbox Navigation">
          <moul-sidebar-header>
            <moul-sidebar-brand
              title="Moul UI"
              subtitle="Lit Web Components"
              href="#"
            >
              <div slot="logo" class="logo-box">M</div>
            </moul-sidebar-brand>
          </moul-sidebar-header>

          <moul-sidebar-group label="Kitchen Sink" collapsible>
            <moul-sidebar-item key="all" label="All Categories" badge="11">
              <span slot="icon">⚡</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="actions" label="Actions" badge="4">
              <span slot="icon">🔘</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="surfaces" label="Surfaces & Feedback" badge="20">
              <span slot="icon">🧱</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="overlays" label="Overlays & Nav" badge="13">
              <span slot="icon">🧭</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="forms" label="Forms & Inputs" badge="18">
              <span slot="icon">📝</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="charts" label="Charts & Analytics" badge="12">
              <span slot="icon">📊</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="developer" label="Data & Developer" badge="10">
              <span slot="icon">🧩</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="ai" label="AI Kit" badge="5">
              <span slot="icon">✨</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="landing" label="Landing Kit" badge="13">
              <span slot="icon">🚀</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="backgrounds" label="Backgrounds & Light" badge="14">
              <span slot="icon">🌅</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="site" label="Navigation & Media" badge="11">
              <span slot="icon">🧭</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="blocks" label="Composite Blocks" badge="12">
              <span slot="icon">📦</span>
            </moul-sidebar-item>
          </moul-sidebar-group>

          <moul-sidebar-divider></moul-sidebar-divider>

          <moul-sidebar-footer>
            <moul-sidebar-user name="Kim Ly" email="kim@example.com" status="online"></moul-sidebar-user>
          </moul-sidebar-footer>
        </moul-sidebar-aside>

        <moul-sidebar-main>
          <div class="sandbox-content">
            <header class="header-bar">
              <div>
                <h1 class="brand-title">Moul UI Component Sandbox</h1>
                <p class="brand-desc">
                  Interactive kitchen-sink showcase of 77 Lit custom elements with zero React dependencies.
                </p>
              </div>

              <div class="toolbar-actions">
                <moul-button
                  variant="outline"
                  size="sm"
                  @click=${() => this.triggerToast('primary')}
                >
                  🔔 Fire Toast
                </moul-button>
                <moul-button
                  variant="outline"
                  size="sm"
                  @click=${this.toggleTheme}
                  aria-label="Toggle light dark theme"
                >
                  ${this.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </moul-button>
              </div>
            </header>

            ${
              isAll || this.selectedCategory === 'actions'
                ? this.renderActionsSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'surfaces'
                ? this.renderSurfacesSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'overlays'
                ? this.renderOverlaysSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'forms'
                ? this.renderFormsSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'charts'
                ? this.renderChartsSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'developer'
                ? this.renderDeveloperSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'ai'
                ? this.renderAiSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'landing'
                ? this.renderLandingSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'backgrounds'
                ? this.renderBackgroundsSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'site'
                ? this.renderSiteSection()
                : nothing
            }
            ${
              isAll || this.selectedCategory === 'blocks'
                ? this.renderBlocksSection()
                : nothing
            }
          </div>
        </moul-sidebar-main>
      </moul-sidebar>

      <!-- Interactive Modal Dialog -->
      <moul-modal
        ?is-open=${this.isModalOpen}
        aria-label="Interactive Demo Modal"
        @close=${() => {
          this.isModalOpen = false
        }}
      >
        <h3 slot="header" style="margin: 0;">Interactive Modal Surface</h3>
        <p style="margin: 0; font-size: 0.875rem; color: var(--color-fg-subtle);">
          This dialog demonstrates focus trapping, escape dismissal, and top-layer backdrop integration.
        </p>
        <div slot="footer" class="demo-row" style="justify-content: flex-end;">
          <moul-button
            variant="outline"
            size="sm"
            @click=${() => {
              this.isModalOpen = false
            }}
          >
            Dismiss
          </moul-button>
          <moul-button
            variant="primary"
            size="sm"
            @click=${() => {
              this.isModalOpen = false
              this.triggerToast('success')
            }}
          >
            Confirm
          </moul-button>
        </div>
      </moul-modal>

      <!-- Interactive Alert Dialog -->
      <moul-alert-dialog
        ?is-open=${this.isAlertModalOpen}
        aria-label="Confirm Action Dialog"
        @confirm=${() => {
          this.isAlertModalOpen = false
          this.triggerToast('error')
        }}
        @cancel=${() => {
          this.isAlertModalOpen = false
        }}
      >
        <h4 slot="header" style="margin: 0;">Irreversible Action Confirmation</h4>
        <p slot="body" style="margin: 0; font-size: 0.875rem;">
          Are you sure you wish to proceed? This simulates destructive workflow confirmation.
        </p>
        <div slot="footer" class="demo-row" style="justify-content: flex-end;">
          <moul-button
            variant="ghost"
            size="sm"
            data-action="cancel"
            @click=${() => {
              this.isAlertModalOpen = false
            }}
          >
            Cancel
          </moul-button>
          <moul-button
            variant="danger"
            size="sm"
            data-action="confirm"
            @click=${() => {
              this.isAlertModalOpen = false
              this.triggerToast('error')
            }}
          >
            Delete
          </moul-button>
        </div>
      </moul-alert-dialog>

      <!-- Interactive Drawers -->
      <moul-drawer
        placement="right"
        aria-label="Settings"
        ?is-open=${this.activeDrawer === 'right'}
        @openchange=${this.handleDrawerOpenChange}
      >
        <h3 slot="header" style="margin: 0;">Settings</h3>
        <div class="demo-col">
          <moul-switch is-checked>Auto-deploy</moul-switch>
          <moul-switch>Preview comments</moul-switch>
        </div>
        <moul-button
          slot="footer"
          @click=${() => {
            this.activeDrawer = ''
          }}
        >
          Done
        </moul-button>
      </moul-drawer>

      <moul-drawer
        placement="left"
        size="sm"
        aria-label="Navigation"
        ?is-open=${this.activeDrawer === 'left'}
        @openchange=${this.handleDrawerOpenChange}
      >
        <h3 slot="header" style="margin: 0;">Navigation</h3>
        <p style="margin: 0; font-size: 0.875rem;">
          Left-edge drawers suit app navigation on narrow screens.
        </p>
      </moul-drawer>

      <moul-drawer
        is-sheet
        aria-label="Share"
        ?is-open=${this.activeDrawer === 'bottom'}
        @openchange=${this.handleDrawerOpenChange}
      >
        <h3 slot="header" style="margin: 0;">Share</h3>
        <p style="margin: 0; font-size: 0.875rem;">
          Bottom sheets work well for quick actions on touch devices. Drag the
          handle down to dismiss.
        </p>
        <moul-button
          slot="footer"
          @click=${() => {
            this.activeDrawer = ''
          }}
        >
          Done
        </moul-button>
      </moul-drawer>

      <!-- Command Palette (also opens with ⌘K / Ctrl+K) -->
      <moul-command-palette
        placeholder="Type a command…"
        .items=${COMMAND_ITEMS}
        ?is-open=${this.isCommandPaletteOpen}
        @openchange=${(e: CustomEvent<{ isOpen: boolean }>) => {
          this.isCommandPaletteOpen = e.detail.isOpen
        }}
        @select=${this.handleCommandSelect}
      ></moul-command-palette>
    `
  }
}

defineElement('moul-sandbox', MoulSandbox)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sandbox': MoulSandbox
  }
}
