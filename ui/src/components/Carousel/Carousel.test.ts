import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './Carousel'
import type { MoulCarousel } from './Carousel'
import { carouselStyles } from './Carousel.styles'

const css = carouselStyles.map((sheet) => sheet.cssText).join('\n')

interface Layout {
  viewport?: number
  slide?: number
  gap?: number
}

/** Mounts a carousel with `count` slides from markup, then gives it a layout. */
async function mount(
  attributes = '',
  count = 5,
  geometry: Layout = {},
  wrap?: (el: MoulCarousel) => HTMLElement,
): Promise<MoulCarousel> {
  const slides = Array.from(
    { length: count },
    (_, i) => `<article><a href="#s${i}">Story ${i + 1}</a></article>`,
  ).join('')
  const holder = document.createElement('div')
  holder.innerHTML = `<moul-carousel ${attributes}>${slides}</moul-carousel>`
  const el = holder.querySelector('moul-carousel') as MoulCarousel
  document.body.append(wrap ? wrap(el) : holder)
  await el.updateComplete
  // Let the slot report its children.
  await new Promise((resolve) => setTimeout(resolve))
  layout(el, geometry)
  await el.updateComplete
  return el
}

function rect(el: Element, left: number, width: number): void {
  const box = {
    left,
    right: left + width,
    width,
    top: 0,
    bottom: 200,
    height: 200,
    x: left,
    y: 0,
  }
  el.getBoundingClientRect = () => ({ ...box, toJSON: () => box }) as DOMRect
}

/**
 * Lays the slides out as a browser would: `slide` px wide, `gap` px apart,
 * from the inline start of a `viewport`-wide window, then reports the resize.
 */
function layout(
  el: MoulCarousel,
  { viewport = 400, slide = 180, gap = 16 }: Layout = {},
): void {
  const rtl = el.closest('[dir]')?.getAttribute('dir') === 'rtl'
  rect(part(el, 'track'), 0, viewport)
  ;[...el.children].forEach((child, i) => {
    const start = i * (slide + gap)
    rect(child, rtl ? viewport - start - slide : start, slide)
  })
  triggerResize(part(el, 'viewport'), { width: viewport, height: 200 })
}

const part = (el: MoulCarousel, name: string) =>
  el.shadowRoot?.querySelector(`[part~="${name}"]`) as HTMLElement
const offset = (el: MoulCarousel) =>
  part(el, 'track').style.getPropertyValue('--_drag-x')
const slides = (el: MoulCarousel) => [...el.children] as HTMLElement[]
const inert = (el: MoulCarousel) =>
  slides(el).map((slide) => slide.hasAttribute('inert'))
const key = (target: Element, k: string) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: k,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )

let clock = 1000

function pointer(
  type: string,
  target: EventTarget,
  clientX: number,
  timeStamp = clock,
): void {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'mouse',
    clientX,
    clientY: 50,
    bubbles: true,
    composed: true,
  })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp })
  target.dispatchEvent(event)
}

