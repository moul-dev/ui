'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './ToggleButtonGroup.styles'

export interface ToggleButtonGroupProps
  extends Omit<AriaToggleButtonGroupProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ToggleButtonGroup = React.forwardRef<
  HTMLDivElement,
  ToggleButtonGroupProps
>(function ToggleButtonGroup(
  { style, className, orientation = 'horizontal', children, ...rest },
  ref,
) {
  return (
    <AriaToggleButtonGroup
      {...rest}
      ref={ref}
      orientation={orientation}
      className={(renderProps) => {
        const { className: stylexClass } = stylex.props(
          styles.base,
          renderProps.orientation === 'vertical' && styles.vertical,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const { style: stylexStyle } = stylex.props(
          styles.base,
          renderProps.orientation === 'vertical' && styles.vertical,
          style,
        )
        return stylexStyle
      }}
    >
      {children}
    </AriaToggleButtonGroup>
  )
})
