'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Popover as AriaPopover,
  DialogTrigger as AriaDialogTrigger,
  Dialog as AriaDialog,
  OverlayArrow as AriaOverlayArrow,
  type PopoverProps as AriaPopoverProps,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Popover.styles'

// ── PopoverTrigger Component ─────────────────────────────────────────

export const PopoverTrigger = AriaDialogTrigger

// ── PopoverDialog Component ──────────────────────────────────────────

export interface PopoverDialogProps
  extends Omit<AriaDialogProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const PopoverDialog = React.forwardRef<
  HTMLDivElement,
  PopoverDialogProps
>(function PopoverDialog({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.dialog,
    style,
  )
  return (
    <AriaDialog
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </AriaDialog>
  )
})

// ── Popover Component ────────────────────────────────────────────────

export interface PopoverProps
  extends Omit<AriaPopoverProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  showArrow?: boolean
}

export const Popover = React.forwardRef<HTMLElement, PopoverProps>(
  function Popover(
    { style, className, showArrow = true, children, ...rest },
    ref,
  ) {
    return (
      <AriaPopover
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.popover, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.popover, style)
          return stylexStyle ?? {}
        }}
      >
        {(renderProps) => (
          <>
            {showArrow && (
              <AriaOverlayArrow>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  className={stylex.props(styles.arrow).className}
                  style={stylex.props(styles.arrow).style}
                >
                  <path d="M0 0 L6 6 L12 0 Z" />
                </svg>
              </AriaOverlayArrow>
            )}
            {typeof children === 'function' ? children(renderProps) : children}
          </>
        )}
      </AriaPopover>
    )
  },
)
