/**
 * Curated metadata layered on top of `ui/dist/custom-elements.json` when
 * generating the LLM context files. The CEM supplies the API surface
 * (attributes, properties, events, slots, parts); this catalog supplies what
 * the analyzer cannot infer: grouping, docs URLs, one-line summaries, and a
 * realistic HTML usage snippet per component family.
 *
 * Elements present in the CEM but missing here still get documented with an
 * auto-generated snippet under "Other", so a new component never silently
 * drops out of `llms.txt`.
 */

export interface ComponentFamily {
  /** Display name, matching the docs page title. */
  name: string
  /** Docs route, relative to the site root. */
  docs: string
  summary: string
  /** Every custom element tag that belongs to this family. */
  tags: string[]
  /** HTML usage snippet; must reference every tag in `tags`. */
  snippet: string
  /** Optional JS wiring for property-only data (arrays, formatters). */
  script?: string
}

export interface ComponentCategory {
  title: string
  families: ComponentFamily[]
}

export const CATEGORIES: ComponentCategory[] = [
  {
    title: 'Charts & Data Visualization',
    families: [
      {
        name: 'AreaChart',
        docs: '/docs/components/charts/areachart',
        summary:
          'D3-powered area chart with optional stacking, grid lines, and hover tooltips.',
        tags: ['moul-area-chart'],
        snippet: `<moul-area-chart id="revenue" x-key="month" height="280" stacked></moul-area-chart>`,
        script: `const chart = document.querySelector('#revenue')
chart.data = [
  { month: 'Jan', web: 120, mobile: 80 },
  { month: 'Feb', web: 160, mobile: 95 },
]
chart.series = [
  { key: 'web', name: 'Web' },
  { key: 'mobile', name: 'Mobile' },
]`,
      },
      {
        name: 'BarChart',
        docs: '/docs/components/charts/barchart',
        summary:
          'Vertical or horizontal bar chart with grouped or stacked series.',
        tags: ['moul-bar-chart'],
        snippet: `<moul-bar-chart id="signups" x-key="day" layout="vertical" show-grid></moul-bar-chart>`,
        script: `const chart = document.querySelector('#signups')
chart.data = [{ day: 'Mon', count: 12 }, { day: 'Tue', count: 18 }]
chart.series = [{ key: 'count', name: 'Sign-ups' }]`,
      },
      {
        name: 'LineChart',
        docs: '/docs/components/charts/linechart',
        summary: 'Multi-series line chart with configurable D3 curve.',
        tags: ['moul-line-chart'],
        snippet: `<moul-line-chart id="latency" x-key="time" curve="monotoneX"></moul-line-chart>`,
        script: `const chart = document.querySelector('#latency')
chart.data = [{ time: '10:00', p50: 42, p99: 180 }, { time: '10:05', p50: 39, p99: 150 }]
chart.series = [{ key: 'p50', name: 'p50' }, { key: 'p99', name: 'p99' }]
chart.valueFormatter = (v) => \`\${v} ms\``,
      },
      {
        name: 'DoughnutChart',
        docs: '/docs/components/charts/doughnutchart',
        summary:
          'Doughnut / pie chart with a centered label and sublabel slot.',
        tags: ['moul-doughnut-chart'],
        snippet: `<moul-doughnut-chart id="traffic" center-label="12.4k" center-sublabel="Visits"></moul-doughnut-chart>`,
        script: `document.querySelector('#traffic').data = [
  { name: 'Direct', value: 5400 },
  { name: 'Search', value: 4100 },
  { name: 'Social', value: 2900 },
]`,
      },
      {
        name: 'TopList',
        docs: '/docs/components/charts/toplist',
        summary: 'Ranked list with proportional value bars.',
        tags: ['moul-top-list'],
        snippet: `<moul-top-list id="pages" max-items="5" show-rank interactive></moul-top-list>`,
        script: `document.querySelector('#pages').data = [
  { label: '/pricing', value: 1820 },
  { label: '/docs', value: 1240 },
]`,
      },
      {
        name: 'Stat',
        docs: '/docs/components/stat',
        summary:
          'KPI tile with animated value, trend indicator, and optional sparkline.',
        tags: ['moul-stat'],
        snippet: `<moul-stat label="Monthly revenue" value="48210" prefix="$" trend="up" trend-value="+12.5%" tone="success"></moul-stat>`,
      },
      {
        name: 'Percentage',
        docs: '/docs/components/charts/percentage',
        summary: 'Linear and circular percentage indicators.',
        tags: ['moul-percentage-bar', 'moul-percentage-circle'],
        snippet: `<moul-percentage-bar value="72" label="Storage used" tone="warning"></moul-percentage-bar>
<moul-percentage-circle value="64" size="lg" label="Uptime"></moul-percentage-circle>`,
      },
      {
        name: 'ChartContainer',
        docs: '/docs/components/charts/areachart',
        summary:
          'Responsive chart frame with title, description, legend, and empty state slots.',
        tags: ['moul-chart-container'],
        snippet: `<moul-chart-container title="Revenue" description="Last 30 days" height="320">
  <moul-area-chart x-key="month"></moul-area-chart>
  <span slot="empty">No data yet</span>
</moul-chart-container>`,
      },
      {
        name: 'ChartTooltip',
        docs: '/docs/components/charts/areachart',
        summary:
          'Floating tooltip used internally by charts; usable standalone for custom SVG.',
        tags: ['moul-chart-tooltip'],
        snippet: `<moul-chart-tooltip label="Jan" value="$1,200" x="120" y="40" is-open></moul-chart-tooltip>`,
      },
    ],
  },
  {
    title: 'Actions & Toggles',
    families: [
      {
        name: 'Button',
        docs: '/docs/components/button',
        summary:
          'Button with 7 variants, 3 sizes, icon-only mode, and pending state.',
        tags: ['moul-button'],
        snippet: `<moul-button variant="primary" size="md">Save changes</moul-button>
<moul-button variant="ghost" is-icon aria-label="Close">×</moul-button>
<moul-button variant="danger" is-pending>Deleting…</moul-button>`,
      },
      {
        name: 'ButtonGroup',
        docs: '/docs/components/buttongroup',
        summary: 'Groups buttons with attached or spaced layouts.',
        tags: ['moul-button-group'],
        snippet: `<moul-button-group spacing="none">
  <moul-button variant="outline">Day</moul-button>
  <moul-button variant="outline">Week</moul-button>
</moul-button-group>`,
      },
      {
        name: 'ToggleButton',
        docs: '/docs/components/togglebutton',
        summary: 'Two-state button that reflects `aria-pressed`.',
        tags: ['moul-toggle-button'],
        snippet: `<moul-toggle-button value="bold" aria-label="Bold">B</moul-toggle-button>`,
      },
      {
        name: 'ToggleButtonGroup',
        docs: '/docs/components/togglebuttongroup',
        summary:
          'Single-select toggle group with roving tabindex keyboard navigation.',
        tags: ['moul-toggle-button-group'],
        snippet: `<moul-toggle-button-group selected-key="left" aria-label="Alignment">
  <moul-toggle-button value="left">Left</moul-toggle-button>
  <moul-toggle-button value="center">Center</moul-toggle-button>
  <moul-toggle-button value="right">Right</moul-toggle-button>
</moul-toggle-button-group>`,
      },
    ],
  },
  {
    title: 'Inputs & Forms',
    families: [
      {
        name: 'TextField',
        docs: '/docs/components/textfield',
        summary:
          'Form-associated text input with label, description, and error message.',
        tags: ['moul-text-field'],
        snippet: `<moul-text-field name="email" type="email" label="Email" placeholder="you@example.com" is-required></moul-text-field>`,
      },
      {
        name: 'NumberField',
        docs: '/docs/components/numberfield',
        summary: 'Numeric input with stepper buttons and min/max bounds.',
        tags: ['moul-number-field'],
        snippet: `<moul-number-field name="seats" label="Seats" value="5" min="1" max="50" step="1"></moul-number-field>`,
      },
      {
        name: 'SearchField',
        docs: '/docs/components/searchfield',
        summary: 'Search input in a `<search>` landmark with a clear button.',
        tags: ['moul-search-field'],
        snippet: `<moul-search-field name="q" label="Search" placeholder="Search projects…"></moul-search-field>`,
      },
      {
        name: 'TextArea',
        docs: '/docs/components/textarea',
        summary:
          'Multiline text input with optional content-based auto-resize.',
        tags: ['moul-text-area'],
        snippet: `<moul-text-area name="bio" label="Bio" rows="4" auto-resize></moul-text-area>`,
      },
      {
        name: 'Checkbox',
        docs: '/docs/components/checkbox',
        summary: 'Form-associated checkbox with indeterminate state.',
        tags: ['moul-checkbox'],
        snippet: `<moul-checkbox name="terms" is-required>I accept the terms</moul-checkbox>`,
      },
      {
        name: 'CheckboxGroup',
        docs: '/docs/components/checkboxgroup',
        summary: 'Group of checkboxes submitting an array value.',
        tags: ['moul-checkbox-group'],
        snippet: `<moul-checkbox-group name="notify" label="Notify me by" orientation="horizontal">
  <moul-checkbox value="email">Email</moul-checkbox>
  <moul-checkbox value="sms">SMS</moul-checkbox>
</moul-checkbox-group>`,
      },
      {
        name: 'RadioGroup',
        docs: '/docs/components/radiogroup',
        summary: 'Radio group with arrow-key navigation.',
        tags: ['moul-radio-group', 'moul-radio'],
        snippet: `<moul-radio-group name="plan" label="Plan" value="pro">
  <moul-radio value="free">Free</moul-radio>
  <moul-radio value="pro">Pro</moul-radio>
</moul-radio-group>`,
      },
      {
        name: 'Switch',
        docs: '/docs/components/switch',
        summary: 'On/off switch with `role="switch"` semantics.',
        tags: ['moul-switch'],
        snippet: `<moul-switch name="notifications" is-checked>Enable notifications</moul-switch>`,
      },
      {
        name: 'Slider',
        docs: '/docs/components/slider',
        summary: 'Range slider with live output.',
        tags: ['moul-slider'],
        snippet: `<moul-slider name="volume" label="Volume" min="0" max="100" step="5" value="40"></moul-slider>`,
      },
      {
        name: 'Select',
        docs: '/docs/components/select',
        summary: 'Single-select dropdown rendered in a native popover.',
        tags: ['moul-select', 'moul-select-item'],
        snippet: `<moul-select name="region" label="Region" placeholder="Choose a region">
  <moul-select-item key="us">United States</moul-select-item>
  <moul-select-item key="kh">Cambodia</moul-select-item>
</moul-select>`,
      },
      {
        name: 'ComboBox',
        docs: '/docs/components/combobox',
        summary: 'Filterable autocomplete input.',
        tags: ['moul-combobox', 'moul-combobox-item'],
        snippet: `<moul-combobox name="framework" label="Framework" placeholder="Type to filter…">
  <moul-combobox-item key="astro">Astro</moul-combobox-item>
  <moul-combobox-item key="lit">Lit</moul-combobox-item>
  <span slot="empty">No matches</span>
</moul-combobox>`,
      },
      {
        name: 'DatePicker',
        docs: '/docs/components/datepicker',
        summary:
          'ISO date input that opens a calendar popover; locale-aware display.',
        tags: ['moul-date-picker'],
        snippet: `<moul-date-picker name="start" label="Start date" value="2026-10-19" locale="km-KH"></moul-date-picker>`,
      },
      {
        name: 'Calendar',
        docs: '/docs/components/calendar',
        summary: 'Month grid date selector with min/max bounds.',
        tags: ['moul-calendar'],
        snippet: `<moul-calendar value="2026-10-19" min-date="2026-01-01" max-date="2026-12-31"></moul-calendar>`,
      },
      {
        name: 'InputOTP',
        docs: '/docs/components/inputotp',
        summary: 'One-time passcode input with per-character slots.',
        tags: ['moul-input-otp'],
        snippet: `<moul-input-otp name="code" length="6" label="Verification code"></moul-input-otp>`,
      },
      {
        name: 'Form',
        docs: '/docs/components/form',
        summary:
          'Native `<form>` wrapper that collects values from form-associated `moul-*` fields.',
        tags: ['moul-form'],
        snippet: `<moul-form action="/api/signup" method="post">
  <moul-text-field name="email" type="email" label="Email" is-required></moul-text-field>
  <moul-button type="submit">Sign up</moul-button>
</moul-form>`,
      },
    ],
  },
  {
    title: 'Overlays & Navigation',
    families: [
      {
        name: 'Modal',
        docs: '/docs/components/modal',
        summary:
          'Native `<dialog>` modal with focus trap and backdrop dismiss.',
        tags: ['moul-modal'],
        snippet: `<moul-modal id="invite" size="md">
  <h2 slot="header">Invite teammates</h2>
  <p>Send an invite link to your team.</p>
  <moul-button slot="footer" variant="primary">Send</moul-button>
</moul-modal>`,
        script: `document.querySelector('#invite').isOpen = true`,
      },
      {
        name: 'AlertDialog',
        docs: '/docs/components/alertdialog',
        summary:
          'Blocking confirmation dialog with `role="alertdialog"` and confirm/cancel events.',
        tags: ['moul-alert-dialog'],
        snippet: `<moul-alert-dialog is-open tone="error">
  <span slot="header">Delete project?</span>
  <span slot="body">This action cannot be undone.</span>
</moul-alert-dialog>`,
      },
      {
        name: 'Drawer',
        docs: '/docs/components/drawer',
        summary: 'Edge-anchored panel built on native `<dialog>`.',
        tags: ['moul-drawer'],
        snippet: `<moul-drawer placement="right" size="md" is-open>
  <h2 slot="header">Filters</h2>
  <p>Drawer content</p>
</moul-drawer>`,
      },
      {
        name: 'Popover',
        docs: '/docs/components/popover',
        summary: 'Popover API + CSS anchor positioning with a slotted trigger.',
        tags: ['moul-popover'],
        snippet: `<moul-popover placement="bottom">
  <moul-button slot="trigger" variant="outline">Options</moul-button>
  <p>Popover content</p>
</moul-popover>`,
      },
      {
        name: 'Tooltip',
        docs: '/docs/components/tooltip',
        summary: 'Hover/focus tooltip wired with `aria-describedby`.',
        tags: ['moul-tooltip'],
        snippet: `<moul-tooltip content="Copy to clipboard" placement="top">
  <moul-button is-icon aria-label="Copy">⧉</moul-button>
</moul-tooltip>`,
      },
      {
        name: 'CommandPalette',
        docs: '/docs/components/commandpalette',
        summary: '⌘K command menu with grouped, filterable items.',
        tags: ['moul-command-palette'],
        snippet: `<moul-command-palette id="cmdk" shortcut="k"></moul-command-palette>`,
        script: `const palette = document.querySelector('#cmdk')
palette.items = [
  { id: 'new', title: 'New project', group: 'Actions', shortcut: 'N' },
  { id: 'settings', title: 'Open settings', group: 'Navigation' },
]
palette.addEventListener('select', (e) => console.log(e.detail.item))`,
      },
      {
        name: 'Tabs',
        docs: '/docs/components/tabs',
        summary:
          'Tablist with sliding indicator and roving tabindex; panels matched by `key`.',
        tags: ['moul-tabs', 'moul-tab', 'moul-tab-panel'],
        snippet: `<moul-tabs selected-key="overview" variant="line">
  <moul-tab slot="tab" key="overview">Overview</moul-tab>
  <moul-tab slot="tab" key="activity">Activity</moul-tab>
  <moul-tab-panel key="overview">Overview content</moul-tab-panel>
  <moul-tab-panel key="activity">Activity content</moul-tab-panel>
</moul-tabs>`,
      },
      {
        name: 'Breadcrumbs',
        docs: '/docs/components/breadcrumbs',
        summary: 'Breadcrumb trail with `aria-current` on the last item.',
        tags: ['moul-breadcrumbs', 'moul-breadcrumb-item'],
        snippet: `<moul-breadcrumbs separator="/">
  <moul-breadcrumb-item href="/">Home</moul-breadcrumb-item>
  <moul-breadcrumb-item href="/projects">Projects</moul-breadcrumb-item>
  <moul-breadcrumb-item is-current>Moul UI</moul-breadcrumb-item>
</moul-breadcrumbs>`,
      },
      {
        name: 'Pagination',
        docs: '/docs/components/pagination',
        summary: 'Page navigation with ellipsis truncation.',
        tags: ['moul-pagination'],
        snippet: `<moul-pagination total-pages="12" current-page="3" sibling-count="1"></moul-pagination>`,
      },
      {
        name: 'Link',
        docs: '/docs/components/link',
        summary: 'Anchor with variants and external-link handling.',
        tags: ['moul-link'],
        snippet: `<moul-link href="https://moul.dev" is-external>moul.dev</moul-link>`,
      },
    ],
  },
  {
    title: 'Surfaces & Feedback',
    families: [
      {
        name: 'Alert',
        docs: '/docs/components/alert',
        summary: 'Inline status message with semantic tone and dismiss action.',
        tags: ['moul-alert'],
        snippet: `<moul-alert tone="success" variant="flat" title="Deployed" is-dismissible>
  Your changes are live.
</moul-alert>`,
      },
      {
        name: 'Card',
        docs: '/docs/components/card',
        summary: 'Surface container with header, body, and footer regions.',
        tags: [
          'moul-card',
          'moul-card-header',
          'moul-card-body',
          'moul-card-footer',
        ],
        snippet: `<moul-card variant="bordered" is-interactive>
  <moul-card-header>Usage</moul-card-header>
  <moul-card-body>1,204 requests today</moul-card-body>
  <moul-card-footer><moul-link href="/usage">View details</moul-link></moul-card-footer>
</moul-card>`,
      },
      {
        name: 'Badge',
        docs: '/docs/components/badge',
        summary: 'Compact status chip or dot indicator.',
        tags: ['moul-badge'],
        snippet: `<moul-badge tone="success" variant="flat">Active</moul-badge>
<moul-badge tone="error" is-dot aria-label="Offline"></moul-badge>`,
      },
      {
        name: 'Avatar',
        docs: '/docs/components/avatar',
        summary:
          'Image avatar with initials fallback, status dot, and grouping.',
        tags: ['moul-avatar', 'moul-avatar-group'],
        snippet: `<moul-avatar-group max="3" size="sm">
  <moul-avatar name="Sophearak Tha" src="/avatars/1.png" status="online"></moul-avatar>
  <moul-avatar name="Dara Kim"></moul-avatar>
</moul-avatar-group>`,
      },
      {
        name: 'Typography',
        docs: '/docs/components/typography',
        summary: 'Headings, body, caption, and code text styles.',
        tags: ['moul-typography'],
        snippet: `<moul-typography variant="h2">Dashboard</moul-typography>
<moul-typography variant="caption" tone="accent">Updated 2 minutes ago</moul-typography>`,
      },
      {
        name: 'Kbd',
        docs: '/docs/components/kbd',
        summary: 'Keyboard shortcut hint.',
        tags: ['moul-kbd'],
        snippet: `<moul-kbd keys="Meta+K"></moul-kbd>`,
      },
      {
        name: 'Separator',
        docs: '/docs/components/separator',
        summary: 'Horizontal or vertical divider with `role="separator"`.',
        tags: ['moul-separator'],
        snippet: `<moul-separator orientation="horizontal"></moul-separator>`,
      },
      {
        name: 'Spinner',
        docs: '/docs/components/spinner',
        summary: 'Indeterminate loading indicator with accessible label.',
        tags: ['moul-spinner'],
        snippet: `<moul-spinner size="sm" label="Loading projects"></moul-spinner>`,
      },
      {
        name: 'Skeleton',
        docs: '/docs/components/skeleton',
        summary: 'Loading placeholder in line, circle, or rect shapes.',
        tags: ['moul-skeleton'],
        snippet: `<moul-skeleton shape="line" width="12rem"></moul-skeleton>
<moul-skeleton shape="circle" width="2.5rem" height="2.5rem" variant="wave"></moul-skeleton>`,
      },
      {
        name: 'ProgressBar',
        docs: '/docs/components/progressbar',
        summary:
          'Determinate or indeterminate progress with `role="progressbar"`.',
        tags: ['moul-progress-bar'],
        snippet: `<moul-progress-bar value="64" max="100" tone="primary" aria-label="Upload progress"></moul-progress-bar>`,
      },
      {
        name: 'TagGroup',
        docs: '/docs/components/taggroup',
        summary: 'Selectable and removable tags.',
        tags: ['moul-tag-group', 'moul-tag'],
        snippet: `<moul-tag-group label="Filters" selection-mode="multiple" is-removable>
  <moul-tag key="open" tone="success">Open</moul-tag>
  <moul-tag key="bug" tone="error">Bug</moul-tag>
</moul-tag-group>`,
      },
      {
        name: 'Table',
        docs: '/docs/components/table',
        summary:
          'Data table with sortable columns, row selection, and loading/empty states.',
        tags: ['moul-table'],
        snippet: `<moul-table id="users" is-sortable is-selectable>
  <span slot="caption">Team members</span>
  <span slot="empty">No members yet</span>
</moul-table>`,
        script: `const table = document.querySelector('#users')
table.columns = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'role', title: 'Role' },
]
table.data = [{ id: '1', name: 'Dara', role: 'Admin' }]`,
      },
      {
        name: 'Toast',
        docs: '/docs/components/toast',
        summary:
          'Transient notifications managed by the `toastQueue` singleton.',
        tags: ['moul-toast', 'moul-toast-region'],
        snippet: `<moul-toast-region></moul-toast-region>
<moul-toast tone="success" title="Saved" description="Your profile was updated."></moul-toast>`,
        script: `import { toastQueue } from '@moul-dev/ui'

toastQueue.add({ title: 'Saved', description: 'Your profile was updated.', tone: 'success' })`,
      },
      {
        name: 'EmptyState',
        docs: '/docs/components/emptystate',
        summary: 'Placeholder for empty collections with icon and actions.',
        tags: ['moul-empty-state'],
        snippet: `<moul-empty-state size="md" align="center">
  <span slot="title">No projects</span>
  <span slot="description">Create your first project to get started.</span>
  <moul-button slot="actions" variant="primary">New project</moul-button>
</moul-empty-state>`,
      },
    ],
  },
  {
    title: 'Composite Blocks',
    families: [
      {
        name: 'LogsViewer',
        docs: '/docs/blocks/logs',
        summary:
          'Virtualized log viewer with level filtering, search, and an inspector panel.',
        tags: ['moul-logs-viewer', 'moul-logs'],
        snippet: `<moul-logs-viewer id="viewer" title="Build logs" filter-level="all" max-height="480px"></moul-logs-viewer>

<moul-logs show-timestamps wrap-lines>
2026-10-19T10:00:01Z INFO server started on :8080
2026-10-19T10:00:04Z WARN cache miss ratio 0.42
</moul-logs>`,
        script: `document.querySelector('#viewer').logs = [
  { id: 1, timestamp: '2026-10-19T10:00:01Z', level: 'info', message: 'server started' },
]`,
      },
      {
        name: 'Sidebar',
        docs: '/docs/blocks/sidebar',
        summary:
          'Application shell with collapsible navigation, propagated via `@lit/context`.',
        tags: [
          'moul-sidebar',
          'moul-sidebar-aside',
          'moul-sidebar-header',
          'moul-sidebar-brand',
          'moul-sidebar-group',
          'moul-sidebar-item',
          'moul-sidebar-divider',
          'moul-sidebar-footer',
          'moul-sidebar-user',
          'moul-sidebar-main',
        ],
        snippet: `<moul-sidebar layout="sidebar-framed" selected-key="home">
  <moul-sidebar-aside aria-label="Main navigation" show-collapse-toggle>
    <moul-sidebar-header>
      <moul-sidebar-brand title="Moul" subtitle="Workspace" href="/"></moul-sidebar-brand>
    </moul-sidebar-header>
    <moul-sidebar-group label="General">
      <moul-sidebar-item key="home" href="/" label="Home"></moul-sidebar-item>
      <moul-sidebar-item key="inbox" href="/inbox" label="Inbox" badge="3"></moul-sidebar-item>
    </moul-sidebar-group>
    <moul-sidebar-divider></moul-sidebar-divider>
    <moul-sidebar-footer>
      <moul-sidebar-user name="Sophearak Tha" email="hello@moul.dev"></moul-sidebar-user>
    </moul-sidebar-footer>
  </moul-sidebar-aside>
  <moul-sidebar-main>Page content</moul-sidebar-main>
</moul-sidebar>`,
      },
    ],
  },
]
