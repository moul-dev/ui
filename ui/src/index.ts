// Entrypoint for @moul-dev/web-component component library
export const version = '1.0.0-rc.1'

export {
  type AccordionVariant,
  MoulAccordion,
  MoulAccordion as Accordion,
  MoulAccordionItem,
  MoulAccordionItem as AccordionItem,
} from './components/Accordion'
// Phase 5: Surface & Feedback Components
export { MoulAlert, MoulAlert as Alert } from './components/Alert'
export {
  type AlertDialogSize,
  MoulAlertDialog,
  MoulAlertDialog as AlertDialog,
} from './components/AlertDialog'
export {
  MoulAnimatedList,
  MoulAnimatedList as AnimatedList,
} from './components/AnimatedList'
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
  type ButtonEffect,
  type ButtonSize,
  type ButtonState,
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
  type CardEffect,
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
  FunnelStage,
  HeatmapDataItem,
  PointHoverDetail,
  PointHoverEntry,
} from './components/ChartCommon'
export {
  CHART_COLORS,
  getChartColor,
  placeHoverCard,
} from './components/ChartCommon'
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
export type {
  DoughnutChartProps,
  DoughnutChartShape,
} from './components/DoughnutChart'
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
export {
  type DropdownMenuActionDetail,
  type DropdownMenuPlacement,
  type DropdownMenuVariant,
  type MenuItemType,
  type MenuItemVariant,
  MoulDropdownMenu,
  MoulDropdownMenu as DropdownMenu,
  MoulMenuGroup,
  MoulMenuGroup as MenuGroup,
  MoulMenuItem,
  MoulMenuItem as MenuItem,
  MoulMenuSeparator,
  MoulMenuSeparator as MenuSeparator,
} from './components/DropdownMenu'
export type {
  EmptyStateAlign,
  EmptyStateSize,
} from './components/EmptyState'
export {
  MoulEmptyState,
  MoulEmptyState as EmptyState,
} from './components/EmptyState'
export {
  type ExpandableCardSize,
  MoulExpandableCard,
  MoulExpandableCard as ExpandableCard,
} from './components/ExpandableCard'
export {
  type FileRejectReason,
  type FileUploadChangeDetail,
  type FileUploadContext,
  type FileUploadFunction,
  type FileUploadItem,
  type FileUploadRejectDetail,
  type FileUploadRemoveDetail,
  type FileUploadStatus,
  MoulFileUpload,
  MoulFileUpload as FileUpload,
} from './components/FileUpload'
export {
  MoulFocusMode,
  MoulFocusMode as FocusMode,
} from './components/FocusMode'
export {
  type FormMethod,
  MoulForm,
  MoulForm as Form,
} from './components/Form'
export type { FunnelChartProps } from './components/FunnelChart'
export {
  MoulFunnelChart,
  MoulFunnelChart as FunnelChart,
} from './components/FunnelChart'
export type {
  HeatmapCell,
  HeatmapChartProps,
  HeatmapMode,
} from './components/HeatmapChart'
export {
  MoulHeatmapChart,
  MoulHeatmapChart as HeatmapChart,
} from './components/HeatmapChart'
export {
  type HoverCardPlacement,
  MoulHoverCard,
  MoulHoverCard as HoverCard,
} from './components/HoverCard'
export {
  type IconMorphName,
  type IconMorphSize,
  MoulIconMorph,
  MoulIconMorph as IconMorph,
} from './components/IconMorph'
export {
  MoulInputOTP,
  MoulInputOTP as InputOTP,
} from './components/InputOTP'
export { MoulKbd, MoulKbd as Kbd } from './components/Kbd'
export type {
  LineChartPauseChangeDetail,
  LineChartProps,
} from './components/LineChart'
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
  MoulNotificationBell,
  MoulNotificationBell as NotificationBell,
  type NotificationBellPlacement,
} from './components/NotificationBell'
export {
  MoulNumberField,
  MoulNumberField as NumberField,
} from './components/NumberField'
export {
  MoulNumberTicker,
  MoulNumberTicker as NumberTicker,
  type NumberTickerMode,
} from './components/NumberTicker'
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
  MoulPullToRefresh,
  MoulPullToRefresh as PullToRefresh,
  type PullToRefreshEventDetail,
} from './components/PullToRefresh'
export {
  MoulRadio,
  MoulRadio as Radio,
  MoulRadioGroup,
  MoulRadioGroup as RadioGroup,
  type RadioGroupOrientation,
} from './components/RadioGroup'
export {
  MoulResultCard,
  MoulResultCard as ResultCard,
  type ResultCardStatus,
} from './components/ResultCard'
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
export {
  MoulSelectionToolbar,
  MoulSelectionToolbar as SelectionToolbar,
  type SelectionToolbarPosition,
} from './components/SelectionToolbar'
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
  MoulSlideToConfirm,
  MoulSlideToConfirm as SlideToConfirm,
} from './components/SlideToConfirm'
export {
  MoulSpinner,
  MoulSpinner as Spinner,
  type SpinnerSize,
  type SpinnerVariant,
} from './components/Spinner'
export {
  MoulSplitButton,
  MoulSplitButton as SplitButton,
  type SplitButtonVariant,
} from './components/SplitButton'
export type { StatProps, StatTrend } from './components/Stat'
export { MoulStat, MoulStat as Stat } from './components/Stat'
export {
  MoulStepLoader,
  MoulStepLoader as StepLoader,
  type StepLoaderLabels,
  type StepLoaderState,
  type StepLoaderStep,
} from './components/StepLoader'
export {
  MoulStep,
  MoulStep as Step,
  MoulStepper,
  MoulStepper as Stepper,
  type StepperChangeDetail,
  type StepperOrientation,
  type StepStatus,
} from './components/Stepper'
export {
  MoulSwitch,
  MoulSwitch as Switch,
  type SwitchSize,
} from './components/Switch'
export type { TableColumn, TableFilterOption } from './components/Table'
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
  MoulThemeToggle,
  MoulThemeToggle as ThemeToggle,
  type ResolvedTheme,
  type ThemeMode,
  type ThemeToggleChangeDetail,
  type ThemeToggleLabels,
  type ThemeToggleTransition,
} from './components/ThemeToggle'
export {
  MoulToast,
  MoulToast as Toast,
  MoulToastRegion,
  MoulToastRegion as ToastRegion,
  type ToastAction,
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
  type TooltipFollow,
  type TooltipPlacement,
} from './components/Tooltip'
export type { TopListItem, TopListProps } from './components/TopList'
export { MoulTopList, MoulTopList as TopList } from './components/TopList'
export {
  MoulTour,
  MoulTour as Tour,
  MoulTourStep,
  MoulTourStep as TourStep,
  type TourOpenChangeDetail,
  type TourPlacement,
  type TourStepChangeDetail,
} from './components/Tour'
export {
  MoulTree,
  MoulTree as Tree,
  MoulTreeItem,
  MoulTreeItem as TreeItem,
  type TreeActionDetail,
  type TreeExpandedChangeDetail,
  type TreeSelectionChangeDetail,
  type TreeSelectionMode,
} from './components/Tree'
export type { TypographyVariant } from './components/Typography'
export {
  MoulTypography,
  MoulTypography as Typography,
} from './components/Typography'

