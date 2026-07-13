'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { styles } from './DoughnutChart.styles'
import { CHART_COLORS } from '../ChartCommon'
import { ChartTooltip } from '../ChartTooltip'

export interface DoughnutChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  data: any[]
  nameKey: string
  valueKey: string
  colors?: string[]
  innerRadius?: number | string
  outerRadius?: number | string
  paddingAngle?: number
  valueFormatter?: (value: any) => string
  height?: number | string
  style?: StyleXStyles
}

export const DoughnutChart = React.forwardRef<HTMLDivElement, DoughnutChartProps>(
  function DoughnutChart(
    {
      data,
      nameKey,
      valueKey,
      colors = CHART_COLORS,
      innerRadius = '65%',
      outerRadius = '85%',
      paddingAngle = 3,
      valueFormatter,
      height = 300,
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

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={{ ...stylexStyle, height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Tooltip
              content={
                <ChartTooltip valueFormatter={valueFormatter} />
              }
            />
            <Pie
              data={data}
              nameKey={nameKey}
              dataKey={valueKey}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              cornerRadius={4}
              stroke="var(--colorBg)"
              strokeWidth={2}
            >
              {data.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={colors[idx % colors.length]}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    )
  },
)
