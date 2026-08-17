'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Stat.styles'

export interface StatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  label: React.ReactNode
  value?: React.ReactNode
  variant?: 'default' | 'flat' | 'glass' | 'elevated'
  icon?: React.ReactNode
  description?: React.ReactNode
  trend?: string | number
  trendDirection?: 'up' | 'down' | 'neutral'
  trendLabel?: React.ReactNode
  children?: React.ReactNode
  style?: StyleXStyles
}

const ArrowUp = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '12px', height: '12px' }}
  >
    <line x1={12} y1={19} x2={12} y2={5} />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const ArrowDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '12px', height: '12px' }}
  >
    <line x1={12} y1={5} x2={12} y2={19} />
    <polyline points="19 12 12 19 5 12" />
  </svg>
)

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(function Stat(
  {
    label,
    value,
    variant = 'default',
    icon,
    description,
    trend,
    trendDirection = 'neutral',
    trendLabel,
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.container,
    variant === 'default' && styles.variantDefault,
    variant === 'flat' && styles.variantFlat,
    variant === 'glass' && styles.variantGlass,
    variant === 'elevated' && styles.variantElevated,
    style,
  )

  const badgeStyles = stylex.props(
    styles.trendBadge,
    trendDirection === 'up' && styles.trendUp,
    trendDirection === 'down' && styles.trendDown,
    trendDirection === 'neutral' && styles.trendNeutral,
  )

  const hasFooter = trend !== undefined || trendLabel !== undefined

  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      <div {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.label)}>{label}</span>
        {icon && <div {...stylex.props(styles.icon)}>{icon}</div>}
      </div>

      {(value !== undefined || description || children) && (
        <div {...stylex.props(styles.body)}>
          {value !== undefined && (
            <span {...stylex.props(styles.value)}>{value}</span>
          )}
          {description && (
            <span {...stylex.props(styles.description)}>{description}</span>
          )}
          {children}
        </div>
      )}

      {hasFooter && (
        <div {...stylex.props(styles.footer)}>
          {trend !== undefined && (
            <span {...badgeStyles}>
              {trendDirection === 'up' && <ArrowUp />}
              {trendDirection === 'down' && <ArrowDown />}
              {trend}
            </span>
          )}
          {trendLabel && (
            <span {...stylex.props(styles.trendText)}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
})
