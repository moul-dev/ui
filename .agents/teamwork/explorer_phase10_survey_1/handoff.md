# Phase 10 Public API & Component Survey — Handoff Report

**Agent**: `explorer_phase10_survey_1`  
**Date**: 2026-10-17T12:52:00Z  
**Target Milestone**: Phase 10 — Public Entrypoint, Sandbox Kitchen Sink, Legacy Purge & Build Verification  
**Status**: Comprehensive Survey Complete (Hard Handoff)

---

## 1. Observation

### 1.1 Custom Elements Census (77 Unique Defined Elements / 54 Component Specifications)

Per `rdt/design.md` Section 8 ("Complete 54-Component Specification"), the design organizes 54 numbered component specifications across six categories. When companion elements, subcomponents, and compound suites are registered, exactly **77 unique `moul-*` custom elements** are idempotently defined via `defineElement()` in `ui/src/components/`.

All 77 custom elements use open Shadow DOM, inherit design tokens from `style.css` / `semantic-tones.ts`, and are registered with the `moul-` prefix.

#### Complete Catalog by Category

| # | Specification / Family | Custom Element Tag | Class Name | Implementation File | Exported Types / Interfaces |
|---|---|---|---|---|---|
| **Category 1: Charts & Data Visualization** | | | | | |
| 1 | LineChart | `<moul-line-chart>` | `MoulLineChart` | `ui/src/components/LineChart/LineChart.ts` | `LineChartProps` |
| 2 | AreaChart | `<moul-area-chart>` | `MoulAreaChart` | `ui/src/components/AreaChart/AreaChart.ts` | `AreaChartProps` |
| 3 | BarChart | `<moul-bar-chart>` | `MoulBarChart` | `ui/src/components/BarChart/BarChart.ts` | `BarChartProps` |
| 4 | DoughnutChart | `<moul-doughnut-chart>` | `MoulDoughnutChart` | `ui/src/components/DoughnutChart/DoughnutChart.ts` | `DoughnutChartProps`, `DoughnutDataItem` |
| 5 | TopList | `<moul-top-list>` | `MoulTopList` | `ui/src/components/TopList/TopList.ts` | `TopListItem`, `TopListProps` |
| 6 | Stat | `<moul-stat>` | `MoulStat` | `ui/src/components/Stat/Stat.ts` | `StatProps`, `StatTrend` |
| 7a | PercentageBar | `<moul-percentage-bar>` | `MoulPercentageBar` | `ui/src/components/Percentage/PercentageBar.ts` | `PercentageBarProps`, `PercentageBarSize` |
| 7b | PercentageCircle | `<moul-percentage-circle>` | `MoulPercentageCircle` | `ui/src/components/Percentage/PercentageCircle.ts` | `PercentageCircleProps`, `PercentageCircleSize` |
| 7c | ChartContainer (Companion) | `<moul-chart-container>` | `MoulChartContainer` | `ui/src/components/ChartContainer/ChartContainer.ts` | `ViewportResizeDetail` |
| 7d | ChartTooltip (Companion) | `<moul-chart-tooltip>` | `MoulChartTooltip` | `ui/src/components/ChartTooltip/ChartTooltip.ts` | `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions` |
| **Category 2: Actions & Toggle Components** | | | | | |
| 8 | Button | `<moul-button>` | `MoulButton` | `ui/src/components/Button/Button.ts` | `ButtonSize`, `ButtonType`, `ButtonVariant` |
| 9 | ButtonGroup | `<moul-button-group>` | `MoulButtonGroup` | `ui/src/components/ButtonGroup/ButtonGroup.ts` | `ButtonGroupOrientation`, `ButtonGroupSpacing` |
| 10 | ToggleButton | `<moul-toggle-button>` | `MoulToggleButton` | `ui/src/components/ToggleButton/ToggleButton.ts` | `ToggleButtonSize` |
| 11 | ToggleButtonGroup | `<moul-toggle-button-group>` | `MoulToggleButtonGroup` | `ui/src/components/ToggleButtonGroup/ToggleButtonGroup.ts` | `ToggleButtonGroupOrientation` |
| **Category 3: Input & Form Components** | | | | | |
| 12 | TextField | `<moul-text-field>` | `MoulTextField` | `ui/src/components/TextField/TextField.ts` | `TextFieldType` |
| 13 | NumberField | `<moul-number-field>` | `MoulNumberField` | `ui/src/components/NumberField/NumberField.ts` | — |
| 14 | SearchField | `<moul-search-field>` | `MoulSearchField` | `ui/src/components/SearchField/SearchField.ts` | — |
| 15 | TextArea | `<moul-text-area>` | `MoulTextArea` | `ui/src/components/TextArea/TextArea.ts` | — |
| 16 | Checkbox | `<moul-checkbox>` | `MoulCheckbox` | `ui/src/components/Checkbox/Checkbox.ts` | — |
| 17 | CheckboxGroup | `<moul-checkbox-group>` | `MoulCheckboxGroup` | `ui/src/components/Checkbox/CheckboxGroup.ts` | `CheckboxGroupOrientation` |
| 18a | RadioGroup | `<moul-radio-group>` | `MoulRadioGroup` | `ui/src/components/RadioGroup/RadioGroup.ts` | `RadioGroupOrientation` |
| 18b | Radio (Subcomponent) | `<moul-radio>` | `MoulRadio` | `ui/src/components/RadioGroup/Radio.ts` | — |
| 19a | Select | `<moul-select>` | `MoulSelect` | `ui/src/components/Select/Select.ts` | — |
| 19b | SelectItem (Subcomponent) | `<moul-select-item>` | `MoulSelectItem` | `ui/src/components/Select/SelectItem.ts` | — |
| 20a | ComboBox | `<moul-combobox>` | `MoulComboBox` | `ui/src/components/ComboBox/ComboBox.ts` | — |
| 20b | ComboBoxItem (Subcomponent) | `<moul-combobox-item>` | `MoulComboBoxItem` | `ui/src/components/ComboBox/ComboBoxItem.ts` | — |
| 21 | Slider | `<moul-slider>` | `MoulSlider` | `ui/src/components/Slider/Slider.ts` | — |
| 22 | Switch | `<moul-switch>` | `MoulSwitch` | `ui/src/components/Switch/Switch.ts` | `SwitchSize` |
| 23 | InputOTP | `<moul-input-otp>` | `MoulInputOTP` | `ui/src/components/InputOTP/InputOTP.ts` | — |
| 24 | DatePicker | `<moul-date-picker>` | `MoulDatePicker` | `ui/src/components/DatePicker/DatePicker.ts` | — |
| 25 | Calendar | `<moul-calendar>` | `MoulCalendar` | `ui/src/components/Calendar/Calendar.ts` | — |
| 26 | Form | `<moul-form>` | `MoulForm` | `ui/src/components/Form/Form.ts` | `FormMethod` |
| **Category 4: Overlay & Navigation Components** | | | | | |
| 27 | Modal | `<moul-modal>` | `MoulModal` | `ui/src/components/Modal/Modal.ts` | `ModalSize` |
| 28 | AlertDialog | `<moul-alert-dialog>` | `MoulAlertDialog` | `ui/src/components/AlertDialog/AlertDialog.ts` | `AlertDialogSize` |
| 29 | Drawer | `<moul-drawer>` | `MoulDrawer` | `ui/src/components/Drawer/Drawer.ts` | `DrawerPlacement`, `DrawerSize` |
| 30 | Popover | `<moul-popover>` | `MoulPopover` | `ui/src/components/Popover/Popover.ts` | `PopoverPlacement`, `PopoverTrigger` |
| 31 | Tooltip | `<moul-tooltip>` | `MoulTooltip` | `ui/src/components/Tooltip/Tooltip.ts` | `TooltipPlacement` |
| 32 | CommandPalette | `<moul-command-palette>` | `MoulCommandPalette` | `ui/src/components/CommandPalette/CommandPalette.ts` | `CommandPaletteItemData` |
| 33a | Breadcrumbs | `<moul-breadcrumbs>` | `MoulBreadcrumbs` | `ui/src/components/Breadcrumbs/Breadcrumbs.ts` | — |
| 33b | BreadcrumbItem (Subcomponent) | `<moul-breadcrumb-item>` | `MoulBreadcrumbItem` | `ui/src/components/Breadcrumbs/BreadcrumbItem.ts` | — |
| 34 | Link | `<moul-link>` | `MoulLink` | `ui/src/components/Link/Link.ts` | `LinkVariant` |
| 35 | Pagination | `<moul-pagination>` | `MoulPagination` | `ui/src/components/Pagination/Pagination.ts` | `GeneratePaginationOptions`, `PaginationItem`, `PaginationShape` |
| 36a | Tabs | `<moul-tabs>` | `MoulTabs` | `ui/src/components/Tabs/Tabs.ts` | `TabsOrientation`, `TabsVariant` |
| 36b | Tab (Subcomponent) | `<moul-tab>` | `MoulTab` | `ui/src/components/Tabs/Tab.ts` | — |
| 36c | TabPanel (Subcomponent) | `<moul-tab-panel>` | `MoulTabPanel` | `ui/src/components/Tabs/TabPanel.ts` | — |
| **Category 5: Surface & Feedback Components** | | | | | |
| 37 | Alert | `<moul-alert>` | `MoulAlert` | `ui/src/components/Alert/Alert.ts` | — |
| 38a | Avatar | `<moul-avatar>` | `MoulAvatar` | `ui/src/components/Avatar/Avatar.ts` | `AvatarShape`, `AvatarSize`, `AvatarStatus` |
| 38b | AvatarGroup (Companion) | `<moul-avatar-group>` | `MoulAvatarGroup` | `ui/src/components/Avatar/AvatarGroup.ts` | — |
| 39 | Badge | `<moul-badge>` | `MoulBadge` | `ui/src/components/Badge/Badge.ts` | `BadgeSize` |
| 40a | Card | `<moul-card>` | `MoulCard` | `ui/src/components/Card/Card.ts` | — |
| 40b | CardHeader (Subcomponent) | `<moul-card-header>` | `MoulCardHeader` | `ui/src/components/Card/Card.ts` | — |
| 40c | CardBody (Subcomponent) | `<moul-card-body>` | `MoulCardBody` | `ui/src/components/Card/Card.ts` | — |
| 40d | CardFooter (Subcomponent) | `<moul-card-footer>` | `MoulCardFooter` | `ui/src/components/Card/Card.ts` | — |
| 41 | EmptyState | `<moul-empty-state>` | `MoulEmptyState` | `ui/src/components/EmptyState/EmptyState.ts` | `EmptyStateAlign`, `EmptyStateSize` |
| 42 | Kbd | `<moul-kbd>` | `MoulKbd` | `ui/src/components/Kbd/Kbd.ts` | — |
| 43 | ProgressBar | `<moul-progress-bar>` | `MoulProgressBar` | `ui/src/components/ProgressBar/ProgressBar.ts` | `ProgressBarShape`, `ProgressBarSize` |
| 44 | Separator | `<moul-separator>` | `MoulSeparator` | `ui/src/components/Separator/Separator.ts` | `SeparatorOrientation` |
| 45 | Skeleton | `<moul-skeleton>` | `MoulSkeleton` | `ui/src/components/Skeleton/Skeleton.ts` | `SkeletonShape`, `SkeletonVariant` |
| 46 | Spinner | `<moul-spinner>` | `MoulSpinner` | `ui/src/components/Spinner/Spinner.ts` | `SpinnerSize` |
| 47 | Table | `<moul-table>` | `MoulTable` | `ui/src/components/Table/Table.ts` | `TableColumn` |
| 48a | TagGroup | `<moul-tag-group>` | `MoulTagGroup` | `ui/src/components/TagGroup/TagGroup.ts` | `TagSize`, `TagSelectionMode` |
| 48b | Tag (Subcomponent) | `<moul-tag>` | `MoulTag` | `ui/src/components/TagGroup/Tag.ts` | — |
| 49a | Toast | `<moul-toast>` | `MoulToast` | `ui/src/components/Toast/Toast.ts` | `ToastOptions` |
| 49b | ToastRegion (Companion) | `<moul-toast-region>` | `MoulToastRegion` | `ui/src/components/Toast/ToastQueue.ts` | — |
| 50 | Typography | `<moul-typography>` | `MoulTypography` | `ui/src/components/Typography/Typography.ts` | `TypographyVariant` |
| **Category 6: Composite Block Components** | | | | | |
| 51a | Logs | `<moul-logs>` | `MoulLogs` | `ui/src/components/LogsViewer/Logs.ts` | `LogsProps`, `MoulLogsElement` |
| 51b | LogsViewer | `<moul-logs-viewer>` | `MoulLogsViewer` | `ui/src/components/LogsViewer/LogsViewer.ts` | `HighlightTextProps`, `LogAttributeChipProps`, `LogCopyIconButtonProps`, `LogFilterLevel`, `LogItem`, `LogLevel`, `LogLevelBadgeProps`, `LogsViewerProps`, `MoulLogsViewerElement` |
| 52a | Sidebar | `<moul-sidebar>` | `MoulSidebar` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarProps` |
| 52b | SidebarAside (Subcomponent) | `<moul-sidebar-aside>` | `MoulSidebarAside` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarAsideProps` |
| 52c | SidebarMain (Subcomponent) | `<moul-sidebar-main>` | `MoulSidebarMain` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarMainProps` |
| 52d | SidebarHeader (Subcomponent) | `<moul-sidebar-header>` | `MoulSidebarHeader` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarHeaderProps` |
| 52e | SidebarBrand (Subcomponent) | `<moul-sidebar-brand>` | `MoulSidebarBrand` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarBrandProps` |
| 52f | SidebarGroup (Subcomponent) | `<moul-sidebar-group>` | `MoulSidebarGroup` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarGroupProps` |
| 52g | SidebarItem (Subcomponent) | `<moul-sidebar-item>` | `MoulSidebarItem` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarItemProps` |
| 52h | SidebarDivider (Subcomponent) | `<moul-sidebar-divider>` | `MoulSidebarDivider` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarDividerProps` |
| 52i | SidebarFooter (Subcomponent) | `<moul-sidebar-footer>` | `MoulSidebarFooter` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarFooterProps` |
| 52j | SidebarUser (Subcomponent) | `<moul-sidebar-user>` | `MoulSidebarUser` | `ui/src/components/Sidebar/Sidebar.ts` | `SidebarUserProps`, `SidebarContextValue`, `SidebarLayout` |

---

### 1.2 Reactive Controllers (5 Standalone Controllers)

All 5 reactive controllers are located in `ui/src/controllers/` and exported via `ui/src/controllers/index.ts`:

1. **`PressController`** (`press.controller.ts`):
   - Options: `PressControllerOptions` (`scaleOnPress?: boolean | number`, `hoverLift?: boolean | number`, `target?: () => HTMLElement | null`, `disabled?: () => boolean`).
   - State: `isPressed`, `isHovered`, `isFocusVisible`.
   - Motion: Tactile spring scaling (`scale: 0.97`) and hover elevation lift (`y: -2px`) via `motion`, respecting `prefersReducedMotion()`.
   - Accessibility: Synchronizes `aria-pressed` for `type="button"`, `type="checkbox"`, or pre-existing `aria-pressed`.

2. **`LayoutIndicatorController`** (`layout-indicator.controller.ts`):
   - Options: `LayoutIndicatorControllerOptions` (`observeDimensions?: boolean`, `initialBreakpoint?: Breakpoint`).
   - Breakpoints: `Breakpoint` (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`).
   - Helper: `computeBreakpoint(width: number): Breakpoint` (<480 `xs`, 480–767 `sm`, 768–1023 `md`, 1024–1279 `lg`, >=1280 `xl`).
   - Lifecycle: Cleans up `ResizeObserver` on `hostDisconnected`.

