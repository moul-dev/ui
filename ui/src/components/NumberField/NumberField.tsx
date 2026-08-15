'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  Group as AriaGroup,
  Input as AriaInput,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  type ValidationResult,
} from 'react-aria-components'
import { Description } from '../Description'
import { FieldError } from '../FieldError'
import { Label } from '../Label'
import { styles } from './NumberField.styles'

export interface NumberFieldProps extends Omit<AriaNumberFieldProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  placeholder?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      variant = 'primary',
      size = 'md',
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
    const sizeSuffix = size === 'sm' ? 'Sm' : size === 'lg' ? 'Lg' : 'Md'
    const groupSizeStyle = styles[`group${sizeSuffix}` as keyof typeof styles]
    const inputSizeStyle = styles[`input${sizeSuffix}` as keyof typeof styles]
    const stepperContainerSizeStyle =
      styles[`stepperContainer${sizeSuffix}` as keyof typeof styles]

    return (
      <AriaNumberField
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
        <AriaGroup
          className={(renderProps) => {
            const { className: stylexClass } = stylex.props(
              styles.group,
              groupSizeStyle,
              styles[variant],
              renderProps.isHovered && styles.groupHover,
              renderProps.isFocusWithin && styles.groupFocused,
              renderProps.isInvalid && styles.groupInvalid,
              renderProps.isInvalid &&
                renderProps.isFocusWithin &&
                styles.groupFocusedInvalid,
              renderProps.isDisabled && styles.groupDisabled,
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
              renderProps.isInvalid && styles.groupInvalid,
              renderProps.isInvalid &&
                renderProps.isFocusWithin &&
                styles.groupFocusedInvalid,
              renderProps.isDisabled && styles.groupDisabled,
              style,
            )
            return stylexStyle || {}
          }}
        >
          <AriaInput
            ref={ref}
            placeholder={placeholder}
            className={() =>
              stylex.props(styles.input, inputSizeStyle).className || ''
            }
            style={() => stylex.props(styles.input, inputSizeStyle).style || {}}
          />
          <div
            {...stylex.props(
              styles.stepperContainer,
              stepperContainerSizeStyle,
              variant === 'primary' && styles.stepperContainerPrimary,
              variant === 'secondary' && styles.stepperContainerSecondary,
            )}
          >
            <AriaButton
              slot="increment"
              className={(renderProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.stepperButton,
                  renderProps.isDisabled && styles.stepperButtonDisabled,
                )
                return stylexClass || ''
              }}
              style={(renderProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.stepperButton,
                  renderProps.isDisabled && styles.stepperButtonDisabled,
                )
                return stylexStyle || {}
              }}
            >
              ▲
            </AriaButton>
            <AriaButton
              slot="decrement"
              className={(renderProps) => {
                const { className: stylexClass } = stylex.props(
                  styles.stepperButton,
                  renderProps.isDisabled && styles.stepperButtonDisabled,
                )
                return stylexClass || ''
              }}
              style={(renderProps) => {
                const { style: stylexStyle } = stylex.props(
                  styles.stepperButton,
                  renderProps.isDisabled && styles.stepperButtonDisabled,
                )
                return stylexStyle || {}
              }}
            >
              ▼
            </AriaButton>
          </div>
        </AriaGroup>
        {description && <Description>{description}</Description>}
        <FieldError errorMessage={errorMessage} />
      </AriaNumberField>
    )
  },
)
