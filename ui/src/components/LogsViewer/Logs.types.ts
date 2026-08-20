import type { StyleXStyles } from '@stylexjs/stylex'
import type * as React from 'react'
import type { Key } from 'react-aria-components'

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogItem {
  id: string | number
  timestamp?: string
  level?: LogLevel | string
  message: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  raw?: string
  lineNumber?: number
}

export type LogFilterLevel = LogLevel | 'all'

export interface LogsProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'style' | 'title' | 'onCopy'
  > {
  /**
   * Array of parsed log items or raw log strings.
   */
  data?: (LogItem | string)[]
  /**
   * Raw multiline text containing log lines (e.g. from server.log).
   */
  text?: string
  /**
   * Optional title shown in the log header toolbar.
   */
  title?: React.ReactNode
  /**
   * Whether to show the top toolbar with search, filters, and actions.
   * @default true
   */
  showToolbar?: boolean
  /**
   * Whether to show line numbers in the table.
   * @default true
   */
  showLineNumbers?: boolean
  /**
   * Whether to show timestamps.
   * @default true
   */
  showTimestamps?: boolean
  /**
   * Whether to show severity level badges.
   * @default true
   */
  showLevels?: boolean
  /**
   * Whether to render structured attribute chips in the message cell.
   * @default true
   */
  showAttributes?: boolean
  /**
   * How the inspector panel is displayed when a log row is selected.
   * - 'drawer': opens a slide-out drawer from the side/bottom
   * - 'inline': renders an inline details panel beneath the table
   * - 'none': disables the inspector
   * @default 'drawer'
   */
  inspectorMode?: 'drawer' | 'inline' | 'none'
  /**
   * Whether to show an inspector / details panel for selected log rows.
   * @deprecated Use `inspectorMode` instead.
   */
  showInspector?: boolean
  /**
   * Controlled open state for the drawer inspector.
   */
  isInspectorOpen?: boolean
  /**
   * Default open state for the drawer inspector (initial uncontrolled state).
   * Note: Changing this prop post-mount does not reset internal state; use `isInspectorOpen` for controlled state.
   * @default false
   */
  defaultInspectorOpen?: boolean
  /**
   * Callback fired when the drawer inspector opens or closes.
   */
  onInspectorOpenChange?: (isOpen: boolean) => void
  /**
   * Drawer placement direction when inspectorMode is 'drawer'.
   * @default 'right'
   */
  drawerPlacement?: 'top' | 'bottom' | 'left' | 'right'
  /**
   * Drawer size when inspectorMode is 'drawer'.
   * @default 'md'
   */
  drawerSize?: 'sm' | 'md' | 'lg' | 'full'
  /**
   * Callback fired when a log row is clicked.
   */
  onRowClick?: (log: LogItem) => void
  /**
   * Display logs in a compact table density.
   * @default false
   */
  compact?: boolean
  /**
   * Wrap long log message lines instead of truncating with ellipsis.
   * @default true
   */
  wrapLines?: boolean
  /**
   * Search input placeholder.
   * @default 'Filter logs...'
   */
  searchPlaceholder?: string
  /**
   * Maximum height of the scrollable logs container.
   */
  maxHeight?: string | number
  /**
   * React Aria Table selection mode.
   * @default 'single'
   */
  selectionMode?: 'none' | 'single' | 'multiple'
  /**
   * Currently selected log keys.
   */
  selectedKeys?: 'all' | Iterable<Key>
  /**
   * Default selected log keys (initial uncontrolled state).
   * Note: Changing this prop post-mount does not reset internal state; use `selectedKeys` for controlled state.
   */
  defaultSelectedKeys?: 'all' | Iterable<Key>
  /**
   * Handler fired when row selection changes.
   */
  onSelectionChange?: (keys: 'all' | Set<Key>) => void
  /**
   * Controlled filter level.
   */
  filterLevel?: LogFilterLevel
  /**
   * Default filter level (initial uncontrolled state).
   * Note: Changing this prop post-mount does not reset internal state; use `filterLevel` for controlled state.
   * @default 'all'
   */
  defaultFilterLevel?: LogFilterLevel
  /**
   * Callback fired when active filter level changes.
   */
  onFilterLevelChange?: (level: LogFilterLevel) => void
  /**
   * Controlled search query.
   */
  searchQuery?: string
  /**
   * Default search query (initial uncontrolled state).
   * Note: Changing this prop post-mount does not reset internal state; use `searchQuery` for controlled state.
   */
  defaultSearchQuery?: string
  /**
   * Callback fired when search query changes.
   */
  onSearchQueryChange?: (query: string) => void
  /**
   * Callback fired when the clear button is pressed.
   */
  onClear?: () => void
  /**
   * Callback fired when download logs button is pressed.
   */
  onDownload?: () => void
  /**
   * Callback fired when copy button is pressed.
   */
  onCopy?: (text: string) => void
  /**
   * Controlled follow / auto-scroll mode to tail the latest logs.
   */
  follow?: boolean
  /**
   * Default follow / auto-scroll state (initial uncontrolled state).
   * Note: Changing this prop post-mount does not reset internal state; use `follow` for controlled state.
   * @default false
   */
  defaultFollow?: boolean
  /**
   * Callback fired when follow / auto-scroll state changes (e.g. paused when scrolled up).
   */
  onFollowChange?: (follow: boolean) => void
  /**
   * Whether to show the Follow toggle button in the top toolbar.
   * @default true
   */
  showFollowButton?: boolean
  /**
   * Whether to highlight search term matches in log messages and inspector.
   * @default true
   */
  highlightMatches?: boolean
  /**
   * Custom StyleX styles.
   */
  style?: StyleXStyles
  /**
   * Custom CSS class name.
   */
  className?: string
  /**
   * Accessible label for the table.
   * @default 'Server Logs'
   */
  'aria-label'?: string
}

export type LogsViewerProps = LogsProps

