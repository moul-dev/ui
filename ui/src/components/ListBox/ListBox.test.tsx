import { fireEvent, render, screen } from '@testing-library/react'
import { type DropTarget, useDragAndDrop } from 'react-aria-components'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DropIndicator,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
  Text,
} from './ListBox'

beforeAll(() => {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as any
})

describe('ListBox component suite', () => {
  it('renders static listbox with items', () => {
    render(
      <ListBox aria-label="Favorite animal">
        <ListBoxItem id="cat">Cat</ListBoxItem>
        <ListBoxItem id="dog">Dog</ListBoxItem>
        <ListBoxItem id="rabbit">Rabbit</ListBoxItem>
      </ListBox>,
    )

    const listbox = screen.getByRole('listbox', { name: 'Favorite animal' })
    expect(listbox).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('Cat')
    expect(options[1]).toHaveTextContent('Dog')
    expect(options[2]).toHaveTextContent('Rabbit')
  })

  it('handles single selection mode', () => {
    const handleSelectionChange = vi.fn()

    render(
      <ListBox
        aria-label="Animals"
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        <ListBoxItem id="cat">Cat</ListBoxItem>
        <ListBoxItem id="dog">Dog</ListBoxItem>
      </ListBox>,
    )

    const catOption = screen.getByRole('option', { name: 'Cat' })
    expect(catOption).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(catOption)

    expect(handleSelectionChange).toHaveBeenCalledTimes(1)
    const selectedKeys = Array.from(handleSelectionChange.mock.calls[0][0])
    expect(selectedKeys).toContain('cat')
  })

  it('handles multiple selection mode', () => {
    const handleSelectionChange = vi.fn()

    render(
      <ListBox
        aria-label="Fruits"
        selectionMode="multiple"
        onSelectionChange={handleSelectionChange}
      >
        <ListBoxItem id="apple">Apple</ListBoxItem>
        <ListBoxItem id="banana">Banana</ListBoxItem>
        <ListBoxItem id="cherry">Cherry</ListBoxItem>
      </ListBox>,
    )

    const appleOption = screen.getByRole('option', { name: 'Apple' })
    fireEvent.click(appleOption)

    expect(handleSelectionChange).toHaveBeenCalledTimes(1)
  })

  it('respects disabled items', () => {
    const handleSelectionChange = vi.fn()

    render(
      <ListBox
        aria-label="Items"
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        <ListBoxItem id="item1">Active Item</ListBoxItem>
        <ListBoxItem id="item2" isDisabled>
          Disabled Item
        </ListBoxItem>
      </ListBox>,
    )

    const disabledOption = screen.getByRole('option', { name: 'Disabled Item' })
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(disabledOption)
    expect(handleSelectionChange).not.toHaveBeenCalled()
  })

  it('renders label and description props on ListBoxItem', () => {
    render(
      <ListBox aria-label="Permissions" selectionMode="single">
        <ListBoxItem
          id="read"
          label="Read Permission"
          description="Read-only access to files"
        />
        <ListBoxItem
          id="write"
          label="Write Permission"
          description="Can create and modify files"
        />
      </ListBox>,
    )

    expect(screen.getByText('Read Permission')).toBeInTheDocument()
    expect(screen.getByText('Read-only access to files')).toBeInTheDocument()
    expect(screen.getByText('Write Permission')).toBeInTheDocument()
    expect(screen.getByText('Can create and modify files')).toBeInTheDocument()
  })

  it('supports slot-based Text for label and description', () => {
    render(
      <ListBox aria-label="Slot Example">
        <ListBoxItem id="admin" textValue="Administrator">
          <Text slot="label">Administrator</Text>
          <Text slot="description">Full system access</Text>
        </ListBoxItem>
      </ListBox>,
    )

    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Full system access')).toBeInTheDocument()
  })

  it('renders checkmark when showCheckmark is true and item is selected', () => {
    render(
      <ListBox
        aria-label="Checkmark Example"
        selectionMode="single"
        selectedKeys={new Set(['selected-item'])}
      >
        <ListBoxItem id="selected-item" showCheckmark>
          Selected Item
        </ListBoxItem>
        <ListBoxItem id="unselected-item" showCheckmark>
          Unselected Item
        </ListBoxItem>
      </ListBox>,
    )

    const selectedOption = screen.getByRole('option', {
      name: 'Selected Item',
    })
    expect(selectedOption).toHaveAttribute('aria-selected', 'true')
    expect(selectedOption.querySelector('svg')).toBeInTheDocument()

    const unselectedOption = screen.getByRole('option', {
      name: 'Unselected Item',
    })
    expect(unselectedOption).toHaveAttribute('aria-selected', 'false')
    expect(unselectedOption.querySelector('svg')).not.toBeInTheDocument()
  })

  it('renders sections with title and custom headers', () => {
    render(
      <ListBox aria-label="Sectioned List">
        <ListBoxSection id="sec1" title="Section One">
          <ListBoxItem id="s1-item1">Item 1.1</ListBoxItem>
        </ListBoxSection>
        <ListBoxSection id="sec2">
          <Header>Custom Header</Header>
          <ListBoxItem id="s2-item1">Item 2.1</ListBoxItem>
        </ListBoxSection>
      </ListBox>,
    )

    expect(screen.getByText('Section One')).toBeInTheDocument()
    expect(screen.getByText('Custom Header')).toBeInTheDocument()
    expect(screen.getByText('Item 1.1')).toBeInTheDocument()
    expect(screen.getByText('Item 2.1')).toBeInTheDocument()
  })

  it('renders empty state content when collection is empty', () => {
    render(
      <ListBox
        aria-label="Empty List"
        renderEmptyState={() => <div>No records available</div>}
      >
        {[]}
      </ListBox>,
    )

    expect(screen.getByText('No records available')).toBeInTheDocument()
  })

  it('supports size and variant configurations', () => {
    const { rerender } = render(
      <ListBox aria-label="Size Test" size="sm" variant="flat">
        <ListBoxItem id="item1">Small Flat Item</ListBoxItem>
      </ListBox>,
    )

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    rerender(
      <ListBox aria-label="Size Test" size="lg" variant="plain">
        <ListBoxItem id="item1">Large Plain Item</ListBoxItem>
      </ListBox>,
    )

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('supports links on ListBoxItem', () => {
    render(
      <ListBox aria-label="Links">
        <ListBoxItem id="docs" href="https://moul.dev">
          Moul Documentation
        </ListBoxItem>
      </ListBox>,
    )

    const linkItem = screen.getByRole('option', { name: 'Moul Documentation' })
    expect(linkItem).toHaveAttribute('href', 'https://moul.dev')
  })

  it('renders ListBoxLoadMoreItem with default spinner', () => {
    render(
      <ListBox aria-label="Infinite List">
        <ListBoxItem id="item1">First Item</ListBoxItem>
        <ListBoxLoadMoreItem isLoading aria-label="Loading more..." />
      </ListBox>,
    )

    expect(screen.getByText('First Item')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('supports drag and drop hooks and DropIndicator rendering', () => {
    function DnDListBox() {
      const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys) =>
          Array.from(keys).map((key) => ({
            'text/plain': String(key),
          })),
      })

      return (
        <ListBox
          aria-label="Reorderable List"
          selectionMode="single"
          dragAndDropHooks={dragAndDropHooks}
          renderDropIndicator={(target: DropTarget) => (
            <DropIndicator target={target} data-testid="custom-indicator" />
          )}
        >
          <ListBoxItem id="item1">Draggable One</ListBoxItem>
          <ListBoxItem id="item2">Draggable Two</ListBoxItem>
        </ListBox>
      )
    }

    render(<DnDListBox />)
    expect(screen.getByText('Draggable One')).toBeInTheDocument()
    expect(screen.getByText('Draggable Two')).toBeInTheDocument()
  })
})
