'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Percentage.styles'
import { tokens } from '../../tokens/tokens.stylex'

export interface PercentageBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  value: number
  label?: React.ReactNode
  showValueText?: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  style?: StyleXStyles
}

export const PercentageBar = React.forwardRef<HTMLDivElement, PercentageBarProps>(
  function PercentageBar(
    {
      value,
      label,
      showValueText = true,
      color = tokens.colorChart1,
      size = 'md',
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.barContainer,
      style,
    )

    const percentage = Math.min(100, Math.max(0, value))

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {(label || showValueText) && (
          <div {...stylex.props(styles.barHeader)}>
            {label && <span {...stylex.props(styles.barLabel)}>{label}</span>}
            {showValueText && (
              <span {...stylex.props(styles.barValue)}>{percentage}%</span>
            )}
          </div>
        )}
        <div
          {...stylex.props(
            styles.barTrack,
            size === 'sm' && styles.barTrackSm,
            size === 'md' && styles.barTrackMd,
            size === 'lg' && styles.barTrackLg,
          )}
        >
          <div
            {...stylex.props(styles.barFill)}
            style={{
              width: `${percentage}%`,
              backgroundColor: String(color),
            }}
          />
        </div>
      </div>
    )
  },
)
