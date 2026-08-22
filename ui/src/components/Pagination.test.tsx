import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'
import {
  generatePagination,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationSummary,
} from './Pagination'

const testStyles = stylex.create({
  custom: {
    padding: '8px',
  },
})

describe('generatePagination helper', () => {
  test('returns all page numbers when totalPages <= 7', () => {
    const pages = generatePagination({ page: 3, totalPages: 5 })
    expect(pages).toEqual([1, 2, 3, 4, 5])
  })

  test('shows right ellipsis when on early page', () => {
    const pages = generatePagination({ page: 2, totalPages: 10 })
    expect(pages).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 10])
  })

  test('shows left ellipsis when on late page', () => {
    const pages = generatePagination({ page: 9, totalPages: 10 })
    expect(pages).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10])
  })

  test('shows both ellipses when in middle page', () => {
    const pages = generatePagination({ page: 10, totalPages: 20 })
    expect(pages).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20])
  })
})

describe('Pagination component', () => {
  test('renders navigation landmark and forwards ref', () => {
    const ref = React.createRef<HTMLElement>()
    render(
      <Pagination
        ref={ref}
        page={1}
        totalPages={5}
        aria-label="Table Navigation"
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Table Navigation' })
    expect(nav).toBeInTheDocument()
    expect(ref.current).toBe(nav)
  })

  test('marks current page with aria-current="page"', () => {
    render(<Pagination page={3} totalPages={5} />)

    const page3 = screen.getByRole('button', { name: 'Page 3' })
    expect(page3).toHaveAttribute('aria-current', 'page')

    const page2 = screen.getByRole('button', { name: 'Page 2' })
    expect(page2).not.toHaveAttribute('aria-current')
  })

  test('disables previous button on first page and next button on last page', () => {
    const { rerender } = render(<Pagination page={1} totalPages={5} />)

    const prevBtn = screen.getByRole('button', { name: 'Previous page' })
    expect(prevBtn).toBeDisabled()

    const nextBtn = screen.getByRole('button', { name: 'Next page' })
    expect(nextBtn).not.toBeDisabled()

    rerender(<Pagination page={5} totalPages={5} />)
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).not.toBeDisabled()
  })

  test('calls onChange when clicking a page number or prev/next buttons', () => {
    const handleChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onChange={handleChange} />)

    const page4 = screen.getByRole('button', { name: 'Page 4' })
    fireEvent.click(page4)
    expect(handleChange).toHaveBeenCalledWith(4)

    const prevBtn = screen.getByRole('button', { name: 'Previous page' })
    fireEvent.click(prevBtn)
    expect(handleChange).toHaveBeenCalledWith(1)

    const nextBtn = screen.getByRole('button', { name: 'Next page' })
    fireEvent.click(nextBtn)
    expect(handleChange).toHaveBeenCalledWith(3)
  })

  test('works in uncontrolled mode with defaultPage', () => {
    const handleChange = vi.fn()
    render(
      <Pagination defaultPage={1} totalPages={5} onChange={handleChange} />,
    )

    const page2 = screen.getByRole('button', { name: 'Page 2' })
    fireEvent.click(page2)

    expect(handleChange).toHaveBeenCalledWith(2)
    expect(page2).toHaveAttribute('aria-current', 'page')
  })

  test('renders summary and page size selector', () => {
    const handlePageSizeChange = vi.fn()

    render(
      <Pagination
        page={2}
        total={100}
        pageSize={10}
        showSummary
        showPageSize
        onPageSizeChange={handlePageSizeChange}
      />,
    )

    expect(screen.getByText('Showing 11–20 of 100')).toBeInTheDocument()

    const select = screen.getByRole('combobox', { name: 'Rows per page' })
    expect(select).toBeInTheDocument()
    fireEvent.change(select, { target: { value: '20' } })
    expect(handlePageSizeChange).toHaveBeenCalledWith(20)
  })

  test('renders compound structure with ref forwarding', () => {
    const contentRef = React.createRef<HTMLUListElement>()
    const itemRef = React.createRef<HTMLLIElement>()
    const linkRef = React.createRef<HTMLButtonElement>()

    render(
      <Pagination page={2} totalPages={5}>
        <PaginationSummary>Page 2 of 5</PaginationSummary>
        <PaginationContent ref={contentRef}>
          <PaginationItem ref={itemRef}>
            <PaginationPrevious />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink ref={linkRef} page={1} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink page={2} isActive />
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(contentRef.current).toBeInTheDocument()
    expect(itemRef.current).toBeInTheDocument()
    expect(linkRef.current).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  test('renders standalone PaginationPageSize with custom options and ref forwarding', () => {
    const sizeRef = React.createRef<HTMLDivElement>()
    const handleChange = vi.fn()

    render(
      <PaginationPageSize
        ref={sizeRef}
        pageSize={25}
        pageSizeOptions={[25, 50, 75]}
        onChange={handleChange}
        label="Custom Page Size:"
      />,
    )

    expect(sizeRef.current).toBeInTheDocument()
    expect(screen.getByText('Custom Page Size:')).toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: 'Rows per page' })
    expect(select).toHaveValue('25')
  })

  test('applies custom className and style props', () => {
    const { container } = render(
      <Pagination
        page={1}
        totalPages={3}
        className="custom-pagination"
        style={testStyles.custom}
      />,
    )

    expect(container.querySelector('.custom-pagination')).toBeInTheDocument()
  })
})
