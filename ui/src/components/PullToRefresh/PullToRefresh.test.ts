import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './PullToRefresh'
import type {
  MoulPullToRefresh,
  PullToRefreshEventDetail,
} from './PullToRefresh'

const part = (el: MoulPullToRefresh, name: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!

const offset = (el: MoulPullToRefresh): string =>
  el.style.getPropertyValue('--_pull-y') || '0px'

const liveRegion = (el: MoulPullToRefresh): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>('[role="status"]')!

let clock = 1000

function pointer(type: string, target: EventTarget, clientY: number): void {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'touch',
    clientX: 100,
    clientY,
    bubbles: true,
    composed: true,
  })
  Object.defineProperty(event, 'timeStamp', { value: clock })
  target.dispatchEvent(event)
}

/** Presses on `target`, moves through the vertical `points` 16 ms apart and lets go after `hold` ms. */
function pull(
  target: EventTarget,
  points: number[],
  { release = true, hold = 200 } = {},
): void {
  pointer('pointerdown', target, points[0])
  for (const y of points.slice(1)) {
    clock += 16
    pointer('pointermove', window, y)
  }
  if (!release) return
  clock += hold
  pointer('pointermove', window, points[points.length - 1])
  pointer('pointerup', window, points[points.length - 1])
}

async function mount(
  template = html`<moul-pull-to-refresh style="height: 200px">
    <ul><li>One</li><li>Two</li></ul>
  </moul-pull-to-refresh>`,
): Promise<MoulPullToRefresh> {
  return fixture<MoulPullToRefresh>(template)
}

/** Lets pending promises and the minimum spinner time run out. */
async function settle(el: MoulPullToRefresh): Promise<void> {
  await vi.advanceTimersByTimeAsync(600)
  await el.updateComplete
}

