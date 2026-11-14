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
          'Button with 7 variants, 3 sizes, icon-only mode, and pending, success and error states; `run(task)` drives them from a promise. For landing pages: `effect="shimmer|rainbow|neon"` animates the edge, `is-pulsing` adds a pulsing ring, and a `hover` slot swaps in on hover.',
        tags: ['moul-button'],
        snippet: `<moul-button variant="primary" size="md">Save changes</moul-button>
<moul-button variant="ghost" is-icon aria-label="Close">×</moul-button>
<moul-button id="save">
  Save
  <span slot="pending">Saving…</span>
  <span slot="success">Saved</span>
</moul-button>
<moul-button size="lg" effect="shimmer" is-pulsing>
  Get started
  <span slot="hover">Read the docs →</span>
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
          'Form-associated text input with label, description, and error message. `placeholders` rotates the placeholder through hints; `vanish()` or `vanish-on-submit` scatters the text away and clears it after its form submits.',
        tags: ['moul-text-field'],
        snippet: `<moul-text-field name="email" type="email" label="Email" placeholder="you@example.com" is-required></moul-text-field>
<moul-text-field name="q" label="Search" vanish-on-submit></moul-text-field>`,
        script: `document.querySelector('[name="q"]').placeholders = ['Search collections…', 'Find a record…']`,
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
        summary:
          'Search input in a `<search>` landmark with a clear button. `is-expandable` starts it as a round search button that springs open (`--search-field-expanded-width`) and closes when left empty; fires `expandchange`.',
        tags: ['moul-search-field'],
        snippet: `<moul-search-field name="q" label="Search" placeholder="Search projects…"></moul-search-field>
<moul-search-field is-expandable label="Search the docs"></moul-search-field>`,
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
        summary:
          'Surface container with header, body, and footer regions. `effect` adds light for landing pages, as a space-separated list: `spotlight` follows the pointer, `glare` sweeps a band across on hover, `glow` turns a gradient ring and an outer glow (main entry).',
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
    title: 'AI Kit',
    families: [
      {
        name: 'AgentActivity',
        docs: '/docs/components/agentactivity',
        summary:
          "An AI agent's reasoning steps and tool calls as a live compact timeline with status and timing; a tool call's input and output open as highlighted JSON, and the header sums the run up and folds it away.",
        tags: ['moul-agent-activity'],
        snippet: `<moul-agent-activity id="activity" is-live></moul-agent-activity>`,
        script: `const activity = document.querySelector('#activity')
activity.push({ id: 'call_1', tool: 'list_records', input: { collection: 'posts' }, status: 'running', startedAt: Date.now() })
activity.push({ id: 'call_1', status: 'done', output: { items: [] }, endedAt: Date.now() })`,
      },
      {
        name: 'Chat',
        docs: '/docs/components/chat',
        summary:
          'A complete AI chat screen: conversation history sidebar, user bubbles, assistant turns with tool calls, a thinking indicator and streamed Markdown answers, suggestions while empty, and a prompt-input composer. It calls no model itself: listen for `promptsubmit` and feed replies back with `push()`, `pushSteps()`, `appendText()` and `updateMessage()`.',
        tags: ['moul-chat'],
        snippet: `<moul-chat id="chat" allow-attachments>
  <span slot="footer">Answers can be wrong. Check important facts.</span>
</moul-chat>`,
        script: `const chat = document.querySelector('#chat')
chat.suggestions = ['Which collections are there?']
chat.addEventListener('promptsubmit', async (e) => {
  const reply = crypto.randomUUID()
  chat.push({ id: crypto.randomUUID(), role: 'user', content: e.detail.value }, { id: reply, role: 'assistant', status: 'pending' })
  for await (const part of streamAgent(e.detail.value)) {
    if (part.type === 'tool_call') chat.pushSteps(reply, { id: part.id, tool: part.name, input: part.input, status: 'running' })
    if (part.type === 'tool_result') chat.pushSteps(reply, { id: part.id, output: part.output, status: 'done' })
    if (part.type === 'text') chat.appendText(reply, part.text)
  }
  chat.updateMessage(reply, { status: 'done' })
})
chat.addEventListener('stop', () => controller.abort())`,
      },
      {
        name: 'PromptInput',
        docs: '/docs/components/promptinput',
        summary:
          'Chat composer: auto-growing textarea where Enter sends (IME-safe, Shift+Enter for a new line), Arrow Up recalls history, a model picker, file attachments by button, paste or drop with optional uploads, rotating placeholder hints, and a send button that becomes Stop while `is-generating`.',
        tags: ['moul-prompt-input'],
        snippet: `<moul-prompt-input id="composer" allow-attachments accept="image/*,.pdf"></moul-prompt-input>`,
        script: `const composer = document.querySelector('#composer')
