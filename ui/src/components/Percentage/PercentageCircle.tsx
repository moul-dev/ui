'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Percentage.styles'
import { tokens } from '../../tokens/tokens.stylex'

export interface PercentageCircleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  value: number
  label?: React.ReactNode
  showValueText?: boolean
  color?: string
  size?: number
  strokeWidth?: number
  style?: StyleXStyles
}

export const PercentageCircle = React.forwardRef<HTMLDivElement, PercentageCircleProps>(
  function PercentageCircle(
    {
      value,
      label,
      showValueText = true,
      color = tokens.colorChart1,
      size = 80,
      strokeWidth = 8,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.circleContainer,
      style,
    )

    const percentage = Math.min(100, Math.max(0, value))

    // SVG parameters
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        <div {...stylex.props(styles.circleWrapper)} style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--colorNeutral100)"
              strokeWidth={strokeWidth}
            />
            {/* Progress segment */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={String(color)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
            />
          </svg>
          {showValueText && (
            <span {...stylex.props(styles.circleValue)}>{percentage}%</span>
          )}
        </div>
        {label && <span {...stylex.props(styles.circleLabel)}>{label}</span>}
      </div>
    )
  },
)
