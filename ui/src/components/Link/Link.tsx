'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components'
import { styles } from './Link.styles'

export interface LinkProps extends Omit<AriaLinkProps, 'style'> {
  style?: StyleXStyles
  className?: string
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'danger-soft'
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function Link(
    { variant = 'primary', isDisabled, style, className, children, ...rest },
    ref,
  ) {
    return (
      <AriaLink
        {...rest}
        ref={ref}
        isDisabled={isDisabled}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.base,
            styles[variant],
            renderProps.isDisabled && styles.isDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.base,
            styles[variant],
            renderProps.isDisabled && styles.isDisabled,
            style,
          )
          return stylexStyle
        }}
      >
        {children}
      </AriaLink>
    )
  },
)
