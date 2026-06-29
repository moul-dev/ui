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
import { styles } from './Table.styles'

// ── Table Component ───────────────────────────────────────────────────

export interface TableProps extends Omit<AriaTableProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  function Table({ style, className, children, ...rest }, ref) {
    return (
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
    )
  },
)

// ── TableHeader Component ─────────────────────────────────────────────

export interface TableHeaderProps<T>
  extends Omit<AriaTableHeaderProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps<any>
>(function TableHeader({ style, className, children, ...rest }, ref) {
  return (
    <AriaTableHeader
      {...rest}
      ref={ref}
      className={() => {
        const { className: stylexClass } = stylex.props(styles.header, style)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={() => {
        const { style: stylexStyle } = stylex.props(styles.header, style)
        return stylexStyle || {}
      }}
    >
      {children}
    </AriaTableHeader>
  )
})

// ── Column Component ──────────────────────────────────────────────────

export interface ColumnProps extends Omit<AriaColumnProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Column = React.forwardRef<HTMLTableHeaderCellElement, ColumnProps>(
  function Column({ style, className, children, ...rest }, ref) {
    return (
      <AriaColumn
        {...rest}
        ref={ref}
        className={() => {
          const { className: stylexClass } = stylex.props(styles.column, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.column, style)
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaColumn>
    )
  },
)

// ── TableBody Component ───────────────────────────────────────────────

export interface TableBodyProps<T>
  extends Omit<AriaTableBodyProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps<any>
>(function TableBody({ style, className, children, ...rest }, ref) {
  return (
    <AriaTableBody
      {...rest}
      ref={ref}
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