// Reusable Lit Reactive Controllers
export {
  type Breakpoint,
  CopyController,
  type CopyControllerOptions,
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

import type { MoulAccordion, MoulAccordionItem } from './components/Accordion'
import type { MoulAlert } from './components/Alert'
import type { MoulAlertDialog } from './components/AlertDialog'

// Phase 3: Data and developer
export {
  type ActivityEvent,
  type ActivityFeedExpandedChangeDetail,
  type ActivityFeedPauseChangeDetail,
  type ActivityFeedTimeFormat,
  MoulActivityFeed,
  MoulActivityFeed as ActivityFeed,
} from './components/ActivityFeed'
// Phase 4: AI kit
export {
  type AgentActivityExpandedChangeDetail,
  type AgentActivityOpenChangeDetail,
  type AgentStep,
  type AgentStepStatus,
  formatDuration,
  MoulAgentActivity,
  MoulAgentActivity as AgentActivity,
} from './components/AgentActivity'
export {
  type ChatAttachment,
  type ChatConversation,
  type ChatConversationSelectDetail,
  type ChatFeedbackChangeDetail,
  type ChatMessage,
  type ChatMessageEventDetail,
  type ChatMessageStatus,
  type ChatRole,
  type ChatSidebarChangeDetail,
  type ChatSuggestion,
  MoulChat,
  MoulChat as Chat,
} from './components/Chat'
export {
  type CodeBlockCopyDetail,
  type CodeBlockTab,
  type CodeBlockTabChangeDetail,
  MoulCodeBlock,
  MoulCodeBlock as CodeBlock,
} from './components/CodeBlock'
export {
  type CodeComparisonCopyDetail,
  type CodeComparisonLayout,
  type CodeComparisonSide,
  type DiffKind,
  type DiffLine,
  diffLines,
  MoulCodeComparison,
  MoulCodeComparison as CodeComparison,
} from './components/CodeComparison'
export {
  type FileTreeActionDetail,
  type FileTreeEntry,
  type FileTreeExpandedChangeDetail,
  type FileTreeNode,
  type FileTreeSelectionChangeDetail,
  type FileTreeSort,
  MoulFileTree,
  MoulFileTree as FileTree,
} from './components/FileTree'
export {
  type HistoryAuthor,
  type HistoryChange,
  type HistoryLedgerLabels,
  type HistoryRestoreDetail,
  type HistoryVersion,
  MoulHistoryLedger,
  MoulHistoryLedger as HistoryLedger,
} from './components/HistoryLedger'
export {
  MoulPromptInput,
  MoulPromptInput as PromptInput,
  type PromptAttachment,
  type PromptAttachmentRejectDetail,
  type PromptAttachmentsChangeDetail,
  type PromptModel,
  type PromptModelChangeDetail,
  type PromptSubmitDetail,
  type PromptSubmitKey,
} from './components/PromptInput'
export {
  describeRelationshipNode,
  type GraphDirection,
  type GraphLayout,
  layoutGraph,
  MoulRelationshipGraph,
  MoulRelationshipGraph as RelationshipGraph,
  type RelationshipGraphDirection,
  type RelationshipGraphLink,
  type RelationshipGraphNode,
  type RelationshipGraphNodeActionDetail,
  type RelationshipGraphRelations,
  type RelationshipGraphSelectionChangeDetail,
  type RelationshipGraphTrace,
  type RelationshipGraphTraceChangeDetail,
} from './components/RelationshipGraph'
export {
  MoulStreamingResponse,
  MoulStreamingResponse as StreamingResponse,
  type ResponseCopyDetail,
  type ResponseFeedback,
  type ResponseFeedbackChangeDetail,
  type ResponseSource,
} from './components/StreamingResponse'
export {
  MoulTerminal,
  MoulTerminal as Terminal,
  MoulTerminalLine,
  MoulTerminalLine as TerminalLine,
  type TerminalLineState,
  type TerminalLineTone,
} from './components/Terminal'
export {
  MoulThinkingIndicator,
  MoulThinkingIndicator as ThinkingIndicator,
  type ThinkingIndicatorSize,
} from './components/ThinkingIndicator'
export {
  MoulTimeline,
  MoulTimeline as Timeline,
  MoulTimelineItem,
  MoulTimelineItem as TimelineItem,
  type TimelineDensity,
  type TimelineItemStatus,
  type TimelineProgress,
} from './components/Timeline'
export {
  type CodeToken,
  type CodeTokenType,
  highlightLines,
  languageLabel,
  tokenize,
} from './utils/highlight'
export {
  type MarkdownBlock,
  type MarkdownInline,
  type MarkdownListItem,
  type MarkdownOptions,
  markdownToText,
  parseMarkdown,
  type TableAlign,
} from './utils/markdown'

import type { MoulActivityFeed } from './components/ActivityFeed'
// Custom Element Type Imports for Global HTMLElementTagNameMap
import type { MoulAgentActivity } from './components/AgentActivity'
import type { MoulAnimatedList } from './components/AnimatedList'
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
import type { MoulChat } from './components/Chat'
import type { MoulCheckbox, MoulCheckboxGroup } from './components/Checkbox'
import type { MoulCodeBlock } from './components/CodeBlock'
import type { MoulCodeComparison } from './components/CodeComparison'
import type { MoulComboBox, MoulComboBoxItem } from './components/ComboBox'
import type { MoulCommandPalette } from './components/CommandPalette'
import type { MoulDatePicker } from './components/DatePicker'
import type { MoulDoughnutChart } from './components/DoughnutChart'
import type { MoulDrawer } from './components/Drawer'
import type {
  MoulDropdownMenu,
  MoulMenuGroup,
  MoulMenuItem,
  MoulMenuSeparator,
} from './components/DropdownMenu'
import type { MoulEmptyState } from './components/EmptyState'
import type { MoulExpandableCard } from './components/ExpandableCard'
import type { MoulFileTree } from './components/FileTree'
import type { MoulFileUpload } from './components/FileUpload'
import type { MoulFocusMode } from './components/FocusMode'
import type { MoulForm } from './components/Form'
import type { MoulFunnelChart } from './components/FunnelChart'
import type { MoulHeatmapChart } from './components/HeatmapChart'
import type { MoulHistoryLedger } from './components/HistoryLedger'
import type { MoulHoverCard } from './components/HoverCard'
import type { MoulIconMorph } from './components/IconMorph'
import type { MoulInputOTP } from './components/InputOTP'
import type { MoulKbd } from './components/Kbd'
import type { MoulLineChart } from './components/LineChart'
import type { MoulLink } from './components/Link'
import type { MoulLogs, MoulLogsViewer } from './components/LogsViewer'
import type { MoulModal } from './components/Modal'
import type { MoulNotificationBell } from './components/NotificationBell'
import type { MoulNumberField } from './components/NumberField'
import type { MoulNumberTicker } from './components/NumberTicker'
import type { MoulPagination } from './components/Pagination'
import type {
  MoulPercentageBar,
  MoulPercentageCircle,
} from './components/Percentage'
import type { MoulPopover } from './components/Popover'
import type { MoulProgressBar } from './components/ProgressBar'
import type { MoulPromptInput } from './components/PromptInput'
import type { MoulPullToRefresh } from './components/PullToRefresh'
import type { MoulRadio, MoulRadioGroup } from './components/RadioGroup'
import type { MoulRelationshipGraph } from './components/RelationshipGraph'
import type { MoulResultCard } from './components/ResultCard'
import type { MoulSearchField } from './components/SearchField'
import type { MoulSelect, MoulSelectItem } from './components/Select'
import type { MoulSelectionToolbar } from './components/SelectionToolbar'
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
import type { MoulSlideToConfirm } from './components/SlideToConfirm'
import type { MoulSpinner } from './components/Spinner'
import type { MoulSplitButton } from './components/SplitButton'
import type { MoulStat } from './components/Stat'
import type { MoulStepLoader } from './components/StepLoader'
import type { MoulStep, MoulStepper } from './components/Stepper'
import type { MoulStreamingResponse } from './components/StreamingResponse'
import type { MoulSwitch } from './components/Switch'
import type { MoulTable } from './components/Table'
import type { MoulTab, MoulTabPanel, MoulTabs } from './components/Tabs'
import type { MoulTag, MoulTagGroup } from './components/TagGroup'
import type { MoulTerminal, MoulTerminalLine } from './components/Terminal'
import type { MoulTextArea } from './components/TextArea'
import type { MoulTextField } from './components/TextField'
import type { MoulThemeToggle } from './components/ThemeToggle'
import type { MoulThinkingIndicator } from './components/ThinkingIndicator'
import type { MoulTimeline, MoulTimelineItem } from './components/Timeline'
import type { MoulToast, MoulToastRegion } from './components/Toast'
import type { MoulToggleButton } from './components/ToggleButton'
import type { MoulToggleButtonGroup } from './components/ToggleButtonGroup'
import type { MoulTooltip } from './components/Tooltip'
import type { MoulTopList } from './components/TopList'
import type { MoulTour, MoulTourStep } from './components/Tour'
import type { MoulTree, MoulTreeItem } from './components/Tree'
import type { MoulTypography } from './components/Typography'

declare global {
  interface HTMLElementTagNameMap {
    // Phase 4: Actions & Toggle
    'moul-button': MoulButton
    'moul-button-group': MoulButtonGroup
    'moul-toggle-button': MoulToggleButton
    'moul-toggle-button-group': MoulToggleButtonGroup
    'moul-split-button': MoulSplitButton
    'moul-theme-toggle': MoulThemeToggle

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
    'moul-accordion': MoulAccordion
    'moul-accordion-item': MoulAccordionItem
    'moul-icon-morph': MoulIconMorph
    'moul-selection-toolbar': MoulSelectionToolbar

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
    'moul-dropdown-menu': MoulDropdownMenu
    'moul-menu-item': MoulMenuItem
    'moul-menu-group': MoulMenuGroup
    'moul-menu-separator': MoulMenuSeparator
    'moul-stepper': MoulStepper
    'moul-step': MoulStep
    'moul-tree': MoulTree
    'moul-tree-item': MoulTreeItem

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
    'moul-file-upload': MoulFileUpload

    // Phase 8: Charts & Data Visualization
    'moul-chart-container': MoulChartContainer
    'moul-chart-tooltip': MoulChartTooltip
    'moul-line-chart': MoulLineChart
    'moul-area-chart': MoulAreaChart
    'moul-bar-chart': MoulBarChart
    'moul-doughnut-chart': MoulDoughnutChart
    'moul-funnel-chart': MoulFunnelChart
    'moul-heatmap-chart': MoulHeatmapChart
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
    'moul-number-ticker': MoulNumberTicker
    'moul-step-loader': MoulStepLoader
    'moul-result-card': MoulResultCard
    'moul-animated-list': MoulAnimatedList
    'moul-notification-bell': MoulNotificationBell
    'moul-slide-to-confirm': MoulSlideToConfirm
    'moul-pull-to-refresh': MoulPullToRefresh
    'moul-hover-card': MoulHoverCard
    'moul-tour': MoulTour
    'moul-tour-step': MoulTourStep
    'moul-focus-mode': MoulFocusMode
    'moul-expandable-card': MoulExpandableCard
    'moul-timeline': MoulTimeline
    'moul-timeline-item': MoulTimelineItem
    'moul-history-ledger': MoulHistoryLedger
    'moul-activity-feed': MoulActivityFeed
    'moul-code-block': MoulCodeBlock
    'moul-code-comparison': MoulCodeComparison
    'moul-terminal': MoulTerminal
    'moul-terminal-line': MoulTerminalLine
    'moul-file-tree': MoulFileTree
    'moul-relationship-graph': MoulRelationshipGraph
    'moul-thinking-indicator': MoulThinkingIndicator
    'moul-streaming-response': MoulStreamingResponse
    'moul-agent-activity': MoulAgentActivity
    'moul-prompt-input': MoulPromptInput
    'moul-chat': MoulChat
  }
}
