import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Avatar, AvatarGroup } from './index'

describe('Avatar component', () => {
  test('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/user.jpg" alt="Jane Doe" />)
    const img = screen.getByRole('img', { name: 'Jane Doe' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/user.jpg')
  })

  test('falls back to initials when src fails or is not provided', () => {
    render(<Avatar initials="JD" aria-label="Jane Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  test('falls back to initials on img error', () => {
    render(
      <Avatar
        src="https://invalid-image-url.xyz/broken.png"
        alt="Jane Doe"
        initials="JD"
      />,
    )
    const img = screen.getByRole('img', { name: 'Jane Doe' })
    fireEvent.error(img)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  test('renders status indicator dot with accessible role', () => {
    render(
      <Avatar
        initials="JD"
        status="online"
        statusAriaLabel="User is active now"
      />,
    )
    const statusDot = screen.getByRole('status', { name: 'User is active now' })
    expect(statusDot).toBeInTheDocument()
  })

  test('renders default icon fallback when neither src nor initials provided', () => {
    const { container } = render(<Avatar aria-label="Anonymous user" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  test('supports custom fallback node', () => {
    render(
      <Avatar
        fallback={<span data-testid="custom-fallback">Custom</span>}
        aria-label="User"
      />,
    )
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
  })
})

describe('AvatarGroup component', () => {
  test('renders children and applies max limit with excess indicator', () => {
    render(
      <AvatarGroup max={2} aria-label="Team members">
        <Avatar initials="A" aria-label="Alice" />
        <Avatar initials="B" aria-label="Bob" />
        <Avatar initials="C" aria-label="Charlie" />
        <Avatar initials="D" aria-label="David" />
      </AvatarGroup>,
    )

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.queryByText('C')).not.toBeInTheDocument()
    expect(screen.queryByText('D')).not.toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  test('passes size and shape via context to children', () => {
    render(
      <AvatarGroup size="sm" shape="square" aria-label="Group">
        <Avatar initials="U1" aria-label="User 1" />
      </AvatarGroup>,
    )
    expect(screen.getByText('U1')).toBeInTheDocument()
  })
})
