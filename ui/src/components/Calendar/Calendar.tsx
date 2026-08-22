'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  type CalendarCellProps as AriaCalendarCellProps,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  type CalendarProps as AriaCalendarProps,
  Heading as AriaHeading,
  RangeCalendar as AriaRangeCalendar,
  type RangeCalendarProps as AriaRangeCalendarProps,
  type DateValue,
} from 'react-aria-components'
import { styles } from './Calendar.styles'

const ChevronLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(styles.navIcon)}
    aria-hidden="true"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(styles.navIcon)}
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

// ── CalendarCell Component ───────────────────────────────────────────

export interface CalendarCellProps
  extends Omit<AriaCalendarCellProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const CalendarCell = React.forwardRef<
  HTMLTableCellElement,
  CalendarCellProps
>(function CalendarCell({ style, className, date, ...rest }, ref) {
  return (
    <AriaCalendarCell
      {...rest}
      ref={ref}
      date={date}
      className={(renderProps) => {
        const rp = renderProps as any
        const isRangeStart = rp.isSelectionStart && rp.isRangeSelection
        const isRangeEnd = rp.isSelectionEnd && rp.isRangeSelection
        const isRangeMiddle =
          rp.isRangeSelection && !rp.isSelectionStart && !rp.isSelectionEnd

        const { className: stylexClass } = stylex.props(
          styles.cell,
          renderProps.isHovered && styles.cellHovered,
          renderProps.isFocusVisible && styles.cellFocused,
          renderProps.isSelected && !rp.isRangeSelection && styles.cellSelected,
          isRangeStart && styles.cellSelectionStart,
          isRangeEnd && styles.cellSelectionEnd,
          isRangeMiddle && styles.cellRangeSelection,
          (rp.isToday || renderProps.formattedDate === 'today') &&
            styles.cellToday,
          renderProps.isOutsideMonth && styles.cellOutsideMonth,
          renderProps.isDisabled && styles.cellDisabled,
          renderProps.isUnavailable && styles.cellUnavailable,
          renderProps.isInvalid && styles.cellInvalid,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const rp = renderProps as any
        const isRangeStart = rp.isSelectionStart && rp.isRangeSelection
        const isRangeEnd = rp.isSelectionEnd && rp.isRangeSelection
        const isRangeMiddle =
          rp.isRangeSelection && !rp.isSelectionStart && !rp.isSelectionEnd

        const { style: stylexStyle } = stylex.props(
          styles.cell,
          renderProps.isHovered && styles.cellHovered,
          renderProps.isFocusVisible && styles.cellFocused,
          renderProps.isSelected && !rp.isRangeSelection && styles.cellSelected,
          isRangeStart && styles.cellSelectionStart,
          isRangeEnd && styles.cellSelectionEnd,
          isRangeMiddle && styles.cellRangeSelection,
          (rp.isToday || renderProps.formattedDate === 'today') &&
            styles.cellToday,
          renderProps.isOutsideMonth && styles.cellOutsideMonth,
          renderProps.isDisabled && styles.cellDisabled,
          renderProps.isUnavailable && styles.cellUnavailable,
          renderProps.isInvalid && styles.cellInvalid,
          style,
        )
        return stylexStyle ?? {}
      }}
    />
  )
})

// ── CalendarGrid Component ───────────────────────────────────────────

export interface CalendarGridProps {
  style?: StyleXStyles
  className?: string
  children?: (date: any) => React.ReactElement
}

export function CalendarGrid({
  style,
  className,
  children,
}: CalendarGridProps) {
  const { className: gridClass, style: gridStyle } = stylex.props(
    styles.grid,
    style,
  )
  const { className: headerCellClass, style: headerCellStyle } = stylex.props(
    styles.gridHeaderCell,
  )

  return (
    <AriaCalendarGrid
      className={[gridClass, className].filter(Boolean).join(' ')}
      style={gridStyle}
    >
      <AriaCalendarGridHeader>
        {(day) => (
          <AriaCalendarHeaderCell
            className={headerCellClass}
            style={headerCellStyle}
          >
            {day}
          </AriaCalendarHeaderCell>
        )}
      </AriaCalendarGridHeader>
      <AriaCalendarGridBody>
        {children || ((date: any) => <CalendarCell date={date} />)}
      </AriaCalendarGridBody>
    </AriaCalendarGrid>
  )
}

// ── Calendar Component ───────────────────────────────────────────────

export interface CalendarProps<T extends DateValue = DateValue>
  extends Omit<AriaCalendarProps<T>, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps<any>>(
  function Calendar({ style, className, ...rest }, ref) {
    return (
      <AriaCalendar
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.calendar,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.calendar, style)
          return stylexStyle ?? {}
        }}
      >
        <header {...stylex.props(styles.header)}>
          <AriaButton
            slot="previous"
            aria-label="Previous month"
            className={(renderProps) => {
              const { className: stylexClass } = stylex.props(
                styles.navButton,
                renderProps.isHovered && styles.navButtonHover,
                renderProps.isPressed && styles.navButtonPressed,
                renderProps.isFocusVisible && styles.navButtonFocused,
                renderProps.isDisabled && styles.navButtonDisabled,
              )
              return stylexClass || ''
            }}
            style={(renderProps) => {
              const { style: stylexStyle } = stylex.props(
                styles.navButton,
                renderProps.isHovered && styles.navButtonHover,
                renderProps.isPressed && styles.navButtonPressed,
                renderProps.isFocusVisible && styles.navButtonFocused,
                renderProps.isDisabled && styles.navButtonDisabled,
              )
              return stylexStyle || {}
            }}
          >
            <ChevronLeftIcon />
          </AriaButton>
          <AriaHeading {...stylex.props(styles.heading)} />
          <AriaButton
            slot="next"
            aria-label="Next month"
            className={(renderProps) => {
              const { className: stylexClass } = stylex.props(
                styles.navButton,
                renderProps.isHovered && styles.navButtonHover,
                renderProps.isPressed && styles.navButtonPressed,
                renderProps.isFocusVisible && styles.navButtonFocused,
                renderProps.isDisabled && styles.navButtonDisabled,
              )
              return stylexClass || ''
            }}
            style={(renderProps) => {
              const { style: stylexStyle } = stylex.props(
                styles.navButton,
                renderProps.isHovered && styles.navButtonHover,
                renderProps.isPressed && styles.navButtonPressed,
                renderProps.isFocusVisible && styles.navButtonFocused,
                renderProps.isDisabled && styles.navButtonDisabled,
              )
              return stylexStyle || {}
            }}
          >
            <ChevronRightIcon />
          </AriaButton>
        </header>
        <CalendarGrid />
      </AriaCalendar>
    )
  },
)

