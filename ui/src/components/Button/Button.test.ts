import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Button'
import type { ButtonState, MoulButton } from './Button'

const root = (el: MoulButton) => el.shadowRoot as ShadowRoot
const inner = (el: MoulButton) =>
  root(el).querySelector('button') as HTMLButtonElement
const iconName = (el: MoulButton) =>
  root(el).querySelector('[part="icon"] moul-icon-morph')?.getAttribute('name')
const status = (el: MoulButton) =>
  root(el).querySelector('[role="status"]')?.textContent?.trim()

/** The text the label box shows: the state's slot, or the default slot it falls back to. */
function shownLabel(el: MoulButton): string {
  const outer = root(el).querySelector<HTMLSlotElement>('.content > slot')
  if (!outer) return ''
  const named = outer.assignedElements()
  const slot = named.length
    ? outer
    : (outer.querySelector<HTMLSlotElement>('slot') ?? outer)
  return slot
    .assignedNodes()
    .map((node) => node.textContent)
    .join('')
    .trim()
}

async function setState(el: MoulButton, state: ButtonState) {
  el.state = state
  await el.updateComplete
}

function countPresses(el: MoulButton) {
  let count = 0
  el.addEventListener('press', () => {
    count++
  })
  return () => count
}

/** A promise you settle from the test. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Lets `run()` see its task settle and the button re-render. */
async function flush(el: MoulButton) {
  for (let i = 0; i < 3; i++) await Promise.resolve()
  await el.updateComplete
}

