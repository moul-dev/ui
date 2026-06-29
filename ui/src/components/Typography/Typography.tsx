import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Typography.styles'

export type TypographyTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'label'
export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption'
  | 'label'

const defaultVariantMap: Record<TypographyTag, TypographyVariant> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'body',
  span: 'body',
  label: 'label',
}

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style'> {
  as?: TypographyTag
  variant?: TypographyVariant
  style?: StyleXStyles
  className?: string
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  function Typography(
    { as = 'span', variant, style, className, children, ...rest },
    ref,
  ) {
    const Component = as
    const resolvedVariant = variant || defaultVariantMap[as]

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[resolvedVariant],
      style,
    )

    return (
      <Component
        {...rest}
        ref={ref as any}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </Component>
    )
  },
)
