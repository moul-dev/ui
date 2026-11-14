import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './ImageSlider'
import type { MoulImageSlider } from './ImageSlider'
import { imageSliderStyles } from './ImageSlider.styles'

const css = imageSliderStyles.map((sheet) => sheet.cssText).join('\n')

const IMAGES = ['Hills at dawn', 'A lake at dusk', 'A sandy shore']

/** Mounts a slider of three images, plus whatever `extra` markup. */
async function mount(attributes = '', extra = ''): Promise<MoulImageSlider> {
  const holder = document.createElement('div')
  holder.innerHTML = `<moul-image-slider label="Trip" ${attributes}>${IMAGES.map(
    (alt, i) => `<img src="/demo/${i}.svg" alt="${alt}" />`,
  ).join('')}${extra}</moul-image-slider>`
  const el = holder.querySelector('moul-image-slider') as MoulImageSlider
  document.body.append(holder)
  await el.updateComplete
  await settle()
  return el
}

/** Lets the async image change and the render it causes run. */
const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

const part = (el: MoulImageSlider, name: string) =>
  el.shadowRoot?.querySelector(`[part~="${name}"]`) as HTMLElement
const images = (el: MoulImageSlider) =>
  [...el.children].filter(
    (child): child is HTMLImageElement => child instanceof HTMLImageElement,
  )
const states = (el: MoulImageSlider) =>
  images(el).map(
    (image) =>
      `${image.getAttribute('data-moul-slide') ?? '-'}${image.hasAttribute('inert') ? ' inert' : ''}`,
  )
const key = (target: Element, k: string) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: k,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )

