'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './EmptyState.styles'

export type EmptyStateVariant = 'default' | 'card' | 'dashed'
export type EmptyStateSize = 'sm' | 'md' | 'lg'
export type EmptyStateAlign = 'center' | 'start'

interface EmptyStateContextValue {
  size: EmptyStateSize
  align: EmptyStateAlign
}

const EmptyStateContext = React.createContext<EmptyStateContextValue>({
  size: 'md',
  align: 'center',
})

// ── EmptyStateIcon ───────────────────────────────────────────────────

export interface EmptyStateIconProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: EmptyStateSize
  variant?: 'default' | 'primary'
  style?: StyleXStyles
  className?: string
}

export const EmptyStateIcon = React.forwardRef<
  HTMLDivElement,
  EmptyStateIconProps
>(function EmptyStateIcon(
  { size: propSize, variant = 'primary', style, className, children, ...rest },
  ref,
) {
  const context = React.useContext(EmptyStateContext)
  const size = propSize ?? context.size
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle = styles[`icon${sizeSuffix}` as 'iconSm' | 'iconMd' | 'iconLg']

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.iconWrapper,
    variant === 'primary' && styles.iconPrimary,
    sizeStyle,
    style,
  )

  return (
    <div
      {...rest}
      ref={ref}
      aria-hidden="true"
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </div>
  )
})

EmptyStateIcon.displayName = 'EmptyStateIcon'

// ── EmptyStateTitle ──────────────────────────────────────────────────

export interface EmptyStateTitleProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'style'> {
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  size?: EmptyStateSize
  style?: StyleXStyles
  className?: string
}

export const EmptyStateTitle = React.forwardRef<
  HTMLHeadingElement,
  EmptyStateTitleProps
>(function EmptyStateTitle(
  { as: Component = 'h3', size: propSize, style, className, children, ...rest },
  ref,
) {
  const context = React.useContext(EmptyStateContext)
  const size = propSize ?? context.size
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[`title${sizeSuffix}` as 'titleSm' | 'titleMd' | 'titleLg']

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.title,
    sizeStyle,
    style,
  )

  return (
    <Component
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </Component>
  )
})

EmptyStateTitle.displayName = 'EmptyStateTitle'

// ── EmptyStateDescription ────────────────────────────────────────────

export interface EmptyStateDescriptionProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'style'> {
  size?: EmptyStateSize
  style?: StyleXStyles
  className?: string
}

export const EmptyStateDescription = React.forwardRef<
  HTMLParagraphElement,
  EmptyStateDescriptionProps
>(function EmptyStateDescription(
  { size: propSize, style, className, children, ...rest },
  ref,
) {
  const context = React.useContext(EmptyStateContext)
  const size = propSize ?? context.size
  const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
  const sizeStyle =
    styles[
      `description${sizeSuffix}` as
        | 'descriptionSm'
        | 'descriptionMd'
        | 'descriptionLg'
    ]

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.description,
    sizeStyle,
    style,
  )

  return (
    <p
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </p>
  )
})

EmptyStateDescription.displayName = 'EmptyStateDescription'

// ── EmptyStateActions ────────────────────────────────────────────────

export interface EmptyStateActionsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  align?: EmptyStateAlign
  style?: StyleXStyles
  className?: string
}

export const EmptyStateActions = React.forwardRef<
  HTMLDivElement,
  EmptyStateActionsProps
>(function EmptyStateActions(
  { align: propAlign, style, className, children, ...rest },
  ref,
) {
  const context = React.useContext(EmptyStateContext)
  const align = propAlign ?? context.align

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.actions,
    align === 'start' ? styles.actionsStart : styles.actionsCenter,
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

EmptyStateActions.displayName = 'EmptyStateActions'

// ── EmptyState (Root) ────────────────────────────────────────────────

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  variant?: EmptyStateVariant
  size?: EmptyStateSize
  align?: EmptyStateAlign
  style?: StyleXStyles
  className?: string
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      icon,
      title,
      description,
      action,
      secondaryAction,
      variant = 'default',
      size = 'md',
      align = 'center',
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const sizeSuffix = size.charAt(0).toUpperCase() + size.slice(1)
    const variantSuffix = variant.charAt(0).toUpperCase() + variant.slice(1)

    const sizeStyle =
      styles[`size${sizeSuffix}` as 'sizeSm' | 'sizeMd' | 'sizeLg']
    const variantStyle =
      styles[
        `variant${variantSuffix}` as
          | 'variantDefault'
          | 'variantCard'
          | 'variantDashed'
      ]
    const alignStyle =
      align === 'start' ? styles.alignStart : styles.alignCenter

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.container,
      sizeStyle,
      variantStyle,
      alignStyle,
      style,
    )

    const hasDirectProps =
      icon !== undefined ||
      title !== undefined ||
      description !== undefined ||
      action !== undefined ||
      secondaryAction !== undefined

    return (
      <EmptyStateContext.Provider value={{ size, align }}>
        <div
          {...rest}
          ref={ref}
          className={[stylexClass, className].filter(Boolean).join(' ')}
          style={stylexStyle}
        >
          {icon && <EmptyStateIcon size={size}>{icon}</EmptyStateIcon>}
          {(title || description) && (
            <div {...stylex.props(styles.content)}>
              {title && (
                <EmptyStateTitle size={size}>{title}</EmptyStateTitle>
              )}
              {description && (
                <EmptyStateDescription size={size}>
                  {description}
                </EmptyStateDescription>
              )}
            </div>
          )}
          {(action || secondaryAction) && (
            <EmptyStateActions align={align}>
              {action}
              {secondaryAction}
            </EmptyStateActions>
          )}
          {!hasDirectProps ? children : null}
          {hasDirectProps && children ? children : null}
        </div>
      </EmptyStateContext.Provider>
    )
  },
)

EmptyState.displayName = 'EmptyState'
