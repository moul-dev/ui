'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  DateRangePicker as AriaDateRangePicker,
  type DateRangePickerProps as AriaDateRangePickerProps,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  type DateValue,
  type ValidationResult,
} from 'react-aria-components'
import { Calendar, RangeCalendar } from '../Calendar'
import { DateInput } from '../DateField'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './DatePicker.styles'

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(styles.calendarIcon)}
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

// ── DatePicker Component ─────────────────────────────────────────────

export interface DatePickerProps<T extends DateValue = DateValue>
  extends Omit<AriaDatePickerProps<T>, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const DatePicker = React.forwardRef<
  HTMLDivElement,
  DatePickerProps<any>
>(function DatePicker(
  {
    label,
    description,
    errorMessage,
    variant = 'primary',
    size = 'md',
    style,
    className,
    ...rest
  },
  ref,
) {
  const sizeSuffix = size === 'sm' ? 'Sm' : size === 'lg' ? 'Lg' : 'Md'
  const groupSizeStyle = styles[`group${sizeSuffix}` as keyof typeof styles]
  const { className: dialogClass, style: dialogStyle } = stylex.props(
    styles.dialog,
  )

  return (
    <AriaDatePicker
      {...rest}
      ref={ref}
      className={(_) => {
        const { className: stylexClass } = stylex.props(styles.container)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(styles.container)
        return stylexStyle ?? {}
      }}
    >
      {({ isInvalid, isDisabled }) => (
        <>
          {label && <Label>{label}</Label>}
          <AriaGroup
            className={(renderProps) => {
              const { className: stylexClass } = stylex.props(
                styles.group,
                groupSizeStyle,
                styles[variant],
                renderProps.isHovered && styles.groupHover,
                renderProps.isFocusWithin && styles.groupFocused,
                isInvalid && styles.groupInvalid,
                isInvalid &&
                  renderProps.isFocusWithin &&
                  styles.groupFocusedInvalid,
                isDisabled && styles.groupDisabled,
                style,
              )
              return stylexClass || ''
            }}
            style={(renderProps) => {
              const { style: stylexStyle } = stylex.props(
                styles.group,
                groupSizeStyle,
                styles[variant],
                renderProps.isHovered && styles.groupHover,
                renderProps.isFocusWithin && styles.groupFocused,
                isInvalid && styles.groupInvalid,
                isInvalid &&
                  renderProps.isFocusWithin &&
                  styles.groupFocusedInvalid,
                isDisabled && styles.groupDisabled,
                style,
              )
              return stylexStyle || {}
            }}
          >
            <DateInput />
            <AriaButton
              aria-label="Open calendar"
              className={(renderProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.triggerButton,
                  renderProps.isHovered && styles.triggerButtonHover,
                  renderProps.isPressed && styles.triggerButtonPressed,
                  renderProps.isFocusVisible && styles.triggerButtonFocused,
                  renderProps.isDisabled && styles.triggerButtonDisabled,
                )
                return stylexClass || ''
              }}
              style={(renderProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.triggerButton,
                  renderProps.isHovered && styles.triggerButtonHover,
                  renderProps.isPressed && styles.triggerButtonPressed,
                  renderProps.isFocusVisible && styles.triggerButtonFocused,
                  renderProps.isDisabled && styles.triggerButtonDisabled,
                )
                return stylexStyle || {}
              }}
            >
              <CalendarIcon />
            </AriaButton>
          </AriaGroup>
          {description && <Description>{description}</Description>}
          <FieldError errorMessage={errorMessage} />
          <AriaPopover
            className={(_) => {
              const { className: stylexClass } = stylex.props(styles.popover)
              return stylexClass || ''
            }}
            style={(_) => {
              const { style: stylexStyle } = stylex.props(styles.popover)
              return stylexStyle ?? {}
            }}
          >
            <AriaDialog
              aria-label={label || 'Calendar'}
              className={dialogClass}
              style={dialogStyle}
            >
              <Calendar />
            </AriaDialog>
          </AriaPopover>
        </>
      )}
    </AriaDatePicker>
  )
})

