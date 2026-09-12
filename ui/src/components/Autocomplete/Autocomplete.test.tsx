import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { SearchField } from '../SearchField'
import {
  Autocomplete,
  AutocompleteEmptyState,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopover,
  AutocompleteSection,
} from './index'

describe('Autocomplete', () => {
  it('renders children correctly inside container', () => {
    render(
      <Autocomplete data-testid="autocomplete-root">
        <SearchField aria-label="Search items" />
        <AutocompleteList aria-label="Items">
          <AutocompleteItem id="apple">Apple</AutocompleteItem>
          <AutocompleteItem id="banana">Banana</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    expect(
      screen.getByRole('searchbox', { name: 'Search items' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Items' })).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('supports headless mode without rendering a container div', () => {
    render(
      <Autocomplete headless>
        <SearchField aria-label="Search items" />
        <AutocompleteList aria-label="Items">
          <AutocompleteItem id="1">First</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    // In headless mode, the first element should not be an Autocomplete wrapper div
    expect(
      screen.getByRole('searchbox', { name: 'Search items' }),
    ).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('filters items automatically with default contains filter', () => {
    render(
      <Autocomplete>
        <SearchField aria-label="Fruit search" />
        <AutocompleteList aria-label="Fruits">
          <AutocompleteItem id="apple">Apple</AutocompleteItem>
          <AutocompleteItem id="banana">Banana</AutocompleteItem>
          <AutocompleteItem id="apricot">Apricot</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    const input = screen.getByRole('searchbox', { name: 'Fruit search' })
    fireEvent.change(input, { target: { value: 'Ap' } })

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Apricot')).toBeInTheDocument()
    expect(screen.queryByText('Banana')).not.toBeInTheDocument()
  })

  it('supports custom filter function', () => {
    const customStartsWith = (textValue: string, inputValue: string) =>
      textValue.toLowerCase().startsWith(inputValue.toLowerCase())

    render(
      <Autocomplete filter={customStartsWith}>
        <SearchField aria-label="Fruit search" />
        <AutocompleteList aria-label="Fruits">
          <AutocompleteItem id="pineapple">Pineapple</AutocompleteItem>
          <AutocompleteItem id="apple">Apple</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    const input = screen.getByRole('searchbox', { name: 'Fruit search' })
    fireEvent.change(input, { target: { value: 'app' } })

    // StartsWith: "Apple" matches, but "Pineapple" does NOT
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.queryByText('Pineapple')).not.toBeInTheDocument()
  })

  it('allows bypassing client filter in async mode', () => {
    render(
      <Autocomplete mode="async">
        <SearchField aria-label="Remote search" />
        <AutocompleteList aria-label="Remote items">
          <AutocompleteItem id="alpha">Alpha</AutocompleteItem>
          <AutocompleteItem id="beta">Beta</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    const input = screen.getByRole('searchbox', { name: 'Remote search' })
    fireEvent.change(input, { target: { value: 'xyz' } })

    // Both remain because client filtering is bypassed in async mode
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders rich item layout with icon, description, and shortcut', () => {
    render(
      <Autocomplete>
        <SearchField aria-label="Actions" />
        <AutocompleteList aria-label="Action list">
          <AutocompleteItem
            id="new-file"
            icon={<span data-testid="test-icon">+</span>}
            description="Create an empty file"
            shortcut="⌘N"
          >
            New File
          </AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    expect(screen.getByText('New File')).toBeInTheDocument()
    expect(screen.getByText('Create an empty file')).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('⌘N')).toBeInTheDocument()
  })

  it('renders section headers correctly', () => {
    render(
      <Autocomplete>
        <SearchField aria-label="Files" />
        <AutocompleteList aria-label="File list">
          <AutocompleteSection title="Recent Files">
            <AutocompleteItem id="doc1">Doc 1</AutocompleteItem>
          </AutocompleteSection>
        </AutocompleteList>
      </Autocomplete>,
    )

    expect(screen.getByText('Recent Files')).toBeInTheDocument()
    expect(screen.getByText('Doc 1')).toBeInTheDocument()
  })

  it('displays empty state when no items match', () => {
    render(
      <Autocomplete>
        <SearchField aria-label="Empty test" />
        <AutocompleteList
          aria-label="Empty list"
          renderEmptyState={() => (
            <AutocompleteEmptyState>Nothing here!</AutocompleteEmptyState>
          )}
        >
          <AutocompleteItem id="first">First</AutocompleteItem>
        </AutocompleteList>
      </Autocomplete>,
    )

    const input = screen.getByRole('searchbox', { name: 'Empty test' })
    fireEvent.change(input, { target: { value: 'nomatch' } })

    expect(screen.getByText('Nothing here!')).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })

  it('renders AutocompletePopover with default containerRef trigger without throwing', () => {
    render(
      <Autocomplete>
        <SearchField aria-label="Search items" />
        <AutocompletePopover isOpen={true}>
          <AutocompleteList aria-label="Suggestions">
            <AutocompleteItem id="opt1">Option 1</AutocompleteItem>
          </AutocompleteList>
        </AutocompletePopover>
      </Autocomplete>,
    )

    expect(
      screen.getByRole('listbox', { name: 'Suggestions' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
  })

  it('allows opening and closing AutocompletePopover via state without crashing', () => {
    function TestComponent() {
      const [isOpen, setIsOpen] = React.useState(false)
      return (
        <div>
          <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
            Toggle Popover
          </button>
          <Autocomplete>
            <SearchField aria-label="Filter languages" />
            <AutocompletePopover
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              isNonModal
            >
              <AutocompleteList aria-label="Languages">
                <AutocompleteItem id="ts">TypeScript</AutocompleteItem>
              </AutocompleteList>
            </AutocompletePopover>
          </Autocomplete>
        </div>
      )
    }

    render(<TestComponent />)

    expect(
      screen.queryByRole('listbox', { name: 'Languages' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Popover' }))

    expect(
      screen.getByRole('listbox', { name: 'Languages' }),
    ).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Popover' }))

    expect(
      screen.queryByRole('listbox', { name: 'Languages' }),
    ).not.toBeInTheDocument()
  })
})
