import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './index'
import type { MoulCursor } from './Cursor'

const part = (el: MoulCursor, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) as HTMLElement
const follower = (el: MoulCursor) => part(el, 'follower')
const label = (el: MoulCursor) =>
  el.shadowRoot?.querySelector<HTMLElement>('.text')?.textContent ?? ''
const at = (el: HTMLElement) => el.style.translate

function pointer(
  target: EventTarget,
  type:
    | 'pointermove'
    | 'pointerover'
    | 'pointerleave'
    | 'pointerdown'
    | 'pointerup'
    | 'pointerout',
  clientX = 0,
  clientY = 0,
  pointerType = 'mouse',
  init: PointerEventInit = {},
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type !== 'pointerleave',
      composed: true,
      ...init,
    }),
  )
}

let frames: ManualFrames | null = null

/** Renders the element, then takes over animation frames (the render itself waits for one). */
async function area(attributes = '') {
  const host = document.createElement('div')
  document.body.append(host)
  host.innerHTML = `<moul-cursor ${attributes}>
    <p>Kep crab market</p>
    <button type="button">Book a table</button>
    <input type="text" aria-label="Your name" />
    <figure data-cursor-label="View"><span>Photo</span></figure>
  </moul-cursor>`
  const el = host.firstElementChild as MoulCursor
  await el.updateComplete
  frames = manualAnimationFrames()
  return el
}

const step = (time: number) => frames?.step(time)
const pending = () => frames?.pending ?? 0

