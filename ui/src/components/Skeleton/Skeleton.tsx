import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Skeleton.styles'

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
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
