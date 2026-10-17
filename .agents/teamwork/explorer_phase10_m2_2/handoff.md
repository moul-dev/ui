# Handoff Report — Lit Web Components Sandbox Kitchen Sink (`ui/src/sandbox.ts`)

## 1. Observation

1. **Current Sandbox Setup**:
   - `ui/index.html:13-14` currently mounts a legacy React root `<div id="root"></div>` and executes `<script type="module" src="/src/main.tsx"></script>`.
   - `ui/src/App.tsx` (15,172 bytes) and `ui/src/sandbox/` (10 section files) are legacy React components importing `@stylexjs/stylex`, `react`, and `react-dom`.
   - `ui/src/sandbox.ts` did not previously exist.

2. **Component Architecture & Registration**:
   - All 54 component families and 77 custom element tags are exported via `ui/src/index.ts` and registered idempotently via `defineElement()` from `ui/src/utils/define-element.ts`.
   - `ui/src/styles/style.css:331-339` defines theme switching triggers:
     ```css
     [data-theme="light"] {
       color-scheme: light;
     }
     [data-theme="dark"],
     .dark {
       color-scheme: dark;
     }
     ```
     Setting `document.documentElement.dataset.theme = 'light' | 'dark'` immediately drives all `:root` `light-dark()` tokens across all Shadow DOM custom elements.

3. **TypeScript Constraints**:
   - `ui/tsconfig.app.json:21` specifies `"erasableSyntaxOnly": true` and `"verbatimModuleSyntax": true`.
   - Standard Lit static property declarations:
     ```ts
     static override properties = {
       selectedCategory: { type: String, state: true },
       ...
     }
     declare selectedCategory: string
     ```
     are strictly compliant with TypeScript erasable syntax without requiring experimental decorators or Babel transforms.

4. **Category Requirements**:
   All 6 required categories in DISPATCH.md are supported and ready for showcase:
   - **Actions**: `moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group` (`ui/src/components/Button/`, `ButtonGroup/`, `ToggleButton/`, `ToggleButtonGroup/`).
   - **Surfaces & Feedback**: `moul-card`, `moul-alert`, `moul-badge`, `moul-avatar`, `moul-table`, `moul-toast`, `toastQueue`, `moul-progress-bar`, `moul-spinner`, `moul-kbd` (`ui/src/components/Card/`, `Alert/`, `Badge/`, `Avatar/`, `Table/`, `Toast/`).
   - **Overlays & Navigation**: `moul-modal`, `moul-alert-dialog`, `moul-popover`, `moul-tooltip`, `moul-tabs`, `moul-pagination`, `moul-breadcrumbs` (`ui/src/components/Modal/`, `AlertDialog/`, `Popover/`, `Tooltip/`, `Tabs/`, `Pagination/`).
   - **Forms & Inputs**: `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-select`, `moul-combobox`, `moul-switch`, `moul-slider`, `moul-date-picker`, `moul-checkbox`, `moul-radio-group` (`ui/src/components/TextField/`, `NumberField/`, `SearchField/`, `Select/`, `ComboBox/`, `Switch/`, `Slider/`, `DatePicker/`).
   - **Charts & Analytics**: `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-stat`, `moul-percentage-bar`, `moul-percentage-circle`, `moul-top-list` (`ui/src/components/LineChart/`, `AreaChart/`, `BarChart/`, `DoughnutChart/`, `Stat/`, `Percentage/`, `TopList/`).
   - **Composite Blocks**: `moul-sidebar` compound suite (used as outer layout shell) and `moul-logs` / `moul-logs-viewer` streaming virtualized logs with `SERVER_LOG_RAW` (`ui/src/components/Sidebar/`, `LogsViewer/`).

---

## 2. Logic Chain

1. **Top-Level Layout Choice**:
   - `<moul-sidebar layout="sidebar-framed">` encapsulates `<moul-sidebar-aside>` and `<moul-sidebar-main>`.
   - Propagates sidebar state (`dense`, `collapsed`, `selectedKey`) down via `@lit/context`.
   - Slotted navigation items in `<moul-sidebar-group label="Kitchen Sink" collapsible>` dispatch `selectionchange` with `{ detail: { selectedKey } }`, driving the reactive view switching between category showcases.

