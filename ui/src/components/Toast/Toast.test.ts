import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '../Button/Button'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Toast'
import './ToastQueue'
import type { MoulToast } from './Toast'
import { type MoulToastRegion, toastQueue } from './ToastQueue'

let clock = 1000

function pointer(
  type: string,
  target: EventTarget,
  clientX: number,
  clientY = 10,
): void {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'touch',
    clientX,
    clientY,
    bubbles: true,
    composed: true,
  })
  Object.defineProperty(event, 'timeStamp', { value: clock })
  target.dispatchEvent(event)
}

/** Presses on `target` at x 0, then moves through `xs` at `step` ms apart, and lets go. */
function swipe(target: EventTarget, xs: number[], step = 16): void {
  pointer('pointerdown', target, 0)
  for (const x of xs) {
    clock += step
    pointer('pointermove', window, x)
  }
  pointer('pointerup', window, xs[xs.length - 1])
}

/** Gives a toast a measurable width, which happy-dom leaves at 0. */
function sized<T extends HTMLElement>(el: T, width = 300): T {
  vi.spyOn(el as HTMLElement, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 64,
    width,
    height: 64,
    toJSON: () => ({}),
  } as DOMRect)
  return el
}

function dismissed(toast: MoulToast): Promise<void> {
  return new Promise((resolve) =>
    toast.addEventListener('dismiss', () => resolve(), { once: true }),
  )
}

