# Comprehensive Analysis & Implementation Strategy: Phase 9 RDT (Sidebar & Composite Blocks)

**Date**: 2026-10-17  
**Author**: `explorer_survey_sidebar_1`  
**Target Milestone**: Phase 9 (Category 6: Composite Block Components — Requirement 12)  
**Scope**: 10-Element `moul-sidebar` Compound Suite, `@lit/context` propagation, motion utilities, tooltip integration, and test suite `ui/src/components/Blocks.test.ts`.

---

## 1. Executive Summary

Phase 9 migrates the composite block components (`Sidebar` suite and `LogsViewer` suite) from legacy React/StyleX/React Aria to pure standards-compliant Lit 3 Web Components with Shadow DOM and zero React dependencies.

This survey establishes the complete technical specification and implementation blueprint for:
1. **The 10-Element Sidebar Compound Suite**: `moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, and `moul-sidebar-user`.
2. **Context Propagation via `@lit/context` (v1.1.6)**: Decoupled parent-child state synchronization (`dense`, `collapsed`, `selectedKey`, `layout`) using `createContext`, `ContextProvider`, and `ContextConsumer` without manual prop-drilling.
3. **Motion Architecture**: FLIP active indicator pill gliding via `animateActiveIndicator` (`SPRING_SNAPPY`), group collapse chevron rotation via `subtleAnimate` or CSS transitions, and aside drawer collapse via `IOS_SHEET_CURVE`.
4. **Pure CSS Grid Collapse**: Zero runtime DOM height measurement using `grid-template-rows: 0fr` to `1fr` transitions on `moul-sidebar-group`.
5. **Collapsed Icon-Only Tooltip Mode**: Wrapping `moul-sidebar-item` in `<moul-tooltip content=${this.label} placement="right">` when `collapsed` is true.
6. **Automated Verification Harness**: Writing `ui/src/components/Blocks.test.ts` covering pure log parsers, `moul-logs-viewer`, `moul-logs`, and all 10 sidebar elements.

---

## 2. Legacy Codebase Survey & Gap Analysis

### 2.1 Existing React/StyleX Sidebar (`ui/src/components/Sidebar/`)
- **`Sidebar.tsx` (1,456 lines)**:
  - Heavily coupled to `react`, `react-aria-components` (`Link`), `@stylexjs/stylex`, and `motion/react` (`motion.header`, `motion.nav`, `motion.div`, `AnimatePresence`).
  - Contains 10 compound components:
    1. `Sidebar` (Provider of `SidebarContext`, layout framing, scroll tracking for mobile nav).
    2. `SidebarAside` (`<aside>` landmark, handles desktop/mobile responsive modes, collapse toggle button).
    3. `SidebarMain` (`<main>` content container).
    4. `SidebarHeader` (header container with dense/collapsed variants).
    5. `SidebarBrand` (logo, title, subtitle, collapse toggle, tooltip in collapsed mode).
    6. `SidebarGroup` (collapsible group header, chevron icon, collapsible item list).
    7. `SidebarItem` (item button/link, icon, label, selected state, tooltip in collapsed mode).
    8. `SidebarDivider` (`role="separator"`, horizontal orientation).
    9. `SidebarFooter` (sticky bottom footer with border option).
    10. `SidebarUser` (user profile with avatar, name, description/email, action slot).
  - Uses `React.createContext<SidebarContextValue | undefined>(undefined)` and `useSidebar()`.
  - Violates zero-React build guard `scripts/verify-no-react.ts` and Vite `banReactImportsPlugin`.
- **`Sidebar.styles.ts` (932 lines)**:
  - Uses `@stylexjs/stylex` with tokens from `../../tokens/tokens.stylex`.
  - Defines key CSS dimensions and behaviors:
    - Default sidebar width: `var(--sidebar-width, 260px)`.
    - Collapsed sidebar width: `var(--sidebar-collapsed-width, 72px)`.
    - Pure CSS Grid collapse for `groupItems`:
      ```css
      transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
      grid-template-rows: 1fr; /* expanded */
      grid-template-rows: 0fr; /* collapsed */
      ```
      with inner container `min-height: 0`, `overflow: hidden`.
- **`Sidebar.test.tsx` (516 lines)**:
  - Uses `@testing-library/react` and `vitest`.
  - Tests landmark `<aside>`, selection events, Enter/Space keyboard toggles on groups, collapse toggle button, and user/brand collapse rendering.

---

## 3. Lit 3 & `@lit/context` Architecture

### 3.1 Monorepo Setup & Constraints
- Dependency in `ui/package.json`: `@lit/context: "^1.1.3"` (installed: `1.1.6`).
- TypeScript compiler option: `"erasableSyntaxOnly": true` in `ui/tsconfig.app.json`.
  - Experimental decorators (`@provide`, `@consume`) require TypeScript legacy decorator transforms which may conflict with erasable syntax.
  - **Decision**: Use the idiomatic Lit `ReactiveController` classes: `ContextProvider` and `ContextConsumer`. They are 100% type-safe, standard TypeScript, and require zero decorators.

### 3.2 Context Contract
Create `ui/src/components/Sidebar/Sidebar.types.ts`:
```ts
import { createContext } from '@lit/context'

