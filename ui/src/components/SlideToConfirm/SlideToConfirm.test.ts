import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './SlideToConfirm'
import type { MoulSlideToConfirm } from './SlideToConfirm'

const part = (el: MoulSlideToConfirm, name: string): HTMLElement =>
  el.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!

/** Lays the track out 300 px wide with a 44 px handle inset 4 px: 248 px of travel. */
function layOut(el: MoulSlideToConfirm): void {
  Object.defineProperty(part(el, 'track'), 'clientWidth', {
    configurable: true,
    value: 300,
  })
  const handle = part(el, 'handle')
  Object.defineProperty(handle, 'offsetWidth', {
    configurable: true,
    value: 44,
  })
  Object.defineProperty(handle, 'offsetLeft', { configurable: true, value: 4 })
}

const offset = (el: MoulSlideToConfirm): string =>
  part(el, 'track').style.getPropertyValue('--_drag-x') || '0px'

let clock = 1000

function pointer(type: string, target: EventTarget, clientX: number): void {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'mouse',
    clientX,
    clientY: 20,
    bubbles: true,
    composed: true,
  })
  Object.defineProperty(event, 'timeStamp', { value: clock })
  target.dispatchEvent(event)
}

/** Drags the handle through `points` (x, 16 ms apart), then holds `hold` ms and lets go. */
function dragX(el: MoulSlideToConfirm, points: number[], hold = 200): void {
  pointer('pointerdown', part(el, 'handle'), points[0])
  for (const x of points.slice(1)) {
    clock += 16
    pointer('pointermove', window, x)
  }
  clock += hold
  pointer('pointermove', window, points[points.length - 1])
  pointer('pointerup', window, points[points.length - 1])
}

function key(el: MoulSlideToConfirm, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  part(el, 'handle').dispatchEvent(event)
  return event
}

