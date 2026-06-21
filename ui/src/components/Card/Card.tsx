import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { Surface, type Elevation } from '../Surface'
import { styles } from './Card.styles'

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  elevation?: Elevation
  style?: StyleXStyles
  className?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation = 1, style, className, children, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.root,
    style,
  )

  return (
    <Surface
      {...rest}
      ref={ref}
      elevation={elevation}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </Surface>
  )
})