export type SidebarLayout = 'sidebar-framed' | 'main-framed'

export interface SidebarContextValue {
  dense: boolean
  collapsed: boolean
  selectedKey: string
  layout: SidebarLayout
  selectItem: (key: string) => void
  toggleCollapse: () => void
  previousActiveRect?: DOMRect | null
}

export const sidebarContext = createContext<SidebarContextValue>(
  Symbol.for('moul-sidebar-context')
)
```

### 3.3 Provider Pattern (`MoulSidebar`)
In `MoulSidebar` (`moul-sidebar`):
```ts
import { ContextProvider } from '@lit/context'
import { sidebarContext, type SidebarContextValue } from './Sidebar.types'

export class MoulSidebar extends LitElement {
  static override properties = {
    layout: { type: String, reflect: true },
    dense: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
  }

  private contextProvider: ContextProvider<typeof sidebarContext>
  private previousActiveRect: DOMRect | null = null

  constructor() {
    super()
    this.layout = 'sidebar-framed'
    this.dense = false
    this.collapsed = false
    this.selectedKey = ''

    this.contextProvider = new ContextProvider(this, {
      context: sidebarContext,
      initialValue: this.computeContextValue(),
    })
  }

  private computeContextValue(): SidebarContextValue {
    return {
      dense: this.dense,
      collapsed: this.collapsed,
      selectedKey: this.selectedKey,
      layout: this.layout,
      selectItem: this.handleItemSelect.bind(this),
      toggleCollapse: this.toggleCollapse.bind(this),
      previousActiveRect: this.previousActiveRect,
    }
  }

  public handleItemSelect(key: string): void {
    if (this.selectedKey === key) return

    // Record rect of currently selected item before updating
    const currentActive = this.querySelector<MoulSidebarItem>(
      `moul-sidebar-item[key="${this.selectedKey}"], moul-sidebar-item[id="${this.selectedKey}"]`
    )
    this.previousActiveRect = currentActive?.getBoundingClientRect() ?? null

    this.selectedKey = key
    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKey: key },
      })
    )
    this.contextProvider.setValue(this.computeContextValue())
  }

  public toggleCollapse(): void {
    this.collapsed = !this.collapsed
    this.dispatchEvent(
      new CustomEvent('collapsechange', {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed },
      })
    )
    this.contextProvider.setValue(this.computeContextValue())
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (
      changedProps.has('dense') ||
      changedProps.has('collapsed') ||
      changedProps.has('selectedKey') ||
      changedProps.has('layout')
    ) {
      this.contextProvider.setValue(this.computeContextValue())
    }
  }
}
```

### 3.4 Consumer Pattern (`MoulSidebarItem`, `MoulSidebarGroup`, etc.)
In descendant elements:
```ts
import { ContextConsumer } from '@lit/context'
import { sidebarContext, type SidebarContextValue } from './Sidebar.types'

export class MoulSidebarItem extends LitElement {
  private sidebarConsumer: ContextConsumer<typeof sidebarContext, this>

