'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
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
    aria-hidden="true"
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
    aria-hidden="true"
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
    aria-hidden="true"
  >
    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
  </svg>
)

// ── Context ───────────────────────────────────────────────────────────

interface TableContextValue {
  dense?: boolean
  striped?: boolean
  hoverable?: boolean
  stickyHeader?: boolean
  bordered?: boolean
}

const TableContext = React.createContext<TableContextValue>({})

// ── Table Root Component ──────────────────────────────────────────────

export interface TableProps
  extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Style for the inner table element when wrapInContainer is true */
  tableStyle?: StyleXStyles
  /** Class name for the inner table element when wrapInContainer is true */
  tableClassName?: string
  /** Compact padding for high-density data */
  dense?: boolean
  /** Alternating row background colors */
  striped?: boolean
  /** Highlight rows on hover */
  hoverable?: boolean
  /** Keep table header pinned to top on scroll */
  stickyHeader?: boolean
  /** Draw vertical column borders between cells */
  bordered?: boolean
  /** Table layout algorithm */
  layout?: 'auto' | 'fixed'
  /** Wrap table in a responsive horizontal scroll container (default: true) */
  wrapInContainer?: boolean
  /** Style for the responsive container wrapper */
  containerStyle?: StyleXStyles
  /** Class name for the responsive container wrapper */
  containerClassName?: string
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  function Table(
    {
      style,
      className,
      tableStyle,
      tableClassName,
      dense = false,
      striped = false,
      hoverable = true,
      stickyHeader = false,
      bordered = false,
      layout = 'auto',
      wrapInContainer = true,
      containerStyle,
      containerClassName,
      children,
      ...rest
    },
    ref,
  ) {
    const contextValue = React.useMemo(
      () => ({
        dense,
        striped,
        hoverable,
        stickyHeader,
        bordered,
      }),
      [dense, striped, hoverable, stickyHeader, bordered],
    )

    if (!wrapInContainer) {
      const { className: tableStylexClass, style: tableInlineStyle } =
        stylex.props(
          styles.table,
          layout === 'fixed' ? styles.tableFixed : styles.tableAuto,
          style,
        )

      const finalClassName = [tableStylexClass, className]
        .filter(Boolean)
        .join(' ')

      return (
        <TableContext.Provider value={contextValue}>
          <table
            {...rest}
            ref={ref}
            className={finalClassName || undefined}
            style={tableInlineStyle}
          >
            {children}
          </table>
        </TableContext.Provider>
      )
    }

    const { className: tableStylexClass, style: tableInlineStyle } =
      stylex.props(
        styles.table,
        layout === 'fixed' ? styles.tableFixed : styles.tableAuto,
        tableStyle,
      )

    const finalTableClassName = [tableStylexClass, tableClassName]
      .filter(Boolean)
      .join(' ')

    const { className: wrapStylexClass, style: wrapInlineStyle } = stylex.props(
      styles.wrapper,
      containerStyle,
      style,
    )

    const finalWrapClassName = [wrapStylexClass, containerClassName, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        className={finalWrapClassName || undefined}
        style={wrapInlineStyle}
        data-moul-table-wrapper=""
      >
        <TableContext.Provider value={contextValue}>
          <table
            {...rest}
            ref={ref}
            className={finalTableClassName || undefined}
            style={tableInlineStyle}
          >
            {children}
          </table>
        </TableContext.Provider>
      </div>
    )
  },
)

// ── TableHeader Component ─────────────────────────────────────────────

export interface TableHeaderProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Pinned sticky header state */
  sticky?: boolean
}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(function TableHeader({ style, className, sticky, children, ...rest }, ref) {
  const ctx = React.useContext(TableContext)
  const isSticky = sticky ?? ctx.stickyHeader

  const { className: stylexClass, style: inlineStyle } = stylex.props(
    styles.header,
    isSticky && styles.headerSticky,
    style,
  )

  return (
    <thead
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ') || undefined}
      style={inlineStyle}
    >
      {children}
    </thead>
  )
})

