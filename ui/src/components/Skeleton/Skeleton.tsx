import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Skeleton.styles'

export type SkeletonVariant = 'block' | 'text' | 'circle'
export type SkeletonShape = SkeletonVariant

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  variant?: SkeletonVariant
  shape?: SkeletonShape
  count?: number
  style?: StyleXStyles
  className?: string
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    {
      variant,
      shape = 'block',
      count = 1,
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const activeShape = variant || shape

    const { className: itemClass, style: itemStyle } = stylex.props(
      styles.base,
      styles[activeShape],
      style,
    )

    if (count > 1) {
      const { className: containerClass, style: containerStyle } = stylex.props(
        styles.container,
      )

      return (
        <div
          {...rest}
          ref={ref}
          role="status"
          aria-busy="true"
          aria-live="polite"
          className={[containerClass, className].filter(Boolean).join(' ')}
          style={containerStyle}
        >
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className={itemClass}
              style={itemStyle}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        {...rest}
        ref={ref}
        role="status"
        aria-busy="true"
        className={[itemClass, className].filter(Boolean).join(' ')}
        style={itemStyle}
      >
        {children}
      </div>
    )
  },
)
