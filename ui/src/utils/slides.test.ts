import { html, LitElement } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../test-setup'
import {
  AutoplayController,
  isRtl,
  labelSlides,
  normalizeIndex,
  parseControls,
  setSlideHidden,
  slideIntent,
  unlabelSlide,
} from './slides'

describe('parseControls', () => {
  it('shows both by default, and reads a token list', () => {
    expect(parseControls(undefined)).toEqual({ arrows: true, dots: true })
    expect(parseControls('arrows dots')).toEqual({ arrows: true, dots: true })
    expect(parseControls('dots')).toEqual({ arrows: false, dots: true })
    expect(parseControls(' ARROWS ')).toEqual({ arrows: true, dots: false })
    expect(parseControls('none')).toEqual({ arrows: false, dots: false })
    expect(parseControls('')).toEqual({ arrows: false, dots: false })
  })
})

describe('slideIntent', () => {
  const key = (k: string, init: KeyboardEventInit = {}) =>
    new KeyboardEvent('keydown', { key: k, ...init })

  it('maps arrows to the reading direction, and Home and End to the ends', () => {
    expect(slideIntent(key('ArrowRight'), false)).toBe('next')
    expect(slideIntent(key('ArrowLeft'), false)).toBe('previous')
    expect(slideIntent(key('ArrowRight'), true)).toBe('previous')
    expect(slideIntent(key('ArrowLeft'), true)).toBe('next')
    expect(slideIntent(key('Home'), false)).toBe('first')
    expect(slideIntent(key('End'), true)).toBe('last')
    expect(slideIntent(key('ArrowDown'), false)).toBeNull()
    expect(slideIntent(key('ArrowRight', { metaKey: true }), false)).toBeNull()
  })
})

describe('normalizeIndex', () => {
  it('clamps, or wraps round when asked', () => {
    expect(normalizeIndex(5, 3, false)).toBe(2)
    expect(normalizeIndex(-1, 3, false)).toBe(0)
    expect(normalizeIndex(3, 3, true)).toBe(0)
    expect(normalizeIndex(-1, 3, true)).toBe(2)
    expect(normalizeIndex(Number.NaN, 3, true)).toBe(0)
    expect(normalizeIndex(2, 0, true)).toBe(0)
  })
})

describe('isRtl', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('follows the nearest dir attribute', () => {
    document.body.innerHTML =
      '<div dir="rtl"><span id="a"></span><div dir="ltr"><span id="b"></span></div></div>'
    expect(isRtl(document.getElementById('a') as Element)).toBe(true)
    expect(isRtl(document.getElementById('b') as Element)).toBe(false)
  })
})

describe('labelSlides', () => {
  it('names slides "N of M" with the slide role, and leaves an author name alone', () => {
    const slides = [0, 1, 2].map(() => document.createElement('div'))
    slides[1].setAttribute('aria-label', 'Sophea Lim')
    const labelled = labelSlides(slides)
    expect(slides[0].getAttribute('role')).toBe('group')
    expect(slides[0].getAttribute('aria-roledescription')).toBe('slide')
    expect(slides[0].getAttribute('aria-label')).toBe('1 of 3')
    expect(slides[1].getAttribute('aria-label')).toBe('Sophea Lim')
    expect(slides[2].getAttribute('aria-label')).toBe('3 of 3')

    // Renumbered when one goes, and the one that left is restored.
    const kept = [slides[0], slides[2]]
    labelSlides(kept, labelled)
    expect(slides[2].getAttribute('aria-label')).toBe('2 of 2')
    expect(slides[1].hasAttribute('role')).toBe(false)
    expect(slides[1].getAttribute('aria-label')).toBe('Sophea Lim')
  })

  it('keeps an author role, and skips slides that name themselves', () => {
    const list = document.createElement('li')
    list.setAttribute('role', 'listitem')
    const image = document.createElement('img')
    image.alt = 'A lake'
    labelSlides([list, image], new Set(), (slide) => slide === image)
    expect(list.getAttribute('role')).toBe('listitem')
    expect(list.getAttribute('aria-label')).toBe('1 of 2')
    expect(image.hasAttribute('role')).toBe(false)
    expect(image.hasAttribute('aria-label')).toBe(false)

    unlabelSlide(list)
    expect(list.getAttribute('role')).toBe('listitem')
    expect(list.hasAttribute('aria-label')).toBe(false)
    expect(list.hasAttribute('aria-roledescription')).toBe(false)
  })
})

