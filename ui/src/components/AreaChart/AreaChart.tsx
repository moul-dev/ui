'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from '../ChartCommon'
import { ChartTooltip } from '../ChartTooltip'
import { styles } from './AreaChart.styles'

export interface AreaChartProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  data: any[]
  indexKey: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: any) => string
  height?: number | string
  gridLines?: boolean
  style?: StyleXStyles
  showXAxis?: boolean
  showYAxis?: boolean
  margin?: { top: number; right: number; bottom: number; left: number }
}

export const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
  function AreaChart(
    {
      data,
      indexKey,
      categories,
      colors = CHART_COLORS,
      valueFormatter,
      height = 300,
      gridLines = true,
      showXAxis = true,
      showYAxis = true,
      margin,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.wrapper,
      style,
    )

    const axisTickStyle = {
      fill: 'var(--colorFgSubtle)',
      fontSize: 11,
      fontFamily: 'var(--fontFamilyBase)',
    }

    const uniqueId = React.useId().replace(/:/g, '')

    // If axes are shown, use standard margins. If not, use zero margins to go edge-to-edge.
    const defaultMargin =
      showXAxis || showYAxis
        ? { top: 10, right: 10, left: -20, bottom: 5 }
        : { top: 0, right: 0, left: 0, bottom: 0 }

    const finalMargin = margin ?? defaultMargin

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={{ ...stylexStyle, height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={finalMargin}>
            <defs>
              {categories.map((category, idx) => {
                const color = colors[idx % colors.length]
                const gradId = `area-grad-${uniqueId}-${category.replace(/\s+/g, '-')}`
                return (
                  <linearGradient
                    key={category}
                    id={gradId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                )
              })}
            </defs>

            {gridLines && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--colorBorderSubtle)"
                vertical={false}
              />
            )}
            {showXAxis && (
              <XAxis
                dataKey={indexKey}
                tick={axisTickStyle}
                axisLine={{ stroke: 'var(--colorBorderSubtle)' }}
                tickLine={false}
                dy={10}
              />
            )}
            {showYAxis && (
              <YAxis
                tick={axisTickStyle}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={valueFormatter}
              />
            )}
            <Tooltip
              content={<ChartTooltip valueFormatter={valueFormatter} />}
              cursor={{ stroke: 'var(--colorBorderSubtle)' }}
            />
            {categories.map((category, idx) => {
              const color = colors[idx % colors.length]
              const gradId = `area-grad-${uniqueId}-${category.replace(/\s+/g, '-')}`
              return (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: 'var(--colorBg)',
                    strokeWidth: 2,
                  }}
                  connectNulls
                />
              )
            })}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
)