describe('<moul-pull-to-refresh>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(async () => {
    motion?.restore()
    motion = null
    vi.useRealTimers()
    // A drag swallows the click that ends it until a zero-delay timer runs;
    // let it run so the next test's clicks get through.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it('wraps its content in a scroll container with an indicator above it', async () => {
    const el = await mount()
    expect(customElements.get('moul-pull-to-refresh')).toBeDefined()
    expect(part(el, 'scroller').contains(part(el, 'content'))).toBe(true)
    expect(part(el, 'indicator').getAttribute('aria-hidden')).toBe('true')
    expect(part(el, 'indicator').textContent).toContain('Pull to refresh')
    expect(el.threshold).toBe(72)
  })

  it('pulls with resistance, arms past the threshold and refreshes on release', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const el = await mount()
    let finish!: () => void
    const onRefresh = vi.fn((event: Event) => {
      ;(event as CustomEvent<PullToRefreshEventDetail>).detail.waitUntil(
        new Promise<void>((resolve) => {
          finish = resolve
        }),
      )
    })
    el.addEventListener('refresh', onRefresh)

    pull(part(el, 'content'), [0, 10, 60, 100], { release: false })
    await el.updateComplete
    // Half the pointer's travel past the start.
    expect(offset(el)).toBe('50px')
    expect(part(el, 'indicator').textContent).toContain('Pull to refresh')

    clock += 16
    pointer('pointermove', window, 200)
    await el.updateComplete
    expect(offset(el)).toBe('100px')
    expect(part(el, 'indicator').hasAttribute('data-armed')).toBe(true)
    expect(part(el, 'indicator').textContent).toContain('Release to refresh')

    clock += 200
    pointer('pointermove', window, 200)
    pointer('pointerup', window, 200)
    await el.updateComplete
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(el.isRefreshing).toBe(true)
    expect(el.hasAttribute('is-refreshing')).toBe(true)
    expect(part(el, 'indicator').querySelector('moul-spinner')).not.toBeNull()
    expect(liveRegion(el).textContent?.trim()).toBe('Refreshing…')

    // The minimum time passes, but the work is still going.
    await settle(el)
    expect(el.isRefreshing).toBe(true)

    finish()
    await settle(el)
    expect(el.isRefreshing).toBe(false)
    expect(liveRegion(el).textContent?.trim()).toBe('Updated')
  })

  it('springs back without refreshing when let go short of the threshold', async () => {
    const el = await mount()
    const onRefresh = vi.fn()
    el.addEventListener('refresh', onRefresh)
    pull(part(el, 'content'), [0, 10, 60, 120])
    await el.updateComplete
    expect(onRefresh).not.toHaveBeenCalled()
    expect(el.isRefreshing).toBe(false)
    // The spring is under way from where it was let go.
    expect(offset(el)).not.toBe('0px')
  })

  it('leaves scrolled content, upward drags and text fields to the browser', async () => {
    const el = await mount(
      html`<moul-pull-to-refresh style="height: 200px">
        <input aria-label="Filter" />
        <p>Rows</p>
      </moul-pull-to-refresh>`,
    )
    const scroller = part(el, 'scroller')

    pull(part(el, 'content'), [100, 90, 40])
    expect(offset(el)).toBe('0px')

    Object.defineProperty(scroller, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 40,
    })
    pull(part(el, 'content'), [0, 10, 200])
    expect(offset(el)).toBe('0px')
    scroller.scrollTop = 0

    // happy-dom leaves the slot out of a slotted node's event path; add the scroller.
    const input = el.querySelector('input')!
    const down = new PointerEvent('pointerdown', {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientY: 0,
      bubbles: true,
      composed: true,
    })
    const path = down.composedPath.bind(down)
    Object.defineProperty(down, 'composedPath', {
      value: () => [input, scroller, ...path()],
    })
    scroller.dispatchEvent(down)
    clock += 16
    pointer('pointermove', window, 10)
    clock += 16
    pointer('pointermove', window, 200)
    pointer('pointerup', window, 200)
    expect(offset(el)).toBe('0px')
  })

  describe('keyboard and screen readers', () => {
    it('starts with a focus-revealed Refresh button that runs refresh()', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      const el = await mount()
      const button = part(el, 'refresh-button') as HTMLButtonElement
      expect(button.tagName).toBe('BUTTON')
      expect(button.textContent?.trim()).toBe('Refresh')
      // First in the scroll container, so Tab reaches it before the content.
      expect(part(el, 'scroller').firstElementChild).toBe(button)

      const onRefresh = vi.fn()
      el.addEventListener('refresh', onRefresh)
      button.click()
      await el.updateComplete
      expect(onRefresh).toHaveBeenCalledTimes(1)
      expect(liveRegion(el).getAttribute('aria-live')).toBe('polite')
      expect(liveRegion(el).textContent?.trim()).toBe('Refreshing…')
      expect(part(el, 'indicator').querySelector('moul-spinner')).not.toBeNull()

      await settle(el)
      expect(liveRegion(el).textContent?.trim()).toBe('Updated')
    })

    it('runs one refresh at a time and uses its own labels', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      const el = await mount(
        html`<moul-pull-to-refresh
          refresh-label="Reload"
          refreshing-label="Loading"
          done-label="Done"
        ></moul-pull-to-refresh>`,
      )
      expect(part(el, 'refresh-button').textContent?.trim()).toBe('Reload')
      const onRefresh = vi.fn()
      el.addEventListener('refresh', onRefresh)
      const first = el.refresh()
      expect(el.refresh()).toBe(first)
      await el.updateComplete
      expect(onRefresh).toHaveBeenCalledTimes(1)
      expect(liveRegion(el).textContent?.trim()).toBe('Loading')
      await settle(el)
      await first
      expect(liveRegion(el).textContent?.trim()).toBe('Done')
    })

    it('disables pulling and the button with is-disabled', async () => {
      const el = await mount(
        html`<moul-pull-to-refresh is-disabled></moul-pull-to-refresh>`,
      )
      expect((part(el, 'refresh-button') as HTMLButtonElement).disabled).toBe(
        true,
      )
      pull(part(el, 'content'), [0, 10, 200])
      expect(offset(el)).toBe('0px')
    })
  })

  describe('reduced motion', () => {
    it('snaps open and closed instead of springing', async () => {
      motion = mockReducedMotion(true)
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      const el = await mount()

      pull(part(el, 'content'), [0, 10, 60, 120])
      expect(offset(el)).toBe('0px')

      pull(part(el, 'content'), [0, 10, 100, 200])
      await el.updateComplete
      expect(el.isRefreshing).toBe(true)
      expect(offset(el)).toBe('72px')

      await settle(el)
      expect(el.isRefreshing).toBe(false)
      expect(offset(el)).toBe('0px')
    })
  })
})
