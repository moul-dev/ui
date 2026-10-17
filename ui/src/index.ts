// Entrypoint for @moul-dev/ui component library
export const version = '2026.9.28'

export { MoulAlert, MoulAlert as Alert } from './components/Alert'
export {
  type AlertDialogSize,
  MoulAlertDialog,
  MoulAlertDialog as AlertDialog,
} from './components/AlertDialog'
export type { AreaChartProps } from './components/AreaChart'
export { AreaChart } from './components/AreaChart'
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
export { BarChart } from './components/BarChart'
export {
  MoulBreadcrumbItem,
  MoulBreadcrumbItem as BreadcrumbItem,
  MoulBreadcrumbs,
  MoulBreadcrumbs as Breadcrumbs,
} from './components/Breadcrumbs'
export { MoulButton, MoulButton as Button } from './components/Button'
export type {
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from './components/Button/Button'
export {
  MoulButtonGroup,
  MoulButtonGroup as ButtonGroup,
} from './components/ButtonGroup'
export type {
  ButtonGroupOrientation,
  ButtonGroupSpacing,
} from './components/ButtonGroup/ButtonGroup'
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
export type {
  ChartContainerProps,
  LegendItem,
} from './components/ChartContainer'
// Charts and Analytics Components
export { ChartContainer } from './components/ChartContainer'
export type { CustomTooltipProps } from './components/ChartTooltip'
export { ChartTooltip } from './components/ChartTooltip'
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
export type {
  DateFieldProps,
  DateInputProps,
  DateSegmentProps,
} from './components/DateField'
export {
  DateField,
  DateInput,
  DateSegment,
} from './components/DateField'
export {
  MoulDatePicker,
  MoulDatePicker as DatePicker,
} from './components/DatePicker'
export { Description } from './components/Description'
export type { DescriptionProps } from './components/Description/Description'
export type { DoughnutChartProps } from './components/DoughnutChart'
export { DoughnutChart } from './components/DoughnutChart'
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
export { ErrorMessage } from './components/ErrorMessage'
export type { ErrorMessageProps } from './components/ErrorMessage/ErrorMessage'
export { FieldError } from './components/FieldError'
export type { FieldErrorProps } from './components/FieldError/FieldError'
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
export { Label } from './components/Label'
export type { LabelProps } from './components/Label/Label'
export type { LineChartProps } from './components/LineChart'
export { LineChart } from './components/LineChart'
export { type LinkVariant, MoulLink, MoulLink as Link } from './components/Link'
export type {
  DropIndicatorProps,
  ListBoxItemProps,
  ListBoxLayout,
  ListBoxLoadMoreItemProps,
  ListBoxOrientation,
  ListBoxProps,
  ListBoxSectionProps,
  ListBoxSize,
  ListBoxVariant,
} from './components/ListBox'
export {
  DropIndicator,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
  Text,
} from './components/ListBox'
export type {
  HighlightTextProps,
  LogAttributeChipProps,
  LogFilterLevel,
  LogItem,
  LogLevel,
  LogLevelBadgeProps,
  LogsProps,
  LogsViewerProps,
} from './components/LogsViewer'
export {
  HighlightText,
  LogAttributeChip,
  LogLevelBadge,
  Logs,
  LogsViewer,
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
  PercentageCircleProps,
} from './components/Percentage'
export { PercentageBar, PercentageCircle } from './components/Percentage'
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
  Sidebar,
  SidebarAside,
  SidebarBrand,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  SidebarUser,
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
export { MoulSpinner, MoulSpinner as Spinner } from './components/Spinner'
export type { SpinnerSize } from './components/Spinner/Spinner'
export type { StatProps } from './components/Stat'
export { Stat } from './components/Stat'
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
} from './components/ToggleButton'
export type { ToggleButtonSize } from './components/ToggleButton/ToggleButton'
export {
  MoulToggleButtonGroup,
  MoulToggleButtonGroup as ToggleButtonGroup,
} from './components/ToggleButtonGroup'
export type { ToggleButtonGroupOrientation } from './components/ToggleButtonGroup/ToggleButtonGroup'
export {
  MoulTooltip,
  MoulTooltip as Tooltip,
  type TooltipPlacement,
} from './components/Tooltip'
export type { TopListItem, TopListProps } from './components/TopList'
export { TopList } from './components/TopList'
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
export type { ThemeProviderProps } from './theme/ThemeProvider'
export { ThemeProvider } from './theme/ThemeProvider'
export type { Tokens } from './tokens/tokens.stylex'
export { tokens } from './tokens/tokens.stylex'

// Custom Element Type Imports for Global HTMLElementTagNameMap
import type { MoulAlert } from './components/Alert'
import type { MoulAlertDialog } from './components/AlertDialog'
import type { MoulAvatar, MoulAvatarGroup } from './components/Avatar'
import type { MoulBadge } from './components/Badge'
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
import type { MoulCheckbox, MoulCheckboxGroup } from './components/Checkbox'
import type { MoulComboBox, MoulComboBoxItem } from './components/ComboBox'
import type { MoulCommandPalette } from './components/CommandPalette'
import type { MoulDatePicker } from './components/DatePicker'
import type { MoulDrawer } from './components/Drawer'
import type { MoulEmptyState } from './components/EmptyState'
import type { MoulForm } from './components/Form'
import type { MoulInputOTP } from './components/InputOTP'
import type { MoulKbd } from './components/Kbd'
import type { MoulLink } from './components/Link'
import type { MoulModal } from './components/Modal'
import type { MoulNumberField } from './components/NumberField'
import type { MoulPagination } from './components/Pagination'
import type { MoulPopover } from './components/Popover'
import type { MoulProgressBar } from './components/ProgressBar'
import type { MoulRadio, MoulRadioGroup } from './components/RadioGroup'
import type { MoulSearchField } from './components/SearchField'
import type { MoulSelect, MoulSelectItem } from './components/Select'
import type { MoulSeparator } from './components/Separator'
import type { MoulSkeleton } from './components/Skeleton'
import type { MoulSlider } from './components/Slider'
import type { MoulSpinner } from './components/Spinner'
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
  }
}
