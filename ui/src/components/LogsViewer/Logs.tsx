'use client'
import { Check, Copy, Export, Pause, Play, Trash } from '@phosphor-icons/react'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type Key,
} from 'react-aria-components'
import { Badge, type BadgeVariant } from '../Badge'
import { Button } from '../Button'
import { ButtonGroup } from '../ButtonGroup'
import { Card, CardBody, CardHeader } from '../Card'
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerDialog,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from '../Drawer'
import { SearchField } from '../SearchField'
import { ToggleButton } from '../ToggleButton'
import { ToggleButtonGroup } from '../ToggleButtonGroup'
import { styles } from './Logs.styles'
import type { LogFilterLevel, LogItem, LogLevel, LogsProps } from './Logs.types'
import { normalizeLogLevel, parseLogs } from './parseLogs'

// ── Log Level Badge Subcomponent ─────────────────────────────────────

export interface LogLevelBadgeProps {
  level?: LogLevel | string
  style?: StyleXStyles
  className?: string
}

export function LogLevelBadge({
  level = 'info',
  style,
  className,
}: LogLevelBadgeProps) {
  const normLevel = normalizeLogLevel(level)

  const levelVariantMap: Record<LogLevel, BadgeVariant> = {
    info: 'primary',
    warn: 'warning',
    error: 'error',
    fatal: 'error',
    debug: 'neutral',
    trace: 'neutral',
  }

  const variant = levelVariantMap[normLevel] || 'neutral'

  return (
    <Badge
      variant={variant}
      role="status"
      className={className}
      style={style}
      aria-label={`Level: ${normLevel}`}
      title={`Level: ${normLevel}`}
    >
      {normLevel.toUpperCase()}
    </Badge>
  )
}

// ── Floating Copy Icon Button Subcomponent ───────────────────────────

export interface LogCopyIconButtonProps {
  textToCopy: string
  label?: string
  onCopy?: (text: string) => void
  style?: StyleXStyles
}

export function LogCopyIconButton({
  textToCopy,
  label = 'Copy to clipboard',
  onCopy,
  style,
}: LogCopyIconButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
    }
    onCopy?.(textToCopy)
    setCopied(true)
  }

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => {
      setCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant={copied ? 'secondary' : 'ghost'}
      size="sm"
      isIcon
      onPress={handleCopy}
      aria-label={copied ? 'Copied!' : label}
      style={style}
    >
      {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
    </Button>
  )
}

// ── Attribute Chip Subcomponent ──────────────────────────────────────

export interface LogAttributeChipProps {
  name: string
  value: string | number | boolean | null | undefined
}

export function LogAttributeChip({ name, value }: LogAttributeChipProps) {
  if (value === undefined) return null

  const stringValue = String(value)
  const isErrorKey = name === 'error' || name === 'err'

  // If attribute is status code, render using status-specific style
  if (name === 'status' && typeof value === 'number') {
    const statusStyle =
      value >= 500
        ? styles.statusError
        : value >= 400
          ? styles.statusWarn
          : styles.statusSuccess

    return (
      <span {...stylex.props(styles.attributeChip)}>
        <span {...stylex.props(styles.attributeKey)}>status=</span>
        <span {...stylex.props(styles.attributeValue, statusStyle)}>
          {value}
        </span>
      </span>
    )
  }

  // If attribute is error, highlight cleanly within the chip container
  if (isErrorKey) {
    return (
      <span {...stylex.props(styles.attributeChip, styles.attributeChipError)}>
        <span {...stylex.props(styles.attributeKey, styles.attributeKeyError)}>
          {name}=
        </span>
        <span
          {...stylex.props(styles.attributeValue, styles.attributeValueError)}
        >
          {typeof value === 'string' ? `"${stringValue}"` : stringValue}
        </span>
      </span>
    )
  }

  return (
    <span {...stylex.props(styles.attributeChip)}>
      <span {...stylex.props(styles.attributeKey)}>{name}=</span>
      <span {...stylex.props(styles.attributeValue)}>
        {typeof value === 'string' && value.includes(' ')
          ? `"${stringValue}"`
          : stringValue}
      </span>
    </span>
  )
}

// ── Highlight Text Subcomponent ──────────────────────────────────────

export interface HighlightTextProps {
  text?: string | null
  highlight?: string
  enabled?: boolean
}

export function HighlightText({
  text,
  highlight,
  enabled = true,
}: HighlightTextProps) {
  if (!text) return null
  if (!enabled || !highlight || !highlight.trim()) {
    return <>{text}</>
  }

  const query = highlight.trim()
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          return (
            <mark
              key={index}
              {...stylex.props(styles.searchHighlight)}
              aria-label={`highlighted match: ${part}`}
            >
              {part}
            </mark>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </>
  )
}