composer.models = [{ value: 'sonnet', label: 'Sonnet' }, { value: 'opus', label: 'Opus' }]
composer.placeholders = ['Ask about your collections…', 'Summarise errors…']
composer.addEventListener('promptsubmit', (e) => send(e.detail.value, e.detail.attachments, e.detail.model))
composer.addEventListener('stop', () => controller.abort())`,
      },
      {
        name: 'StreamingResponse',
        docs: '/docs/components/streamingresponse',
        summary:
          "A model's Markdown answer that reveals smoothly as it streams, with headings, lists, tables, code blocks, `[n]` citations linked to `sources`, and copy, regenerate and feedback actions once done. Rendered as text, never HTML; images become links and only http, https, mailto and relative links are kept.",
        tags: ['moul-streaming-response'],
        snippet: `<moul-streaming-response id="answer" is-streaming></moul-streaming-response>`,
        script: `const answer = document.querySelector('#answer')
for await (const chunk of stream) answer.appendText(chunk)
answer.isStreaming = false
answer.sources = [{ title: 'Records API', url: 'https://moul.dev/docs/records' }]`,
      },
      {
        name: 'ThinkingIndicator',
        docs: '/docs/components/thinkingindicator',
        summary:
          'Small canvas particle orb with a shimmering label, in a polite `role="status"`, shown while a model works; change `label` as the work moves on.',
        tags: ['moul-thinking-indicator'],
        snippet: `<moul-thinking-indicator label="Searching records"></moul-thinking-indicator>`,
      },
    ],
  },
  {
    title: 'Landing Kit',
    families: [
      {
        name: 'Reveal',
        docs: '/docs/components/reveal',
        summary:
          "Wraps content that fades in and sharpens from a blur as it scrolls into view, once (or on every entry with `is-repeating`); `stagger` reveals child elements in turn. Effects entry (`import '@moul-dev/web-component/effects'`); shown at once under reduced motion.",
        tags: ['moul-reveal'],
        snippet: `<moul-reveal direction="up" delay="150">
  <h2>Ship on Friday</h2>
</moul-reveal>
<moul-reveal stagger="90" class="feature-grid">
  <moul-card>…</moul-card>
  <moul-card>…</moul-card>
</moul-reveal>`,
      },
      {
        name: 'TextEntrance',
        docs: '/docs/components/textentrance',
        summary:
          'Headline text whose letters, words or lines fade, blur or slide in one after another on entering the viewport; read once, whole, by screen readers. Effects entry.',
        tags: ['moul-text-entrance'],
        snippet: `<h1><moul-text-entrance by="words" effect="blur-up">Web components for every page</moul-text-entrance></h1>`,
      },
      {
        name: 'Typewriter',
        docs: '/docs/components/typewriter',
        summary:
          'Text that types itself with a blinking cursor, or types a list of `words` in turn, deleting each before the next; Khmer-safe. Effects entry.',
        tags: ['moul-typewriter'],
        snippet: `<moul-typewriter words='["Build.","Ship.","Repeat."]' is-looping></moul-typewriter>`,
      },
      {
        name: 'WordRotate',
        docs: '/docs/components/wordrotate',
        summary:
          'One word in a sentence cycles through `words` with a slide, fade, blur or flip while its width glides; pauses on hover, focus and off screen. Effects entry.',
        tags: ['moul-word-rotate'],
        snippet: `<h1>Ship <moul-word-rotate words='["fast","safe","yours"]'>fast</moul-word-rotate> today</h1>`,
      },
      {
        name: 'Scramble',
        docs: '/docs/components/scramble',
        summary:
          'Letters scramble through random glyphs, then resolve to the text from start to end, on view, on hover or on `play()`. Effects entry.',
        tags: ['moul-scramble'],
        snippet: `<moul-scramble trigger="hover">Decrypting…</moul-scramble>`,
      },
      {
        name: 'GradientText',
        docs: '/docs/components/gradienttext',
        summary:
          'Text painted with a moving gradient, a light sweep (`effect="shine"`) or drifting aurora colours, in CSS only. Effects entry.',
        tags: ['moul-gradient-text'],
        snippet: `<h2>Everything you need, <moul-gradient-text>nothing you do not</moul-gradient-text></h2>`,
      },
      {
        name: 'Highlight',
        docs: '/docs/components/highlight',
        summary:
          'A marker band, underline, box or circle drawn behind or around words as they scroll into view, in a semantic `tone`. Effects entry.',
        tags: ['moul-highlight'],
        snippet: `<p>Plain HTML with <moul-highlight effect="marker" tone="warning">motion built in</moul-highlight>.</p>`,
      },
      {
        name: 'Marquee',
        docs: '/docs/components/marquee',
        summary:
          "An endless row or column of logos, cards or text; copies are inert and hidden from screen readers, it pauses on focus (and on hover with `pause-on-hover`), and becomes a row you scroll by hand under reduced motion. `scroll-velocity` (a number; the attribute alone means 2) speeds it up with the reader's scroll and runs it backward while they scroll up. Effects entry.",
        tags: ['moul-marquee'],
        snippet: `<moul-marquee fade-edges pause-on-hover speed="40">
  <img src="/logos/one.svg" alt="One" />
  <img src="/logos/two.svg" alt="Two" />
