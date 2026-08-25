import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test } from 'vitest'
import {
  BreadcrumbItem,
  Breadcrumbs,
  Link,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TabPanel,
  TabPanels,
  Tabs,
} from '../index'

const testStyles = stylex.create({
  tabs: {
    marginBlockStart: '10px',
  },
})

describe('Tabs Component Suite', () => {
  test('renders tabs and panels with correct role, TabPanels, and ref forwarding', () => {
    const tabsRef = React.createRef<HTMLDivElement>()
    const tabListRef = React.createRef<HTMLDivElement>()
    const tabRef = React.createRef<HTMLDivElement>()
    const panelsRef = React.createRef<HTMLDivElement>()
    const panelRef = React.createRef<HTMLDivElement>()

    render(
      <Tabs ref={tabsRef}>
        <TabList ref={tabListRef} aria-label="Test Tabs">
          <Tab id="t1" ref={tabRef}>
            Tab 1
          </Tab>
          <Tab id="t2">Tab 2</Tab>
        </TabList>
        <TabPanels ref={panelsRef}>
          <TabPanel id="t1" ref={panelRef}>
            Content 1
          </TabPanel>
          <TabPanel id="t2">Content 2</TabPanel>
        </TabPanels>
      </Tabs>,
    )

    expect(tabsRef.current).toBeInTheDocument()
    expect(tabListRef.current).toBeInTheDocument()
    expect(tabRef.current).toBeInTheDocument()
    expect(panelsRef.current).toBeInTheDocument()
    expect(panelRef.current).toBeInTheDocument()

    const tabList = screen.getByRole('tablist')
    expect(tabList).toBeInTheDocument()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveTextContent('Content 1')
  })

  test('supports keyboard navigation and focus management with TabPanels', () => {
    render(
      <Tabs>
        <TabList aria-label="Keyboard Tabs">
          <Tab id="t1">Tab 1</Tab>
          <Tab id="t2">Tab 2</Tab>
          <Tab id="t3">Tab 3</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="t1">Content 1</TabPanel>
          <TabPanel id="t2">Content 2</TabPanel>
          <TabPanel id="t3">Content 3</TabPanel>
        </TabPanels>
      </Tabs>,
    )

    const tab1 = screen.getByText('Tab 1')
    const tab2 = screen.getByText('Tab 2')

    tab1.focus()
    expect(tab1).toHaveAttribute('aria-selected', 'true')

    // ArrowRight to move to Tab 2
    fireEvent.keyDown(tab1, { key: 'ArrowRight' })
    expect(tab2).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content 2')
  })

  test('applies custom classNames and styles to TabPanels', () => {
    const { container } = render(
      <Tabs className="custom-tabs" style={testStyles.tabs}>
        <TabList className="custom-tablist">
          <Tab id="t1" className="custom-tab">
            Tab 1
          </Tab>
        </TabList>
        <TabPanels className="custom-panels">
          <TabPanel id="t1" className="custom-panel">
            Content 1
          </TabPanel>
        </TabPanels>
      </Tabs>,
    )

    const tabsElement = container.querySelector('.custom-tabs')
    expect(tabsElement).toBeInTheDocument()

    expect(container.querySelector('.custom-tablist')).toBeInTheDocument()
    expect(container.querySelector('.custom-tab')).toBeInTheDocument()
    expect(container.querySelector('.custom-panels')).toBeInTheDocument()
    expect(container.querySelector('.custom-panel')).toBeInTheDocument()
  })

  test('supports vertical orientation and variants', () => {
    const { container } = render(
      <Tabs orientation="vertical" variant="tertiary">
        <TabList aria-label="Vertical Tabs">
          <Tab id="t1">Tab 1</Tab>
          <Tab id="t2">Tab 2</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="t1">Content 1</TabPanel>
          <TabPanel id="t2">Content 2</TabPanel>
        </TabPanels>
      </Tabs>,
    )

    const tablist = screen.getByRole('tablist')
    expect(tablist).toHaveAttribute('aria-orientation', 'vertical')

    // The selection indicator will be rendered inside Tab
    const selectionIndicator = container.querySelector(
      '.react-aria-SelectionIndicator',
    )
    expect(selectionIndicator).toBeInTheDocument()
  })
})

describe('Breadcrumbs Component Suite', () => {
  test('renders navigation landmark and forwards refs', () => {
    const navRef = React.createRef<HTMLOListElement>()
    const itemRef = React.createRef<HTMLLIElement>()

    render(
      <Breadcrumbs ref={navRef} aria-label="System Path">
        <BreadcrumbItem ref={itemRef}>Home</BreadcrumbItem>
        <BreadcrumbItem>Docs</BreadcrumbItem>
        <BreadcrumbItem>Guide</BreadcrumbItem>
      </Breadcrumbs>,
    )

    const navElement = screen.getByRole('navigation', { name: 'System Path' })
    expect(navElement).toBeInTheDocument()
    expect(navRef.current).toBeInTheDocument()
    expect(itemRef.current).toBeInTheDocument()

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  test('assigns aria-current="page" to the last current element', () => {
    render(
      <Breadcrumbs>
        <BreadcrumbItem>
          <Link href="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Link href="/docs">Docs</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <Link href="/docs/guide">Guide</Link>
        </BreadcrumbItem>
      </Breadcrumbs>,
    )

    const currentItem = screen.getByRole('link', { name: 'Guide' })
    expect(currentItem).toHaveAttribute('aria-current', 'page')
  })

  test('applies custom styling and passes through class names', () => {
    const { container } = render(
      <Breadcrumbs className="custom-breadcrumbs">
        <BreadcrumbItem className="custom-crumb">Home</BreadcrumbItem>
      </Breadcrumbs>,
    )

    expect(container.querySelector('.custom-breadcrumbs')).toBeInTheDocument()
    expect(container.querySelector('.custom-crumb')).toBeInTheDocument()
  })
})

describe('Table Component Suite', () => {
  test('renders structured semantic table with appropriate elements and refs', () => {
    const tableRef = React.createRef<HTMLTableElement>()
    const headerRef = React.createRef<HTMLTableSectionElement>()
    const colRef = React.createRef<HTMLTableCellElement>()
    const bodyRef = React.createRef<HTMLTableSectionElement>()
    const rowRef = React.createRef<HTMLTableRowElement>()
    const cellRef = React.createRef<HTMLTableCellElement>()

    render(
      <Table ref={tableRef} aria-label="Inventory">
        <TableHeader ref={headerRef}>
          <TableRow>
            <TableHead ref={colRef}>Name</TableHead>
            <TableHead>Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={bodyRef}>
          <TableRow ref={rowRef}>
            <TableCell ref={cellRef}>Apples</TableCell>
            <TableCell>10</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Oranges</TableCell>
            <TableCell>5</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(tableRef.current).toBeInTheDocument()
    expect(headerRef.current).toBeInTheDocument()
    expect(colRef.current).toBeInTheDocument()
    expect(bodyRef.current).toBeInTheDocument()
    expect(rowRef.current).toBeInTheDocument()
    expect(cellRef.current).toBeInTheDocument()

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(3) // 1 header row + 2 data rows

    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(4) // 2 rows * 2 cells
  })

  test('handles selected row state', () => {
    render(
      <Table aria-label="Selectable Inventory">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>Apples</TableCell>
            <TableCell>10</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    const firstCell = screen.getByText('Apples')
    expect(firstCell.closest('tr')).toHaveAttribute('aria-selected', 'true')
  })
})
