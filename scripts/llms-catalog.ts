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
          'Area chart with optional stacking that you scrub with the pointer or arrow keys (slider semantics), and that morphs between data sets such as 7/30/90-day ranges.',
        tags: ['moul-area-chart'],
        snippet: `<moul-area-chart id="revenue" label="Revenue" x-key="month" height="280" stacked></moul-area-chart>`,
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
        summary:
          'Multi-series line chart with pointer and keyboard scrubbing; `is-live` turns it into a real-time feed with `push()`, `max-points`, a gliding line and a pause button.',
        tags: ['moul-line-chart'],
        snippet: `<moul-line-chart id="latency" label="Latency" x-key="time" is-live max-points="40"></moul-line-chart>`,
        script: `const chart = document.querySelector('#latency')
chart.series = [{ key: 'p50', name: 'p50' }, { key: 'p99', name: 'p99' }]
chart.valueFormatter = (v) => \`\${v} ms\`
setInterval(() => chart.push({ time: new Date().toLocaleTimeString(), p50: 40, p99: 160 }), 1000)`,
      },
      {
        name: 'DoughnutChart',
        docs: '/docs/components/charts/doughnutchart',
        summary:
          'Doughnut, pie or half-circle chart whose centre shows the hovered slice; set `value`/`min`/`max` for a gauge that sweeps and counts to each new value.',
        tags: ['moul-doughnut-chart'],
        snippet: `<moul-doughnut-chart id="traffic" center-label="12.4k" center-sublabel="Visits"></moul-doughnut-chart>
<moul-doughnut-chart shape="half" height="170" value="72" center-sublabel="Disk used"></moul-doughnut-chart>`,
        script: `document.querySelector('#traffic').data = [
  { name: 'Direct', value: 5400 },
  { name: 'Search', value: 4100 },
  { name: 'Social', value: 2900 },
]`,
      },
      {
        name: 'HeatmapChart',
        docs: '/docs/components/charts/heatmapchart',
        summary:
          'Contributions-style calendar of daily totals, or a weekday × hour punch card (`mode="hour"`) from the same timestamps.',
        tags: ['moul-heatmap-chart'],
        snippet: `<moul-chart-container title="Activity" description="Daily contributions">
  <moul-tabs slot="header" selected-key="calendar">
    <moul-tab key="calendar">Calendar</moul-tab>
    <moul-tab key="hour">By hour</moul-tab>
  </moul-tabs>
  <moul-heatmap-chart id="activity" unit="contributions"></moul-heatmap-chart>
</moul-chart-container>`,
        script: `const heatmap = document.querySelector('#activity')
// One item per event (value defaults to 1), or one per day with a total.
heatmap.data = [
  { date: '2025-10-23', value: 6 },
  { date: '2025-10-24T14:05:00', value: 17 },
]
document.querySelector('moul-tabs').addEventListener('selectionchange', (e) => {
  heatmap.mode = e.detail.selectedKey
})`,
      },
      {
        name: 'FunnelChart',
        docs: '/docs/components/charts/funnelchart',
        summary:
          'Ordered conversion steps as centered bars with per-step drop-off and an overall-conversion summary.',
        tags: ['moul-funnel-chart'],
        snippet: `<moul-chart-container title="Signup funnel" description="Visit to paid, last 30 days">
  <moul-funnel-chart id="signups"></moul-funnel-chart>
</moul-chart-container>`,
        script: `document.querySelector('#signups').data = [
  { label: 'Visited site', value: 48200 },
  { label: 'Signed up', value: 15840 },
  { label: 'Started paid plan', value: 1380 },
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
          'Chart card with title, description, header actions, legend, and empty state slots; sizes to its chart unless `height` is set.',
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
          'Button with 7 variants, 3 sizes, icon-only mode, and pending, success and error states; `run(task)` drives them from a promise.',
        tags: ['moul-button'],
        snippet: `<moul-button variant="primary" size="md">Save changes</moul-button>
<moul-button variant="ghost" is-icon aria-label="Close">×</moul-button>
<moul-button id="save">
  Save
  <span slot="pending">Saving…</span>
  <span slot="success">Saved</span>
</moul-button>`,
        script: `const save = document.querySelector('#save')
save.addEventListener('press', () => {
  save.run(() => fetch('/api/save', { method: 'POST' })).catch(() => {})
})`,
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
        name: 'SlideToConfirm',
        docs: '/docs/components/slidetoconfirm',
        summary:
          'Drag a handle across a track to confirm a risky action; a keyboard slider (arrows, `End`) reaches the same result.',
        tags: ['moul-slide-to-confirm'],
        snippet: `<moul-slide-to-confirm tone="error" label="Slide to delete project" confirmed-label="Deleting"></moul-slide-to-confirm>`,
        script: `slider.addEventListener('confirm', async () => {
  slider.isPending = true
  try { await deleteProject() } catch { slider.reset() } finally { slider.isPending = false }
})`,
      },
      {
        name: 'SplitButton',
        docs: '/docs/components/splitbutton',
        summary:
          'Main action joined to a chevron menu of related actions; `press` from the main part, `action` from the menu.',
        tags: ['moul-split-button'],
        snippet: `<moul-split-button menu-label="More deploy options">
  Deploy
  <moul-menu-item slot="menu" value="staging">Deploy to staging</moul-menu-item>
  <moul-menu-item slot="menu" value="schedule">Schedule deploy…</moul-menu-item>
</moul-split-button>`,
      },
      {
        name: 'ThemeToggle',
        docs: '/docs/components/themetoggle',
        summary:
          'Light/dark/system switch with a circular reveal; applies `data-theme` and `color-scheme` to `<html>` and remembers the choice.',
        tags: ['moul-theme-toggle'],
        snippet: `<moul-theme-toggle modes="system light dark" variant="ghost"></moul-theme-toggle>`,
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
        name: 'FileUpload',
        docs: '/docs/components/fileupload',
        summary:
          'Drop zone and file list with per-file progress; set `upload` to send each file as it is picked.',
        tags: ['moul-file-upload'],
        snippet: `<moul-file-upload name="attachments" label="Attachments" accept="image/*,.pdf" max-size="5242880" is-multiple></moul-file-upload>`,
        script: `const field = document.querySelector('moul-file-upload')
field.upload = async (file, { signal, onProgress }) => {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/files', { method: 'POST', body, signal })
  onProgress(100)
  return res.json() // stored on the item as \`response\`
}`,
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
        summary:
          'Edge-anchored panel built on native `<dialog>`; `is-sheet` makes it a bottom sheet dragged down to dismiss.',
        tags: ['moul-drawer'],
        snippet: `<moul-drawer placement="right" size="md" is-open>
  <h2 slot="header">Filters</h2>
  <p>Drawer content</p>
</moul-drawer>
<moul-drawer is-sheet aria-label="Share">
  <h2 slot="header">Share</h2>
  <moul-button slot="footer">Done</moul-button>
</moul-drawer>`,
      },
      {
        name: 'DropdownMenu',
        docs: '/docs/components/dropdownmenu',
        summary:
          'Menu button: items, checkbox and radio items, groups and separators; fires `action` with `detail.value`.',
        tags: [
          'moul-dropdown-menu',
          'moul-menu-item',
          'moul-menu-group',
          'moul-menu-separator',
        ],
        snippet: `<moul-dropdown-menu placement="bottom-end">
  <moul-button slot="trigger" variant="outline">Actions</moul-button>
  <moul-menu-item value="edit" shortcut="⌘E">Edit</moul-menu-item>
  <moul-menu-group label="Sort by">
    <moul-menu-item type="radio" value="name" is-checked>Name</moul-menu-item>
    <moul-menu-item type="radio" value="date">Date</moul-menu-item>
  </moul-menu-group>
  <moul-menu-separator></moul-menu-separator>
  <moul-menu-item value="delete" variant="danger">Delete</moul-menu-item>
</moul-dropdown-menu>`,
        script: `menu.addEventListener('action', (e) => console.log(e.detail.value))`,
      },
      {
        name: 'Stepper',
        docs: '/docs/components/stepper',
        summary:
          'Multi-step flow with an animated connector; cancel `stepchange` to keep the user on a step that does not validate.',
        tags: ['moul-stepper', 'moul-step'],
        snippet: `<moul-stepper id="checkout" current="0">
  <moul-step label="Cart" description="3 items">…</moul-step>
  <moul-step label="Delivery">…</moul-step>
  <moul-step label="Payment">…</moul-step>
</moul-stepper>`,
        script: `const stepper = document.querySelector('#checkout')
stepper.addEventListener('stepchange', (e) => {
  if (e.detail.current > e.detail.previous && !isValid()) e.preventDefault()
})
stepper.next()`,
      },
      {
        name: 'Tree',
        docs: '/docs/components/tree',
        summary:
          'Collapsible tree view with roving focus, type-ahead and none/single/multiple selection.',
        tags: ['moul-tree', 'moul-tree-item'],
        snippet: `<moul-tree label="Project files" selection-mode="single">
  <moul-tree-item value="src" label="src" is-expanded>
    <moul-tree-item value="src/index.ts" label="index.ts"></moul-tree-item>
  </moul-tree-item>
  <moul-tree-item value="docs" label="docs" has-children></moul-tree-item>
</moul-tree>`,
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
        summary:
          'Hover/focus label that slides out of its trigger; `follow="pointer"` trails the pointer, `is-rich` makes a small non-interactive card with a `media` slot.',
        tags: ['moul-tooltip'],
        snippet: `<moul-tooltip content="Copy to clipboard" placement="top">
  <moul-button is-icon aria-label="Copy">⧉</moul-button>
</moul-tooltip>
<moul-tooltip is-rich follow="pointer">
  <moul-avatar name="Sophea Chan" tabindex="0"></moul-avatar>
  <img slot="media" src="/sophea.jpg" alt="" />
  <span slot="content">Sophea Chan · Design</span>
</moul-tooltip>`,
      },
      {
        name: 'HoverCard',
        docs: '/docs/components/hovercard',
        summary:
          'Preview card beside a link or name on hover or keyboard focus; may hold links and buttons and stays open while the pointer is in it. Touch never opens it.',
        tags: ['moul-hover-card'],
        snippet: `<moul-hover-card placement="bottom" open-delay="500" close-delay="300">
  <a slot="trigger" href="/people/sophea">@sophea</a>
  <strong>Sophea Chan</strong>
  <moul-button size="sm" variant="secondary">Follow</moul-button>
</moul-hover-card>`,
        script: `card.addEventListener('openchange', (e) => console.log(e.detail.isOpen))`,
      },
      {
        name: 'Notification Bell',
        docs: '/docs/components/notificationbell',
        summary:
          'Bell button with an unread badge that swings when `count` rises and opens a panel listing its children.',
        tags: ['moul-notification-bell'],
        snippet: `<moul-notification-bell id="inbox" count="2">
  <moul-button slot="header-actions" size="sm" variant="ghost">Mark all read</moul-button>
  <div>Deploy finished</div>
  <div>New sign-up</div>
  <a slot="footer" href="/notifications">View all</a>
</moul-notification-bell>`,
        script: `const bell = document.querySelector('#inbox')
bell.prepend(item)
bell.count += 1
await bell.removeItem(item)`,
      },
      {
        name: 'Tour',
        docs: '/docs/components/tour',
        summary:
          "Product walkthrough in a modal dialog: the page dims except a cutout around each step's target, with a card of heading, body, progress and Back/Next/Done.",
        tags: ['moul-tour', 'moul-tour-step'],
        snippet: `<moul-tour id="welcome">
  <moul-tour-step heading="Welcome">A quick look around.</moul-tour-step>
  <moul-tour-step target="#new" heading="Start a project">Everything lives in a project.</moul-tour-step>
  <moul-tour-step target="#invite" heading="Bring your team" placement="right">Invite people by email.</moul-tour-step>
</moul-tour>`,
        script: `const tour = document.querySelector('#welcome')
tour.start()
tour.addEventListener('openchange', (e) => {
  if (!e.detail.isOpen && e.detail.isComplete) localStorage.setItem('tour', 'done')
})`,
      },
      {
        name: 'FocusMode',
        docs: '/docs/components/focusmode',
        summary:
          'Dims the page around the region it wraps (or `target`); clicks pass through the cutout, and a click on the dim or `Escape` ends it. Visual only, not modal.',
        tags: ['moul-focus-mode'],
        snippet: `<moul-focus-mode id="draft">
  <moul-text-area label="Release notes"></moul-text-area>
</moul-focus-mode>`,
        script: `document.querySelector('#draft').toggle()`,
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
        name: 'Accordion',
        docs: '/docs/components/accordion',
        summary:
          'Disclosure list whose panels open with a spring; one open at a time unless `is-multiple`.',
        tags: ['moul-accordion', 'moul-accordion-item'],
        snippet: `<moul-accordion variant="separated">
  <moul-accordion-item value="shipping" heading="How long does shipping take?" is-open>Next day.</moul-accordion-item>
  <moul-accordion-item value="returns" heading="Can I return an item?">Within 30 days.</moul-accordion-item>
</moul-accordion>`,
      },
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
        name: 'Animated List',
        docs: '/docs/components/animatedlist',
        summary:
          'Feed whose new children grow in and push the others along; `removeItem()` shrinks one away while the rest close ranks, and `is-live` announces arrivals.',
        tags: ['moul-animated-list'],
        snippet: `<moul-animated-list id="feed" is-live>
  <div class="event">Deploy finished</div>
  <div class="event">New sign-up</div>
</moul-animated-list>`,
        script: `const feed = document.querySelector('#feed')
feed.prepend(newEventElement) // animates in
await feed.removeItem(feed.items.at(-1))`,
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
        summary:
          'Compact status chip or dot indicator; `count` rolls to each new value (`99+` past `max`) and `is-live` pulses a live dot.',
        tags: ['moul-badge'],
        snippet: `<moul-badge tone="success" variant="flat">Active</moul-badge>
<moul-badge tone="error" variant="solid" count="3"></moul-badge>
<moul-badge tone="success" is-dot is-live aria-label="Online"></moul-badge>`,
      },
      {
        name: 'NumberTicker',
        docs: '/docs/components/numberticker',
        summary:
          'Number that rolls like an odometer (or counts with `mode="count"`) to each new `value`; Intl formatting via `locale` and `formatOptions`, and `from` counts up on first view.',
        tags: ['moul-number-ticker'],
        snippet: `<moul-number-ticker value="1280" from="0"></moul-number-ticker>`,
        script: `const ticker = document.querySelector('moul-number-ticker')
ticker.formatOptions = { style: 'currency', currency: 'USD' }
ticker.value = 1530`,
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
        name: 'IconMorph',
        docs: '/docs/components/iconmorph',
        summary:
          'Icon that morphs into another when `name` changes (menu/close, play/pause, sun/moon, loader/check).',
        tags: ['moul-icon-morph'],
        snippet: `<moul-button is-icon aria-label="Open menu">
  <moul-icon-morph name="menu"></moul-icon-morph>
</moul-button>`,
      },
      {
        name: 'Spinner',
        docs: '/docs/components/spinner',
        summary:
          'Indeterminate loading indicator with accessible label; `variant` is `ring`, `dots`, `shape` or `orbit`.',
        tags: ['moul-spinner'],
        snippet: `<moul-spinner size="sm" label="Loading projects"></moul-spinner>
<moul-spinner variant="dots" label="Saving"></moul-spinner>`,
      },
      {
        name: 'StepLoader',
        docs: '/docs/components/steploader',
        summary:
          'Checklist that ticks off the steps of a long task: drawn checks for done steps, a spinner on the current one; `interval` advances it by itself and `is-error` marks a failure.',
        tags: ['moul-step-loader'],
        snippet: `<moul-step-loader id="publish" label="Publishing site"></moul-step-loader>`,
        script: `const loader = document.querySelector('#publish')
loader.steps = ['Checking files', { label: 'Uploading', description: '12 files' }, 'Publishing']
loader.addEventListener('complete', () => console.log('done'))
loader.current = 1 // or loader.isError = true`,
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
        name: 'ResultCard',
        docs: '/docs/components/resultcard',
        summary:
          'Success or failure card whose ring and check (or cross) draw themselves; start it `pending` and set `status` when the task ends so the outcome is announced.',
        tags: ['moul-result-card'],
        snippet: `<moul-result-card status="pending" heading="Processing payment" description="This takes a few seconds.">
  <moul-button slot="actions" variant="primary">Done</moul-button>
</moul-result-card>`,
        script: `const card = document.querySelector('moul-result-card')
card.status = 'success'
card.heading = 'Payment sent'`,
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
          'Data table with search, filters, sorting, row selection, expandable rows and a card layout on narrow screens; `is-manual` hands search, filters and sorting to the server.',
        tags: ['moul-table'],
        snippet: `<moul-table id="users" aria-label="Team members" is-searchable is-sortable is-selectable>
  <span slot="caption">Team members</span>
  <span slot="empty">No members yet</span>
</moul-table>`,
        script: `import { html } from 'lit'

const table = document.querySelector('#users')
table.columns = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'role', title: 'Role', filterOptions: [{ value: 'Admin', label: 'Admin' }, { value: 'Member', label: 'Member' }] },
  // render() puts markup in the cell; it runs inside the table's shadow root.
  { key: 'status', title: 'Status', render: (row) => html\`<moul-badge tone="success">\${row.status}</moul-badge>\` },
]
table.data = [{ id: '1', name: 'Dara', role: 'Admin', status: 'Active' }]
table.renderExpanded = (row) => html\`<p>\${row.name} joined in 2024.</p>\``,
      },
      {
        name: 'SelectionToolbar',
        docs: '/docs/components/selectiontoolbar',
        summary:
          'Floating bar of bulk actions that appears while rows of a bound `moul-table` are selected.',
        tags: ['moul-selection-toolbar'],
        snippet: `<moul-table id="users" is-selectable></moul-table>
<moul-selection-toolbar for="users">
  <moul-button size="sm" variant="secondary">Export</moul-button>
  <moul-button size="sm" variant="danger-soft">Delete</moul-button>
</moul-selection-toolbar>`,
      },
      {
        name: 'Toast',
        docs: '/docs/components/toast',
        summary:
          'Transient notifications queued with `toastQueue.add()`: swipe to dismiss, an optional stacked deck (`is-stacked`, `toastQueue.isStacked`), and undo toasts with an `action` button and a `showCountdown` bar. Timers pause on hover, swipe and keyboard focus.',
        tags: ['moul-toast', 'moul-toast-region'],
        snippet: `<moul-toast-region is-stacked></moul-toast-region>
<moul-toast title="3 rows deleted" duration="8000" show-countdown>
  <moul-button slot="action" size="sm" variant="secondary">Undo</moul-button>
</moul-toast>`,
        script: `import { toastQueue } from '@moul-dev/web-component'

toastQueue.add({
  title: '3 rows deleted',
  duration: 8000,
  showCountdown: true,
  action: { label: 'Undo', onAction: () => restoreRows() },
})`,
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
      {
        name: 'ExpandableCard',
        docs: '/docs/components/expandablecard',
        summary:
          'Card that springs from its place in the page into a centred modal dialog to show its `details`, and shrinks back; the closed card is one button.',
        tags: ['moul-expandable-card'],
        snippet: `<moul-expandable-card size="sm">
  <img slot="media" src="/cabin.jpg" alt="" />
  <h3>Mountain cabin</h3>
  <span>2 nights · sleeps 4</span>
  <div slot="details">
    <p>Full description…</p>
    <moul-button variant="primary">Book</moul-button>
  </div>
</moul-expandable-card>`,
        script: `card.addEventListener('openchange', (e) => console.log(e.detail.isOpen))
await card.setOpen(true)`,
      },
      {
        name: 'PullToRefresh',
        docs: '/docs/components/pulltorefresh',
        summary:
          'Scroll container that refreshes when pulled down from its top; pass the work to `event.detail.waitUntil()`.',
        tags: ['moul-pull-to-refresh'],
        snippet: `<moul-pull-to-refresh style="height: 100%">
  <ul id="inbox">…</ul>
</moul-pull-to-refresh>`,
        script: `feed.addEventListener('refresh', (e) => e.detail.waitUntil(loadNewMessages()))`,
      },
      {
        name: 'Confetti',
        docs: '/docs/components/confetti',
        summary:
          "Confetti burst or rocket on success, from the effects entry (`import '@moul-dev/web-component/effects'`); decorative, skipped under reduced motion.",
        tags: ['moul-confetti'],
        snippet: `<moul-confetti>
  <moul-button id="pay">Pay $120</moul-button>
</moul-confetti>`,
        script: `await submitPayment()
document.querySelector('moul-confetti').fire({ variant: 'rocket' })
// or: import { fireConfetti } from '@moul-dev/web-component/effects'`,
      },
    ],
  },
  {
    title: 'Data & Developer',
    families: [
      {
        name: 'ActivityFeed',
        docs: '/docs/components/activityfeed',
        summary:
          'Live event stream, newest first, for audit trails and request logs; events with a `payload` expand into highlighted JSON, and new events wait while the pointer or focus is inside or while paused.',
        tags: ['moul-activity-feed'],
        snippet: `<moul-activity-feed id="requests" label="Requests"></moul-activity-feed>`,
        script: `const feed = document.querySelector('#requests')
feed.events = [{ id: 1, title: 'Deploy finished', tone: 'success', timestamp: Date.now() }]
feed.push({ id: 2, title: 'POST /api/records', badge: '201', tone: 'success', timestamp: Date.now(), payload: { id: 'rec_8f2' } })`,
      },
      {
        name: 'CodeBlock',
        docs: '/docs/components/codeblock',
        summary:
          'Read-only highlighted code (TS/JS, JSON, HTML, CSS, shell, Python, Rust, SQL, YAML, diff) with a copy button, line highlights, line numbers and tabs; blocks sharing a `sync-key` switch tabs together.',
        tags: ['moul-code-block'],
        snippet: `<moul-code-block language="ts" filename="main.ts" highlight-lines="2" show-line-numbers>
  import '@moul-dev/web-component'
  document.querySelector('moul-toast-region')
</moul-code-block>
<moul-code-block language="bash" sync-key="pm">
  <script type="text/plain" data-label="bun">bun add @moul-dev/web-component</script>
  <script type="text/plain" data-label="npm">npm install @moul-dev/web-component</script>
</moul-code-block>`,
      },
      {
        name: 'CodeComparison',
        docs: '/docs/components/codecomparison',
        summary:
          'Two versions of a snippet compared line by line, split side by side or unified, with removed and added lines and the edited part of each line marked.',
        tags: ['moul-code-comparison'],
        snippet: `<moul-code-comparison language="ts" before-label="v1" after-label="v2">
  <script type="text/plain">button.onPress = save</script>
  <script type="text/plain">button.addEventListener('press', save)</script>
</moul-code-comparison>`,
      },
      {
        name: 'FileTree',
        docs: '/docs/components/filetree',
        summary:
          'Folders and files built from a list of paths, with icons by file type, selection and expansion by path, on moul-tree.',
        tags: ['moul-file-tree'],
        snippet: `<moul-file-tree id="files" label="Project files"></moul-file-tree>`,
        script: `const files = document.querySelector('#files')
files.files = ['src/index.ts', 'src/components/Button.ts', 'package.json', 'README.md']
files.selectedKey = 'src/index.ts'
files.addEventListener('action', (e) => openFile(e.detail.path))`,
      },
      {
        name: 'HistoryLedger',
        docs: '/docs/components/historyledger',
        summary:
          'Version history of a record, newest first, with before→after field changes and one-click restore.',
        tags: ['moul-history-ledger'],
        snippet: `<moul-history-ledger id="history"></moul-history-ledger>`,
        script: `const history = document.querySelector('#history')
history.versions = [
  { id: 'v2', label: 'Version 2', author: 'Dara', timestamp: Date.now(), summary: 'Published',
    changes: [{ field: 'Status', before: 'Draft', after: 'Published' }] },
  { id: 'v1', label: 'Version 1', author: 'Dara', timestamp: Date.now() - 86400000 },
]
history.current = 'v2'
history.addEventListener('restore', (e) => e.detail.waitUntil(api.restore(e.detail.version.id)))`,
      },
      {
        name: 'RelationshipGraph',
        docs: '/docs/components/relationshipgraph',
        summary:
          'Layered graph of nodes and links (source depends on target); hovering, focusing or selecting a node traces its upstream dependencies and downstream dependents.',
        tags: ['moul-relationship-graph'],
        snippet: `<moul-relationship-graph id="services" label="Service map" trace="both" show-legend></moul-relationship-graph>`,
        script: `const graph = document.querySelector('#services')
graph.nodes = [
  { id: 'web', label: 'Web app', group: 'Clients' },
  { id: 'api', label: 'API', group: 'Services' },
  { id: 'db', label: 'Postgres', group: 'Data' },
]
graph.links = [
  { source: 'web', target: 'api', label: 'calls' },
  { source: 'api', target: 'db' },
]
graph.addEventListener('node-action', (e) => console.log(e.detail.id))`,
      },
      {
        name: 'Terminal',
        docs: '/docs/components/terminal',
        summary:
          'Terminal window that types its commands and prints their output line by line when scrolled into view; the copy button copies just the commands.',
        tags: ['moul-terminal', 'moul-terminal-line'],
        snippet: `<moul-terminal label="zsh">
  <moul-terminal-line is-command>bun add @moul-dev/web-component</moul-terminal-line>
  <moul-terminal-line tone="success">✓ installed</moul-terminal-line>
</moul-terminal>`,
      },
      {
        name: 'Timeline',
        docs: '/docs/components/timeline',
        summary:
          'Vertical milestones on a rail with sticky headings, a scroll- or status-linked progress line, and a compact density for record history.',
        tags: ['moul-timeline', 'moul-timeline-item'],
        snippet: `<moul-timeline label="Order 1042" progress="status">
  <moul-timeline-item heading="Ordered" meta="Mon 9 Nov" status="complete" tone="success">Paid.</moul-timeline-item>
  <moul-timeline-item heading="Out for delivery" meta="Today" status="current">Arrives 2–4 pm.</moul-timeline-item>
  <moul-timeline-item heading="Delivered" status="upcoming"></moul-timeline-item>
</moul-timeline>`,
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
          'Virtualized log viewer with level filtering, search, and a log detail drawer.',
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
