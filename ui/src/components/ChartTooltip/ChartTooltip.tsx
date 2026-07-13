'use client'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './ChartTooltip.styles'

export interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: any
  valueFormatter?: (value: any) => string
}

export const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div {...stylex.props(styles.container)}>
      {label && <div {...stylex.props(styles.label)}>{label}</div>}
      <ul {...stylex.props(styles.list)}>
        {payload.map((entry, idx) => {
          const formattedValue = valueFormatter
            ? valueFormatter(entry.value)
            : entry.value

          return (
            <li key={idx} {...stylex.props(styles.item)}>
              <span {...stylex.props(styles.indicator)}>
                <span
                  {...stylex.props(styles.dot)}
                  style={{
                    backgroundColor:
                      entry.color || entry.payload?.fill || 'var(--colorPrimary500)',
                  }}
                />
                <span {...stylex.props(styles.name)}>{entry.name}</span>
              </span>
              <span {...stylex.props(styles.value)}>{formattedValue}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
