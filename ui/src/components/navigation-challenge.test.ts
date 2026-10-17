import fc from 'fast-check'
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

describe('Empirical Adversarial Challenge: Navigation Components (Milestone 6)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // 1. MoulTabs Adversarial Stress Testing
  // --------------------------------------------------------------------------
  describe('MoulTabs (`moul-tabs`) Adversarial Stress', () => {
    it('CHALLENGE-TAB-01: Roving tabindex wrapping across 25 tabs under rapid arrow navigation', async () => {
      const tabCount = 25
      const keys = Array.from({ length: tabCount }, (_, i) => `tab-${i}`)

      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab-0">
          ${keys.map((k) => html`<moul-tab key=${k}>Label ${k}</moul-tab>`)}
          ${keys.map((k) => html`<moul-tab-panel key=${k}>Content ${k}</moul-tab-panel>`)}
        </moul-tabs>
      `)

      expect(tabs.selectedKey).toBe('tab-0')
      const tabElements = Array.from(tabs.querySelectorAll<MoulTab>('moul-tab'))
      expect(tabElements.length).toBe(tabCount)

      // Step forward 24 times to reach the end
      for (let i = 1; i < tabCount; i++) {
        await simulateKey(tabs, 'ArrowRight')
        expect(tabs.selectedKey).toBe(`tab-${i}`)
      }

      // Step forward 1 more time -> must wrap around to tab-0
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab-0')

      // Step backward 1 time -> must wrap backward to tab-24
      await simulateKey(tabs, 'ArrowLeft')
      expect(tabs.selectedKey).toBe(`tab-${tabCount - 1}`)

      // Rapid arrow spam: 100 arrow rights
      for (let i = 0; i < 100; i++) {
        tabs.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        )
      }
      await awaitNestedUpdates(tabs)

      // 24 + 100 = 124 % 25 = 24
      expect(tabs.selectedKey).toBe('tab-24')

      // Home & End keys
      await simulateKey(tabs, 'Home')
      expect(tabs.selectedKey).toBe('tab-0')
      expect(tabElements[0].getAttribute('tabindex')).toBe('0')
      expect(tabElements[0].getAttribute('aria-selected')).toBe('true')

      await simulateKey(tabs, 'End')
      expect(tabs.selectedKey).toBe('tab-24')
      expect(tabElements[24].getAttribute('tabindex')).toBe('0')
      expect(tabElements[24].getAttribute('aria-selected')).toBe('true')
    })

    it('CHALLENGE-TAB-02: Skipping multiple consecutive disabled tabs and boundary disabled tabs', async () => {
      // Setup: tab-0 (enabled), tab-1..tab-4 (disabled), tab-5 (enabled), tab-6 (disabled)
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab-0">
          <moul-tab key="tab-0">Tab 0</moul-tab>
          <moul-tab key="tab-1" is-disabled>Tab 1 (disabled)</moul-tab>
          <moul-tab key="tab-2" is-disabled>Tab 2 (disabled)</moul-tab>
          <moul-tab key="tab-3" is-disabled>Tab 3 (disabled)</moul-tab>
          <moul-tab key="tab-4" is-disabled>Tab 4 (disabled)</moul-tab>
          <moul-tab key="tab-5">Tab 5</moul-tab>
          <moul-tab key="tab-6" is-disabled>Tab 6 (disabled)</moul-tab>
          <moul-tab-panel key="tab-0">Panel 0</moul-tab-panel>
          <moul-tab-panel key="tab-5">Panel 5</moul-tab-panel>
        </moul-tabs>
      `)

      expect(tabs.selectedKey).toBe('tab-0')

      // ArrowRight skips tabs 1..4 directly to tab-5
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab-5')

      // ArrowRight from tab-5 skips disabled tab-6 and wraps back to tab-0
      await simulateKey(tabs, 'ArrowRight')
      expect(tabs.selectedKey).toBe('tab-0')

      // ArrowLeft from tab-0 wraps backward skipping tab-6 to land on tab-5
      await simulateKey(tabs, 'ArrowLeft')
      expect(tabs.selectedKey).toBe('tab-5')

      // End key lands on tab-5 (last enabled tab, not tab-6)
      await simulateKey(tabs, 'Home')
      expect(tabs.selectedKey).toBe('tab-0')
      await simulateKey(tabs, 'End')
      expect(tabs.selectedKey).toBe('tab-5')
    })

    it('CHALLENGE-TAB-03: Survives pathological state: all tabs disabled without infinite loop', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab-0">
          <moul-tab key="tab-0" is-disabled>Tab 0</moul-tab>
          <moul-tab key="tab-1" is-disabled>Tab 1</moul-tab>
          <moul-tab key="tab-2" is-disabled>Tab 2</moul-tab>
        </moul-tabs>
      `)

      // Rapidly fire arrow keys and Home/End on all-disabled tablist without throwing
      expect(() => {
        tabs.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        )
        tabs.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
        )
        tabs.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
        )
        tabs.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
        )
      }).not.toThrow()

      // Clicking a disabled tab must not dispatch selectionchange
      let selectionFired = false
      tabs.addEventListener('selectionchange', () => {
        selectionFired = true
      })
      const firstTab = tabs.querySelector('moul-tab')
      firstTab?.click()
      expect(selectionFired).toBe(false)
    })

    it('CHALLENGE-TAB-04: Dynamic tab removal and insertion with slot update', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs selected-key="tab-b">
          <moul-tab key="tab-a">Tab A</moul-tab>
          <moul-tab key="tab-b">Tab B</moul-tab>
          <moul-tab key="tab-c">Tab C</moul-tab>
          <moul-tab-panel key="tab-a">Panel A</moul-tab-panel>
          <moul-tab-panel key="tab-b">Panel B</moul-tab-panel>
          <moul-tab-panel key="tab-c">Panel C</moul-tab-panel>
        </moul-tabs>
      `)

      expect(tabs.selectedKey).toBe('tab-b')

      // Remove currently selected tab-b
      const tabB = tabs.querySelector('moul-tab[key="tab-b"]')
      const panelB = tabs.querySelector('moul-tab-panel[key="tab-b"]')
      tabB?.remove()
      panelB?.remove()

      // Trigger sync
      const slot = tabs.shadowRoot?.querySelector('slot[name="tab"]')
      slot?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(tabs)

      // selectedKey must recover to an existing enabled tab (tab-a)
      expect(tabs.selectedKey).toBe('tab-a')
      const panelA = tabs.querySelector('moul-tab-panel[key="tab-a"]')
      expect(panelA?.hasAttribute('hidden')).toBe(false)

      // Dynamically add a new tab-d
      const newTab = document.createElement('moul-tab') as MoulTab
      newTab.key = 'tab-d'
      newTab.textContent = 'Tab D'
      const newPanel = document.createElement('moul-tab-panel') as MoulTabPanel
      newPanel.key = 'tab-d'
      newPanel.textContent = 'Panel D'

      tabs.appendChild(newTab)
      tabs.appendChild(newPanel)
      slot?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(tabs)

      // End key should now jump to newly inserted tab-d
      await simulateKey(tabs, 'End')
      expect(tabs.selectedKey).toBe('tab-d')
      expect(newPanel.hasAttribute('hidden')).toBe(false)
    })

    it('CHALLENGE-TAB-05: Orientation switching dynamically updates aria-orientation and vertical navigation', async () => {
      const tabs = await mount<MoulTabs>(html`
        <moul-tabs orientation="horizontal" selected-key="tab-1">
          <moul-tab key="tab-1">Tab 1</moul-tab>
          <moul-tab key="tab-2">Tab 2</moul-tab>
          <moul-tab-panel key="tab-1">Panel 1</moul-tab-panel>
          <moul-tab-panel key="tab-2">Panel 2</moul-tab-panel>
        </moul-tabs>
      `)

      expect(tabs.getAttribute('aria-orientation')).toBe('horizontal')

      // Switch to vertical
      tabs.orientation = 'vertical'
      await awaitNestedUpdates(tabs)
      expect(tabs.getAttribute('aria-orientation')).toBe('vertical')

      // ArrowDown advances in vertical orientation
      await simulateKey(tabs, 'ArrowDown')
      expect(tabs.selectedKey).toBe('tab-2')

      // ArrowUp goes backward in vertical orientation
      await simulateKey(tabs, 'ArrowUp')
      expect(tabs.selectedKey).toBe('tab-1')
    })
  })

  // --------------------------------------------------------------------------
  // 2. MoulPagination Boundary Fuzzing & Stress Testing
  // --------------------------------------------------------------------------
  describe('MoulPagination (`moul-pagination`) Fuzzing & Boundaries', () => {
    it('CHALLENGE-PAG-01: Boundary edge cases in generatePagination', () => {
      // totalPages <= 0
      expect(generatePagination(1, 0)).toEqual([1])
      expect(generatePagination(1, -10)).toEqual([1])
      expect(generatePagination(-5, 0)).toEqual([1])

      // totalPages === 1
      expect(generatePagination(1, 1)).toEqual([1])
      expect(generatePagination(10, 1)).toEqual([1])
      expect(generatePagination(-5, 1)).toEqual([1])

      // Current page clamps
      expect(generatePagination(0, 10)).toEqual([1, 2, '...', 10])
      expect(generatePagination(-999, 10)).toEqual([1, 2, '...', 10])
      expect(generatePagination(999, 10)).toEqual([1, '...', 9, 10])

      // Sibling count 0
      expect(
        generatePagination({
          totalPages: 10,
          currentPage: 5,
          siblingCount: 0,
        }),
      ).toEqual([1, '...', 5, '...', 10])

      // Sibling count 2 with 9 total slots (10 > 9, so ellipses appear)
      expect(
        generatePagination({
          totalPages: 10,
          currentPage: 5,
          siblingCount: 2,
        }),
      ).toEqual([1, '...', 3, 4, 5, 6, 7, '...', 10])

      // Sibling count 2 with totalPages within 9 slots (no ellipses)
      expect(
        generatePagination({
          totalPages: 9,
          currentPage: 5,
          siblingCount: 2,
        }),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])

      // Large totals (10,000+)
      const large = generatePagination(5000, 10000, 1)
      expect(large).toEqual([1, '...', 4999, 5000, 5001, '...', 10000])

      const largeAtStart = generatePagination(2, 50000, 1)
      expect(largeAtStart).toEqual([1, 2, 3, '...', 50000])

      const largeAtEnd = generatePagination(49999, 50000, 1)
      expect(largeAtEnd).toEqual([1, '...', 49998, 49999, 50000])
    })

    it('CHALLENGE-PAG-02: Property-based invariant fuzzing via fast-check', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -500, max: 20000 }),
          fc.integer({ min: -500, max: 20000 }),
          fc.integer({ min: 0, max: 4 }),
          (page, total, siblingCount) => {
            const result = generatePagination(page, total, siblingCount)

            // Result must always be a non-empty array
            expect(Array.isArray(result)).toBe(true)
            expect(result.length).toBeGreaterThan(0)

            // Starts at 1
            expect(result[0]).toBe(1)

            // Ends at max(1, total) if total > 0, else 1
            const expectedEnd = total > 0 ? total : 1
            expect(result[result.length - 1]).toBe(expectedEnd)

            // No consecutive ellipses
            for (let i = 0; i < result.length - 1; i++) {
              if (result[i] === '...') {
                expect(result[i + 1]).not.toBe('...')
              }
            }

            // All page numbers within [1, expectedEnd]
            const numericPages = result.filter(
              (x): x is number => typeof x === 'number',
            )
            for (const p of numericPages) {
              expect(p).toBeGreaterThanOrEqual(1)
              expect(p).toBeLessThanOrEqual(expectedEnd)
            }

            // Page numbers must be monotonically strictly increasing
            for (let i = 0; i < numericPages.length - 1; i++) {
              expect(numericPages[i + 1]).toBeGreaterThan(numericPages[i])
            }
          },
        ),
        { numRuns: 300 },
      )
    })

    it('CHALLENGE-PAG-03: Component attribute clamping and rapid page jumps', async () => {
      const pagination = await mount<MoulPagination>(html`
        <moul-pagination total-pages="5" current-page="1"></moul-pagination>
      `)

      let lastFiredPage = -1
      let eventCount = 0
      pagination.addEventListener('pagechange', (e: Event) => {
        eventCount++
        lastFiredPage = (e as CustomEvent<{ page: number }>).detail.page
      })

      // Clicking disabled prev on page 1 does not fire pagechange
      const prevBtn =
        pagination.shadowRoot?.querySelector<HTMLButtonElement>(
          '[part~="prev"]',
        )
      prevBtn?.click()
      await awaitNestedUpdates(pagination)
      expect(eventCount).toBe(0)

      // Attribute clamp: current-page set to 999 is clamped to totalPages (5)
      pagination.currentPage = 999
      await awaitNestedUpdates(pagination)
      expect(pagination.currentPage).toBe(5)

      // Clicking disabled next on last page does not fire pagechange
      const nextBtn =
        pagination.shadowRoot?.querySelector<HTMLButtonElement>(
          '[part~="next"]',
        )
      expect(nextBtn?.disabled).toBe(true)
      nextBtn?.click()
      await awaitNestedUpdates(pagination)
      expect(eventCount).toBe(0)

      // Attribute clamp: negative current-page is clamped to 1
      pagination.currentPage = -50
      await awaitNestedUpdates(pagination)
      expect(pagination.currentPage).toBe(1)

      // Rapid page transitions: click page 2
      const page2 = pagination.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[aria-label="Page 2"]',
      )
      page2?.click()
      await awaitNestedUpdates(pagination)
      expect(lastFiredPage).toBe(2)
      expect(eventCount).toBe(1)

      // Clicking currently active page does NOT fire redundant pagechange
      page2?.click()
      await awaitNestedUpdates(pagination)
      expect(eventCount).toBe(1)
    })
  })

  // --------------------------------------------------------------------------
  // 3. MoulBreadcrumbs Mutation & Stress Testing
  // --------------------------------------------------------------------------
  describe('MoulBreadcrumbs (`moul-breadcrumbs`) Mutation Stress', () => {
    it('CHALLENGE-BRD-01: Stress mutation with empty, single, and 50+ items', async () => {
      // Empty breadcrumbs renders safely
      const emptyBreadcrumbs = await mount<MoulBreadcrumbs>(html`
        <moul-breadcrumbs></moul-breadcrumbs>
      `)
      expect(emptyBreadcrumbs.shadowRoot?.querySelector('nav')).toBeTruthy()

      // Single item breadcrumbs
      const singleBreadcrumbs = await mount<MoulBreadcrumbs>(html`
        <moul-breadcrumbs separator=">">
          <moul-breadcrumb-item href="/home">Home</moul-breadcrumb-item>
        </moul-breadcrumbs>
      `)
      const singleItem = singleBreadcrumbs.querySelector('moul-breadcrumb-item')
      expect(singleItem?.separator).toBe('>')

      // 50+ items stress test
      const count = 55
      const items = Array.from({ length: count }, (_, i) => ({
        href: `/path/${i}`,
        label: `Step ${i}`,
        isCurrent: i === count - 1,
      }))

      const bulkBreadcrumbs = await mount<MoulBreadcrumbs>(html`
        <moul-breadcrumbs separator="→">
          ${items.map(
            (item) => html`
              <moul-breadcrumb-item
                href=${item.href}
                ?is-current=${item.isCurrent}
              >
                ${item.label}
              </moul-breadcrumb-item>
            `,
          )}
        </moul-breadcrumbs>
      `)

      const slottedItems = Array.from(
        bulkBreadcrumbs.querySelectorAll<MoulBreadcrumbItem>(
          'moul-breadcrumb-item',
        ),
      )
      expect(slottedItems.length).toBe(count)

      // All items must inherit the separator "→"
      for (const itm of slottedItems) {
        expect(itm.separator).toBe('→')
      }

      // Last item is current
      const lastItem = slottedItems[count - 1]
      expect(lastItem.isCurrent).toBe(true)
      const currentSpan = lastItem.shadowRoot?.querySelector(
        '[aria-current="page"]',
      )
      expect(currentSpan).toBeTruthy()
      expect(lastItem.shadowRoot?.querySelector('a')).toBeNull()
    })

    it('CHALLENGE-BRD-02: Dynamic is-current toggle and custom item separator preservation', async () => {
      const breadcrumbs = await mount<MoulBreadcrumbs>(html`
        <moul-breadcrumbs separator="/">
          <moul-breadcrumb-item href="/a">A</moul-breadcrumb-item>
          <moul-breadcrumb-item href="/b" separator="|">B</moul-breadcrumb-item>
          <moul-breadcrumb-item href="/c">C</moul-breadcrumb-item>
        </moul-breadcrumbs>
      `)

      const items = Array.from(
        breadcrumbs.querySelectorAll<MoulBreadcrumbItem>(
          'moul-breadcrumb-item',
        ),
      )
      expect(items[0].separator).toBe('/')
      // Custom separator on item B must not be overridden
      expect(items[1].separator).toBe('|')
      expect(items[2].separator).toBe('/')

      // Dynamic is-current toggle on item A
      expect(items[0].shadowRoot?.querySelector('a')).toBeTruthy()
      expect(
        items[0].shadowRoot?.querySelector('[aria-current="page"]'),
      ).toBeNull()

      items[0].isCurrent = true
      await awaitNestedUpdates(items[0])

      expect(items[0].shadowRoot?.querySelector('a')).toBeNull()
      expect(
        items[0].shadowRoot?.querySelector('[aria-current="page"]'),
      ).toBeTruthy()

      // Toggle back to false
      items[0].isCurrent = false
      await awaitNestedUpdates(items[0])

      expect(items[0].shadowRoot?.querySelector('a')).toBeTruthy()
      expect(
        items[0].shadowRoot?.querySelector('[aria-current="page"]'),
      ).toBeNull()

      // Dynamic separator update on parent propagates to non-overridden items
      breadcrumbs.separator = '>'
      await awaitNestedUpdates(breadcrumbs)
      expect(items[0].separator).toBe('>')
      expect(items[1].separator).toBe('|')
      expect(items[2].separator).toBe('>')
    })
  })

  // --------------------------------------------------------------------------
  // 4. MoulLink Stress, External Toggle & Bubble Verification
  // --------------------------------------------------------------------------
  describe('MoulLink (`moul-link`) Stress & Event Verification', () => {
    it('CHALLENGE-LNK-01: Dynamic external vs internal toggle preserves rel and updates DOM', async () => {
      const link = await mount<MoulLink>(html`
        <moul-link href="https://example.com" rel="author nofollow">Example</moul-link>
      `)

      const anchor = link.shadowRoot?.querySelector('a')
      expect(anchor).toBeTruthy()
      expect(anchor?.getAttribute('rel')).toBe('author nofollow')
      expect(
        link.shadowRoot?.querySelector('[part="external-icon"]'),
      ).toBeNull()

      // Dynamically make it external
      link.isExternal = true
      await awaitNestedUpdates(link)

      const updatedRel = anchor?.getAttribute('rel') ?? ''
      expect(updatedRel).toContain('author')
      expect(updatedRel).toContain('nofollow')
      expect(updatedRel).toContain('noopener')
      expect(updatedRel).toContain('noreferrer')
      expect(anchor?.getAttribute('target')).toBe('_blank')
      expect(
        link.shadowRoot?.querySelector('[part="external-icon"]'),
      ).toBeTruthy()

      // Dynamically toggle back to internal
      link.isExternal = false
      await awaitNestedUpdates(link)

      const revertedRel = anchor?.getAttribute('rel') ?? ''
      expect(revertedRel).toContain('author')
      expect(revertedRel).toContain('nofollow')
      expect(revertedRel).not.toContain('noopener')
      expect(revertedRel).not.toContain('noreferrer')
      expect(
        link.shadowRoot?.querySelector('[part="external-icon"]'),
      ).toBeNull()
    })

    it('CHALLENGE-LNK-02: Rapid press storm and composed event bubbling', async () => {
      const link = await mount<MoulLink>(html`
        <moul-link href="https://example.com">Interactive Link</moul-link>
      `)

      let linkPressCount = 0
      let docPressCount = 0

      link.addEventListener('press', (e: Event) => {
        linkPressCount++
        expect((e as CustomEvent).detail.originalEvent).toBeTruthy()
      })

      // Verify composed bubbling to document body
      document.body.addEventListener('press', () => {
        docPressCount++
      })

      const anchor = link.shadowRoot?.querySelector('a')
      expect(anchor).toBeTruthy()

      // Rapidly fire 50 click events
      for (let i = 0; i < 50; i++) {
        anchor?.click()
      }

      expect(linkPressCount).toBe(50)
      expect(docPressCount).toBe(50)
    })

    it('CHALLENGE-LNK-03: Disabled state suppresses press storm and keyboard activation', async () => {
      const link = await mount<MoulLink>(html`
        <moul-link href="https://example.com" is-disabled>Disabled Link</moul-link>
      `)

      let pressCount = 0
      link.addEventListener('press', () => {
        pressCount++
      })

      const anchor = link.shadowRoot?.querySelector('a')
      expect(anchor?.getAttribute('tabindex')).toBe('-1')

      // Storm 50 clicks while disabled
      for (let i = 0; i < 50; i++) {
        anchor?.click()
      }
      expect(pressCount).toBe(0)

      // Enter / Space keys while disabled
      await simulateKey(anchor!, 'Enter')
      await simulateKey(anchor!, ' ')
      expect(pressCount).toBe(0)

      // Dynamically re-enable
      link.isDisabled = false
      await awaitNestedUpdates(link)

      expect(anchor?.getAttribute('href')).toBe('https://example.com')
      expect(anchor?.getAttribute('tabindex')).toBe('0')

      anchor?.click()
      expect(pressCount).toBe(1)
    })
  })

  // --------------------------------------------------------------------------
  // 5. Empirical Verification of Discovered Defects (Adversarial Findings)
  // --------------------------------------------------------------------------
  describe('Empirical Verification of Discovered Defects', () => {
    it('CHAL-DEFECT-01: Lit nothing sentinel correctly omits aria-disabled and role in MoulLink', async () => {
      // Test 1: Enabled link does not leak aria-disabled="" in DOM
      const enabledLink = await mount<MoulLink>(html`
        <moul-link href="https://example.com">Enabled Link</moul-link>
      `)
      const anchor = enabledLink.shadowRoot?.querySelector('a')
      expect(anchor).toBeTruthy()

      expect(anchor?.hasAttribute('aria-disabled')).toBe(false)

      // Test 2: Normal link with href does not serialize role="" in DOM
      expect(anchor?.hasAttribute('role')).toBe(false)

      // Test 3: Disabled link removes href attribute completely and sets aria-disabled="true"
      enabledLink.isDisabled = true
      await awaitNestedUpdates(enabledLink)
      expect(anchor?.hasAttribute('href')).toBe(false)
      expect(anchor?.getAttribute('aria-disabled')).toBe('true')
    })

    it('CHAL-DEFECT-02: Lit nothing sentinel omits aria-current on inactive pagination buttons', async () => {
      const pagination = await mount<MoulPagination>(html`
        <moul-pagination total-pages="5" current-page="1"></moul-pagination>
      `)

      // Page 2 button is not active
      const page2Btn = pagination.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[aria-label="Page 2"]',
      )
      expect(page2Btn).toBeTruthy()

      // Inactive button must not have aria-current
      expect(page2Btn?.hasAttribute('aria-current')).toBe(false)

      // Active button has aria-current="page"
      const page1Btn = pagination.shadowRoot?.querySelector<HTMLButtonElement>(
        'button[aria-label="Page 1"]',
      )
      expect(page1Btn?.getAttribute('aria-current')).toBe('page')
    })

    it('CHAL-DEFECT-03: Clamping in willUpdate() prevents secondary update cycles and change-in-update warnings', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn')
      const consoleErrorSpy = vi.spyOn(console, 'error')

      const pagination = await mount<MoulPagination>(html`
        <moul-pagination total-pages="5" current-page="1"></moul-pagination>
      `)

      let renderCount = 0
      const originalRender = pagination.render.bind(pagination)
      pagination.render = () => {
        renderCount++
        return originalRender()
      }

      // Setting out-of-bounds current-page triggers willUpdate which clamps before rendering
      pagination.currentPage = 100
      await awaitNestedUpdates(pagination)

      expect(pagination.currentPage).toBe(5)
      expect(renderCount).toBe(1)

      const warningEmitted = [
        ...consoleWarnSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
      ].some((call) =>
        call.some(
          (arg) => typeof arg === 'string' && arg.includes('change-in-update'),
        ),
      )
      expect(warningEmitted).toBe(false)

      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })
})
