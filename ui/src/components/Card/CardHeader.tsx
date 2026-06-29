import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { CardContext } from './Card'
import { styles } from './Card.styles'

export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ style, className, children, ...rest }, ref) {
    const { divided, size = 'md' } = React.useContext(CardContext)
    const sizeStyleKey = divided
      ? (`header_${size}_divided` as const)
      : (`header_${size}` as const)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.header,
      styles[sizeStyleKey],
      divided && styles.headerDivided,
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