// ── Main Logs Component ──────────────────────────────────────────────

export const Logs = React.forwardRef<HTMLDivElement, LogsProps>(function Logs(
  {
    data,
    text,
    title = 'Logs',
    showToolbar = true,
    showLineNumbers = true,
    showTimestamps = true,
    showLevels = true,
    showAttributes = true,
    inspectorMode = 'drawer',
    showInspector,
    isInspectorOpen: controlledIsInspectorOpen,
    defaultInspectorOpen = false,
    onInspectorOpenChange,
    drawerPlacement = 'right',
    drawerSize = 'md',
    onRowClick,
    compact = false,
    wrapLines = true,
    searchPlaceholder = 'Filter logs...',
    maxHeight,
    selectionMode = 'single',
    selectedKeys: controlledSelectedKeys,
    defaultSelectedKeys,
    onSelectionChange: controlledOnSelectionChange,
    filterLevel: controlledFilterLevel,
    defaultFilterLevel = 'all',
    onFilterLevelChange,
    searchQuery: controlledSearchQuery,
    defaultSearchQuery = '',
    onSearchQueryChange,
    onClear,
    onDownload,
    onCopy,
    follow: controlledFollow,
    defaultFollow = false,
    onFollowChange,
    showFollowButton = true,
    highlightMatches = true,
    style,
    className,
    'aria-label': ariaLabel = 'Logs Table',
    ...rest
  },
  ref,
) {
  // Resolve active inspector mode (support backwards-compat for showInspector)
  const resolvedInspectorMode = React.useMemo(() => {
    return inspectorMode ?? (showInspector === false ? 'none' : 'drawer')
  }, [inspectorMode, showInspector])

  // Parse logs from data or text prop
  const allLogs: LogItem[] = React.useMemo(() => {
    if (text) {
      return parseLogs(text)
    }
    if (data) {
      return parseLogs(data)
    }
    return []
  }, [data, text])
  const [internalDrawerOpen, setInternalDrawerOpen] =
    React.useState(defaultInspectorOpen)
  const isDrawerOpen =
    controlledIsInspectorOpen !== undefined
      ? controlledIsInspectorOpen
      : internalDrawerOpen

  const setDrawerOpen = (open: boolean) => {
    setInternalDrawerOpen(open)
    onInspectorOpenChange?.(open)
  }

  // Search state
  const [internalSearchQuery, setInternalSearchQuery] =
    React.useState(defaultSearchQuery)
  const searchQuery =
    controlledSearchQuery !== undefined
      ? controlledSearchQuery
      : internalSearchQuery

  const handleSearchChange = (query: string) => {
    setInternalSearchQuery(query)
    onSearchQueryChange?.(query)
  }

  // Level filter state
  const [internalFilterLevel, setInternalFilterLevel] =
    React.useState<LogFilterLevel>(defaultFilterLevel)
  const activeFilterLevel =
    controlledFilterLevel !== undefined
      ? controlledFilterLevel
      : internalFilterLevel

  const handleFilterLevelChange = (level: LogFilterLevel) => {
    setInternalFilterLevel(level)
    onFilterLevelChange?.(level)
  }

  // Live follow / auto-scroll state
  const [internalFollow, setInternalFollow] = React.useState(defaultFollow)
  const isFollow =
    controlledFollow !== undefined ? controlledFollow : internalFollow

  const isFollowRef = React.useRef(isFollow)
  isFollowRef.current = isFollow

  const lastScrollTopRef = React.useRef(0)
  const isUserInteractingRef = React.useRef(false)
  const userInteractTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  const markUserInteraction = React.useCallback(() => {
    isUserInteractingRef.current = true
    if (userInteractTimerRef.current) {
      clearTimeout(userInteractTimerRef.current)
    }
    userInteractTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false
    }, 300)
  }, [])

  const setIsFollow = React.useCallback(
    (nextFollow: boolean) => {
      if (isFollowRef.current === nextFollow) return
      isFollowRef.current = nextFollow
      setInternalFollow(nextFollow)
      onFollowChange?.(nextFollow)
    },
    [onFollowChange],
  )

  const tableScrollRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback((smooth = true) => {
    if (!tableScrollRef.current) return

    // Run in requestAnimationFrame so newly rendered rows are fully laid out and measured by browser
    requestAnimationFrame(() => {
      if (!tableScrollRef.current) return
      const el = tableScrollRef.current
      const target = el.scrollHeight
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      const behavior = smooth && !prefersReducedMotion ? 'smooth' : 'auto'

      if (typeof el.scrollTo === 'function') {
        el.scrollTo({
          top: target,
          behavior,
        })
      } else {
        el.scrollTop = target
      }
      lastScrollTopRef.current = target
    })
  }, [])

  // Scroll listener to pause follow ONLY when user manually scrolls up away from bottom
  const handleScroll = React.useCallback(() => {
    if (!tableScrollRef.current) return
    const el = tableScrollRef.current
    const currentScrollTop = el.scrollTop
    const maxScrollTop = el.scrollHeight - el.clientHeight
    const distanceFromBottom = Math.max(0, maxScrollTop - currentScrollTop)

    // User manually scrolled UP away from bottom: pause follow
    if (isFollowRef.current) {
      if (
        isUserInteractingRef.current &&
        currentScrollTop < lastScrollTopRef.current &&
        distanceFromBottom > 35
      ) {
        setIsFollow(false)
      }
    } else if (isUserInteractingRef.current && distanceFromBottom <= 5) {
      // User manually scrolled back down to the very bottom: auto-resume follow
      setIsFollow(true)
    }

    lastScrollTopRef.current = currentScrollTop
  }, [setIsFollow])

  const handleToggleFollow = (isSelected?: boolean) => {
    const next = typeof isSelected === 'boolean' ? isSelected : !isFollow
    setIsFollow(next)
    if (next) {
      scrollToBottom(true)
    }
  }

  // Selection state
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<
    'all' | Set<Key>
  >(() => {
    if (!defaultSelectedKeys) return new Set()
    if (defaultSelectedKeys === 'all') return 'all'
    return new Set(defaultSelectedKeys)
  })

  const selectedKeys =
    controlledSelectedKeys !== undefined
      ? controlledSelectedKeys
      : internalSelectedKeys

  const handleSelectionChange = (keys: 'all' | Set<Key>) => {
    setInternalSelectedKeys(keys)
    controlledOnSelectionChange?.(keys)

    // Open drawer when row is selected in drawer inspector mode
    if (resolvedInspectorMode === 'drawer' && keys !== 'all' && keys.size > 0) {
      setDrawerOpen(true)
    }
  }

  // Calculate level counts
  const levelCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: allLogs.length,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    }

    for (const log of allLogs) {
      const lvl = log.level || 'info'
      if (lvl === 'error' || lvl === 'fatal') {
        counts.error++
      } else if (counts[lvl] !== undefined) {
        counts[lvl]++
      }
    }

    return counts
  }, [allLogs])

  // Filter logs by search query and level
  const filteredLogs = React.useMemo(() => {
    return allLogs.filter((log) => {
      // Level filter
      if (activeFilterLevel !== 'all') {
        if (activeFilterLevel === 'error') {
          if (log.level !== 'error' && log.level !== 'fatal') return false
        } else if (log.level !== activeFilterLevel) {
          return false
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchMessage = log.message.toLowerCase().includes(query)
        const matchTimestamp = log.timestamp?.toLowerCase().includes(query)
        const matchRaw = log.raw?.toLowerCase().includes(query)
        const matchAttributes = log.attributes
          ? Object.entries(log.attributes).some(
              ([k, v]) =>
                k.toLowerCase().includes(query) ||
                String(v).toLowerCase().includes(query),
            )
          : false

        return matchMessage || matchTimestamp || matchRaw || matchAttributes
      }

      return true
    })
  }, [allLogs, activeFilterLevel, searchQuery])

  // Auto-scroll when new logs arrive if follow is active
  React.useEffect(() => {
    if (!isFollow || !tableScrollRef.current) return
    scrollToBottom()
  }, [filteredLogs, isFollow, scrollToBottom])

  // Find currently selected log item and its index
  const selectedLogItem = React.useMemo(() => {
    if (selectedKeys === 'all') return null
    if (!selectedKeys) return null
    let firstKey: Key | undefined
    if (selectedKeys instanceof Set) {
      if (selectedKeys.size === 0) return null
      firstKey = selectedKeys.values().next().value
    } else if (Array.isArray(selectedKeys)) {
      if (selectedKeys.length === 0) return null
      firstKey = selectedKeys[0]
    } else {
      const iter = (selectedKeys as Iterable<Key>)[Symbol.iterator]()
      const item = iter.next()
      if (item.done) return null
      firstKey = item.value
    }
    if (firstKey === undefined) return null
    return allLogs.find((l) => String(l.id) === String(firstKey)) || null
  }, [allLogs, selectedKeys])

  const selectedIndexInFiltered = React.useMemo(() => {
    if (!selectedLogItem) return -1
    return filteredLogs.findIndex((l) => l.id === selectedLogItem.id)
  }, [filteredLogs, selectedLogItem])

  // Navigate to previous/next log entry in inspector
  const handleNavigate = (delta: number) => {
    if (selectedIndexInFiltered === -1) return
    const newIdx = selectedIndexInFiltered + delta
    if (newIdx >= 0 && newIdx < filteredLogs.length) {
      const newLog = filteredLogs[newIdx]
      const newKeys = new Set([String(newLog.id)])
      setInternalSelectedKeys(newKeys)
      controlledOnSelectionChange?.(newKeys)
    }
  }

  // Copy entire filtered log output
  const [allCopied, setAllCopied] = React.useState(false)

  const handleCopyAll = () => {
    const logText = filteredLogs
      .map(
        (l) =>
          l.raw ||
          `${l.timestamp ? `${l.timestamp} ` : ''}${l.level?.toUpperCase()} ${l.message}`,
      )
      .join('\n')

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(logText)
    }
    onCopy?.(logText)
    setAllCopied(true)
  }

  React.useEffect(() => {
    if (!allCopied) return
    const timer = setTimeout(() => {
      setAllCopied(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [allCopied])

  // Copy selected JSON representation
  const handleCopySelectedJSON = () => {
    if (!selectedLogItem) return
    const jsonStr = JSON.stringify(selectedLogItem, null, 2)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr)
    }
    onCopy?.(jsonStr)
  }

  // Download logs as text file
  const handleDownload = () => {
    if (onDownload) {
      onDownload()
      return
    }
    const logText = filteredLogs
      .map(
        (l) =>
          l.raw ||
          `${l.timestamp ? `${l.timestamp} ` : ''}${l.level?.toUpperCase()} ${l.message}`,
      )
      .join('\n')

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${new Date().toISOString().slice(0, 10)}.log`
    link.click()
    URL.revokeObjectURL(url)
  }

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.container,
    style,
  )

  // Precompute static and semi-static StyleX props to prevent double-computations during table renders
  const tableProps = React.useMemo(() => stylex.props(styles.table), [])
  const headerProps = React.useMemo(() => stylex.props(styles.header), [])
  const bodyProps = React.useMemo(() => stylex.props(styles.body), [])

  const columnLineNumberProps = React.useMemo(
    () =>
      stylex.props(
        styles.column,
        compact && styles.columnCompact,
        styles.columnLineNumber,
      ),
    [compact],
  )
  const columnTimestampProps = React.useMemo(
    () =>
      stylex.props(
        styles.column,
        compact && styles.columnCompact,
        styles.columnTimestamp,
      ),
    [compact],
  )
  const columnLevelProps = React.useMemo(
    () =>
      stylex.props(
        styles.column,
        compact && styles.columnCompact,
        styles.columnLevel,
      ),
    [compact],
  )
  const columnMessageProps = React.useMemo(
    () =>
      stylex.props(
        styles.column,
        compact && styles.columnCompact,
        styles.columnMessage,
      ),
    [compact],
  )
  const columnActionsProps = React.useMemo(
    () =>
      stylex.props(
        styles.column,
        compact && styles.columnCompact,
        styles.columnActions,
      ),
    [compact],
  )

  const cellLineNumberProps = React.useMemo(
    () =>
      stylex.props(
        styles.cell,
        compact && styles.cellCompact,
        styles.cellLineNumber,
      ),
    [compact],
  )
  const cellTimestampProps = React.useMemo(
    () =>
      stylex.props(
        styles.cell,
        compact && styles.cellCompact,
        styles.cellTimestamp,
      ),
    [compact],
  )
  const cellLevelProps = React.useMemo(
    () =>
      stylex.props(
        styles.cell,
        compact && styles.cellCompact,
        styles.cellLevel,
      ),
    [compact],
  )
  const cellMessageProps = React.useMemo(
    () =>
      stylex.props(
        styles.cell,
        compact && styles.cellCompact,
        styles.cellMessage,
        wrapLines ? styles.cellWrap : styles.cellNoWrap,
      ),
    [compact, wrapLines],
  )
  const cellActionsProps = React.useMemo(
    () =>
      stylex.props(
        styles.cell,
        compact && styles.cellCompact,
        styles.cellActions,
      ),
    [compact],
  )

  const filterLevels: { key: LogFilterLevel; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'error', label: 'Errors' },
    { key: 'warn', label: 'Warnings' },
    { key: 'info', label: 'Info' },
    { key: 'debug', label: 'Debug' },
  ]

  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {/* ── Top Toolbar ── */}
      {showToolbar && (
        <div {...stylex.props(styles.toolbar)}>
          {/* Header Row: Title & Action Controls */}
          <div {...stylex.props(styles.toolbarRow)}>
            <div {...stylex.props(styles.titleGroup)}>
              {typeof title === 'string' ? (
                <h3 {...stylex.props(styles.title)}>{title}</h3>
              ) : (
                title
              )}
              <Badge variant="neutral">
                {filteredLogs.length} / {allLogs.length} events
              </Badge>
            </div>

            <div {...stylex.props(styles.actionsGroup)}>
              <ButtonGroup>
                {showFollowButton && (
                  <ToggleButton
                    isSelected={isFollow}
                    onChange={handleToggleFollow}
                    isIcon
                    aria-label={
                      isFollow ? 'Pause live follow' : 'Follow latest logs'
                    }
                  >
                    {isFollow ? (
                      <Pause size={18} weight="fill" />
                    ) : (
                      <Play size={18} weight="regular" />
                    )}
                  </ToggleButton>
                )}

                <Button
                  variant="secondary"
                  isIcon
                  onPress={handleCopyAll}
                  aria-label={
                    allCopied ? 'Copied all logs!' : 'Copy filtered logs'
                  }
                >
                  {allCopied ? (
                    <Check size={18} weight="bold" />
                  ) : (
                    <Copy size={18} />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  isIcon
                  onPress={handleDownload}
                  aria-label="Export logs"
                >
                  <Export size={18} />
                </Button>

                {onClear && (
                  <Button
                    variant="ghost"
                    isIcon
                    onPress={onClear}
                    aria-label="Clear logs"
                  >
                    <Trash size={18} />
                  </Button>
                )}
              </ButtonGroup>
            </div>
          </div>

          {/* Controls Row: Search input & Level filter pills */}
          <div {...stylex.props(styles.controlsRow)}>
            <div {...stylex.props(styles.searchContainer)}>
              <SearchField
                aria-label="Filter logs"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <ToggleButtonGroup
              aria-label="Filter by level"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([activeFilterLevel])}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as LogFilterLevel
                if (key) {
                  handleFilterLevelChange(key)
                }
              }}
              style={styles.filterGroup}
            >
              {filterLevels.map(({ key, label }) => {
                const count = levelCounts[key] || 0
                const isActive = activeFilterLevel === key

                const countVariant: BadgeVariant = isActive
                  ? key === 'error'
                    ? 'error'
                    : key === 'warn'
                      ? 'warning'
                      : 'primary'
                  : 'neutral'

                return (
                  <ToggleButton
                    key={key}
                    id={key}
                    aria-label={`${label} (${count})`}
                  >
                    <span>{label}</span>
                    <Badge variant={countVariant}>{count}</Badge>
                  </ToggleButton>
                )
              })}
            </ToggleButtonGroup>
          </div>
        </div>
      )}

      {/* ── Screen Reader Live Region for Log Arrivals ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        {...stylex.props(styles.visuallyHidden)}
      >
        {isFollow
          ? `${filteredLogs.length} logs total, streaming live`
          : `${filteredLogs.length} logs displayed`}
      </div>

      {/* ── Table Container ── */}
      <div
        ref={tableScrollRef}
        onScroll={handleScroll}
        onWheel={markUserInteraction}
        onTouchMove={markUserInteraction}
        onPointerDown={markUserInteraction}
        onKeyDown={markUserInteraction}
        {...stylex.props(styles.tableScrollContainer)}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <AriaTable
          aria-label={ariaLabel}
          selectionMode={selectionMode}
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          className={tableProps.className}
          style={tableProps.style}
        >
          <AriaTableHeader
            className={headerProps.className}
            style={headerProps.style}
          >
            {showLineNumbers && (
              <AriaColumn
                isRowHeader
                className={columnLineNumberProps.className}
                style={columnLineNumberProps.style}
              >
                #
              </AriaColumn>
            )}

            {showTimestamps && (
              <AriaColumn
                className={columnTimestampProps.className}
                style={columnTimestampProps.style}
              >
                Timestamp
              </AriaColumn>
            )}

            {showLevels && (
              <AriaColumn
                className={columnLevelProps.className}
                style={columnLevelProps.style}
              >
                Level
              </AriaColumn>
            )}

            <AriaColumn
              isRowHeader={!showLineNumbers}
              className={columnMessageProps.className}
              style={columnMessageProps.style}
            >
              Message
            </AriaColumn>

            <AriaColumn
              className={columnActionsProps.className}
              style={columnActionsProps.style}
            >
              <span className="sr-only">Actions</span>
            </AriaColumn>
          </AriaTableHeader>

          <AriaTableBody
            items={filteredLogs}
            className={bodyProps.className}
            style={bodyProps.style}
          >
            {(log) => {
              const isError = log.level === 'error'
              const isWarn = log.level === 'warn'
              const isFatal = log.level === 'fatal'

              let lastRenderState: {
                isHovered?: boolean
                isSelected?: boolean
                isFocused?: boolean
              } | null = null
              let cachedRowProps: {
                className?: string
                style?: React.CSSProperties
              } = {}

              const getRowStyleProps = (renderProps: {
                isHovered: boolean
                isSelected: boolean
                isFocused: boolean
              }) => {
                if (
                  lastRenderState &&
                  lastRenderState.isHovered === renderProps.isHovered &&
                  lastRenderState.isSelected === renderProps.isSelected &&
                  lastRenderState.isFocused === renderProps.isFocused
                ) {
                  return cachedRowProps
                }
                lastRenderState = {
                  isHovered: renderProps.isHovered,
                  isSelected: renderProps.isSelected,
                  isFocused: renderProps.isFocused,
                }
                cachedRowProps = stylex.props(
                  styles.row,
                  isError && styles.rowError,
                  isWarn && styles.rowWarn,
                  isFatal && styles.rowFatal,
                  renderProps.isHovered && styles.rowHovered,
                  renderProps.isSelected && styles.rowSelected,
                  renderProps.isFocused && styles.rowFocused,
                )
                return cachedRowProps
              }

              return (
                <AriaRow
                  id={String(log.id)}
                  key={String(log.id)}
                  onAction={() => {
                    onRowClick?.(log)
                    if (resolvedInspectorMode === 'drawer') {
                      setDrawerOpen(true)
                    }
                  }}
                  className={(renderProps) =>
                    getRowStyleProps(renderProps).className || ''
                  }
                  style={(renderProps) =>
                    getRowStyleProps(renderProps).style || {}
                  }
                >
                  {showLineNumbers && (
                    <AriaCell
                      className={cellLineNumberProps.className}
                      style={cellLineNumberProps.style}
                    >
                      {log.lineNumber}
                    </AriaCell>
                  )}

                  {showTimestamps && (
                    <AriaCell
                      className={cellTimestampProps.className}
                      style={cellTimestampProps.style}
                    >
                      {log.timestamp || '—'}
                    </AriaCell>
                  )}

                  {showLevels && (
                    <AriaCell
                      className={cellLevelProps.className}
                      style={cellLevelProps.style}
                    >
                      <LogLevelBadge level={log.level} />
                    </AriaCell>
                  )}

                  <AriaCell
                    className={cellMessageProps.className}
                    style={cellMessageProps.style}
                  >
                    <div
                      {...stylex.props(
                        styles.messageContent,
                        !wrapLines && styles.messageContentNoWrap,
                      )}
                    >
                      <span {...stylex.props(styles.messageText)}>
                        <HighlightText
                          text={log.message}
                          highlight={searchQuery}
                          enabled={highlightMatches}
                        />
                      </span>

                      {/* Render key-value attribute chips */}
                      {showAttributes && log.attributes && (
                        <div
                          {...stylex.props(
                            styles.attributeList,
                            !wrapLines && styles.attributeListNoWrap,
                          )}
                        >
                          {Object.entries(log.attributes).map(([key, val]) => (
                            <LogAttributeChip
                              key={key}
                              name={key}
                              value={val}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </AriaCell>

                  <AriaCell
                    className={cellActionsProps.className}
                    style={cellActionsProps.style}
                  >
                    {resolvedInspectorMode === 'drawer' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Inspect line #${log.lineNumber}`}
                        onPress={() => {
                          setInternalSelectedKeys(new Set([String(log.id)]))
                          controlledOnSelectionChange?.(
                            new Set([String(log.id)]),
                          )
                          setDrawerOpen(true)
                        }}
                      >
                        Inspect
                      </Button>
                    )}
                  </AriaCell>
                </AriaRow>
              )
            }}
          </AriaTableBody>
        </AriaTable>

        {/* Empty state when no logs match */}
        {filteredLogs.length === 0 && (
          <div {...stylex.props(styles.emptyState)}>
            <svg
              viewBox="0 0 24 24"
              width="32"
              height="32"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span {...stylex.props(styles.emptyStateText)}>
              {allLogs.length === 0
                ? 'No log entries found'
                : 'No logs match your filter criteria'}
            </span>
          </div>
        )}
      </div>

      {/* ── Inline Inspector Mode ── */}
      {resolvedInspectorMode === 'inline' && selectedLogItem && (
        <div {...stylex.props(styles.inspector)}>
          <div {...stylex.props(styles.inspectorHeader)}>
            <h4 {...stylex.props(styles.inspectorTitle)}>
              Log Inspector (Line #{selectedLogItem.lineNumber})
            </h4>
            <LogCopyIconButton
              textToCopy={selectedLogItem.raw || selectedLogItem.message}
              label="Copy raw log line"
              onCopy={onCopy}
            />
          </div>

          <div {...stylex.props(styles.inspectorGrid)}>
            {selectedLogItem.timestamp && (
              <div {...stylex.props(styles.inspectorItem)}>
                <span {...stylex.props(styles.inspectorItemKey)}>
                  Timestamp
                </span>
                <span {...stylex.props(styles.inspectorItemValue)}>
                  {selectedLogItem.timestamp}
                </span>
              </div>
            )}

            <div {...stylex.props(styles.inspectorItem)}>
              <span {...stylex.props(styles.inspectorItemKey)}>Level</span>
              <span {...stylex.props(styles.inspectorItemValue)}>
                <LogLevelBadge level={selectedLogItem.level} />
              </span>
            </div>

            <div {...stylex.props(styles.inspectorItem)}>
              <span {...stylex.props(styles.inspectorItemKey)}>Message</span>
              <span {...stylex.props(styles.inspectorItemValue)}>
                <HighlightText
                  text={selectedLogItem.message}
                  highlight={searchQuery}
                  enabled={highlightMatches}
                />
              </span>
            </div>

            {selectedLogItem.attributes &&
              Object.entries(selectedLogItem.attributes).map(([k, v]) => (
                <div key={k} {...stylex.props(styles.inspectorItem)}>
                  <span {...stylex.props(styles.inspectorItemKey)}>{k}</span>
                  <span {...stylex.props(styles.inspectorItemValue)}>
                    {k === 'status' && typeof v === 'number' ? (
                      <Badge
                        variant={
                          v >= 500 ? 'error' : v >= 400 ? 'warning' : 'success'
                        }
                      >
                        {v}
                      </Badge>
                    ) : k === 'error' || k === 'err' ? (
                      <Badge variant="error">{String(v)}</Badge>
                    ) : (
                      String(v)
                    )}
                  </span>
                </div>
              ))}
          </div>

          {selectedLogItem.raw && (
            <div>
              <span
                {...stylex.props(styles.inspectorItemKey)}
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Raw Line
              </span>
              <pre {...stylex.props(styles.rawCodeBlock)}>
                <HighlightText
                  text={selectedLogItem.raw}
                  highlight={searchQuery}
                  enabled={highlightMatches}
                />
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Drawer Inspector Mode ── */}
      {resolvedInspectorMode === 'drawer' && selectedLogItem && (
        <DrawerOverlay
          isOpen={isDrawerOpen}
          onOpenChange={setDrawerOpen}
          placement={drawerPlacement}
          size={drawerSize}
        >
          <Drawer placement={drawerPlacement} size={drawerSize}>
            <DrawerDialog>
              {/* Single-line Compact Drawer Header */}
              <DrawerHeader>
                <div {...stylex.props(styles.drawerHeaderSingleLine)}>
                  <div {...stylex.props(styles.drawerHeaderTitleGroup)}>
                    <DrawerTitle>Log #{selectedLogItem.lineNumber}</DrawerTitle>
                    <LogLevelBadge level={selectedLogItem.level} />
                    {selectedLogItem.timestamp && (
                      <span {...stylex.props(styles.drawerHeaderTimestamp)}>
                        {selectedLogItem.timestamp}
                      </span>
                    )}
                    {selectedIndexInFiltered !== -1 && (
                      <Badge variant="neutral">
                        {selectedIndexInFiltered + 1} / {filteredLogs.length}
                      </Badge>
                    )}
                  </div>
                  <DrawerCloseButton aria-label="Close log inspector" />
                </div>
              </DrawerHeader>

              <DrawerBody>
                <div {...stylex.props(styles.drawerBodyContent)}>
                  {/* Card Section 1: Message */}
                  <Card variant="default" size="sm" divided>
                    <CardHeader style={styles.cardHeaderFlex}>
                      <span {...stylex.props(styles.drawerSectionTitle)}>
                        Message
                      </span>
                      <LogCopyIconButton
                        textToCopy={selectedLogItem.message}
                        label="Copy message"
                        onCopy={onCopy}
                      />
                    </CardHeader>
                    <CardBody>
                      <div {...stylex.props(styles.rawCodeBlock)}>
                        <HighlightText
                          text={selectedLogItem.message}
                          highlight={searchQuery}
                          enabled={highlightMatches}
                        />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Card Section 2: Structured Attributes */}
                  {selectedLogItem.attributes &&
                    Object.keys(selectedLogItem.attributes).length > 0 && (
                      <Card variant="default" size="sm" divided>
                        <CardHeader style={styles.cardHeaderFlex}>
                          <span {...stylex.props(styles.drawerSectionTitle)}>
                            Structured Fields (
                            {Object.keys(selectedLogItem.attributes).length})
                          </span>
                          <LogCopyIconButton
                            textToCopy={JSON.stringify(
                              selectedLogItem.attributes,
                              null,
                              2,
                            )}
                            label="Copy structured fields"
                            onCopy={onCopy}
                          />
                        </CardHeader>
                        <CardBody style={styles.cardBodyFlush}>
                          <div {...stylex.props(styles.drawerAttrTable)}>
                            {Object.entries(selectedLogItem.attributes).map(
                              ([key, val]) => (
                                <div
                                  key={key}
                                  {...stylex.props(styles.drawerAttrRow)}
                                >
                                  <span {...stylex.props(styles.drawerAttrKey)}>
                                    {key}
                                  </span>
                                  <span {...stylex.props(styles.drawerAttrVal)}>
                                    {key === 'status' &&
                                    typeof val === 'number' ? (
                                      <Badge
                                        variant={
                                          val >= 500
                                            ? 'error'
                                            : val >= 400
                                              ? 'warning'
                                              : 'success'
                                        }
                                      >
                                        {val}
                                      </Badge>
                                    ) : key === 'error' || key === 'err' ? (
                                      <Badge variant="error">
                                        {String(val)}
                                      </Badge>
                                    ) : (
                                      String(val)
                                    )}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    )}

                  {/* Card Section 3: Raw Log Output */}
                  {selectedLogItem.raw && (
                    <Card variant="default" size="sm" divided>
                      <CardHeader style={styles.cardHeaderFlex}>
                        <span {...stylex.props(styles.drawerSectionTitle)}>
                          Raw Log Output
                        </span>
                        <LogCopyIconButton
                          textToCopy={selectedLogItem.raw}
                          label="Copy raw log line"
                          onCopy={onCopy}
                        />
                      </CardHeader>
                      <CardBody>
                        <pre {...stylex.props(styles.rawCodeBlock)}>
                          <HighlightText
                            text={selectedLogItem.raw}
                            highlight={searchQuery}
                            enabled={highlightMatches}
                          />
                        </pre>
                      </CardBody>
                    </Card>
                  )}

                  {/* Card Section 4: JSON Payload */}
                  <Card variant="default" size="sm" divided>
                    <CardHeader style={styles.cardHeaderFlex}>
                      <span {...stylex.props(styles.drawerSectionTitle)}>
                        JSON Object
                      </span>
                      <LogCopyIconButton
                        textToCopy={JSON.stringify(selectedLogItem, null, 2)}
                        label="Copy JSON"
                        onCopy={onCopy}
                      />
                    </CardHeader>
                    <CardBody>
                      <pre {...stylex.props(styles.rawCodeBlock)}>
                        {JSON.stringify(selectedLogItem, null, 2)}
                      </pre>
                    </CardBody>
                  </Card>
                </div>
              </DrawerBody>

              <DrawerFooter>
                <div {...stylex.props(styles.drawerFooterWrap)}>
                  <ButtonGroup>
                    <Button
                      variant="secondary"
                      size="sm"
                      isDisabled={selectedIndexInFiltered <= 0}
                      onPress={() => handleNavigate(-1)}
                      aria-label="Previous log"
                    >
                      ← Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      isDisabled={
                        selectedIndexInFiltered >= filteredLogs.length - 1 ||
                        selectedIndexInFiltered === -1
                      }
                      onPress={() => handleNavigate(1)}
                      aria-label="Next log"
                    >
                      Next →
                    </Button>
                  </ButtonGroup>

                  <ButtonGroup>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleCopySelectedJSON}
                    >
                      Copy JSON
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => setDrawerOpen(false)}
                    >
                      Done
                    </Button>
                  </ButtonGroup>
                </div>
              </DrawerFooter>
            </DrawerDialog>
          </Drawer>
        </DrawerOverlay>
      )}
    </div>
  )
})

export const LogsViewer = Logs