describe('<moul-toast>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.useRealTimers()
    vi.restoreAllMocks()
    toastQueue.isStacked = false
    document.querySelector('moul-toast-region')?.remove()
  })

  describe('swipe to dismiss', () => {
    it('flies a toast swiped past 40% of its width away and dismisses it', async () => {
      const toast = sized(
        await fixture<MoulToast>(html`<moul-toast title="Saved"></moul-toast>`),
      )
      const gone = dismissed(toast)
      // Slow: ends held still, so only the distance counts.
      swipe(toast, [20, 60, 140, 140], 60)
      expect(toast.hasAttribute('data-swiping')).toBe(true)
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('140px')
      expect(Number(toast.style.getPropertyValue('--_swipe-fade'))).toBeCloseTo(
        140 / 300,
      )
      await gone
      expect(toast.isOpen).toBe(false)
      expect(
        Number.parseFloat(toast.style.getPropertyValue('--_swipe-x')),
      ).toBe(332)
    })

    it('flies a short, fast flick away in its direction', async () => {
      const toast = sized(
        await fixture<MoulToast>(html`<moul-toast title="Saved"></moul-toast>`),
      )
      const gone = dismissed(toast)
      swipe(toast, [-10, -30, -50])
      await gone
      expect(
        Number.parseFloat(toast.style.getPropertyValue('--_swipe-x')),
      ).toBe(-332)
    })

    it('springs a short swipe back and resumes the timer', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
      const toast = sized(
        await fixture<MoulToast>(
          html`<moul-toast title="Saved" duration="1000"></moul-toast>`,
        ),
      )
      swipe(toast, [20, 60, 60], 80)
      expect(toast.isPaused).toBe(true)
      // The hold that dragging puts on the timer outlasts its duration.
      await vi.advanceTimersByTimeAsync(1500)
      expect(toast.isOpen).toBe(true)

      vi.useRealTimers()
      await vi.waitFor(
        () => expect(toast.hasAttribute('data-swiping')).toBe(false),
        { timeout: 2000 },
      )
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('0px')
      expect(toast.isPaused).toBe(false)
      await vi.waitFor(() => expect(toast.isOpen).toBe(false), {
        timeout: 2000,
      })
    })

    it('cancels a swipe flicked back toward the middle', async () => {
      motion = mockReducedMotion(true)
      const toast = sized(
        await fixture<MoulToast>(html`<moul-toast title="Saved"></moul-toast>`),
      )
      const onDismiss = vi.fn()
      toast.addEventListener('dismiss', onDismiss)
      // Out past 40% at an even pace, then a quick flick back.
      pointer('pointerdown', toast, 0)
      for (const x of [80, 160, 250]) {
        clock += 60
        pointer('pointermove', window, x)
      }
      for (const x of [220, 190, 160]) {
        clock += 16
        pointer('pointermove', window, x)
      }
      pointer('pointerup', window, 160)
      await toast.updateComplete
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('0px')
      expect(toast.isOpen).toBe(true)
      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('ignores swipes on a closed toast and leaves taps to its buttons', async () => {
      const toast = sized(
        await fixture<MoulToast>(
          html`<moul-toast title="Saved" duration="0"
            ><button slot="action">Undo</button></moul-toast
          >`,
        ),
      )
      const onAction = vi.fn()
      toast.addEventListener('action', (e) => {
        e.preventDefault()
        onAction()
      })
      const button = toast.querySelector('button') as HTMLButtonElement
      // Let the click guard from the previous test's drag expire.
      await new Promise((resolve) => setTimeout(resolve, 0))
      // A press that barely moves is a tap.
      pointer('pointerdown', button, 0)
      pointer('pointermove', window, 2)
      pointer('pointerup', window, 2)
      button.click()
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(toast.hasAttribute('data-swiping')).toBe(false)

      toast.isOpen = false
      await toast.updateComplete
      swipe(toast, [40, 120, 200])
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('')
    })
  })

  describe('undo: action and countdown', () => {
    it('fires a cancelable action event for a button in the action slot, then closes', async () => {
      const toast = await fixture<MoulToast>(
        html`<moul-toast id="t1" title="3 rows deleted" duration="0">
          <moul-button slot="action" size="sm"><span>Undo</span></moul-button>
          <span slot="action" class="note">not a control</span>
        </moul-toast>`,
      )
      const details: unknown[] = []
      toast.addEventListener('action', (e) =>
        details.push((e as CustomEvent).detail),
      )

      ;(toast.querySelector('.note') as HTMLElement).click()
      expect(details).toEqual([])

      const kept = (e: Event) => e.preventDefault()
      toast.addEventListener('action', kept, { once: true })
      ;(toast.querySelector('moul-button') as HTMLElement).click()
      expect(details).toEqual([{ id: 't1' }])
      await toast.updateComplete
      expect(toast.isOpen).toBe(true)

      const gone = dismissed(toast)
      ;(toast.querySelector('moul-button') as HTMLElement).click()
      expect(details).toHaveLength(2)
      expect(toast.isOpen).toBe(false)
      await gone
    })

    it('adds an action button and countdown through toastQueue.add()', async () => {
      motion = mockReducedMotion(true)
      const onAction = vi.fn()
      const id = toastQueue.add({
        title: '3 rows deleted',
        duration: 8000,
        showCountdown: true,
        action: { label: 'Undo', onAction },
      })
      const toast = document.getElementById(id) as MoulToast
      await toast.updateComplete
      expect(toast.showCountdown).toBe(true)
      expect(toast.hasAttribute('show-countdown')).toBe(true)
      const countdown = toast.shadowRoot?.querySelector('[part="countdown"]')
      expect(countdown?.getAttribute('aria-hidden')).toBe('true')
      expect(toast.style.getPropertyValue('--_toast-duration')).toBe('8000ms')

      const button = toast.querySelector('moul-button[slot="action"]')
      expect(button?.textContent).toBe('Undo')
      const gone = dismissed(toast)
      ;(button as HTMLElement).click()
      expect(onAction).toHaveBeenCalledTimes(1)
      await gone
      expect(document.getElementById(id)).toBeNull()
    })

    it('draws no countdown for a toast that stays', async () => {
      const toast = await fixture<MoulToast>(
        html`<moul-toast title="Pinned" duration="0" show-countdown></moul-toast>`,
      )
      expect(toast.shadowRoot?.querySelector('[part="countdown"]')).toBeNull()
    })
  })

  describe('keyboard and screen readers', () => {
    it('pauses the timer and countdown while keyboard focus is inside', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
      const toast = await fixture<MoulToast>(
        html`<moul-toast title="Deleted" duration="1000" show-countdown
          ><button slot="action">Undo</button></moul-toast
        >`,
      )
      const button = toast.querySelector('button') as HTMLButtonElement

      await vi.advanceTimersByTimeAsync(600)
      button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(toast.isPaused).toBe(true)
      expect(toast.hasAttribute('data-paused')).toBe(true)
      await vi.advanceTimersByTimeAsync(5000)
      expect(toast.isOpen).toBe(true)

      // Focus moving to the dismiss button stays inside the toast.
      const dismiss = toast.shadowRoot?.querySelector(
        '[part="dismiss-button"]',
      ) as HTMLButtonElement
      expect(dismiss.getAttribute('aria-label')).toBe('Dismiss toast')
      button.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: toast }),
      )
      expect(toast.isPaused).toBe(true)

      button.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
      )
      expect(toast.isPaused).toBe(false)
      expect(toast.hasAttribute('data-paused')).toBe(false)
      await vi.advanceTimersByTimeAsync(399)
      expect(toast.isOpen).toBe(true)
      await vi.advanceTimersByTimeAsync(1)
      expect(toast.isOpen).toBe(false)
    })

    it('keeps the dismiss button as the keyboard path and announces as a live region', async () => {
      const toast = await fixture<MoulToast>(
        html`<moul-toast title="Build failed" tone="error" duration="0"></moul-toast>`,
      )
      expect(toast.getAttribute('role')).toBe('alert')
      expect(toast.getAttribute('aria-live')).toBe('assertive')
      const dismiss = toast.shadowRoot?.querySelector(
        '[part="dismiss-button"]',
      ) as HTMLButtonElement
      expect(dismiss.localName).toBe('button')
      const gone = dismissed(toast)
      dismiss.click()
      await gone
      expect(toast.isOpen).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('removes a swiped toast at once instead of flying it away', async () => {
      motion = mockReducedMotion(true)
      const id = toastQueue.add({ title: 'Saved', duration: 0 })
      const toast = sized(document.getElementById(id) as MoulToast)
      await toast.updateComplete
      const gone = dismissed(toast)
      // The finger is still followed.
      pointer('pointerdown', toast, 0)
      clock += 16
      pointer('pointermove', window, 90)
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('90px')
      clock += 16
      pointer('pointermove', window, 200)
      pointer('pointerup', window, 200)
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('332px')
      await gone
      expect(document.getElementById(id)).toBeNull()
    })

    it('snaps a short swipe straight back', async () => {
      motion = mockReducedMotion(true)
      const toast = sized(
        await fixture<MoulToast>(html`<moul-toast title="Saved"></moul-toast>`),
      )
      swipe(toast, [20, 50, 50], 80)
      await toast.updateComplete
      expect(toast.style.getPropertyValue('--_swipe-x')).toBe('0px')
      expect(toast.hasAttribute('data-swiping')).toBe(false)
    })
  })
})

