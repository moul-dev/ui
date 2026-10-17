import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { triggerResize } from '../test-setup'
import './ChartContainer/ChartContainer'
import type {
  MoulChartContainer,
  ViewportResizeDetail,
} from './ChartContainer/ChartContainer'
import './ChartTooltip/ChartTooltip'
import type { MoulChartTooltip } from './ChartTooltip/ChartTooltip'
import { chartTooltipStyles } from './ChartTooltip/ChartTooltip.styles'

// Universal Lit nested updates awaiter
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

// Universal DOM mounting helper
async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

describe('Adversarial Stress Suite: MoulChartContainer (`moul-chart-container`)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // =========================================================================
  // 1. Rapid, Repeated Dimension Changes & Event Thrashing
  // =========================================================================
  describe('Dimension Stress & Event Thrashing', () => {
    it('survives 100 sequential dimension resizes without event drop or memory corruption', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const events: ViewportResizeDetail[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        events.push((e as CustomEvent<ViewportResizeDetail>).detail)
      })

      // 100 sequential dimension updates
      for (let i = 1; i <= 100; i++) {
        const w = 300 + i * 10 // 310 to 1300
        const h = 200 + (i % 20) * 10
        triggerResize(container, { width: w, height: h })
        await container.updateComplete

        expect(container.containerWidth).toBe(w)
        expect(container.containerHeight).toBe(h)
      }

      expect(events.length).toBe(100)
      expect(events[0]).toEqual({
        width: 310,
        height: 210,
        breakpoint: 'xs',
      })
      expect(events[99]).toEqual({
        width: 1300,
        height: 200,
        breakpoint: 'xl',
      })
    })

    it('batches 100 synchronous burst resizes without infinite updates or stack overflow', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let eventCount = 0
      let lastDetail: ViewportResizeDetail | null = null
      container.addEventListener('viewport-resize', (e: Event) => {
        eventCount++
        lastDetail = (e as CustomEvent<ViewportResizeDetail>).detail
      })

      // 100 synchronous resizes in the same turn of the event loop
      for (let i = 1; i <= 100; i++) {
        triggerResize(container, { width: 400 + i, height: 300 + i })
      }

      await container.updateComplete

      // Lit microtask batching coalesces multiple synchronous updates into one
      expect(eventCount).toBe(1)
      expect(lastDetail).not.toBeNull()
      expect(lastDetail!.width).toBe(500)
      expect(lastDetail!.height).toBe(400)
      expect(lastDetail!.breakpoint).toBe('sm')
    })

    it('suppresses redundant events when dimensions do not mutate', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let eventCount = 0
      container.addEventListener('viewport-resize', () => {
        eventCount++
      })

      triggerResize(container, { width: 600, height: 300 })
      await container.updateComplete
      expect(eventCount).toBe(1)

      // Send 50 duplicate resize measurements
      for (let i = 0; i < 50; i++) {
        triggerResize(container, { width: 600, height: 300 })
        await container.updateComplete
      }

      expect(eventCount).toBe(1)
    })

    it('rapidly oscillates 100 times between adjacent breakpoints (479px xs vs 480px sm)', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const breakpoints: string[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        breakpoints.push(
          (e as CustomEvent<ViewportResizeDetail>).detail.breakpoint,
        )
      })

      for (let i = 0; i < 100; i++) {
        const isSm = i % 2 === 1
        triggerResize(container, { width: isSm ? 480 : 479, height: 300 })
        await container.updateComplete
      }

      expect(breakpoints.length).toBe(100)
      for (let i = 0; i < 100; i++) {
        const expectedBp = i % 2 === 1 ? 'sm' : 'xs'
        expect(breakpoints[i]).toBe(expectedBp)
      }
    })

    it('rapidly oscillates 100 times between sm and md (767px sm vs 768px md)', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const breakpoints: string[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        breakpoints.push(
          (e as CustomEvent<ViewportResizeDetail>).detail.breakpoint,
        )
      })

      for (let i = 0; i < 100; i++) {
        const isMd = i % 2 === 1
        triggerResize(container, { width: isMd ? 768 : 767, height: 300 })
        await container.updateComplete
      }

      expect(breakpoints.length).toBe(100)
      for (let i = 0; i < 100; i++) {
        const expectedBp = i % 2 === 1 ? 'md' : 'sm'
        expect(breakpoints[i]).toBe(expectedBp)
      }
    })
  })

  // =========================================================================
  // 2. Boundary, Pathological & Extreme Dimensions
  // =========================================================================
  describe('Boundary & Pathological Dimensions', () => {
    it('handles 0px dimension transitions and suppresses false initial 0x0 events', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let eventCount = 0
      const events: ViewportResizeDetail[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        eventCount++
        events.push((e as CustomEvent<ViewportResizeDetail>).detail)
      })

      // Initial mount at 0x0 must not dispatch false event
      await container.updateComplete
      expect(eventCount).toBe(0)

      // Resize to active dimensions
      triggerResize(container, { width: 500, height: 300 })
      await container.updateComplete
      expect(eventCount).toBe(1)
      expect(events[0]).toEqual({ width: 500, height: 300, breakpoint: 'sm' })

      // Collapse back to 0px width and height (e.g., hidden drawer / accordion)
      triggerResize(container, { width: 0, height: 0 })
      await container.updateComplete
      expect(eventCount).toBe(2)
      expect(events[1]).toEqual({ width: 0, height: 0, breakpoint: 'xs' })

      // Redundant 0x0 resize must not fire again
      triggerResize(container, { width: 0, height: 0 })
      await container.updateComplete
      expect(eventCount).toBe(2)
    })

    it('handles negative widths and heights gracefully without throwing', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let lastDetail: ViewportResizeDetail | null = null
      container.addEventListener('viewport-resize', (e: Event) => {
        lastDetail = (e as CustomEvent<ViewportResizeDetail>).detail
      })

      triggerResize(container, { width: -100, height: -50 })
      await container.updateComplete

      expect(lastDetail).not.toBeNull()
      expect(lastDetail!.width).toBe(-100)
      expect(lastDetail!.height).toBe(-50)
      expect(lastDetail!.breakpoint).toBe('xs')
      expect(container.containerWidth).toBe(-100)
      expect(container.containerHeight).toBe(-50)
      expect(container.breakpoint).toBe('xs')
    })

    it('accurately resolves high-precision fractional widths across all 5 breakpoint thresholds', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const recorded: ViewportResizeDetail[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        recorded.push((e as CustomEvent<ViewportResizeDetail>).detail)
      })

      const testCases = [
        { w: 479.9, expectedBp: 'xs' },
        { w: 480.0, expectedBp: 'sm' },
        { w: 767.9, expectedBp: 'sm' },
        { w: 768.0, expectedBp: 'md' },
        { w: 1023.9, expectedBp: 'md' },
        { w: 1024.0, expectedBp: 'lg' },
        { w: 1279.9, expectedBp: 'lg' },
        { w: 1280.0, expectedBp: 'xl' },
      ]

      for (const tc of testCases) {
        triggerResize(container, { width: tc.w, height: 300 })
        await container.updateComplete
      }

      expect(recorded.length).toBe(testCases.length)
      for (let i = 0; i < testCases.length; i++) {
        expect(recorded[i].width).toBe(testCases[i].w)
        expect(recorded[i].breakpoint).toBe(testCases[i].expectedBp)
      }
    })

    it('handles massive widths up to 10,000px and Number.MAX_SAFE_INTEGER', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let lastDetail: ViewportResizeDetail | null = null
      container.addEventListener('viewport-resize', (e: Event) => {
        lastDetail = (e as CustomEvent<ViewportResizeDetail>).detail
      })

      triggerResize(container, { width: 10000, height: 4000 })
      await container.updateComplete
      expect(lastDetail!.width).toBe(10000)
      expect(lastDetail!.breakpoint).toBe('xl')

      triggerResize(container, {
        width: Number.MAX_SAFE_INTEGER,
        height: 500,
      })
      await container.updateComplete
      expect(lastDetail!.width).toBe(Number.MAX_SAFE_INTEGER)
      expect(lastDetail!.breakpoint).toBe('xl')
    })

    it('safely falls back to xs when given NaN or non-finite dimensions', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let lastDetail: ViewportResizeDetail | null = null
      container.addEventListener('viewport-resize', (e: Event) => {
        lastDetail = (e as CustomEvent<ViewportResizeDetail>).detail
      })

      triggerResize(container, { width: Number.NaN, height: 300 })
      await container.updateComplete

      expect(lastDetail!.breakpoint).toBe('xs')
      expect(container.breakpoint).toBe('xs')
    })
  })

  // =========================================================================
  // 3. Rapid Toggling of `is-empty` / `isEmpty` & Property Reflection
  // =========================================================================
  describe('Empty State Stress & Property Reflection', () => {
    it('survives 200 rapid toggles of isEmpty property with strict attribute reflection', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div id="chart-geom">Active Geometry</div>
        </moul-chart-container>
      `)

      for (let i = 1; i <= 200; i++) {
        const targetEmpty = i % 2 === 1
        container.isEmpty = targetEmpty
        await container.updateComplete

        expect(container.isEmpty).toBe(targetEmpty)
        expect(container.hasAttribute('is-empty')).toBe(targetEmpty)

        const emptySlot =
          container.shadowRoot?.querySelector('slot[name="empty"]')
        const defaultSlot =
          container.shadowRoot?.querySelector('slot:not([name])')

        if (targetEmpty) {
          expect(emptySlot).toBeTruthy()
          expect(defaultSlot).toBeNull()
        } else {
          expect(emptySlot).toBeNull()
          expect(defaultSlot).toBeTruthy()
        }
      }
    })

    it('survives 200 rapid attribute mutations of is-empty with strict property reflection', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      for (let i = 1; i <= 200; i++) {
        const setAttr = i % 2 === 1
        if (setAttr) {
          container.setAttribute('is-empty', '')
        } else {
          container.removeAttribute('is-empty')
        }
        await container.updateComplete

        expect(container.isEmpty).toBe(setAttr)
        expect(container.hasAttribute('is-empty')).toBe(setAttr)
      }
    })

    it('preserves light DOM slotted elements across repeated empty state toggling', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div id="persistent-svg">Preserved Visual Node</div>
          <div slot="empty" id="custom-empty-node">Preserved Empty Node</div>
        </moul-chart-container>
      `)

      const svgNode = container.querySelector('#persistent-svg')
      const emptyNode = container.querySelector('#custom-empty-node')
      expect(svgNode).toBeTruthy()
      expect(emptyNode).toBeTruthy()

      // Toggle isEmpty 50 times
      for (let i = 0; i < 50; i++) {
        container.isEmpty = i % 2 === 0
        await container.updateComplete

        // The exact DOM identity of light DOM children must be preserved without garbage collection
        expect(container.querySelector('#persistent-svg')).toBe(svgNode)
        expect(container.querySelector('#custom-empty-node')).toBe(emptyNode)
      }
    })

    it('renders fallback empty state when no custom slot="empty" is provided', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container is-empty>
          <div id="chart-content">Chart</div>
        </moul-chart-container>
      `)

      const defaultEmptyContainer =
        container.shadowRoot?.querySelector('[part="empty"]')
      const emptyMessage = container.shadowRoot?.querySelector('.empty-message')

      expect(defaultEmptyContainer).toBeTruthy()
      expect(emptyMessage?.textContent?.trim()).toBe('No data available')
    })
  })

  // =========================================================================
  // 4. Multi-Slot Mounting, Dynamic Updates & Unknown Slots
  // =========================================================================
  describe('Multi-Slot Lifecycle & Structure', () => {
    it('manages 4 slots simultaneously (header, content, empty, legend)', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container title="Quarterly" description="Q1-Q4">
          <button slot="header" id="btn-export">Export</button>
          <div id="chart-viz">Visual Canvas</div>
          <div slot="empty" id="empty-viz">Custom Empty Notice</div>
          <div slot="legend" id="legend-viz">Series 1 | Series 2</div>
        </moul-chart-container>
      `)

      const headerSlot = container.shadowRoot?.querySelector(
        'slot[name="header"]',
      )
      const defaultSlot =
        container.shadowRoot?.querySelector('slot:not([name])')
      const legendSlot = container.shadowRoot?.querySelector(
        'slot[name="legend"]',
      )
      const emptySlot =
        container.shadowRoot?.querySelector('slot[name="empty"]')

      expect(headerSlot).toBeTruthy()
      expect(defaultSlot).toBeTruthy()
      expect(legendSlot).toBeTruthy()
      expect(emptySlot).toBeNull() // Not rendered while isEmpty = false

      // Switch to empty
      container.isEmpty = true
      await container.updateComplete

      expect(
        container.shadowRoot?.querySelector('slot[name="empty"]'),
      ).toBeTruthy()
      expect(container.shadowRoot?.querySelector('slot:not([name])')).toBeNull()
      // Header and legend slots must remain present during empty state
      expect(
        container.shadowRoot?.querySelector('slot[name="header"]'),
      ).toBeTruthy()
      expect(
        container.shadowRoot?.querySelector('slot[name="legend"]'),
      ).toBeTruthy()
    })

    it('dynamically handles insertion and removal of multiple slotted elements', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      // Add slotted header actions dynamically
      const btn1 = document.createElement('button')
      btn1.setAttribute('slot', 'header')
      btn1.textContent = 'Action 1'
      container.appendChild(btn1)

      const btn2 = document.createElement('button')
      btn2.setAttribute('slot', 'header')
      btn2.textContent = 'Action 2'
      container.appendChild(btn2)

      await container.updateComplete
      expect(container.querySelectorAll('[slot="header"]').length).toBe(2)

      // Remove one button
      btn1.remove()
      await container.updateComplete
      expect(container.querySelectorAll('[slot="header"]').length).toBe(1)
      expect(container.querySelector('[slot="header"]')?.textContent).toBe(
        'Action 2',
      )
    })

    it('silently ignores unrecognized slot names without layout corruption', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div slot="unrecognized-slot" id="orphan">Orphan Node</div>
          <div id="valid-default">Valid Default Node</div>
        </moul-chart-container>
      `)

      expect(container.querySelector('#orphan')).toBeTruthy()
      expect(container.querySelector('#valid-default')).toBeTruthy()

      // The shadow root does not project the orphan slot
      const orphanSlot = container.shadowRoot?.querySelector(
        'slot[name="unrecognized-slot"]',
      )
      expect(orphanSlot).toBeNull()
    })

    it('updates content viewport style height reactively', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container height="450"></moul-chart-container>
      `)

      expect(container.height).toBe(450)
      const contentEl = container.shadowRoot?.querySelector(
        '[part="content"]',
      ) as HTMLElement
      expect(contentEl?.style?.height).toBe('450px')

      container.height = 600
      await container.updateComplete
      expect(contentEl?.style?.height).toBe('600px')
      expect(container.getAttribute('height')).toBe('600')
    })
  })

  // =========================================================================
  // 5. Lifecycle Disconnect & Reconnect Under Observation
  // =========================================================================
  describe('Lifecycle: Disconnect & Reconnect Robustness', () => {
    it('disconnects ResizeObserver on element removal and resumes observation upon re-insertion', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      const events: ViewportResizeDetail[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        events.push((e as CustomEvent<ViewportResizeDetail>).detail)
      })

      triggerResize(container, { width: 500, height: 300 })
      await container.updateComplete
      expect(events.length).toBe(1)
      expect(events[0]).toEqual({ width: 500, height: 300, breakpoint: 'sm' })

      // Detach container
      const parent = container.parentElement!
      container.remove()

      // Resizes while disconnected update rect but observer is disconnected
      for (let i = 0; i < 10; i++) {
        triggerResize(container, { width: 600 + i * 10, height: 300 })
      }
      await container.updateComplete
      // Event count remains 1 while detached
      expect(events.length).toBe(1)

      // Re-attach container: hostConnected detects getBoundingClientRect changed to 690x300
      parent.appendChild(container)
      await container.updateComplete

      // Container caught up with the dimension mutation upon reconnection
      expect(events.length).toBe(2)
      expect(events[1]).toEqual({ width: 690, height: 300, breakpoint: 'sm' })
      expect(container.containerWidth).toBe(690)

      // Resizing after reconnection resumes active event dispatching
      triggerResize(container, { width: 950, height: 400 })
      await container.updateComplete
      expect(events.length).toBe(3)
      expect(events[2]).toEqual({ width: 950, height: 400, breakpoint: 'md' })
      expect(container.containerWidth).toBe(950)
      expect(container.breakpoint).toBe('md')
    })

    it('re-attaching with unchanged dimensions does not emit redundant events', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)

      let eventCount = 0
      container.addEventListener('viewport-resize', () => {
        eventCount++
      })

      triggerResize(container, { width: 600, height: 300 })
      await container.updateComplete
      expect(eventCount).toBe(1)

      const parent = container.parentElement!
      container.remove()
      await container.updateComplete

      // Re-attach without any dimension changes
      parent.appendChild(container)
      await container.updateComplete

      expect(eventCount).toBe(1) // No redundant event emitted!
    })

    it('survives 20 rapid connect/disconnect cycles without leaks or exceptions', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container></moul-chart-container>
      `)
      const parent = container.parentElement!

      for (let i = 0; i < 20; i++) {
        container.remove()
        expect(container.isConnected).toBe(false)
        parent.appendChild(container)
        expect(container.isConnected).toBe(true)
      }

      await container.updateComplete

      let fired = false
      container.addEventListener('viewport-resize', () => {
        fired = true
      })

      triggerResize(container, { width: 850, height: 350 })
      await container.updateComplete
      expect(fired).toBe(true)
      expect(container.breakpoint).toBe('md')
    })

    it('bubbles and composes viewport-resize across shadow boundaries', async () => {
      class ShadowWrapper extends HTMLElement {
        receivedInShadow = false
        connectedCallback() {
          const shadow = this.attachShadow({ mode: 'open' })
          shadow.innerHTML = `<moul-chart-container id="nested"></moul-chart-container>`
          this.addEventListener('viewport-resize', () => {
            this.receivedInShadow = true
          })
        }
      }

      const wrapperTag = 'shadow-wrapper-test'
      if (!customElements.get(wrapperTag)) {
        customElements.define(wrapperTag, ShadowWrapper)
      }

      const wrapper = document.createElement(wrapperTag) as ShadowWrapper
      document.body.appendChild(wrapper)

      let receivedInDocument = false
      document.addEventListener(
        'viewport-resize',
        () => {
          receivedInDocument = true
        },
        { once: true },
      )

      const nested = wrapper.shadowRoot!.querySelector(
        'moul-chart-container',
      ) as MoulChartContainer
      await nested.updateComplete

      triggerResize(nested, { width: 620, height: 320 })
      await nested.updateComplete

      expect(wrapper.receivedInShadow).toBe(true)
      expect(receivedInDocument).toBe(true)
    })
  })

  // =========================================================================
  // 6. Tooltip + Container Slotted Interaction & Pointer Jitter Prevention
  // =========================================================================
  describe('Tooltip + Container Slotted Interaction & Pointer Jitter Prevention', () => {
    it('survives 50 active container resizes while slotted tooltip updates position without coordinate or popover corruption', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div id="chart-viewport" style="width:100%;height:100%;">Chart Canvas</div>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!
      expect(tooltip).toBeTruthy()

      const resizeEvents: ViewportResizeDetail[] = []
      container.addEventListener('viewport-resize', (e: Event) => {
        resizeEvents.push((e as CustomEvent<ViewportResizeDetail>).detail)
      })

      // Perform 50 resizes across various widths and heights
      for (let i = 1; i <= 50; i++) {
        const w = 350 + i * 20 // 370 to 1350
        const h = 250 + (i % 10) * 15
        triggerResize(container, { width: w, height: h })
        await container.updateComplete

        // Reposition slotted tooltip at center of current container
        const posX = Math.round(w / 2)
        const posY = Math.round(h / 2)
        tooltip.show(posX, posY, `Point ${i}`, `${i * 10}`)
        await tooltip.updateComplete

        expect(tooltip.isOpen).toBe(true)
        expect(tooltip.matches(':popover-open')).toBe(true)
        expect(tooltip.style.left).toBe('0px')
        expect(tooltip.style.top).toBe('0px')
        expect(tooltip.style.transform).toContain(
          `translate3d(${posX}px, ${posY}px, 0)`,
        )
      }

      expect(resizeEvents.length).toBe(50)
      expect(container.breakpoint).toBe('xl')
    })

    it('handles 100 concurrent rapid resize steps interleaved with rapid show/hide toggles without race condition or state desync', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!

      for (let i = 0; i < 100; i++) {
        const isShow = i % 2 === 0
        const w = isShow ? 800 : 450
        triggerResize(container, { width: w, height: 300 })

        if (isShow) {
          tooltip.show({
            label: `Cycle ${i}`,
            value: `${i * 100}`,
            x: 100 + i,
            y: 150,
            payload: [
              { name: 'Series A', value: i * 50, color: '#f00' },
              { name: 'Series B', value: i * 75, color: '#0f0' },
            ],
          })
        } else {
          tooltip.hide()
        }
      }

      await awaitNestedUpdates(container)

      // Last iteration was i=99 (odd -> hide)
      expect(tooltip.isOpen).toBe(false)
      expect(tooltip.matches(':popover-open')).toBe(false)

      // Show once more to verify healthy recovery
      tooltip.show(200, 100, 'Recovered', '999')
      await awaitNestedUpdates(container)
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.matches(':popover-open')).toBe(true)
    })

    it('preserves slotted tooltip instance and state across rapid is-empty toggling', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div id="chart-content">Active Canvas</div>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!
      tooltip.show(150, 120, 'Data A', '100')
      await tooltip.updateComplete
      expect(tooltip.isOpen).toBe(true)

      // Toggle container to empty
      for (let i = 0; i < 20; i++) {
        container.isEmpty = i % 2 === 0
        await container.updateComplete
        // Light DOM identity must not change
        expect(container.querySelector('#tooltip')).toBe(tooltip)
      }

      // Restore to not empty and update tooltip position
      container.isEmpty = false
      await container.updateComplete

      tooltip.show(250, 180, 'Data B', '200')
      await tooltip.updateComplete
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.style.transform).toContain('translate3d(250px, 180px, 0)')
      const label = tooltip.shadowRoot?.querySelector('[part="label"]')
      expect(label?.textContent).toBe('Data B')
    })

    it('enforces pointer-events: none on host and container to prevent pointer jitter over underlying chart geometries', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <div id="chart-interactive-layer" style="position:relative; width:500px; height:300px;">
            <button id="datapoint-btn" style="position:absolute; left:100px; top:100px; width:20px; height:20px;">Point</button>
          </div>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!
      const btn = container.querySelector<HTMLElement>('#datapoint-btn')!

      // Verify CSS declaration contains pointer-events: none
      const stylesText = Array.isArray(chartTooltipStyles)
        ? chartTooltipStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((chartTooltipStyles as any).cssText ?? String(chartTooltipStyles))

      expect(stylesText).toMatch(/:host\s*{[^}]*pointer-events:\s*none/)
      expect(stylesText).toMatch(
        /\[part="container"\][^}]*pointer-events:\s*none/,
      )

      // Show tooltip directly over the button
      tooltip.show(100, 100, 'Point Overlap', 'Value 1')
      await tooltip.updateComplete

      // Emulate pointer tracking: underlying interactive elements receive events without tooltip stealing them
      let btnPointerEnterCount = 0
      let btnPointerLeaveCount = 0
      let btnClickCount = 0

      btn.addEventListener('pointerenter', () => {
        btnPointerEnterCount++
      })
      btn.addEventListener('pointerleave', () => {
        btnPointerLeaveCount++
      })
      btn.addEventListener('click', () => {
        btnClickCount++
      })

      // Dispatch pointer movements over the button while tooltip is open on top of it
      btn.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      expect(btnPointerEnterCount).toBe(1)
      expect(btnPointerLeaveCount).toBe(0)

      // Clicking through: dispatch event to button
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(btnClickCount).toBe(1)

      // Tooltip must NOT have any pointer event handlers intercepting or capturing clicks
      let tooltipClicked = false
      tooltip.addEventListener('click', () => {
        tooltipClicked = true
      })

      // If a click hits the tooltip container element, it bubbles transparently without stopping propagation
      const tooltipContainer =
        tooltip.shadowRoot?.querySelector('[part="container"]')
      expect(tooltipContainer).toBeTruthy()
      tooltipContainer?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true }),
      )
      expect(tooltipClicked).toBe(true) // Event bubbles cleanly through shadow DOM
    })

    it('renders multi-series tooltip inside container through rapid breakpoint transitions', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!
      const multiPayload = [
        { name: 'Revenue', value: '$12,400', color: 'var(--color-chart-1)' },
        { name: 'Expenses', value: '$8,200', color: 'var(--color-chart-2)' },
        { name: 'Profit', value: '$4,200', color: 'var(--color-chart-3)' },
      ]

      tooltip.show({
        label: 'Q3 Financials',
        x: 200,
        y: 100,
        payload: multiPayload,
      })
      await tooltip.updateComplete

      // Check items render
      let items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
      expect(items?.length).toBe(3)

      // Rapidly transition container across all breakpoints: xs, sm, md, lg, xl
      const widths = [360, 640, 850, 1150, 1400]
      for (const w of widths) {
        triggerResize(container, { width: w, height: 350 })
        await container.updateComplete

        items = tooltip.shadowRoot?.querySelectorAll('.tooltip-item')
        expect(items?.length).toBe(3)
        const titleEl = tooltip.shadowRoot?.querySelector('[part="title"]')
        expect(titleEl?.textContent).toBe('Q3 Financials')
      }
    })

    it('maintains integrity when container with an open slotted tooltip is disconnected and reconnected to DOM', async () => {
      const container = await mount<MoulChartContainer>(html`
        <moul-chart-container>
          <moul-chart-tooltip id="tooltip"></moul-chart-tooltip>
        </moul-chart-container>
      `)

      const tooltip = container.querySelector<MoulChartTooltip>('#tooltip')!
      tooltip.show(120, 80, 'Detached Point', '555')
      await tooltip.updateComplete
      expect(tooltip.isOpen).toBe(true)

      const parent = container.parentElement!
      container.remove()
      expect(container.isConnected).toBe(false)
      expect(tooltip.isConnected).toBe(false)

      // Re-append to DOM
      parent.appendChild(container)
      await container.updateComplete
      await tooltip.updateComplete

      expect(container.isConnected).toBe(true)
      expect(tooltip.isConnected).toBe(true)
      expect(tooltip.hasAttribute('popover')).toBe(true)
      expect(tooltip.isOpen).toBe(true)

      // Can still hide and show after reconnection
      tooltip.hide()
      await tooltip.updateComplete
      expect(tooltip.isOpen).toBe(false)

      tooltip.show(300, 150, 'Reconnected Point', '777')
      await tooltip.updateComplete
      expect(tooltip.isOpen).toBe(true)
      expect(tooltip.style.transform).toContain('translate3d(300px, 150px, 0)')
    })
  })
})