  constructor() {
    super()
    this.sidebarConsumer = new ContextConsumer(this, {
      context: sidebarContext,
      subscribe: true,
      callback: () => {
        this.requestUpdate()
      },
    })
  }

  get isDense(): boolean {
    return this.dense || (this.sidebarConsumer.value?.dense ?? false)
  }

  get isCollapsed(): boolean {
    return this.sidebarConsumer.value?.collapsed ?? false
  }

  get isSelected(): boolean {
    const key = this.key || this.id
    if (!key) return false
    return this.sidebarConsumer.value?.selectedKey === key
  }
}
```

---

## 4. Motion & Animation Architecture

### 4.1 Active Indicator Gliding (`animateActiveIndicator`)
- Function signature in `ui/src/utils/motion.ts`:
  ```ts
  export function animateActiveIndicator(
    indicator: HTMLElement,
    previousRect: DOMRect | null,
    nextRect: DOMRect,
  ): AnimationPlaybackControls | null
  ```
- Physics preset: `SPRING_SNAPPY` (`stiffness: 500, damping: 35, mass: 0.8`).
- Integration with `moul-sidebar-item`:
  - When an item becomes selected (`isSelected` becomes true):
  - In `updated(changedProps)`:
    ```ts
    if (this.isSelected && this.indicatorEl) {
      const prevRect = this.sidebarConsumer.value?.previousActiveRect
      const nextRect = this.getBoundingClientRect()
      if (prevRect && nextRect.width > 0 && nextRect.height > 0) {
        try {
          animateActiveIndicator(this.indicatorEl, prevRect, nextRect)
        } catch {
          // Gracefully fallback in headless test environments
        }
      }
    }
    ```
- Shadow DOM structure of `moul-sidebar-item`:
  ```html
  <div part="item" class="item ${this.isSelected ? 'is-selected' : ''}">
    ${this.isSelected ? html`<span part="indicator" class="active-indicator"></span>` : nothing}
    <slot name="icon"></slot>
    <span part="label" class="label"><slot></slot></span>
    <slot name="badge"></slot>
  </div>
  ```

### 4.2 Group Collapse Chevron Rotation
- Chevron icon in `moul-sidebar-group`:
  ```html
  <button
    part="group-header"
    role="button"
    aria-expanded=${!this.collapsed}
    @click=${this.toggleGroup}
  >
    <span part="group-title">${this.label}</span>
    <svg part="chevron" class="chevron ${this.collapsed ? 'is-collapsed' : ''}" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
  ```
- CSS transition:
  ```css
  .chevron {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: rotate(0deg);
  }
  .chevron.is-collapsed {
    transform: rotate(-90deg);
  }
  ```
  Or via `subtleAnimate(this.chevronEl, { transform: this.collapsed ? ['rotate(0deg)', 'rotate(-90deg)'] : ['rotate(-90deg)', 'rotate(0deg)'] }, SPRING_SNAPPY)`.

### 4.3 Pure CSS Grid Height Collapse (Requirement 12.7)
No JavaScript height measurement or ResizeObserver needed for group collapse:
```css
.group-items {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.group-items.is-collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}

