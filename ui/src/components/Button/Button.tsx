'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Button.styles'
import { warnMissingLabel } from '../../utils/warnMissingLabel'

export interface ButtonProps extends Omit<AriaButtonProps, 'style'> {
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
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      isPending,
      isDisabled,
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Button', {
        label: rest['aria-label'],
        labelledBy: rest['aria-labelledby'],
        children: typeof children === 'function' ? undefined : children,
      })
    }

    return (
      <AriaButton
        {...rest}
        ref={ref}
        isDisabled={isDisabled}
        isPending={isPending}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.base,
            styles[variant],
            styles[size],
            renderProps.isPending && styles.isPending,
            renderProps.isDisabled && styles.isDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.base,
            styles[variant],
            styles[size],
            renderProps.isPending && styles.isPending,
            renderProps.isDisabled && styles.isDisabled,
            style,
          )
          return stylexStyle
        }}
      >
        {children}
      </AriaButton>
    )
  },
)
