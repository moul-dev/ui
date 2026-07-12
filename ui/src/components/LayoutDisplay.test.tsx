import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Kbd,
  Typography,
} from '../index'

describe('Badge component', () => {
  test('renders children and forwards ref', () => {
    const ref = React.createRef<HTMLSpanElement>()
    const { getByText } = render(<Badge ref={ref}>Awaiting Review</Badge>)

    const element = getByText('Awaiting Review')
    expect(element).toBeInTheDocument()
    expect(element.tagName).toBe('SPAN')
    expect(ref.current).toBe(element)
  })

  test('applies variant classes and propagates custom classNames', () => {
    const { getByText } = render(
      <Badge variant="success" className="custom-badge-class">
        Done
      </Badge>,
    )
    const element = getByText('Done')
    expect(element.className).toContain('custom-badge-class')
  })
})

describe('Avatar component', () => {
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

  test('renders initials and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByText } = render(<Avatar ref={ref} initials="JD" />)

    const element = getByText('JD')
    expect(element).toBeInTheDocument()
    expect(ref.current?.textContent).toBe('JD')
  })

  test('renders image if src is provided and loads successfully', () => {
    const { container } = render(
      <Avatar src="https://example.com/avatar.png" alt="Jane Doe" />,
    )
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.getAttribute('src')).toBe('https://example.com/avatar.png')
    expect(img?.getAttribute('alt')).toBe('Jane Doe')
  })

  test('falls back to initials on image loading error', () => {
    const { container, getByText } = render(
      <Avatar
        src="https://example.com/bad-avatar.png"
        alt="Jane Doe"
        initials="JD"
      />,
    )
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()

    // Trigger image error event
    fireEvent.error(img!)

    // Image should be removed and initials should be displayed
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(getByText('JD')).toBeInTheDocument()
  })

  test('warns when accessible name is missing in development mode', () => {
    render(<Avatar />)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain(
      '[Avatar] This component has no accessible name',
    )
  })

  test('does not warn when initials are provided', () => {
    render(<Avatar initials="AB" />)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('does not warn when alt or aria-label is provided', () => {
    render(<Avatar src="avatar.png" alt="A User" />)
    render(<Avatar src="avatar.png" aria-label="A User" />)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('Typography component', () => {
  test('renders default span and forwards ref', () => {
    const ref = React.createRef<HTMLElement>()
    const { getByText } = render(<Typography ref={ref}>Simple Text</Typography>)

    const element = getByText('Simple Text')
    expect(element.tagName).toBe('SPAN')
    expect(ref.current).toBe(element)
  })

  test('renders correct element type for each "as" value', () => {
    const tags: Array<
      'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label'
    > = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label']

    tags.forEach((tag) => {
      const { getByText } = render(
        <Typography as={tag}>Text for {tag}</Typography>,
      )
      const element = getByText(`Text for ${tag}`)
      expect(element.tagName).toBe(tag.toUpperCase())
    })
  })

  test('accepts custom style and className overrides', () => {
    const { getByText } = render(
      <Typography as="h1" className="my-typo">
        Subtitle Caption
      </Typography>,
    )
    const element = getByText('Subtitle Caption')
    expect(element.tagName).toBe('H1')
    expect(element.className).toContain('my-typo')
  })

  test('renders semantic subcomponents correctly', () => {
    const headingRef = React.createRef<HTMLHeadingElement>()
    const paragraphRef = React.createRef<HTMLParagraphElement>()
    const spanRef = React.createRef<HTMLSpanElement>()
    const labelRef = React.createRef<HTMLLabelElement>()

    const { getByText } = render(
      <>
        <Typography.Heading as="h3" ref={headingRef}>Heading Level 3</Typography.Heading>
        <Typography.Paragraph ref={paragraphRef}>Paragraph text</Typography.Paragraph>
        <Typography.Span ref={spanRef}>Span text</Typography.Span>
        <Typography.Label ref={labelRef}>Label text</Typography.Label>
      </>
    )

    const headingEl = getByText('Heading Level 3')
    expect(headingEl.tagName).toBe('H3')
    expect(headingRef.current).toBe(headingEl)

    const paragraphEl = getByText('Paragraph text')
    expect(paragraphEl.tagName).toBe('P')
    expect(paragraphRef.current).toBe(paragraphEl)

    const spanEl = getByText('Span text')
    expect(spanEl.tagName).toBe('SPAN')
    expect(spanRef.current).toBe(spanEl)

    const labelEl = getByText('Label text')
    expect(labelEl.tagName).toBe('LABEL')
    expect(labelRef.current).toBe(labelEl)
  })
})

describe('Card component suite', () => {
  test('renders full compound card and forwards ref on root', () => {
    const ref = React.createRef<HTMLDivElement>()
    const { getByText } = render(
      <Card ref={ref} elevation={2}>
        <CardHeader>Header Area</CardHeader>
        <CardBody>Body content goes here.</CardBody>
        <CardFooter>Footer Area</CardFooter>
      </Card>,
    )

    const root = ref.current
    expect(root).toBeInTheDocument()
    expect(getByText('Header Area')).toBeInTheDocument()
    expect(getByText('Body content goes here.')).toBeInTheDocument()
    expect(getByText('Footer Area')).toBeInTheDocument()
  })

  test('sub-components forward ref correctly', () => {
    const headerRef = React.createRef<HTMLDivElement>()
    const bodyRef = React.createRef<HTMLDivElement>()
    const footerRef = React.createRef<HTMLDivElement>()

    render(
      <Card>
        <CardHeader ref={headerRef}>Header</CardHeader>
        <CardBody ref={bodyRef}>Body</CardBody>
        <CardFooter ref={footerRef}>Footer</CardFooter>
      </Card>,
    )

    expect(headerRef.current).toBeInTheDocument()
    expect(bodyRef.current).toBeInTheDocument()
    expect(footerRef.current).toBeInTheDocument()
  })
})

describe('Kbd component', () => {
  test('renders kbd tag and forwards ref', () => {
    const ref = React.createRef<HTMLElement>()
    const { getByText } = render(<Kbd ref={ref}>⌘K</Kbd>)

    const element = getByText('⌘K')
    expect(element.tagName).toBe('KBD')
    expect(ref.current).toBe(element)
  })
})