</moul-marquee>`,
      },
      {
        name: 'BentoGrid',
        docs: '/docs/components/bentogrid',
        summary:
          'Feature cards in an uneven grid: `col-span` and `row-span` per card, one column on narrow screens, and an action that slides in on hover; `effect="spotlight glare glow"` on a card adds the same light as `<moul-card>`. Effects entry.',
        tags: ['moul-bento-grid', 'moul-bento-card'],
        snippet: `<moul-bento-grid columns="3">
  <moul-bento-card col-span="2">
    <img slot="visual" src="/feature.png" alt="" />
    <h3 slot="heading">Motion as markup</h3>
    Text effects are attributes, not scripts.
    <moul-link slot="action" href="/docs">Learn more →</moul-link>
  </moul-bento-card>
  <moul-bento-card>…</moul-bento-card>
</moul-bento-grid>`,
      },
      {
        name: 'BrowserFrame',
        docs: '/docs/components/browserframe',
        summary:
          'A browser window mock-up with window dots and an address bar around a screenshot or any content. Effects entry.',
        tags: ['moul-browser-frame'],
        snippet: `<moul-browser-frame url="example.com">
  <img src="/screenshot.png" alt="The dashboard" />
</moul-browser-frame>`,
      },
      {
        name: 'PhoneFrame',
        docs: '/docs/components/phoneframe',
        summary:
          'A phone mock-up drawn in CSS around a screenshot or video, `variant="iphone"` or `"android"`, sized by `--phone-frame-width`. Effects entry.',
        tags: ['moul-phone-frame'],
        snippet: `<moul-phone-frame variant="iphone">
  <img src="/app.png" alt="The app's home screen" />
</moul-phone-frame>`,
      },
      {
        name: 'ScrollProgress',
        docs: '/docs/components/scrollprogress',
        summary:
          'A thin bar that fills as the page (or the container named by `for`) scrolls, fixed to the top or bottom or in flow; decorative. Effects entry.',
        tags: ['moul-scroll-progress'],
        snippet: `<moul-scroll-progress></moul-scroll-progress>`,
      },
    ],
  },
  {
    title: 'Backgrounds & Light',
    families: [
      {
        name: 'Pattern',
        docs: '/docs/components/pattern',
        summary:
          'A quiet background pattern behind its content: `variant="dots|grid|hexagons|stripes|lines"`, `fade="radial|top|bottom|edges"` to soften it, and `is-animated` to light `count` random cells (grid, dots) or let the pattern drift (the others). Wrap content, or use it empty as a layer. Effects entry; still under reduced motion.',
        tags: ['moul-pattern'],
        snippet: `<moul-pattern variant="grid" fade="radial" is-animated count="12">
  <h2>Ship on every push</h2>
  <p>Previews, rollbacks and logs in one place.</p>
</moul-pattern>`,
      },
      {
        name: 'PerspectiveGrid',
        docs: '/docs/components/perspectivegrid',
        summary:
          'A grid receding into depth behind its content, lines flowing toward the viewer: `variant="floor"` runs back to a horizon (`angle`, default 65), `tunnel` is four walls meeting in the centre. Effects entry; still under reduced motion.',
        tags: ['moul-perspective-grid'],
        snippet: `<moul-perspective-grid variant="floor" style="min-height: 24rem">
  <h2>Built for what comes next</h2>
</moul-perspective-grid>`,
      },
      {
        name: 'Ripple',
        docs: '/docs/components/ripple',
        summary:
          'Concentric rings (`count`, default 6) pulsing outward in sequence behind an icon, avatar or button centred in it, fainter toward the edge. Effects entry; still under reduced motion.',
        tags: ['moul-ripple'],
        snippet: `<moul-ripple count="6">
  <moul-avatar name="Sophea Chan" size="lg"></moul-avatar>
</moul-ripple>`,
      },
      {
        name: 'Aurora',
        docs: '/docs/components/aurora',
        summary:
          'Slow-drifting, blurred colour behind a hero or section: `variant="aurora"` sways bands across the top, `blobs` drifts and reshapes large blobs; colours from `--aurora-color-1` to `-3`. Effects entry; a still field under reduced motion.',
        tags: ['moul-aurora'],
        snippet: `<moul-aurora variant="blobs" style="padding: 6rem 2rem">
  <h1>Ship on every push</h1>
  <p>Previews, logs and rollbacks for every branch.</p>
</moul-aurora>`,
      },
      {
        name: 'Noise',
        docs: '/docs/components/noise',
        summary:
          'A film-grain texture laid over its content (a hero, a card, a gradient) from an SVG turbulence mask in a token colour; `frequency` sets the grain, `is-animated` makes it flicker like film. Effects entry; still under reduced motion.',
        tags: ['moul-noise'],
        snippet: `<moul-noise style="border-radius: 1rem">
  <moul-aurora variant="blobs" style="padding: 6rem 2rem; border-radius: inherit">
    <h1>Made by hand</h1>
  </moul-aurora>
</moul-noise>`,
      },
      {
        name: 'LightRays',
        docs: '/docs/components/lightrays',
        summary:
          'Soft blurred rays (`count`, default 7) fanning down from the top edge, each swaying and brightening at its own pace, behind a hero or a heading. Effects entry; still under reduced motion.',
        tags: ['moul-light-rays'],
        snippet: `<moul-light-rays count="9" style="padding: 6rem 2rem">
  <h1>Light where it matters</h1>