.group-items-inner {
  min-height: 0;
  overflow: clip; /* or hidden */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1, 4px);
}
```

---

## 5. Collapsed Tooltip Mode (Requirement 12.8)

### 5.1 `moul-tooltip` Integration
- Existing component: `MoulTooltip` in `ui/src/components/Tooltip/Tooltip.ts`.
- Registered tag: `moul-tooltip`.
- Trigger mechanism: Wraps slotted content. Listens to `pointerenter` (with delay) and `focusin` (immediate).
- In `moul-sidebar-item`:
  ```ts
  import '../Tooltip/Tooltip'

  protected override render() {
    const itemContent = html`
      <a
        part="link"
        href=${this.href || '#'}
        class="link ${this.isSelected ? 'is-selected' : ''}"
        @click=${this.handleClick}
      >
        <span part="icon" class="icon"><slot name="icon"></slot></span>
        ${!this.isCollapsed ? html`<span part="label" class="label"><slot></slot></span>` : nothing}
        ${!this.isCollapsed && this.badge ? html`<span part="badge" class="badge">${this.badge}</span>` : nothing}
      </a>
    `

    if (this.isCollapsed) {
      const tooltipText = this.label || this.textContent?.trim() || ''
      if (tooltipText) {
        return html`
          <moul-tooltip content=${tooltipText} placement="right" delay="200">
            ${itemContent}
          </moul-tooltip>
        `
      }
    }

    return itemContent
  }
  ```

---

## 6. The 10 Compound Sidebar Elements

| Custom Element Tag | Class Name | Role & Responsibility | Key Properties |
|---|---|---|---|
| `<moul-sidebar>` | `MoulSidebar` | Root container and Context Provider | `layout`, `dense`, `collapsed`, `selectedKey` |
| `<moul-sidebar-aside>` | `MoulSidebarAside` | `<aside>` landmark housing navigation items | `aria-label`, `showCollapseToggle` |
| `<moul-sidebar-main>` | `MoulSidebarMain` | `<main>` landmark for page content | None (slotted content) |
| `<moul-sidebar-header>` | `MoulSidebarHeader` | Top container in aside | `dense` |
| `<moul-sidebar-brand>` | `MoulSidebarBrand` | Brand logo, title, and collapse toggle | `logo`, `title`, `subtitle` |
| `<moul-sidebar-group>` | `MoulSidebarGroup` | Collapsible section with header & items | `label`, `collapsible`, `collapsed` |
| `<moul-sidebar-item>` | `MoulSidebarItem` | Navigation item link/button with active pill | `key`, `id`, `href`, `label`, `badge`, `isDisabled` |
| `<moul-sidebar-divider>` | `MoulSidebarDivider` | Horizontal separator (`role="separator"`) | None |
| `<moul-sidebar-footer>` | `MoulSidebarFooter` | Bottom container in aside | `dense`, `showBorder` |
| `<moul-sidebar-user>` | `MoulSidebarUser` | User profile row with avatar and details | `name`, `email`, `avatarSrc`, `status` |

All 10 elements:
- Use `defineElement('moul-sidebar-...', Class)` for idempotent registration.
- Use open Shadow DOM with CSS tokens (`--color-bg-subtle`, `--color-border`, `--spacing-1` through `--spacing-6`, `--radius-lg`, etc.).
- Expose standard CSS shadow parts (`part="base"`, `part="link"`, `part="indicator"`, `part="group-header"`, etc.).

---

## 7. LogsViewer Suite (`moul-logs-viewer` & `moul-logs`)

### 7.1 Existing Pure Log Parser Exports
Already pure in `ui/src/components/LogsViewer/parseLogs.ts` and `exampleLogs.ts`:
- `parseLogs`
- `parseLogLine`
- `parseAttributes`
- `stripAttributes`
- `normalizeLogLevel`
- `SERVER_LOG_RAW`
- `SERVER_LOGS`
These functions have zero DOM dependencies and will be re-exported cleanly from `ui/src/index.ts`.

### 7.2 Web Component Implementations
- `moul-logs-viewer` (`MoulLogsViewer`):
  - Uses `@lit-labs/virtualizer` for rendering large log lists.
  - Controls: search filter (`searchQuery`), level filter (`filterLevel`: `all`, `info`, `warn`, `error`, `debug`), timestamp toggle (`showTimestamps`), line wrapping (`wrapLines`).
  - Active filter level pill glides using `animateActiveIndicator` (`SPRING_SNAPPY`).
- `moul-logs` (`MoulLogs`):
  - Companion element that accepts `raw` string (or text content), parses via `parseLogs(raw)`, and renders `<moul-logs-viewer .logs=${parsedLogs}>`.

---

## 8. Verification Plan & Test Suite Structure (`ui/src/components/Blocks.test.ts`)

Author `ui/src/components/Blocks.test.ts` structured into clear test suites:

### Suite 1: Pure Log Parser Tests
- `parseLogs`: multi-line string splitting, empty string handling, array of lines.
- `parseLogLine`: JSON formatted logs, standard syslog format `[YYYY-MM-DD HH:MM:SS] [LEVEL] msg`, and unformatted lines.
- `parseAttributes`: extracts `key="value"`, `key='value'`, `key=123`, `key=true`, `key=false`, `key=null`.
- `stripAttributes`: removes attribute pairs while preserving base message.
- `normalizeLogLevel`: maps `inf`, `warn`, `warning`, `err`, `erro`, `debu`, `fata` to normalized `LogLevel` (`info`, `warn`, `error`, `debug`, `fatal`), falls back to `info`.
- `SERVER_LOG_RAW` and `SERVER_LOGS`: verifies parsing of 17 canonical log entries.

### Suite 2: `moul-logs-viewer` & `moul-logs` Tests
- Renders virtualized logs list.
- Level filtering: setting `filterLevel="error"` only shows error/fatal logs.
- Search filtering: setting `searchQuery="analytics"` filters matching messages/attributes.
- Timestamp toggle: toggling `showTimestamps` hides timestamp elements.
- `moul-logs` raw parsing: passing `raw` attribute passes parsed `LogItem[]` to internal `moul-logs-viewer`.

### Suite 3: `moul-sidebar` Compound Suite Tests (10 Elements)
- Idempotent registration: confirms `customElements.get('moul-sidebar*')` for all 10 tags.
- Context propagation:
  - Setting `dense=true` on `<moul-sidebar>` propagates `dense` to `<moul-sidebar-aside>`, `<moul-sidebar-header>`, `<moul-sidebar-group>`, and `<moul-sidebar-item>`.
  - Setting `layout="main-framed"` propagates layout framing.
  - Setting `collapsed=true` updates aside width and child item layouts.
- `moul-sidebar-group`:
  - Expands and collapses on click.
  - Toggles with keyboard `Enter` and `Space`.
  - Applies `grid-template-rows: 0fr` when collapsed.
- `moul-sidebar-item`:
  - Active selection state matches `selectedKey`.
  - Clicking item dispatches `selectionchange` on `<moul-sidebar>` with `{ detail: { selectedKey } }`.
  - In collapsed sidebar, item wraps trigger in `<moul-tooltip>` with placement `right`.
- `moul-sidebar-brand` and `moul-sidebar-user`:
  - Brand collapse title hiding.
  - User details rendering and avatar display.

### Suite 4: Zero-React & Manifest Verification
- `scripts/verify-no-react.ts all` exits with 0.
- `banReactImportsPlugin` passes without import violations.

---

## 9. Next Steps for Implementation Agent

1. Create directory structure in `ui/src/components/Sidebar/`:
   - `Sidebar.types.ts`: Context definition and shared types.
   - `Sidebar.styles.ts`: Shared Shadow DOM styles using Lit CSS and CSS variables.
   - `Sidebar.ts`: `MoulSidebar`.
   - `SidebarAside.ts`: `MoulSidebarAside`.
   - `SidebarMain.ts`: `MoulSidebarMain`.
   - `SidebarHeader.ts`: `MoulSidebarHeader`.
   - `SidebarBrand.ts`: `MoulSidebarBrand`.
   - `SidebarGroup.ts`: `MoulSidebarGroup`.
   - `SidebarItem.ts`: `MoulSidebarItem`.
   - `SidebarDivider.ts`: `MoulSidebarDivider`.
   - `SidebarFooter.ts`: `MoulSidebarFooter`.
   - `SidebarUser.ts`: `MoulSidebarUser`.
   - `index.ts`: Public barrel exports.
2. Remove legacy React/StyleX files in `ui/src/components/Sidebar/` (`Sidebar.tsx`, `Sidebar.test.tsx`, and old `Sidebar.styles.ts`).
3. Implement `LogsViewer.ts` (`MoulLogsViewer`) and `Logs.ts` (`MoulLogs`) in `ui/src/components/LogsViewer/` and clean up old React `Logs.tsx` and `Logs.test.tsx`.
4. Update `ui/src/index.ts` to export all 12 custom elements and augment `HTMLElementTagNameMap`.
5. Author `ui/src/components/Blocks.test.ts`.
6. Run `scripts/verify-no-react.ts` and test suite.
