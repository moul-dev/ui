'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Breadcrumbs as AriaBreadcrumbs,
  Breadcrumb as AriaBreadcrumb,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
  type BreadcrumbProps as AriaBreadcrumbProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Breadcrumbs.styles'

// ── Breadcrumbs Component ───────────────────────────────────────────

export interface BreadcrumbsProps<T>
  extends Omit<AriaBreadcrumbsProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export const Breadcrumbs = React.forwardRef<
  HTMLOListElement,
  BreadcrumbsProps<any>
>(function Breadcrumbs(
  {
    style,
    className,
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.breadcrumbs,
    style,
  )
  return (
    <nav
      aria-label={ariaLabel || 'Breadcrumb'}
      aria-labelledby={ariaLabelledBy}
      {...stylex.props(styles.nav)}
    >
      <AriaBreadcrumbs
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </AriaBreadcrumbs>
    </nav>
  )
})

// ── BreadcrumbItem Component ────────────────────────────────────────

export interface BreadcrumbItemProps
  extends Omit<AriaBreadcrumbProps, 'style'> {
  style?: StyleXStyles
  className?: string
  isCurrent?: boolean
}

export const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  BreadcrumbItemProps
>(function BreadcrumbItem(
  { style, className, children, isCurrent, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.breadcrumbItem,
    isCurrent && styles.breadcrumbItemCurrent,
    style,
  )
  return (
    <AriaBreadcrumb
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </AriaBreadcrumb>
  )
})
