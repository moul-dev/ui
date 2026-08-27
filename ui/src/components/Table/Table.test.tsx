import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from './index'

describe('Table component suite (semantic primitives)', () => {
  test('renders complete semantic table structure and forwards refs', () => {
    const tableRef = React.createRef<HTMLTableElement>()
    const theadRef = React.createRef<HTMLTableSectionElement>()
    const tbodyRef = React.createRef<HTMLTableSectionElement>()
    const tfootRef = React.createRef<HTMLTableSectionElement>()
    const trRef = React.createRef<HTMLTableRowElement>()
    const thRef = React.createRef<HTMLTableCellElement>()
    const tdRef = React.createRef<HTMLTableCellElement>()
    const captionRef = React.createRef<HTMLTableCaptionElement>()

    const { getByRole, getByText } = render(
      <Table ref={tableRef} aria-label="Users">
        <TableCaption ref={captionRef}>User directory</TableCaption>
        <TableHeader ref={theadRef}>
          <TableRow ref={trRef}>
            <TableHead ref={thRef}>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={tbodyRef}>
          <TableRow>
            <TableCell ref={tdRef}>Alice</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob</TableCell>
            <TableCell>Member</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={tfootRef}>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>2 Users</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )

    expect(getByRole('table')).toBeInTheDocument()
    expect(tableRef.current).toBeInstanceOf(HTMLTableElement)
    expect(theadRef.current).toBeInstanceOf(HTMLTableSectionElement)
    expect(tbodyRef.current).toBeInstanceOf(HTMLTableSectionElement)
    expect(tfootRef.current).toBeInstanceOf(HTMLTableSectionElement)
    expect(trRef.current).toBeInstanceOf(HTMLTableRowElement)
    expect(thRef.current).toBeInstanceOf(HTMLTableCellElement)
    expect(tdRef.current).toBeInstanceOf(HTMLTableCellElement)
    expect(captionRef.current).toBeInstanceOf(HTMLTableCaptionElement)
    expect(getByText('Alice')).toBeInTheDocument()
    expect(getByText('Total')).toBeInTheDocument()
  })

  test('handles responsive wrapper container prop', () => {
    const { container, rerender } = render(
      <Table wrapInContainer>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(
      container.querySelector('[data-moul-table-wrapper]'),
    ).toBeInTheDocument()

    rerender(
      <Table wrapInContainer={false}>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(
      container.querySelector('[data-moul-table-wrapper]'),
    ).not.toBeInTheDocument()
  })

  test('renders sort indicators and fires onSort callback on click and keyboard', () => {
    const handleSort = vi.fn()
    const { getByText, container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortDirection="asc" onSort={handleSort}>
              Username
            </TableHead>
            <TableHead sortDirection={false} onSort={handleSort}>
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    const userTh = getByText('Username').closest('th')
    expect(userTh).toHaveAttribute('aria-sort', 'ascending')
    expect(container.querySelectorAll('th svg').length).toBe(2)

    // Click trigger
    if (userTh) {
      fireEvent.click(userTh)
    }
    expect(handleSort).toHaveBeenCalledTimes(1)

    // Keyboard trigger (Enter key)
    if (userTh) {
      fireEvent.keyDown(userTh, { key: 'Enter' })
    }
    expect(handleSort).toHaveBeenCalledTimes(2)

    // Keyboard trigger (Space key)
    if (userTh) {
      fireEvent.keyDown(userTh, { key: ' ' })
    }
    expect(handleSort).toHaveBeenCalledTimes(3)
  })

  test('applies selection state on TableRow', () => {
    const { getByText } = render(
      <Table>
        <TableBody>
          <TableRow selected>
            <TableCell>Selected Row</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Unselected Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    const selectedTr = getByText('Selected Row').closest('tr')
    const unselectedTr = getByText('Unselected Row').closest('tr')

    expect(selectedTr).toHaveAttribute('aria-selected', 'true')
    expect(unselectedTr).not.toHaveAttribute('aria-selected')
  })

  test('renders TableEmpty spanning all columns', () => {
    const { getByText } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col 1</TableHead>
            <TableHead>Col 2</TableHead>
            <TableHead>Col 3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty colSpan={3}>No cluster records found</TableEmpty>
        </TableBody>
      </Table>,
    )

    const emptyCell = getByText('No cluster records found')
    expect(emptyCell).toBeInTheDocument()
    expect(emptyCell.closest('td')).toHaveAttribute('colspan', '3')
  })

  test('renders TableSkeleton with specified rows and columns', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableSkeleton rows={4} columns={3} />
        </TableBody>
      </Table>,
    )

    const rows = container.querySelectorAll('tbody tr')
    const cells = container.querySelectorAll('tbody td')
    expect(rows.length).toBe(4)
    expect(cells.length).toBe(12)
  })

  test('supports pinned column positioning and offsets', () => {
    const { getByText } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead pinned="left" pinOffset={0}>
              Pinned Head
            </TableHead>
            <TableHead>Regular Head</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell pinned="left" pinOffset={0}>
              Pinned Cell
            </TableCell>
            <TableCell>Regular Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    const pinnedHead = getByText('Pinned Head').closest('th')
    const pinnedCell = getByText('Pinned Cell').closest('td')

    expect(pinnedHead).toHaveStyle({ insetInlineStart: '0px' })
    expect(pinnedCell).toHaveStyle({ insetInlineStart: '0px' })
  })

  test('supports bordered prop on Table and cell primitives', () => {
    const { getByText } = render(
      <Table bordered>
        <TableHeader>
          <TableRow>
            <TableHead>Col 1</TableHead>
            <TableHead>Col 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data 1</TableCell>
            <TableCell bordered={false}>Data 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(getByText('Col 1')).toBeInTheDocument()
    expect(getByText('Data 1')).toBeInTheDocument()
  })
})