// ── RangeCalendar Component ──────────────────────────────────────────

export interface RangeCalendarProps<T extends DateValue = DateValue>
  extends Omit<AriaRangeCalendarProps<T>, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const RangeCalendar = React.forwardRef<
  HTMLDivElement,
  RangeCalendarProps<any>
>(function RangeCalendar({ style, className, ...rest }, ref) {
  return (
    <AriaRangeCalendar
      {...rest}
      ref={ref}
      className={(_) => {
        const { className: stylexClass } = stylex.props(styles.calendar, style)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(styles.calendar, style)
        return stylexStyle ?? {}
      }}
    >
      <header {...stylex.props(styles.header)}>
        <AriaButton
          slot="previous"
          aria-label="Previous month"
          className={(renderProps) => {
            const { className: stylexClass } = stylex.props(
              styles.navButton,
              renderProps.isHovered && styles.navButtonHover,
              renderProps.isPressed && styles.navButtonPressed,
              renderProps.isFocusVisible && styles.navButtonFocused,
              renderProps.isDisabled && styles.navButtonDisabled,
            )
            return stylexClass || ''
          }}
          style={(renderProps) => {
            const { style: stylexStyle } = stylex.props(
              styles.navButton,
              renderProps.isHovered && styles.navButtonHover,
              renderProps.isPressed && styles.navButtonPressed,
              renderProps.isFocusVisible && styles.navButtonFocused,
              renderProps.isDisabled && styles.navButtonDisabled,
            )
            return stylexStyle || {}
          }}
        >
          <ChevronLeftIcon />
        </AriaButton>
        <AriaHeading {...stylex.props(styles.heading)} />
        <AriaButton
          slot="next"
          aria-label="Next month"
          className={(renderProps) => {
            const { className: stylexClass } = stylex.props(
              styles.navButton,
              renderProps.isHovered && styles.navButtonHover,
              renderProps.isPressed && styles.navButtonPressed,
              renderProps.isFocusVisible && styles.navButtonFocused,
              renderProps.isDisabled && styles.navButtonDisabled,
            )
            return stylexClass || ''
          }}
          style={(renderProps) => {
            const { style: stylexStyle } = stylex.props(
              styles.navButton,
              renderProps.isHovered && styles.navButtonHover,
              renderProps.isPressed && styles.navButtonPressed,
              renderProps.isFocusVisible && styles.navButtonFocused,
              renderProps.isDisabled && styles.navButtonDisabled,
            )
            return stylexStyle || {}
          }}
        >
          <ChevronRightIcon />
        </AriaButton>
      </header>
      <CalendarGrid />
    </AriaRangeCalendar>
  )
})
