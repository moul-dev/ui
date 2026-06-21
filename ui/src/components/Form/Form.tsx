'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Form as AriaForm,
  type FormProps as AriaFormProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Form.styles'

export interface FormProps extends Omit<AriaFormProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  { style, className, children, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.base,
    style,
  )
  return (
    <AriaForm
      {...rest}
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      {children}
    </AriaForm>
  )
})
