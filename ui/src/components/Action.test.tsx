import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as React from 'react'
import * as fc from 'fast-check'
import {
  Button,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Link,
} from '../index'

describe('Button component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    const { getByText } = render(<Button ref={ref}>Click Me</Button>)
    const element = getByText('Click Me')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('BUTTON')
    expect(ref.current).toBe(element)
  })

  test('fires onPress callback when clicked', () => {
    const pressHandler = vi.fn()
    const { getByText } = render(
      <Button onPress={pressHandler}>Click Me</Button>,
    )
    const element = getByText('Click Me')
    fireEvent.click(element)
    expect(pressHandler).toHaveBeenCalledTimes(1)
  })

  test('has role="button"', () => {
    const { getByRole } = render(<Button>Click Me</Button>)
    expect(getByRole('button')).toBeInTheDocument()
  })

  test('handles isPending state', () => {
    const { getByRole } = render(<Button isPending>Loading</Button>)
    const button = getByRole('button')
    expect(button).toHaveAttribute('data-pending')
  })
})

describe('ButtonGroup component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByTestId } = render(
      <ButtonGroup ref={ref} data-testid="group">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>,
    )
    const element = getByTestId('group')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('DIV')
    expect(ref.current).toBe(element)
  })
})

describe('ToggleButton component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    const { getByText } = render(
      <ToggleButton ref={ref}>Toggle Me</ToggleButton>,
    )
    const element = getByText('Toggle Me')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('BUTTON')
    expect(ref.current).toBe(element)
  })

  test('toggles selection and aria-pressed state', () => {
    const changeHandler = vi.fn()
    const { getByRole } = render(
      <ToggleButton onChange={changeHandler}>Toggle</ToggleButton>,
    )
    const button = getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button)
    expect(changeHandler).toHaveBeenCalledWith(true)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ToggleButtonGroup component', () => {
  test('renders and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { container } = render(
      <ToggleButtonGroup ref={ref} aria-label="Group">
        <ToggleButton id="1">One</ToggleButton>
        <ToggleButton id="2">Two</ToggleButton>
      </ToggleButtonGroup>,
    )
    const group = container.firstChild as HTMLDivElement
    expect(group).toBeInTheDocument()
    expect(ref.current).toBe(group)
  })

  test('manages single selection', () => {
    const changeHandler = vi.fn()
    const { getByText } = render(
      <ToggleButtonGroup
        selectionMode="single"
        onSelectionChange={changeHandler}
        aria-label="Group"
      >
        <ToggleButton id="1">One</ToggleButton>
        <ToggleButton id="2">Two</ToggleButton>
      </ToggleButtonGroup>,
    )
    const first = getByText('One')
    const second = getByText('Two')

    expect(first).toHaveAttribute('aria-checked', 'false')
    expect(second).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(first)
    expect(changeHandler).toHaveBeenCalledWith(new Set(['1']))
    expect(first).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(second)
    expect(changeHandler).toHaveBeenCalledWith(new Set(['2']))
    expect(first).toHaveAttribute('aria-checked', 'false')
    expect(second).toHaveAttribute('aria-checked', 'true')
  })
})

describe('Link component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    const { getByRole } = render(
      <Link ref={ref} href="https://khmer.dev">
        Khmer Dev
      </Link>,
    )
    const element = getByRole('link')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('A')
    expect(element).toHaveAttribute('href', 'https://khmer.dev')
    expect(ref.current).toBe(element)
  })
})

