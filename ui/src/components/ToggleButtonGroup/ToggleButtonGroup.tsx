'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
} from 'react-aria-components'
import { ToggleButtonGroupContext } from './context'
import { styles } from './ToggleButtonGroup.styles'

export interface ToggleButtonGroupProps
  extends Omit<AriaToggleButtonGroupProps, 'style'> {
  style?: StyleXStyles
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export const ToggleButtonGroup = React.forwardRef<
  HTMLDivElement,
  ToggleButtonGroupProps
>(function ToggleButtonGroup(
  {
    style,
    className,
    orientation = 'horizontal',
    size,
    animated = false,
    children,
    ...rest
  },
  ref,
) {
  const contextValue = React.useMemo(
    () => ({
      isInGroup: true,
      orientation,
      size,
      animated,
    }),
    [orientation, size, animated],
  )

  return (
    <ToggleButtonGroupContext.Provider value={contextValue}>
      <AriaToggleButtonGroup
        {...rest}
        ref={ref}
        orientation={orientation}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.base,
            renderProps.orientation === 'vertical' && styles.vertical,
            animated && styles.animatedTrack,
            animated &&
              (renderProps.orientation === 'vertical'
                ? styles.animatedTrackVertical
                : styles.animatedTrackHorizontal),
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.base,
            renderProps.orientation === 'vertical' && styles.vertical,
            animated && styles.animatedTrack,
            animated &&
              (renderProps.orientation === 'vertical'
                ? styles.animatedTrackVertical
                : styles.animatedTrackHorizontal),
            style,
          )
          return stylexStyle
        }}
      >
        {children}
      </AriaToggleButtonGroup>
    </ToggleButtonGroupContext.Provider>
  )
})
