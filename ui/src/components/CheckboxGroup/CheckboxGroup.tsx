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
import { CheckboxGroupContext } from '../Checkbox/context'

export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  description?: string
  errorMessage?: string | ((v: ValidationResult) => string)
  variant?: 'primary' | 'secondary' | 'tertiary'
  orientation?: 'horizontal' | 'vertical'
}

export const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(function CheckboxGroup(
  {
    style,
    className,
    label,
    description,
    errorMessage,
    variant = 'primary',
    children,
    ...rest
  },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.base,
    style,
  )

  const { orientation = 'vertical' } = rest

  const contextValue = React.useMemo(() => ({ variant }), [variant])

  return (
    <AriaCheckboxGroup
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {(values) => (
        <CheckboxGroupContext.Provider value={contextValue}>
          {label && <Label>{label}</Label>}
          <div
            {...stylex.props(
              styles.group,
              orientation === 'horizontal' && styles.groupHorizontal,
            )}
          >
            {typeof children === 'function' ? children(values) : children}
          </div>
          {description && <Description>{description}</Description>}
          <FieldError errorMessage={errorMessage} />
        </CheckboxGroupContext.Provider>
      )}
    </AriaCheckboxGroup>
  )
})