describe('<moul-carousel>', () => {
  let motion: ReducedMotionMock
  let io: IntersectionMock

  beforeEach(() => {
    // Jumps instead of springs, so offsets can be read straight away.
    motion = mockReducedMotion(true)
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    motion.restore()
    io.restore()
    vi.useRealTimers()
  })

  it('is a labelled carousel region with a focusable slide area', async () => {
    const el = await mount('label="Customer stories"')
    const base = part(el, 'base')
    expect(base.getAttribute('role')).toBe('region')
    expect(base.getAttribute('aria-roledescription')).toBe('carousel')
    expect(base.getAttribute('aria-label')).toBe('Customer stories')
    const viewport = part(el, 'viewport')
    expect(viewport.getAttribute('tabindex')).toBe('0')
    expect(viewport.getAttribute('role')).toBe('group')
    expect(part(el, 'track').querySelector('slot')).not.toBeNull()
  })

  it('names every slide "N of M", and gives the names back when it leaves', async () => {
    const el = await mount()
    const all = slides(el)
    expect(all[0].getAttribute('role')).toBe('group')
    expect(all[0].getAttribute('aria-roledescription')).toBe('slide')
    expect(all[2].getAttribute('aria-label')).toBe('3 of 5')
    el.remove()
    expect(all[2].hasAttribute('aria-label')).toBe(false)
    expect(all[2].hasAttribute('role')).toBe(false)
  })

  it('leaves an image slide its own role and alt', async () => {
    const holder = document.createElement('div')
    holder.innerHTML =
      '<moul-carousel><img alt="A lake" /><article></article></moul-carousel>'
    document.body.append(holder)
    const el = holder.firstElementChild as MoulCarousel
    await el.updateComplete
    const [image, article] = slides(el)
    expect(image.hasAttribute('role')).toBe(false)
    expect(image.hasAttribute('aria-label')).toBe(false)
    expect(article.getAttribute('aria-label')).toBe('2 of 2')
  })

  it('stops at each slide until the row reaches its end', async () => {
    // Five 180px slides 16px apart in a 400px window: the row is 964px
    // long, so the last stop is 564px in and slide 5 shares it.
    const el = await mount()
    const dots = el.shadowRoot?.querySelectorAll('[part~="dot"]') ?? []
    expect(dots).toHaveLength(4)
    expect(offset(el)).toBe('0px')
    el.goTo(3)
    await el.updateComplete
    expect(offset(el)).toBe('-564px')
    el.goTo(4)
    expect(el.index).toBe(3)
  })

  it('centres each slide with align="center"', async () => {
    const el = await mount('align="center"', 3)
    // Slide 1 starts 0px in and is 180px wide: centred in 400px it sits 110px in.
    expect(offset(el)).toBe('110px')
    el.next()
    expect(offset(el)).toBe('-86px')
    expect(el.shadowRoot?.querySelectorAll('[part~="dot"]')).toHaveLength(3)
  })

  it('moves with next(), previous() and goTo(), firing slidechange', async () => {
    const el = await mount()
    const changes: number[] = []
    el.addEventListener('slidechange', (event) =>
      changes.push((event as CustomEvent).detail.index),
    )
    el.next()
    el.next()
    el.previous()
    el.goTo(3)
    expect(changes).toEqual([1, 2, 1, 3])
    expect(el.index).toBe(3)
    await el.updateComplete
    expect(el.getAttribute('index')).toBe('3')
    // Without is-loop the ends hold.
    el.next()
    expect(el.index).toBe(3)
    el.goTo(0)
    el.previous()
    expect(el.index).toBe(0)
    expect(changes).toEqual([1, 2, 1, 3, 0])
  })

  it('goes round with is-loop', async () => {
    const el = await mount('is-loop')
    el.previous()
    expect(el.index).toBe(3)
    el.next()
    expect(el.index).toBe(0)
  })

  it('marks the ends on the arrows and moves with them', async () => {
    const el = await mount()
    const prev = part(el, 'prev')
    const next = part(el, 'next')
    expect(prev.getAttribute('aria-label')).toBe('Previous slide')
    expect(prev.getAttribute('aria-disabled')).toBe('true')
    expect(next.getAttribute('aria-disabled')).toBe('false')
    prev.click()
    expect(el.index).toBe(0)
    next.click()
    await el.updateComplete
    expect(el.index).toBe(1)
    expect(prev.getAttribute('aria-disabled')).toBe('false')
    el.goTo(3)
    await el.updateComplete
    expect(next.getAttribute('aria-disabled')).toBe('true')
  })

  it('goes to a slide from its dot, marking the current one', async () => {
    const el = await mount()
    const dots = [
      ...(el.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part~="dot"]') ??
        []),
    ]
    expect(dots[2].getAttribute('aria-label')).toBe('Go to slide 3')
    dots[2].click()
    await el.updateComplete
    expect(el.index).toBe(2)
    expect(dots[2].getAttribute('aria-current')).toBe('true')
    expect(dots[2].getAttribute('part')).toBe('dot dot-current')
    expect(dots[0].getAttribute('aria-current')).toBe('false')
  })

  it('moves with the arrow keys, Home and End on the slide area', async () => {
    const el = await mount()
    const viewport = part(el, 'viewport')
    key(viewport, 'ArrowRight')
    expect(el.index).toBe(1)
    key(viewport, 'End')
    expect(el.index).toBe(3)
    key(viewport, 'ArrowLeft')
    expect(el.index).toBe(2)
    key(viewport, 'Home')
    expect(el.index).toBe(0)
    // Keys pressed on content inside a slide stay with that content.
    key(slides(el)[0].querySelector('a') as Element, 'ArrowRight')
    expect(el.index).toBe(0)
  })

  it('mirrors the keys and the travel in right-to-left text', async () => {
    const el = await mount('', 5, {}, (carousel) => {
      const rtl = document.createElement('div')
      rtl.dir = 'rtl'
      rtl.append(carousel)
      return rtl
    })
    key(part(el, 'viewport'), 'ArrowLeft')
    expect(el.index).toBe(1)
    expect(offset(el)).toBe('196px')
    key(part(el, 'viewport'), 'ArrowRight')
    expect(el.index).toBe(0)
  })

  it('announces the slide after a change the reader makes', async () => {
    const el = await mount()
    const live = el.shadowRoot?.querySelector('[aria-live]') as HTMLElement
    expect(live.getAttribute('aria-live')).toBe('polite')
    el.next()
    await el.updateComplete
    expect(live.textContent?.trim()).toBe('Slide 2 of 4')
  })

  it('makes slides wholly out of view inert', async () => {
    const el = await mount()
    // 0–400px is in view: slides 1 and 2 whole, slide 3 (392–572) in part.
    expect(inert(el)).toEqual([false, false, false, true, true])
    el.goTo(3)
    // 564–964px: slide 3 (392–572) still shows its edge.
    expect(inert(el)).toEqual([true, true, false, false, false])
  })

  it('brings a half-visible slide into view when something in it takes focus', async () => {
    const el = await mount()
    const link = slides(el)[2].querySelector('a') as HTMLElement
    link.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true }),
    )
    expect(el.index).toBe(2)
  })

  it('settles a drag on the nearest slide, and a flick on the next', async () => {
    const el = await mount()
    const viewport = part(el, 'viewport')
    // A slow drag 150px to the left, held still before release.
    pointer('pointerdown', viewport, 300)
    for (let x = 290; x >= 150; x -= 10) {
      clock += 16
      pointer('pointermove', window, x)
    }
    clock += 300
    pointer('pointerup', window, 150)
    expect(el.index).toBe(1)
    expect(offset(el)).toBe('-196px')

    // A quick 40px flick to the left still goes one further.
    clock += 1000
    pointer('pointerdown', viewport, 300)
    clock += 16
    pointer('pointermove', window, 280)
    clock += 16
    pointer('pointermove', window, 260)
    pointer('pointerup', window, 260)
    expect(el.index).toBe(2)

    // A drag back to the right past the start rubber-bands and settles at 0.
    clock += 1000
    pointer('pointerdown', viewport, 100)
    for (let x = 120; x <= 700; x += 20) {
      clock += 16
      pointer('pointermove', window, x)
    }
    clock += 300
    pointer('pointerup', window, 700)
    expect(el.index).toBe(0)
  })

  it('moves without an event when index is set from outside', async () => {
    const el = await mount()
    const onChange = vi.fn()
    el.addEventListener('slidechange', onChange)
    el.index = 2
    await el.updateComplete
    expect(offset(el)).toBe('-392px')
    el.setAttribute('index', '9')
    await el.updateComplete
    await el.updateComplete
    expect(el.index).toBe(3)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps working after it is moved to another place in the page', async () => {
    const el = await mount()
    const elsewhere = document.createElement('section')
    document.body.append(elsewhere)
    elsewhere.append(el)
    await el.updateComplete
    layout(el)
    expect(slides(el)[0].getAttribute('aria-label')).toBe('1 of 5')
    el.next()
    expect(offset(el)).toBe('-196px')
  })

  it('starts at the index it is given', async () => {
    const el = await mount('index="2"')
    expect(offset(el)).toBe('-392px')
  })

  it('shows only the controls asked for', async () => {
    const dotsOnly = await mount('controls="dots"')
    expect(part(dotsOnly, 'prev')).toBeNull()
    expect(part(dotsOnly, 'dots')).not.toBeNull()
    const none = await mount('controls="none"')
    expect(part(none, 'buttons')).toBeNull()
    expect(part(none, 'dots')).toBeNull()
  })

  it('needs no controls when every slide fits', async () => {
    const el = await mount('', 2)
    expect(part(el, 'dots')).toBeNull()
    expect(part(el, 'prev')).toBeNull()
  })

  it('keeps images and links from being dragged out', async () => {
    const el = await mount()
    const drag = new Event('dragstart', { bubbles: true, cancelable: true })
    slides(el)[0].querySelector('a')?.dispatchEvent(drag)
    expect(drag.defaultPrevented).toBe(true)
  })

  describe('autoplay', () => {
    it('turns on its own, going round at the end, with a play button first', async () => {
      motion.set(false)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const el = await mountQuietly('autoplay="1000"')
      const buttons = part(el, 'buttons')
      expect(buttons.firstElementChild?.getAttribute('part')).toBe(
        'play-button',
      )
      expect(part(el, 'play-button').getAttribute('aria-label')).toBe(
        'Stop automatic slide show',
      )
      const live = el.shadowRoot?.querySelector('[aria-live]') as HTMLElement
      expect(live.getAttribute('aria-live')).toBe('off')
      vi.advanceTimersByTime(1000)
      expect(el.index).toBe(1)
      vi.advanceTimersByTime(3000)
      expect(el.index).toBe(0)
    })

    it('stops for good from the play button', async () => {
      motion.set(false)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const el = await mountQuietly('autoplay="1000"')
      part(el, 'play-button').click()
      await el.updateComplete
      expect(part(el, 'play-button').getAttribute('aria-label')).toBe(
        'Start automatic slide show',
      )
      vi.advanceTimersByTime(5000)
      expect(el.index).toBe(0)
    })

    it('holds under the mouse', async () => {
      motion.set(false)
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const el = await mountQuietly('autoplay="1000"')
      el.dispatchEvent(
        new PointerEvent('pointerenter', { pointerType: 'mouse' }),
      )
      vi.advanceTimersByTime(3000)
      expect(el.index).toBe(0)
    })

    it('reads a bare autoplay attribute as five seconds', async () => {
      const el = await mount('autoplay')
      expect(el.autoplay).toBe(5000)
    })

    it('never starts under reduced motion, and shows no play button', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const el = await mountQuietly('autoplay="1000"')
      expect(part(el, 'play-button')).toBeNull()
      vi.advanceTimersByTime(5000)
      expect(el.index).toBe(0)
    })
  })

  it('springs to the slide when motion is allowed', async () => {
    motion.set(false)
    const el = await mount()
    el.next()
    expect(el.index).toBe(1)
    // The spring is under way, not jumped.
    expect(offset(el)).toBe('0px')
  })

  it('has a reduced-motion rule for its controls', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('overflow: clip')
  })
})

/** Mounts under fake timers: the slot's report is awaited with a microtask. */
async function mountQuietly(attributes: string): Promise<MoulCarousel> {
  const holder = document.createElement('div')
  holder.innerHTML = `<moul-carousel ${attributes}>${'<article></article>'.repeat(5)}</moul-carousel>`
  const el = holder.querySelector('moul-carousel') as MoulCarousel
  document.body.append(holder)
  await el.updateComplete
  await Promise.resolve()
  layout(el)
  await el.updateComplete
  return el
}