// ── TableBody Component ───────────────────────────────────────────────

export interface TableBodyProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(function TableBody({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: inlineStyle } = stylex.props(
    styles.body,
    style,
  )

  return (
    <tbody
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ') || undefined}
      style={inlineStyle}
    >
      {children}
    </tbody>
  )
})

// ── TableFooter Component ─────────────────────────────────────────────

export interface TableFooterProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Pinned sticky footer state */
  sticky?: boolean
}

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(function TableFooter({ style, className, sticky, children, ...rest }, ref) {
  const { className: stylexClass, style: inlineStyle } = stylex.props(
    styles.footer,
    sticky && styles.footerSticky,
    style,
  )

  return (
    <tfoot
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ') || undefined}
      style={inlineStyle}
    >
      {children}
    </tfoot>
  )
})

// ── TableRow Component ────────────────────────────────────────────────

export interface TableRowProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Selected row state */
  selected?: boolean
  /** Enable hover highlight for this row */
  hoverable?: boolean
  /** Indicates the row is clickable */
  interactive?: boolean
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow(
    {
      style,
      className,
      selected = false,
      hoverable,
      interactive = false,
      children,
      ...rest
    },
    ref,
  ) {
    const ctx = React.useContext(TableContext)
    const isHoverable = hoverable ?? ctx.hoverable

    const { className: stylexClass, style: inlineStyle } = stylex.props(
      styles.row,
      isHoverable && styles.rowHoverable,
      ctx.striped && styles.rowStriped,
      selected && styles.rowSelected,
      interactive && styles.rowInteractive,
      style,
    )

    return (
      <tr
        {...rest}
        ref={ref}
        aria-selected={selected ? 'true' : undefined}
        className={
          [stylexClass, className].filter(Boolean).join(' ') || undefined
        }
        style={inlineStyle}
      >
        {children}
      </tr>
    )
  },
)

// ── TableHead (th) Component ──────────────────────────────────────────

