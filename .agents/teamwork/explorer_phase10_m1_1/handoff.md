# Component Exports Audit & Proposal Report — Milestone 1.1

**Agent**: `explorer_phase10_m1_1`  
**Date**: 2026-10-17T13:07:00Z  
**Target Milestone**: Phase 10 — Milestone 1 (Public Entry Point & Tag Augmentation)  
**Status**: Investigation Complete (Hard Handoff)

---

## 1. Observation

### 1.1 Direct Inspection of `ui/src/index.ts`
Inspection of `ui/src/index.ts` (568 lines) revealed three categories of critical defects:

#### A. Lingering Legacy React Exports
The following exports reference legacy React JSX/StyleX components that have no place in the Lit Web Components library:
1. **Lines 16–38**:
   ```ts
   export type {
     AutocompleteEmptyStateProps,
     AutocompleteItemProps,
     AutocompleteListProps,
     AutocompleteMode,
     AutocompletePopoverProps,
     AutocompleteProps,
     AutocompleteSectionProps,
     AutocompleteSize,
     Filter,
   } from './components/Autocomplete'
   export {
     Autocomplete,
     AutocompleteContext,
     AutocompleteEmptyState,
     AutocompleteItem,
     AutocompleteList,
     AutocompletePopover,
     AutocompleteSection,
     AutocompleteStateContext,
     useAutocompleteInnerContext,
     useFilter,
   } from './components/Autocomplete'
   ```
2. **Lines 124–125**:
   ```ts
   export { Description } from './components/Description'
   export type { DescriptionProps } from './components/Description/Description'
   ```
3. **Lines 158–159**:
   ```ts
   export { Label } from './components/Label'
   export type { LabelProps } from './components/Label/Label'
   ```

#### B. Phantom / Mismatched Type Exports
Several type exports do not exist in the referenced Lit component implementations:
1. **Lines 88–91**:
   ```ts
   export type {
     ChartContainerProps,
     LegendItem,
   } from './components/ChartContainer'
   ```
   *Observed*: In `ui/src/components/ChartContainer/ChartContainer.ts:9–13`, the actual exported interface is `ViewportResizeDetail`:
   ```ts
   export interface ViewportResizeDetail {
     width: number
     height: number
     breakpoint: Breakpoint
   }
   ```
   Neither `ChartContainerProps` nor `LegendItem` exists in `ChartContainer.ts`.
2. **Lines 97–101**:
   ```ts
   export type { CustomTooltipProps } from './components/ChartTooltip'
   ```
   *Observed*: In `ui/src/components/ChartTooltip/ChartTooltip.ts:7–28`, the actual exported interfaces are `ChartTooltipPayloadEntry` and `ChartTooltipShowOptions`:
   ```ts
   export interface ChartTooltipPayloadEntry { ... }
   export interface ChartTooltipShowOptions { ... }
   ```
   `CustomTooltipProps` does not exist in `ChartTooltip.ts`.
3. **Lines 126–129**:
   ```ts
   export type {
     DoughnutChartProps,
     DoughnutDataItem,
   } from './components/DoughnutChart'
   ```
   *Observed*: In `ui/src/components/DoughnutChart/DoughnutChart.ts:13`, `DoughnutDataItem` is imported from `../ChartCommon` without being re-exported.

#### C. Missing Type Imports for `HTMLElementTagNameMap` (Lines 542–551)
In lines 542–551 of `ui/src/index.ts`:
```ts
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
```
*Observed*: Lines 411–475 omit `import type { ... }` declarations for these 10 Chart LitElement classes, triggering 10 TS2304 / TS2552 errors during `tsc -b`.

#### D. Missing ChartCommon Exports
In `ui/src/components/bar-chart-challenge.test.ts:5`, `doughnut-chart-challenge.test.ts:8`, and `line-chart-challenge.test.ts:5`:
Tests import `ChartSeries`, `DoughnutDataItem`, and `PointHoverDetail` directly from `'../index'`, but `ui/src/index.ts` does not export them.

---

### 1.2 Census of All 54 Component Specifications & 77 Lit Custom Elements
Every component directory was checked for defined custom element tags and exported classes. Exactly 77 unique `moul-*` custom elements are defined via `defineElement()` and mapped in `HTMLElementTagNameMap`:

