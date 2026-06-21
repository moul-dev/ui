'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Text as AriaText,
  type TextProps as AriaTextProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Description.styles'

export interface DescriptionProps extends Omit<AriaTextProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Description = React.forwardRef<HTMLElement, DescriptionProps>(
  function Description(
    { style, className, children, slot = 'description', ...rest },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      style,
    )
    return (
      <AriaText
        {...rest}
        ref={ref}
        slot={slot}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </AriaText>
    )
  },
)
