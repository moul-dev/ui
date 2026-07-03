'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Input as AriaInput,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './TextField.styles'

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  type?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      variant = 'primary',
      size = 'md',
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
              styles[size],
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
              styles[size],
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
