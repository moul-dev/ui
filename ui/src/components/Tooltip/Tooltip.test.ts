import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Tooltip'
import type { MoulTooltip } from './Tooltip'

const variable = (el: MoulTooltip, name: string): number =>
  Number.parseFloat(el.popoverEl?.style.getPropertyValue(name) || '0')

/** Runs `count` frames 16 ms apart. */
function run(frames: ManualFrames, count: number, from = { t: 0 }): void {
  for (let i = 0; i < count; i++) {
    from.t += 16
    frames.step(from.t)
  }
}

function pointer(
  el: Element,
  type: string,
  clientX: number,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, { clientX, clientY: 10, pointerType }),
  )
}

/** Puts the trigger at x 100 to 180 (centre 140), y 0 to 20. */
function placeTrigger(el: MoulTooltip): void {
  const trigger = el.shadowRoot?.querySelector('[part~="trigger"]')
  if (!trigger) throw new Error('no trigger')
  trigger.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 0,
      width: 80,
      height: 20,
      right: 180,
      bottom: 20,
      x: 100,
      y: 0,
    }) as DOMRect
}

describe('<moul-tooltip>', () => {
  let motion: ReducedMotionMock | null = null
  let frames: ManualFrames | null = null

  afterEach(() => {
    frames?.restore()
    frames = null
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('defaults to a centred plain tip with a media slot in the panel', async () => {
    const el = await fixture<MoulTooltip>(html`
      <moul-tooltip content="Copy link"><button>Copy</button></moul-tooltip>
    `)
    expect(el.follow).toBe('none')
    expect(el.isRich).toBe(false)
    expect(el.getAttribute('follow')).toBe('none')
    expect(el.popoverEl?.querySelector('slot[name="media"]')).not.toBeNull()
    el.isRich = true
    await el.updateComplete
    expect(el.hasAttribute('is-rich')).toBe(true)
  })

  it('slides out of the trigger edge as it enters, and back toward it as it leaves', async () => {
    motion = mockReducedMotion(false)
    const el = await fixture<MoulTooltip>(html`
      <moul-tooltip content="Copy link"><button>Copy</button></moul-tooltip>
    `)
    frames = manualAnimationFrames()
    void el.setOpen(true)
    expect(variable(el, '--_slide')).toBe(6)

    const clock = { t: 0 }
    run(frames, 4, clock)
    const midway = variable(el, '--_slide')
    expect(midway).toBeGreaterThan(0)
    expect(midway).toBeLessThan(6)
    run(frames, 40, clock)
    expect(variable(el, '--_slide')).toBe(0)

    void el.setOpen(false)
    run(frames, 4, clock)
    expect(variable(el, '--_slide')).toBeGreaterThan(0)
  })

  it('follows the pointer along the trigger, leaning into the movement', async () => {
    motion = mockReducedMotion(false)
    const el = await fixture<MoulTooltip>(html`
      <moul-tooltip content="Sophea" follow="pointer" delay="0">
        <button>Sophea</button>
      </moul-tooltip>
    `)
    placeTrigger(el)
    frames = manualAnimationFrames()

    // It opens under the pointer, 30px right of centre.
    pointer(el, 'pointerenter', 170)
    expect(el.isOpen).toBe(true)
    expect(variable(el, '--_follow')).toBe(30)

    // Past the trigger's end it stops at the edge, trailing on a spring.
    pointer(el, 'pointermove', 400)
    const clock = { t: 0 }
    run(frames, 3, clock)
    const following = variable(el, '--_follow')
    expect(following).toBeGreaterThan(30)
    expect(following).toBeLessThan(40)
    expect(variable(el, '--_tilt')).toBeGreaterThan(0)

    run(frames, 80, clock)
    expect(variable(el, '--_follow')).toBe(40)
    expect(variable(el, '--_tilt')).toBe(0)

    pointer(el, 'pointermove', 60)
    run(frames, 3, clock)
    expect(variable(el, '--_tilt')).toBeLessThan(0)
  })

  it('does not follow a touch, or when follow is none', async () => {
    motion = mockReducedMotion(false)
    const el = await fixture<MoulTooltip>(html`
      <moul-tooltip content="Sophea" follow="pointer" delay="0">
        <button>Sophea</button>
      </moul-tooltip>
    `)
    placeTrigger(el)
    pointer(el, 'pointerenter', 170, 'touch')
    expect(variable(el, '--_follow')).toBe(0)

    el.follow = 'none'
    await el.updateComplete
    pointer(el, 'pointermove', 170)
    expect(variable(el, '--_follow')).toBe(0)
  })

  describe('keyboard and screen readers', () => {
    it('keyboard focus opens it at once, centred, without the slide', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulTooltip>(html`
        <moul-tooltip content="Sophea" follow="pointer" delay="0">
          <button>Sophea</button>
        </moul-tooltip>
      `)
      placeTrigger(el)
      pointer(el, 'pointerenter', 170)
      expect(variable(el, '--_follow')).toBe(30)
      pointer(el, 'pointerleave', 170)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const button = el.querySelector('button') as HTMLButtonElement
      const matches = button.matches.bind(button)
      vi.spyOn(button, 'matches').mockImplementation((selector: string) =>
        selector === ':focus-visible' ? true : matches(selector),
      )
      button.focus()
      expect(el.isOpen).toBe(true)
      expect(variable(el, '--_follow')).toBe(0)
      expect(variable(el, '--_slide')).toBe(0)
    })

    it('keeps role="tooltip" on the panel and points the trigger at it', async () => {
      const el = await fixture<MoulTooltip>(html`
        <moul-tooltip is-rich>
          <button>Sophea</button>
          <img slot="media" alt="" src="data:," />
          <span slot="content">Designer in Phnom Penh</span>
        </moul-tooltip>
      `)
      const panel = el.popoverEl as HTMLElement
      expect(panel.getAttribute('role')).toBe('tooltip')
      expect(el.querySelector('button')?.getAttribute('aria-describedby')).toBe(
        panel.id,
      )
    })

    it('Escape closes it and stops there', async () => {
      const el = await fixture<MoulTooltip>(html`
        <moul-tooltip content="Copy link"><button>Copy</button></moul-tooltip>
      `)
      const outer = vi.fn()
      document.body.addEventListener('keydown', outer)
      await el.setOpen(true)
      el.querySelector('button')?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      expect(el.isOpen).toBe(false)
      expect(outer).not.toHaveBeenCalled()
      document.body.removeEventListener('keydown', outer)
    })
  })

  describe('reduced motion', () => {
    it('appears in place, stays centred and does not lean', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulTooltip>(html`
        <moul-tooltip content="Sophea" follow="pointer" delay="0">
          <button>Sophea</button>
        </moul-tooltip>
      `)
      placeTrigger(el)
      frames = manualAnimationFrames()
      pointer(el, 'pointerenter', 170)
      expect(el.isOpen).toBe(true)
      expect(variable(el, '--_slide')).toBe(0)
      pointer(el, 'pointermove', 400)
      run(frames, 10)
      expect(variable(el, '--_follow')).toBe(0)
      expect(variable(el, '--_tilt')).toBe(0)
    })
  })
})
