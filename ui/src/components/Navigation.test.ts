import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './Link/Link'
import './Breadcrumbs/Breadcrumbs'
import './Breadcrumbs/BreadcrumbItem'
import './Pagination/Pagination'
import './Tabs/Tabs'
import './Tabs/Tab'
import './Tabs/TabPanel'
import type { MoulBreadcrumbItem } from './Breadcrumbs/BreadcrumbItem'
import type { MoulBreadcrumbs } from './Breadcrumbs/Breadcrumbs'
import type { MoulLink } from './Link/Link'
import {
  generatePagination,
  type MoulPagination,
} from './Pagination/Pagination'
import type { MoulTab } from './Tabs/Tab'
import type { MoulTabPanel } from './Tabs/TabPanel'
import type { MoulTabs } from './Tabs/Tabs'

async function awaitNestedUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const children = Array.from(root.querySelectorAll('*'))
  await Promise.all(
    children.map((child) => {
      if ('updateComplete' in child && (child as LitElement).updateComplete) {
        return (child as LitElement).updateComplete
      }
      return Promise.resolve()
    }),
  )
}

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

async function simulatePress(element: HTMLElement): Promise<void> {
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      button: 0,
      bubbles: true,
      cancelable: true,
    }),
  )
  element.dispatchEvent(
    new PointerEvent('pointerup', {
      button: 0,
      bubbles: true,
      cancelable: true,
    }),
  )
  element.click()
  await awaitNestedUpdates(element)
}

async function simulateKey(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {},
): Promise<void> {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  await awaitNestedUpdates(element)
}

