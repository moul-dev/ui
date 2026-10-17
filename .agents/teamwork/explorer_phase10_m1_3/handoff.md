# Milestone 1 Synthesis & Export Verification — Handoff Report

**Agent**: `explorer_phase10_m1_3`  
**Date**: 2026-10-17T13:07:00Z  
**Target Milestone**: Phase 10 — Milestone 1: Public Entry Point (`ui/src/index.ts`) & Tag Map Augmentation  
**Parent Orchestrator**: `dae9e90c-c048-4fc8-8e06-169a5a42bbad`  
**Status**: Hard Handoff (Investigation & Synthesis Complete)

---

## 1. Observation

### 1.1 Reactive Controllers Verification (`ui/src/controllers/`)
Direct inspection of `ui/src/controllers/index.ts` lines 12–38 confirms all 5 reactive controllers and their option/state types are implemented and exported:
1. **`PressController`** (`press.controller.ts`):
   - Exports: `PressController`, `type PressControllerOptions`.
   - State properties on instance: `isPressed: boolean`, `isHovered: boolean`, `isFocusVisible: boolean`.
2. **`LayoutIndicatorController`** (`layout-indicator.controller.ts`):
   - Exports: `LayoutIndicatorController`, `type LayoutIndicatorControllerOptions`, `type Breakpoint` (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`), `computeBreakpoint(width: number): Breakpoint`.
   - State properties on instance: `breakpoint: Breakpoint`, `width: number`, `height: number`.
3. **`OverlayPresenceController`** (`overlay-presence.controller.ts`):
   - Exports: `OverlayPresenceController`, `type OverlayPresenceControllerOptions`, `type OverlayPreset` (`'modal' | 'popover' | 'tooltip' | 'drawer-left' | 'drawer-right' | 'drawer-top' | 'drawer-bottom' | 'toast'`).
   - State properties on instance: `isOpen: boolean`, `isMounted: boolean`.
4. **`NumberSpringController`** (`number-spring.controller.ts`):
   - Exports: `NumberSpringController`, `type NumberSpringControllerOptions`, `clampValue(val: number): number`, `MIN_NUMBER_VALUE = -999_999_999`, `MAX_NUMBER_VALUE = 999_999_999`.
   - State properties on instance: `targetValue: number`, `displayValue: number`.
5. **`FormInternalsController`** (`form-internals.controller.ts`):
   - Exports: `FormInternalsController`, `type FormInternalsControllerOptions`.
   - State properties on instance: `internals: ElementInternals | null`.

### 1.2 Toast Queue, Pagination & Pure Log Parsers
Direct inspection confirms:
1. **`toastQueue`** (`ui/src/components/Toast/ToastQueue.ts:131` & `ui/src/components/Toast/index.ts:1-7`):
   - Singleton instance `toastQueue = new ToastQueueManager()` is re-exported via `ui/src/components/Toast/index.ts`.
   - Companion elements and types exported: `MoulToast`, `Toast`, `MoulToastRegion`, `ToastRegion`, `type ToastOptions`.
2. **`generatePagination`** (`ui/src/components/Pagination/Pagination.ts:46` & `ui/src/components/Pagination/index.ts:1-8`):
   - Pure pagination generator `generatePagination` is exported alongside `type GeneratePaginationOptions`, `type PaginationItem`, `type PaginationShape`, `MoulPagination`, and `Pagination`.
3. **Pure Log Parsers & Constants** (`ui/src/components/LogsViewer/parseLogs.ts`, `exampleLogs.ts`, `LogsViewer.ts`):
   - Parsers: `normalizeLogLevel`, `parseAttributes`, `parseLogLine`, `parseLogs`, `stripAttributes`.
   - Constants: `SERVER_LOG_RAW`, `SERVER_LOGS`.
   - Template helpers: `HighlightText`, `LogAttributeChip`, `LogCopyIconButton`, `LogLevelBadge`.
   - Elements & types: `MoulLogs`, `Logs`, `MoulLogsViewer`, `LogsViewer`, `MoulLogsElement`, `MoulLogsViewerElement`, `HighlightTextProps`, `LogAttributeChipProps`, `LogCopyIconButtonProps`, `LogFilterLevel`, `LogItem`, `LogLevel`, `LogLevelBadgeProps`, `LogsProps`, `LogsViewerProps`.

### 1.3 Chart Utilities & Types (`ui/src/components/ChartCommon.ts`)
Direct inspection of `ui/src/components/ChartCommon.ts` lines 1–46 confirms:
- Types: `interface ChartSeries`, `interface DoughnutDataItem`, `interface TopListItem`, `interface PointHoverDetail`.
- Constants: `CHART_COLORS = ['var(--color-chart-1)', ... 'var(--color-chart-8)'] as const`.
- Helpers: `getChartColor(index: number): string`.

In the current `ui/src/index.ts`, `./components/ChartCommon` is **not exported at all**. Adding `export type { ChartSeries, DoughnutDataItem, PointHoverDetail } from './components/ChartCommon'` and `export { CHART_COLORS, getChartColor } from './components/ChartCommon'` satisfies Requirement R1.

### 1.4 Mismatched / Phantom Types in Existing Component Index Files
1. **`ui/src/components/ChartContainer/index.ts`**:
   - Current line 1: `export type { ChartContainerProps, LegendItem } from './ChartContainer'`
   - `ChartContainer.ts` actual interface: `ViewportResizeDetail` (no `ChartContainerProps` or `LegendItem` exists).
2. **`ui/src/components/ChartTooltip/index.ts`**:
   - Current line 1: `export type { CustomTooltipProps } from './ChartTooltip'`
   - `ChartTooltip.ts` actual interfaces: `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions` (no `CustomTooltipProps` exists).
3. **`ui/src/components/DoughnutChart/index.ts`**:
   - Current line 1: `export type { DoughnutChartProps, DoughnutDataItem } from './DoughnutChart'`
   - `DoughnutChart.ts` imports `DoughnutDataItem` from `../ChartCommon` without exporting it. `DoughnutChart/index.ts` must re-export `DoughnutDataItem` from `../ChartCommon`.

### 1.5 Type Import Audit for `HTMLElementTagNameMap`
Direct execution of `bun --cwd ui tsc -b` revealed 10 errors specifically in `ui/src/index.ts`:
```
src/index.ts:542:29 - error TS2304: Cannot find name 'MoulChartContainer'.
src/index.ts:543:27 - error TS2552: Cannot find name 'MoulChartTooltip'. Did you mean 'MoulTooltip'?
src/index.ts:544:24 - error TS2304: Cannot find name 'MoulLineChart'.
src/index.ts:545:24 - error TS2304: Cannot find name 'MoulAreaChart'.
src/index.ts:546:23 - error TS2304: Cannot find name 'MoulBarChart'.
src/index.ts:547:28 - error TS2304: Cannot find name 'MoulDoughnutChart'.
src/index.ts:548:22 - error TS2552: Cannot find name 'MoulTopList'. Did you mean 'MoulToast'?
src/index.ts:549:18 - error TS2552: Cannot find name 'MoulStat'. Did you mean 'MoulTab'?
src/index.ts:550:28 - error TS2304: Cannot find name 'MoulPercentageBar'.
src/index.ts:551:31 - error TS2304: Cannot find name 'MoulPercentageCircle'.
```
Lines 411–475 of `ui/src/index.ts` omit `import type` statements for these 10 Chart classes. Adding the 10 missing type imports completely resolves all errors in `ui/src/index.ts`.

### 1.6 Lingering React Exports to Delete
In `ui/src/index.ts`:
- Lines 16–38: `Autocomplete` class, components, context, hooks, and types (`./components/Autocomplete`).
- Lines 124–125: `Description` and `DescriptionProps` (`./components/Description`).
- Lines 158–159: `Label` and `LabelProps` (`./components/Label`).

---

## 2. Logic Chain

1. **Step 1 (Catalog Reconciliation)**: Synthesizing findings from `explorer_phase10_survey_1`, `explorer_phase10_m1_1`, `spec_miner_phase10_m1_2`, and our own investigation, exactly 77 custom elements exist in `ui/src/components/`, registered via `defineElement('moul-*')`.
2. **Step 2 (Map Parity)**: All 77 custom elements are present in `HTMLElementTagNameMap`. By adding the 10 missing `import type` declarations in `ui/src/index.ts`, all 77 elements are strictly typed without TS2304 errors.
3. **Step 3 (Controller & Utility Exposure)**: Re-exporting `./controllers`, `toastQueue`, `generatePagination`, all 7 log parser exports, and `./components/ChartCommon` makes the full functional surface available to consumer applications and sandboxes without deep relative imports.
4. **Step 4 (Format & Lint Cleanliness)**: Piping the synthesized `proposed_index.ts` through `bunx @biomejs/biome format --stdin-file-path=ui/src/index.ts` yielded an exact 0-byte diff, confirming perfect compliance with the workspace Biome formatting rules.
5. **Step 5 (Barrel Fixes)**: Updating the barrel files `ui/src/components/ChartContainer/index.ts`, `ui/src/components/ChartTooltip/index.ts`, and `ui/src/components/DoughnutChart/index.ts` ensures that both direct imports from `@moul-dev/ui` and sub-path imports from individual component folders resolve real TypeScript interfaces without phantom type errors.

---

## 3. Caveats

- **Scope Boundary**: Milestone 1 focuses on `ui/src/index.ts` and associated component barrel exports (`ChartContainer/index.ts`, `ChartTooltip/index.ts`, `DoughnutChart/index.ts`). Deleting legacy React `.tsx` component folders and rewriting `ui/src/sandbox.ts` / `ui/index.html` is allocated to Milestone 2.
- **Type Aliases vs Class Names**: Every custom element class is exported both as `Moul<Name>` and `<Name>` (e.g. `MoulButton`, `MoulButton as Button`) to maintain backwards compatibility while enforcing standard prefix conventions.

---

## 4. Conclusion

The complete proposed code for `ui/src/index.ts` is fully synthesized, verified, and ready for immediate implementation by the Milestone 1 Worker.

### 4.1 Synthesized Complete Source Code for `ui/src/index.ts`

```ts
// Entrypoint for @moul-dev/ui component library
export const version = '2026.10.17'

// Phase 5: Surface & Feedback Components
export { MoulAlert, MoulAlert as Alert } from './components/Alert'
export {
  type AlertDialogSize,
  MoulAlertDialog,
  MoulAlertDialog as AlertDialog,
} from './components/AlertDialog'
export type { AreaChartProps } from './components/AreaChart'
export {
  MoulAreaChart,
  MoulAreaChart as AreaChart,
} from './components/AreaChart'
export type {
  AvatarShape,
  AvatarSize,
  AvatarStatus,
} from './components/Avatar'
export {
  MoulAvatar,
  MoulAvatar as Avatar,
  MoulAvatarGroup,
  MoulAvatarGroup as AvatarGroup,
} from './components/Avatar'
export type { BadgeSize } from './components/Badge'
export { MoulBadge, MoulBadge as Badge } from './components/Badge'
export type { BarChartProps } from './components/BarChart'
export { MoulBarChart, MoulBarChart as BarChart } from './components/BarChart'
// Phase 6: Overlay & Navigation Components
export {
  MoulBreadcrumbItem,
  MoulBreadcrumbItem as BreadcrumbItem,
  MoulBreadcrumbs,
  MoulBreadcrumbs as Breadcrumbs,
} from './components/Breadcrumbs'
// Phase 4: Actions & Toggle Components
export {
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
  MoulButton,
  MoulButton as Button,
} from './components/Button'
export {
  type ButtonGroupOrientation,
  type ButtonGroupSpacing,
  MoulButtonGroup,
  MoulButtonGroup as ButtonGroup,
} from './components/ButtonGroup'
// Phase 7: Input & Form Components
export { MoulCalendar, MoulCalendar as Calendar } from './components/Calendar'
export {
  MoulCard,
  MoulCard as Card,
  MoulCardBody,
  MoulCardBody as CardBody,
  MoulCardFooter,
  MoulCardFooter as CardFooter,
  MoulCardHeader,
  MoulCardHeader as CardHeader,
} from './components/Card'
// Chart Common Primitives & Types
export type {
  ChartSeries,
  DoughnutDataItem,
  PointHoverDetail,
} from './components/ChartCommon'
export { CHART_COLORS, getChartColor } from './components/ChartCommon'
// Charts and Analytics Components
export type { ViewportResizeDetail } from './components/ChartContainer'
export {
  MoulChartContainer,
  MoulChartContainer as ChartContainer,
} from './components/ChartContainer'
export type {
  ChartTooltipPayloadEntry,
  ChartTooltipShowOptions,
} from './components/ChartTooltip'
export {
  MoulChartTooltip,
  MoulChartTooltip as ChartTooltip,
} from './components/ChartTooltip'
export {
  type CheckboxGroupOrientation,
  MoulCheckbox,
  MoulCheckbox as Checkbox,
  MoulCheckboxGroup,
  MoulCheckboxGroup as CheckboxGroup,
} from './components/Checkbox'
export {
  MoulComboBox,
  MoulComboBox as ComboBox,
  MoulComboBoxItem,
  MoulComboBoxItem as ComboBoxItem,
} from './components/ComboBox'
export {
  type CommandPaletteItemData,
  MoulCommandPalette,
  MoulCommandPalette as CommandPalette,
} from './components/CommandPalette'
export {
  MoulDatePicker,
  MoulDatePicker as DatePicker,
} from './components/DatePicker'
export type { DoughnutChartProps } from './components/DoughnutChart'
export {
  MoulDoughnutChart,
  MoulDoughnutChart as DoughnutChart,
} from './components/DoughnutChart'
export {
  type DrawerPlacement,
  type DrawerSize,
  MoulDrawer,
  MoulDrawer as Drawer,
} from './components/Drawer'
export type {
  EmptyStateAlign,
  EmptyStateSize,
} from './components/EmptyState'
export {
  MoulEmptyState,
  MoulEmptyState as EmptyState,
} from './components/EmptyState'
export {
  type FormMethod,
  MoulForm,
  MoulForm as Form,
} from './components/Form'
export {
  MoulInputOTP,
  MoulInputOTP as InputOTP,
} from './components/InputOTP'
export { MoulKbd, MoulKbd as Kbd } from './components/Kbd'
export type { LineChartProps } from './components/LineChart'
export {
  MoulLineChart,
  MoulLineChart as LineChart,
} from './components/LineChart'
export { type LinkVariant, MoulLink, MoulLink as Link } from './components/Link'
// Phase 9: Composite Block Components
export type {
  HighlightTextProps,
  LogAttributeChipProps,
  LogCopyIconButtonProps,
  LogFilterLevel,
  LogItem,
  LogLevel,
  LogLevelBadgeProps,
  LogsProps,
  LogsViewerProps,
  MoulLogsElement,
  MoulLogsViewerElement,
} from './components/LogsViewer'
export {
  HighlightText,
  LogAttributeChip,
  LogCopyIconButton,
  LogLevelBadge,
  MoulLogs,
  MoulLogs as Logs,
  MoulLogsViewer,
  MoulLogsViewer as LogsViewer,
  normalizeLogLevel,
  parseAttributes,
  parseLogLine,
  parseLogs,
  SERVER_LOG_RAW,
  SERVER_LOGS,
  stripAttributes,
} from './components/LogsViewer'
export {
  type ModalSize,
  MoulModal,
  MoulModal as Modal,
} from './components/Modal'
export {
  MoulNumberField,
  MoulNumberField as NumberField,
} from './components/NumberField'
export {
  type GeneratePaginationOptions,
  generatePagination,
  MoulPagination,
  MoulPagination as Pagination,
  type PaginationItem,
  type PaginationShape,
} from './components/Pagination'
export type {
  PercentageBarProps,
  PercentageBarSize,
  PercentageCircleProps,
  PercentageCircleSize,
} from './components/Percentage'
export {
  MoulPercentageBar,
  MoulPercentageBar as PercentageBar,
  MoulPercentageCircle,
  MoulPercentageCircle as PercentageCircle,
} from './components/Percentage'
export {
  MoulPopover,
  MoulPopover as Popover,
  type PopoverPlacement,
  type PopoverTrigger,
} from './components/Popover'
export type {
  ProgressBarShape,
  ProgressBarSize,
} from './components/ProgressBar'
export {
  MoulProgressBar,
  MoulProgressBar as ProgressBar,
} from './components/ProgressBar'
export {
  MoulRadio,
  MoulRadio as Radio,
  MoulRadioGroup,
  MoulRadioGroup as RadioGroup,
  type RadioGroupOrientation,
} from './components/RadioGroup'
export {
  MoulSearchField,
  MoulSearchField as SearchField,
} from './components/SearchField'
export {
  MoulSelect,
  MoulSelect as Select,
  MoulSelectItem,
  MoulSelectItem as SelectItem,
} from './components/Select'
export type { SeparatorOrientation } from './components/Separator'
export {
  MoulSeparator,
  MoulSeparator as Separator,
} from './components/Separator'
export type {
  SidebarAsideProps,
  SidebarBrandProps,
  SidebarContextValue,
  SidebarDividerProps,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarHeaderProps,
  SidebarItemProps,
  SidebarLayout,
  SidebarMainProps,
  SidebarProps,
  SidebarUserProps,
} from './components/Sidebar'
export {
  MoulSidebar,
  MoulSidebar as Sidebar,
  MoulSidebarAside,
  MoulSidebarAside as SidebarAside,
  MoulSidebarBrand,
  MoulSidebarBrand as SidebarBrand,
  MoulSidebarDivider,
  MoulSidebarDivider as SidebarDivider,
  MoulSidebarFooter,
  MoulSidebarFooter as SidebarFooter,
  MoulSidebarGroup,
  MoulSidebarGroup as SidebarGroup,
  MoulSidebarHeader,
  MoulSidebarHeader as SidebarHeader,
  MoulSidebarItem,
  MoulSidebarItem as SidebarItem,
  MoulSidebarMain,
  MoulSidebarMain as SidebarMain,
  MoulSidebarUser,
  MoulSidebarUser as SidebarUser,
  sidebarContext,
  useSidebar,
} from './components/Sidebar'
export type {
  SkeletonShape,
  SkeletonVariant,
} from './components/Skeleton'
export { MoulSkeleton, MoulSkeleton as Skeleton } from './components/Skeleton'
export {
  MoulSlider,
  MoulSlider as Slider,
} from './components/Slider'
export {
  MoulSpinner,
  MoulSpinner as Spinner,
  type SpinnerSize,
} from './components/Spinner'
export type { StatProps, StatTrend } from './components/Stat'
export { MoulStat, MoulStat as Stat } from './components/Stat'
export {
  MoulSwitch,
  MoulSwitch as Switch,
  type SwitchSize,
} from './components/Switch'
export type { TableColumn } from './components/Table'
export { MoulTable, MoulTable as Table } from './components/Table'
export {
  MoulTab,
  MoulTab as Tab,
  MoulTabPanel,
  MoulTabPanel as TabPanel,
  MoulTabs,
  MoulTabs as Tabs,
  type TabsOrientation,
  type TabsVariant,
} from './components/Tabs'
export type {
  TagSelectionMode,
  TagSize,
} from './components/TagGroup'
export {
  MoulTag,
  MoulTag as Tag,
  MoulTagGroup,
  MoulTagGroup as TagGroup,
} from './components/TagGroup'
export {
  MoulTextArea,
  MoulTextArea as TextArea,
} from './components/TextArea'
export {
  MoulTextField,
  MoulTextField as TextField,
  type TextFieldType,
} from './components/TextField'
export {
  MoulToast,
  MoulToast as Toast,
  MoulToastRegion,
  MoulToastRegion as ToastRegion,
  type ToastOptions,
  toastQueue,
} from './components/Toast'
export {
  MoulToggleButton,
  MoulToggleButton as ToggleButton,
  type ToggleButtonSize,
} from './components/ToggleButton'
export {
  MoulToggleButtonGroup,
  MoulToggleButtonGroup as ToggleButtonGroup,
  type ToggleButtonGroupOrientation,
} from './components/ToggleButtonGroup'
export {
  MoulTooltip,
  MoulTooltip as Tooltip,
  type TooltipPlacement,
} from './components/Tooltip'
export type { TopListItem, TopListProps } from './components/TopList'
export { MoulTopList, MoulTopList as TopList } from './components/TopList'
export type { TypographyVariant } from './components/Typography'
export {
  MoulTypography,
  MoulTypography as Typography,
} from './components/Typography'

// Reusable Lit Reactive Controllers
export {
  type Breakpoint,
  clampValue,
  computeBreakpoint,
  FormInternalsController,
  type FormInternalsControllerOptions,
  LayoutIndicatorController,
  type LayoutIndicatorControllerOptions,
  MAX_NUMBER_VALUE,
  MIN_NUMBER_VALUE,
  NumberSpringController,
  type NumberSpringControllerOptions,
  OverlayPresenceController,
  type OverlayPresenceControllerOptions,
  type OverlayPreset,
  PressController,
  type PressControllerOptions,
} from './controllers'

// Design Tokens & Semantic Tones System
export {
  normalizeTone,
  normalizeVariant,
  SEMANTIC_TONES,
  type SemanticTone,
  semanticToneStyles,
  VISUAL_VARIANTS,
  type VisualVariant,
} from './styles/semantic-tones'

// Custom Element Type Imports for Global HTMLElementTagNameMap
import type { MoulAlert } from './components/Alert'
import type { MoulAlertDialog } from './components/AlertDialog'
import type { MoulAreaChart } from './components/AreaChart'
import type { MoulAvatar, MoulAvatarGroup } from './components/Avatar'
import type { MoulBadge } from './components/Badge'
import type { MoulBarChart } from './components/BarChart'
import type {
  MoulBreadcrumbItem,
  MoulBreadcrumbs,
} from './components/Breadcrumbs'
import type { MoulButton } from './components/Button'
import type { MoulButtonGroup } from './components/ButtonGroup'
import type { MoulCalendar } from './components/Calendar'
import type {
  MoulCard,
  MoulCardBody,
  MoulCardFooter,
  MoulCardHeader,
} from './components/Card'
import type { MoulChartContainer } from './components/ChartContainer'
import type { MoulChartTooltip } from './components/ChartTooltip'
import type { MoulCheckbox, MoulCheckboxGroup } from './components/Checkbox'
import type { MoulComboBox, MoulComboBoxItem } from './components/ComboBox'
import type { MoulCommandPalette } from './components/CommandPalette'
import type { MoulDatePicker } from './components/DatePicker'
import type { MoulDoughnutChart } from './components/DoughnutChart'
import type { MoulDrawer } from './components/Drawer'
import type { MoulEmptyState } from './components/EmptyState'
import type { MoulForm } from './components/Form'
import type { MoulInputOTP } from './components/InputOTP'
import type { MoulKbd } from './components/Kbd'
import type { MoulLineChart } from './components/LineChart'
import type { MoulLink } from './components/Link'
import type { MoulLogs, MoulLogsViewer } from './components/LogsViewer'
import type { MoulModal } from './components/Modal'
import type { MoulNumberField } from './components/NumberField'
import type { MoulPagination } from './components/Pagination'
import type {
  MoulPercentageBar,
  MoulPercentageCircle,
} from './components/Percentage'
import type { MoulPopover } from './components/Popover'
import type { MoulProgressBar } from './components/ProgressBar'
import type { MoulRadio, MoulRadioGroup } from './components/RadioGroup'
import type { MoulSearchField } from './components/SearchField'
import type { MoulSelect, MoulSelectItem } from './components/Select'
import type { MoulSeparator } from './components/Separator'
import type {
  MoulSidebar,
  MoulSidebarAside,
  MoulSidebarBrand,
  MoulSidebarDivider,
  MoulSidebarFooter,
  MoulSidebarGroup,
  MoulSidebarHeader,
  MoulSidebarItem,
  MoulSidebarMain,
  MoulSidebarUser,
} from './components/Sidebar'
import type { MoulSkeleton } from './components/Skeleton'
import type { MoulSlider } from './components/Slider'
import type { MoulSpinner } from './components/Spinner'
import type { MoulStat } from './components/Stat'
import type { MoulSwitch } from './components/Switch'
import type { MoulTable } from './components/Table'
import type { MoulTab, MoulTabPanel, MoulTabs } from './components/Tabs'
import type { MoulTag, MoulTagGroup } from './components/TagGroup'
import type { MoulTextArea } from './components/TextArea'
import type { MoulTextField } from './components/TextField'
import type { MoulToast, MoulToastRegion } from './components/Toast'
import type { MoulToggleButton } from './components/ToggleButton'
import type { MoulToggleButtonGroup } from './components/ToggleButtonGroup'
import type { MoulTooltip } from './components/Tooltip'
import type { MoulTopList } from './components/TopList'
import type { MoulTypography } from './components/Typography'

declare global {
  interface HTMLElementTagNameMap {
    // Phase 4: Actions & Toggle
    'moul-button': MoulButton
    'moul-button-group': MoulButtonGroup
    'moul-toggle-button': MoulToggleButton
    'moul-toggle-button-group': MoulToggleButtonGroup

    // Phase 5: Surfaces & Feedback
    'moul-typography': MoulTypography
    'moul-kbd': MoulKbd
    'moul-separator': MoulSeparator
    'moul-spinner': MoulSpinner
    'moul-skeleton': MoulSkeleton
    'moul-badge': MoulBadge
    'moul-card': MoulCard
    'moul-card-header': MoulCardHeader
    'moul-card-body': MoulCardBody
    'moul-card-footer': MoulCardFooter
    'moul-empty-state': MoulEmptyState
    'moul-alert': MoulAlert
    'moul-progress-bar': MoulProgressBar
    'moul-avatar': MoulAvatar
    'moul-avatar-group': MoulAvatarGroup
    'moul-tag': MoulTag
    'moul-tag-group': MoulTagGroup
    'moul-table': MoulTable
    'moul-toast': MoulToast
    'moul-toast-region': MoulToastRegion

    // Phase 6: Overlays & Navigation
    'moul-link': MoulLink
    'moul-breadcrumbs': MoulBreadcrumbs
    'moul-breadcrumb-item': MoulBreadcrumbItem
    'moul-pagination': MoulPagination
    'moul-tabs': MoulTabs
    'moul-tab': MoulTab
    'moul-tab-panel': MoulTabPanel
    'moul-popover': MoulPopover
    'moul-tooltip': MoulTooltip
    'moul-modal': MoulModal
    'moul-alert-dialog': MoulAlertDialog
    'moul-drawer': MoulDrawer
    'moul-command-palette': MoulCommandPalette

    // Phase 7: Inputs & Forms
    'moul-form': MoulForm
    'moul-text-field': MoulTextField
    'moul-number-field': MoulNumberField
    'moul-search-field': MoulSearchField
    'moul-text-area': MoulTextArea
    'moul-checkbox': MoulCheckbox
    'moul-checkbox-group': MoulCheckboxGroup
    'moul-radio-group': MoulRadioGroup
    'moul-radio': MoulRadio
    'moul-switch': MoulSwitch
    'moul-slider': MoulSlider
    'moul-input-otp': MoulInputOTP
    'moul-select': MoulSelect
    'moul-select-item': MoulSelectItem
    'moul-combobox': MoulComboBox
    'moul-combobox-item': MoulComboBoxItem
    'moul-calendar': MoulCalendar
    'moul-date-picker': MoulDatePicker

    // Phase 8: Charts & Data Visualization
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

    // Phase 9: Composite Block Components
    'moul-logs': MoulLogs
    'moul-logs-viewer': MoulLogsViewer
    'moul-sidebar': MoulSidebar
    'moul-sidebar-aside': MoulSidebarAside
    'moul-sidebar-main': MoulSidebarMain
    'moul-sidebar-header': MoulSidebarHeader
    'moul-sidebar-brand': MoulSidebarBrand
    'moul-sidebar-group': MoulSidebarGroup
    'moul-sidebar-item': MoulSidebarItem
    'moul-sidebar-divider': MoulSidebarDivider
    'moul-sidebar-footer': MoulSidebarFooter
    'moul-sidebar-user': MoulSidebarUser
  }
}
```

### 4.2 Companion Barrel Fixes
The worker should also apply the following three small barrel fixes:

1. **`ui/src/components/ChartContainer/index.ts`**:
```ts
export type { ViewportResizeDetail } from './ChartContainer'
export {
  MoulChartContainer,
  MoulChartContainer as ChartContainer,
} from './ChartContainer'
```

2. **`ui/src/components/ChartTooltip/index.ts`**:
```ts
export type {
  ChartTooltipPayloadEntry,
  ChartTooltipShowOptions,
} from './ChartTooltip'
export {
  MoulChartTooltip,
  MoulChartTooltip as ChartTooltip,
} from './ChartTooltip'
```

3. **`ui/src/components/DoughnutChart/index.ts`**:
```ts
export type { DoughnutDataItem } from '../ChartCommon'
export type { DoughnutChartProps } from './DoughnutChart'
export {
  MoulDoughnutChart,
  MoulDoughnutChart as DoughnutChart,
} from './DoughnutChart'
```

---

## 5. Verification Method

1. **Verify Complete Replacement File Availability**:
   ```bash
   test -f .agents/teamwork/explorer_phase10_m1_3/proposed_index.ts && echo "Found proposed_index.ts"
   ```
2. **Verify Biome Formatting Cleanliness**:
   ```bash
   bunx @biomejs/biome format --stdin-file-path=ui/src/index.ts < .agents/teamwork/explorer_phase10_m1_3/proposed_index.ts | diff -u .agents/teamwork/explorer_phase10_m1_3/proposed_index.ts -
   ```
   *Expected result*: Exit code 0, 0 bytes difference.
3. **Verify Tag Count Parity in Synthesized File**:
   ```bash
   grep -E "'moul-[a-z0-9-]+':" .agents/teamwork/explorer_phase10_m1_3/proposed_index.ts | wc -l
   ```
   *Expected count*: `77`.
4. **Verify Zero React Imports in Synthesized File**:
   ```bash
   grep -i "react" .agents/teamwork/explorer_phase10_m1_3/proposed_index.ts
   ```
   *Expected result*: No output (exit code 1).