</moul-light-rays>`,
      },
      {
        name: 'Spotlight',
        docs: '/docs/components/spotlight',
        summary:
          'Light falling on a hero from above: `variant="cone"` slides in from a top corner (`placement="start|center|end"`), `lamp` widens a bright line and its cone of light, both once as they enter view (`play()` replays, `is-lit` shows it at once); `sway` swings two lights slowly. Effects entry; end state at once under reduced motion.',
        tags: ['moul-spotlight'],
        snippet: `<moul-spotlight variant="lamp" style="padding: 5rem 2rem 4rem; text-align: center">
  <h1>Build under a good light</h1>
</moul-spotlight>`,
      },
      {
        name: 'BorderBeam',
        docs: '/docs/components/borderbeam',
        summary:
          "Wraps a card or panel and sends a short bright beam round its border, following the rounded corners (the radius is the element's own `border-radius`); `is-reverse` turns it the other way. Effects entry; still under reduced motion.",
        tags: ['moul-border-beam'],
        snippet: `<moul-border-beam>
  <moul-card><moul-card-body>Pro: $24 a month</moul-card-body></moul-card>
</moul-border-beam>`,
      },
      {
        name: 'ShineBorder',
        docs: '/docs/components/shineborder',
        summary:
          'Wraps a card or panel in a thin border whose colours drift slowly round it (`--shine-border-colors`); quieter than a border beam. Effects entry; still under reduced motion.',
        tags: ['moul-shine-border'],
        snippet: `<moul-shine-border>
  <moul-card><moul-card-body>Team: $48 a month</moul-card-body></moul-card>
</moul-shine-border>`,
      },
      {
        name: 'Beams',
        docs: '/docs/components/beams',
        summary:
          'A background of faint SVG lines with light travelling along them, behind a hero or feature section: `variant="beams"` curves from a corner, `lines` waves across, `rain` falls and flashes where it lands. Effects entry; the lines stay and nothing travels under reduced motion.',
        tags: ['moul-beams'],
        snippet: `<moul-beams variant="lines" style="padding: 4rem 1.5rem">
  <h2>Ship on every push</h2>
</moul-beams>`,
      },
      {
        name: 'Backlight',
        docs: '/docs/components/backlight',
        summary:
          "Wraps an image or video and draws a glow behind it in the media's own colours with an SVG filter, so it follows a playing video; `blur` (property `glowBlur`) and `saturation` tune it. Effects entry.",
        tags: ['moul-backlight'],
        snippet: `<moul-backlight blur="24">
  <img src="/screenshot.png" alt="The editor with a preview panel open" />
</moul-backlight>`,
      },
      {
        name: 'FocusGroup',
        docs: '/docs/components/focusgroup',
        summary:
          'A grid of tiles where the one under the pointer, or holding keyboard focus, stays sharp while its siblings blur, dim and shrink; suits image-led tiles. Effects entry; no transition under reduced motion.',
        tags: ['moul-focus-group'],
        snippet: `<moul-focus-group>
  <a href="/places/angkor"><img src="/angkor.jpg" alt="" /> Angkor Wat at dawn</a>
  <a href="/places/koh-rong"><img src="/koh-rong.jpg" alt="" /> Koh Rong</a>
</moul-focus-group>`,
      },
      {
        name: 'EdgeBlur',
        docs: '/docs/components/edgeblur',
        summary:
          'A scroll container (give it a height) whose content blurs out progressively toward its edges; `orientation="horizontal"` for a row, `edges="start|end"` for one side. Where scroll timelines exist, an edge clears when there is nothing more to scroll that way. Focusable by keyboard; label it with `aria-label`. Effects entry.',
        tags: ['moul-edge-blur'],
        snippet: `<moul-edge-blur aria-label="Release notes" style="height: 18rem">
  <ul>…</ul>
</moul-edge-blur>`,
      },
      {
        name: 'Orbit',
        docs: '/docs/components/orbit',
        summary:
          'Icons, logos or avatars spaced evenly on a ring that turns slowly round a centre, staying upright (`radius`, `duration`, `is-reverse`, `show-path`, `pause-on-hover`; pauses while focus is inside). Nest another orbit in `slot="center"` for more rings. Effects entry; still under reduced motion.',
        tags: ['moul-orbit'],
        snippet: `<moul-orbit radius="128" show-path pause-on-hover>
  <img src="/logos/one.svg" alt="One" />
  <img src="/logos/two.svg" alt="Two" />
  <moul-orbit slot="center" radius="64" duration="14" is-reverse>…</moul-orbit>
</moul-orbit>`,
      },
    ],
  },
  {
    title: 'Navigation & Media',
    families: [
      {
        name: 'Navbar',
        docs: '/docs/components/navbar',
        summary:
          'Sticky site top bar with `brand`, default (inside a `<nav>` landmark) and `actions` slots plus a `banner` slot above it; `variant="floating"` for an inset pill, `effect="shrink glass"` once scrolled past `threshold`, `hide-on-scroll` slides it away on the way down. Below `collapse-below` px (768) the navigation folds behind a menu button into a panel (`openchange`) and a child `moul-navigation-menu` turns vertical. Effects entry.',
        tags: ['moul-navbar'],
        snippet: `<moul-navbar variant="floating" effect="glass shrink" hide-on-scroll>
  <moul-banner slot="banner" hide-on-scroll is-dismissable>Moul UI 1.0 is out. <a href="/changelog/">Read the notes</a></moul-banner>
  <a slot="brand" href="/">Moul</a>
  <a href="/docs/" aria-current="page">Docs</a>
  <a href="/examples/">Examples</a>
  <moul-button slot="actions" size="sm">Get started</moul-button>
