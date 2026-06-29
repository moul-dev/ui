import * as stylex from '@stylexjs/stylex'
import { render } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test } from 'vitest'
import { tokens } from '../tokens/tokens.stylex'
import { ThemeProvider } from './ThemeProvider'

describe('Property 1: Theme token values are reflected in rendered components', () => {
  test('renders ThemeProvider and applies default colorScheme classes', () => {
    const { container } = render(
      <ThemeProvider>
        <div data-testid="child">Hello</div>
      </ThemeProvider>,
    )

    const providerDiv = container.firstChild as HTMLDivElement
    expect(providerDiv).toBeInTheDocument()
    expect(providerDiv.tagName).toBe('DIV')
    expect(providerDiv.className).toBeTruthy()
  })

  test('applies distinct classes for light vs dark color schemes', () => {
    const { container: lightContainer } = render(
      <ThemeProvider colorScheme="light">
        <div>Light</div>
      </ThemeProvider>,
    )
    const { container: darkContainer } = render(
      <ThemeProvider colorScheme="dark">
        <div>Dark</div>
      </ThemeProvider>,
    )

    const lightDiv = lightContainer.firstChild as HTMLDivElement
    const darkDiv = darkContainer.firstChild as HTMLDivElement

    expect(lightDiv.className).not.toBe(darkDiv.className)
  })

  test('reflects overridden theme values in the container class names', () => {
    const customTheme = stylex.createTheme(tokens, {
      colorPrimary500: 'rgb(255, 0, 0)',
    })

    const { className: expectedThemeClass = '' } = stylex.props(customTheme)

    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <div>Custom Theme</div>
      </ThemeProvider>,
    )

    const providerDiv = container.firstChild as HTMLDivElement
    expect(providerDiv).toBeInTheDocument()

    // Verify that the custom theme class is applied to the ThemeProvider div
    const appliedClasses = providerDiv.className.split(' ')
    expectedThemeClass.split(' ').forEach((cls) => {
      expect(appliedClasses).toContain(cls)
    })
  })

  test('passes through HTML attributes and ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <ThemeProvider ref={ref} data-testid="provider" id="my-provider">
        <div>Content</div>
      </ThemeProvider>,
    )

    const provider = getByTestId('provider')
    expect(provider).toBeInTheDocument()
    expect(provider.id).toBe('my-provider')
    expect(ref.current).toBe(provider)
  })
})