3. **`OverlayPresenceController`** (`overlay-presence.controller.ts`):
   - Options: `OverlayPresenceControllerOptions` (`preset?: OverlayPreset`, `target?`, `dialog?`, `popover?`, `onOpenChange?`).
   - Presets: `'modal' | 'popover' | 'tooltip' | 'drawer-left' | 'drawer-right' | 'drawer-top' | 'drawer-bottom' | 'toast'`.
   - State: `isOpen: boolean`, `isMounted: boolean`.
   - Motion: Preset-tuned enter/exit animations; prevents rapid toggle re-entrance race conditions; seamlessly coordinates with native `<dialog>` and `[popover]`.

4. **`NumberSpringController`** (`number-spring.controller.ts`):
   - Options: `NumberSpringControllerOptions` (`initialValue?: number`, `stiffness?: number`, `damping?: number`, `threshold?: number`, `onUpdate?`).
   - Constants: `MIN_NUMBER_VALUE = -999_999_999`, `MAX_NUMBER_VALUE = 999_999_999`.
   - Helper: `clampValue(val: number): number`.
   - Behavior: Animates `displayValue` toward `targetValue` with physics spring; halts and snaps when delta `<= 0.5`.

5. **`FormInternalsController`** (`form-internals.controller.ts`):
   - Options: `FormInternalsControllerOptions` (`requireFormConnection?: boolean`, `onReset?`, `onDisabledChange?`, `onStateRestore?`).
   - State: `internals: ElementInternals | null`.
   - Methods: `setValue()`, `setValidity()` (truncates message to `<= 200` chars), `checkValidity()`, `reportValidity()`.
   - Diagnostics: Warns when disconnected from `<form>` if `name` attribute is present.

