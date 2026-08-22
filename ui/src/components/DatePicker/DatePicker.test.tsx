import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Calendar, RangeCalendar } from '../Calendar'
import { DateField } from '../DateField'
import { DatePicker, DateRangePicker } from './index'

describe('Calendar component', () => {
  test('renders heading and navigation buttons', () => {
    render(<Calendar aria-label="Event date" />)
    expect(
      screen.getByRole('button', { name: 'Previous month' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next month' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })
})

describe('RangeCalendar component', () => {
  test('renders grid and previous/next buttons', () => {
    render(<RangeCalendar aria-label="Trip dates" />)
    expect(
      screen.getByRole('button', { name: 'Previous month' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next month' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })
})

describe('DateField component', () => {
  test('renders label and date input segments', () => {
    render(<DateField label="Birth Date" />)
    expect(screen.getByText('Birth Date')).toBeInTheDocument()
  })

  test('renders description and field error if provided', () => {
    render(
      <DateField
        label="Start Date"
        description="Select a future date"
        isInvalid
        errorMessage="Date is required"
      />,
    )
    expect(screen.getByText('Select a future date')).toBeInTheDocument()
    expect(screen.getByText('Date is required')).toBeInTheDocument()
  })
})

describe('DatePicker component', () => {
  test('renders label, input, and calendar trigger button', () => {
    render(<DatePicker label="Appointment" />)
    expect(screen.getByText('Appointment')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /calendar/i }),
    ).toBeInTheDocument()
  })
})

describe('DateRangePicker component', () => {
  test('renders label, start/end inputs, and calendar trigger button', () => {
    render(<DateRangePicker label="Booking Period" />)
    expect(screen.getByText('Booking Period')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /calendar/i }),
    ).toBeInTheDocument()
  })
})
