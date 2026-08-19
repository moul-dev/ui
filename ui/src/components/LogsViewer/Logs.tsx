'use client'
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
import { Check, Copy, Export, Pause, Play, Trash } from '@phosphor-icons/react'
import { SearchField } from '../SearchField'
import { ToggleButton } from '../ToggleButton'
import { styles } from './Logs.styles'
import type { LogFilterLevel, LogItem, LogLevel, LogsProps } from './Logs.types'
import { parseLogs } from './parseLogs'

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
  const normLevel = (level as LogLevel) || 'info'

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

  // If attribute is status code, render using Badge component
  if (name === 'status' && typeof value === 'number') {
    const badgeVariant: BadgeVariant =
      value >= 500 ? 'error' : value >= 400 ? 'warning' : 'success'

    return (
      <span {...stylex.props(styles.attributeChip)}>
        <span {...stylex.props(styles.attributeKey)}>status=</span>
        <Badge variant={badgeVariant}>{value}</Badge>
      </span>
    )
  }

  // If attribute is error, highlight with error badge or text
  if (isErrorKey) {
    return (
      <span {...stylex.props(styles.attributeChip, styles.attributeChipError)}>
        <span {...stylex.props(styles.attributeKey)}>error=</span>
        <Badge variant="error">"{stringValue}"</Badge>
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
  const resolvedInspectorMode =
    inspectorMode ?? (showInspector === false ? 'none' : 'drawer')

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

  const setIsFollow = React.useCallback(
    (nextFollow: boolean) => {
      setInternalFollow(nextFollow)
      onFollowChange?.(nextFollow)
    },
    [onFollowChange],
  )

  const tableScrollRef = React.useRef<HTMLDivElement>(null)

  // Scroll listener to pause follow when scrolled up
  const handleScroll = React.useCallback(() => {
    if (!tableScrollRef.current || !isFollow) return
    const el = tableScrollRef.current
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom > 35) {
      setIsFollow(false)
    }
  }, [isFollow, setIsFollow])

  const handleToggleFollow = (isSelected?: boolean) => {
    const next = typeof isSelected === 'boolean' ? isSelected : !isFollow
    setIsFollow(next)
    if (next && tableScrollRef.current) {
      if (typeof tableScrollRef.current.scrollTo === 'function') {
        tableScrollRef.current.scrollTo({
          top: tableScrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      } else {
        tableScrollRef.current.scrollTop = tableScrollRef.current.scrollHeight
      }
    }
  }

  // Selection state
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<
    'all' | Set<Key>
  >(
    defaultSelectedKeys
      ? defaultSelectedKeys === 'all'
        ? 'all'
        : new Set(defaultSelectedKeys)
      : new Set(),
  )

  const selectedKeys =
    controlledSelectedKeys !== undefined
      ? controlledSelectedKeys === 'all'
        ? 'all'
        : new Set(controlledSelectedKeys)
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
    const el = tableScrollRef.current
    el.scrollTop = el.scrollHeight
  }, [filteredLogs, isFollow])

  // Find currently selected log item and its index
  const selectedLogItem = React.useMemo(() => {
    if (selectedKeys === 'all' || selectedKeys.size === 0) return null
    const firstKey = Array.from(selectedKeys)[0]
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
                variant="secondary"
              />
            </div>

            <div
              {...stylex.props(styles.filterGroup)}
              role="group"
              aria-label="Filter by level"
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
                    isSelected={isActive}
                    onChange={() => handleFilterLevelChange(key)}
                  >
                    <span>{label}</span>
                    <Badge variant={countVariant}>{count}</Badge>
                  </ToggleButton>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <div
        ref={tableScrollRef}
        onScroll={handleScroll}
        {...stylex.props(styles.tableScrollContainer)}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <AriaTable
          aria-label={ariaLabel}
          selectionMode={selectionMode}
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          className={() => stylex.props(styles.table).className || ''}
          style={() => stylex.props(styles.table).style || {}}
        >
          <AriaTableHeader
            className={() => stylex.props(styles.header).className || ''}
            style={() => stylex.props(styles.header).style || {}}
          >
            {showLineNumbers && (
              <AriaColumn
                isRowHeader
                className={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnLineNumber,
                  ).className || ''
                }
                style={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnLineNumber,
                  ).style || {}
                }
              >
                #
              </AriaColumn>
            )}

            {showTimestamps && (
              <AriaColumn
                className={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnTimestamp,
                  ).className || ''
                }
                style={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnTimestamp,
                  ).style || {}
                }
              >
                Timestamp
              </AriaColumn>
            )}

            {showLevels && (
              <AriaColumn
                className={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnLevel,
                  ).className || ''
                }
                style={() =>
                  stylex.props(
                    styles.column,
                    compact && styles.columnCompact,
                    styles.columnLevel,
                  ).style || {}
                }
              >
                Level
              </AriaColumn>
            )}

            <AriaColumn
              isRowHeader={!showLineNumbers}
              className={() =>
                stylex.props(
                  styles.column,
                  compact && styles.columnCompact,
                  styles.columnMessage,
                ).className || ''
              }
              style={() =>
                stylex.props(
                  styles.column,
                  compact && styles.columnCompact,
                  styles.columnMessage,
                ).style || {}
              }
            >
              Message
            </AriaColumn>

            <AriaColumn
              className={() =>
                stylex.props(
                  styles.column,
                  compact && styles.columnCompact,
                  styles.columnActions,
                ).className || ''
              }
              style={() =>
                stylex.props(
                  styles.column,
                  compact && styles.columnCompact,
                  styles.columnActions,
                ).style || {}
              }
            >
              <span className="sr-only">Actions</span>
            </AriaColumn>
          </AriaTableHeader>

          <AriaTableBody
            items={filteredLogs}
            className={() => stylex.props(styles.body).className || ''}
            style={() => stylex.props(styles.body).style || {}}
          >
            {(log) => {
              const isError = log.level === 'error'
              const isWarn = log.level === 'warn'
              const isFatal = log.level === 'fatal'

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
                  className={(renderProps) => {
                    const { className: stylexClass } = stylex.props(
                      styles.row,
                      isError && styles.rowError,
                      isWarn && styles.rowWarn,
                      isFatal && styles.rowFatal,
                      renderProps.isHovered && styles.rowHovered,
                      renderProps.isSelected && styles.rowSelected,
                      renderProps.isFocused && styles.rowFocused,
                    )
                    return stylexClass || ''
                  }}
                  style={(renderProps) => {
                    const { style: stylexStyle } = stylex.props(
                      styles.row,
                      isError && styles.rowError,
                      isWarn && styles.rowWarn,
                      isFatal && styles.rowFatal,
                      renderProps.isHovered && styles.rowHovered,
                      renderProps.isSelected && styles.rowSelected,
                      renderProps.isFocused && styles.rowFocused,
                    )
                    return stylexStyle || {}
                  }}
                >
                  {showLineNumbers && (
                    <AriaCell
                      className={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellLineNumber,
                        ).className || ''
                      }
                      style={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellLineNumber,
                        ).style || {}
                      }
                    >
                      {log.lineNumber}
                    </AriaCell>
                  )}

                  {showTimestamps && (
                    <AriaCell
                      className={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellTimestamp,
                        ).className || ''
                      }
                      style={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellTimestamp,
                        ).style || {}
                      }
                    >
                      {log.timestamp || '—'}
                    </AriaCell>
                  )}

                  {showLevels && (
                    <AriaCell
                      className={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellLevel,
                        ).className || ''
                      }
                      style={() =>
                        stylex.props(
                          styles.cell,
                          compact && styles.cellCompact,
                          styles.cellLevel,
                        ).style || {}
                      }
                    >
                      <LogLevelBadge level={log.level} />
                    </AriaCell>
                  )}

                  <AriaCell
                    className={() =>
                      stylex.props(
                        styles.cell,
                        compact && styles.cellCompact,
                        styles.cellMessage,
                        wrapLines ? styles.cellWrap : styles.cellNoWrap,
                      ).className || ''
                    }
                    style={() =>
                      stylex.props(
                        styles.cell,
                        compact && styles.cellCompact,
                        styles.cellMessage,
                        wrapLines ? styles.cellWrap : styles.cellNoWrap,
                      ).style || {}
                    }
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
                    className={() =>
                      stylex.props(
                        styles.cell,
                        compact && styles.cellCompact,
                        styles.cellActions,
                      ).className || ''
                    }
                    style={() =>
                      stylex.props(
                        styles.cell,
                        compact && styles.cellCompact,
                        styles.cellActions,
                      ).style || {}
                    }
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
                          v >= 500
                            ? 'error'
                            : v >= 400
                              ? 'warning'
                              : 'success'
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
                    <DrawerTitle>
                      Log #{selectedLogItem.lineNumber}
                    </DrawerTitle>
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

