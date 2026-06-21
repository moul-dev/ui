'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  SearchField as AriaSearchField,
  Group as AriaGroup,
  Input as AriaInput,
  Button as AriaButton,
  type SearchFieldProps as AriaSearchFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './SearchField.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'

export interface SearchFieldProps extends Omit<AriaSearchFieldProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  variant?: 'primary' | 'secondary'
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      variant = 'primary',
      style,
      className,
      label,
      description,
      errorMessage,
      placeholder,
      ...rest
    },
    ref,
  ) {
    return (
      <AriaSearchField
        {...rest}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.container)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.container)
          return stylexStyle
        }}
      >
        {({ state }) => (
          <>
            {label && <Label>{label}</Label>}
            <AriaGroup
              className={(groupProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.group,
                  styles[variant],
                  groupProps.isHovered && styles.groupHover,
                  groupProps.isFocusWithin && styles.groupFocused,
                  groupProps.isInvalid && styles.groupInvalid,
                  groupProps.isInvalid &&
                    groupProps.isFocusWithin &&
                    styles.groupFocusedInvalid,
                  groupProps.isDisabled && styles.groupDisabled,
                  style,
                )
                return stylexClass || ''
              }}
              style={(groupProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.group,
                  styles[variant],
                  groupProps.isHovered && styles.groupHover,
                  groupProps.isFocusWithin && styles.groupFocused,
                  groupProps.isInvalid && styles.groupInvalid,
                  groupProps.isInvalid &&
                    groupProps.isFocusWithin &&
                    styles.groupFocusedInvalid,
                  groupProps.isDisabled && styles.groupDisabled,
                  style,
                )
                return stylexStyle || {}
              }}
            >
              {/* Search Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...stylex.props(styles.icon)}
                aria-hidden="true"
              >
                <circle cx={11} cy={11} r={8} />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <AriaInput
                ref={ref}
                placeholder={placeholder}
                className={() => stylex.props(styles.input).className || ''}
                style={() => stylex.props(styles.input).style || {}}
              />
              {/* Clear button */}
              <AriaButton
                className={(_) => {
                  const isHidden = state.value === ''
                  const { className: stylexClass } = stylex.props(
                    styles.clearButton,
                    isHidden && styles.clearButtonHidden,
                  )
                  return stylexClass || ''
                }}
                style={(_) => {
                  const isHidden = state.value === ''
                  const { style: stylexStyle } = stylex.props(
                    styles.clearButton,
                    isHidden && styles.clearButtonHidden,
                  )
                  return stylexStyle || {}
                }}
              >
                ✕
              </AriaButton>
            </AriaGroup>
            {description && <Description>{description}</Description>}
            <FieldError errorMessage={errorMessage} />
          </>
        )}
      </AriaSearchField>
    )
  },
)