// ── DateRangePicker Component ────────────────────────────────────────

export interface DateRangePickerProps<T extends DateValue = DateValue>
  extends Omit<AriaDateRangePickerProps<T>, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const DateRangePicker = React.forwardRef<
  HTMLDivElement,
  DateRangePickerProps<any>
>(function DateRangePicker(
  {
    label,
    description,
    errorMessage,
    variant = 'primary',
    size = 'md',
    style,
    className,
    ...rest
  },
  ref,
) {
  const sizeSuffix = size === 'sm' ? 'Sm' : size === 'lg' ? 'Lg' : 'Md'
  const groupSizeStyle = styles[`group${sizeSuffix}` as keyof typeof styles]
  const { className: dialogClass, style: dialogStyle } = stylex.props(
    styles.dialog,
  )

  return (
    <AriaDateRangePicker
      {...rest}
      ref={ref}
      className={(_) => {
        const { className: stylexClass } = stylex.props(styles.container)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(styles.container)
        return stylexStyle ?? {}
      }}
    >
      {({ isInvalid, isDisabled }) => (
        <>
          {label && <Label>{label}</Label>}
          <AriaGroup
            className={(renderProps) => {
              const { className: stylexClass } = stylex.props(
                styles.group,
                groupSizeStyle,
                styles[variant],
                renderProps.isHovered && styles.groupHover,
                renderProps.isFocusWithin && styles.groupFocused,
                isInvalid && styles.groupInvalid,
                isInvalid &&
                  renderProps.isFocusWithin &&
                  styles.groupFocusedInvalid,
                isDisabled && styles.groupDisabled,
                style,
              )
              return stylexClass || ''
            }}
            style={(renderProps) => {
              const { style: stylexStyle } = stylex.props(
                styles.group,
                groupSizeStyle,
                styles[variant],
                renderProps.isHovered && styles.groupHover,
                renderProps.isFocusWithin && styles.groupFocused,
                isInvalid && styles.groupInvalid,
                isInvalid &&
                  renderProps.isFocusWithin &&
                  styles.groupFocusedInvalid,
                isDisabled && styles.groupDisabled,
                style,
              )
              return stylexStyle || {}
            }}
          >
            <DateInput slot="start" />
            <span aria-hidden="true" {...stylex.props(styles.rangeSeparator)}>
              –
            </span>
            <DateInput slot="end" />
            <AriaButton
              aria-label="Open range calendar"
              className={(renderProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.triggerButton,
                  renderProps.isHovered && styles.triggerButtonHover,
                  renderProps.isPressed && styles.triggerButtonPressed,
                  renderProps.isFocusVisible && styles.triggerButtonFocused,
                  renderProps.isDisabled && styles.triggerButtonDisabled,
                )
                return stylexClass || ''
              }}
              style={(renderProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.triggerButton,
                  renderProps.isHovered && styles.triggerButtonHover,
                  renderProps.isPressed && styles.triggerButtonPressed,
                  renderProps.isFocusVisible && styles.triggerButtonFocused,
                  renderProps.isDisabled && styles.triggerButtonDisabled,
                )
                return stylexStyle || {}
              }}
            >
              <CalendarIcon />
            </AriaButton>
          </AriaGroup>
          {description && <Description>{description}</Description>}
          <FieldError errorMessage={errorMessage} />
          <AriaPopover
            className={(_) => {
              const { className: stylexClass } = stylex.props(styles.popover)
              return stylexClass || ''
            }}
            style={(_) => {
              const { style: stylexStyle } = stylex.props(styles.popover)
              return stylexStyle ?? {}
            }}
          >
            <AriaDialog
              aria-label={label || 'Date range calendar'}
              className={dialogClass}
              style={dialogStyle}
            >
              <RangeCalendar />
            </AriaDialog>
          </AriaPopover>
        </>
      )}
    </AriaDateRangePicker>
  )
})
