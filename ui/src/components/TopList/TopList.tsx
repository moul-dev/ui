'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './TopList.styles'
import { CHART_COLORS } from '../ChartCommon'
import { tokens } from '../../tokens/tokens.stylex'

export interface TopListItem {
  label: string
  value: number
  color?: string
}

export interface TopListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  data: TopListItem[]
  maxValue?: number
  colors?: string[]
  barColor?: string
  multiColor?: boolean
  valueFormatter?: (value: number) => string
  style?: StyleXStyles
}

export const TopList = React.forwardRef<HTMLDivElement, TopListProps>(
  function TopList(
    {
      data,
      maxValue,
      colors = CHART_COLORS,
      barColor = tokens.colorChart1,
      multiColor = false,
      valueFormatter,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.container,
      style,
    )

    // Calculate maximum value for relative scaling
    const computedMax = React.useMemo(() => {
      if (maxValue !== undefined) return maxValue
      if (data.length === 0) return 1
      return Math.max(...data.map((d) => d.value))
    }, [data, maxValue])

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {data.map((item, idx) => {
          const percentage = Math.min(
            100,
            Math.max(0, (item.value / computedMax) * 100),
          )

          // Determine color for the bar
          const fill = multiColor
            ? item.color || colors[idx % colors.length]
            : barColor

          const formattedValue = valueFormatter
            ? valueFormatter(item.value)
            : item.value.toLocaleString()

          return (
            <div key={idx} {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.label)} title={item.label}>
                {item.label}
              </span>
              <div {...stylex.props(styles.track)}>
                <div
                  {...stylex.props(styles.bar)}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: String(fill),
                  }}
                />
              </div>
              <span {...stylex.props(styles.value)}>{formattedValue}</span>
            </div>
          )
        })}
      </div>
    )
  },
)
