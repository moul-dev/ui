'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Cell as AriaCell,
  type CellProps as AriaCellProps,
  Column as AriaColumn,
  type ColumnProps as AriaColumnProps,
  Row as AriaRow,
  type RowProps as AriaRowProps,
  Table as AriaTable,
  TableBody as AriaTableBody,
  type TableBodyProps as AriaTableBodyProps,
  TableHeader as AriaTableHeader,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps,
} from 'react-aria-components'
import { Spinner } from '../Spinner'
import { styles } from './Table.styles'

// ── Icons ─────────────────────────────────────────────────────────────

const SortAscIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const SortDescIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
)

const SortUnsortedIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity="0.4"
  >
    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
  </svg>
)

// ── Table Context ─────────────────────────────────────────────────────

interface TableContextValue {
  stickyHeader?: boolean
  isLoading?: boolean
  loadingState?: React.ReactNode
  emptyState?: React.ReactNode
}

const TableContext = React.createContext<TableContextValue>({})

// ── Table Component ───────────────────────────────────────────────────

export interface TableProps extends Omit<AriaTableProps, 'style'> {
  style?: StyleXStyles
  className?: string
  stickyHeader?: boolean
  isLoading?: boolean
  loadingState?: React.ReactNode
  emptyState?: React.ReactNode
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  function Table(
    {
      style,
      className,
      stickyHeader = false,
      isLoading = false,
      loadingState,
      emptyState,
      children,
      ...rest
    },
    ref,
  ) {
    const contextValue = React.useMemo(
      () => ({
        stickyHeader,
        isLoading,
        loadingState,
        emptyState,
      }),
      [stickyHeader, isLoading, loadingState, emptyState],
    )

    return (
      <TableContext.Provider value={contextValue}>
        <AriaTable
          {...rest}
          ref={ref}
          className={() => {
            const { className: stylexClass } = stylex.props(styles.table, style)
            return [stylexClass, className].filter(Boolean).join(' ')
          }}
          style={() => {
            const { style: stylexStyle } = stylex.props(styles.table, style)
            return stylexStyle || {}
          }}
        >
          {children}
        </AriaTable>
      </TableContext.Provider>
    )
  },
)

// ── TableHeader Component ─────────────────────────────────────────────

export interface TableHeaderProps<T>
  extends Omit<AriaTableHeaderProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
  sticky?: boolean
}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps<any>
>(function TableHeader(
  { style, className, sticky, children, ...rest },
  ref,
) {
  const { stickyHeader: tableSticky } = React.useContext(TableContext)
  const isSticky = sticky ?? tableSticky

  return (
    <AriaTableHeader
      {...rest}
      ref={ref}
      className={() => {
        const { className: stylexClass } = stylex.props(
          styles.header,
          isSticky && styles.headerSticky,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={() => {
        const { style: stylexStyle } = stylex.props(
          styles.header,
          isSticky && styles.headerSticky,
          style,
        )
        return stylexStyle || {}
      }}
    >
      {children}
    </AriaTableHeader>
  )
})

// ── Column Component ──────────────────────────────────────────────────

export interface ColumnProps
  extends Omit<AriaColumnProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: AriaColumnProps['className']
  showSortIndicator?: boolean
}

export const Column = React.forwardRef<HTMLTableHeaderCellElement, ColumnProps>(
  function Column(
    { style, className, showSortIndicator = true, children, ...rest },
    ref,
  ) {
    return (
      <AriaColumn
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.column,
            renderProps.allowsSorting && styles.columnSortable,
            renderProps.isHovered && styles.columnHovered,
            style,
          )
          const userClass =
            typeof className === 'function' ? (className as any)(renderProps) : className
          return [stylexClass, userClass].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.column,
            renderProps.allowsSorting && styles.columnSortable,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {(renderProps) => {
          const content =
            typeof children === 'function'
              ? children(renderProps)
              : children

          if (!renderProps.allowsSorting || !showSortIndicator) {
            return content
          }

          return (
            <div {...stylex.props(styles.columnContent)}>
              <span>{content}</span>
              <span
                aria-hidden="true"
                {...stylex.props(
                  styles.sortIndicator,
                  renderProps.sortDirection && styles.sortIndicatorActive,
                )}
              >
                {renderProps.sortDirection === 'ascending' ? (
                  <SortAscIcon />
                ) : renderProps.sortDirection === 'descending' ? (
                  <SortDescIcon />
                ) : (
                  <SortUnsortedIcon />
                )}
              </span>
            </div>
          )
        }}
      </AriaColumn>
    )
  },
)

// ── TableBody Component ───────────────────────────────────────────────

export interface TableBodyProps<T>
  extends Omit<AriaTableBodyProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
  isLoading?: boolean
  loadingState?: React.ReactNode
  emptyState?: React.ReactNode
}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps<any>
>(function TableBody(
  {
    style,
    className,
    isLoading,
    loadingState,
    emptyState,
    renderEmptyState,
    children,
    ...rest
  },
  ref,
) {
  const ctx = React.useContext(TableContext)
  const activeLoading = isLoading ?? ctx.isLoading
  const activeLoadingState = loadingState ?? ctx.loadingState
  const activeEmptyState = emptyState ?? ctx.emptyState

  const defaultRenderEmpty = () => {
    if (activeLoading) {
      return (
        <div {...stylex.props(styles.loadingState)}>
          {activeLoadingState || (
            <>
              <Spinner size="md" aria-label="Loading table data..." />
              <span>Loading data...</span>
            </>
          )}
        </div>
      )
    }
    if (activeEmptyState) {
      return (
        <div {...stylex.props(styles.emptyState)}>{activeEmptyState}</div>
      )
    }
    return null
  }

  const effectiveRenderEmpty =
    renderEmptyState ||
    (activeLoading || activeEmptyState ? defaultRenderEmpty : undefined)

  return (
    <AriaTableBody
      {...rest}
      ref={ref}
      renderEmptyState={effectiveRenderEmpty}
      className={() => {
        const { className: stylexClass } = stylex.props(styles.body, style)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={() => {
        const { style: stylexStyle } = stylex.props(styles.body, style)
        return stylexStyle || {}
      }}
    >
      {children}
    </AriaTableBody>
  )
})

// ── Row Component ─────────────────────────────────────────────────────

export interface RowProps<T> extends Omit<AriaRowProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Row = React.forwardRef<HTMLTableRowElement, RowProps<any>>(
  function Row({ style, className, children, ...rest }, ref) {
    return (
      <AriaRow
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.row,
            renderProps.isHovered && styles.rowHovered,
            renderProps.isSelected && styles.rowSelected,
            renderProps.isFocused && styles.rowFocused,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.row,
            renderProps.isHovered && styles.rowHovered,
            renderProps.isSelected && styles.rowSelected,
            renderProps.isFocused && styles.rowFocused,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaRow>
    )
  },
)

// ── Cell Component ────────────────────────────────────────────────────

export interface CellProps extends Omit<AriaCellProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Cell = React.forwardRef<HTMLTableCellElement, CellProps>(
  function Cell({ style, className, children, ...rest }, ref) {
    return (
      <AriaCell
        {...rest}
        ref={ref}
        className={() => {
          const { className: stylexClass } = stylex.props(styles.cell, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.cell, style)
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaCell>
    )
  },
)