| Category | Count | Tags & Classes | Exported Types / Interfaces |
|---|---|---|---|
| **Category 1: Charts & Data Visualization** | 10 | `moul-line-chart` (`MoulLineChart`), `moul-area-chart` (`MoulAreaChart`), `moul-bar-chart` (`MoulBarChart`), `moul-doughnut-chart` (`MoulDoughnutChart`), `moul-top-list` (`MoulTopList`), `moul-stat` (`MoulStat`), `moul-percentage-bar` (`MoulPercentageBar`), `moul-percentage-circle` (`MoulPercentageCircle`), `moul-chart-container` (`MoulChartContainer`), `moul-chart-tooltip` (`MoulChartTooltip`) | `LineChartProps`, `AreaChartProps`, `BarChartProps`, `DoughnutChartProps`, `TopListItem`, `TopListProps`, `StatProps`, `StatTrend`, `PercentageBarProps`, `PercentageBarSize`, `PercentageCircleProps`, `PercentageCircleSize`, `ViewportResizeDetail`, `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions`, `ChartSeries`, `DoughnutDataItem`, `PointHoverDetail` |
| **Category 2: Actions & Toggle** | 4 | `moul-button` (`MoulButton`), `moul-button-group` (`MoulButtonGroup`), `moul-toggle-button` (`MoulToggleButton`), `moul-toggle-button-group` (`MoulToggleButtonGroup`) | `ButtonSize`, `ButtonType`, `ButtonVariant`, `ButtonGroupOrientation`, `ButtonGroupSpacing`, `ToggleButtonSize`, `ToggleButtonGroupOrientation` |
| **Category 3: Inputs & Forms** | 18 | `moul-form` (`MoulForm`), `moul-text-field` (`MoulTextField`), `moul-number-field` (`MoulNumberField`), `moul-search-field` (`MoulSearchField`), `moul-text-area` (`MoulTextArea`), `moul-checkbox` (`MoulCheckbox`), `moul-checkbox-group` (`MoulCheckboxGroup`), `moul-radio-group` (`MoulRadioGroup`), `moul-radio` (`MoulRadio`), `moul-switch` (`MoulSwitch`), `moul-slider` (`MoulSlider`), `moul-input-otp` (`MoulInputOTP`), `moul-select` (`MoulSelect`), `moul-select-item` (`MoulSelectItem`), `moul-combobox` (`MoulComboBox`), `moul-combobox-item` (`MoulComboBoxItem`), `moul-calendar` (`MoulCalendar`), `moul-date-picker` (`MoulDatePicker`) | `FormMethod`, `TextFieldType`, `CheckboxGroupOrientation`, `RadioGroupOrientation`, `SwitchSize` |
| **Category 4: Overlays & Navigation** | 13 | `moul-modal` (`MoulModal`), `moul-alert-dialog` (`MoulAlertDialog`), `moul-drawer` (`MoulDrawer`), `moul-popover` (`MoulPopover`), `moul-tooltip` (`MoulTooltip`), `moul-command-palette` (`MoulCommandPalette`), `moul-breadcrumbs` (`MoulBreadcrumbs`), `moul-breadcrumb-item` (`MoulBreadcrumbItem`), `moul-link` (`MoulLink`), `moul-pagination` (`MoulPagination`), `moul-tabs` (`MoulTabs`), `moul-tab` (`MoulTab`), `moul-tab-panel` (`MoulTabPanel`) | `ModalSize`, `AlertDialogSize`, `DrawerPlacement`, `DrawerSize`, `PopoverPlacement`, `PopoverTrigger`, `TooltipPlacement`, `CommandPaletteItemData`, `LinkVariant`, `GeneratePaginationOptions`, `PaginationItem`, `PaginationShape`, `TabsOrientation`, `TabsVariant` |
| **Category 5: Surface & Feedback** | 20 | `moul-alert` (`MoulAlert`), `moul-avatar` (`MoulAvatar`), `moul-avatar-group` (`MoulAvatarGroup`), `moul-badge` (`MoulBadge`), `moul-card` (`MoulCard`), `moul-card-header` (`MoulCardHeader`), `moul-card-body` (`MoulCardBody`), `moul-card-footer` (`MoulCardFooter`), `moul-empty-state` (`MoulEmptyState`), `moul-kbd` (`MoulKbd`), `moul-progress-bar` (`MoulProgressBar`), `moul-separator` (`MoulSeparator`), `moul-skeleton` (`MoulSkeleton`), `moul-spinner` (`MoulSpinner`), `moul-table` (`MoulTable`), `moul-tag` (`MoulTag`), `moul-tag-group` (`MoulTagGroup`), `moul-toast` (`MoulToast`), `moul-toast-region` (`MoulToastRegion`), `moul-typography` (`MoulTypography`) | `AvatarShape`, `AvatarSize`, `AvatarStatus`, `BadgeSize`, `EmptyStateAlign`, `EmptyStateSize`, `ProgressBarShape`, `ProgressBarSize`, `SeparatorOrientation`, `SkeletonShape`, `SkeletonVariant`, `SpinnerSize`, `TableColumn`, `TagSelectionMode`, `TagSize`, `ToastOptions`, `TypographyVariant` |
| **Category 6: Composite Blocks** | 12 | `moul-logs` (`MoulLogs`), `moul-logs-viewer` (`MoulLogsViewer`), `moul-sidebar` (`MoulSidebar`), `moul-sidebar-aside` (`MoulSidebarAside`), `moul-sidebar-main` (`MoulSidebarMain`), `moul-sidebar-header` (`MoulSidebarHeader`), `moul-sidebar-brand` (`MoulSidebarBrand`), `moul-sidebar-group` (`MoulSidebarGroup`), `moul-sidebar-item` (`MoulSidebarItem`), `moul-sidebar-divider` (`MoulSidebarDivider`), `moul-sidebar-footer` (`MoulSidebarFooter`), `moul-sidebar-user` (`MoulSidebarUser`) | `HighlightTextProps`, `LogAttributeChipProps`, `LogCopyIconButtonProps`, `LogFilterLevel`, `LogItem`, `LogLevel`, `LogLevelBadgeProps`, `LogsProps`, `LogsViewerProps`, `MoulLogsElement`, `MoulLogsViewerElement`, `SidebarAsideProps`, `SidebarBrandProps`, `SidebarContextValue`, `SidebarDividerProps`, `SidebarFooterProps`, `SidebarGroupProps`, `SidebarHeaderProps`, `SidebarItemProps`, `SidebarLayout`, `SidebarMainProps`, `SidebarProps`, `SidebarUserProps` |

