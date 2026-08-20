import * as stylex from '@stylexjs/stylex'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, test, vi } from 'vitest'
import {
  Sidebar,
  SidebarAside,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  useSidebar,
} from './Sidebar'

const testStyles = stylex.create({
  custom: {
    padding: '12px',
  },
})

describe('Sidebar Component Suite', () => {
  test('renders semantic aside landmark and children correctly', () => {
    const asideRef = React.createRef<HTMLElement>()

    render(
      <Sidebar>
        <SidebarAside ref={asideRef} aria-label="Main Navigation">
          <SidebarHeader>
            <span>App Header</span>
          </SidebarHeader>
          <SidebarGroup title="General">
            <SidebarItem id="home" href="/home">
              Home
            </SidebarItem>
          </SidebarGroup>
          <SidebarDivider />
          <SidebarFooter>
            <span>User Profile</span>
          </SidebarFooter>
        </SidebarAside>
        <SidebarMain>
          <div>Main Dashboard</div>
        </SidebarMain>
      </Sidebar>,
    )

    const aside = screen.getByRole('complementary', { name: 'Main Navigation' })
    expect(aside).toBeInTheDocument()
    expect(asideRef.current).toBe(aside)
    expect(screen.getByText('App Header')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('User Profile')).toBeInTheDocument()
    expect(screen.getByText('Main Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    )
  })

  test('manages selection state correctly in uncontrolled and controlled modes', () => {
    const onSelectionChange = vi.fn()

    const { rerender } = render(
      <Sidebar defaultSelectedKey="dash" onSelectionChange={onSelectionChange}>
        <SidebarAside>
          <SidebarGroup>
            <SidebarItem id="dash" href="/dash">
              Dashboard
            </SidebarItem>
            <SidebarItem id="settings" href="/settings">
              Settings
            </SidebarItem>
            <SidebarItem id="" href="/empty">
              Empty ID
            </SidebarItem>
          </SidebarGroup>
        </SidebarAside>
      </Sidebar>,
    )

    const dashItem = screen.getByText('Dashboard').closest('a')
    const settingsItem = screen.getByText('Settings').closest('a')
    const emptyItem = screen.getByText('Empty ID').closest('a')

    expect(dashItem).toHaveAttribute('aria-current', 'page')
    expect(settingsItem).not.toHaveAttribute('aria-current')
    expect(emptyItem).not.toHaveAttribute('aria-current')

    // Click settings item
    if (settingsItem) {
      fireEvent.click(settingsItem)
    }
    expect(onSelectionChange).toHaveBeenCalledWith('settings')

    // Controlled mode test
    rerender(
      <Sidebar selectedKey="settings">
        <SidebarAside>
          <SidebarGroup>
            <SidebarItem id="dash" href="/dash">
              Dashboard
            </SidebarItem>
            <SidebarItem id="settings" href="/settings">
              Settings
            </SidebarItem>
          </SidebarGroup>
        </SidebarAside>
      </Sidebar>,
    )

    expect(dashItem).not.toHaveAttribute('aria-current')
    expect(settingsItem).toHaveAttribute('aria-current', 'page')
  })

  test('handles group collapse and keyboard interactions via Enter and Space', () => {
    render(
      <Sidebar>
        <SidebarAside>
          <SidebarGroup title="Projects" collapsible defaultExpanded={true}>
            <SidebarItem id="p1">Project 1</SidebarItem>
            <SidebarItem id="p2">Project 2</SidebarItem>
          </SidebarGroup>
        </SidebarAside>
      </Sidebar>,
    )

    const toggleButton = screen.getByRole('button', { name: /projects/i })
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Collapse with Enter key
    fireEvent.keyDown(toggleButton, { key: 'Enter' })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Expand with Space key
    fireEvent.keyDown(toggleButton, { key: ' ' })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    // Click to toggle
    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('supports collapse toggle on Sidebar and SidebarAside', () => {
    const onCollapseChange = vi.fn()

    render(
      <Sidebar
        showCollapseToggle={true}
        defaultCollapsed={false}
        onCollapseChange={onCollapseChange}
      >
        <SidebarAside>
          <SidebarHeader>Header</SidebarHeader>
        </SidebarAside>
      </Sidebar>,
    )

    const collapseBtn = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(collapseBtn).toBeInTheDocument()

    fireEvent.click(collapseBtn)
    expect(onCollapseChange).toHaveBeenCalledWith(true)
  })

  test('allows disabling collapse toggle from top-level Sidebar or SidebarAside prop', () => {
    const { rerender } = render(
      <Sidebar showCollapseToggle={false}>
        <SidebarAside>
          <SidebarHeader>Header</SidebarHeader>
        </SidebarAside>
      </Sidebar>,
    )

    expect(
      screen.queryByRole('button', {
        name: /collapse sidebar|expand sidebar/i,
      }),
    ).not.toBeInTheDocument()

    // Override at SidebarAside level
    rerender(
      <Sidebar showCollapseToggle={false}>
        <SidebarAside showCollapseToggle={true}>
          <SidebarHeader>Header</SidebarHeader>
        </SidebarAside>
      </Sidebar>,
    )

    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toBeInTheDocument()
  })

  test('applies custom classNames and styles to subcomponents', () => {
    const { container } = render(
      <Sidebar className="custom-sidebar" style={{ height: '500px' }}>
        <SidebarAside className="custom-aside">
          <SidebarHeader className="custom-header">Header</SidebarHeader>
          <SidebarGroup className="custom-group" style={testStyles.custom}>
            <SidebarItem id="1" className="custom-item">
              Item
            </SidebarItem>
          </SidebarGroup>
          <SidebarDivider className="custom-divider" />
          <SidebarFooter className="custom-footer">Footer</SidebarFooter>
        </SidebarAside>
        <SidebarMain className="custom-main">Main</SidebarMain>
      </Sidebar>,
    )

    expect(container.querySelector('.custom-sidebar')).toBeInTheDocument()
    expect(container.querySelector('.custom-aside')).toBeInTheDocument()
    expect(container.querySelector('.custom-header')).toBeInTheDocument()
    expect(container.querySelector('.custom-group')).toBeInTheDocument()
    expect(container.querySelector('.custom-item')).toBeInTheDocument()
    expect(container.querySelector('.custom-divider')).toBeInTheDocument()
    expect(container.querySelector('.custom-footer')).toBeInTheDocument()
    expect(container.querySelector('.custom-main')).toBeInTheDocument()
  })

  test('throws an error when useSidebar hook is used outside of Sidebar', () => {
    function Consumer() {
      useSidebar()
      return <div>Consumer</div>
    }

    expect(() => render(<Consumer />)).toThrow(
      'Sidebar components must be rendered within a <Sidebar>',
    )
  })
})
