'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './ToggleButton.styles'
import { warnMissingLabel } from '../../utils/warnMissingLabel'

export interface ToggleButtonProps
  extends Omit<AriaToggleButtonProps, 'style'> {
  style?: StyleXStyles
  className?: string
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'danger-soft'
}

export const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  ToggleButtonProps
>(function ToggleButton(
  {
    variant = 'secondary',
    isSelected,
    defaultSelected,
    onChange,
    isDisabled,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  if (process.env.NODE_ENV !== 'production') {
    warnMissingLabel('ToggleButton', {
      label: rest['aria-label'],
      labelledBy: rest['aria-labelledby'],
      children: typeof children === 'function' ? undefined : children,
    })
  }

  return (
    <AriaToggleButton
      {...rest}
      ref={ref}
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={(renderProps) => {
        const selectedStyle =
          styles[`${variant}Selected` as keyof typeof styles]
        const { className: stylexClass } = stylex.props(
          styles.base,
          styles[variant],
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.isDisabled,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const selectedStyle =
          styles[`${variant}Selected` as keyof typeof styles]
        const { style: stylexStyle } = stylex.props(
          styles.base,
          styles[variant],
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.isDisabled,
          style,
        )
        return stylexStyle
      }}
    >
      {children}
    </AriaToggleButton>
  )
})
