'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Tooltip.styles'

// ── TooltipTrigger Component ─────────────────────────────────────────

export const TooltipTrigger = AriaTooltipTrigger

// ── Tooltip Component ────────────────────────────────────────────────

export interface TooltipProps
  extends Omit<AriaTooltipProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
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
