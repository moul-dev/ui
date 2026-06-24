import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TagGroup, Tag } from '../index'

describe('TagGroup and Tag components', () => {
  test('renders basic list of tags with label and description', () => {
    const { getByText, getAllByRole } = render(
      <TagGroup label="Categories" description="Choose tags">
        <Tag id="news">News</Tag>
        <Tag id="travel">Travel</Tag>
        <Tag id="gaming">Gaming</Tag>
      </TagGroup>
    )

    expect(getByText('Categories')).toBeInTheDocument()
    expect(getByText('Choose tags')).toBeInTheDocument()
    
    // RAC TagGroup lists items under a grid or listbox role
    const tags = getAllByRole('row') // RAC Tag renders as a row / gridcell structure
    expect(tags).toHaveLength(3)
  })

  test('renders error message when invalid', () => {
    const { getByText } = render(
      <TagGroup label="Categories" isInvalid errorMessage="This is required">
        <Tag id="news">News</Tag>
      </TagGroup>
    )

    expect(getByText('This is required')).toBeInTheDocument()
  })

  test('supports selection mode and changes selection', () => {
    const onSelectionChange = vi.fn()
    const { getAllByRole } = render(
      <TagGroup
        label="Categories"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      >
        <Tag id="news">News</Tag>
        <Tag id="travel">Travel</Tag>
      </TagGroup>
    )

    const tags = getAllByRole('row')
    fireEvent.click(tags[0])
    
    expect(onSelectionChange).toHaveBeenCalledTimes(1)
    const selectedKeys = onSelectionChange.mock.calls[0][0]
    expect(selectedKeys.has('news')).toBe(true)
  })

  test('renders remove buttons and triggers onRemove', async () => {
    const onRemove = vi.fn()
    const { getAllByRole } = render(
      <TagGroup label="Categories" onRemove={onRemove}>
        <Tag id="news">News</Tag>
        <Tag id="travel">Travel</Tag>
      </TagGroup>
    )

    // Verify remove button is rendered inside RAC's gridcell/row structure
    const removeButtons = getAllByRole('button')
    expect(removeButtons).toHaveLength(2)

    fireEvent.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledTimes(1)
    
    const removedKeys = onRemove.mock.calls[0][0]
    expect(removedKeys.has('news')).toBe(true)
  })

  test('renders tag as a link', () => {
    const { getByRole } = render(
      <TagGroup label="Photo categories">
        <Tag id="landscape" href="https://wikipedia.org" target="_blank">
          Landscape
        </Tag>
      </TagGroup>
    )

    const tag = getByRole('row')
    expect(tag).toHaveAttribute('data-href', 'https://wikipedia.org')
  })

  test('supports isDisabled state', () => {
    const { getAllByRole } = render(
      <TagGroup label="Categories" isDisabled>
        <Tag id="news">News</Tag>
        <Tag id="travel">Travel</Tag>
      </TagGroup>
    )

    const tags = getAllByRole('row')
    expect(tags[0]).toHaveAttribute('aria-disabled', 'true')
    expect(tags[1]).toHaveAttribute('aria-disabled', 'true')
  })

  test('supports size and variant props on TagGroup and Tag', () => {
    const { getAllByRole } = render(
      <TagGroup label="Categories" size="sm" variant="primary">
        <Tag id="news">News</Tag>
        <Tag id="travel" size="lg" variant="tertiary">Travel</Tag>
      </TagGroup>
    )

    const tags = getAllByRole('row')
    expect(tags[0]).toBeInTheDocument()
    expect(tags[1]).toBeInTheDocument()
  })
})
