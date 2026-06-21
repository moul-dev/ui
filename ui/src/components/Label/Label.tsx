'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Label.styles'

export interface LabelProps extends Omit<AriaLabelProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      style,
    )
    return (
      <AriaLabel
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </AriaLabel>
    )
  },
)
