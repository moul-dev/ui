'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './CheckboxGroup.styles'
import { Label } from '../Label'
import { Description } from '../Description'
import { FieldError } from '../FieldError'

export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
}

export const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(function CheckboxGroup(
  { style, className, label, description, errorMessage, children, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.base,
    style,
  )
  return (
    <AriaCheckboxGroup
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {(values) => (
        <>
          {label && <Label>{label}</Label>}
          <div {...stylex.props(styles.group)}>
            {typeof children === 'function' ? children(values) : children}
          </div>
          {description && <Description>{description}</Description>}
          <FieldError errorMessage={errorMessage} />
        </>
      )}
    </AriaCheckboxGroup>
  )
})
