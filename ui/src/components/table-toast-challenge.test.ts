import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './Table/Table'
import './Toast/Toast'
import './Toast/ToastQueue'

import type { MoulTable, TableColumn } from './Table/Table'
import type { MoulToast } from './Toast/Toast'
import { toastQueue } from './Toast/ToastQueue'

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

describe('Empirical Adversarial Challenge Suite: MoulTable & MoulToast', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // =========================================================================
  // Challenge 1: MoulTable Extreme Workloads, Dynamic Sorting & Selection
  // =========================================================================
  describe('Challenge 1: MoulTable Extreme Workloads, Dynamic Sorting & Selection', () => {
    it('CHAL-TBL-01: 150+ rows dataset rendering, select-all toggling, and row-level selection synchronization', async () => {
      const ROW_COUNT = 150
      const data = Array.from({ length: ROW_COUNT }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        score: (i * 37) % 100,
      }))

      const columns: TableColumn[] = [
        { key: 'name', title: 'Full Name', sortable: true },
        { key: 'email', title: 'Email Address', sortable: true },
        { key: 'score', title: 'Performance Score', sortable: false },
      ]

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-selectable
            is-sortable
            .data=${data}
            .columns=${columns}
          ></moul-table>
        `,
      )

      // 1. Verify complete rendering of all 150 data rows
      const rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      expect(rows?.length).toBe(ROW_COUNT)

      // Header select-all checkbox exists and is initially unchecked
      const headerCheckbox = table.shadowRoot?.querySelector(
        'thead input[type="checkbox"]',
      ) as HTMLInputElement
      expect(headerCheckbox).toBeTruthy()
      expect(headerCheckbox.checked).toBe(false)
      expect(table.selectedKeys).toEqual([])

      // Track selection change events
      const selectionEvents: string[][] = []
      table.addEventListener('selectionchange', (e: Event) => {
        selectionEvents.push([...(e as CustomEvent).detail.selectedKeys])
      })

      // 2. Select All action via header checkbox
      headerCheckbox.click()
      await awaitNestedUpdates(table)

      expect(selectionEvents.length).toBe(1)
      expect(selectionEvents[0].length).toBe(ROW_COUNT)
      expect(table.selectedKeys.length).toBe(ROW_COUNT)
      expect(headerCheckbox.checked).toBe(true)

      // Verify every row rendered in DOM reflects selected state
      const rowCheckboxes = table.shadowRoot?.querySelectorAll(
        'tbody input[type="checkbox"]',
      )
      expect(rowCheckboxes?.length).toBe(ROW_COUNT)
      for (let i = 0; i < ROW_COUNT; i++) {
        expect((rowCheckboxes?.[i] as HTMLInputElement).checked).toBe(true)
        expect(rows?.[i].getAttribute('aria-selected')).toBe('true')
      }

      // 3. Deselect a single row (row 42: user-43)
      const targetCheckbox = rowCheckboxes?.[42] as HTMLInputElement
      targetCheckbox.click()
      await awaitNestedUpdates(table)

      expect(selectionEvents.length).toBe(2)
      expect(selectionEvents[1].length).toBe(ROW_COUNT - 1)
      expect(selectionEvents[1].includes('user-43')).toBe(false)
      expect(table.selectedKeys.includes('user-43')).toBe(false)

      // Header checkbox must now be unchecked because not all rows are selected
      expect(headerCheckbox.checked).toBe(false)
      expect(rows?.[42].getAttribute('aria-selected')).toBe('false')

      // 4. Re-select user-43
      targetCheckbox.click()
      await awaitNestedUpdates(table)

      expect(selectionEvents.length).toBe(3)
      expect(selectionEvents[2].length).toBe(ROW_COUNT)
      expect(table.selectedKeys.includes('user-43')).toBe(true)
      expect(headerCheckbox.checked).toBe(true)

      // 5. Deselect All via header checkbox
      headerCheckbox.click()
      await awaitNestedUpdates(table)

      expect(selectionEvents.length).toBe(4)
      expect(selectionEvents[3]).toEqual([])
      expect(table.selectedKeys).toEqual([])
      expect(headerCheckbox.checked).toBe(false)

      for (let i = 0; i < ROW_COUNT; i++) {
        expect((rowCheckboxes?.[i] as HTMLInputElement).checked).toBe(false)
        expect(rows?.[i].getAttribute('aria-selected')).toBe('false')
      }
    })

    it('CHAL-TBL-02: Dynamic sorting toggling across multiple columns with sortchange events and aria-sort', async () => {
      const data = [
        { id: '1', name: 'Alpha', department: 'Engineering', active: true },
        { id: '2', name: 'Beta', department: 'Product', active: false },
        { id: '3', name: 'Gamma', department: 'Design', active: true },
      ]
      const columns: TableColumn[] = [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'department', title: 'Department', sortable: true },
        { key: 'active', title: 'Active', sortable: false },
      ]

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-sortable
            .data=${data}
            .columns=${columns}
          ></moul-table>
        `,
      )

      const sortEvents: { column: string; direction: string }[] = []
      table.addEventListener('sortchange', (e: Event) => {
        sortEvents.push({ ...(e as CustomEvent).detail })
      })

      const headers = table.shadowRoot?.querySelectorAll('th[part="th"]')
      expect(headers?.length).toBe(3)

      const nameTh = headers?.[0] as HTMLElement
      const deptTh = headers?.[1] as HTMLElement
      const activeTh = headers?.[2] as HTMLElement

      // Initial state: columns have aria-sort="none"
      expect(nameTh.getAttribute('aria-sort')).toBe('none')
      expect(deptTh.getAttribute('aria-sort')).toBe('none')
      // Non-sortable column activeTh has no sort icon rendered
      expect(activeTh.querySelector('.sort-icon')).toBeNull()
      // Sortable columns have sort icons
      expect(nameTh.querySelector('.sort-icon')).toBeTruthy()
      expect(deptTh.querySelector('.sort-icon')).toBeTruthy()

      // 1. Click 'name' -> ascending
      nameTh.click()
      await awaitNestedUpdates(table)

      expect(sortEvents.length).toBe(1)
      expect(sortEvents[0]).toEqual({ column: 'name', direction: 'asc' })
      expect(table.sortColumn).toBe('name')
      expect(table.sortDirection).toBe('asc')
      expect(nameTh.getAttribute('aria-sort')).toBe('ascending')
      expect(deptTh.getAttribute('aria-sort')).toBe('none')

      // Check sort icon rotation class
      const nameIcon = nameTh.querySelector('.sort-icon')
      expect(nameIcon?.classList.contains('desc')).toBe(false)

      // 2. Click 'name' again -> descending
      nameTh.click()
      await awaitNestedUpdates(table)

      expect(sortEvents.length).toBe(2)
      expect(sortEvents[1]).toEqual({ column: 'name', direction: 'desc' })
      expect(table.sortColumn).toBe('name')
      expect(table.sortDirection).toBe('desc')
      expect(nameTh.getAttribute('aria-sort')).toBe('descending')
      expect(nameIcon?.classList.contains('desc')).toBe(true)

      // 3. Switch column: click 'department' -> should start at 'asc'
      deptTh.click()
      await awaitNestedUpdates(table)

      expect(sortEvents.length).toBe(3)
      expect(sortEvents[2]).toEqual({ column: 'department', direction: 'asc' })
      expect(table.sortColumn).toBe('department')
      expect(table.sortDirection).toBe('asc')
      expect(deptTh.getAttribute('aria-sort')).toBe('ascending')
      // Previous column 'name' resets to 'none'
      expect(nameTh.getAttribute('aria-sort')).toBe('none')

      // 4. Click non-sortable column 'active' -> must NOT trigger sortchange
      activeTh.click()
      await awaitNestedUpdates(table)

      expect(sortEvents.length).toBe(3) // Unchanged
      expect(table.sortColumn).toBe('department') // Unchanged

      // 5. When table is-sortable is false, header clicks do nothing and sorting is suppressed
      table.isSortable = false
      await awaitNestedUpdates(table)

      const updatedNameTh = table.shadowRoot?.querySelectorAll(
        'th[part="th"]',
      )?.[0] as HTMLElement
      updatedNameTh.click()
      await awaitNestedUpdates(table)

      // Event count remains 3 (no new sortchange event emitted)
      expect(sortEvents.length).toBe(3)
      // Lit renders empty attribute when ariaSort expression evaluates to undefined
      expect(updatedNameTh.getAttribute('aria-sort')).toBe('')
    })

    it('CHAL-TBL-03: Selection state integrity under continuous dynamic filtering and dataset replacement', async () => {
      const fullDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i + 1}`,
        category: (i + 1) % 2 === 0 ? 'even' : 'odd',
        title: `Item ${i + 1}`,
      }))

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-selectable
            .data=${fullDataset}
          ></moul-table>
        `,
      )

      // Select specific items across odd and even categories
      table.selectedKeys = ['item-2', 'item-4', 'item-5']
      await awaitNestedUpdates(table)

      // 1. Verify rows reflect pre-selected keys
      let rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      expect(rows?.length).toBe(50)
      expect(rows?.[1].getAttribute('aria-selected')).toBe('true') // item-2
      expect(rows?.[3].getAttribute('aria-selected')).toBe('true') // item-4
      expect(rows?.[4].getAttribute('aria-selected')).toBe('true') // item-5
      expect(rows?.[0].getAttribute('aria-selected')).toBe('false') // item-1

      // 2. Filter dataset dynamically to only category === 'even' (25 items: item-2, item-4, ...)
      const evenDataset = fullDataset.filter((item) => item.category === 'even')
      table.data = evenDataset
      await awaitNestedUpdates(table)

      rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      expect(rows?.length).toBe(25)

      // In the filtered view, item-2 and item-4 are still selected
      expect(rows?.[0].getAttribute('aria-selected')).toBe('true') // item-2 (first even)
      expect(rows?.[1].getAttribute('aria-selected')).toBe('true') // item-4 (second even)
      expect(rows?.[2].getAttribute('aria-selected')).toBe('false') // item-6

      // Original selectedKeys must retain item-5 even though it is filtered out from current view
      expect(table.selectedKeys).toEqual(['item-2', 'item-4', 'item-5'])

      // 3. Filter to exactly the selected items in even dataset: ['item-2', 'item-4']
      table.data = [fullDataset[1], fullDataset[3]] // item-2, item-4
      await awaitNestedUpdates(table)

      const headerCheckbox = table.shadowRoot?.querySelector(
        'thead input[type="checkbox"]',
      ) as HTMLInputElement
      // Since all currently rendered rows are selected, header checkbox must become checked
      expect(headerCheckbox.checked).toBe(true)

      // 4. Replace dataset with empty array
      table.data = []
      await awaitNestedUpdates(table)

      const emptyCell = table.shadowRoot?.querySelector('.empty-cell')
      expect(emptyCell).toBeTruthy()
      expect(emptyCell?.textContent?.trim()).toBe('No data available')
      expect(headerCheckbox.checked).toBe(false)
      // Selected keys remain safely stored on table instance
      expect(table.selectedKeys).toEqual(['item-2', 'item-4', 'item-5'])

      // 5. Restore full dataset -> all 3 previously selected rows recover selection
      table.data = fullDataset
      await awaitNestedUpdates(table)

      rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      expect(rows?.length).toBe(50)
      expect(rows?.[1].getAttribute('aria-selected')).toBe('true')
      expect(rows?.[3].getAttribute('aria-selected')).toBe('true')
      expect(rows?.[4].getAttribute('aria-selected')).toBe('true')
    })

    it('CHAL-TBL-04: Rapid 50x toggling between isLoading true and false maintains DOM stability and selection', async () => {
      const data = [
        { id: 'row-a', label: 'Alpha' },
        { id: 'row-b', label: 'Beta' },
        { id: 'row-c', label: 'Gamma' },
      ]

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-selectable
            .data=${data}
            .selectedKeys=${['row-b']}
          ></moul-table>
        `,
      )

      expect(table.isLoading).toBe(false)
      const renderedRows = table.shadowRoot?.querySelectorAll('tbody tr')
      expect(renderedRows?.length).toBe(3)

      // Stress toggle isLoading 50 times in rapid sequence
      for (let i = 0; i < 50; i++) {
        table.isLoading = i % 2 === 0
      }
      await awaitNestedUpdates(table)

      // Settle on isLoading = true
      table.isLoading = true
      await awaitNestedUpdates(table)

      // In loading state, exactly 3 skeleton placeholder rows must render
      const loadingRows = table.shadowRoot?.querySelectorAll(
        'tbody tr[part="loading-row"]',
      )
      expect(loadingRows?.length).toBe(3)
      const skeletons = table.shadowRoot?.querySelectorAll('moul-skeleton')
      expect(skeletons?.length).toBeGreaterThanOrEqual(3)

      // Settle on isLoading = false
      table.isLoading = false
      await awaitNestedUpdates(table)

      const normalRows = table.shadowRoot?.querySelectorAll(
        'tbody tr[part="row"]',
      )
      expect(normalRows?.length).toBe(3)
      expect(
        table.shadowRoot?.querySelectorAll('[part="loading-row"]').length,
      ).toBe(0)

      // Selected row-b must remain selected after multiple loading transitions
      expect(normalRows?.[1].getAttribute('aria-selected')).toBe('true')
      expect(table.selectedKeys).toEqual(['row-b'])
    })

    it('CHAL-TBL-05: Safe JSON attribute converter handling for malformed or missing attributes', async () => {
      // Mount table with malformed JSON strings in attributes
      const table = await mount<MoulTable>(
        html`
          <moul-table
            data="invalid-json-string{"
            columns="[unclosed"
            selected-keys="not-an-array"
          ></moul-table>
        `,
      )

      // Safe JSON converter must return empty arrays without throwing
      expect(table.data).toEqual([])
      expect(table.columns).toEqual([])
      expect(table.selectedKeys).toEqual([])

      const emptyCell = table.shadowRoot?.querySelector('.empty-cell')
      expect(emptyCell).toBeTruthy()

      // When columns are empty but valid data is provided, auto-derive columns
      table.data = [{ first: 'John', last: 'Doe', age: 30 }]
      await awaitNestedUpdates(table)

      const ths = table.shadowRoot?.querySelectorAll('th[part="th"]')
      expect(ths?.length).toBe(3)
      expect(ths?.[0].textContent?.trim()).toBe('First')
      expect(ths?.[1].textContent?.trim()).toBe('Last')
      expect(ths?.[2].textContent?.trim()).toBe('Age')
    })

    it('CHAL-TBL-06: Fast-check property test verifying selection invariants across arbitrary row counts', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 60 }), async (rowCount) => {
          const generatedData = Array.from({ length: rowCount }, (_, i) => ({
            id: `k-${i}`,
            val: `val-${i}`,
          }))

          const tbl = document.createElement('moul-table') as MoulTable
          tbl.isSelectable = true
          tbl.data = generatedData
          document.body.appendChild(tbl)
          await tbl.updateComplete

          try {
            // 1. Initial state: 0 selected
            expect(tbl.selectedKeys.length).toBe(0)
            const renderedCheckboxes = tbl.shadowRoot?.querySelectorAll(
              'tbody input[type="checkbox"]',
            ) as NodeListOf<HTMLInputElement>
            expect(renderedCheckboxes.length).toBe(rowCount)
            expect(
              Array.from(renderedCheckboxes).every((cb) => !cb.checked),
            ).toBe(true)

            // 2. Select first half
            const halfCount = Math.floor(rowCount / 2)
            const keysToSelect = generatedData
              .slice(0, halfCount)
              .map((d) => d.id)
            tbl.selectedKeys = keysToSelect
            await tbl.updateComplete

            const checkedCount = Array.from(
              tbl.shadowRoot?.querySelectorAll(
                'tbody input[type="checkbox"]',
              ) as NodeListOf<HTMLInputElement>,
            ).filter((cb) => cb.checked).length
            expect(checkedCount).toBe(halfCount)

            // 3. Select all via header
            const headerCb = tbl.shadowRoot?.querySelector(
              'thead input[type="checkbox"]',
            ) as HTMLInputElement
            headerCb.checked = true
            headerCb.dispatchEvent(new Event('change'))
            await tbl.updateComplete

            expect(tbl.selectedKeys.length).toBe(rowCount)
            expect(headerCb.checked).toBe(true)
          } finally {
            tbl.remove()
          }
        }),
        { numRuns: 15 },
      )
    })

    it('CHAL-TBL-07: Dynamic data mutation and consumer-driven sorting pipeline across 200+ numeric/string records', async () => {
      const TOTAL_ROWS = 200
      const rawData = Array.from({ length: TOTAL_ROWS }, (_, i) => ({
        id: `rec-${i}`,
        name: `Person ${String(i).padStart(3, '0')}`,
        score: (i * 47) % 1000,
      }))

      const columns: TableColumn[] = [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'score', title: 'Score', sortable: true },
      ]

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-sortable
            .data=${rawData}
            .columns=${columns}
          >
            <span slot="caption">Performance Leaderboard</span>
            <span slot="footer">Total 200 Participants</span>
          </moul-table>
        `,
      )

      // Verify table rendered
      const renderedTable = table.shadowRoot?.querySelector('table')
      expect(renderedTable).toBeTruthy()

      // Wire up realistic consumer sorting pipeline
      table.addEventListener('sortchange', (e: Event) => {
        const { column, direction } = (e as CustomEvent).detail
        const factor = direction === 'asc' ? 1 : -1
        table.data = [...table.data].sort((a, b) => {
          const valA = a[column]
          const valB = b[column]
          if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * factor
          }
          return String(valA).localeCompare(String(valB)) * factor
        })
      })

      // Sort by score (numeric column)
      const headers = table.shadowRoot?.querySelectorAll('th[part="th"]')
      const scoreTh = headers?.[1] as HTMLElement

      // Click 1 -> Ascending numeric order
      scoreTh.click()
      await awaitNestedUpdates(table)

      let rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      expect(rows?.length).toBe(TOTAL_ROWS)
      // First row should have lowest score
      expect(rows?.[0].querySelectorAll('td')[1].textContent?.trim()).toBe('0')

      // Click 2 -> Descending numeric order
      scoreTh.click()
      await awaitNestedUpdates(table)

      rows = table.shadowRoot?.querySelectorAll('tbody tr[part="row"]')
      // First row should have highest score <= 999
      const topScore = Number(
        rows?.[0].querySelectorAll('td')[1].textContent?.trim(),
      )
      const nextScore = Number(
        rows?.[1].querySelectorAll('td')[1].textContent?.trim(),
      )
      expect(topScore).toBeGreaterThanOrEqual(nextScore)
    })
  })

  // =========================================================================
  // Challenge 2: MoulToast & ToastQueue Top-Layer Lifecycle & Cleanup Stress
  // =========================================================================
  describe('Challenge 2: MoulToast & ToastQueue Top-Layer Lifecycle & Cleanup Stress', () => {
    it('CHAL-TST-01: Rapid addition of 50 toasts via toastQueue.add() generates top-layer manual popovers', async () => {
      const TOTAL_TOASTS = 50
      const generatedIds: string[] = []
      const tones = [
        'primary',
        'accent',
        'success',
        'warning',
        'error',
      ] as const

      for (let i = 0; i < TOTAL_TOASTS; i++) {
        const id = toastQueue.add({
          title: `Rapid Notification ${i + 1}`,
          description: `Payload index ${i + 1}`,
          tone: tones[i % tones.length],
          duration: 10000,
        })
        generatedIds.push(id)
      }

      // 1. Verify 50 unique IDs
      const uniqueIds = new Set(generatedIds)
      expect(uniqueIds.size).toBe(TOTAL_TOASTS)

      // 2. Verify toast region contains exactly 50 toasts
      const region = document.querySelector('moul-toast-region')
      expect(region).toBeTruthy()
      const toasts = region?.querySelectorAll(
        'moul-toast',
      ) as NodeListOf<MoulToast>
      expect(toasts.length).toBe(TOTAL_TOASTS)

      // 3. The region (not each toast) is the top-layer manual popover
      expect(region?.getAttribute('popover')).toBe('manual')
      const firstToast = toasts[0]
      expect(firstToast.hasAttribute('popover')).toBe(false)
      expect(firstToast.getAttribute('role')).toBe('status')
      expect(firstToast.getAttribute('aria-live')).toBe('polite')
      expect(firstToast.isOpen).toBe(true)

      // Error toast has role="alert" and aria-live="assertive"
      const errorToast = Array.from(toasts).find((t) => t.tone === 'error')
      expect(errorToast).toBeTruthy()
      expect(errorToast?.getAttribute('role')).toBe('alert')
      expect(errorToast?.getAttribute('aria-live')).toBe('assertive')

      // Cleanup
      toastQueue.clear()
    })

    it('CHAL-TST-02: Rapid dismissal via toastQueue.close() and toastQueue.clear() without DOM leaks', async () => {
      // Add 20 toasts
      const ids: string[] = []
      for (let i = 0; i < 20; i++) {
        ids.push(
          toastQueue.add({
            title: `Batch Toast ${i}`,
            duration: 0, // Manual close only
          }),
        )
      }

      const region = document.querySelector('moul-toast-region')
      expect(region?.querySelectorAll('moul-toast').length).toBe(20)

      // 1. Close first 5 individually via toastQueue.close(id)
      for (let i = 0; i < 5; i++) {
        toastQueue.close(ids[i])
      }

      // Allow exit animations to finish
      await new Promise((r) => setTimeout(r, 250))

      let remainingToasts = region?.querySelectorAll('moul-toast')
      expect(remainingToasts?.length).toBe(15)

      // Verify the closed ones are removed from DOM
      for (let i = 0; i < 5; i++) {
        expect(region?.querySelector(`#${ids[i]}`)).toBeNull()
      }

      // 2. Clear all remaining toasts via toastQueue.clear()
      toastQueue.clear()

      // Allow exit animations to finish
      await new Promise((r) => setTimeout(r, 250))

      remainingToasts = region?.querySelectorAll('moul-toast')
      expect(remainingToasts?.length).toBe(0)
    })

    it('CHAL-TST-03: Timers test with vi.useFakeTimers() advancing by duration and dismiss cleanup', async () => {
      vi.useFakeTimers()

      const id = toastQueue.add({
        title: 'Auto Dismiss Test',
        description: 'Should vanish after 3500ms',
        duration: 3500,
      })

      const region = document.querySelector('moul-toast-region')
      const toast = region?.querySelector(`#${id}`) as MoulToast
      expect(toast).toBeTruthy()
      expect(toast.isOpen).toBe(true)

      // Advance by 3000ms: toast should still be open
      await vi.advanceTimersByTimeAsync(3000)
      expect(toast.isOpen).toBe(true)
      expect(toast.isConnected).toBe(true)

      // Advance by 500ms (total 3500ms): timer triggers close()
      await vi.advanceTimersByTimeAsync(500)
      expect(toast.isOpen).toBe(false)

      // Advance exit animation time (180ms)
      await vi.advanceTimersByTimeAsync(300)
      await toast.updateComplete

      // Toast must be dismissed and removed from DOM
      expect(region?.querySelector(`#${id}`)).toBeNull()

      vi.useRealTimers()
    })

    it('CHAL-TST-04: Pointer hover pauses dismiss timer and unhover resumes with remaining time', async () => {
      vi.useFakeTimers()

      const id = toastQueue.add({
        title: 'Hover Test Toast',
        duration: 4000,
      })

      const region = document.querySelector('moul-toast-region')
      const toast = region?.querySelector(`#${id}`) as MoulToast
      expect(toast).toBeTruthy()

      // Advance 2000ms (half the duration)
      await vi.advanceTimersByTimeAsync(2000)
      expect(toast.isOpen).toBe(true)

      // Hover over toast -> pointerenter pauses timer
      toast.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))

      // Advance time by 6000ms while user is hovering!
      await vi.advanceTimersByTimeAsync(6000)
      // Toast MUST still remain open because hover paused the timer
      expect(toast.isOpen).toBe(true)
      expect(toast.isConnected).toBe(true)

      // Unhover -> pointerleave resumes timer with remaining ~2000ms
      toast.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))

      // Advance 1000ms: still open
      await vi.advanceTimersByTimeAsync(1000)
      expect(toast.isOpen).toBe(true)

      // Advance remaining 1000ms: timer expires
      await vi.advanceTimersByTimeAsync(1000)
      expect(toast.isOpen).toBe(false)

      // Advance exit animation
      await vi.advanceTimersByTimeAsync(300)
      expect(region?.querySelector(`#${id}`)).toBeNull()

      vi.useRealTimers()
    })

    it('CHAL-TST-05: Single and idempotent close() calls and disconnectedCallback safety', async () => {
      const toast = await mount<MoulToast>(
        html`<moul-toast title="Standalone Toast" duration="5000"></moul-toast>`,
      )

      let dismissCount = 0
      toast.addEventListener('dismiss', () => {
        dismissCount++
      })

      // Call close once
      await toast.close()
      await toast.updateComplete

      expect(toast.isOpen).toBe(false)
      expect(dismissCount).toBe(1)

      // Disconnecting a toast with active timer does not throw
      const toast2 = await mount<MoulToast>(
        html`<moul-toast title="To be detached" duration="5000"></moul-toast>`,
      )
      expect(() => {
        toast2.remove()
      }).not.toThrow()
    })

    it('CHAL-TST-06: Fast-check property test verifying tone, variant, and ARIA role mappings', async () => {
      const tones = [
        'primary',
        'accent',
        'success',
        'warning',
        'error',
      ] as const
      const variants = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...tones),
          fc.constantFrom(...variants),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (tone, variant, title) => {
            const tst = document.createElement('moul-toast') as MoulToast
            tst.tone = tone
            tst.variant = variant
            tst.title = title
            tst.duration = 0 // prevent auto-dismiss
            document.body.appendChild(tst)
            await tst.updateComplete

            try {
              expect(tst.tone).toBe(tone)
              expect(tst.variant).toBe(variant)
              expect(tst.title).toBe(title)

              // Invariant: error tone is role="alert", others are role="status"
              const expectedRole = tone === 'error' ? 'alert' : 'status'
              const expectedLive = tone === 'error' ? 'assertive' : 'polite'
              expect(tst.getAttribute('role')).toBe(expectedRole)
              expect(tst.getAttribute('aria-live')).toBe(expectedLive)
              expect(tst.hasAttribute('popover')).toBe(false)
            } finally {
              tst.remove()
            }
          },
        ),
        { numRuns: 20 },
      )
    })

    it('CHAL-TST-07: Staggered multi-toast lifecycle with vi.useFakeTimers() and manual dismiss button', async () => {
      vi.useFakeTimers()

      // Add 3 toasts with staggered durations
      const id1 = toastQueue.add({ title: 'Short Toast', duration: 1000 })
      const id2 = toastQueue.add({ title: 'Medium Toast', duration: 3000 })
      const id3 = toastQueue.add({ title: 'Long Toast', duration: 6000 })

      const region = document.querySelector('moul-toast-region')
      expect(region?.querySelectorAll('moul-toast').length).toBe(3)

      const toast1 = region?.querySelector(`#${id1}`) as MoulToast
      const toast2 = region?.querySelector(`#${id2}`) as MoulToast
      const toast3 = region?.querySelector(`#${id3}`) as MoulToast

      // Advance by 1000ms -> toast1 triggers auto-dismiss
      await vi.advanceTimersByTimeAsync(1000)
      expect(toast1.isOpen).toBe(false)
      expect(toast2.isOpen).toBe(true)
      expect(toast3.isOpen).toBe(true)

      // Advance exit animation for toast1
      await vi.advanceTimersByTimeAsync(300)
      expect(region?.querySelector(`#${id1}`)).toBeNull()
      expect(region?.querySelectorAll('moul-toast').length).toBe(2)

      // Click manual dismiss button on toast3 (before its 6000ms timer expires)
      const dismissBtn3 = toast3.shadowRoot?.querySelector(
        '.dismiss-button',
      ) as HTMLButtonElement
      expect(dismissBtn3).toBeTruthy()
      dismissBtn3.click()
      await vi.advanceTimersByTimeAsync(300)

      expect(toast3.isOpen).toBe(false)
      expect(region?.querySelector(`#${id3}`)).toBeNull()
      expect(region?.querySelectorAll('moul-toast').length).toBe(1)

      // Advance remaining time for toast2 (total 3000ms from start)
      await vi.advanceTimersByTimeAsync(2000)
      expect(toast2.isOpen).toBe(false)

      await vi.advanceTimersByTimeAsync(300)
      expect(region?.querySelector(`#${id2}`)).toBeNull()
      expect(region?.querySelectorAll('moul-toast').length).toBe(0)

      vi.useRealTimers()
    })
  })
})