</moul-navbar>`,
      },
      {
        name: 'Banner',
        docs: '/docs/components/banner',
        summary:
          'One-line announcement (a `region` landmark) with `tone`, `variant="solid|flat"`, `icon` and `action` slots; `is-dismissable` fires a cancelable `dismiss` and folds it away, `storage-key` remembers that in localStorage; `is-sticky` + `hide-on-scroll` slides it away on the way down, and in a navbar\'s `banner` slot the navbar slides it. Effects entry.',
        tags: ['moul-banner'],
        snippet: `<moul-banner tone="primary" is-dismissable storage-key="release-1-0">
  Moul UI 1.0 is out. <a href="/changelog/">Read the notes</a>
  <moul-button slot="action" size="sm" variant="outline">Upgrade</moul-button>
</moul-banner>`,
      },
      {
        name: 'NavigationMenu',
        docs: '/docs/components/navigationmenu',
        summary:
          'Site navigation whose panels open on hover and morph from one item to the next (one floating surface slides and resizes; content slides in from the side of travel). Items with `href` are plain links; `moul-navigation-menu-link` is a link card with icon, label and description; `orientation="vertical"` stacks items with inline disclosure panels (moul-navbar switches to it when collapsed). Fires `openchange` with `detail.value`. Effects entry.',
        tags: [
          'moul-navigation-menu',
          'moul-navigation-menu-item',
          'moul-navigation-menu-link',
        ],
        snippet: `<nav aria-label="Main">
  <moul-navigation-menu>
    <moul-navigation-menu-item label="Products" columns="2">
      <moul-navigation-menu-link href="/docs/" label="Components" description="Ninety elements for apps and sites.">
        <svg slot="icon" aria-hidden="true">…</svg>
      </moul-navigation-menu-link>
    </moul-navigation-menu-item>
    <moul-navigation-menu-item label="Pricing" href="/pricing/"></moul-navigation-menu-item>
  </moul-navigation-menu>
</nav>`,
      },
      {
        name: 'Dock',
        docs: '/docs/components/dock',
        summary:
          'A glass bar of icons that grow under a mouse or pen like a desktop dock (`magnification`, `distance`, `orientation`); items are links (`href`) or buttons with a `label` tooltip and `is-active` dot, separated by `moul-dock-separator`. A toolbar with arrow-key focus. Effects entry.',
        tags: ['moul-dock', 'moul-dock-item', 'moul-dock-separator'],
        snippet: `<moul-dock label="Quick links">
  <moul-dock-item label="Home" href="/" is-active><svg aria-hidden="true">…</svg></moul-dock-item>
  <moul-dock-item label="Search"><svg aria-hidden="true">…</svg></moul-dock-item>
  <moul-dock-separator></moul-dock-separator>
  <moul-dock-item label="Settings"><svg aria-hidden="true">…</svg></moul-dock-item>
</moul-dock>`,
      },
      {
        name: 'ProgressNav',
        docs: '/docs/components/progressnav',
        summary:
          'A floating pill with a scroll-depth ring and the active heading of an article (`for`, `headings`, `placement="bottom|top|inline"`); pressing it opens a nested list of headings to jump to. Effects entry.',
        tags: ['moul-progress-nav'],
        snippet: `<article id="guide">…<h2>Planning the trip</h2>…</article>
<moul-progress-nav for="guide" headings="h2, h3"></moul-progress-nav>`,
      },
      {
        name: 'Carousel',
        docs: '/docs/components/carousel',
        summary:
          'A row of slides (every child) the reader drags, swipes or steps through, settling on the nearest slide after a flick; arrows, dots, `align="start|center"`, `is-loop`, and `autoplay="6000"` with a play button that holds on hover, focus, off screen and a hidden tab. `--carousel-slide-size` lets the next slide peek in; `slidechange`, `next()`, `previous()`, `goTo()`. Effects entry.',
        tags: ['moul-carousel'],
        snippet: `<moul-carousel label="Customer stories" style="--carousel-slide-size: min(20rem, 80%)">
  <moul-card>…</moul-card>
  <moul-card>…</moul-card>
  <moul-card>…</moul-card>
</moul-carousel>`,
      },
      {
        name: 'ImageSlider',
        docs: '/docs/components/imageslider',
        summary:
          'A full-width slideshow of `<img>` children with a scrim and a `slot="overlay"` for a headline; `effect="fade|slide|zoom"`, autoplay every `interval` ms (default 5000, 0 is off) with a pause button, swipe, arrows, dots and arrow keys; goes round from last to first. Effects entry.',
        tags: ['moul-image-slider'],
        snippet: `<moul-image-slider label="Mondulkiri in four days" effect="fade">
  <img src="/hills.jpg" alt="Hills in mist at dawn" />
  <img src="/lake.jpg" alt="A crater lake in the forest" />
  <div slot="overlay"><h2>Four days in the hills</h2></div>
