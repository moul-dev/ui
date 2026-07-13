'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { styles } from './BarChart.styles'
import { CHART_COLORS } from '../ChartCommon'
import { ChartTooltip } from '../ChartTooltip'

export interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  data: any[]
  indexKey: string
  categories: string[]
  colors?: string[]
  layout?: 'horizontal' | 'vertical'
  stacked?: boolean
  categorical?: boolean
  style?: StyleXStyles
  valueFormatter?: (value: any) => string
  height?: number | string
  gridLines?: boolean
}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  function BarChart(
    {
      data,
      indexKey,
      categories,
      colors = CHART_COLORS,
      layout = 'horizontal',
      stacked = false,
      categorical = false,
      valueFormatter,
      height = 300,
      gridLines = true,
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

    const isVertical = layout === 'vertical'

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
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={{
              top: 10,
              right: 10,
              left: isVertical ? 20 : -20,
              bottom: 5,
            }}
          >
            {gridLines && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--colorBorderSubtle)"
                vertical={isVertical}
                horizontal={!isVertical}
              />
            )}

            {isVertical ? (
              <>
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'var(--colorBorderSubtle)' }}
                  tickLine={false}
                  tickFormatter={valueFormatter}
                />
                <YAxis
                  dataKey={indexKey}
                  type="category"
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'var(--colorBorderSubtle)' }}
                  tickLine={false}
                  dx={-5}
                  width={90}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={indexKey}
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'var(--colorBorderSubtle)' }}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  tickFormatter={valueFormatter}
                />
              </>
            )}

            <Tooltip
              content={
                <ChartTooltip valueFormatter={valueFormatter} />
              }
              cursor={{ fill: 'var(--colorNeutral100)', opacity: 0.5 }}
            />

            {categories.map((category, idx) => {
              const baseColor = colors[idx % colors.length]
              return (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId={stacked ? 'stack' : undefined}
                  fill={categorical ? undefined : baseColor}
                  radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {categorical &&
                    data.map((_, itemIdx) => (
                      <Cell
                        key={`cell-${itemIdx}`}
                        fill={colors[itemIdx % colors.length]}
                      />
                    ))}
                </Bar>
              )
            })}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  },
)
