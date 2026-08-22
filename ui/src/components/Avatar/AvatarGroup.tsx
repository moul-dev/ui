'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { Avatar, type AvatarShape, type AvatarSize } from './Avatar'
import { styles } from './Avatar.styles'

export interface AvatarGroupContextValue {
  size?: AvatarSize
  shape?: AvatarShape
}

export const AvatarGroupContext = React.createContext<AvatarGroupContextValue>({
  size: 'md',
  shape: 'circle',
})

export interface AvatarGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: AvatarSize
  shape?: AvatarShape
  max?: number
  excessCount?: number
  renderExcess?: (count: number) => React.ReactNode
  style?: StyleXStyles
  className?: string
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup(
    {
      size = 'md',
      shape = 'circle',
      max,
      excessCount,
      renderExcess,
      style,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const validChildren = React.Children.toArray(children).filter(
      React.isValidElement,
    )
    const totalCount = validChildren.length
    const hasMax = typeof max === 'number' && max > 0 && totalCount > max
    const visibleChildren = hasMax ? validChildren.slice(0, max) : validChildren
    const remainingCount = excessCount ?? totalCount - visibleChildren.length

    const overlapStyleKey = `groupOverlap_${size}` as keyof typeof styles

    const { className: groupClass, style: groupStyle } = stylex.props(
      styles.group,
      style,
    )

    const shapeStyleKey = shape === 'circle' ? 'circle' : `square_${size}`
    const shapeStyle =
      styles[shapeStyleKey as keyof typeof styles] || styles.circle

    return (
      <AvatarGroupContext.Provider value={{ size, shape }}>
        <div
          {...rest}
          ref={ref}
          role="group"
          aria-label={rest['aria-label'] || 'Avatar group'}
          className={[groupClass, className].filter(Boolean).join(' ')}
          style={groupStyle}
        >
          {visibleChildren.map((child, index) => {
            const isFirst = index === 0
            const { className: itemClass, style: itemStyle } = stylex.props(
              styles.groupItem,
              shapeStyle,
              !isFirst && styles[overlapStyleKey],
              styles.groupItemRing,
            )

            return (
              <div
                key={(child as React.ReactElement).key ?? index}
                className={itemClass}
                style={{ ...itemStyle, zIndex: visibleChildren.length - index }}
              >
                {child}
              </div>
            )
          })}

          {hasMax && remainingCount > 0 && (
            <div
              className={
                stylex.props(
                  styles.groupItem,
                  shapeStyle,
                  styles[overlapStyleKey],
                  styles.groupItemRing,
                ).className
              }
              style={{
                ...stylex.props(
                  styles.groupItem,
                  shapeStyle,
                  styles[overlapStyleKey],
                  styles.groupItemRing,
                ).style,
                zIndex: 0,
              }}
            >
              {renderExcess ? (
                renderExcess(remainingCount)
              ) : (
                <Avatar
                  size={size}
                  shape={shape}
                  initials={`+${remainingCount}`}
                  aria-label={`${remainingCount} more members`}
                  style={styles.excess}
                />
              )}
            </div>
          )}
        </div>
      </AvatarGroupContext.Provider>
    )
  },
)