export interface TableHeadProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'style' | 'align' | 'width'> {
  style?: StyleXStyles
  className?: string
  /** Text & content alignment */
  align?: 'left' | 'center' | 'right' | 'numeric'
  /** Draw vertical column border */
  bordered?: boolean
  /** Column pinning support */
  pinned?: 'left' | 'right' | 'start' | 'end'
  /** Pinning offset (e.g., 0, '120px') */
  pinOffset?: number | string
  /** Explicit column width */
  width?: number | string
  /** Minimum column width */
  minWidth?: number | string
  /** Maximum column width */
  maxWidth?: number | string
  /** Current column sort direction */
  sortDirection?: 'asc' | 'desc' | 'ascending' | 'descending' | false | null
  /** Callback fired when sortable column header is clicked or activated */
  onSort?: () => void
  /** Show sorting chevron indicator */
  showSortIndicator?: boolean
  /** Custom sort indicator component slot */
  sortIndicator?: React.ReactNode
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead(
    {
      style,
      className,
      align = 'left',
      bordered,
      pinned,
      pinOffset,
      width,
      minWidth,
      maxWidth,
      sortDirection,
      onSort,
      showSortIndicator = true,
      sortIndicator,
      children,
      onClick,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const ctx = React.useContext(TableContext)
    const isSortable = Boolean(
      onSort || (sortDirection !== undefined && sortDirection !== null),
    )
    const isBordered = bordered ?? ctx.bordered

    const isSortedAsc =
      sortDirection === 'asc' || sortDirection === 'ascending'
    const isSortedDesc =
      sortDirection === 'desc' || sortDirection === 'descending'
    const isSorted = isSortedAsc || isSortedDesc

    const ariaSortValue = isSortedAsc
      ? 'ascending'
      : isSortedDesc
        ? 'descending'
        : isSortable
          ? 'none'
          : undefined

    const isPinnedLeft = pinned === 'left' || pinned === 'start'
    const isPinnedRight = pinned === 'right' || pinned === 'end'

    const { className: stylexClass, style: inlineStyle } = stylex.props(
      styles.head,
      ctx.dense && styles.headDense,
      isSortable && styles.headSortable,
      isBordered && styles.headBordered,
      align === 'center'
        ? styles.alignCenter
        : align === 'numeric'
          ? styles.alignNumeric
          : align === 'right'
            ? styles.alignRight
            : styles.alignLeft,
      isPinnedLeft && styles.pinnedLeftHead,
      isPinnedRight && styles.pinnedRightHead,
      style,
    )

    const pinStyle: React.CSSProperties = {}
    if (isPinnedLeft && pinOffset !== undefined) {
      pinStyle.insetInlineStart =
        typeof pinOffset === 'number' ? `${pinOffset}px` : pinOffset
    } else if (isPinnedRight && pinOffset !== undefined) {
      pinStyle.insetInlineEnd =
        typeof pinOffset === 'number' ? `${pinOffset}px` : pinOffset
    }
    if (width !== undefined) {
      pinStyle.width = typeof width === 'number' ? `${width}px` : width
    }
    if (minWidth !== undefined) {
      pinStyle.minWidth =
        typeof minWidth === 'number' ? `${minWidth}px` : minWidth
    }
    if (maxWidth !== undefined) {
      pinStyle.maxWidth =
        typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
    }

    const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
      onClick?.(e)
      if (isSortable && onSort && !e.defaultPrevented) {
        onSort()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
      onKeyDown?.(e)
      if (
        isSortable &&
        onSort &&
        !e.defaultPrevented &&
        (e.key === 'Enter' || e.key === ' ')
      ) {
        e.preventDefault()
        onSort()
      }
    }

    return (
      <th
        {...rest}
        ref={ref}
        scope={rest.scope || 'col'}
        aria-sort={ariaSortValue}
        tabIndex={isSortable ? 0 : rest.tabIndex}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={
          [stylexClass, className].filter(Boolean).join(' ') || undefined
        }
        style={{ ...inlineStyle, ...pinStyle }}
      >
        {isSortable && showSortIndicator ? (
          <div
            {...stylex.props(
              styles.headContent,
              align === 'center'
                ? styles.headContentAlignCenter
                : align === 'right' || align === 'numeric'
                  ? styles.headContentAlignRight
                  : styles.headContentAlignLeft,
            )}
          >
            <span>{children}</span>
            <span
              aria-hidden="true"
              {...stylex.props(
                styles.sortIndicator,
                isSorted && styles.sortIndicatorActive,
              )}
            >
              {sortIndicator || (
                isSortedAsc ? (
                  <SortAscIcon />
                ) : isSortedDesc ? (
                  <SortDescIcon />
                ) : (
                  <SortUnsortedIcon />
                )
              )}
            </span>
          </div>
        ) : (
          children
        )}
      </th>
    )
  },
)

// ── TableCell (td) Component ──────────────────────────────────────────

export interface TableCellProps
  extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'style' | 'align' | 'width'> {
  style?: StyleXStyles
  className?: string
  /** Text & numeric alignment */
  align?: 'left' | 'center' | 'right' | 'numeric'
  /** Draw vertical column border */
  bordered?: boolean
  /** Column pinning support */
  pinned?: 'left' | 'right' | 'start' | 'end'
  /** Pinning offset (e.g., 0, '120px') */
  pinOffset?: number | string
  /** Explicit cell/column width */
  width?: number | string
  /** Minimum cell/column width */
  minWidth?: number | string
  /** Maximum cell/column width */
  maxWidth?: number | string
  /** Enable tabular figures for consistent numeric layout */
  tabular?: boolean
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(
    {
      style,
      className,
      align = 'left',
      bordered,
      pinned,
      pinOffset,
      width,
      minWidth,
      maxWidth,
      tabular = false,
      children,
      ...rest
    },
    ref,
  ) {
    const ctx = React.useContext(TableContext)
    const isBordered = bordered ?? ctx.bordered

    const isPinnedLeft = pinned === 'left' || pinned === 'start'
    const isPinnedRight = pinned === 'right' || pinned === 'end'

    const { className: stylexClass, style: inlineStyle } = stylex.props(
      styles.cell,
      ctx.dense && styles.cellDense,
      isBordered && styles.cellBordered,
      (tabular || align === 'numeric') && styles.cellTabular,
      align === 'center'
        ? styles.alignCenter
        : align === 'numeric'
          ? styles.alignNumeric
          : align === 'right'
            ? styles.alignRight
            : styles.alignLeft,
      isPinnedLeft && styles.pinnedLeft,
      isPinnedRight && styles.pinnedRight,
      style,
    )

    const pinStyle: React.CSSProperties = {}
    if (isPinnedLeft && pinOffset !== undefined) {
      pinStyle.insetInlineStart =
        typeof pinOffset === 'number' ? `${pinOffset}px` : pinOffset
    } else if (isPinnedRight && pinOffset !== undefined) {
      pinStyle.insetInlineEnd =
        typeof pinOffset === 'number' ? `${pinOffset}px` : pinOffset
    }
    if (width !== undefined) {
      pinStyle.width = typeof width === 'number' ? `${width}px` : width
    }
    if (minWidth !== undefined) {
      pinStyle.minWidth =
        typeof minWidth === 'number' ? `${minWidth}px` : minWidth
    }
    if (maxWidth !== undefined) {
      pinStyle.maxWidth =
        typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
    }

    return (
      <td
        {...rest}
        ref={ref}
        className={
          [stylexClass, className].filter(Boolean).join(' ') || undefined
        }
        style={{ ...inlineStyle, ...pinStyle }}
      >
        {children}
      </td>
    )
  },
)

// ── TableCaption Component ────────────────────────────────────────────

export interface TableCaptionProps
  extends Omit<React.HTMLAttributes<HTMLTableCaptionElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /** Placement side of the caption */
  side?: 'top' | 'bottom'
}

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(function TableCaption(
  { style, className, side = 'bottom', children, ...rest },
  ref,
) {
  const { className: stylexClass, style: inlineStyle } = stylex.props(
    styles.caption,
    side === 'top' && styles.captionTop,
    style,
  )

  return (
    <caption
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ') || undefined}
      style={inlineStyle}
    >
      {children}
    </caption>
  )
})

