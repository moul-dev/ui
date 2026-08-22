'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  DateField as AriaDateField,
  type DateFieldProps as AriaDateFieldProps,
  DateInput as AriaDateInput,
  type DateInputProps as AriaDateInputProps,
  DateSegment as AriaDateSegment,
  type DateSegmentProps as AriaDateSegmentProps,
  type DateValue,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './DateField.styles'

// ── DateSegment Component ─────────────────────────────────────────────

export interface DateSegmentProps
  extends Omit<AriaDateSegmentProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const DateSegment = React.forwardRef<HTMLDivElement, DateSegmentProps>(
  function DateSegment({ style, className, segment, ...rest }, ref) {
    return (
      <AriaDateSegment
        {...rest}
        ref={ref}
        segment={segment}
        className={(renderProps) => {
          const isLiteral = segment.type === 'literal'
          const { className: stylexClass } = stylex.props(
            styles.segment,
            isLiteral && styles.segmentLiteral,
            renderProps.isFocused && styles.segmentFocused,
            renderProps.isPlaceholder && styles.segmentPlaceholder,
            renderProps.isDisabled && styles.segmentDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const isLiteral = segment.type === 'literal'
          const { style: stylexStyle } = stylex.props(
            styles.segment,
            isLiteral && styles.segmentLiteral,
            renderProps.isFocused && styles.segmentFocused,
            renderProps.isPlaceholder && styles.segmentPlaceholder,
            renderProps.isDisabled && styles.segmentDisabled,
            style,
          )
          return stylexStyle ?? {}
        }}
      />
    )
  },
)

// ── DateInput Component ───────────────────────────────────────────────

export interface DateInputProps
  extends Omit<AriaDateInputProps, 'style' | 'className' | 'children'> {
  style?: StyleXStyles
  className?: string
  children?: (segment: any) => React.ReactElement
}

export const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  function DateInput({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.dateInput,
      style,
    )

    return (
      <AriaDateInput
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children || ((segment: any) => <DateSegment key={segment.type} segment={segment} />)}
      </AriaDateInput>
    )
  },
)

// ── DateField Component ───────────────────────────────────────────────

export interface DateFieldProps<T extends DateValue = DateValue>
  extends Omit<AriaDateFieldProps<T>, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const DateField = React.forwardRef<HTMLDivElement, DateFieldProps<any>>(
  function DateField(
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

    return (
      <AriaDateField
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
            <div
              className={
                stylex.props(
                  styles.group,
                  groupSizeStyle,
                  styles[variant],
                  isDisabled && styles.groupDisabled,
                  isInvalid && styles.groupInvalid,
                  style,
                ).className || ''
              }
              style={
                stylex.props(
                  styles.group,
                  groupSizeStyle,
                  styles[variant],
                  isDisabled && styles.groupDisabled,
                  isInvalid && styles.groupInvalid,
                  style,
                ).style || {}
              }
            >
              <DateInput />
            </div>
            {description && <Description>{description}</Description>}
            <FieldError errorMessage={errorMessage} />
          </>
        )}
      </AriaDateField>
    )
  },
)