Total Custom Elements: **77**. All 77 are exported with both prefixed name (`MoulButton`) and alias name (`Button`).

---

## 2. Logic Chain

1. **Step 1 (Source Verification of Defined Elements)**:
   By auditing all `defineElement` calls across `ui/src/components/`, exactly 77 custom element tags are defined (Observation 1.2).
2. **Step 2 (Removal of Obsolete Code)**:
   The workspace purge mandates zero React dependencies (`scripts/verify-no-react.ts`). Components `Autocomplete`, `Description`, and `Label` are legacy React implementations. Removing them from `ui/src/index.ts` purges the public entry point of React references (Observation 1.1A).
3. **Step 3 (Eliminating Phantom Types)**:
   `ChartContainerProps`, `LegendItem`, and `CustomTooltipProps` do not exist in the source files. Replacing them with `ViewportResizeDetail`, `ChartTooltipPayloadEntry`, and `ChartTooltipShowOptions` fixes type resolution (Observation 1.1B).
4. **Step 4 (Resolving ChartCommon Exports)**:
   The chart challenge tests import `ChartSeries`, `DoughnutDataItem`, and `PointHoverDetail` from `../index`. Exporting these types and `CHART_COLORS`, `getChartColor` from `ui/src/components/ChartCommon` satisfies those contracts (Observation 1.1D).
5. **Step 5 (Resolving Global HTMLElementTagNameMap Errors)**:
   Adding `import type { MoulAreaChart, MoulBarChart, MoulChartContainer, MoulChartTooltip, MoulDoughnutChart, MoulLineChart, MoulPercentageBar, MoulPercentageCircle, MoulStat, MoulTopList }` directly resolves all 10 TS2304 / TS2552 errors in `HTMLElementTagNameMap` (Observation 1.1C).
6. **Step 6 (Companion Barrel Module Synchronizations)**:
   `ui/src/components/ChartContainer/index.ts`, `ChartTooltip/index.ts`, and `DoughnutChart/index.ts` also contained the same phantom type exports. Fixing them in tandem ensures clean subpath resolution.

---

## 3. Caveats

1. **Subcomponent Counting Nuance**: The prompt specifies "all 54 component classes". There are 54 numbered component specifications in `rdt/design.md`, which map to 77 custom element classes when subcomponents (such as `moul-card-header`, `moul-sidebar-brand`, `moul-select-item`) are included. All 77 classes are cleanly exported.
2. **Read-Only Invariant**: In strict accordance with explorer permissions, no production source files were directly modified. All proposals are stored in `.agents/teamwork/explorer_phase10_m1_1/` as replacement files and unified diff patches.

---

## 4. Conclusion