describe('<moul-slide-to-confirm>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
  })

  it('renders a track with a slider handle named by its label', async () => {
    const el = await fixture<MoulSlideToConfirm>(
      html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
    )
    expect(customElements.get('moul-slide-to-confirm')).toBeDefined()
    const handle = part(el, 'handle')
    expect(handle.getAttribute('role')).toBe('slider')
    expect(handle.getAttribute('aria-label')).toBe('Slide to confirm')
    expect(handle.getAttribute('aria-valuemin')).toBe('0')
    expect(handle.getAttribute('aria-valuemax')).toBe('100')
    expect(handle.getAttribute('aria-valuenow')).toBe('0')
    expect(handle.getAttribute('aria-valuetext')).toBe('0%')
    expect(handle.tabIndex).toBe(0)
    expect(part(el, 'label').getAttribute('aria-hidden')).toBe('true')
    expect(part(el, 'label').textContent?.trim()).toBe('Slide to confirm')
    expect(el.tone).toBe('primary')
  })

  it('falls back to the primary tone for an unknown one', async () => {
    const el = await fixture<MoulSlideToConfirm>(
      html`<moul-slide-to-confirm tone="nope"></moul-slide-to-confirm>`,
    )
    await el.updateComplete
    expect(el.tone).toBe('primary')
  })

  describe('keyboard and screen readers', () => {
    it('moves a quarter per arrow key and confirms at the end', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm label="Slide to delete" confirmed-label="Deleted"></moul-slide-to-confirm>`,
      )
      layOut(el)
      const onConfirm = vi.fn()
      el.addEventListener('confirm', onConfirm)
      const handle = part(el, 'handle')

      expect(key(el, 'ArrowRight').defaultPrevented).toBe(true)
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('25')
      expect(handle.getAttribute('aria-valuetext')).toBe('25%')
      key(el, 'ArrowUp')
      key(el, 'ArrowLeft')
      key(el, 'ArrowRight')
      key(el, 'ArrowRight')
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('75')
      expect(onConfirm).not.toHaveBeenCalled()

      key(el, 'ArrowRight')
      await el.updateComplete
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(el.isConfirmed).toBe(true)
      expect(el.hasAttribute('is-confirmed')).toBe(true)
      expect(handle.getAttribute('aria-valuenow')).toBe('100')
      expect(handle.getAttribute('aria-valuetext')).toBe('Deleted')
      expect(part(el, 'label').textContent?.trim()).toBe('Deleted')

      // Once confirmed, keys no longer move it.
      key(el, 'Home')
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('100')
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('confirms with End, and returns with Home and Escape', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      const handle = part(el, 'handle')
      key(el, 'ArrowRight')
      key(el, 'ArrowRight')
      key(el, 'Home')
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('0')

      // Escape at the start is left for a surrounding dialog.
      const outside = vi.fn()
      el.addEventListener('keydown', outside)
      key(el, 'Escape')
      expect(outside).toHaveBeenCalledTimes(1)

      key(el, 'ArrowRight')
      const escapeKey = key(el, 'Escape')
      await el.updateComplete
      expect(escapeKey.defaultPrevented).toBe(true)
      expect(outside).toHaveBeenCalledTimes(2)
      expect(handle.getAttribute('aria-valuenow')).toBe('0')

      const onConfirm = vi.fn()
      el.addEventListener('confirm', onConfirm)
      key(el, 'End')
      await el.updateComplete
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(el.isConfirmed).toBe(true)
    })

    it('goes back to the start when focus leaves before confirming', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      const handle = part(el, 'handle')
      key(el, 'ArrowRight')
      key(el, 'ArrowRight')
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('50')
      handle.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      await el.updateComplete
      expect(handle.getAttribute('aria-valuenow')).toBe('0')
    })

    it('takes no keys and leaves the tab order while disabled', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm is-disabled></moul-slide-to-confirm>`,
      )
      layOut(el)
      const handle = part(el, 'handle')
      expect(handle.tabIndex).toBe(-1)
      expect(handle.getAttribute('aria-disabled')).toBe('true')
      expect(key(el, 'End').defaultPrevented).toBe(false)
      dragX(el, [10, 20, 100, 260])
      await el.updateComplete
      expect(el.isConfirmed).toBe(false)
      expect(offset(el)).toBe('0px')
    })

    it('shows a spinner and is busy while pending, and reset() starts over', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      layOut(el)
      key(el, 'End')
      el.isPending = true
      await el.updateComplete
      const handle = part(el, 'handle')
      expect(handle.getAttribute('aria-busy')).toBe('true')
      expect(handle.querySelector('moul-spinner')).not.toBeNull()

      el.reset()
      await el.updateComplete
      expect(el.isConfirmed).toBe(false)
      expect(el.isPending).toBe(false)
      expect(handle.getAttribute('aria-busy')).toBe('false')
      expect(handle.getAttribute('aria-valuenow')).toBe('0')
      expect(handle.querySelector('moul-spinner')).toBeNull()
    })
  })

  describe('dragging', () => {
    it('confirms when the handle is let go near the end', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      layOut(el)
      const onConfirm = vi.fn()
      el.addEventListener('confirm', onConfirm)

      pointer('pointerdown', part(el, 'handle'), 20)
      clock += 16
      pointer('pointermove', window, 30)
      clock += 16
      pointer('pointermove', window, 144)
      await el.updateComplete
      expect(offset(el)).toBe('124px')
      expect(part(el, 'handle').getAttribute('aria-valuenow')).toBe('50')
      expect(part(el, 'track').style.getPropertyValue('--_progress')).toBe(
        '0.5',
      )

      clock += 200
      pointer('pointermove', window, 250)
      pointer('pointerup', window, 250)
      await el.updateComplete
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(el.isConfirmed).toBe(true)
      expect(part(el, 'handle').getAttribute('aria-valuenow')).toBe('100')
    })

    it('springs back without confirming when let go short of the end', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      layOut(el)
      const onConfirm = vi.fn()
      el.addEventListener('confirm', onConfirm)
      dragX(el, [20, 30, 80, 140])
      await el.updateComplete
      expect(onConfirm).not.toHaveBeenCalled()
      expect(el.isConfirmed).toBe(false)
      expect(part(el, 'handle').getAttribute('aria-valuenow')).toBe('0')
      // The spring is under way from where it was let go.
      expect(offset(el)).not.toBe('0px')
    })

    it('starts at the end when is-confirmed is set in markup', async () => {
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm is-confirmed></moul-slide-to-confirm>`,
      )
      expect(part(el, 'handle').getAttribute('aria-valuenow')).toBe('100')
      expect(part(el, 'handle').getAttribute('aria-valuetext')).toBe(
        'Confirmed',
      )
    })
  })

  describe('reduced motion', () => {
    it('jumps back instead of springing when let go short of the end', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      layOut(el)
      dragX(el, [20, 30, 80, 140])
      await el.updateComplete
      expect(offset(el)).toBe('0px')
    })

    it('jumps to the end on End', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulSlideToConfirm>(
        html`<moul-slide-to-confirm></moul-slide-to-confirm>`,
      )
      layOut(el)
      key(el, 'End')
      expect(offset(el)).toBe('248px')
    })
  })
})
