import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { styles } from './Card.styles'

export type Elevation = 0 | 1 | 2 | 3 | 'none' | 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'flat' | 'glass'
export type CardSize = 'sm' | 'md' | 'lg'

export interface CardContextValue {
  divided?: boolean
  size?: CardSize
}

export const CardContext = React.createContext<CardContextValue>({
  divided: false,
  size: 'md',
})

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  elevation?: Elevation
  variant?: CardVariant
  divided?: boolean
  size?: CardSize
  style?: StyleXStyles
  className?: string
}

const mapElevation = (el: Elevation): 'el0' | 'el1' | 'el2' | 'el3' => {
  if (el === 0 || el === 'none') return 'el0'
  if (el === 1 || el === 'sm') return 'el1'
  if (el === 2 || el === 'md') return 'el2'
  if (el === 3 || el === 'lg') return 'el3'
  return 'el0'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    elevation = 1,
    variant = 'default',
    divided = false,
    size = 'md',
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const elevationKey = mapElevation(variant === 'default' ? elevation : 'none')
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.root,
    styles[elevationKey],
    styles[variant],
    style,
  )

  const contextValue = React.useMemo(() => ({ divided, size }), [divided, size])

  return (
    <CardContext.Provider value={contextValue}>
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    </CardContext.Provider>
  )
})
