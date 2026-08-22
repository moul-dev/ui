import { render } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test } from 'vitest'
import { Cell, Column, Row, Table, TableBody, TableHeader } from '../../index'

describe('Table component suite', () => {
  test('renders basic table structure and forwards ref', () => {
    const tableRef = React.createRef<HTMLTableElement>()
    const { getByRole, getByText } = render(
      <Table ref={tableRef} aria-label="Users">
        <TableHeader>
          <Column isRowHeader>Name</Column>
          <Column>Role</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Alice</Cell>
            <Cell>Admin</Cell>
          </Row>
          <Row>
            <Cell>Bob</Cell>
            <Cell>Member</Cell>
          </Row>
        </TableBody>
      </Table>,
    )

    expect(getByRole('grid')).toBeInTheDocument()
    expect(tableRef.current).toBeInTheDocument()
    expect(getByText('Alice')).toBeInTheDocument()
    expect(getByText('Bob')).toBeInTheDocument()
  })

  test('renders sticky header when stickyHeader prop is set', () => {
    const { getByRole, getAllByRole } = render(
      <Table aria-label="Sticky Table" stickyHeader>
        <TableHeader>
          <Column>Header 1</Column>
          <Column>Header 2</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Data 1</Cell>
            <Cell>Data 2</Cell>
          </Row>
        </TableBody>
      </Table>,
    )

    expect(getByRole('grid')).toBeInTheDocument()
    expect(getAllByRole('rowgroup').length).toBe(2)
  })

  test('renders sort indicators when Column allowsSorting is true', () => {
    const { container, getByText } = render(
      <Table
        aria-label="Sortable Table"
        sortDescriptor={{ column: 'name', direction: 'ascending' }}
      >
        <TableHeader>
          <Column id="name" allowsSorting>
            Name
          </Column>
          <Column id="role" allowsSorting>
            Role
          </Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Alice</Cell>
            <Cell>Admin</Cell>
          </Row>
        </TableBody>
      </Table>,
    )

    expect(getByText('Name')).toBeInTheDocument()
    const sortIcons = container.querySelectorAll('th svg')
    expect(sortIcons.length).toBeGreaterThan(0)
  })

  test('renders loading state slot when isLoading is true', () => {
    const { getByText, getByRole } = render(
      <Table aria-label="Loading Table" isLoading>
        <TableHeader>
          <Column>Name</Column>
          <Column>Role</Column>
        </TableHeader>
        <TableBody items={[]}>
          {() => (
            <Row>
              <Cell>Placeholder</Cell>
            </Row>
          )}
        </TableBody>
      </Table>,
    )

    expect(getByRole('grid')).toBeInTheDocument()
    expect(getByText('Loading data...')).toBeInTheDocument()
  })

  test('renders custom loadingState slot when provided', () => {
    const { getByText } = render(
      <Table
        aria-label="Custom Loading Table"
        isLoading
        loadingState={<div>Fetching records from cloud...</div>}
      >
        <TableHeader>
          <Column>Name</Column>
        </TableHeader>
        <TableBody items={[]}>
          {() => (
            <Row>
              <Cell>Placeholder</Cell>
            </Row>
          )}
        </TableBody>
      </Table>,
    )

    expect(getByText('Fetching records from cloud...')).toBeInTheDocument()
  })

  test('renders emptyState slot when items collection is empty', () => {
    const { getByText } = render(
      <Table
        aria-label="Empty Table"
        emptyState={<div>No records found in database.</div>}
      >
        <TableHeader>
          <Column>Name</Column>
          <Column>Role</Column>
        </TableHeader>
        <TableBody items={[]}>
          {() => (
            <Row>
              <Cell>Placeholder</Cell>
            </Row>
          )}
        </TableBody>
      </Table>,
    )

    expect(getByText('No records found in database.')).toBeInTheDocument()
  })
})
