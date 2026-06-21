import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Badge.styles'

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  variant?: BadgeVariant
  style?: StyleXStyles
  className?: string
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    { variant = 'neutral', style, className, children, ...rest },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[variant],
      style,
    )

    return (
      <span
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </span>
    )
  },
)
