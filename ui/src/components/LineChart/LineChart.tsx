'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { styles } from './LineChart.styles'
import { CHART_COLORS } from '../ChartCommon'
import { ChartTooltip } from '../ChartTooltip'

export interface LineChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
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
}

export const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  function LineChart(
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

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={{ ...stylexStyle, height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
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
              content={
                <ChartTooltip valueFormatter={valueFormatter} />
              }
              cursor={{ stroke: 'var(--colorBorderSubtle)' }}
            />
            {categories.map((category, idx) => {
              const color = colors[idx % colors.length]
              return (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={color}
                  strokeWidth={2}
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
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  },
)
