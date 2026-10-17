export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogItem {
  id: string | number
  lineNumber?: number
  timestamp?: string
  level?: LogLevel | string
  message: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  raw?: string
}

export type LogFilterLevel = LogLevel | 'all'

export interface LogsViewerProps {
  /**
   * Array of parsed log items.
   */
  logs?: LogItem[]

  /**
   * Filter level to display ('all', 'info', 'warn', 'error', 'debug', etc.).
   * @default 'all'
   */
  filterLevel?: LogFilterLevel

  /**
   * Text search query to filter messages and attributes.
   * @default ''
   */
  searchQuery?: string

  /**
   * Whether to display the timestamp column.
   * @default true
   */
  showTimestamps?: boolean

  /**
   * Whether to display the line numbers column.
   * @default true
   */
  showLineNumbers?: boolean

  /**
   * Whether to display the level badge column.
   * @default true
   */
  showLevels?: boolean

  /**
   * Whether to display the top toolbar with search and filter controls.
   * @default true
   */
  showToolbar?: boolean

  /**
   * Whether to wrap long log lines or allow horizontal scrolling.
   * @default false
   */
  wrapLines?: boolean

  /**
   * Whether to render with compact row height.
   * @default false
   */
  compact?: boolean

  /**
   * Whether virtualized scrolling is enabled for large datasets.
   * @default true
   */
  virtualized?: boolean

  /**
   * Maximum height of the scroll container (e.g. '600px').
   * @default '600px'
   */
  maxHeight?: string

  /**
   * The identifier of the currently selected log row.
   */
  selectedId?: string | number | null

  /**
   * Whether the attribute inspector drawer/panel is currently open.
   * @default false
   */
  isInspectorOpen?: boolean

  /**
   * Optional custom title for the toolbar.
   */
  title?: string

  /**
   * Placeholder string for search input.
   * @default 'Filter logs...'
   */
  searchPlaceholder?: string
}

export type LogsProps = LogsViewerProps

export interface MoulLogsViewerElement
  extends HTMLElement,
    Omit<LogsViewerProps, 'title'> {
  title: string
}

export interface MoulLogsElement extends HTMLElement {
  raw: string
  filterLevel: LogFilterLevel
  searchQuery: string
  showTimestamps: boolean
  wrapLines: boolean
  showToolbar: boolean
  showLineNumbers: boolean
  showLevels: boolean
  compact: boolean
  virtualized: boolean
  maxHeight: string
}

// Backward-compatibility interfaces (zero React/StyleX)
export interface HighlightTextProps {
  text: string
  query?: string
}

export interface LogAttributeChipProps {
  name: string
  value: string | number | boolean | null | undefined
}

export interface LogLevelBadgeProps {
  level?: LogLevel | string
}

export interface LogCopyIconButtonProps {
  content?: string
  label?: string
}