describe('<moul-button> states', () => {
  let motion: ReducedMotionMock | undefined

  afterEach(() => {
    motion?.restore()
    motion = undefined
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('state and is-pending', () => {
    it('defaults to idle, reflects state, and renders no icon until it leaves idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      expect(el.state).toBe('idle')
      expect(el.getAttribute('state')).toBe('idle')
      expect(el.stateDuration).toBe(2000)
      expect(inner(el).classList.contains('idle')).toBe(true)
      expect(root(el).querySelector('moul-icon-morph')).toBeNull()
      expect(el.hasAttribute('aria-busy')).toBe(false)
      expect(shownLabel(el)).toBe('Save')

      await setState(el, 'success')
      expect(el.getAttribute('state')).toBe('success')
    })

    it('treats state="pending" exactly like is-pending', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state="pending">Save</moul-button>`,
      )
      expect(el.getAttribute('aria-busy')).toBe('true')
      expect(inner(el).getAttribute('aria-busy')).toBe('true')
      expect(inner(el).classList.contains('pending')).toBe(true)
      expect(iconName(el)).toBe('loader')
      // Still focusable: the inner button is not disabled.
      expect(inner(el).disabled).toBe(false)
      inner(el).focus()
      expect(root(el).activeElement).toBe(inner(el))

      const presses = countPresses(el)
      inner(el).click()
      el.click()
      expect(presses()).toBe(0)
    })

    it('is pending while either is-pending or state says so', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state="success" is-pending>Save</moul-button>`,
      )
      expect(inner(el).classList.contains('pending')).toBe(true)
      expect(el.getAttribute('aria-busy')).toBe('true')

      el.isPending = false
      await el.updateComplete
      expect(inner(el).classList.contains('success')).toBe(true)
      expect(el.hasAttribute('aria-busy')).toBe(false)

      el.state = 'pending'
      await el.updateComplete
      expect(el.getAttribute('aria-busy')).toBe('true')
      el.state = 'idle'
      await el.updateComplete
      expect(el.hasAttribute('aria-busy')).toBe(false)
      expect(inner(el).getAttribute('aria-busy')).toBe('false')
    })

    it('reads an unknown state as idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state="loading">Save</moul-button>`,
      )
      expect(inner(el).classList.contains('idle')).toBe(true)
      expect(root(el).querySelector('moul-icon-morph')).toBeNull()
    })
  })

  describe('icon', () => {
    it('morphs loader, check and error by state and keeps the icon to fold it away in idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      await setState(el, 'pending')
      expect(iconName(el)).toBe('loader')
      const icon = root(el).querySelector('moul-icon-morph')

      await setState(el, 'success')
      expect(iconName(el)).toBe('check')
      await setState(el, 'error')
      expect(iconName(el)).toBe('error')
      // The same element morphs; it is not replaced.
      expect(root(el).querySelector('moul-icon-morph')).toBe(icon)
      // Next to the label it is decorative.
      expect(icon?.getAttribute('aria-hidden')).toBe('true')

      await setState(el, 'idle')
      expect(inner(el).classList.contains('idle')).toBe(true)
      expect(iconName(el)).toBe('error')
    })
  })

  describe('state slots', () => {
    it('swaps in the slot for each state and falls back to the label', async () => {
      const el = await fixture<MoulButton>(html`
        <moul-button>
          Save
          <span slot="pending">Saving…</span>
          <span slot="success">Saved</span>
        </moul-button>
      `)
      expect(shownLabel(el)).toBe('Save')
      expect(root(el).querySelector('slot[name="pending"]')).toBeNull()

      await setState(el, 'pending')
      expect(shownLabel(el)).toBe('Saving…')
      await setState(el, 'success')
      expect(shownLabel(el)).toBe('Saved')
      // No error slot: the default label shows.
      await setState(el, 'error')
      expect(root(el).querySelector('slot[name="error"]')).not.toBeNull()
      expect(shownLabel(el)).toBe('Save')
      await setState(el, 'idle')
      expect(shownLabel(el)).toBe('Save')
    })
  })

  describe('run()', () => {
    it('goes pending, resolves with the value, shows success, then returns to idle after state-duration', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const task = deferred<number>()
      const result = el.run(() => task.promise)
      expect(el.state).toBe('pending')
      await el.updateComplete
      expect(el.getAttribute('aria-busy')).toBe('true')

      task.resolve(42)
      await expect(result).resolves.toBe(42)
      await el.updateComplete
      expect(el.state).toBe('success')
      expect(el.hasAttribute('aria-busy')).toBe(false)

      vi.advanceTimersByTime(1999)
      expect(el.state).toBe('success')
      vi.advanceTimersByTime(1)
      expect(el.state).toBe('idle')
    })

    it('re-throws the task error, shows error, then returns to idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state-duration="500">Save</moul-button>`,
      )
      expect(el.stateDuration).toBe(500)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const failure = new Error('offline')
      await expect(el.run(() => Promise.reject(failure))).rejects.toBe(failure)
      await el.updateComplete
      expect(el.state).toBe('error')
      expect(iconName(el)).toBe('error')

      vi.advanceTimersByTime(500)
      expect(el.state).toBe('idle')
    })

    it('treats a task that throws synchronously as a failure', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      const failure = new Error('bad input')
      await expect(
        el.run(() => {
          throw failure
        }),
      ).rejects.toBe(failure)
      expect(el.state).toBe('error')
    })

    it('a new run() cancels the pending return to idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      await el.run(() => Promise.resolve())
      vi.advanceTimersByTime(1500)

      const second = deferred<void>()
      const result = el.run(() => second.promise)
      vi.advanceTimersByTime(1000)
      await el.updateComplete
      // The first run's timer would have fired by now.
      expect(el.state).toBe('pending')

      second.resolve()
      await result
      vi.advanceTimersByTime(1999)
      expect(el.state).toBe('success')
      vi.advanceTimersByTime(1)
      expect(el.state).toBe('idle')
    })

    it('a manual state change cancels the pending return to idle', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      await el.run(() => Promise.resolve())
      await el.updateComplete
      await setState(el, 'error')
      vi.advanceTimersByTime(10_000)
      expect(el.state).toBe('error')
    })

    it('keeps the result with state-duration="0"', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state-duration="0">Save</moul-button>`,
      )
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      await el.run(() => Promise.resolve('ok'))
      vi.advanceTimersByTime(60_000)
      expect(el.state).toBe('success')
    })

    it('lets the latest run own the state', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      const first = deferred<string>()
      const second = deferred<string>()
      const firstResult = el.run(() => first.promise)
      const secondResult = el.run(() => second.promise)

      second.resolve('second')
      await expect(secondResult).resolves.toBe('second')
      expect(el.state).toBe('success')

      const failure = new Error('stale')
      first.reject(failure)
      await expect(firstResult).rejects.toBe(failure)
      await flush(el)
      expect(el.state).toBe('success')
    })
  })

  describe('presses', () => {
    it('are ignored only while pending', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      const presses = countPresses(el)
      const expected: Record<ButtonState, number> = {
        idle: 1,
        pending: 0,
        success: 1,
        error: 1,
      }
      for (const state of ['idle', 'pending', 'success', 'error'] as const) {
        await setState(el, state)
        const before = presses()
        inner(el).click()
        expect(presses() - before, state).toBe(expected[state])
      }
    })

    it('Enter on the focused button presses in success but not while pending', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button state="pending">Save</moul-button>`,
      )
      const presses = countPresses(el)
      const target = inner(el)
      target.focus()
      // A native button clicks itself on Enter; happy-dom does not, so mirror it.
      const enter = () => {
        target.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        )
        target.click()
      }
      enter()
      expect(presses()).toBe(0)

      await setState(el, 'success')
      enter()
      expect(presses()).toBe(1)
    })
  })

  describe('announcements', () => {
    it('announces each state politely, with slot text or the defaults', async () => {
      const el = await fixture<MoulButton>(html`
        <moul-button>
          Save
          <span slot="success">Saved</span>
        </moul-button>
      `)
      const region = root(el).querySelector('[role="status"]')
      expect(region).not.toBeNull()
      // Outside the inner button, so it is not part of the button's name.
      expect(region?.closest('button')).toBeNull()
      expect(status(el)).toBe('')

      await setState(el, 'pending')
      expect(status(el)).toBe('Loading')
      await setState(el, 'success')
      expect(status(el)).toBe('Saved')
      await setState(el, 'error')
      expect(status(el)).toBe('Failed')
      await setState(el, 'idle')
      expect(status(el)).toBe('')
    })

    it('announces success-label and error-label in place of the defaults', async () => {
      const el = await fixture<MoulButton>(html`
        <moul-button success-label="រួចរាល់" error-label="បរាជ័យ">
          រក្សាទុក
        </moul-button>
      `)
      await setState(el, 'success')
      expect(status(el)).toBe('រួចរាល់')
      expect(inner(el).classList.contains('success')).toBe(true)
      await setState(el, 'error')
      expect(status(el)).toBe('បរាជ័យ')
      expect(inner(el).classList.contains('error')).toBe(true)
    })

    it('announces is-pending with pending-label, and drops the folded loader icon', async () => {
      vi.useFakeTimers()
      try {
        const el = await fixture<MoulButton>(
          html`<moul-button pending-label="កំពុងរក្សាទុក">Save</moul-button>`,
        )
        el.isPending = true
        await el.updateComplete
        expect(status(el)).toBe('កំពុងរក្សាទុក')
        expect(
          root(el).querySelector('moul-icon-morph')?.getAttribute('name'),
        ).toBe('loader')

        el.isPending = false
        await el.updateComplete
        // Still there while it folds away, then removed so it stops spinning.
        expect(root(el).querySelector('moul-icon-morph')).not.toBeNull()
        vi.advanceTimersByTime(500)
        await el.updateComplete
        expect(root(el).querySelector('moul-icon-morph')).toBeNull()
      } finally {
        vi.useRealTimers()
      }
    })

    it('uses "Done" for success when there is no slot or label', async () => {
      const el = await fixture<MoulButton>(
        html`<moul-button>Save</moul-button>`,
      )
      await setState(el, 'success')
      expect(status(el)).toBe('Done')
    })
  })

  describe('label width', () => {
    /** Gives the label box a width per state slot and records its animations. */
    function stubLabelBox(el: MoulButton) {
      const content = root(el).querySelector('.content') as HTMLElement
      content.getBoundingClientRect = () =>
        ({
          width: content.querySelector('slot[name="success"]') ? 80 : 40,
        }) as DOMRect
      const animation = {
        cancel: vi.fn(),
        onfinish: null as null | (() => void),
      }
      const animate = vi.fn(() => animation)
      content.animate = animate as unknown as typeof content.animate
      return { content, animate, animation }
    }

    it('animates the width from the old label to the new one', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulButton>(html`
        <moul-button>Save <span slot="success">Saved to the cloud</span></moul-button>
      `)
      const { content, animate, animation } = stubLabelBox(el)

      await setState(el, 'success')
      expect(animate).toHaveBeenCalledTimes(1)
      expect(animate).toHaveBeenCalledWith(
        [{ width: '40px' }, { width: '80px' }],
        expect.objectContaining({ duration: 300 }),
      )
      expect(content.style.overflowX).toBe('clip')
      animation.onfinish?.()
      expect(content.style.overflowX).toBe('')

      // Back to the default label, cancelling the running animation first.
      await setState(el, 'error')
      expect(animation.cancel).toHaveBeenCalled()
      expect(animate).toHaveBeenLastCalledWith(
        [{ width: '80px' }, { width: '40px' }],
        expect.anything(),
      )
      // Same label in both states: nothing to animate.
      await setState(el, 'pending')
      expect(animate).toHaveBeenCalledTimes(2)
    })

    it('changes the width at once under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulButton>(html`
        <moul-button>Save <span slot="success">Saved to the cloud</span></moul-button>
      `)
      const { content, animate } = stubLabelBox(el)

      await setState(el, 'success')
      await setState(el, 'idle')
      expect(animate).not.toHaveBeenCalled()
      expect(content.style.overflowX).toBe('')
    })
  })
})