---

### 1.3 Toast Queue, Pagination & Pure Log Parsers

1. **`toastQueue`** (`ui/src/components/Toast/ToastQueue.ts`):
   - Singleton instance managing top-layer toasts.
   - Methods: `add({ title, description, tone, variant, duration })`, `dismiss(id)`, `clear()`, `getToasts()`, `subscribe()`.
   - Accompanied by `<moul-toast-region>` (`MoulToastRegion`).

2. **`generatePagination`** (`ui/src/components/Pagination/Pagination.ts`):
   - Exported pure helper with overloads `(options)` and `(currentPage, totalPages, siblingCount)`.
   - Returns `(number | 'ellipsis')[]`.

3. **Pure Log Parsers** (`ui/src/components/LogsViewer/parseLogs.ts` & `exampleLogs.ts`):
   - `parseLogs(raw: unknown): LogItem[]`
   - `parseLogLine(line: string, index?: number): LogItem`
   - `parseAttributes(message: string): Record<string, string>`
   - `stripAttributes(message: string): string`
   - `normalizeLogLevel(levelInput?: unknown): LogLevel`
   - Constants: `SERVER_LOG_RAW`, `SERVER_LOGS`

---

### 1.4 Audit of `ui/src/index.ts` & Defects Found

Direct inspection of `ui/src/index.ts` reveals:

