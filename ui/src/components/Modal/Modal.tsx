'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components'
import { styles } from './Modal.styles'

// ── ModalOverlay Component ───────────────────────────────────────────

export interface ModalOverlayProps
  extends Omit<AriaModalOverlayProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const ModalOverlay = React.forwardRef<HTMLDivElement, ModalOverlayProps>(
  function ModalOverlay({ style, className, children, ...rest }, ref) {
    return (
      <AriaModalOverlay
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(styles.overlay, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.overlay, style)
          return stylexStyle ?? {}
        }}
      >
        {children}
      </AriaModalOverlay>
    )
  },
)

// ── Modal Component ──────────────────────────────────────────────────

export interface ModalProps
  extends Omit<AriaModalOverlayProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  function Modal({ size = 'md', style, className, children, ...rest }, ref) {
    return (
      <AriaModal
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.modal,
            styles[size],
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(
            styles.modal,
            styles[size],
            style,
          )
          return stylexStyle ?? {}
        }}
      >
        {children}
      </AriaModal>
    )
  },
)

// ── ModalDialog Component ────────────────────────────────────────────

export interface ModalDialogProps
  extends Omit<AriaDialogProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const ModalDialog = React.forwardRef<HTMLDivElement, ModalDialogProps>(
  function ModalDialog({ style, className, children, ...rest }, ref) {
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
  },
)

// ── ModalHeader Component ────────────────────────────────────────────

export interface ModalHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  function ModalHeader({ style, className, children, ...rest }, ref) {
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
  },
)

// ── ModalBody Component ──────────────────────────────────────────────

export interface ModalBodyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  function ModalBody({ style, className, children, ...rest }, ref) {
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
  },
)

// ── ModalFooter Component ────────────────────────────────────────────

export interface ModalFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  function ModalFooter({ style, className, children, ...rest }, ref) {
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
  },
)
