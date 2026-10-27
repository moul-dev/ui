# Foundation & Contract Verification Test Suite Design Report

**Agent**: `explorer_phase10_m3_2`  
**Parent Orchestrator**: `dae9e90c-c048-4fc8-8e06-169a5a42bbad`  
**Task**: Design and draft `ui/src/components/Foundation.test.ts` for Milestone 3  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2`  
**Date**: 2026-10-17T14:01:00Z  

---

## 1. Observation

### 1.1 Public Entry Point (`ui/src/index.ts`) Exports
- **File**: `ui/src/index.ts` (559 lines)
- Total exported symbols: **186**
- Custom Element Classes: Exactly **77** classes exported with `Moul` prefix (e.g., `MoulButton`, `MoulCard`, `MoulLineChart`, `MoulSidebar`, `MoulToastRegion`).
- Canonical Aliases: Exactly **77** alias pairs exported matching `Moul*` classes (e.g., `export { MoulButton, MoulButton as Button }`).
- Component Specifications:
  - **54 Primary Component Classes** across 6 categories:
    - Actions (2): `Button`, `ToggleButton`
    - Surfaces (14): `Typography`, `Kbd`, `Separator`, `Spinner`, `Skeleton`, `Badge`, `Card`, `EmptyState`, `Alert`, `ProgressBar`, `Avatar`, `Tag`, `Table`, `Toast`
    - Overlays (10): `Link`, `Breadcrumbs`, `Pagination`, `Tabs`, `Popover`, `Tooltip`, `Modal`, `AlertDialog`, `Drawer`, `CommandPalette`
    - Forms (15): `Form`, `TextField`, `NumberField`, `SearchField`, `TextArea`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch`, `Slider`, `InputOTP`, `Select`, `ComboBox`, `Calendar`, `DatePicker`
    - Charts (10): `ChartContainer`, `ChartTooltip`, `LineChart`, `AreaChart`, `BarChart`, `DoughnutChart`, `TopList`, `Stat`, `PercentageBar`, `PercentageCircle`
    - Blocks (3): `Logs`, `LogsViewer`, `Sidebar`
  - **23 Companion / Subcomponent Elements**:
    - `ButtonGroup`, `ToggleButtonGroup`, `CardHeader`, `CardBody`, `CardFooter`, `AvatarGroup`, `TagGroup`, `ToastRegion`, `BreadcrumbItem`, `Tab`, `TabPanel`, `Radio`, `SelectItem`, `ComboBoxItem`, `SidebarAside`, `SidebarMain`, `SidebarHeader`, `SidebarBrand`, `SidebarGroup`, `SidebarItem`, `SidebarDivider`, `SidebarFooter`, `SidebarUser`
  - Total Custom Elements: $54 + 23 = \mathbf{77}$.
- Reactive Controllers: Exactly **5** controllers exported:
  - `PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`
  - Along with helper utilities: `clampValue`, `computeBreakpoint`, and numeric bounds `MAX_NUMBER_VALUE` (`999_999_999`), `MIN_NUMBER_VALUE` (`-999_999_999`).
- Singletons & Helpers:
  - `toastQueue` singleton object with methods `add`, `subscribe`, `dismiss`, `clear`.
  - `generatePagination` helper function.
- Log Utilities & Constants: Exactly **7** pure utilities/constants:
  - Functions: `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`
  - Constants: `SERVER_LOG_RAW` (string), `SERVER_LOGS` (array of objects)
  - Subcomponents: `HighlightText`, `LogAttributeChip`, `LogCopyIconButton`, `LogLevelBadge`.
- Design Tokens & Tones:
  - `CHART_COLORS` (8 tokens), `getChartColor` (function)
  - `SEMANTIC_TONES` (8 tones), `VISUAL_VARIANTS` (5 variants), `normalizeTone`, `normalizeVariant`, `semanticToneStyles`
  - `sidebarContext` (symbol), `useSidebar` (function)
  - `version` (`"2026.10.17"`).

### 1.2 `HTMLElementTagNameMap` Augmentation
- Lines 468–557 in `ui/src/index.ts` declare the global `HTMLElementTagNameMap` interface.
- Exactly **77** `moul-*` custom element tag names are registered in `HTMLElementTagNameMap` mapped 1:1 to their respective `Moul*` LitElement classes.
- Zero mismatch between registered tags and `defineElement` invocations across the library.

