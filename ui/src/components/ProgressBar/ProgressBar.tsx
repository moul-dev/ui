'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Label as AriaLabel,
  ProgressBar as AriaProgressBar,
  type ProgressBarProps as AriaProgressBarProps,
} from 'react-aria-components'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { styles } from './ProgressBar.styles'

export type ProgressBarVariant =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'

export type ProgressBarSize = 'sm' | 'md' | 'lg'
export type ProgressBarShape = 'pill' | 'square'

export interface ProgressBarProps
  extends Omit<AriaProgressBarProps, 'style' | 'children'> {
  label?: React.ReactNode
  showValueText?: boolean
  variant?: ProgressBarVariant
  size?: ProgressBarSize
  shape?: ProgressBarShape
  color?: string
  style?: StyleXStyles
  className?: string
  children?:
    | React.ReactNode
    | ((values: {
        percentage?: number
        valueText?: string
        isIndeterminate: boolean
      }) => React.ReactNode)
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(
    {
      label,
      showValueText,
      variant = 'primary',
      size = 'md',
      shape = 'pill',
      color,
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('ProgressBar', {
        label:
          rest['aria-label'] ||
          (typeof label === 'string' ? label : undefined),
        labelledBy: rest['aria-labelledby'],
        children: typeof children === 'function' ? undefined : (children ?? label),
      })
    }

    const sizeSuffix = size === 'sm' ? 'Sm' : size === 'lg' ? 'Lg' : 'Md'
    const shapeSuffix = shape === 'square' ? 'Square' : 'Pill'

    return (
      <AriaProgressBar
        {...rest}
        ref={ref}
        aria-label={
          rest['aria-label'] ??
          (typeof label === 'string' ? label : undefined)
        }
        className={() => {
          const { className: stylexClass } = stylex.props(
            styles.container,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.container, style)
          return stylexStyle || {}
        }}
      >
        {(renderProps) => {
          if (typeof children === 'function') {
            return children(renderProps)
          }

          if (children) {
            return children
          }

          const { percentage, valueText, isIndeterminate } = renderProps
          const pct = percentage ?? 0
          const shouldShowValue = showValueText ?? (label !== undefined && !isIndeterminate)
          const displayValue = valueText ?? (isIndeterminate ? '' : `${Math.round(pct)}%`)

          const trackSizeStyle =
            styles[`track${sizeSuffix}` as 'trackSm' | 'trackMd' | 'trackLg']
          const trackShapeStyle =
            styles[`shape${shapeSuffix}` as 'shapePill' | 'shapeSquare']

          const fillVariantStyle = styles[variant]

          return (
            <>
              {(label || (shouldShowValue && !isIndeterminate)) && (
                <div {...stylex.props(styles.header)}>
                  {label && (
                    <AriaLabel {...stylex.props(styles.label)}>
                      {label}
                    </AriaLabel>
                  )}
                  {shouldShowValue && !isIndeterminate && (
                    <span {...stylex.props(styles.value)}>{displayValue}</span>
                  )}
                </div>
              )}
              <div
                {...stylex.props(
                  styles.track,
                  trackSizeStyle,
                  trackShapeStyle,
                )}
              >
                <div
                  {...stylex.props(
                    styles.fill,
                    fillVariantStyle,
                    isIndeterminate && styles.fillIndeterminate,
                  )}
                  style={{
                    ...(isIndeterminate ? {} : { width: `${pct}%` }),
                    ...(color ? { backgroundColor: color } : {}),
                  }}
                />
              </div>
            </>
          )
        }}
      </AriaProgressBar>
    )
  },
)

ProgressBar.displayName = 'ProgressBar'