describe('setSlideHidden', () => {
  it('sets inert, and only removes an inert it set', () => {
    const slide = document.createElement('div')
    setSlideHidden(slide, true)
    expect(slide.hasAttribute('inert')).toBe(true)
    setSlideHidden(slide, false)
    expect(slide.hasAttribute('inert')).toBe(false)

    const authored = document.createElement('div')
    authored.setAttribute('inert', '')
    setSlideHidden(authored, true)
    setSlideHidden(authored, false)
    expect(authored.hasAttribute('inert')).toBe(true)
  })
})

let hostCount = 0

class AutoplayHost extends LitElement {
  rotation!: AutoplayController
  interval = 1000
  advances = 0
  protected override render() {
    return html`<button part="play-button">Play</button><button part="other">Go</button>`
  }
}

async function mount(): Promise<AutoplayHost> {
  const tag = `autoplay-host-${++hostCount}`
  customElements.define(
    tag,
    class extends AutoplayHost {
      constructor() {
        super()
        this.rotation = new AutoplayController(this, {
          interval: () => this.interval,
          onAdvance: () => {
            this.advances++
          },
          isPlayButton: (element) =>
            element instanceof Element &&
            element.getAttribute('part') === 'play-button',
        })
      }
    },
  )
  const el = document.createElement(tag) as AutoplayHost
  document.body.append(el)
  await el.updateComplete
  return el
}

const mouse = (type: string) =>
  new PointerEvent(type, { pointerType: 'mouse', bubbles: false })

describe('AutoplayController', () => {
  let io: IntersectionMock
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    vi.useFakeTimers()
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    io.restore()
    motion?.restore()
    motion = null
    vi.useRealTimers()
  })

  it('advances once per interval', async () => {
    const el = await mount()
    expect(el.rotation.isRunning).toBe(true)
    vi.advanceTimersByTime(999)
    expect(el.advances).toBe(0)
    vi.advanceTimersByTime(1)
    expect(el.advances).toBe(1)
    vi.advanceTimersByTime(2000)
    expect(el.advances).toBe(3)
  })

  it('holds under a hovering mouse and resumes when it leaves', async () => {
    const el = await mount()
    el.dispatchEvent(mouse('pointerenter'))
    vi.advanceTimersByTime(3000)
    expect(el.advances).toBe(0)
    el.dispatchEvent(mouse('pointerleave'))
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(1)
    // A finger resting on the screen is not a hover.
    el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(2)
  })

  it('holds while focus is inside, except on the play button', async () => {
    const el = await mount()
    const other = el.shadowRoot?.querySelector('[part="other"]') as HTMLElement
    const play = el.shadowRoot?.querySelector(
      '[part="play-button"]',
    ) as HTMLElement
    other.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true }),
    )
    vi.advanceTimersByTime(2000)
    expect(el.advances).toBe(0)
    play.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true }),
    )
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(1)
    other.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, composed: true }),
    )
    el.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }))
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(2)
  })

  it('holds while off screen and while the document is hidden', async () => {
    const el = await mount()
    io.leave(el)
    vi.advanceTimersByTime(3000)
    expect(el.advances).toBe(0)
    io.enter(el)
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(1)

    let state: DocumentVisibilityState = 'hidden'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(3000)
    expect(el.advances).toBe(1)
    state = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(2)
    delete (document as unknown as Record<string, unknown>).visibilityState
  })

  it('stops for good when paused, and restart() counts a full interval again', async () => {
    const el = await mount()
    vi.advanceTimersByTime(600)
    el.rotation.restart()
    vi.advanceTimersByTime(600)
    expect(el.advances).toBe(0)
    vi.advanceTimersByTime(400)
    expect(el.advances).toBe(1)

    el.rotation.toggle()
    expect(el.rotation.isPaused).toBe(true)
    vi.advanceTimersByTime(5000)
    expect(el.advances).toBe(1)
    el.rotation.toggle()
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(2)
  })

  it('never runs under reduced motion, or with no interval', async () => {
    motion = mockReducedMotion(true)
    const el = await mount()
    expect(el.rotation.isEnabled).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(el.advances).toBe(0)
    motion.set(false)
    vi.advanceTimersByTime(1000)
    expect(el.advances).toBe(1)

    el.interval = 0
    el.requestUpdate()
    await el.updateComplete
    expect(el.rotation.isEnabled).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(el.advances).toBe(1)
  })

  it('stops its timer when the host leaves the page', async () => {
    const el = await mount()
    el.remove()
    vi.advanceTimersByTime(5000)
    expect(el.advances).toBe(0)
  })
})
