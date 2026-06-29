import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { CardContext } from './Card'
import { styles } from './Card.styles'

export interface CardBodyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody({ style, className, children, ...rest }, ref) {
    const { divided, size = 'md' } = React.useContext(CardContext)
    const sizeStyleKey = divided
      ? (`body_${size}_divided` as const)
      : (`body_${size}` as const)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.body,
      styles[sizeStyleKey],
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
