import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineElement } from '../../utils/define-element'
import type { MoulTooltip } from '../Tooltip/Tooltip'
import {
  MoulSidebar,
  MoulSidebarAside,
  MoulSidebarBrand,
  MoulSidebarDivider,
  MoulSidebarFooter,
  MoulSidebarGroup,
  MoulSidebarHeader,
  MoulSidebarItem,
  MoulSidebarMain,
  MoulSidebarUser,
  Sidebar,
  SidebarAside,
  SidebarBrand,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  SidebarUser,
  useSidebar,
} from './index'
import { sidebarContext } from './Sidebar.context'

async function awaitTreeUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const descendants = Array.from(root.querySelectorAll('*'))
  for (const el of descendants) {
    if ('updateComplete' in el && (el as LitElement).updateComplete) {
      await (el as LitElement).updateComplete
    }
    const shadowDescendants = Array.from(
      el.shadowRoot?.querySelectorAll('*') ?? [],
    )
    for (const s of shadowDescendants) {
      if ('updateComplete' in s && (s as LitElement).updateComplete) {
        await (s as LitElement).updateComplete
      }
    }
  }
}

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitTreeUpdates(element)
  return element
}

describe('Milestone 2: 10-Element Sidebar Compound Element Suite', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('Registration & Public Exports', () => {
    it('defines all 10 custom elements in customElements registry', () => {
      const tags = [
        'moul-sidebar',
        'moul-sidebar-aside',
        'moul-sidebar-main',
        'moul-sidebar-header',
        'moul-sidebar-brand',
        'moul-sidebar-group',
        'moul-sidebar-item',
        'moul-sidebar-divider',
        'moul-sidebar-footer',
        'moul-sidebar-user',
      ]

      for (const tag of tags) {
        expect(customElements.get(tag)).toBeDefined()
      }
    })

    it('exports all 10 component classes and aliases cleanly', () => {
      expect(MoulSidebar).toBe(Sidebar)
      expect(MoulSidebarAside).toBe(SidebarAside)
      expect(MoulSidebarMain).toBe(SidebarMain)
      expect(MoulSidebarHeader).toBe(SidebarHeader)
      expect(MoulSidebarBrand).toBe(SidebarBrand)
      expect(MoulSidebarGroup).toBe(SidebarGroup)
      expect(MoulSidebarItem).toBe(SidebarItem)
      expect(MoulSidebarDivider).toBe(SidebarDivider)
      expect(MoulSidebarFooter).toBe(SidebarFooter)
      expect(MoulSidebarUser).toBe(SidebarUser)
      expect(sidebarContext).toBeDefined()
      expect(useSidebar()).toBeUndefined()
    })

    it('supports idempotent element definition without errors', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      defineElement('moul-sidebar', MoulSidebar)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered'),
      )
    })
  })

  describe('Compound Hierarchy & Semantic Landmarks', () => {
    it('renders semantic landmarks: aside, main, header, footer, and divider', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar>
          <moul-sidebar-aside aria-label="Main Navigation">
            <moul-sidebar-header>
              <span>Header Content</span>
            </moul-sidebar-header>
            <moul-sidebar-group label="Workspace">
              <moul-sidebar-item key="dash" href="/dashboard" label="Dashboard"></moul-sidebar-item>
            </moul-sidebar-group>
            <moul-sidebar-divider></moul-sidebar-divider>
            <moul-sidebar-footer>
              <span>Footer Content</span>
            </moul-sidebar-footer>
          </moul-sidebar-aside>
          <moul-sidebar-main>
            <h1>Dashboard Content</h1>
          </moul-sidebar-main>
        </moul-sidebar>
      `)

      const aside = root.querySelector('moul-sidebar-aside')!
      const shadowAside = aside.shadowRoot?.querySelector('aside')
      expect(shadowAside).not.toBeNull()
      expect(shadowAside?.getAttribute('role')).toBe('complementary')
      expect(shadowAside?.getAttribute('aria-label')).toBe('Main Navigation')

      const main = root.querySelector('moul-sidebar-main')!
      const shadowMain = main.shadowRoot?.querySelector('main')
      expect(shadowMain).not.toBeNull()
      expect(shadowMain?.getAttribute('role')).toBe('main')

      const header = root.querySelector('moul-sidebar-header')!
      const shadowHeader = header.shadowRoot?.querySelector('header')
      expect(shadowHeader).not.toBeNull()

      const footer = root.querySelector('moul-sidebar-footer')!
      const shadowFooter = footer.shadowRoot?.querySelector('footer')
      expect(shadowFooter).not.toBeNull()

      const divider = root.querySelector('moul-sidebar-divider')!
      expect(divider.getAttribute('role')).toBe('separator')
      expect(divider.getAttribute('aria-orientation')).toBe('horizontal')
    })
  })

  describe('Context Propagation (@lit/context)', () => {
    it('propagates dense property from moul-sidebar to all descendants', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .dense=${true}>
          <moul-sidebar-aside>
            <moul-sidebar-header></moul-sidebar-header>
            <moul-sidebar-brand title="Acme Inc"></moul-sidebar-brand>
            <moul-sidebar-group label="Core">
              <moul-sidebar-item key="home" label="Home"></moul-sidebar-item>
            </moul-sidebar-group>
            <moul-sidebar-divider></moul-sidebar-divider>
            <moul-sidebar-footer></moul-sidebar-footer>
            <moul-sidebar-user name="Alex"></moul-sidebar-user>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      await awaitTreeUpdates(root)

      const aside = root.querySelector('moul-sidebar-aside')!
      const header = root.querySelector('moul-sidebar-header')!
      const brand = root.querySelector('moul-sidebar-brand')!
      const group = root.querySelector('moul-sidebar-group')!
      const item = root.querySelector('moul-sidebar-item')!
      const divider = root.querySelector('moul-sidebar-divider')!
      const footer = root.querySelector('moul-sidebar-footer')!
      const user = root.querySelector('moul-sidebar-user')!

      expect(aside.dense).toBe(true)
      expect(header.dense).toBe(true)
      expect(brand.dense).toBe(true)
      expect(group.dense).toBe(true)
      expect(item.dense).toBe(true)
      expect(divider.dense).toBe(true)
      expect(footer.dense).toBe(true)
      expect(user.dense).toBe(true)

      // Toggle dense to false dynamically
      root.dense = false
      await awaitTreeUpdates(root)

      expect(aside.dense).toBe(false)
      expect(header.dense).toBe(false)
      expect(brand.dense).toBe(false)
      expect(group.dense).toBe(false)
      expect(item.dense).toBe(false)
      expect(divider.dense).toBe(false)
      expect(footer.dense).toBe(false)
      expect(user.dense).toBe(false)
    })

    it('propagates collapsed property from moul-sidebar to all descendants', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .collapsed=${false}>
          <moul-sidebar-aside>
            <moul-sidebar-header></moul-sidebar-header>
            <moul-sidebar-brand title="Moul UI"></moul-sidebar-brand>
            <moul-sidebar-group label="Navigation">
              <moul-sidebar-item key="feed" label="Feed"></moul-sidebar-item>
            </moul-sidebar-group>
            <moul-sidebar-user name="Jane Doe" email="jane@example.com"></moul-sidebar-user>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const aside = root.querySelector('moul-sidebar-aside')!
      const brand = root.querySelector('moul-sidebar-brand')!
      const item = root.querySelector('moul-sidebar-item')!
      const user = root.querySelector('moul-sidebar-user')!

      expect(aside.collapsed).toBe(false)
      expect(brand.collapsed).toBe(false)
      expect(item.collapsed).toBe(false)
      expect(user.collapsed).toBe(false)

      // Toggle collapsed to true
      root.collapsed = true
      await awaitTreeUpdates(root)

      expect(aside.collapsed).toBe(true)
      expect(brand.collapsed).toBe(true)
      expect(item.collapsed).toBe(true)
      expect(user.collapsed).toBe(true)
    })

    it('propagates layout property to aside and main containers', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar layout="main-framed">
          <moul-sidebar-aside></moul-sidebar-aside>
          <moul-sidebar-main></moul-sidebar-main>
        </moul-sidebar>
      `)

      const aside = root.querySelector('moul-sidebar-aside')!
      const main = root.querySelector('moul-sidebar-main')!

      expect(aside.layout).toBe('main-framed')
      expect(main.layout).toBe('main-framed')

      root.layout = 'sidebar-framed'
      await awaitTreeUpdates(root)

      expect(aside.layout).toBe('sidebar-framed')
      expect(main.layout).toBe('sidebar-framed')
    })
  })

  describe('Sidebar Item Selection & Active Indicator', () => {
    it('sets isSelected when item key matches selectedKey', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="settings">
          <moul-sidebar-aside>
            <moul-sidebar-item key="overview" label="Overview"></moul-sidebar-item>
            <moul-sidebar-item key="settings" label="Settings"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const overview = root.querySelector('moul-sidebar-item[key="overview"]')!
      const settings = root.querySelector('moul-sidebar-item[key="settings"]')!

      expect(overview.isSelected).toBe(false)
      expect(settings.isSelected).toBe(true)

      const indicator = settings.shadowRoot?.querySelector('[part="indicator"]')
      expect(indicator).not.toBeNull()
    })

    it('dispatches selectionchange event on moul-sidebar when item is clicked', async () => {
      const selectionSpy = vi.fn()
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="overview">
          <moul-sidebar-aside>
            <moul-sidebar-item key="overview" label="Overview"></moul-sidebar-item>
            <moul-sidebar-item key="billing" label="Billing"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      root.addEventListener('selectionchange', (e: Event) => {
        selectionSpy((e as CustomEvent).detail)
      })

      const billing = root.querySelector('moul-sidebar-item[key="billing"]')!
      const button =
        billing.shadowRoot!.querySelector<HTMLButtonElement>('.item')!
      button.click()

      await awaitTreeUpdates(root)

      expect(selectionSpy).toHaveBeenCalledWith({ selectedKey: 'billing' })
      expect(root.selectedKey).toBe('billing')
      expect(billing.isSelected).toBe(true)
    })

    it('sets aria-current="page" on links and aria-selected on buttons', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="page1">
          <moul-sidebar-aside>
            <moul-sidebar-item key="page1" href="/page1" label="Page 1"></moul-sidebar-item>
            <moul-sidebar-item key="btn1" label="Button 1"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const page1 = root.querySelector('moul-sidebar-item[key="page1"]')!
      const link = page1.shadowRoot!.querySelector<HTMLAnchorElement>('.item')!
      expect(link.getAttribute('aria-current')).toBe('page')

      // Select btn1
      root.selectItem('btn1')
      await awaitTreeUpdates(root)

      const btn1 = root.querySelector('moul-sidebar-item[key="btn1"]')!
      const btn = btn1.shadowRoot!.querySelector<HTMLButtonElement>('.item')!
      expect(btn.getAttribute('aria-selected')).toBe('true')
      expect(link.hasAttribute('aria-current')).toBe(false)
    })

    it('does not select disabled items or dispatch events when clicked', async () => {
      const selectionSpy = vi.fn()
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="active">
          <moul-sidebar-aside>
            <moul-sidebar-item key="active" label="Active"></moul-sidebar-item>
            <moul-sidebar-item key="disabled" is-disabled label="Disabled"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      root.addEventListener('selectionchange', selectionSpy)

      const disabled = root.querySelector('moul-sidebar-item[key="disabled"]')!
      const button =
        disabled.shadowRoot!.querySelector<HTMLButtonElement>('.item')!
      button.click()

      await awaitTreeUpdates(root)

      expect(selectionSpy).not.toHaveBeenCalled()
      expect(root.selectedKey).toBe('active')
      expect(disabled.isSelected).toBe(false)
    })
  })

  describe('Pure CSS Grid Group Collapse', () => {
    it('renders collapsible group with pure CSS grid structure', async () => {
      const group = await mount<MoulSidebarGroup>(html`
        <moul-sidebar-group label="Settings" collapsible>
          <moul-sidebar-item key="profile" label="Profile"></moul-sidebar-item>
          <moul-sidebar-item key="security" label="Security"></moul-sidebar-item>
        </moul-sidebar-group>
      `)

      const header = group.shadowRoot!.querySelector('.group-header')!
      expect(header.getAttribute('aria-expanded')).toBe('true')

      const items = group.shadowRoot!.querySelector('.group-items')!
      expect(items.classList.contains('expanded')).toBe(true)

      const chevron = group.shadowRoot?.querySelector('.chevron')
      expect(chevron).not.toBeNull()
    })

    it('toggles collapse on header click and dispatches collapsechange', async () => {
      const collapseSpy = vi.fn()
      const group = await mount<MoulSidebarGroup>(html`
        <moul-sidebar-group label="Settings" collapsible>
          <moul-sidebar-item key="profile" label="Profile"></moul-sidebar-item>
        </moul-sidebar-group>
      `)

      group.addEventListener('collapsechange', (e: Event) => {
        collapseSpy((e as CustomEvent).detail)
      })

      const header =
        group.shadowRoot!.querySelector<HTMLButtonElement>('.group-header')!
      header.click()

      await awaitTreeUpdates(group)

      expect(collapseSpy).toHaveBeenCalledWith({ collapsed: true })
      expect(group.collapsed).toBe(true)
      expect(header.getAttribute('aria-expanded')).toBe('false')

      const items = group.shadowRoot!.querySelector('.group-items')!
      expect(items.classList.contains('collapsed')).toBe(true)

      // Click again to expand
      header.click()
      await awaitTreeUpdates(group)

      expect(collapseSpy).toHaveBeenCalledWith({ collapsed: false })
      expect(group.collapsed).toBe(false)
      expect(header.getAttribute('aria-expanded')).toBe('true')
    })

    it('handles keyboard toggle via Enter and Space keys', async () => {
      const group = await mount<MoulSidebarGroup>(html`
        <moul-sidebar-group label="Projects" collapsible>
          <moul-sidebar-item key="p1" label="Project 1"></moul-sidebar-item>
        </moul-sidebar-group>
      `)

      const header =
        group.shadowRoot!.querySelector<HTMLButtonElement>('.group-header')!

      // Press Enter to collapse
      header.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
      )
      await awaitTreeUpdates(group)
      expect(group.collapsed).toBe(true)

      // Press Space to expand
      header.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', cancelable: true }),
      )
      await awaitTreeUpdates(group)
      expect(group.collapsed).toBe(false)
    })

    it('does not render toggle chevron or collapse when collapsible is false', async () => {
      const group = await mount<MoulSidebarGroup>(html`
        <moul-sidebar-group label="Static Section" .collapsible=${false}>
          <moul-sidebar-item key="item" label="Item"></moul-sidebar-item>
        </moul-sidebar-group>
      `)

      const chevron = group.shadowRoot?.querySelector('.chevron')
      expect(chevron).toBeNull()

      group.toggleCollapse()
      expect(group.collapsed).toBe(false)
    })
  })

  describe('Collapsed Icon-Only Tooltip Mode', () => {
    it('wraps moul-sidebar-item in moul-tooltip when sidebar is collapsed', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .collapsed=${true}>
          <moul-sidebar-aside>
            <moul-sidebar-item key="analytics" label="Analytics"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const item = root.querySelector('moul-sidebar-item[key="analytics"]')!
      const tooltip =
        item.shadowRoot?.querySelector<MoulTooltip>('moul-tooltip')
      expect(tooltip).not.toBeNull()
      expect(tooltip?.content).toBe('Analytics')
      expect(tooltip?.placement).toBe('right')

      // Uncollapse
      root.collapsed = false
      await awaitTreeUpdates(root)

      const uncollapsedTooltip = item.shadowRoot?.querySelector('moul-tooltip')
      expect(uncollapsedTooltip).toBeNull()
    })

    it('wraps moul-sidebar-user in moul-tooltip when collapsed', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .collapsed=${true}>
          <moul-sidebar-aside>
            <moul-sidebar-user name="Phearak S." email="phearak@moul.dev"></moul-sidebar-user>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const user = root.querySelector('moul-sidebar-user')!
      const tooltip =
        user.shadowRoot?.querySelector<MoulTooltip>('moul-tooltip')
      expect(tooltip).not.toBeNull()
      expect(tooltip?.content).toBe('Phearak S. • phearak@moul.dev')
    })
  })

  describe('Aside Collapse Toggle Affordance', () => {
    it('renders collapse toggle button in aside when show-collapse-toggle is set', async () => {
      const collapseSpy = vi.fn()
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar>
          <moul-sidebar-aside show-collapse-toggle></moul-sidebar-aside>
        </moul-sidebar>
      `)

      root.addEventListener('collapsechange', (e: Event) => {
        collapseSpy((e as CustomEvent).detail)
      })

      const aside = root.querySelector('moul-sidebar-aside')!
      const toggleBtn =
        aside.shadowRoot!.querySelector<HTMLButtonElement>('.toggle-button')!
      expect(toggleBtn).not.toBeNull()
      expect(toggleBtn.getAttribute('aria-label')).toBe('Collapse sidebar')

      toggleBtn.click()
      await awaitTreeUpdates(root)

      expect(collapseSpy).toHaveBeenCalledWith({ collapsed: true })
      expect(root.collapsed).toBe(true)
      expect(aside.collapsed).toBe(true)
      expect(toggleBtn.getAttribute('aria-label')).toBe('Expand sidebar')
    })
  })

  describe('Brand & User Presentation', () => {
    it('renders brand logo, title, and subtitle, hiding text when collapsed', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .collapsed=${false}>
          <moul-sidebar-aside>
            <moul-sidebar-brand
              logo="https://example.com/logo.png"
              title="Moul UI"
              subtitle="v2026.10"
            ></moul-sidebar-brand>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const brand = root.querySelector('moul-sidebar-brand')!
      const title = brand.shadowRoot?.querySelector('.brand-title')
      const subtitle = brand.shadowRoot?.querySelector('.brand-subtitle')
      expect(title?.textContent?.trim()).toBe('Moul UI')
      expect(subtitle?.textContent?.trim()).toBe('v2026.10')

      root.collapsed = true
      await awaitTreeUpdates(root)

      expect(brand.collapsed).toBe(true)
    })

    it('renders user details and avatar, hiding text when collapsed', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar .collapsed=${false}>
          <moul-sidebar-aside>
            <moul-sidebar-user
              name="Sarah Connor"
              email="sarah@resistance.org"
            ></moul-sidebar-user>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const user = root.querySelector('moul-sidebar-user')!
      const userName = user.shadowRoot?.querySelector('.user-name')
      const userEmail = user.shadowRoot?.querySelector('.user-email')
      expect(userName?.textContent?.trim()).toBe('Sarah Connor')
      expect(userEmail?.textContent?.trim()).toBe('sarah@resistance.org')

      root.collapsed = true
      await awaitTreeUpdates(root)

      expect(user.collapsed).toBe(true)
      const hiddenUserInfo = user.shadowRoot?.querySelector('.user-info')
      expect(hiddenUserInfo).toBeNull()
    })

    it('supports user description alias, custom avatar slot, and action slot', async () => {
      const user = await mount<MoulSidebarUser>(html`
        <moul-sidebar-user name="Alex River">
          <div slot="avatar" id="my-avatar">AR</div>
          <button slot="action" id="my-action">Logout</button>
        </moul-sidebar-user>
      `)

      expect(user.description).toBe('')
      user.description = 'System Administrator'
      expect(user.email).toBe('System Administrator')

      const avatarSlot = user.shadowRoot?.querySelector('slot[name="avatar"]')
      expect(avatarSlot).not.toBeNull()

      const actionSlot = user.shadowRoot?.querySelector('slot[name="action"]')
      expect(actionSlot).not.toBeNull()
    })

    it('supports brand href link and title property getter/setter on group', async () => {
      const brand = await mount<MoulSidebarBrand>(html`
        <moul-sidebar-brand href="/dashboard" title="Admin Portal"></moul-sidebar-brand>
      `)

      const link =
        brand.shadowRoot?.querySelector<HTMLAnchorElement>('a.brand-link')
      expect(link).not.toBeNull()
      expect(link?.getAttribute('href')).toBe('/dashboard')

      const group = await mount<MoulSidebarGroup>(html`
        <moul-sidebar-group></moul-sidebar-group>
      `)

      group.title = 'Settings & Tools'
      expect(group.label).toBe('Settings & Tools')
      expect(group.title).toBe('Settings & Tools')
    })

    it('renders item badge and handles id attribute fallback for selection', async () => {
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="inbox">
          <moul-sidebar-aside>
            <moul-sidebar-item id="inbox" label="Inbox" badge="12"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      const item = root.querySelector('moul-sidebar-item[id="inbox"]')!
      expect(item.isSelected).toBe(true)

      const badge = item.shadowRoot?.querySelector('[part="badge"]')
      expect(badge?.textContent?.trim()).toBe('12')
    })

    it('returns early when selectItem is called with the current key', async () => {
      const selectionSpy = vi.fn()
      const root = await mount<MoulSidebar>(html`
        <moul-sidebar selected-key="home">
          <moul-sidebar-aside>
            <moul-sidebar-item key="home" label="Home"></moul-sidebar-item>
          </moul-sidebar-aside>
        </moul-sidebar>
      `)

      root.addEventListener('selectionchange', selectionSpy)
      root.selectItem('home')
      expect(selectionSpy).not.toHaveBeenCalled()
    })

    it('toggleCollapse on MoulSidebar dispatches collapsechange', async () => {
      const collapseSpy = vi.fn()
      const root = await mount<MoulSidebar>(html`<moul-sidebar></moul-sidebar>`)

      root.addEventListener('collapsechange', (e: Event) => {
        collapseSpy((e as CustomEvent).detail)
      })

      root.toggleCollapse()
      expect(collapseSpy).toHaveBeenCalledWith({ collapsed: true })
      expect(root.collapsed).toBe(true)

      root.toggleCollapse()
      expect(collapseSpy).toHaveBeenCalledWith({ collapsed: false })
      expect(root.collapsed).toBe(false)
    })
  })
})