### 1.3 Custom Element Idempotent Registration (`ui/src/utils/define-element.ts`)
- **File**: `ui/src/utils/define-element.ts` (24 lines)
- Verbatim implementation:
  ```typescript
  export function defineElement(
    tagName: string,
    ctor: CustomElementConstructor,
  ): void {
    if (typeof customElements === 'undefined') return

    const existing = customElements.get(tagName)
    if (existing) {
      console.warn(
        `[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.`,
      )
      return
    }

    customElements.define(tagName, ctor)
  }
  ```
- Calling `defineElement(tag, ctor)` when `tag` is already registered emits a `console.warn` matching `[@moul-dev/ui] Custom element "${tagName}" is already registered.` and safely returns without calling `customElements.define(tagName, ctor)`. It does NOT throw a `DOMException` / `NotSupportedError`.
- `customElements.get(tagName)` retains the exact constructor before and after re-registration.

### 1.4 Zero React Imports & Disallowed Modules
- `ui/src/index.ts` contains 0 imports from `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
- `ui/package.json` contains 0 references to React packages in `dependencies`, `peerDependencies`, or `devDependencies`.
- `scripts/verify-no-react.ts all` exits with code 0.
- All legacy `.tsx` files in `ui/src/` have been purged under Milestone 2.

### 1.5 Current Monorepo Test Baseline
- Command: `bun --cwd ui test` (`vitest run`)
- Result: **33 test files passed (33)**, **966 tests passed (966)**, **0 failed**.
- Exit code: `0`.

---

## 2. Logic Chain

1. **Step 1 (Export Contract Verification)**:
   - Observation 1.1 establishes that `ui/src/index.ts` is the single public entry point exporting 186 symbols.
   - Requirement R1 commands testing export completeness for all 54 component classes, companion elements (77 custom elements), 5 reactive controllers, `toastQueue`, `generatePagination`, and 7 log parsers/constants.
   - Deduction: `Foundation.test.ts` must construct a comprehensive metadata table of all 77 elements, iterating over each entry to verify that `Moul<Name>` and `<Name>` are defined constructor functions whose prototypes are Custom Elements. Controllers, singletons, helpers, and parser utilities must be validated for both type and functional correctness.

2. **Step 2 (Zero React Enforcement)**:
   - Observation 1.4 confirms all legacy React files and dependencies have been purged.
   - Requirement R1 and Acceptance Criteria dictate that no React or StyleX runtime presence or import references remain.
   - Deduction: `Foundation.test.ts` should enforce zero-React through three independent defense layers:
     a) Runtime export key and prototype check: ensuring no banned React symbols (`React`, `Component`, `useState`, etc.) or `$$typeof` properties exist.
     b) Static AST / source check: reading `ui/src/index.ts` to ensure no regex matches banned prefixes (`react`, `@stylexjs`, `.tsx`, etc.).
     c) Package manifest check: reading `ui/package.json` and monorepo `package.json` to ensure zero disallowed packages are declared.

3. **Step 3 (Registration Idempotency Verification)**:
   - Observation 1.3 reveals that `defineElement` guards duplicate registrations by logging a warning with prefix `[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.`.
   - Requirement R3 and Acceptance Criteria require verifying `customElements.define` idempotency and `customElements.get(tag)` before and after second import / re-registration.
   - Deduction: `Foundation.test.ts` must spy on `console.warn` (`vi.spyOn(console, 'warn')`), execute re-registration across all 77 tags, verify that exactly 77 warnings are emitted with the expected text, confirm no errors are thrown, and assert that `customElements.get(tag)` returns identical constructors. It must also verify that high-frequency duplicate registration barrages do not cause registry drift.

4. **Step 4 (DOM Instantiation & Tag Parity)**:
   - Observation 1.2 demonstrates that `HTMLElementTagNameMap` contains all 77 tags.
   - Requirement R1 requires that `HTMLElementTagNameMap` typing matches all custom elements.
   - Deduction: `Foundation.test.ts` should test `document.createElement(tag)` for all 77 tags, asserting `el instanceof ExpectedClass`, `el.tagName.toLowerCase() === tag`, and providing a type-level helper (`assertTagType<K extends keyof HTMLElementTagNameMap>`) that validates TypeScript compile-time type inference across all component categories. It should also verify DOM lifecycle mounting and teardown.

---

## 3. Caveats

1. **Test Location**: The test suite is designed specifically for `ui/src/components/Foundation.test.ts`. All relative imports (`../index`, `../utils/define-element`, `../../package.json`) are relative to `ui/src/components/`.
2. **ESM Caching**: In Node/Bun ESM, imported modules are cached in the module registry. Re-registering custom elements via direct `defineElement` invocations across all 77 elements provides 100% deterministic verification of registration idempotency without depending on ESM loader cache-busting internals.
3. **Primary vs. Companion Distinction**: In RDT Section 8, 54 component specifications are defined, but compound component families expand this to 77 custom elements in the browser registry. The test suite explicitly tests both: validating the 54 primary components, the 23 companion elements, and the full 77-element registry.

---

## 4. Conclusion

The contract verification test suite has been designed, drafted, formatted with Biome, and validated in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2/proposed_Foundation.test.ts`.

It covers:
- **Dimension 1**: Public Export Contracts & Catalog Completeness (FND-EXP-01..05)
  - All 77 custom elements (54 primary + 23 companion)
  - All 5 reactive controllers + bounds + breakpoint helpers
  - `toastQueue` singleton + `generatePagination` helper
  - All 7 log parsers + constants + helper subcomponents
  - Chart color tokens + semantic tones + version
- **Dimension 2**: Zero React & Disallowed Dependency Guarantees (FND-ZRO-01..03)
  - Runtime exports inspection
  - Static `index.ts` source inspection
  - `ui/package.json` and workspace manifest inspection
- **Dimension 3**: Custom Element Registration Idempotency & defineElement Contracts (FND-REG-01..04)
  - Registry completeness for all 77 tags
  - `defineElement` duplicate warning emission (77/77) without DOMException
  - `customElements.get()` invariant equality before and after duplicate registration
  - High-frequency barrage survival
- **Dimension 4**: DOM Instantiation & HTMLElementTagNameMap Parity (FND-TAG-01..03)
  - `document.createElement()` instantiation for all 77 tags
  - Type-safe `HTMLElementTagNameMap` mapping across all 6 categories
  - Live DOM connection, update complete, and disconnection lifecycle

### Drop-in Replacement Source Code for `ui/src/components/Foundation.test.ts`:

```typescript
/**
 * @moul-dev/ui Foundation & Contract Test Suite
 *
 * Verifies public library contracts for Milestone 3 (Phase 10):
 * 1. Export Contracts: All 54 component classes, companion elements (77 custom elements),
 *    canonical aliases, 5 reactive controllers, toastQueue, generatePagination, and
 *    7 pure log parsing utilities/constants exported from `ui/src/index.ts`.
 * 2. Zero React Dependencies: Strict verification that zero React, React Aria, StyleX,
 *    or JSX-adapter runtime modules or files are imported or present in exports.
 * 3. Custom Element Registration Idempotency: `customElements.define` safe handling via
 *    `defineElement`, ensuring repeated registrations emit standard console warnings
 *    without throwing errors, and `customElements.get(tag)` returns identical constructors.
 * 4. Tag Map Parity & DOM Instantiation: Augmentation of global `HTMLElementTagNameMap` with
 *    all 77 custom element tags, matching DOM instantiation and TypeScript type inference.
 */

import fs from 'node:fs'
import { resolve } from 'node:path'
import type { LitElement } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as MoulUI from '../index'
import { defineElement } from '../utils/define-element'

// Complete metadata catalog of all 77 custom elements in @moul-dev/ui
interface ElementContract {
  tag: keyof HTMLElementTagNameMap
  moulName: keyof typeof MoulUI
  canonicalName: keyof typeof MoulUI
  category: 'Actions' | 'Surfaces' | 'Overlays' | 'Forms' | 'Charts' | 'Blocks'
  isPrimary: boolean
}

const ALL_77_ELEMENTS: ElementContract[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // Phase 4: Actions & Toggle Components (4 Elements: 2 Primary + 2 Companion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-button',
    moulName: 'MoulButton',
    canonicalName: 'Button',
    category: 'Actions',
    isPrimary: true,
  },
  {
    tag: 'moul-button-group',
    moulName: 'MoulButtonGroup',
    canonicalName: 'ButtonGroup',
    category: 'Actions',
    isPrimary: false,
  },
  {
    tag: 'moul-toggle-button',
    moulName: 'MoulToggleButton',
    canonicalName: 'ToggleButton',
    category: 'Actions',
    isPrimary: true,
  },
  {
    tag: 'moul-toggle-button-group',
    moulName: 'MoulToggleButtonGroup',
    canonicalName: 'ToggleButtonGroup',
    category: 'Actions',
    isPrimary: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5: Surface & Feedback Components (20 Elements: 14 Primary + 6 Companion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-typography',
    moulName: 'MoulTypography',
    canonicalName: 'Typography',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-kbd',
    moulName: 'MoulKbd',
    canonicalName: 'Kbd',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-separator',
    moulName: 'MoulSeparator',
    canonicalName: 'Separator',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-spinner',
    moulName: 'MoulSpinner',
    canonicalName: 'Spinner',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-skeleton',
    moulName: 'MoulSkeleton',
    canonicalName: 'Skeleton',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-badge',
    moulName: 'MoulBadge',
    canonicalName: 'Badge',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-card',
    moulName: 'MoulCard',
    canonicalName: 'Card',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-card-header',
    moulName: 'MoulCardHeader',
    canonicalName: 'CardHeader',
    category: 'Surfaces',
    isPrimary: false,
  },
  {
    tag: 'moul-card-body',
    moulName: 'MoulCardBody',
    canonicalName: 'CardBody',
    category: 'Surfaces',
    isPrimary: false,
  },
  {
    tag: 'moul-card-footer',
    moulName: 'MoulCardFooter',
    canonicalName: 'CardFooter',
    category: 'Surfaces',
    isPrimary: false,
  },
  {
    tag: 'moul-empty-state',
    moulName: 'MoulEmptyState',
    canonicalName: 'EmptyState',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-alert',
    moulName: 'MoulAlert',
    canonicalName: 'Alert',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-progress-bar',
    moulName: 'MoulProgressBar',
    canonicalName: 'ProgressBar',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-avatar',
    moulName: 'MoulAvatar',
    canonicalName: 'Avatar',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-avatar-group',
    moulName: 'MoulAvatarGroup',
    canonicalName: 'AvatarGroup',
    category: 'Surfaces',
    isPrimary: false,
  },
  {
    tag: 'moul-tag',
    moulName: 'MoulTag',
    canonicalName: 'Tag',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-tag-group',
    moulName: 'MoulTagGroup',
    canonicalName: 'TagGroup',
    category: 'Surfaces',
    isPrimary: false,
  },
  {
    tag: 'moul-table',
    moulName: 'MoulTable',
    canonicalName: 'Table',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-toast',
    moulName: 'MoulToast',
    canonicalName: 'Toast',
    category: 'Surfaces',
    isPrimary: true,
  },
  {
    tag: 'moul-toast-region',
    moulName: 'MoulToastRegion',
    canonicalName: 'ToastRegion',
    category: 'Surfaces',
    isPrimary: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 6: Overlay & Navigation Components (13 Elements: 10 Primary + 3 Companion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-link',
    moulName: 'MoulLink',
    canonicalName: 'Link',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-breadcrumbs',
    moulName: 'MoulBreadcrumbs',
    canonicalName: 'Breadcrumbs',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-breadcrumb-item',
    moulName: 'MoulBreadcrumbItem',
    canonicalName: 'BreadcrumbItem',
    category: 'Overlays',
    isPrimary: false,
  },
  {
    tag: 'moul-pagination',
    moulName: 'MoulPagination',
    canonicalName: 'Pagination',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-tabs',
    moulName: 'MoulTabs',
    canonicalName: 'Tabs',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-tab',
    moulName: 'MoulTab',
    canonicalName: 'Tab',
    category: 'Overlays',
    isPrimary: false,
  },
  {
    tag: 'moul-tab-panel',
    moulName: 'MoulTabPanel',
    canonicalName: 'TabPanel',
    category: 'Overlays',
    isPrimary: false,
  },
  {
    tag: 'moul-popover',
    moulName: 'MoulPopover',
    canonicalName: 'Popover',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-tooltip',
    moulName: 'MoulTooltip',
    canonicalName: 'Tooltip',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-modal',
    moulName: 'MoulModal',
    canonicalName: 'Modal',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-alert-dialog',
    moulName: 'MoulAlertDialog',
    canonicalName: 'AlertDialog',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-drawer',
    moulName: 'MoulDrawer',
    canonicalName: 'Drawer',
    category: 'Overlays',
    isPrimary: true,
  },
  {
    tag: 'moul-command-palette',
    moulName: 'MoulCommandPalette',
    canonicalName: 'CommandPalette',
    category: 'Overlays',
    isPrimary: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 7: Input & Form Components (18 Elements: 15 Primary + 3 Companion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-form',
    moulName: 'MoulForm',
    canonicalName: 'Form',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-text-field',
    moulName: 'MoulTextField',
    canonicalName: 'TextField',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-number-field',
    moulName: 'MoulNumberField',
    canonicalName: 'NumberField',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-search-field',
    moulName: 'MoulSearchField',
    canonicalName: 'SearchField',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-text-area',
    moulName: 'MoulTextArea',
    canonicalName: 'TextArea',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-checkbox',
    moulName: 'MoulCheckbox',
    canonicalName: 'Checkbox',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-checkbox-group',
    moulName: 'MoulCheckboxGroup',
    canonicalName: 'CheckboxGroup',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-radio',
    moulName: 'MoulRadio',
    canonicalName: 'Radio',
    category: 'Forms',
    isPrimary: false,
  },
  {
    tag: 'moul-radio-group',
    moulName: 'MoulRadioGroup',
    canonicalName: 'RadioGroup',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-switch',
    moulName: 'MoulSwitch',
    canonicalName: 'Switch',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-slider',
    moulName: 'MoulSlider',
    canonicalName: 'Slider',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-input-otp',
    moulName: 'MoulInputOTP',
    canonicalName: 'InputOTP',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-select',
    moulName: 'MoulSelect',
    canonicalName: 'Select',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-select-item',
    moulName: 'MoulSelectItem',
    canonicalName: 'SelectItem',
    category: 'Forms',
    isPrimary: false,
  },
  {
    tag: 'moul-combobox',
    moulName: 'MoulComboBox',
    canonicalName: 'ComboBox',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-combobox-item',
    moulName: 'MoulComboBoxItem',
    canonicalName: 'ComboBoxItem',
    category: 'Forms',
    isPrimary: false,
  },
  {
    tag: 'moul-calendar',
    moulName: 'MoulCalendar',
    canonicalName: 'Calendar',
    category: 'Forms',
    isPrimary: true,
  },
  {
    tag: 'moul-date-picker',
    moulName: 'MoulDatePicker',
    canonicalName: 'DatePicker',
    category: 'Forms',
    isPrimary: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 8: Charts & Analytics Components (10 Elements: 10 Primary)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-chart-container',
    moulName: 'MoulChartContainer',
    canonicalName: 'ChartContainer',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-chart-tooltip',
    moulName: 'MoulChartTooltip',
    canonicalName: 'ChartTooltip',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-line-chart',
    moulName: 'MoulLineChart',
    canonicalName: 'LineChart',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-area-chart',
    moulName: 'MoulAreaChart',
    canonicalName: 'AreaChart',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-bar-chart',
    moulName: 'MoulBarChart',
    canonicalName: 'BarChart',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-doughnut-chart',
    moulName: 'MoulDoughnutChart',
    canonicalName: 'DoughnutChart',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-top-list',
    moulName: 'MoulTopList',
    canonicalName: 'TopList',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-stat',
    moulName: 'MoulStat',
    canonicalName: 'Stat',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-percentage-bar',
    moulName: 'MoulPercentageBar',
    canonicalName: 'PercentageBar',
    category: 'Charts',
    isPrimary: true,
  },
  {
    tag: 'moul-percentage-circle',
    moulName: 'MoulPercentageCircle',
    canonicalName: 'PercentageCircle',
    category: 'Charts',
    isPrimary: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 9: Composite Block Components (12 Elements: 3 Primary + 9 Companion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    tag: 'moul-logs',
    moulName: 'MoulLogs',
    canonicalName: 'Logs',
    category: 'Blocks',
    isPrimary: true,
  },
  {
    tag: 'moul-logs-viewer',
    moulName: 'MoulLogsViewer',
    canonicalName: 'LogsViewer',
    category: 'Blocks',
    isPrimary: true,
  },
  {
    tag: 'moul-sidebar',
    moulName: 'MoulSidebar',
    canonicalName: 'Sidebar',
    category: 'Blocks',
    isPrimary: true,
  },
  {
    tag: 'moul-sidebar-aside',
    moulName: 'MoulSidebarAside',
    canonicalName: 'SidebarAside',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-main',
    moulName: 'MoulSidebarMain',
    canonicalName: 'SidebarMain',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-header',
    moulName: 'MoulSidebarHeader',
    canonicalName: 'SidebarHeader',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-brand',
    moulName: 'MoulSidebarBrand',
    canonicalName: 'SidebarBrand',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-group',
    moulName: 'MoulSidebarGroup',
    canonicalName: 'SidebarGroup',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-item',
    moulName: 'MoulSidebarItem',
    canonicalName: 'SidebarItem',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-divider',
    moulName: 'MoulSidebarDivider',
    canonicalName: 'SidebarDivider',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-footer',
    moulName: 'MoulSidebarFooter',
    canonicalName: 'SidebarFooter',
    category: 'Blocks',
    isPrimary: false,
  },
  {
    tag: 'moul-sidebar-user',
    moulName: 'MoulSidebarUser',
    canonicalName: 'SidebarUser',
    category: 'Blocks',
    isPrimary: false,
  },
]

describe('Foundation Contract Verification Suite (`ui/src/components/Foundation.test.ts`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Export Contracts & Public API Completeness (Requirement R1)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 1: Public Export Contracts & Catalog Completeness', () => {
    it('FND-EXP-01: exports all 77 custom element classes under Moul* prefix and canonical aliases', () => {
      expect(ALL_77_ELEMENTS).toHaveLength(77)

      const primaryComponents = ALL_77_ELEMENTS.filter((e) => e.isPrimary)
      const companionElements = ALL_77_ELEMENTS.filter((e) => !e.isPrimary)
      expect(primaryComponents).toHaveLength(54)
      expect(companionElements).toHaveLength(23)

      for (const item of ALL_77_ELEMENTS) {
        const moulClass = MoulUI[item.moulName] as unknown as CustomElementConstructor
        const canonicalClass = MoulUI[item.canonicalName] as unknown as CustomElementConstructor

        expect(
          moulClass,
          `Expected ${String(item.moulName)} to be exported from ui/src/index.ts`,
        ).toBeDefined()
        expect(
          typeof moulClass,
          `Expected ${String(item.moulName)} to be a constructor function`,
        ).toBe('function')
        expect(
          canonicalClass,
          `Expected canonical alias ${String(item.canonicalName)} to match ${String(item.moulName)}`,
        ).toBe(moulClass)

        // Custom element prototype inspection
        expect(
          moulClass.prototype,
          `Expected ${String(item.moulName)}.prototype to be defined`,
        ).toBeInstanceOf(Object)
      }
    })

    it('FND-EXP-02: exports all 5 reactive controllers and controller helpers', () => {
      // 5 Reactive Controllers
      expect(typeof MoulUI.PressController).toBe('function')
      expect(typeof MoulUI.LayoutIndicatorController).toBe('function')
      expect(typeof MoulUI.OverlayPresenceController).toBe('function')
      expect(typeof MoulUI.NumberSpringController).toBe('function')
      expect(typeof MoulUI.FormInternalsController).toBe('function')

      // Controller Utilities & Numeric Bounds
      expect(typeof MoulUI.clampValue).toBe('function')
      expect(typeof MoulUI.computeBreakpoint).toBe('function')
      expect(MoulUI.MAX_NUMBER_VALUE).toBe(999_999_999)
      expect(MoulUI.MIN_NUMBER_VALUE).toBe(-999_999_999)

      // Test utility behavior
      expect(MoulUI.clampValue(10, 0, 100)).toBe(10)
      expect(MoulUI.clampValue(-50, 0, 100)).toBe(0)
      expect(MoulUI.clampValue(150, 0, 100)).toBe(100)
    })

    it('FND-EXP-03: exports toastQueue singleton and generatePagination helper', () => {
      // ToastQueue Singleton Contract
      expect(MoulUI.toastQueue).toBeDefined()
      expect(typeof MoulUI.toastQueue.add).toBe('function')
      expect(typeof MoulUI.toastQueue.subscribe).toBe('function')
      expect(typeof MoulUI.toastQueue.dismiss).toBe('function')
      expect(typeof MoulUI.toastQueue.clear).toBe('function')

      // generatePagination Helper Contract
      expect(typeof MoulUI.generatePagination).toBe('function')

      // 5-page pagination has no ellipses
      const pages5 = MoulUI.generatePagination({ currentPage: 1, totalPages: 5 })
      expect(pages5).toEqual([1, 2, 3, 4, 5])

      // 10-page pagination includes ellipsis markers
      const pages10 = MoulUI.generatePagination({ currentPage: 5, totalPages: 10 })
      expect(pages10).toContain('ellipsis')
      expect(pages10[0]).toBe(1)
      expect(pages10[pages10.length - 1]).toBe(10)
    })

    it('FND-EXP-04: exports all 7 log parser functions, constants, and helper subcomponents', () => {
      // 7 Log Parser Utilities & Constants
      expect(typeof MoulUI.parseLogs).toBe('function')
      expect(typeof MoulUI.parseLogLine).toBe('function')
      expect(typeof MoulUI.parseAttributes).toBe('function')
      expect(typeof MoulUI.stripAttributes).toBe('function')
      expect(typeof MoulUI.normalizeLogLevel).toBe('function')
      expect(typeof MoulUI.SERVER_LOG_RAW).toBe('string')
      expect(MoulUI.SERVER_LOG_RAW.length).toBeGreaterThan(0)
      expect(Array.isArray(MoulUI.SERVER_LOGS)).toBe(true)
      expect(MoulUI.SERVER_LOGS.length).toBeGreaterThan(0)

      // Log parsing behavior validation
      const sampleLine =
        '2026-10-17T12:00:00Z [INFO] Service started status="ok" latency=42ms'
      const parsed = MoulUI.parseLogLine(sampleLine, 1)
      expect(parsed.level).toBe('info')
      expect(parsed.raw).toBe(sampleLine)

      // Helper Subcomponents
      expect(typeof MoulUI.HighlightText).toBe('function')
      expect(typeof MoulUI.LogAttributeChip).toBe('function')
      expect(typeof MoulUI.LogCopyIconButton).toBe('function')
      expect(typeof MoulUI.LogLevelBadge).toBe('function')
    })

    it('FND-EXP-05: exports design tokens, semantic tones, chart color utilities, and version', () => {
      // Version string
      expect(typeof MoulUI.version).toBe('string')
      expect(MoulUI.version).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)

      // Chart Colors
      expect(Array.isArray(MoulUI.CHART_COLORS)).toBe(true)
      expect(MoulUI.CHART_COLORS).toHaveLength(8)
      expect(typeof MoulUI.getChartColor).toBe('function')
      expect(MoulUI.getChartColor(0)).toBe(MoulUI.CHART_COLORS[0])

      // Semantic Tones & Variants
      expect(Array.isArray(MoulUI.SEMANTIC_TONES)).toBe(true)
      expect(Array.isArray(MoulUI.VISUAL_VARIANTS)).toBe(true)
      expect(typeof MoulUI.normalizeTone).toBe('function')
      expect(typeof MoulUI.normalizeVariant).toBe('function')
      expect(MoulUI.semanticToneStyles).toBeDefined()

      // Sidebar context
      expect(typeof MoulUI.sidebarContext).toBe('symbol')
      expect(typeof MoulUI.useSidebar).toBe('function')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Zero React & Disallowed Dependency Contracts (Requirement R1, R2)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 2: Zero React & Disallowed Dependency Guarantees', () => {
    it('FND-ZRO-01: runtime exports do not contain React symbols, hooks, or component instances', () => {
      const BANNED_KEYWORDS = [
        'React',
        'Component',
        'PureComponent',
        'useState',
        'useEffect',
        'useContext',
        'useReducer',
        'useCallback',
        'useMemo',
        'useRef',
        'useImperativeHandle',
        'useLayoutEffect',
        'useDebugValue',
        'createContext',
        'createElement',
        'cloneElement',
        'Fragment',
      ]

      const exportedKeys = Object.keys(MoulUI)
      for (const key of exportedKeys) {
        expect(
          BANNED_KEYWORDS.includes(key),
          `Disallowed React symbol "${key}" found in public exports`,
        ).toBe(false)

        const val = (MoulUI as Record<string, unknown>)[key]
        if (val && typeof val === 'object') {
          // Check for React Element $$typeof symbol or StyleX compiled objects
          expect(
            (val as Record<string, unknown>).$$typeof,
            `Exported object "${key}" looks like a React element ($$typeof present)`,
          ).toBeUndefined()
        }
      }

      // Check global window / globalThis for leaked React runtime
      expect((globalThis as Record<string, unknown>).React).toBeUndefined()
      expect((globalThis as Record<string, unknown>).ReactDOM).toBeUndefined()
    })

    it('FND-ZRO-02: static index.ts source code contains zero banned imports or references', () => {
      const indexPath = resolve(__dirname, '../index.ts')
      expect(fs.existsSync(indexPath)).toBe(true)

      const indexContent = fs.readFileSync(indexPath, 'utf-8')

      const BANNED_IMPORT_REGEXES = [
        /from\s+['"]react['"]/i,
        /from\s+['"]react\/.*['"]/i,
        /from\s+['"]react-dom['"]/i,
        /from\s+['"]react-aria['"]/i,
        /from\s+['"]react-aria-components['"]/i,
        /from\s+['"]@stylexjs\/.*['"]/i,
        /from\s+['"]@lit\/react['"]/i,
        /from\s+['"]motion\/react['"]/i,
        /from\s+['"]recharts['"]/i,
      ]

      for (const regex of BANNED_IMPORT_REGEXES) {
        expect(
          regex.test(indexContent),
          `ui/src/index.ts matched banned import pattern ${regex.toString()}`,
        ).toBe(false)
      }

      // Ensure no imports end with .tsx
      expect(
        /from\s+['"].*\.tsx['"]/i.test(indexContent),
        'ui/src/index.ts must not import any legacy .tsx file',
      ).toBe(false)
    })

    it('FND-ZRO-03: package manifests contain zero banned React/StyleX dependencies', () => {
      const packagePaths = [
        resolve(__dirname, '../../package.json'),
        resolve(__dirname, '../../../package.json'),
      ]

      const BANNED_PACKAGES = [
        'react',
        'react-dom',
        'react-aria',
        'react-aria-components',
        '@stylexjs/stylex',
        '@lit/react',
      ]

      for (const pkgPath of packagePaths) {
        if (!fs.existsSync(pkgPath)) continue
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.peerDependencies || {}),
          ...(pkg.devDependencies || {}),
        }

        for (const banned of BANNED_PACKAGES) {
          expect(
            allDeps[banned],
            `Disallowed package "${banned}" found in manifest ${pkgPath}`,
          ).toBeUndefined()
        }
      }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Custom Element Registration Idempotency Contracts (Requirement R3)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 3: Custom Element Registration Idempotency & defineElement Contracts', () => {
    it('FND-REG-01: customElements registry contains all 77 custom element tags mapped to constructors', () => {
      for (const item of ALL_77_ELEMENTS) {
        const ctor = customElements.get(item.tag)
        expect(
          ctor,
          `Custom element "${item.tag}" was not registered in customElements registry`,
        ).toBeDefined()
        expect(
          ctor,
          `Custom element "${item.tag}" registry constructor does not match exported Moul class`,
        ).toBe(MoulUI[item.moulName])
      }
    })

    it('FND-REG-02: defineElement() re-registration emits console.warn without throwing DOMException', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      for (const item of ALL_77_ELEMENTS) {
        const ctor = MoulUI[item.moulName] as CustomElementConstructor
        // Must not throw duplicate registration DOMException
        expect(() => {
          defineElement(item.tag, ctor)
        }).not.toThrow()
      }

      expect(warnSpy).toHaveBeenCalledTimes(77)

      for (const item of ALL_77_ELEMENTS) {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `[@moul-dev/ui] Custom element "${item.tag}" is already registered. Skipping duplicate registration.`,
          ),
        )
      }

      warnSpy.mockRestore()
    })

    it('FND-REG-03: customElements.get() returns identical constructor before and after re-registration / second import', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 1. Snapshot initial customElements constructors
      const beforeMap = new Map<string, CustomElementConstructor>()
      for (const item of ALL_77_ELEMENTS) {
        const ctor = customElements.get(item.tag)
        expect(ctor).toBeDefined()
        beforeMap.set(item.tag, ctor!)
      }

      // 2. Execute duplicate registrations across all 77 custom elements
      for (const item of ALL_77_ELEMENTS) {
        const ctor = MoulUI[item.moulName] as CustomElementConstructor
        defineElement(item.tag, ctor)
      }

      // 3. Verify registry identity is invariant and matches original exports
      for (const item of ALL_77_ELEMENTS) {
        const afterCtor = customElements.get(item.tag)
        expect(afterCtor).toBe(beforeMap.get(item.tag))
        expect(afterCtor).toBe(MoulUI[item.moulName])
      }

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('FND-REG-04: survives high-frequency repeated registration barrage without state drift', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const targetTag = 'moul-button'
      const targetCtor = MoulUI.MoulButton as CustomElementConstructor

      // Rapid barrage of 10 duplicate registrations
      for (let i = 0; i < 10; i++) {
        expect(() => defineElement(targetTag, targetCtor)).not.toThrow()
      }

      expect(warnSpy).toHaveBeenCalledTimes(10)
      expect(customElements.get(targetTag)).toBe(targetCtor)

      warnSpy.mockRestore()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Tag Map Parity & DOM Instantiation (Requirement R1, R3)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Dimension 4: DOM Instantiation & HTMLElementTagNameMap Parity', () => {
    it('FND-TAG-01: document.createElement() creates valid instances for all 77 custom elements', () => {
      for (const item of ALL_77_ELEMENTS) {
        const el = document.createElement(item.tag)
        const expectedCtor = MoulUI[item.moulName] as new () => HTMLElement

        expect(
          el,
          `document.createElement('${item.tag}') did not return an instance of ${String(item.moulName)}`,
        ).toBeInstanceOf(expectedCtor)

        expect(el.tagName.toLowerCase()).toBe(item.tag)
        expect(el.nodeName.toLowerCase()).toBe(item.tag)
      }
    })

    it('FND-TAG-02: verifies type-level compatibility with HTMLElementTagNameMap across categories', () => {
      // Compile-time typing helper verifying HTMLElementTagNameMap mapping
      function assertTagType<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        expectedCtor: new () => HTMLElementTagNameMap[K],
      ): HTMLElementTagNameMap[K] {
        const el = document.createElement(tag)
        expect(el).toBeInstanceOf(expectedCtor)
        expect(el.tagName.toLowerCase()).toBe(tag)
        return el
      }

      // Actions Category
      assertTagType('moul-button', MoulUI.MoulButton)
      assertTagType('moul-toggle-button', MoulUI.MoulToggleButton)

      // Surfaces Category
      assertTagType('moul-card', MoulUI.MoulCard)
      assertTagType('moul-alert', MoulUI.MoulAlert)
      assertTagType('moul-badge', MoulUI.MoulBadge)

      // Overlays Category
      assertTagType('moul-modal', MoulUI.MoulModal)
      assertTagType('moul-popover', MoulUI.MoulPopover)
      assertTagType('moul-breadcrumbs', MoulUI.MoulBreadcrumbs)

      // Forms Category
      assertTagType('moul-text-field', MoulUI.MoulTextField)
      assertTagType('moul-checkbox', MoulUI.MoulCheckbox)
      assertTagType('moul-select', MoulUI.MoulSelect)

      // Charts Category
      assertTagType('moul-chart-container', MoulUI.MoulChartContainer)
      assertTagType('moul-line-chart', MoulUI.MoulLineChart)
      assertTagType('moul-stat', MoulUI.MoulStat)

      // Blocks Category
      assertTagType('moul-logs', MoulUI.MoulLogs)
      assertTagType('moul-logs-viewer', MoulUI.MoulLogsViewer)
      assertTagType('moul-sidebar', MoulUI.MoulSidebar)
    })

    it('FND-TAG-03: elements connect, update, and disconnect safely in the live DOM', async () => {
      const tagsToMount: (keyof HTMLElementTagNameMap)[] = [
        'moul-button',
        'moul-badge',
        'moul-separator',
        'moul-card',
        'moul-sidebar',
      ]

      for (const tag of tagsToMount) {
        const el = document.createElement(tag) as LitElement
        expect(el.isConnected).toBe(false)

        document.body.appendChild(el)
        expect(el.isConnected).toBe(true)

        if ('updateComplete' in el && el.updateComplete) {
          await el.updateComplete
        }

        document.body.removeChild(el)
        expect(el.isConnected).toBe(false)
      }
    })
  })
})
```

---

## 5. Verification Method

To independently verify this test suite design:

1. **Verify Source Code and Counts**:
   ```bash
   bun -e "
   const fs = require('fs');
   const content = fs.readFileSync('.agents/teamwork/explorer_phase10_m3_2/proposed_Foundation.test.ts', 'utf-8');
   const tags = [...content.matchAll(/tag:\s*'([^']+)'/g)].map(m => m[1]);
   const primary = [...content.matchAll(/isPrimary:\s*true/g)];
   const companion = [...content.matchAll(/isPrimary:\s*false/g)];
   console.log('Total tags:', tags.length, 'Unique:', new Set(tags).size);
   console.log('Primary components:', primary.length);
   console.log('Companion elements:', companion.length);
   "
   ```
   *Expected Outcome*: `Total tags: 77 Unique: 77`, `Primary components: 54`, `Companion elements: 23`.

2. **Verify Biome Format Compliance**:
   ```bash
   bunx @biomejs/biome format --stdin-file-path ui/src/components/Foundation.test.ts < .agents/teamwork/explorer_phase10_m3_2/proposed_Foundation.test.ts > /dev/null
   ```
   *Expected Outcome*: Exit code 0 with clean formatting.

3. **Verify Implementation by Worker**:
   When `worker_phase10_m3_1` writes this content to `ui/src/components/Foundation.test.ts`:
   ```bash
   bun --cwd ui vitest run src/components/Foundation.test.ts
   ```
   *Expected Outcome*: All 15 tests pass with 100% success rate across all 4 dimensions.