describe('<moul-cursor>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    frames?.restore()
    frames = null
    motion.restore()
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('data-moul-cursor-active')
  })

  it('renders a decorative follower in the top layer, with a lead and a trail', async () => {
    const el = await area()
    expect(customElements.get('moul-cursor')).toBeDefined()
    expect(follower(el).getAttribute('aria-hidden')).toBe('true')
    expect(follower(el).getAttribute('popover')).toBe('manual')
    expect(part(el, 'lead').querySelector('.dot')).not.toBeNull()
    expect(part(el, 'trail')).not.toBeNull()
    expect(el.isActive).toBe(false)
  })

  it('falls back to the defaults for unknown variant and scope values', async () => {
    const el = await area('variant="nope" scope="nope"')
    expect(el.variant).toBe('dot')
    expect(el.scope).toBe('element')
  })

  it('shows the follower right on the pointer and hides the system cursor', async () => {
    const el = await area()
    pointer(el.querySelector('p') as Element, 'pointermove', 120, 80)
    expect(el.isActive).toBe(true)
    expect(el.hasAttribute('data-active')).toBe(true)
    expect(follower(el).hasAttribute('data-visible')).toBe(true)
    expect(at(part(el, 'lead'))).toBe('120px 80px')
    expect(at(part(el, 'trail'))).toBe('120px 80px')
  })

  it('installs the rule that hides the system cursor in the element’s root', async () => {
    const el = await area()
    pointer(el, 'pointermove', 10, 10)
    const rules = document.adoptedStyleSheets
      .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
      .join('\n')
    expect(rules).toContain('moul-cursor[data-active]')
    expect(rules).toContain('cursor: none !important')
  })

  it('keeps the dot on the pointer while the ring trails on a spring, then stops', async () => {
    const el = await area()
    pointer(el, 'pointermove', 100, 100)
    step(0)
    pointer(el, 'pointermove', 200, 100)
    step(16)
    expect(at(part(el, 'lead'))).toBe('200px 100px')
    const trailX = Number.parseFloat(at(part(el, 'trail')))
    expect(trailX).toBeGreaterThan(100)
    expect(trailX).toBeLessThan(200)

    let time = 16
    for (let i = 0; i < 300 && pending() > 0; i++) {
      time += 16
      step(time)
    }
    expect(pending()).toBe(0)
    expect(at(part(el, 'trail'))).toBe('200px 100px')
  })

  it('gives the arrow a smooth, close follow in the arrow variant', async () => {
    const el = await area('variant="arrow"')
    expect(part(el, 'lead').querySelector('svg.arrow')).not.toBeNull()
    pointer(el, 'pointermove', 100, 100)
    step(0)
    pointer(el, 'pointermove', 200, 100)
    step(16)
    const leadX = Number.parseFloat(at(part(el, 'lead')))
    expect(leadX).toBeGreaterThan(100)
    expect(leadX).toBeLessThan(200)
  })

  it('follows only a mouse', async () => {
    const el = await area()
    pointer(el, 'pointermove', 50, 50, 'touch')
    pointer(el, 'pointermove', 50, 50, 'pen')
    expect(el.isActive).toBe(false)
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('gives the system cursor back when a finger touches down', async () => {
    const el = await area()
    pointer(el, 'pointermove', 50, 50)
    pointer(el, 'pointerdown', 50, 50, 'touch')
    expect(el.isActive).toBe(false)
  })

  it('hides when the pointer leaves the element', async () => {
    const el = await area()
    pointer(el, 'pointermove', 50, 50)
    pointer(el, 'pointerleave', 500, 500)
    expect(el.isActive).toBe(false)
    expect(el.hasAttribute('data-active')).toBe(false)
    expect(follower(el).hasAttribute('data-visible')).toBe(false)
  })

  it('reappears where the pointer is, without flying in from where it was', async () => {
    const el = await area()
    pointer(el, 'pointermove', 50, 50)
    pointer(el, 'pointerleave', 500, 500)
    pointer(el, 'pointermove', 300, 20)
    expect(at(part(el, 'trail'))).toBe('300px 20px')
  })

  it('gives the system cursor back over a text field', async () => {
    const el = await area()
    pointer(el, 'pointermove', 50, 50)
    const input = el.querySelector('input') as HTMLInputElement
    pointer(input, 'pointerover', 60, 60)
    pointer(input, 'pointermove', 60, 60)
    expect(el.isActive).toBe(false)
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('grows over a button and shrinks on press', async () => {
    const el = await area()
    const button = el.querySelector('button') as HTMLButtonElement
    pointer(button, 'pointerover', 60, 60)
    pointer(button, 'pointermove', 60, 60)
    expect(follower(el).hasAttribute('data-interactive')).toBe(true)
    pointer(button, 'pointerdown', 60, 60)
    expect(follower(el).hasAttribute('data-pressed')).toBe(true)
    pointer(button, 'pointerup', 60, 60)
    expect(follower(el).hasAttribute('data-pressed')).toBe(false)
    pointer(el.querySelector('p') as Element, 'pointerover', 60, 60)
    expect(follower(el).hasAttribute('data-interactive')).toBe(false)
  })

  it('shows the data-cursor-label of the hovered element, in any variant', async () => {
    const el = await area()
    const photo = el.querySelector('figure span') as Element
    pointer(photo, 'pointerover', 60, 60)
    expect(label(el)).toBe('View')
    expect(follower(el).hasAttribute('data-has-label')).toBe(true)
    pointer(el.querySelector('p') as Element, 'pointerover', 60, 60)
    expect(follower(el).hasAttribute('data-has-label')).toBe(false)
  })

  it('shows its own label in the label variant, unless a hovered element has one', async () => {
    const el = await area('variant="label" label="Explore"')
    expect(label(el)).toBe('Explore')
    expect(follower(el).hasAttribute('data-has-label')).toBe(true)
    pointer(el.querySelector('figure') as Element, 'pointerover', 60, 60)
    expect(label(el)).toBe('View')
    el.label = 'Look around'
    pointer(el.querySelector('p') as Element, 'pointerover', 60, 60)
    await el.updateComplete
    expect(label(el)).toBe('Look around')
  })

  it('lets an inner moul-cursor take over inside its area', async () => {
    const outer = await area()
    outer.insertAdjacentHTML(
      'beforeend',
      '<moul-cursor variant="label" label="Drag"><div class="inner">Gallery</div></moul-cursor>',
    )
    const inner = outer.querySelector('moul-cursor') as MoulCursor
    await inner.updateComplete
    pointer(outer.querySelector('p') as Element, 'pointermove', 10, 10)
    expect(outer.isActive).toBe(true)
    pointer(inner.querySelector('.inner') as Element, 'pointermove', 20, 20)
    expect(inner.isActive).toBe(true)
    expect(outer.isActive).toBe(false)
  })

  describe('scope="page"', () => {
    it('follows the mouse anywhere on the page and hides the system cursor on the root', async () => {
      const el = await area('scope="page"')
      const elsewhere = document.createElement('div')
      document.body.append(elsewhere)
      pointer(elsewhere, 'pointermove', 400, 300)
      expect(el.isActive).toBe(true)
      expect(
        document.documentElement.hasAttribute('data-moul-cursor-active'),
      ).toBe(true)
      expect(el.hasAttribute('data-active')).toBe(false)
      pointer(elsewhere, 'pointerout', 400, 300, 'mouse', {
        relatedTarget: null,
      })
      expect(el.isActive).toBe(false)
      expect(
        document.documentElement.hasAttribute('data-moul-cursor-active'),
      ).toBe(false)
      elsewhere.remove()
    })

    it('cleans up the root when it disconnects', async () => {
      const el = await area('scope="page"')
      pointer(document.body, 'pointermove', 10, 10)
      el.remove()
      expect(
        document.documentElement.hasAttribute('data-moul-cursor-active'),
      ).toBe(false)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role and hides the follower from assistive technology', async () => {
      const el = await area()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(follower(el).getAttribute('aria-hidden')).toBe('true')
      expect(follower(el).querySelector('[tabindex]')).toBeNull()
    })

    it('leaves the content’s own focus order alone', async () => {
      const el = await area()
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(document.activeElement).toBe(button)
      expect(el.isActive).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('draws no follower and keeps the system cursor', async () => {
      motion.set(true)
      const el = await area()
      pointer(el, 'pointermove', 50, 50)
      expect(el.isActive).toBe(false)
      expect(el.hasAttribute('data-active')).toBe(false)
      expect(pending()).toBe(0)
    })

    it('gives the system cursor back at once when the setting turns on', async () => {
      const el = await area()
      pointer(el, 'pointermove', 50, 50)
      expect(el.isActive).toBe(true)
      motion.set(true)
      expect(el.isActive).toBe(false)
      expect(el.hasAttribute('data-active')).toBe(false)
      motion.set(false)
      pointer(el, 'pointermove', 60, 60)
      expect(el.isActive).toBe(true)
    })
  })
})
