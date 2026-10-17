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