</moul-image-slider>`,
      },
      {
        name: 'Compare',
        docs: '/docs/components/compare',
        summary:
          'Two images in one frame with a draggable divider (`role="slider"`, arrows/Page/Home/End) to compare a before and an after; `position` 0–100, `orientation="vertical"`, `mode="hover"`, optional `before-label`/`after-label` chips; fires `input` and `change` with `detail.position`. Effects entry.',
        tags: ['moul-compare'],
        snippet: `<moul-compare label="Edited photo" before-label="Before" after-label="After" position="50">
  <img slot="before" src="/photos/raw.jpg" alt="The photo straight from the camera" />
  <img slot="after" src="/photos/edited.jpg" alt="The same photo, warmer and brighter" />
</moul-compare>`,
      },
      {
        name: 'VideoDialog',
        docs: '/docs/components/videodialog',
        summary:
          'Thumbnail button with a play icon that opens an embed URL (`<iframe>`) or a video file (`<video>`) in a native modal dialog; the player exists only while open. `animation="expand|fade|slide-up"`, `is-open`/`setOpen()`, `openchange`; only http(s) and relative URLs play. Effects entry.',
        tags: ['moul-video-dialog'],
        snippet: `<moul-video-dialog src="https://www.youtube-nocookie.com/embed/VIDEO_ID" label="Watch the two-minute tour">
  <img slot="thumbnail" src="/images/tour-poster.jpg" alt="" />
</moul-video-dialog>`,
      },
      {
        name: 'WorldMap',
        docs: '/docs/components/worldmap',
        summary:
          'A dotted world map drawn from an embedded land mask (no image, request or map library) with pins (`markers`) and curved lines (`arcs`) that draw in turn when it scrolls into view, then carry a travelling light; places are `{ lat, lng, label }`, as properties or JSON attributes, and `show-labels` writes the labels beside the pins. One image to screen readers, named by `label`, plus a hidden list of places and routes. Effects entry.',
        tags: ['moul-world-map'],
        snippet: `<moul-world-map label="Our offices" show-labels
  arcs='[{ "from": { "lat": 11.56, "lng": 104.92, "label": "Phnom Penh" }, "to": { "lat": 38.72, "lng": -9.14, "label": "Lisbon" } }]'
></moul-world-map>`,
      },
    ],
  },
  {
    title: 'Pointer & Scroll',
    families: [
      {
        name: 'Tilt',
        docs: '/docs/components/tilt',
        summary:
          'Wraps a card or image and tilts it in 3D toward a mouse or pen, springing back flat on leave (`max-tilt` degrees, `perspective`, `hover-scale`, `is-reversed`, `glare` for a light that follows the pointer). Parts of a `transform-style: preserve-3d` box can be lifted with `translate: 0 0 2rem`. Flat under reduced motion. Effects entry.',
        tags: ['moul-tilt'],
        snippet: `<moul-tilt glare max-tilt="12" style="border-radius: 1rem">
  <div class="card" style="border-radius: inherit">…</div>
</moul-tilt>`,
      },
      {
        name: 'Magnetic',
        docs: '/docs/components/magnetic',
        summary:
          'Wraps one button or link so it drifts toward a mouse or pen within `reach` px (default 40) by `strength` of the distance (0 to 1, default 0.3) and springs back. Writes `--magnetic-x`/`--magnetic-y` so an inner label can follow further. Focus goes to the control; still under reduced motion. Effects entry.',
        tags: ['moul-magnetic'],
        snippet: `<moul-magnetic strength="0.4" reach="60">
  <moul-button variant="primary">Book a trip</moul-button>
</moul-magnetic>`,
      },
      {
        name: 'GlowBorder',
        docs: '/docs/components/glowborder',
        summary:
          'Wraps a box (or overlays it when empty) and lights its border on the side nearest a mouse or pen, fading out `proximity` px (64) away; `spread` (degrees, 80) sets the lit arc, `blur` adds a halo, `--glow-border-colors` sets the gradient. Tracks the pointer only while on screen; decorative. Effects entry.',
        tags: ['moul-glow-border'],
        snippet: `<moul-glow-border proximity="96" spread="100">
  <moul-card><moul-card-body>Pro plan</moul-card-body></moul-card>
</moul-glow-border>`,
      },
      {
        name: 'HoverHighlight',
        docs: '/docs/components/hoverhighlight',
        summary:
          'One highlight that slides behind a set of items (direct children, or `item-selector`) to the one under the mouse or pen, or with keyboard focus, taking its size and radius; it fades out on leave, or with `is-persistent` rests on the `aria-current`/`data-active` item or the last one. The hovered item gets `data-highlighted`. Effects entry.',
        tags: ['moul-hover-highlight'],
        snippet: `<moul-hover-highlight is-persistent style="display: flex">
  <a href="/overview" aria-current="page">Overview</a>
  <a href="/getting-there">Getting there</a>
  <a href="/where-to-stay">Where to stay</a>
