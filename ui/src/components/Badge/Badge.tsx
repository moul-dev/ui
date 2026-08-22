import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Badge.styles'

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'dot'

export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  style?: StyleXStyles
  className?: string
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    {
      variant = 'neutral',
      size = 'md',
      dot = false,
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const showDot = dot || variant === 'dot'
    const dotColorKey =
      variant === 'dot' ? 'dot_neutral' : (`dot_${variant}` as const)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[size],
      styles[variant],
      showDot && Boolean(children) && styles.hasDot,
      style,
    )

    const { className: dotClass, style: dotStyle } = stylex.props(
      styles.dotIndicator,
      styles[`dot_${size}`],
      styles[dotColorKey] || styles.dot_neutral,
    )

    return (
      <span
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {showDot && <span aria-hidden="true" className={dotClass} style={dotStyle} />}
        {children}
      </span>
    )
  },
)
