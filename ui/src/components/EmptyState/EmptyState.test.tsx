import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'
import { Button } from '../Button'
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from './EmptyState'

const testStyles = stylex.create({
  custom: {
    marginBlockStart: '16px',
  },
})

describe('EmptyState component', () => {
  test('renders direct props (title, description, icon, action) and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    const handleAction = vi.fn()

    render(
      <EmptyState
        ref={ref}
        icon={<span data-testid="test-icon">📁</span>}
        title="No files found"
        description="Your search returned no matching documents."
        action={
          <Button onPress={handleAction} variant="primary">
            Upload File
          </Button>
        }
      />,
    )

    expect(ref.current).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('No files found')).toBeInTheDocument()
    expect(
      screen.getByText('Your search returned no matching documents.'),
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Upload File' })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  test('supports secondaryAction prop', () => {
    const handleSecondary = vi.fn()

    render(
      <EmptyState
        title="Empty Project"
        description="Start by adding items or importing from file."
        action={<Button variant="primary">New Item</Button>}
        secondaryAction={
          <Button variant="outline" onPress={handleSecondary}>
            Import
          </Button>
        }
      />,
    )

    const secondaryBtn = screen.getByRole('button', { name: 'Import' })
    expect(secondaryBtn).toBeInTheDocument()
    fireEvent.click(secondaryBtn)
    expect(handleSecondary).toHaveBeenCalledTimes(1)
  })

  test('renders compound structure with ref forwarding', () => {
    const rootRef = React.createRef<HTMLDivElement>()
    const iconRef = React.createRef<HTMLDivElement>()
    const titleRef = React.createRef<HTMLHeadingElement>()
    const descRef = React.createRef<HTMLParagraphElement>()
    const actionsRef = React.createRef<HTMLDivElement>()

    render(
      <EmptyState ref={rootRef} variant="dashed" size="lg">
        <EmptyStateIcon ref={iconRef}>🔍</EmptyStateIcon>
        <EmptyStateTitle ref={titleRef} as="h2">
          No Results
        </EmptyStateTitle>
        <EmptyStateDescription ref={descRef}>
          Please try a different query keyword.
        </EmptyStateDescription>
        <EmptyStateActions ref={actionsRef}>
          <Button variant="secondary">Clear Filter</Button>
        </EmptyStateActions>
      </EmptyState>,
    )

    expect(rootRef.current).toBeInTheDocument()
    expect(iconRef.current).toBeInTheDocument()
    expect(titleRef.current).toBeInTheDocument()
    expect(titleRef.current?.tagName).toBe('H2')
    expect(descRef.current).toBeInTheDocument()
    expect(actionsRef.current).toBeInTheDocument()
    expect(screen.getByText('No Results')).toBeInTheDocument()
  })

  test('applies custom className and style props', () => {
    const { container } = render(
      <EmptyState
        title="Styled State"
        className="custom-empty-class"
        style={testStyles.custom}
      />,
    )

    const root = container.querySelector('.custom-empty-class')
    expect(root).toBeInTheDocument()
  })
})
