'use client'

import * as React from 'react'
import * as stylex from '@stylexjs/stylex'

type ColorScheme = 'light' | 'dark' | 'light dark'

const themeStyles = stylex.create({
  light: {
    colorScheme: 'light',
  },
  dark: {
    colorScheme: 'dark',
  },
  'light dark': {
    colorScheme: 'light dark',
  },
})

export interface ThemeProviderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Controls which side of every light-dark() token is resolved.
   * 'light dark' = follow system preference (default).
   */
  colorScheme?: ColorScheme
  /**
   * Optional full token override for brand customisation.
   */
  theme?: ReturnType<typeof stylex.createTheme>
  children?: React.ReactNode
}

export const ThemeProvider = React.forwardRef<
  HTMLDivElement,
  ThemeProviderProps
>(function ThemeProvider(
  { colorScheme = 'light dark', theme, children, className, style, ...rest },
  ref,
) {
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    themeStyles[colorScheme],
    theme,
  )

  // Merge consumer's className and inline style, keeping StyleX classes/styles
  const combinedClassName = [stylexClass, className].filter(Boolean).join(' ')
  const combinedStyle = { ...stylexStyle, ...style }

  return (
    <div
      {...rest}
      ref={ref}
      className={combinedClassName}
      style={combinedStyle}
    >
      {children}
    </div>
  )
})

ThemeProvider.displayName = 'ThemeProvider'
