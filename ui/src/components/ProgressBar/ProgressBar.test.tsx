import * as stylex from '@stylexjs/stylex'
import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ProgressBar } from './ProgressBar'

const testStyles = stylex.create({
  custom: {
    marginBlockStart: '12px',
  },
})

describe('ProgressBar component', () => {
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

  test('renders with progressbar role and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<ProgressBar ref={ref} value={60} aria-label="Loading files" />)

    const progressbar = screen.getByRole('progressbar', {
      name: 'Loading files',
    })
    expect(progressbar).toBeInTheDocument()
    expect(ref.current).toBe(progressbar)
    expect(progressbar).toHaveAttribute('aria-valuenow', '60')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
  })

  test('renders visible label and percentage text', () => {
    render(<ProgressBar label="Uploading asset" value={75} />)

    expect(screen.getByText('Uploading asset')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  test('supports custom valueLabel string override', () => {
    render(
      <ProgressBar
        label="Storage"
        value={45}
        valueLabel="450 MB / 1 GB"
        showValueText
      />,
    )

    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('450 MB / 1 GB')).toBeInTheDocument()
  })

  test('handles indeterminate state properly without aria-valuenow', () => {
    render(<ProgressBar isIndeterminate aria-label="Processing query" />)

    const progressbar = screen.getByRole('progressbar', {
      name: 'Processing query',
    })
    expect(progressbar).toBeInTheDocument()
    expect(progressbar).not.toHaveAttribute('aria-valuenow')
  })

  test('supports custom min/max ranges', () => {
    render(
      <ProgressBar
        value={15}
        minValue={10}
        maxValue={20}
        aria-label="Bounded range"
      />,
    )

    const progressbar = screen.getByRole('progressbar', {
      name: 'Bounded range',
    })
    expect(progressbar).toHaveAttribute('aria-valuenow', '15')
    expect(progressbar).toHaveAttribute('aria-valuemin', '10')
    expect(progressbar).toHaveAttribute('aria-valuemax', '20')
  })

  test('applies custom className and style props', () => {
    const { container } = render(
      <ProgressBar
        value={50}
        aria-label="Styled bar"
        className="custom-bar-class"
        style={testStyles.custom}
      />,
    )

    const root = container.querySelector('.custom-bar-class')
    expect(root).toBeInTheDocument()
  })

  test('supports render prop children', () => {
    render(
      <ProgressBar value={80} aria-label="Custom render">
        {({ percentage }) => <div>Custom Fill: {percentage}%</div>}
      </ProgressBar>,
    )

    expect(screen.getByText('Custom Fill: 80%')).toBeInTheDocument()
  })

  test('warns when accessible label is missing in development mode', () => {
    render(<ProgressBar value={40} />)
    expect(
      warnSpy.mock.calls.some((call: any[]) =>
        call[0]?.includes(
          '[ProgressBar] This component has no accessible name',
        ),
      ),
    ).toBe(true)
  })

  test('does not warn when label or aria-label is provided', () => {
    render(<ProgressBar label="Valid Label" value={40} />)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