// Property-Based Tests
describe('Action Components Property-Based Tests', () => {
  test('Button, ToggleButton, and Link append consumer className', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => (
            <Button {...props} aria-label="btn">
              Btn
            </Button>
          ),
          (props: any) => (
            <ToggleButton {...props} aria-label="toggle">
              Toggle
            </ToggleButton>
          ),
          (props: any) => <Link {...props}>Link</Link>,
        ),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        (ComponentFn, consumerClass) => {
          const { container, unmount } = render(
            ComponentFn({ className: consumerClass }),
          )
          const el = container.firstChild as HTMLElement
          expect(el.className).toContain(consumerClass)
          unmount()
        },
      ),
      { numRuns: 30 },
    )
  })

  test('ref forwarding resolves to DOM element', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (ref: React.Ref<any>) => (
            <Button ref={ref} aria-label="btn">
              Btn
            </Button>
          ),
          (ref: React.Ref<any>) => <ButtonGroup ref={ref}>Group</ButtonGroup>,
          (ref: React.Ref<any>) => (
            <ToggleButton ref={ref} aria-label="toggle">
              Toggle
            </ToggleButton>
          ),
          (ref: React.Ref<any>) => (
            <ToggleButtonGroup ref={ref} aria-label="group">
              Group
            </ToggleButtonGroup>
          ),
          (ref: React.Ref<any>) => <Link ref={ref}>Link</Link>,
        ),
        (ComponentFn) => {
          const ref = React.createRef<HTMLElement>()
          const { unmount } = render(ComponentFn(ref))
          expect(ref.current).toBeInstanceOf(HTMLElement)
          unmount()
        },
      ),
      { numRuns: 30 },
    )
  })

  test('isDisabled applies correct disabled semantics', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => (
            <Button {...props} aria-label="btn">
              Btn
            </Button>
          ),
          (props: any) => (
            <ToggleButton {...props} aria-label="toggle">
              Toggle
            </ToggleButton>
          ),
          (props: any) => <Link {...props}>Link</Link>,
        ),
        (ComponentFn) => {
          const { container, unmount } = render(
            ComponentFn({ isDisabled: true }),
          )
          const el = container.firstChild as HTMLElement
          expect(
            el.hasAttribute('disabled') ||
              el.getAttribute('aria-disabled') === 'true',
          ).toBe(true)
          unmount()
        },
      ),
      { numRuns: 30 },
    )
  })

  test('ARIA label forwarding', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => <Button {...props}>Btn</Button>,
          (props: any) => <ToggleButton {...props}>Toggle</ToggleButton>,
          (props: any) => <Link {...props}>Link</Link>,
        ),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (ComponentFn, label) => {
          const { container, unmount } = render(
            ComponentFn({ 'aria-label': label }),
          )
          const el = container.firstChild as HTMLElement
          expect(el.getAttribute('aria-label')).toBe(label)
          unmount()
        },
      ),
      { numRuns: 30 },
    )
  })
})

describe('Missing label warning property-based checks', () => {
  let warnSpy: any
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    warnSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  test('fires console.warn when missing accessible name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { name: 'Button', element: <Button>{null}</Button> },
          {
            name: 'ToggleButton',
            element: <ToggleButton>{null}</ToggleButton>,
          },
        ),
        ({ name, element }) => {
          warnSpy.mockClear()
          const { unmount } = render(element)
          expect(warnSpy).toHaveBeenCalledTimes(1)
          expect(warnSpy.mock.calls[0][0]).toContain(
            `[${name}] This component has no accessible name`,
          )
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })
})

describe('Action Components Variant Tests', () => {
  test('Button supports all variants', () => {
    const variants = [
      'primary',
      'secondary',
      'tertiary',
      'outline',
      'ghost',
      'danger',
      'danger-soft',
    ] as const
    for (const variant of variants) {
      const { getByRole, unmount } = render(
        <Button variant={variant}>Btn</Button>,
      )
      expect(getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  test('Button supports all sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    for (const size of sizes) {
      const { getByRole, unmount } = render(<Button size={size}>Btn</Button>)
      expect(getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  test('ToggleButton supports all variants', () => {
    const variants = [
      'primary',
      'secondary',
      'tertiary',
      'outline',
      'ghost',
      'danger',
      'danger-soft',
    ] as const
    for (const variant of variants) {
      const { getByRole, unmount } = render(
        <ToggleButton variant={variant}>Toggle</ToggleButton>,
      )
      expect(getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  test('Link supports all variants', () => {
    const variants = [
      'primary',
      'secondary',
      'tertiary',
      'outline',
      'ghost',
      'danger',
      'danger-soft',
    ] as const
    for (const variant of variants) {
      const { getByRole, unmount } = render(
        <Link href="#" variant={variant}>
          Link
        </Link>,
      )
      expect(getByRole('link')).toBeInTheDocument()
      unmount()
    }
  })
})