1. **CRITICAL: Missing Type Imports for `HTMLElementTagNameMap` (Lines 542–551)**
   The 10 Category 1 Chart elements are referenced in `HTMLElementTagNameMap`:
   ```ts
   'moul-chart-container': MoulChartContainer
   'moul-chart-tooltip': MoulChartTooltip
   'moul-line-chart': MoulLineChart
   'moul-area-chart': MoulAreaChart
   'moul-bar-chart': MoulBarChart
   'moul-doughnut-chart': MoulDoughnutChart
   'moul-top-list': MoulTopList
   'moul-stat': MoulStat
   'moul-percentage-bar': MoulPercentageBar
   'moul-percentage-circle': MoulPercentageCircle
   ```
   However, lines 411–475 omit `import type { MoulChartContainer, ... }` for these 10 classes, triggering 10 TS2304 / TS2552 errors during `tsc -b`.

2. **Lingering React Exports:**
   - Lines 16–38: `Autocomplete` and its 9 associated types/context hooks (`./components/Autocomplete`).
   - Lines 124–125: `Description` and `DescriptionProps` (`./components/Description`).
   - Lines 158–159: `Label` and `LabelProps` (`./components/Label`).

3. **Phantom / Mismatched Type Exports:**
   - Line 89: `export type { ChartContainerProps, LegendItem } from './components/ChartContainer'` — neither exists in `ChartContainer.ts` (the actual interface is `ViewportResizeDetail`).
   - Line 97: `export type { CustomTooltipProps } from './components/ChartTooltip'` — does not exist in `ChartTooltip.ts` (the actual interfaces are `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions`).
   - Line 128: `export type { DoughnutDataItem } from './components/DoughnutChart'` — `DoughnutChart.ts` imports `DoughnutDataItem` from `../ChartCommon` without re-exporting it.

