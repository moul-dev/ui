'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  TextField as AriaTextField,
  TextArea as AriaTextArea,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './TextArea.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'

export interface TextAreaProps extends Omit<AriaTextFieldProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  rows?: number
  variant?: 'primary' | 'secondary'
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      variant = 'primary',
      style,
      className,
      label,
      description,
      errorMessage,
      placeholder,
      rows,
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
        <AriaTextArea
          ref={ref}
          placeholder={placeholder}
          rows={rows}
          className={(renderProps) => {
            const { className: stylexClass } = stylex.props(
              styles.textarea,
              styles[variant],
              renderProps.isInvalid && styles.textareaInvalid,
              renderProps.isDisabled && styles.textareaDisabled,
              style,
            )
            return stylexClass || ''
          }}
          style={(renderProps) => {
            const { style: stylexStyle } = stylex.props(
              styles.textarea,
              styles[variant],
              renderProps.isInvalid && styles.textareaInvalid,
              renderProps.isDisabled && styles.textareaDisabled,
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
