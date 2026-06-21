import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Surface.styles'

export type Elevation = 0 | 1 | 2 | 3 | 'none' | 'sm' | 'md' | 'lg'

export interface SurfaceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  elevation?: Elevation
  style?: StyleXStyles
  className?: string
}

const mapElevation = (el: Elevation): 'el0' | 'el1' | 'el2' | 'el3' => {
  if (el === 0 || el === 'none') return 'el0'
  if (el === 1 || el === 'sm') return 'el1'
  if (el === 2 || el === 'md') return 'el2'
  if (el === 3 || el === 'lg') return 'el3'
  return 'el0'
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(
    { elevation = 0, style, className, children, ...rest },
    ref,
  ) {
    const elevationKey = mapElevation(elevation)
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[elevationKey],
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
