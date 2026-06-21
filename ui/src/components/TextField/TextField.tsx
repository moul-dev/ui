'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  TextField as AriaTextField,
  Input as AriaInput,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './TextField.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  type?: string
  variant?: 'primary' | 'secondary'
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      variant = 'primary',
      style,
      className,
      label,
      description,
      errorMessage,
      placeholder,
      type = 'text',
      ...rest
    },
    ref,
  ) {
    return (
      <AriaTextField
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
        {label && <Label>{label}</Label>}
        <AriaInput
          ref={ref}
          placeholder={placeholder}
          type={type}
          className={(renderProps) => {
            const { className: stylexClass } = stylex.props(
              styles.input,
              styles[variant],
              renderProps.isInvalid && styles.inputInvalid,
              renderProps.isDisabled && styles.inputDisabled,
              style,
            )
            return stylexClass || ''
          }}
          style={(renderProps) => {
            const { style: stylexStyle } = stylex.props(
              styles.input,
              styles[variant],
              renderProps.isInvalid && styles.inputInvalid,
              renderProps.isDisabled && styles.inputDisabled,
              style,
            )
            return stylexStyle || {}
          }}
        />
        {description && <Description>{description}</Description>}
        <FieldError errorMessage={errorMessage} />
      </AriaTextField>
    )
  },
)
