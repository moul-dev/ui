import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { CardContext } from './Card'
import { styles } from './Card.styles'

export interface CardFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ style, className, children, ...rest }, ref) {
    const { divided, size = 'md' } = React.useContext(CardContext)
    const sizeStyleKey = divided
      ? (`footer_${size}_divided` as const)
      : (`footer_${size}` as const)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.footer,
      styles[sizeStyleKey],
      divided && styles.footerDivided,
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
