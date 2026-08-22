'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { styles } from './Spinner.styles'

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: SpinnerSize
  style?: StyleXStyles
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  function Spinner(
    {
      size = 'md',
      style,
      className,
      children,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...rest
    },
    ref,
  ) {
    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Spinner', {
        label: ariaLabel,
        labelledBy: ariaLabelledby,
        children,
      })
    }

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[size],
      style,
    )
    return (
      <div
        {...rest}
        ref={ref}
        role="progressbar"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-live="polite"
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)
