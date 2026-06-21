'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps,
  type ValidationResult,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './FieldError.styles'

export interface FieldErrorProps extends Omit<AriaFieldErrorProps, 'style'> {
  style?: StyleXStyles
  className?: string
  errorMessage?: string | ((v: ValidationResult) => string)
}

export const FieldError = React.forwardRef<HTMLElement, FieldErrorProps>(
  function FieldError(
    { style, className, children, errorMessage, ...rest },
    ref,
  ) {
    return (
      <AriaFieldError
        {...rest}
        ref={ref}
        className={() => {
          const { className: stylexClass } = stylex.props(styles.base, style)
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.base, style)
          return stylexStyle ?? {}
        }}
      >
        {(renderProps) => (
          <span role="alert">
            {typeof children === 'function'
              ? children(renderProps)
              : (children ??
                (typeof errorMessage === 'function'
                  ? errorMessage({
                      isInvalid: true,
                      validationErrors: renderProps.validationErrors,
                      validationDetails: renderProps.validationDetails,
                    })
                  : (errorMessage ?? renderProps.defaultChildren)))}
          </span>
        )}
      </AriaFieldError>
    )
  },
)
