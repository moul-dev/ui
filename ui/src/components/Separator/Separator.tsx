'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
} from 'react-aria-components'
import { styles } from './Separator.styles'

export interface SeparatorProps extends Omit<AriaSeparatorProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Separator = React.forwardRef<HTMLElement, SeparatorProps>(
  function Separator(
    { orientation = 'horizontal', style, className, ...rest },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      orientation === 'horizontal' ? styles.horizontal : styles.vertical,
      style,
    )
    return (
      <AriaSeparator
        {...rest}
        ref={ref}
        orientation={orientation}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      />
    )
  },
)
