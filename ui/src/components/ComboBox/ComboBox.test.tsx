import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ComboBox, ComboBoxItem, ComboBoxSection } from './ComboBox'

describe('ComboBox component and onAction support', () => {
  it('triggers item-level onAction without updating selection', () => {
    const handleAction = vi.fn()
    const handleSelectionChange = vi.fn()

    render(
      <ComboBox label="Animals" onSelectionChange={handleSelectionChange}>
        <ComboBoxItem id="create-action" onAction={handleAction}>
          Create New Animal
        </ComboBoxItem>
        <ComboBoxItem id="cat">Cat</ComboBoxItem>
        <ComboBoxItem id="dog">Dog</ComboBoxItem>
      </ComboBox>,
    )

    const trigger = screen.getByRole('button', { name: /show suggestions/i })
    fireEvent.click(trigger)

    const actionItem = screen.getByText('Create New Animal')
    fireEvent.click(actionItem)

    expect(handleAction).toHaveBeenCalledTimes(1)
    expect(handleSelectionChange).not.toHaveBeenCalled()
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('triggers component-level onAction and preserves selection on regular items', () => {
    const handleAction = vi.fn()
    const handleSelectionChange = vi.fn()

    render(
      <ComboBox
        label="Animals"
        onAction={handleAction}
        onSelectionChange={handleSelectionChange}
      >
        <ComboBoxItem id="cat">Cat</ComboBoxItem>
        <ComboBoxItem id="dog">Dog</ComboBoxItem>
      </ComboBox>,
    )

    const trigger = screen.getByRole('button', { name: /show suggestions/i })
    fireEvent.click(trigger)

    const catItem = screen.getByText('Cat')
    fireEvent.click(catItem)

    expect(handleAction).toHaveBeenCalledWith('cat')
    expect(handleSelectionChange).toHaveBeenCalledWith('cat')
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('Cat')
  })

  it('distinguishes between action items and regular items with top-level onAction', () => {
    const handleTopAction = vi.fn()
    const handleItemAction = vi.fn()
    const handleSelectionChange = vi.fn()

    render(
      <ComboBox
        label="Fruit"
        onAction={handleTopAction}
        onSelectionChange={handleSelectionChange}
      >
        <ComboBoxItem id="create" onAction={handleItemAction}>
          Create Custom Fruit
        </ComboBoxItem>
        <ComboBoxItem id="apple">Apple</ComboBoxItem>
      </ComboBox>,
    )

    const trigger = screen.getByRole('button', { name: /show suggestions/i })
    fireEvent.click(trigger)

    // Click action item
    const createItem = screen.getByText('Create Custom Fruit')
    fireEvent.click(createItem)

    expect(handleItemAction).toHaveBeenCalledTimes(1)
    expect(handleTopAction).toHaveBeenCalledWith('create')
    expect(handleSelectionChange).not.toHaveBeenCalled()

    // Reopen and click regular item
    fireEvent.click(trigger)
    const appleItem = screen.getByText('Apple')
    fireEvent.click(appleItem)

    expect(handleTopAction).toHaveBeenCalledWith('apple')
    expect(handleSelectionChange).toHaveBeenCalledWith('apple')
  })

  it('supports allowsEmptyCollection for dynamic create item patterns', () => {
    const handleCreate = vi.fn()

    function DynamicCreateExample() {
      const [inputVal, setInputVal] = React.useState('')
      return (
        <ComboBox
          label="Tags"
          allowsEmptyCollection
          inputValue={inputVal}
          onInputChange={setInputVal}
        >
          {inputVal.length > 0 && (
            <ComboBoxItem
              id="create-tag"
              onAction={() => handleCreate(inputVal)}
            >
              {`Create "${inputVal}"`}
            </ComboBoxItem>
          )}
          <ComboBoxItem id="react">React</ComboBoxItem>
          <ComboBoxItem id="vue">Vue</ComboBoxItem>
        </ComboBox>
      )
    }

    render(<DynamicCreateExample />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    input.focus()
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Svelte' } })

    const createOption = screen.getByText('Create "Svelte"')
    expect(createOption).toBeInTheDocument()

    fireEvent.click(createOption)
    expect(handleCreate).toHaveBeenCalledWith('Svelte')
  })

  it('supports generic collections using items prop', () => {
    interface Item {
      id: string
      label: string
    }

    const items: Item[] = [
      { id: '1', label: 'Item One' },
      { id: '2', label: 'Item Two' },
    ]

    render(
      <ComboBox<Item> label="Select Item" items={items}>
        {(item) => <ComboBoxItem id={item.id}>{item.label}</ComboBoxItem>}
      </ComboBox>,
    )

    const trigger = screen.getByRole('button', { name: /show suggestions/i })
    fireEvent.click(trigger)

    expect(screen.getByText('Item One')).toBeInTheDocument()
    expect(screen.getByText('Item Two')).toBeInTheDocument()
  })

  it('renders ComboBoxSection with title', () => {
    render(
      <ComboBox label="Categories">
        <ComboBoxSection title="Fruits">
          <ComboBoxItem id="banana">Banana</ComboBoxItem>
        </ComboBoxSection>
        <ComboBoxSection title="Vegetables">
          <ComboBoxItem id="carrot">Carrot</ComboBoxItem>
        </ComboBoxSection>
      </ComboBox>,
    )

    const trigger = screen.getByRole('button', { name: /show suggestions/i })
    fireEvent.click(trigger)

    expect(screen.getByText('Fruits')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Vegetables')).toBeInTheDocument()
    expect(screen.getByText('Carrot')).toBeInTheDocument()
  })
})