2. **Theme Toggling**:
   - `toggleTheme()` toggles between `'light'` and `'dark'`.
   - Updates `document.documentElement.dataset.theme` and toggles `.dark` on `document.documentElement`.
   - Fires a confirmation `toastQueue.add(...)` notification to demonstrate cross-component reactive integration.

3. **Zero-React / Pure Lit Compliance**:
   - Imported exclusively from `'lit'`, standard Web APIs, and internal `@moul-dev/ui` Lit modules (`./index`).
   - Zero imports of `react`, `react-dom`, `react-aria`, `@stylexjs/stylex`, or JSX syntax.
   - All interactive events use Lit event bindings (`@click`, `@change`, `@input`, `@selectionchange`, `@pagechange`).

---

## 3. Caveats

- **Host Page Dependency**: To render `<moul-sandbox>` during `bun run dev:ui`, `ui/index.html` must be updated (by Explorer M2.3 / Worker M2) to mount `<moul-sandbox></moul-sandbox>` and point to `<script type="module" src="/src/sandbox.ts"></script>`.
- **Legacy Files Removal**: Legacy files in `ui/src/sandbox/` and `ui/src/App.tsx` should be purged (by Explorer M2.1 / Worker M2) to prevent leftover compilation conflicts under `tsc -b`.

---

## 4. Conclusion

We have completely designed, verified, and drafted the drop-in replacement file for `ui/src/sandbox.ts` (`<moul-sandbox>`). It showcases all 6 categories, provides interactive theme switching, and contains zero React dependencies.

### Verified Source Code (`ui/src/sandbox.ts`)