// ── TableEmpty Component ──────────────────────────────────────────────

export interface TableEmptyProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'style'> {
  colSpan?: number
  style?: StyleXStyles
  cellStyle?: StyleXStyles
  className?: string
  cellClassName?: string
}

export const TableEmpty = React.forwardRef<HTMLTableRowElement, TableEmptyProps>(
  function TableEmpty(
    {
      colSpan = 1,
      style,
      cellStyle,
      className,
      cellClassName,
      children,
      ...rest
    },
    ref,
  ) {
    const { className: cellClass, style: cellInline } = stylex.props(
      styles.emptyCell,
      cellStyle,
    )

    return (
      <TableRow {...rest} ref={ref} hoverable={false} style={style} className={className}>
        <td
          colSpan={colSpan}
          className={[cellClass, cellClassName].filter(Boolean).join(' ') || undefined}
          style={cellInline}
        >
          {children}
        </td>
      </TableRow>
    )
  },
)

// ── TableSkeleton Component ───────────────────────────────────────────

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  style?: StyleXStyles
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  style,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder keys
        <TableRow key={`skeleton-row-${rIdx}`} hoverable={false} style={style}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder keys
            <TableCell key={`skeleton-cell-${rIdx}-${cIdx}`}>
              <div {...stylex.props(styles.skeletonBar)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