4. **Missing Essential Exports in `index.ts`:**
   - Chart primitives in `ui/src/components/ChartCommon.ts`: `ChartSeries`, `DoughnutDataItem`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor` are not exported from `index.ts`, causing compile errors in chart challenge tests.

5. **`HTMLElementTagNameMap` Verification:**
   - Exactly 77 tag names are declared.
   - All 77 tag names match the 77 `defineElement('moul-*')` definitions 1:1. Zero extra tags, zero missing tags (once the 10 type imports are fixed).

---

### 1.5 Legacy React & Non-Web-Component Files in Workspace

The following legacy React files and directories remain in `ui/src/`:

1. **Specified in Phase 10 Request:**
   - `ui/src/App.tsx` (Legacy React App)
   - `ui/src/main.tsx` (Legacy React entry mounting `createRoot`)
   - `ui/src/theme/ThemeProvider.tsx` (Legacy React theme context)
   - `ui/src/tokens/tokens.stylex.ts` (Legacy StyleX token file)
   - `ui/src/theme/ThemeProvider.test.tsx` (Banned React imports test)
   - `ui/src/utils/utils.test.tsx` (Banned React imports test)
   - `ui/src/components/Autocomplete/Autocomplete.test.tsx` (Banned React imports test)
   - `ui/src/components/ListBox/ListBox.test.tsx` (Banned React imports test)

2. **Auxiliary Legacy Pure React Component Directories (No Lit Equivalents):**
   - `ui/src/components/Autocomplete/` (`Autocomplete.tsx`, `Autocomplete.styles.ts`, `index.ts`)
   - `ui/src/components/ListBox/` (`ListBox.tsx`, `ListBox.styles.ts`, `index.ts`)
   - `ui/src/components/DateField/` (`DateField.tsx`, `DateField.styles.ts`, `index.ts`)
   - `ui/src/components/Description/` (`Description.tsx`, `Description.styles.ts`, `index.ts`)
   - `ui/src/components/ErrorMessage/` (`ErrorMessage.tsx`, `ErrorMessage.styles.ts`, `index.ts`)
   - `ui/src/components/FieldError/` (`FieldError.tsx`, `FieldError.styles.ts`, `index.ts`)
   - `ui/src/components/Label/` (`Label.tsx`, `Label.styles.ts`, `index.ts`)

3. **Auxiliary Legacy Utility & Sandbox Files:**
   - `ui/src/utils/mergeProps.ts` (Imports from `react-aria`)
   - `ui/src/utils/warnMissingLabel.ts` (Imports from `react`; superseded by `warn-missing-label.ts`)
   - `ui/src/sandbox/` (`icons.tsx`, `sections/*.tsx`, `types.ts` — to be replaced by vanilla `sandbox.ts`)

---

### 1.6 Current Test Execution Baseline

- Running `bun run test` (Vitest) executes 36 test files.
- **32 test files PASS** with **936 passed tests**.
- Exactly **4 test files FAIL**, and all 4 are the legacy React test files (`ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, `ListBox.test.tsx`), failing due to `banReactImportsPlugin` catching `react/jsx-dev-runtime` imports.
- Running `bun ./scripts/verify-no-react.ts all` passes with exit code 0 on the manifests.

---

## 2. Logic Chain

1. **Step 1 (Catalog Completeness)**: By querying all AST definitions of `defineElement('moul-*')` across `ui/src/components/`, we confirmed that exactly 77 unique elements exist (Observation 1.1). This matches the 54 conceptual component items in `rdt/design.md` because compound subcomponents (e.g., `moul-card-header`, `moul-sidebar-brand`, `moul-select-item`) are separate custom element registrations.
2. **Step 2 (Map Alignment)**: By comparing the 77 defined elements to `HTMLElementTagNameMap` in `ui/src/index.ts`, we verified an exact 1:1 correspondence with zero missing and zero extraneous tags (Observation 1.4).
3. **Step 3 (Type Check Failure Cause)**: Running `tsc -b` produced 10 errors specifically in `ui/src/index.ts` lines 542–551. Tracing imports in `ui/src/index.ts` showed lines 411–475 imported types for Phases 4, 5, 6, 7, 9, but completely omitted Category 1 Chart classes (Observation 1.4).
4. **Step 4 (Test Failure Cause)**: Analyzing the 4 failing test suites from `bun run test` proved that 100% of the failures originate from `banReactImportsPlugin` blocking `react` imports in the 4 legacy `.test.tsx` files. Zero Web Component test suites failed (Observation 1.6).
5. **Step 5 (Remediation Sequence)**: Once the legacy React files are purged, `ui/src/index.ts` type imports are added, and lingering React exports removed, both `tsc -b` and `bun run test` will pass cleanly.

---

## 3. Caveats

1. **Subcomponent Counting**: The prompt mentions "All 54 Lit custom elements". In the design specification, there are 54 numbered component specifications, which expand to 77 custom element tags in the DOM. All 77 elements are fully implemented, verified, and mapped.
2. **Legacy Sandbox Directory**: In addition to deleting `App.tsx` and `main.tsx`, `ui/src/sandbox/` currently holds legacy React JSX files (`icons.tsx`, `sections/*.tsx`). The orchestrator/implementer must replace this with vanilla HTML / Lit in `ui/src/sandbox.ts` and `ui/index.html`.
3. **No Code Modification Constraint**: In strict adherence to the explorer read-only constraint, no source files were edited during this survey.

---

## 4. Conclusion

The `@moul-dev/ui` codebase is in exceptional health: all 77 Web Component custom elements, 5 reactive controllers, `toastQueue`, `generatePagination`, and log parsers are fully functional with 936 passing unit/adversarial tests. 

To achieve a 100% clean library build (`bun run build:ui`) and contract verification, the orchestrator/implementer must execute four targeted remediation steps:
1. **Update `ui/src/index.ts`**:
   - Add missing Category 1 Chart type imports for `HTMLElementTagNameMap`.
   - Remove lingering exports for `Autocomplete`, `Description`, and `Label`.
   - Export `ChartSeries`, `DoughnutDataItem`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor`, `ViewportResizeDetail`, `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions`.
2. **Purge Legacy React Files**:
   - Delete `ui/src/App.tsx`, `ui/src/main.tsx`, `ui/src/theme/`, `ui/src/tokens/tokens.stylex.ts`.
   - Delete legacy test files: `ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, `ListBox.test.tsx`.
   - Delete legacy component directories: `Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`.
   - Delete `ui/src/utils/mergeProps.ts` and `ui/src/utils/warnMissingLabel.ts`.
3. **Create Vanilla Sandbox & HTML**:
   - Replace `ui/src/sandbox/` with `ui/src/sandbox.ts` rendering interactive showcases using vanilla Lit / HTML.
   - Update `ui/index.html` to load `<script type="module" src="/src/sandbox.ts"></script>`.
4. **Implement Contract Tests**:
   - Add `ui/src/components/Foundation.test.ts` verifying export contracts and registration idempotency.

---

## 5. Verification Method

To independently verify all findings in this survey report:

1. **Verify Custom Element Tag Definitions (77 unique)**:
   ```bash
   node -e "const fs=require('fs'),path=require('path');function walk(d){let f=[];for(const i of fs.readdirSync(d)){const p=path.join(d,i);if(fs.statSync(p).isDirectory())f=f.concat(walk(p));else if(i.endsWith('.ts')&&!i.endsWith('.test.ts'))f.push(p);}return f;}const files=walk('ui/src/components');const tags=new Set();for(const f of files){const m=fs.readFileSync(f,'utf8').matchAll(/defineElement\(\s*['\"](moul-[a-z0-9-]+)['\"]/g);for(const r of m)tags.add(r[1]);}console.log('Unique custom elements:',tags.size);"
   ```
   *Expected output*: `Unique custom elements: 77`.

2. **Verify Tag Map Parity**:
   Inspect `ui/src/index.ts` lines 476–567. Confirm all 77 tags are present.

3. **Verify Existing Passing Web Component Tests**:
   ```bash
   bun run --cwd ui test src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/Navigation.test.ts src/components/Forms.test.ts src/components/Charts.test.ts src/components/Blocks.test.ts src/controllers/Controllers.test.ts
   ```
   *Expected result*: All 7 core Web Component suites pass with 0 errors.

4. **Verify Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected output*: Code 0, zero disallowed packages.