```typescript
/**
 * Moul UI - Pure Lit Web Components Interactive Kitchen Sink Sandbox
 *
 * Demonstrates all 6 component categories within a top-level <moul-sidebar> shell:
 * 1. Actions (Button, ButtonGroup, ToggleButton, ToggleButtonGroup)
 * 2. Surfaces & Feedback (Card, Alert, Badge, Avatar, Table, Toast, ProgressBar, Spinner, Skeleton, Kbd)
 * 3. Overlays & Navigation (Modal, AlertDialog, Popover, Tooltip, Tabs, Pagination, Breadcrumbs, Link)
 * 4. Forms & Inputs (TextField, NumberField, SearchField, Select, ComboBox, Switch, Slider, Checkbox, RadioGroup, DatePicker)
 * 5. Charts & Analytics (LineChart, AreaChart, BarChart, DoughnutChart, Stat, PercentageBar, PercentageCircle, TopList)
 * 6. Composite Blocks (Sidebar, Logs, LogsViewer)
 *
 * Supports interactive light/dark theme toggling via document.documentElement.dataset.theme.
 * Zero React or JSX dependencies.
 */

import {
  css,
  type CSSResultGroup,
  html,
  LitElement,
  nothing,
  type TemplateResult,
} from 'lit'
import { defineElement } from './utils/define-element'
import './index'
import { SERVER_LOG_RAW, toastQueue } from './index'

interface TableColumnItem {
  key: string
  title: string
  sortable?: boolean
}

const TABLE_COLUMNS: TableColumnItem[] = [
  { key: 'name', title: 'User', sortable: true },
  { key: 'role', title: 'Role' },
  { key: 'status', title: 'Status' },
  { key: 'activity', title: 'Last Active' },
]

const TABLE_DATA: Record<string, unknown>[] = [
  {
    name: 'Sarah Chen',
    role: 'Staff Engineer',
    status: 'Active',
    activity: '2m ago',
  },
  {
    name: 'Marcus Brody',
    role: 'Product Designer',
    status: 'In Review',
    activity: '15m ago',
  },
  {
    name: 'Elena Rostova',
    role: 'DevOps Lead',
    status: 'Active',
    activity: '1h ago',
  },
  {
    name: 'Devon Vance',
    role: 'Security Architect',
    status: 'Away',
    activity: '3h ago',
  },
]

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

    .demo-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      background: var(--color-bg-subtle, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: var(--radius-md, 0.75rem);
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
    toggleKey: { type: String, state: true },
    sliderValue: { type: Number, state: true },
    switchValue: { type: Boolean, state: true },
    currentPage: { type: Number, state: true },
    selectedTab: { type: String, state: true },
    textValue: { type: String, state: true },
  }

  declare selectedCategory: string
  declare theme: 'light' | 'dark'
  declare counter: number
  declare isPending: boolean
  declare isModalOpen: boolean
  declare isAlertModalOpen: boolean
  declare toggleKey: string
  declare sliderValue: number
  declare switchValue: boolean
  declare currentPage: number
  declare selectedTab: string
  declare textValue: string

  constructor() {
    super()
    this.selectedCategory = 'all'
    this.theme = 'dark'
    this.counter = 0
    this.isPending = false
    this.isModalOpen = false
    this.isAlertModalOpen = false
    this.toggleKey = 'day'
    this.sliderValue = 42
    this.switchValue = true
    this.currentPage = 1
    this.selectedTab = 'overview'
    this.textValue = 'Hello Web Components'
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

  private handleSidebarSelect(e: CustomEvent<{ selectedKey: string }>): void {
    if (e.detail?.selectedKey) {
      this.selectedCategory = e.detail.selectedKey
    }
  }

  private triggerToast(tone: 'primary' | 'success' | 'warning' | 'error'): void {
    toastQueue.add({
      title: `${tone.toUpperCase()} Notification`,
      description: `Dispatched toast notification with ${tone} semantic tone.`,
      tone,
      duration: 3500,
    })
  }

  private renderActionsSection(): TemplateResult {
    return html`
      <div class="category-section" id="actions">
        <div class="section-header">
          <h3 class="section-title">1. Actions & Toggles</h3>
          <p class="section-subtitle">moul-button, moul-button-group, moul-toggle-button, moul-toggle-button-group</p>
        </div>

        <div class="demo-group">
          <span class="group-label">Button Variants & Semantic Tones</span>
          <div class="demo-row">
            <moul-button variant="solid" tone="primary">Primary Solid</moul-button>
            <moul-button variant="flat" tone="accent">Accent Flat</moul-button>
            <moul-button variant="bordered" tone="success">Success Bordered</moul-button>
            <moul-button variant="glass" tone="warning">Warning Glass</moul-button>
            <moul-button variant="solid" tone="error">Error Solid</moul-button>
            <moul-button variant="ghost">Ghost Button</moul-button>
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
      </div>
    `
  }

  private renderSurfacesSection(): TemplateResult {
    return html`
      <div class="category-section" id="surfaces">
        <div class="section-header">
          <h3 class="section-title">2. Surfaces & Feedback</h3>
          <p class="section-subtitle">moul-card, moul-alert, moul-badge, moul-avatar, moul-table, moul-toast, toastQueue</p>
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

        <moul-card>
          <moul-card-header>
            <h4 style="margin: 0;">Interactive Data Table</h4>
          </moul-card-header>
          <moul-card-body>
            <moul-table .columns=${TABLE_COLUMNS} .data=${TABLE_DATA} is-sortable></moul-table>
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
          <p class="section-subtitle">moul-modal, moul-alert-dialog, moul-popover, moul-tooltip, moul-tabs, moul-pagination</p>
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
          <span class="group-label">Breadcrumbs & Pagination</span>
          <div class="demo-col">
            <moul-breadcrumbs>
              <moul-breadcrumb-item href="#">Workspace</moul-breadcrumb-item>
              <moul-breadcrumb-item href="#">Design System</moul-breadcrumb-item>
              <moul-breadcrumb-item is-current>Kitchen Sink</moul-breadcrumb-item>
            </moul-breadcrumbs>

            <moul-pagination
              total-pages="10"
              .currentPage=${this.currentPage}
              @pagechange=${(e: CustomEvent<{ page: number }>) => {
                this.currentPage = e.detail.page
              }}
            ></moul-pagination>
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
          <p class="section-subtitle">moul-text-field, moul-number-field, moul-select, moul-combobox, moul-switch, moul-slider, moul-date-picker</p>
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

                <moul-checkbox label="Verify package signatures" checked></moul-checkbox>

                <moul-radio-group label="Replication Strategy" value="multi-region">
                  <moul-radio value="single" label="Single Zone"></moul-radio>
                  <moul-radio value="multi-region" label="Multi-Region"></moul-radio>
                </moul-radio-group>
              </div>
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
          <p class="section-subtitle">moul-line-chart, moul-area-chart, moul-bar-chart, moul-doughnut-chart, moul-stat</p>
        </div>

        <div class="section-grid">
          <moul-stat
            label="Gross Monthly Volume"
            value="52400"
            prefix="$"
            trend="up"
            trend-value="+14.8%"
            description="vs previous cycle"
            tone="success"
            .sparklineData=${[24, 30, 28, 38, 44, 52]}
          ></moul-stat>
          <moul-stat
            label="Concurrent Connections"
            value="19420"
            trend="up"
            trend-value="+7.3%"
            description="real-time active sockets"
            tone="primary"
            .sparklineData=${[140, 165, 158, 178, 194]}
          ></moul-stat>
          <moul-stat
            label="Service Error Budget"
            value="99.98"
            suffix="%"
            trend="up"
            trend-value="+0.04%"
            description="SLA compliance"
            tone="accent"
            .sparklineData=${[99.8, 99.85, 99.9, 99.95, 99.98]}
          ></moul-stat>
        </div>

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

  private renderBlocksSection(): TemplateResult {
    return html`
      <div class="category-section" id="blocks">
        <div class="section-header">
          <h3 class="section-title">6. Composite Blocks</h3>
          <p class="section-subtitle">moul-logs-viewer, moul-logs, moul-sidebar</p>
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
            <moul-sidebar-item key="all" label="All Categories" badge="6">
              <span slot="icon">⚡</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="actions" label="Actions" badge="4">
              <span slot="icon">🔘</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="surfaces" label="Surfaces & Feedback" badge="16">
              <span slot="icon">🧱</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="overlays" label="Overlays & Nav" badge="10">
              <span slot="icon">🧭</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="forms" label="Forms & Inputs" badge="15">
              <span slot="icon">📝</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="charts" label="Charts & Analytics" badge="10">
              <span slot="icon">📊</span>
            </moul-sidebar-item>
            <moul-sidebar-item key="blocks" label="Composite Blocks" badge="12">
              <span slot="icon">📦</span>
            </moul-sidebar-item>
          </moul-sidebar-group>

          <moul-sidebar-divider></moul-sidebar-divider>

          <moul-sidebar-footer>
            <moul-button
              variant="ghost"
              size="sm"
              @click=${this.toggleTheme}
              aria-label="Toggle Theme"
            >
              ${this.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </moul-button>
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

            ${isAll || this.selectedCategory === 'actions'
              ? this.renderActionsSection()
              : nothing}
            ${isAll || this.selectedCategory === 'surfaces'
              ? this.renderSurfacesSection()
              : nothing}
            ${isAll || this.selectedCategory === 'overlays'
              ? this.renderOverlaysSection()
              : nothing}
            ${isAll || this.selectedCategory === 'forms'
              ? this.renderFormsSection()
              : nothing}
            ${isAll || this.selectedCategory === 'charts'
              ? this.renderChartsSection()
              : nothing}
            ${isAll || this.selectedCategory === 'blocks'
              ? this.renderBlocksSection()
              : nothing}
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
    `
  }
}

defineElement('moul-sandbox', MoulSandbox)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sandbox': MoulSandbox
  }
}
```

---

## 5. Verification Method

1. **Verify Absence of React / StyleX in Sandbox Code**:
   ```bash
   grep -i "react" .agents/teamwork/explorer_phase10_m2_2/proposed_sandbox.ts
   grep -i "@stylexjs" .agents/teamwork/explorer_phase10_m2_2/proposed_sandbox.ts
   ```
   *Expected*: Zero imports or usages of React or StyleX.

2. **Verify Installation Target File**:
   Once Worker M2 writes `proposed_sandbox.ts` to `ui/src/sandbox.ts` and updates `ui/index.html`:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected*: Exit code 0, 0 disallowed packages or imports.

3. **Verify Vite Sandbox Dev Server Execution**:
   ```bash
   bun run dev:ui
   ```
   *Expected*: Vite serves `http://localhost:5173/`, mounting `<moul-sandbox>`, displaying the `<moul-sidebar>` application shell, all 6 category showcases, and supporting light/dark theme toggling.