</moul-hover-highlight>`,
      },
      {
        name: 'DirectionHover',
        docs: '/docs/components/directionhover',
        summary:
          'A picture whose `overlay` slot slides in from the edge the pointer entered and out toward the edge it left, while the picture zooms slightly; focus inside or a tap shows it from the bottom. State is reported as `data-state` and `data-edge`. Effects entry.',
        tags: ['moul-direction-hover'],
        snippet: `<moul-direction-hover style="aspect-ratio: 4 / 3">
  <img src="/kep.jpg" alt="The coast at Kep, with fishing boats" />
  <div slot="overlay"><strong>Kep</strong> Crab market and sunsets</div>
</moul-direction-hover>`,
      },
      {
        name: 'Lens',
        docs: '/docs/components/lens',
        summary:
          'A round magnifier (`size` px, 160) that follows the pointer over an image or any content and shows it `zoom` times larger (2), using an aria-hidden, inert light-DOM copy so page CSS still applies; `is-static` with `position-x`/`position-y` fixes it in place. Effects entry.',
        tags: ['moul-lens'],
        snippet: `<moul-lens zoom="2.5" size="180">
  <img src="/paddies.jpg" alt="Rice paddies and a stilt house at dusk" />
</moul-lens>`,
      },
      {
        name: 'Cursor',
        docs: '/docs/components/cursor',
        summary:
          'Replaces the mouse cursor over its content (or the whole page with `scope="page"`) with a smooth follower: `variant="dot"` (dot plus trailing ring), `label` (arrow plus pill showing `label`) or `arrow`. It grows over links and buttons, and any `data-cursor-label` shows beside the pointer. Mouse only; text fields, frames, touch, reduced motion and forced colours keep the system cursor. Effects entry.',
        tags: ['moul-cursor'],
        snippet: `<moul-cursor variant="label" label="Explore">
  <section class="hero">…</section>
  <img data-cursor-label="View" src="/kep.jpg" alt="The coast at Kep" />
</moul-cursor>`,
      },
      {
        name: 'MaskReveal',
        docs: '/docs/components/maskreveal',
        summary:
          'Two stacked layers; a circle under the pointer uncovers the `revealed` slot beneath the default slot. The circle grows from `size` (0) to `reveal-size` (240 px) on hover, follows a pressed finger, and `is-revealed` (or focus inside the hidden layer) uncovers it all. Effects entry.',
        tags: ['moul-mask-reveal'],
        snippet: `<moul-mask-reveal reveal-size="200">
  <img src="/sketch.jpg" alt="Pencil sketch of the paddies" />
  <img slot="revealed" src="/painting.jpg" alt="The same scene painted at dusk" />
</moul-mask-reveal>`,
      },
      {
        name: 'PointerParallax',
        docs: '/docs/components/pointerparallax',
        summary:
          'Layered children shift with the pointer by their `data-depth` (usually -1 to 1; negative moves the other way) times `strength` px; `scope="page"` follows the pointer anywhere on the page. Layers move by the `translate` property, so position them another way. Still under reduced motion. Effects entry.',
        tags: ['moul-pointer-parallax'],
        snippet: `<moul-pointer-parallax strength="28" style="height: 18rem; overflow: clip">
  <img data-depth="0.3" src="/far.svg" alt="" />
  <img data-depth="1" src="/near.svg" alt="" />
  <h1 data-depth="-0.3">Mondulkiri</h1>
</moul-pointer-parallax>`,
      },
      {
        name: 'ConnectorBeam',
        docs: '/docs/components/connectorbeam',
        summary:
          'A line between two elements named by id (`from`, `to`) with a short light running along it, for sources flowing into a hub or a request reaching a server. A layer (`position: absolute; inset: 0; z-index: -1`) inside a `position: relative; isolation: isolate` box; `curvature` bows it, `start-x-offset`/`start-y-offset`/`end-x-offset`/`end-y-offset` move its ends, `is-reversed`, `duration` and `delay` (ms) time the light. Redrawn only on resize; paused off screen; decorative and `aria-hidden`. Effects entry.',
        tags: ['moul-connector-beam'],
        snippet: `<div style="position: relative; isolation: isolate; display: flex; justify-content: space-between">
  <div id="source">📄</div>
  <div id="hub">M</div>
  <moul-connector-beam from="source" to="hub" curvature="40"></moul-connector-beam>
</div>`,
      },
      {
        name: 'ScrollText',
        docs: '/docs/components/scrolltext',
        summary:
          'Text whose words light up one by one, from dim (`--scroll-text-dim`) to full, as the reader scrolls; write the text inside it or set `text`. `is-pinned` makes a tall section (`--scroll-text-length`, 250vh) with the text held in the viewport while it lights. One scroll timeline drives every word through CSS; Khmer splits at word boundaries; read once as a sentence. Effects entry.',
        tags: ['moul-scroll-text'],
        snippet: `<h2><moul-scroll-text>Every change to your data is kept, with who made it and when.</moul-scroll-text></h2>
