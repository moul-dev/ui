'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './AlertDialog.styles'

// ── AlertDialog Component ────────────────────────────────────────────

export interface AlertDialogProps
  extends Omit<AriaDialogProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const AlertDialog = React.forwardRef<HTMLDivElement, AlertDialogProps>(
  function AlertDialog({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.dialog,
      style,
    )
    return (
      <AriaDialog
        role="alertdialog"
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </AriaDialog>
    )
  },
)

// ── AlertDialogHeader Component ──────────────────────────────────────

export interface AlertDialogHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  AlertDialogHeaderProps
>(function AlertDialogHeader({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.header,
    style,
  )
  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </div>
  )
})

// ── AlertDialogBody Component ────────────────────────────────────────

export interface AlertDialogBodyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const AlertDialogBody = React.forwardRef<
  HTMLDivElement,
  AlertDialogBodyProps
>(function AlertDialogBody({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.body,
    style,
  )
  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </div>
  )
})

// ── AlertDialogFooter Component ──────────────────────────────────────

export interface AlertDialogFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  AlertDialogFooterProps
>(function AlertDialogFooter({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.footer,
    style,
  )
  return (
    <div
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </div>
  )
})
