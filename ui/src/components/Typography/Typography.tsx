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
export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style'> {
  as?: TypographyTag
  style?: StyleXStyles
  className?: string
}

export interface HeadingProps extends Omit<TypographyProps, 'as'> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ as = 'h2', ...props }, ref) {
    return <Typography as={as} ref={ref} {...props} />
  },
)

export type ParagraphProps = Omit<TypographyProps, 'as'>

const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  function Paragraph(props, ref) {
    return <Typography as="p" ref={ref} {...props} />
  },
)

export type SpanProps = Omit<TypographyProps, 'as'>

const Span = React.forwardRef<HTMLSpanElement, SpanProps>(
  function Span(props, ref) {
    return <Typography as="span" ref={ref} {...props} />
  },
)

export type TypographyLabelProps = Omit<TypographyProps, 'as'>

const Label = React.forwardRef<HTMLLabelElement, TypographyLabelProps>(
  function Label(props, ref) {
    return <Typography as="label" ref={ref} {...props} />
  },
)

export interface TypographyComponent
  extends React.ForwardRefExoticComponent<
    TypographyProps & React.RefAttributes<HTMLElement>
  > {
  Heading: typeof Heading
  Paragraph: typeof Paragraph
  Span: typeof Span
  Label: typeof Label
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  function Typography(
    { as = 'span', style, className, children, ...rest },
    ref,
  ) {
    const Component = as

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      styles[as],
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
) as TypographyComponent

Typography.Heading = Heading
Typography.Paragraph = Paragraph
Typography.Span = Span
Typography.Label = Label

export {
  Heading as TypographyHeading,
  Label as TypographyLabel,
  Paragraph as TypographyParagraph,
  Span as TypographySpan,
}