The public export surface of `@moul-dev/ui` in `ui/src/index.ts` requires the following concrete changes:
1. **Remove legacy React exports**: Lines 16–38 (`Autocomplete`), lines 124–125 (`Description`), and lines 158–159 (`Label`).
2. **Replace phantom chart types**:
   - `ChartContainer`: Export `type { ViewportResizeDetail }`.
   - `ChartTooltip`: Export `type { ChartTooltipPayloadEntry, ChartTooltipShowOptions }`.
   - `DoughnutChart`: Remove invalid `DoughnutDataItem` from `./components/DoughnutChart`.
3. **Export ChartCommon primitives**:
   - `export type { ChartSeries, DoughnutDataItem, PointHoverDetail } from './components/ChartCommon'`
   - `export { CHART_COLORS, getChartColor } from './components/ChartCommon'`
4. **Add 10 missing chart class type imports** preceding `declare global`:
   ```ts
   import type { MoulAreaChart } from './components/AreaChart'
   import type { MoulBarChart } from './components/BarChart'
   import type { MoulChartContainer } from './components/ChartContainer'
   import type { MoulChartTooltip } from './components/ChartTooltip'
   import type { MoulDoughnutChart } from './components/DoughnutChart'
   import type { MoulLineChart } from './components/LineChart'
   import type {
     MoulPercentageBar,
     MoulPercentageCircle,
   } from './components/Percentage'
   import type { MoulStat } from './components/Stat'
   import type { MoulTopList } from './components/TopList'
   ```
5. **Update companion barrel files**:
   - `ui/src/components/ChartContainer/index.ts` (Patch provided)
   - `ui/src/components/ChartTooltip/index.ts` (Patch provided)
   - `ui/src/components/DoughnutChart/index.ts` (Patch provided)

### Generated Artifacts in Working Directory
- Full proposed entry point: `.agents/teamwork/explorer_phase10_m1_1/proposed_index.ts`
- Unified diff patch: `.agents/teamwork/explorer_phase10_m1_1/index.patch`
- ChartContainer patch: `.agents/teamwork/explorer_phase10_m1_1/ChartContainer_index.patch`
- ChartTooltip patch: `.agents/teamwork/explorer_phase10_m1_1/ChartTooltip_index.patch`
- DoughnutChart patch: `.agents/teamwork/explorer_phase10_m1_1/DoughnutChart_index.patch`

---

## 5. Verification Method

To verify the audit and proposed changes:

1. **Verify No React Exports Remain in Proposed Entrypoint**:
   ```bash
   grep -E "(Autocomplete|Description|Label|react)" .agents/teamwork/explorer_phase10_m1_1/proposed_index.ts
   ```
   *Expected output*: Only references to `warn-missing-label` or harmless comments; zero exports of `Autocomplete`, `Description`, or `Label`.

2. **Verify All 77 Custom Elements in Tag Map**:
   ```bash
   node -e 'const fs=require("fs");const content=fs.readFileSync(".agents/teamwork/explorer_phase10_m1_1/proposed_index.ts","utf8");const map=content.slice(content.indexOf("interface HTMLElementTagNameMap"),content.lastIndexOf("}"));const tags=[...map.matchAll(/["\x27](moul-[a-z0-9-]+)["\x27]/g)].map(m=>m[1]);console.log("Tags count in TagMap:",tags.length);'
   ```
   *Expected output*: `Tags count in TagMap: 77`.

3. **Verify All 77 Type Imports Precede `declare global`**:
   ```bash
   node -e 'const fs=require("fs");const content=fs.readFileSync(".agents/teamwork/explorer_phase10_m1_1/proposed_index.ts","utf8");const imports=content.slice(content.indexOf("// Custom Element Type Imports"),content.indexOf("declare global"));const chartClasses=["MoulAreaChart","MoulBarChart","MoulChartContainer","MoulChartTooltip","MoulDoughnutChart","MoulLineChart","MoulPercentageBar","MoulPercentageCircle","MoulStat","MoulTopList"];const missing=chartClasses.filter(c=>!imports.includes(c));console.log("Missing chart class type imports:",missing);'
   ```
   *Expected output*: `Missing chart class type imports: []`.

4. **Verify Patch Clean Application**:
   ```bash
   git apply --check .agents/teamwork/explorer_phase10_m1_1/index.patch
   git apply --check .agents/teamwork/explorer_phase10_m1_1/ChartContainer_index.patch
   git apply --check .agents/teamwork/explorer_phase10_m1_1/ChartTooltip_index.patch
   git apply --check .agents/teamwork/explorer_phase10_m1_1/DoughnutChart_index.patch
   ```
   *Expected output*: Clean exit (code 0) for all patches.
