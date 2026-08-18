'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  Heading as AriaHeading,
  type HeadingProps as AriaHeadingProps,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
} from 'react-aria-components'
import { styles } from './Drawer.styles'

export type DrawerPlacement = 'top' | 'bottom' | 'left' | 'right'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full'

interface DrawerContextValue {
  placement: DrawerPlacement
  size: DrawerSize
}

const DrawerContext = React.createContext<DrawerContextValue>({
  placement: 'right',
  size: 'md',
})

function getOverlayPlacementStyle(placement: DrawerPlacement) {
  switch (placement) {
    case 'left':
      return styles.overlayLeft
    case 'top':
      return styles.overlayTop
    case 'bottom':
      return styles.overlayBottom
    case 'right':
    default:
      return styles.overlayRight
  }
}

function getSizeStyle(placement: DrawerPlacement, size: DrawerSize) {
  const isVertical = placement === 'top' || placement === 'bottom'
  switch (size) {
    case 'sm':
      return isVertical ? styles.verticalSm : styles.sideSm
    case 'lg':
      return isVertical ? styles.verticalLg : styles.sideLg
    case 'full':
      return isVertical ? styles.verticalFull : styles.sideFull
    case 'md':
    default:
      return isVertical ? styles.verticalMd : styles.sideMd
  }
}

function getPlacementStyle(placement: DrawerPlacement) {
  switch (placement) {
    case 'left':
      return styles.placementLeft
    case 'top':
      return styles.placementTop
    case 'bottom':
      return styles.placementBottom
    case 'right':
    default:
      return styles.placementRight
  }
}

// ── DrawerOverlay Component ──────────────────────────────────────────

export interface DrawerOverlayProps
  extends Omit<AriaModalOverlayProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  placement?: DrawerPlacement
  size?: DrawerSize
}

export const DrawerOverlay = React.forwardRef<
  HTMLDivElement,
  DrawerOverlayProps
>(function DrawerOverlay(
  { placement = 'right', size = 'md', style, className, children, ...rest },
  ref,
) {
  const overlayPlacementStyle = getOverlayPlacementStyle(placement)

  return (
    <DrawerContext.Provider value={{ placement, size }}>
      <AriaModalOverlay
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.overlay,
            overlayPlacementStyle,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(
            styles.overlay,
            overlayPlacementStyle,
            style,
          )
          return stylexStyle ?? {}
        }}
      >
        {children}
      </AriaModalOverlay>
    </DrawerContext.Provider>
  )
})

// ── Drawer Component ─────────────────────────────────────────────────

export interface DrawerProps
  extends Omit<AriaModalOverlayProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
  placement?: DrawerPlacement
  size?: DrawerSize
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  function Drawer(
    { placement, size, style, className, children, ...rest },
    ref,
  ) {
    const ctx = React.useContext(DrawerContext)
    const finalPlacement = placement ?? ctx.placement ?? 'right'
    const finalSize = size ?? ctx.size ?? 'md'

    const placementStyle = getPlacementStyle(finalPlacement)
    const sizeStyle = getSizeStyle(finalPlacement, finalSize)

    return (
      <AriaModal
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.drawer,
            placementStyle,
            sizeStyle,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(
            styles.drawer,
            placementStyle,
            sizeStyle,
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

// ── DrawerDialog Component ───────────────────────────────────────────

export interface DrawerDialogProps
  extends Omit<AriaDialogProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerDialog = React.forwardRef<HTMLDivElement, DrawerDialogProps>(
  function DrawerDialog({ style, className, children, ...rest }, ref) {
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

// ── DrawerHeader Component ───────────────────────────────────────────

export interface DrawerHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  function DrawerHeader({ style, className, children, ...rest }, ref) {
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

// ── DrawerTitle Component ────────────────────────────────────────────

export interface DrawerTitleProps
  extends Omit<AriaHeadingProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  DrawerTitleProps
>(function DrawerTitle({ style, className, children, ...rest }, ref) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.title,
    style,
  )
  return (
    <AriaHeading
      slot="title"
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </AriaHeading>
  )
})

// ── DrawerCloseButton Component ──────────────────────────────────────

export interface DrawerCloseButtonProps
  extends Omit<AriaButtonProps, 'style' | 'className'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerCloseButton = React.forwardRef<
  HTMLButtonElement,
  DrawerCloseButtonProps
>(function DrawerCloseButton(
  {
    style,
    className,
    children,
    'aria-label': ariaLabel = 'Close drawer',
    ...rest
  },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.closeButton,
    style,
  )
  return (
    <AriaButton
      slot="close"
      aria-label={ariaLabel}
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </AriaButton>
  )
})

// ── DrawerBody Component ─────────────────────────────────────────────

export interface DrawerBodyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerBody = React.forwardRef<HTMLDivElement, DrawerBodyProps>(
  function DrawerBody({ style, className, children, ...rest }, ref) {
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

// ── DrawerFooter Component ───────────────────────────────────────────

export interface DrawerFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  function DrawerFooter({ style, className, children, ...rest }, ref) {
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