describe('Navigation Components (Phase 6)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('MoulLink (`moul-link`)', () => {
    it('NAV-LNK-01: Normal link rendering and press event dispatch', async () => {
      const link = await mount<MoulLink>(
        html`<moul-link href="https://example.com" target="_blank" rel="help">Example Link</moul-link>`,
      )
      expect(link).toBeInstanceOf(HTMLElement)
      expect(link.href).toBe('https://example.com')
      expect(link.target).toBe('_blank')
      expect(link.rel).toBe('help')

      const anchor = link.shadowRoot?.querySelector('a')
      expect(anchor).toBeTruthy()
      expect(anchor?.getAttribute('href')).toBe('https://example.com')
      expect(anchor?.getAttribute('target')).toBe('_blank')
      expect(anchor?.getAttribute('rel')).toBe('help')

      let pressed = false
      link.addEventListener('press', (e: Event) => {
        pressed = true
        const ce = e as CustomEvent<{ originalEvent: Event }>
        ce.detail.originalEvent?.preventDefault()
      })

      await simulatePress(anchor!)
      expect(pressed).toBe(true)
    })

    it('NAV-LNK-02: External link contract', async () => {
      const link = await mount<MoulLink>(
        html`<moul-link href="https://external.com" is-external>External</moul-link>`,
      )
      expect(link.isExternal).toBe(true)

      const anchor = link.shadowRoot?.querySelector('a')
      const rel = anchor?.getAttribute('rel') ?? ''
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')

      const extIcon = link.shadowRoot?.querySelector('[part="external-icon"]')
      expect(extIcon).toBeTruthy()
    })

    it('NAV-LNK-03: In-page button mode when href is empty', async () => {
      const link = await mount<MoulLink>(
        html`<moul-link>Trigger Button</moul-link>`,
      )
      const anchor = link.shadowRoot?.querySelector('a')
      expect(anchor?.getAttribute('role')).toBe('button')
      expect(anchor?.getAttribute('tabindex')).toBe('0')

      let pressCount = 0
      link.addEventListener('press', () => {
        pressCount++
      })

      await simulateKey(anchor!, 'Enter')
      expect(pressCount).toBe(1)

      await simulateKey(anchor!, ' ')
      expect(pressCount).toBe(2)
    })

    it('NAV-LNK-04: Disabled link suppresses activation', async () => {
      const link = await mount<MoulLink>(
        html`<moul-link href="https://example.com" is-disabled>Disabled Link</moul-link>`,
      )
      expect(link.isDisabled).toBe(true)

      let pressed = false
      link.addEventListener('press', () => {
        pressed = true
      })

      const anchor = link.shadowRoot?.querySelector('a')
      await simulatePress(anchor!)
      expect(pressed).toBe(false)
    })
  })

  describe('MoulBreadcrumbs (`moul-breadcrumbs` & `moul-breadcrumb-item`)', () => {
    it('NAV-BRD-01: Semantic breadcrumb navigation structure', async () => {
      const breadcrumbs = await mount<MoulBreadcrumbs>(html`
        <moul-breadcrumbs separator="/">
          <moul-breadcrumb-item href="/home">Home</moul-breadcrumb-item>
          <moul-breadcrumb-item href="/docs">Docs</moul-breadcrumb-item>
          <moul-breadcrumb-item is-current>Components</moul-breadcrumb-item>
        </moul-breadcrumbs>
      `)

      const nav = breadcrumbs.shadowRoot?.querySelector('nav')
      expect(nav).toBeTruthy()
      expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb')

      const ol = nav?.querySelector('ol')
      expect(ol).toBeTruthy()

      const items = Array.from(
        breadcrumbs.querySelectorAll<MoulBreadcrumbItem>(
          'moul-breadcrumb-item',
        ),
      )
      expect(items.length).toBe(3)

      await awaitNestedUpdates(breadcrumbs)

      // First item is a link
      const link0 = items[0].shadowRoot?.querySelector('a')
      expect(link0).toBeTruthy()
      expect(link0?.getAttribute('href')).toBe('/home')

      // Third item is current
      const currentSpan = items[2].shadowRoot?.querySelector(
        '[aria-current="page"]',
      )
      expect(currentSpan).toBeTruthy()
    })
  })

  describe('MoulPagination (`moul-pagination`)', () => {
    it('NAV-PAG-01: generatePagination helper unit tests', () => {
      expect(generatePagination(1, 10, 1)).toEqual([1, 2, '...', 10])
      expect(generatePagination(5, 10, 1)).toEqual([
        1,
        '...',
        4,
        5,
        6,
        '...',
        10,
      ])
      expect(generatePagination(10, 10, 1)).toEqual([1, '...', 9, 10])
      expect(generatePagination(1, 1, 1)).toEqual([1])
    })

    it('NAV-PAG-02: Page change event and prev/next boundary conditions', async () => {
      const pagination = await mount<MoulPagination>(html`
        <moul-pagination total-pages="5" current-page="1"></moul-pagination>
      `)

      expect(pagination.currentPage).toBe(1)
      expect(pagination.totalPages).toBe(5)

      const prevBtn =
        pagination.shadowRoot?.querySelector<HTMLButtonElement>(
          '[part~="prev"]',
        )
      const nextBtn =
        pagination.shadowRoot?.querySelector<HTMLButtonElement>(
          '[part~="next"]',
        )
      expect(prevBtn?.disabled).toBe(true)
      expect(nextBtn?.disabled).toBe(false)

      let selectedPage = -1
      pagination.addEventListener('pagechange', (e: Event) => {
        selectedPage = (e as CustomEvent<{ page: number }>).detail.page
      })

      // Click next button
      nextBtn?.click()
      await awaitNestedUpdates(pagination)
      expect(selectedPage).toBe(2)
      expect(pagination.currentPage).toBe(2)

      // Prev button is now enabled
      expect(prevBtn?.disabled).toBe(false)

      // Click page 4 button
      const page4Btn = pagination.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[aria-label="Page 4"]',
      )
      expect(page4Btn).toBeTruthy()
      page4Btn?.click()
      await awaitNestedUpdates(pagination)
      expect(selectedPage).toBe(4)
      expect(pagination.currentPage).toBe(4)

      // Navigate to last page
      nextBtn?.click()
      await awaitNestedUpdates(pagination)
      expect(pagination.currentPage).toBe(5)
      expect(nextBtn?.disabled).toBe(true)
    })
  })

  describe('MoulTabs (`moul-tabs`, `moul-tab`, `moul-tab-panel`)', () => {
    it('NAV-TAB-01: Tablist and panel synchronization', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab1">
          <moul-tab key="tab1">Overview</moul-tab>
          <moul-tab key="tab2">Settings</moul-tab>
          <moul-tab-panel key="tab1">Overview Content</moul-tab-panel>
          <moul-tab-panel key="tab2">Settings Content</moul-tab-panel>
        </moul-tabs>
      `)

      expect(tabs.getAttribute('role')).toBe('tablist')

      const tabEls = Array.from(tabs.querySelectorAll<MoulTab>('moul-tab'))
      const panelEls = Array.from(
        tabs.querySelectorAll<MoulTabPanel>('moul-tab-panel'),
      )

      expect(tabEls[0].getAttribute('role')).toBe('tab')
      expect(tabEls[0].getAttribute('aria-selected')).toBe('true')
      expect(tabEls[0].getAttribute('tabindex')).toBe('0')

      expect(tabEls[1].getAttribute('aria-selected')).toBe('false')
      expect(tabEls[1].getAttribute('tabindex')).toBe('-1')

      expect(panelEls[0].getAttribute('role')).toBe('tabpanel')
      expect(panelEls[0].hasAttribute('hidden')).toBe(false)
      expect(panelEls[1].hasAttribute('hidden')).toBe(true)
    })

    it('NAV-TAB-02: Arrow roving focus and selectionchange event', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab1">
          <moul-tab key="tab1">Tab 1</moul-tab>
          <moul-tab key="tab2">Tab 2</moul-tab>
          <moul-tab key="tab3">Tab 3</moul-tab>
          <moul-tab-panel key="tab1">Content 1</moul-tab-panel>
          <moul-tab-panel key="tab2">Content 2</moul-tab-panel>
          <moul-tab-panel key="tab3">Content 3</moul-tab-panel>
        </moul-tabs>
      `)

      let changeKey = ''
      tabs.addEventListener('selectionchange', (e: Event) => {
        changeKey = (e as CustomEvent<{ selectedKey: string }>).detail
          .selectedKey
      })

      // ArrowRight advances to Tab 2
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab2')
      expect(changeKey).toBe('tab2')

      // ArrowRight advances to Tab 3
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab3')

      // ArrowRight wraps to Tab 1
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab1')

      // ArrowLeft wraps to Tab 3
      await simulateKey(tabs, 'ArrowLeft')
      expect(tabs.selectedKey).toBe('tab3')
    })

    it('NAV-TAB-03: Disabled tab is skipped during arrow navigation', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab1">
          <moul-tab key="tab1">Tab 1</moul-tab>
          <moul-tab key="tab2" is-disabled>Tab 2 Disabled</moul-tab>
          <moul-tab key="tab3">Tab 3</moul-tab>
          <moul-tab-panel key="tab1">Content 1</moul-tab-panel>
          <moul-tab-panel key="tab2">Content 2</moul-tab-panel>
          <moul-tab-panel key="tab3">Content 3</moul-tab-panel>
        </moul-tabs>
      `)

      expect(tabs.selectedKey).toBe('tab1')

      // ArrowRight should skip tab2 and move directly to tab3
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab3')
    })
  })
})
