'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './ChartContainer.styles'
import { Spinner } from '../Spinner'

export interface LegendItem {
  name: string
  value?: string | number
  color?: string
}

export interface ChartContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  legend?: LegendItem[]
  legendLimit?: number
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  style?: StyleXStyles
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  function ChartContainer(
    {
      title,
      description,
      actions,
      legend,
      legendLimit = 7,
      loading = false,
      empty = false,
      emptyMessage = 'No data available',
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.card,
      style,
    )

    const renderedLegend = React.useMemo(() => {
      if (!legend || legend.length === 0) return null

      const visibleItems = legend.slice(0, legendLimit)
      const hasMore = legend.length > legendLimit
      const moreCount = legend.length - legendLimit

      return (
        <div {...stylex.props(styles.legend)}>
          {visibleItems.map((item, idx) => (
            <div key={idx} {...stylex.props(styles.legendItem)}>
              <span
                {...stylex.props(styles.legendDot)}
                style={{ backgroundColor: item.color || 'var(--colorNeutral500)' }}
              />
              <span {...stylex.props(styles.legendName)}>
                {item.name}
                {item.value !== undefined && (
                  <span {...stylex.props(styles.legendValue)}>{item.value}</span>
                )}
              </span>
            </div>
          ))}
          {hasMore && (
            <span {...stylex.props(styles.legendMore)}>+{moreCount} more</span>
          )}
        </div>
      )
    }, [legend, legendLimit])

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        <div {...stylex.props(styles.header)}>
          <div>
            <h3 {...stylex.props(styles.title)}>{title}</h3>
            {description && (
              <div {...stylex.props(styles.description)}>{description}</div>
            )}
          </div>
          {actions && <div {...stylex.props(styles.actions)}>{actions}</div>}
        </div>

        {renderedLegend}

        <div {...stylex.props(styles.body)}>
          {loading && (
            <div {...stylex.props(styles.loadingContainer)}>
              <Spinner />
            </div>
          )}

          {empty ? (
            <div {...stylex.props(styles.emptyContainer)}>
              <p>{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    )
  },
)
