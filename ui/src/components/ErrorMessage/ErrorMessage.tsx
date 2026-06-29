import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './ErrorMessage.styles'

export interface ErrorMessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  function ErrorMessage({ style, className, children, ...rest }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      style,
    )
    return (
      <div
        {...rest}
        ref={ref}
        role="alert"
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)