describe('<moul-image-slider>', () => {
  let motion: ReducedMotionMock
  let io: IntersectionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
    io = mockIntersectionObserver()
    // Images in the test document never load; treat them as decoded.
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    motion.restore()
    io.restore()
    delete (HTMLImageElement.prototype as unknown as Record<string, unknown>)
      .complete
    vi.useRealTimers()
  })

  it('is a labelled carousel region with a focusable frame', async () => {
    const el = await mount()
    const base = part(el, 'base')
    expect(base.getAttribute('role')).toBe('region')
    expect(base.getAttribute('aria-roledescription')).toBe('carousel')
    expect(base.getAttribute('aria-label')).toBe('Trip')
    expect(part(el, 'frame').getAttribute('tabindex')).toBe('0')
    expect(part(el, 'slides').querySelector('slot')).not.toBeNull()
    expect(part(el, 'overlay').querySelector('slot[name="overlay"]')).not.toBe(
      null,
    )
  })

  it('shows the first image and hides the rest from focus and screen readers', async () => {
    const el = await mount()
    expect(el.index).toBe(0)
    expect(states(el)).toEqual(['current', '- inert', '- inert'])
  })

  it('leaves images their own role and alt, and names other slides "N of M"', async () => {
    const el = await mount('', '<div class="card">A card</div>')
    const [first] = images(el)
    expect(first.hasAttribute('role')).toBe(false)
    expect(first.hasAttribute('aria-label')).toBe(false)
    const card = el.querySelector('.card') as HTMLElement
    expect(card.getAttribute('role')).toBe('group')
    expect(card.getAttribute('aria-label')).toBe('4 of 4')
  })

  it('goes round with next() and previous(), firing slidechange', async () => {
    const el = await mount('interval="0"')
    const changes: number[] = []
    el.addEventListener('slidechange', (event) =>
      changes.push((event as CustomEvent).detail.index),
    )
    el.previous()
    await settle()
    expect(el.index).toBe(2)
    el.next()
    el.next()
    el.goTo(2)
    await settle()
    expect(changes).toEqual([2, 0, 1, 2])
    expect(states(el)[2]).toBe('current')
  })

  it('changes with the arrow keys, Home and End on the frame, mirrored right to left', async () => {
    const el = await mount('interval="0"')
    const frame = part(el, 'frame')
    key(frame, 'ArrowRight')
    expect(el.index).toBe(1)
    key(frame, 'End')
    expect(el.index).toBe(2)
    key(frame, 'Home')
    expect(el.index).toBe(0)
    key(frame, 'ArrowLeft')
    expect(el.index).toBe(2)

    const rtl = document.createElement('div')
    rtl.dir = 'rtl'
    document.body.append(rtl)
    rtl.append(el)
    await el.updateComplete
    key(frame, 'ArrowLeft')
    expect(el.index).toBe(0)
  })

  it('announces the slide and its alt text after a change the reader makes', async () => {
    const el = await mount('interval="0"')
    part(el, 'next').click()
    await el.updateComplete
    const live = el.shadowRoot?.querySelector('[aria-live]') as HTMLElement
    expect(live.getAttribute('aria-live')).toBe('polite')
    expect(live.textContent?.trim()).toBe('Slide 2 of 3: A lake at dusk')
  })

  it('has previous, next and dot buttons', async () => {
    const el = await mount('interval="0"')
    expect(part(el, 'prev').getAttribute('aria-label')).toBe('Previous slide')
    part(el, 'prev').click()
    expect(el.index).toBe(2)
    const dots =
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part~="dot"]')
    expect(dots).toHaveLength(3)
    dots?.[1].click()
    await el.updateComplete
    expect(el.index).toBe(1)
    expect(dots?.[1].getAttribute('aria-current')).toBe('true')

    const bare = await mount('controls="none"')
    expect(part(bare, 'prev')).toBeNull()
    expect(part(bare, 'dots')).toBeNull()
  })

  it('cross-fades the incoming image over the outgoing one', async () => {
    const el = await mount('interval="0"')
    const calls: Array<{ target: HTMLElement; keyframes: Keyframe[] }> = []
    for (const image of images(el)) {
      image.animate = ((keyframes: Keyframe[]) => {
        calls.push({ target: image, keyframes })
        return {
          finished: new Promise(() => {}),
          finish: () => {},
          cancel: () => {},
          pause: () => {},
          play: () => {},
        } as unknown as Animation
      }) as typeof image.animate
    }
    el.next()
    await settle()
    expect(calls).toHaveLength(1)
    expect(calls[0].target).toBe(images(el)[1])
    expect(calls[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }])
    expect(states(el)).toEqual(['leaving inert', 'current', '- inert'])
  })

  it('slides both images along with effect="slide", from the side of travel', async () => {
    const el = await mount('effect="slide" interval="0"')
    const calls: Array<{ target: HTMLElement; keyframes: Keyframe[] }> = []
    for (const image of images(el)) {
      image.animate = ((keyframes: Keyframe[]) => {
        calls.push({ target: image, keyframes })
        return {
          finished: Promise.resolve(),
          finish: () => {},
          cancel: () => {},
        } as unknown as Animation
      }) as typeof image.animate
    }
    el.previous()
    await settle()
    expect(calls.map((call) => call.keyframes)).toEqual([
      [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }],
      [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }],
    ])
    expect(calls[0].target).toBe(images(el)[2])
    // Once the change finishes, only the current image is drawn.
    await settle()
    expect(states(el)).toEqual(['- inert', '- inert', 'current'])
  })

  it('falls back to fade for an unknown effect', async () => {
    const el = await mount('effect="spin"')
    expect(el.effect).toBe('fade')
  })

  it('changes images at once under reduced motion, with no autoplay', async () => {
    motion.set(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount()
    const animate = vi.fn()
    for (const image of images(el)) {
      image.animate = animate as unknown as typeof image.animate
    }
    expect(part(el, 'play-button')).toBeNull()
    vi.advanceTimersByTime(20_000)
    expect(el.index).toBe(0)
    el.next()
    await settle()
    expect(animate).not.toHaveBeenCalled()
    expect(states(el)).toEqual(['- inert', 'current', '- inert'])
  })

  it('turns every five seconds by default, holding under the mouse', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount()
    expect(part(el, 'play-button').getAttribute('aria-label')).toBe(
      'Stop automatic slide show',
    )
    // The play button comes first, before the frame.
    expect(part(el, 'base').firstElementChild?.getAttribute('part')).toBe(
      'play-button',
    )
    vi.advanceTimersByTime(5000)
    expect(el.index).toBe(1)
    el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    vi.advanceTimersByTime(20_000)
    expect(el.index).toBe(1)
    el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    vi.advanceTimersByTime(5000)
    expect(el.index).toBe(2)

    part(el, 'play-button').click()
    vi.advanceTimersByTime(20_000)
    expect(el.index).toBe(2)
  })

  it('shows the scrim only when the overlay has content', async () => {
    const plain = await mount()
    expect(part(plain, 'scrim').hidden).toBe(true)
    const titled = await mount('', '<h2 slot="overlay">Four days</h2>')
    expect(part(titled, 'scrim').hidden).toBe(false)
  })

  it('changes image on a swipe toward the start', async () => {
    const el = await mount('interval="0"')
    const frame = part(el, 'frame')
    let time = 1000
    const pointer = (type: string, target: EventTarget, x: number) => {
      const event = new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        pointerType: 'touch',
        clientX: x,
        clientY: 10,
        bubbles: true,
        composed: true,
      })
      Object.defineProperty(event, 'timeStamp', { value: time })
      target.dispatchEvent(event)
    }
    pointer('pointerdown', frame, 300)
    for (let x = 290; x >= 200; x -= 10) {
      time += 16
      pointer('pointermove', window, x)
    }
    pointer('pointerup', window, 200)
    expect(el.index).toBe(1)

    // A short nudge is not a swipe.
    time += 1000
    pointer('pointerdown', frame, 300)
    time += 200
    pointer('pointermove', window, 320)
    time += 200
    pointer('pointerup', window, 320)
    expect(el.index).toBe(1)
  })

  it('waits for the next image to decode before showing it', async () => {
    const el = await mount('interval="0"')
    delete (HTMLImageElement.prototype as unknown as Record<string, unknown>)
      .complete
    let decoded: () => void = () => {}
    const next = images(el)[1]
    Object.defineProperty(next, 'complete', { get: () => false })
    next.decode = () =>
      new Promise<void>((resolve) => {
        decoded = resolve
      })
    el.next()
    await settle()
    expect(el.index).toBe(1)
    expect(states(el)[1]).toBe('- inert')
    decoded()
    await settle()
    expect(states(el)[1]).toBe('current')
  })

  it('moves without an event when index is set from outside', async () => {
    const el = await mount('interval="0"')
    const onChange = vi.fn()
    el.addEventListener('slidechange', onChange)
    el.index = 2
    await el.updateComplete
    await settle()
    expect(states(el)[2]).toBe('current')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('takes its marks off the images when it leaves', async () => {
    const el = await mount()
    const all = images(el)
    el.remove()
    expect(all.some((image) => image.hasAttribute('data-moul-slide'))).toBe(
      false,
    )
    expect(all.some((image) => image.hasAttribute('inert'))).toBe(false)
  })

  it('covers the frame with every image and keeps the scrim dark in both themes', () => {
    expect(css).toContain('object-fit: cover')
    expect(css).toContain('var(--color-black)')
    expect(css).toContain('--image-slider-height, 28rem')
  })
})
