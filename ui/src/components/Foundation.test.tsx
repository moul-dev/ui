import { render } from '@testing-library/react'
import * as fs from 'fs'
import * as path from 'path'
import * as React from 'react'
import { TextField } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  Description,
  ErrorMessage,
  FieldError,
  Form,
  Label,
  Separator,
  Skeleton,
  Spinner,
} from '../index'

describe('Label component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLLabelElement>()
    const { getByText } = render(<Label ref={ref}>Test Label</Label>)

    const element = getByText('Test Label')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('LABEL')
    expect(ref.current).toBe(element)
  })

  test('applies custom className and passes extra attributes', () => {
    const { getByText } = render(
      <Label className="custom-label-class" data-testid="label" id="label-id">
        Test Label
      </Label>,
    )
    const element = getByText('Test Label')
    expect(element.className).toContain('custom-label-class')
    expect(element.id).toBe('label-id')
  })
})

describe('Description component', () => {
  test('renders with default slot and forwards ref', () => {
    const ref = React.createRef<HTMLElement>()
    const { getByText } = render(
      <Description ref={ref}>Test Description</Description>,
    )

    const element = getByText('Test Description')
    expect(element).toBeInTheDocument()
    expect(element.getAttribute('slot')).toBe('description')
    expect(ref.current).toBe(element)
  })

  test('applies custom className and slot override', () => {
    const { getByText } = render(
      <Description className="custom-desc" slot="test-slot">
        Test Description
      </Description>,
    )
    const element = getByText('Test Description')
    expect(element.className).toContain('custom-desc')
    expect(element.getAttribute('slot')).toBe('test-slot')
  })
})

describe('FieldError component', () => {
  test('renders empty when field is valid', () => {
    const { container } = render(
      <TextField>
        <FieldError data-testid="error">Error Message</FieldError>
      </TextField>,
    )
    // FieldError is not rendered by React Aria Components if field is valid
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument()
  })

  test('renders error message and role="alert" when field is invalid', () => {
    const { getByRole } = render(
      <TextField isInvalid>
        <FieldError>Invalid input</FieldError>
      </TextField>,
    )
    const element = getByRole('alert')
    expect(element).toBeInTheDocument()
    expect(element.textContent).toBe('Invalid input')
  })

  test('renders string errorMessage prop when invalid', () => {
    const { getByRole } = render(
      <TextField isInvalid>
        <FieldError errorMessage="Custom Error String" />
      </TextField>,
    )
    const element = getByRole('alert')
    expect(element.textContent).toBe('Custom Error String')
  })

  test('evaluates function errorMessage prop when invalid', () => {
    const errorMessageFn = vi.fn().mockReturnValue('Dynamic Error String')
    const { getByRole } = render(
      <TextField isInvalid>
        <FieldError errorMessage={errorMessageFn} />
      </TextField>,
    )
    const element = getByRole('alert')
    expect(element.textContent).toBe('Dynamic Error String')
    expect(errorMessageFn).toHaveBeenCalledWith(
      expect.objectContaining({
        isInvalid: true,
        validationErrors: expect.any(Array),
      }),
    )
  })
})

describe('ErrorMessage component', () => {
  test('renders standalone container with role="alert" and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByRole } = render(
      <ErrorMessage ref={ref} className="custom-error">
        Manual error occurred
      </ErrorMessage>,
    )
    const element = getByRole('alert')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('DIV')
    expect(element.textContent).toBe('Manual error occurred')
    expect(element.className).toContain('custom-error')
    expect(ref.current).toBe(element)
  })
})

describe('Form component', () => {
  test('renders form element, forwards ref and handles submit attributes', () => {
    const ref = React.createRef<HTMLFormElement>()
    const submitHandler = vi.fn((e) => e.preventDefault())
    const { container } = render(
      <Form ref={ref} onSubmit={submitHandler} data-testid="form">
        <button type="submit">Submit</button>
      </Form>,
    )
    const formElement = container.firstChild as HTMLFormElement
    expect(formElement.tagName).toBe('FORM')
    expect(ref.current).toBe(formElement)
  })
})

describe('Separator component', () => {
  test('renders horizontal separator by default and forwards ref', () => {
    const ref = React.createRef<HTMLElement>()
    const { container } = render(<Separator ref={ref} />)
    const element = container.firstChild as HTMLElement
    expect(element.getAttribute('aria-orientation') ?? 'horizontal').toBe(
      'horizontal',
    )
    expect(ref.current).toBe(element)
  })

  test('renders vertical separator', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const element = container.firstChild as HTMLElement
    expect(element.getAttribute('aria-orientation')).toBe('vertical')
  })
})

describe('Spinner component', () => {
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

  test('renders with role="progressbar" and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByRole } = render(
      <Spinner ref={ref} aria-label="Loading contents..." />,
    )
    const element = getByRole('progressbar')
    expect(element).toBeInTheDocument()
    expect(element.getAttribute('aria-label')).toBe('Loading contents...')
    expect(element.getAttribute('aria-live')).toBe('polite')
    expect(ref.current).toBe(element)
  })

  test('warns when label is missing in development mode', () => {
    render(<Spinner />)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain(
      '[Spinner] This component has no accessible name',
    )
  })

  test('does not warn when aria-label is provided', () => {
    render(<Spinner aria-label="Loading" />)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('supports size prop (sm, md, lg, xl)', () => {
    const { container } = render(
      <>
        <Spinner size="sm" aria-label="Small" />
        <Spinner size="md" aria-label="Medium" />
        <Spinner size="lg" aria-label="Large" />
        <Spinner size="xl" aria-label="Extra Large" />
      </>,
    )

    const spinners = container.querySelectorAll('[role="progressbar"]')
    expect(spinners.length).toBe(4)
  })

  test('includes prefers-reduced-motion CSS rule', () => {
    const spinnerStylesPath = path.resolve(
      __dirname,
      'Spinner/Spinner.styles.ts',
    )
    const fileContent = fs.readFileSync(spinnerStylesPath, 'utf8')
    expect(fileContent).toContain('prefers-reduced-motion')
  })
})

describe('Skeleton component', () => {
  test('renders and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { container } = render(
      <Skeleton ref={ref} className="custom-skeleton" />,
    )
    const element = container.firstChild as HTMLDivElement
    expect(element).toBeInTheDocument()
    expect(element.className).toContain('custom-skeleton')
    expect(ref.current).toBe(element)
  })

  test('supports shape variants (block, text, circle)', () => {
    const { container: blockContainer } = render(<Skeleton variant="block" />)
    const { container: textContainer } = render(<Skeleton variant="text" />)
    const { container: circleContainer } = render(<Skeleton variant="circle" />)

    expect(blockContainer.querySelector('[role="status"]')).toBeInTheDocument()
    expect(textContainer.querySelector('[role="status"]')).toBeInTheDocument()
    expect(circleContainer.querySelector('[role="status"]')).toBeInTheDocument()
  })

  test('renders multiple skeleton items when count > 1', () => {
    const { container } = render(<Skeleton count={4} variant="text" />)
    const wrapper = container.querySelector('[role="status"]')
    expect(wrapper).toBeInTheDocument()
    const items = container.querySelectorAll('[aria-hidden="true"]')
    expect(items.length).toBe(4)
  })

  test('includes prefers-reduced-motion CSS rule', () => {
    const skeletonStylesPath = path.resolve(
      __dirname,
      'Skeleton/Skeleton.styles.ts',
    )
    const fileContent = fs.readFileSync(skeletonStylesPath, 'utf8')
    expect(fileContent).toContain('prefers-reduced-motion')
  })
})
