import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import {
  CommandPalette,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSection,
} from './index'

describe('CommandPalette component', () => {
  test('renders dialog when isOpen is true', () => {
    render(
      <CommandPalette isOpen={true}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteSection heading="Actions">
            <CommandPaletteItem>Create Project</CommandPaletteItem>
          </CommandPaletteSection>
        </CommandPaletteList>
        <CommandPaletteFooter />
      </CommandPalette>,
    )

    expect(screen.getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search commands' })).toBeInTheDocument()
    expect(screen.getByText('Create Project')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  test('does not render when isOpen is false', () => {
    render(
      <CommandPalette isOpen={false}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem>Hidden Action</CommandPaletteItem>
        </CommandPaletteList>
      </CommandPalette>,
    )

    expect(screen.queryByText('Hidden Action')).not.toBeInTheDocument()
  })

  test('filters items based on search input', () => {
    render(
      <CommandPalette isOpen={true}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem>Dashboard</CommandPaletteItem>
          <CommandPaletteItem>Settings</CommandPaletteItem>
        </CommandPaletteList>
      </CommandPalette>,
    )

    const input = screen.getByRole('textbox', { name: 'Search commands' })
    fireEvent.change(input, { target: { value: 'dash' } })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  test('executes onAction callback when item is clicked', () => {
    const handleAction = vi.fn()
    const handleOpenChange = vi.fn()

    render(
      <CommandPalette isOpen={true} onOpenChange={handleOpenChange}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem onAction={handleAction}>Deploy</CommandPaletteItem>
        </CommandPaletteList>
      </CommandPalette>,
    )

    const item = screen.getByText('Deploy')
    fireEvent.click(item)

    expect(handleAction).toHaveBeenCalledTimes(1)
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  test('navigates through items with arrow keys and selects with Enter', () => {
    const handleFirst = vi.fn()
    const handleSecond = vi.fn()
    const handleOpenChange = vi.fn()

    render(
      <CommandPalette isOpen={true} onOpenChange={handleOpenChange}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem onAction={handleFirst}>First Action</CommandPaletteItem>
          <CommandPaletteItem onAction={handleSecond}>Second Action</CommandPaletteItem>
        </CommandPaletteList>
      </CommandPalette>,
    )

    const input = screen.getByRole('textbox', { name: 'Search commands' })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')

    // Navigate to second item
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')

    // Press Enter to select second item
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleSecond).toHaveBeenCalledTimes(1)
    expect(handleFirst).not.toHaveBeenCalled()
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  test('renders shortcut badges on items', () => {
    render(
      <CommandPalette isOpen={true}>
        <CommandPaletteInput />
        <CommandPaletteList>
          <CommandPaletteItem shortcut={['⌘', 'P']}>Print</CommandPaletteItem>
        </CommandPaletteList>
      </CommandPalette>,
    )

    expect(screen.getByText('⌘')).toBeInTheDocument()
    expect(screen.getByText('P')).toBeInTheDocument()
  })
})
