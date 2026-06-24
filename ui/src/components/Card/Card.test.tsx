import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Card, CardHeader, CardBody, CardFooter } from './index'

describe('Card component enhancements', () => {
  test('renders default, flat, outline, and glass variants successfully', () => {
    const { container: defaultContainer } = render(
      <Card variant="default">Default Card</Card>,
    )
    const { container: flatContainer } = render(
      <Card variant="flat">Flat Card</Card>,
    )
    const { container: outlineContainer } = render(
      <Card variant="outline">Outline Card</Card>,
    )
    const { container: glassContainer } = render(
      <Card variant="glass">Glass Card</Card>,
    )

    expect(defaultContainer.firstChild).toBeInTheDocument()
    expect(flatContainer.firstChild).toBeInTheDocument()
    expect(outlineContainer.firstChild).toBeInTheDocument()
    expect(glassContainer.firstChild).toBeInTheDocument()
  })

  test('renders sm, md, and lg sizes successfully', () => {
    const { container: smContainer } = render(
      <Card size="sm">
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    const { container: mdContainer } = render(
      <Card size="md">
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    const { container: lgContainer } = render(
      <Card size="lg">
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )

    expect(smContainer.firstChild).toBeInTheDocument()
    expect(mdContainer.firstChild).toBeInTheDocument()
    expect(lgContainer.firstChild).toBeInTheDocument()
  })

  test('renders with divided dividers enabled', () => {
    const { container } = render(
      <Card divided={true}>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    expect(container.firstChild).toBeInTheDocument()
  })
})
