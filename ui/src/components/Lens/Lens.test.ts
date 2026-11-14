import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './Lens'
import type { MoulLens } from './Lens'
import { lensStyles } from './Lens.styles'

/** The stylesheet without its comments. */
const css = lensStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of the first block whose prelude starts with `prelude`. */
function block(prelude: string): string {
  const start = css.indexOf(prelude)
  if (start < 0) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

const RECT = { left: 20, top: 30, width: 400, height: 300 }

function place(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      ...RECT,
      x: RECT.left,
      y: RECT.top,
      right: RECT.left + RECT.width,
      bottom: RECT.top + RECT.height,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  el: HTMLElement,
  type: string,
  clientX = 0,
  clientY = 0,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type !== 'pointerenter' && type !== 'pointerleave',
      composed: true,
    }),
  )
}

/** Lets the mutation observer and the microtask that remakes the copies run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const viewport = (el: MoulLens) =>
  el.shadowRoot?.querySelector('.viewport') as HTMLElement
const lens = (el: MoulLens) =>
  el.shadowRoot?.querySelector('[part="lens"]') as HTMLElement
const zoomed = (el: MoulLens) =>
  el.shadowRoot?.querySelector('.zoomed') as HTMLElement
const copies = (el: MoulLens) => [
  ...el.querySelectorAll<HTMLElement>('[data-lens-copy]'),
]
const centreOf = (layer: HTMLElement) => [
  layer.style.getPropertyValue('--_lens-pointer-x'),
  layer.style.getPropertyValue('--_lens-pointer-y'),
]

async function mount(attrs = '') {
  const el = await fixture<MoulLens>(
    html`<moul-lens .innerHTML=${`<img id="shot" src="/kampot.jpg" alt="Pepper on the vine" srcset="/kampot-800.jpg 800w, /kampot-1600.jpg 1600w"><p>Kampot pepper</p>`}></moul-lens>`,
  )
  for (const pair of attrs.split(' ').filter(Boolean)) {
    const [name, value = ''] = pair.split('=')
    el.setAttribute(name, value)
  }
  await el.updateComplete
  place(el)
  return el
}

describe('<moul-lens>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
    frames.restore()
  })

  it('shows the content through its slot, with a hidden lens and no copy until it is needed', async () => {
    const el = await mount()
    const slot = el.shadowRoot?.querySelector(
      'slot:not([name])',
    ) as HTMLSlotElement
    expect(slot.assignedElements().map((node) => node.localName)).toEqual([
      'img',
      'p',
    ])
    expect(viewport(el).getAttribute('aria-hidden')).toBe('true')
    expect(viewport(el).classList.contains('is-active')).toBe(false)
    expect(copies(el)).toEqual([])
  })

  it('has the documented defaults and writes them as variables', async () => {
    const el = await mount()
    expect(el.zoom).toBe(2)
    expect(el.size).toBe(160)
    expect(el.isStatic).toBe(false)
    expect(el.style.getPropertyValue('--_lens-zoom')).toBe('2')
    expect(el.style.getPropertyValue('--_lens-size')).toBe('160px')
    el.zoom = 3
    el.size = 200
    await el.updateComplete
    expect(el.style.getPropertyValue('--_lens-zoom')).toBe('3')
    expect(el.style.getPropertyValue('--_lens-size')).toBe('200px')
    // Below 1 the lens would shrink the content: it falls back.
    el.zoom = 0.5
    el.size = -1
    await el.updateComplete
    expect(el.style.getPropertyValue('--_lens-zoom')).toBe('2')
    expect(el.style.getPropertyValue('--_lens-size')).toBe('160px')
  })

  it('makes a hidden, inert copy of the content the first time the pointer arrives', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 100, 100)
    expect(viewport(el).classList.contains('is-active')).toBe(true)
    const made = copies(el)
    expect(made.map((node) => node.localName)).toEqual(['img', 'p'])
    for (const copy of made) {
      expect(copy.getAttribute('slot')).toBe('lens')
      expect(copy.getAttribute('aria-hidden')).toBe('true')
      expect(copy.hasAttribute('inert')).toBe(true)
      expect(copy.hasAttribute('id')).toBe(false)
    }
    // The copy is never lazy, since it sits clipped inside the lens.
    expect((made[0] as HTMLImageElement).loading).toBe('eager')
    const copySlot = zoomed(el).querySelector('slot') as HTMLSlotElement
    expect(copySlot.name).toBe('lens')
    expect(copySlot.assignedElements()).toEqual(made)
    // The originals are untouched.
    expect(el.querySelector('#shot')).not.toBeNull()

    pointer(el, 'pointerleave')
    expect(viewport(el).classList.contains('is-active')).toBe(false)
    pointer(el, 'pointerenter', 100, 100)
    expect(copies(el)).toEqual(made)
  })

  it('asks for a sharper source in the copy of an image with a srcset', async () => {
    const el = await mount()
    const original = el.querySelector('img') as HTMLImageElement
    original.getBoundingClientRect = () =>
      ({ width: 300, height: 200 }) as DOMRect
    pointer(el, 'pointerenter', 100, 100)
    expect((copies(el)[0] as HTMLImageElement).sizes).toBe('600px')
  })

  it('remakes the copy when the content changes, and removes it on disconnect', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 100, 100)
    const caption = el.querySelector('p:not([data-lens-copy])') as HTMLElement
    caption.textContent = 'Kep crab'
    await settle()
    expect(copies(el)[1].textContent).toBe('Kep crab')

    const extra = document.createElement('span')
    extra.textContent = 'Fresh'
    el.append(extra)
    await settle()
    expect(copies(el).map((node) => node.localName)).toEqual([
      'img',
      'p',
      'span',
    ])

    el.remove()
    expect(copies(el)).toEqual([])
  })

  it('follows the pointer once per frame, on the lens and on the copy', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 120, 130)
    pointer(el, 'pointermove', 120, 130)
    pointer(el, 'pointermove', 220, 180)
    expect(frames.pending).toBe(1)
    frames.step(16)
    expect(centreOf(lens(el))).toEqual(['200px', '150px'])
    expect(centreOf(zoomed(el))).toEqual(['200px', '150px'])
    expect(block('.zoomed')).toMatch(/transform-origin:\s*0 0/)
    expect(block('.zoomed')).toMatch(/scale:\s*var\(--_lens-zoom\)/)
  })

  it('lays the copy out at the content size', async () => {
    const el = await mount()
    triggerResize(el, { width: 360, height: 240 })
    expect(el.style.getPropertyValue('--_lens-width')).toBe('360px')
    expect(el.style.getPropertyValue('--_lens-height')).toBe('240px')
  })

  it('shows where a finger presses and hides when it lifts', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 70, 80, 'touch')
    expect(viewport(el).classList.contains('is-active')).toBe(false)
    pointer(el, 'pointerdown', 70, 80, 'touch')
    expect(viewport(el).classList.contains('is-active')).toBe(true)
    expect(centreOf(lens(el))).toEqual(['50px', '50px'])
    expect(centreOf(zoomed(el))).toEqual(['50px', '50px'])
    pointer(el, 'pointerup', 70, 80, 'touch')
    expect(viewport(el).classList.contains('is-active')).toBe(false)
  })

  it('keeps a static lens in place, with a copy from the start', async () => {
    const el = await mount('is-static position-x=30 position-y=40px')
    expect(el.isStatic).toBe(true)
    expect(copies(el).length).toBe(2)
    expect(el.style.getPropertyValue('--_lens-position-x')).toBe('30%')
    expect(el.style.getPropertyValue('--_lens-position-y')).toBe('40px')
    expect(css).toMatch(
      /:host\(\[is-static\]\) \[part="lens"\]\s*\{[^}]*left:\s*var\(--_lens-position-x/,
    )
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides the copy from assistive technology', async () => {
      const el = await mount()
      pointer(el, 'pointerenter', 100, 100)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(
        copies(el).every((copy) => copy.getAttribute('aria-hidden') === 'true'),
      ).toBe(true)
      expect(viewport(el).getAttribute('aria-hidden')).toBe('true')
    })

    it('keeps links in the copy out of the tab order', async () => {
      const el = await fixture<MoulLens>(
        html`<moul-lens><p><a href="#map">Open the map</a></p></moul-lens>`,
      )
      pointer(el, 'pointerenter', 10, 10)
      const copy = copies(el)[0]
      expect(copy.hasAttribute('inert')).toBe(true)
      const original = el.querySelector(
        'p:not([data-lens-copy]) a',
      ) as HTMLAnchorElement
      original.focus()
      expect(document.activeElement).toBe(original)
    })
  })

  describe('reduced motion', () => {
    it('appears at once but keeps following the pointer, which the reader moves', async () => {
      motion.set(true)
      const el = await mount()
      pointer(el, 'pointerenter', 120, 130)
      pointer(el, 'pointermove', 120, 130)
      frames.step(16)
      expect(centreOf(lens(el))).toEqual(['100px', '100px'])
      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toMatch(/transition:\s*none/)
      expect(reduced).toMatch(/scale:\s*1/)
    })
  })
})
