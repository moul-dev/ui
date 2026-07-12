'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  TooltipTrigger as AriaTooltipTrigger,
} from 'react-aria-components'
import { styles } from './Tooltip.styles'

// ── TooltipTrigger Component ─────────────────────────────────────────

export const TooltipTrigger = AriaTooltipTrigger

// ── Tooltip Component ────────────────────────────────────────────────

export interface TooltipProps
  extends Omit<AriaTooltipProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  /**
   * The distance between the tooltip and the trigger button.
   * @default 8
   */
  offset?: number
  /**
   * The offset along the cross axis.
   * @default 0
   */
  crossOffset?: number
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip({ style, className, children, ...rest }, ref) {
    return (
      <AriaTooltip
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.tooltip, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.tooltip, style)
          return stylexStyle ?? {}
        }}
      >
        {children}
      </AriaTooltip>
    )
  },
)
