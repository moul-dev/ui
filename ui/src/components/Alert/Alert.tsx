'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Alert.styles'

export type AlertVariant =
  | 'info'
  | 'info-accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'loading'

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  variant?: AlertVariant
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  onClose?: () => void
  style?: StyleXStyles
  className?: string
}

// ── Default Icons for variants ──────────────────────────────────────────

const InfoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '100%', height: '100%' }}
  >
    <circle cx={12} cy={12} r={10} />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const SuccessIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '100%', height: '100%' }}
  >
    <circle cx={12} cy={12} r={10} />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const ErrorIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '100%', height: '100%' }}
  >
    <circle cx={12} cy={12} r={10} />
    <line x1={12} x2={12} y1={8} y2={12} />
    <line x1={12} x2={12.01} y1={16} y2={16} />
  </svg>
)

const WarningIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '100%', height: '100%' }}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1={12} x2={12} y1={9} y2={13} />
    <line x1={12} x2={12.01} y1={17} y2={17} />
  </svg>
)

const LoadingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    style={{ width: '100%', height: '100%' }}
  >
    <circle cx={12} cy={12} r={10} stroke="currentColor" strokeOpacity={0.2} />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
  </svg>
)

const getVariantIcon = (variant: AlertVariant) => {
  switch (variant) {
    case 'info':
    case 'info-accent':
      return <InfoIcon />
    case 'success':
      return <SuccessIcon />
    case 'error':
      return <ErrorIcon />
    case 'warning':
      return <WarningIcon />
    case 'loading':
      return <LoadingIcon />
  }
}

// ── Alert Component ──────────────────────────────────────────────────

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = 'info',
    title,
    description,
    icon,
    action,
    onClose,
    style,
    className,
    children,
    ...rest
  },
  ref
) {
  // Determine standard accessibility role based on variant
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'
  
  const iconElement = icon !== undefined ? icon : getVariantIcon(variant)

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.container,
    styles[variant],
    style
  )

  const combinedClassName = [stylexClass, className].filter(Boolean).join(' ')

  return (
    <div
      {...rest}
      ref={ref}
      role={role}
      className={combinedClassName}
      style={stylexStyle}
    >
      {iconElement && (
        <div {...stylex.props(styles.iconContainer, styles[`icon_${variant}`])}>
          <div {...stylex.props(styles.icon)}>{iconElement}</div>
        </div>
      )}
      
      <div {...stylex.props(styles.content)}>
        {title && (
          <div {...stylex.props(styles.title, styles[`title_${variant}`])}>
            {title}
          </div>
        )}
        {description && (
          <div {...stylex.props(styles.description)}>
            {description}
          </div>
        )}
        {children}
      </div>

      {action && (
        <div {...stylex.props(styles.actionContainer)}>
          {action}
        </div>
      )}

      {onClose && (
        <div {...stylex.props(styles.closeButtonContainer)}>
          <button
            type="button"
            aria-label="Close alert"
            onClick={onClose}
            {...stylex.props(styles.closeButton)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              {...stylex.props(styles.closeIcon)}
            >
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
})

Alert.displayName = 'Alert'
