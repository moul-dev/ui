'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import {
  type DragControls,
  motion,
  useAnimation,
  useDragControls,
} from 'motion/react'
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

export interface DrawerContextValue {
  placement: DrawerPlacement
  size: DrawerSize
  onClose?: () => void
  onOpenChange?: (isOpen: boolean) => void
  dragControls?: DragControls
}

const DrawerContext = React.createContext<DrawerContextValue>({
  placement: 'right',
  size: 'md',
})

export function useDrawer() {
  return React.useContext(DrawerContext)
}

function getOverlayPlacementStyle(placement: DrawerPlacement) {
  switch (placement) {
    case 'left':
      return styles.overlayLeft
    case 'top':
      return styles.overlayTop
    case 'bottom':
      return styles.overlayBottom
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
  { placement, size = 'md', style, className, children, ...rest },
  ref,
) {
  let resolvedPlacement: DrawerPlacement = placement ?? 'right'
  if (!placement && typeof children !== 'function') {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && (child.props as any)?.placement) {
        resolvedPlacement = (child.props as any).placement
      }
    })
  }

  const dragControls = useDragControls()
  const onClose = React.useCallback(() => {
    rest.onOpenChange?.(false)
  }, [rest.onOpenChange])

  const overlayPlacementStyle = getOverlayPlacementStyle(resolvedPlacement)

  return (
    <DrawerContext.Provider
      value={{
        placement: resolvedPlacement,
        size,
        onClose,
        onOpenChange: rest.onOpenChange,
        dragControls,
      }}
    >
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
  /**
   * Whether to enable drag-to-dismiss gesture on bottom drawers.
   * @default true for placement="bottom"
   */
  dragToClose?: boolean
}

const IOS_SHEET_CURVE = [0.32, 0.72, 0, 1] as const

const iosSheetEnterTransition = {
  ease: IOS_SHEET_CURVE,
  duration: 0.32,
}

const iosSheetDismissTransition = {
  ease: IOS_SHEET_CURVE,
  duration: 0.24,
}

const iosSheetSnapBackTransition = {
  ease: IOS_SHEET_CURVE,
  duration: 0.28,
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  function Drawer(
    { placement, size, dragToClose, style, className, children, ...rest },
    ref,
  ) {
    const ctx = useDrawer()
    const finalPlacement = placement ?? ctx.placement ?? 'right'
    const finalSize = size ?? ctx.size ?? 'md'
    const isBottom = finalPlacement === 'bottom'
    const enableDrag = dragToClose ?? isBottom

    const placementStyle = getPlacementStyle(finalPlacement)
    const sizeStyle = getSizeStyle(finalPlacement, finalSize)
    const controls = useAnimation()

    React.useEffect(() => {
      if (isBottom) {
        controls.set({ y: '100%' })
        controls.start({
          y: 0,
          transition: iosSheetEnterTransition,
        })
      }
    }, [controls, isBottom])

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.drawer,
      placementStyle,
      sizeStyle,
      style,
    )

    return (
      <AriaModal
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: wrapperClass } = stylex.props(
            styles.modalReset,
            placementStyle,
            sizeStyle,
            styles.modalWrapperReset,
          )
          return [wrapperClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => ({})}
      >
        {(modalRenderProps) => {
          const resolvedChildren =
            typeof children === 'function'
              ? children(modalRenderProps)
              : children

          return (
            <motion.div
              initial={isBottom ? { y: '100%' } : undefined}
              animate={controls}
              drag={enableDrag ? 'y' : false}
              dragControls={ctx.dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.04, bottom: 0 }}
              onDragEnd={async (_, info) => {
                if (!enableDrag) return
                if (info.offset.y > 80 || info.velocity.y > 300) {
                  await controls.start({
                    y: '100%',
                    transition: iosSheetDismissTransition,
                  })
                  ctx.onClose?.()
                } else {
                  controls.start({
                    y: 0,
                    transition: iosSheetSnapBackTransition,
                  })
                }
              }}
              className={stylexClass}
              style={stylexStyle}
            >
              {resolvedChildren}
            </motion.div>
          )
        }}
      </AriaModal>
    )
  },
)

// ── DrawerHandle Component ───────────────────────────────────────────

export interface DrawerHandleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  /**
   * Accessible label for screen readers.
   * @default 'Drag down or press to close drawer'
   */
  'aria-label'?: string
}

export const DrawerHandle = React.forwardRef<HTMLDivElement, DrawerHandleProps>(
  function DrawerHandle(
    {
      style,
      className,
      'aria-label': ariaLabel = 'Drag down or press to close drawer',
      ...rest
    },
    ref,
  ) {
    const ctx = useDrawer()
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.handleWrapper,
      style,
    )

    return (
      <div
        {...rest}
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={{
          ...stylexStyle,
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          ctx.dragControls?.start(e)
          rest.onPointerDown?.(e)
        }}
        onClick={(e) => {
          ctx.onClose?.()
          rest.onClick?.(e)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            ctx.onClose?.()
          }
          rest.onKeyDown?.(e)
        }}
      >
        <motion.div
          whileHover={{ opacity: 0.85 }}
          whileTap={{ opacity: 0.65 }}
          {...stylex.props(styles.handleBar)}
        />
      </div>
    )
  },
)

export const DrawerGrabHandle = DrawerHandle

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
  /**
   * Whether to render the drag handle on top when placement="bottom".
   * @default true for placement="bottom"
   */
  showHandle?: boolean
}

export const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  function DrawerHeader(
    { style, className, children, showHandle, ...rest },
    ref,
  ) {
    const ctx = useDrawer()
    const isBottom = ctx.placement === 'bottom'
    const shouldShowHandle = showHandle ?? isBottom

    const hasExplicitHandle = React.Children.toArray(children).some(
      (child) =>
        React.isValidElement(child) &&
        (child.type === DrawerHandle || child.type === DrawerGrabHandle),
    )

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.header,
      isBottom && styles.headerBottom,
      style,
    )
    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {shouldShowHandle && !hasExplicitHandle && <DrawerHandle />}
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
  /**
   * Whether to hide the close button when placed inside a bottom drawer.
   * Bottom drawers use the top drag handle to dismiss by default.
   * @default true
   */
  hiddenOnBottom?: boolean
}

export const DrawerCloseButton = React.forwardRef<
  HTMLButtonElement,
  DrawerCloseButtonProps
>(function DrawerCloseButton(
  {
    style,
    className,
    children,
    hiddenOnBottom = true,
    'aria-label': ariaLabel = 'Close drawer',
    ...rest
  },
  ref,
) {
  const ctx = useDrawer()
  if (hiddenOnBottom && ctx.placement === 'bottom') {
    return null
  }

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