<moul-scroll-text is-pinned>Ship on Friday. Previews for every branch, logs you can search, and a rollback that takes one click.</moul-scroll-text>`,
      },
      {
        name: 'StickyStack',
        docs: '/docs/components/stickystack',
        summary:
          'Children (cards or full sections) stick near the top one after another and pile up as the page scrolls, each a `--sticky-stack-step` lower so the earlier ones peek out; covered cards shrink (to `min-scale`, 0.9) and dim (`--sticky-stack-dim`) on a native view timeline with a scroll-listener fallback. Keyboard focus in a covered card scrolls back to it. Under reduced motion they still stack but do not shrink. Effects entry.',
        tags: ['moul-sticky-stack'],
        snippet: `<moul-sticky-stack min-scale="0.9" style="--sticky-stack-top: 5rem">
  <article class="card">…</article>
  <article class="card">…</article>
  <article class="card">…</article>
</moul-sticky-stack>`,
      },
      {
        name: 'ScrollParallax',
        docs: '/docs/components/scrollparallax',
        summary:
          'Each child is a track that slides as the element crosses the screen: rows (default) alternate left and right, `orientation="columns"` alternate up and down; `speed` is the travel in px (300) and `data-speed` on a track multiplies it (negative reverses, 0 holds still). Moves by `translate` on a native view timeline; still under reduced motion. Effects entry.',
        tags: ['moul-scroll-parallax'],
        snippet: `<moul-scroll-parallax speed="360">
  <div class="row">…cards…</div>
  <div class="row">…cards…</div>
  <div class="row" data-speed="0">…</div>
</moul-scroll-parallax>`,
      },
      {
        name: 'StickyScroll',
        docs: '/docs/components/stickyscroll',
        summary:
          "A walk-through in steps: each `moul-sticky-scroll-item` has text and a `media` slot; text scrolls in one column while a pinned panel shows the active step's media (the last step whose text has reached a line 40% down the screen, even after a jump), crossfading, and fires `stepchange` (`{ current, previous, item }`). Optional `--sticky-scroll-tint` per item, `--sticky-scroll-end-space` for room after the last step; under 600px wide it becomes one column with media above the text. Effects entry.",
        tags: ['moul-sticky-scroll', 'moul-sticky-scroll-item'],
        snippet: `<moul-sticky-scroll style="--sticky-scroll-end-space: 40vh">
  <moul-sticky-scroll-item>
    <h3>Open the app</h3><p>Sign in with your phone number.</p>
    <img slot="media" src="/steps/sign-in.png" alt="The sign-in screen" />
  </moul-sticky-scroll-item>
  <moul-sticky-scroll-item>
    <h3>Choose who gets it</h3><p>Pick a saved contact.</p>
    <img slot="media" src="/steps/contacts.png" alt="Saved contacts" />
  </moul-sticky-scroll-item>
</moul-sticky-scroll>`,
      },
      {
        name: 'TracingBeam',
        docs: '/docs/components/tracingbeam',
        summary:
          'Wraps an article; a gradient line in the inline-start gutter fills as the reader scrolls through it, with a glowing head and a dot that lights once reading starts. Starts when the article top reaches `--tracing-beam-start` (50% of the view) and fills when its end is in view, so it always completes. Native view timeline where supported, passive scroll fallback elsewhere; follows the nearest scroll container. Decorative. Effects entry.',
        tags: ['moul-tracing-beam'],
        snippet: `<moul-tracing-beam>
  <h2>Day one: Phnom Penh to Kampot</h2>
  <p>The bus leaves the Central Market at seven…</p>
</moul-tracing-beam>`,
      },
      {
        name: 'ScrollFrame',
        docs: '/docs/components/scrollframe',
        summary:
          'A screen (`moul-browser-frame`, `moul-phone-frame`, image) that starts tilted back by `tilt` degrees (default 20) and lies flat as it scrolls into view, with a `header` slot that rises into place. Uses a native CSS view timeline where supported, otherwise a scroll fallback that follows the nearest scroll container. Flat under reduced motion. Effects entry.',
        tags: ['moul-scroll-frame'],
        snippet: `<moul-scroll-frame>
  <h2 slot="header">Every booking, one screen</h2>
  <moul-browser-frame url="trips.example.com/today"><img src="/dashboard.png" alt="The bookings dashboard" /></moul-browser-frame>
</moul-scroll-frame>`,
      },
      {
        name: 'PageTransition',
        docs: '/docs/components/pagetransition',
        summary:
          'Animated change of page through view transitions: `effect` is `wipe` (a panel of `--page-transition-color` sweeps across), `slide`, `circle` (grows from the click point) or `fade`, over `duration` ms. One per page opts the site in to cross-document transitions (load the effects entry with `blocking="render"` or inline `pageTransitionCss(effect, duration)` in <head>); in SPAs, `start(update, { direction, x, y })` wraps `document.startViewTransition`. Plays in reverse when going back or in RTL. No transition under reduced motion. Renders nothing. Effects entry.',
        tags: ['moul-page-transition'],
        snippet: `<moul-page-transition effect="wipe"></moul-page-transition>`,
        script: `const transition = document.querySelector('moul-page-transition')
transition.start(() => render(nextView), { direction: 'forward' })`,
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
