import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Kbd.styles'

export interface KbdProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { style, className, children, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.base,
    style,
  )

  return (
    <kbd
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </kbd>
  )
})