describe('<moul-toast-region is-stacked>', () => {
  afterEach(() => {
    toastQueue.isStacked = false
    document.querySelector('moul-toast-region')?.remove()
  })

  it('places the toasts behind the newest one as a deck', async () => {
    toastQueue.isStacked = true
    const ids = ['a', 'b', 'c', 'd', 'e'].map((title) =>
      toastQueue.add({ title, duration: 0 }),
    )
    const region = document.querySelector(
      'moul-toast-region',
    ) as MoulToastRegion
    await region.updateComplete
    await Promise.resolve()
    expect(region.isStacked).toBe(true)
    expect(region.hasAttribute('is-stacked')).toBe(true)

    const [a, b, c, d, e] = ids.map(
      (id) => document.getElementById(id) as MoulToast,
    )
    const prop = (el: HTMLElement, name: string) =>
      el.style.getPropertyValue(name)
    // The front toast sits in its own slot.
    expect(prop(e, '--_stack-y')).toBe('')
    // Two behind it peek out, smaller and dimmer.
    expect(prop(d, '--_stack-shrink')).toBe('0.05')
    expect(prop(d, '--_stack-dim')).toBe('0.2')
    expect(prop(c, '--_stack-shrink')).toBe('0.1')
    expect(prop(c, '--_stack-dim')).toBe('0.4')
    // The rest wait out of sight.
    expect(prop(b, '--_stack-dim')).toBe('1')
    expect(prop(a, '--_stack-dim')).toBe('1')
    // Bottom decks peek upward, 12px a card.
    expect(Number.parseFloat(prop(d, '--_stack-y'))).toBe(
      e.offsetTop - 12 - d.offsetTop,
    )

    region.placement = 'top-end'
    await region.updateComplete
    expect(Number.parseFloat(prop(d, '--_stack-y'))).toBe(
      e.offsetTop + e.offsetHeight + 12 - (d.offsetTop + d.offsetHeight),
    )

    // Removing the front promotes the next toast.
    region.removeToast(e)
    expect(prop(d, '--_stack-y')).toBe('')
    expect(prop(c, '--_stack-dim')).toBe('0.2')

    // Fanned out by the pointer or focus, the deck holds every timer.
    region.dispatchEvent(new PointerEvent('pointerenter'))
    expect([a, b, c, d].every((toast) => toast.isPaused)).toBe(true)
    region.dispatchEvent(new PointerEvent('pointerleave'))
    expect([a, b, c, d].some((toast) => toast.isPaused)).toBe(false)
    a.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(d.isPaused).toBe(true)
    a.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    )
    expect(d.isPaused).toBe(false)

    toastQueue.isStacked = false
    await region.updateComplete
    expect(region.hasAttribute('is-stacked')).toBe(false)
    region.dispatchEvent(new PointerEvent('pointerenter'))
    expect(d.isPaused).toBe(false)
    for (const toast of [a, b, c, d]) {
      expect(prop(toast, '--_stack-y')).toBe('')
      expect(prop(toast, '--_stack-dim')).toBe('')
    }
  })
})
