import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  triggerResize,
} from '../../test-setup'
import './Marquee'
import type { MoulMarquee } from './Marquee'
import { marqueeStyles } from './Marquee.styles'

/** Lets queued microtasks (the copy rebuild) and the following render run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const copiesOf = (el: Element) =>
  [...el.children].filter((child) => child.hasAttribute('data-marquee-copy'))

const originalsOf = (el: Element) =>
  [...el.children].filter((child) => !child.hasAttribute('data-marquee-copy'))

const shadow = (el: MoulMarquee) => el.shadowRoot as ShadowRoot

const track = (el: MoulMarquee) =>
  shadow(el).querySelector('[part="track"]') as HTMLElement

const firstGroup = (el: MoulMarquee) =>
  shadow(el).querySelector('[part="group"]') as HTMLElement

const css = marqueeStyles.cssText

/** The body of the first `@media` block whose query contains `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media (${query})`)
  if (start < 0) return ''
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index++) {
    if (css[index] === '{') depth++
    else if (css[index] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, index)
    }
  }
  return ''
}

describe('<moul-marquee>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    vi.restoreAllMocks()
  })

  it('renders the items in a group inside a track', async () => {
    const el = await fixture<MoulMarquee>(
      html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
    )
    expect(track(el)).not.toBeNull()
    const slot = firstGroup(el).querySelector('slot:not([name])')
    expect(slot).not.toBeNull()
    expect(originalsOf(el).map((item) => item.textContent)).toEqual([
      'Ash',
      'Birch',
    ])
    expect(el.direction).toBe('start')
    expect(el.speed).toBe(40)
  })

  describe('copies', () => {
    it('makes one set of light-DOM copies before it has measured, each hidden and inert', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee
          ><span>Ash</span><a href="#birch">Birch</a></moul-marquee
        >`,
      )
      const copies = copiesOf(el)
      expect(copies.map((copy) => copy.textContent)).toEqual(['Ash', 'Birch'])
      for (const copy of copies) {
        expect(copy.getAttribute('slot')).toBe('copy-1')
        expect(copy.getAttribute('aria-hidden')).toBe('true')
        expect(copy.hasAttribute('inert')).toBe(true)
      }
      const groups = shadow(el).querySelectorAll('[part="group"]')
      expect(groups).toHaveLength(2)
      expect(groups[1].querySelector('slot')?.getAttribute('name')).toBe(
        'copy-1',
      )
    })

    it('makes enough sets to cover the host once more', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
      )
      triggerResize(firstGroup(el), { width: 300, height: 40 })
      triggerResize(el, { width: 1000, height: 40 })
      await settle()
      // ceil(1000 / 300) = 4 sets of two items.
      expect(copiesOf(el)).toHaveLength(8)
      const names = [...shadow(el).querySelectorAll('slot[name]')].map((slot) =>
        slot.getAttribute('name'),
      )
      expect(names).toEqual(['copy-1', 'copy-2', 'copy-3', 'copy-4'])
      expect(
        copiesOf(el)
          .filter((copy) => copy.getAttribute('slot') === 'copy-4')
          .map((copy) => copy.textContent),
      ).toEqual(['Ash', 'Birch'])

      // A wide group needs only the minimum of one set.
      triggerResize(firstGroup(el), { width: 2400, height: 40 })
      await settle()
      expect(copiesOf(el)).toHaveLength(2)
    })

    it('starts every group afresh, together, when the number of sets changes', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const before = firstGroup(el)
      triggerResize(before, { width: 300, height: 40 })
      triggerResize(el, { width: 1000, height: 40 })
      await settle()
      const after = firstGroup(el)
      // New group elements start their animations at the same moment.
      expect(after).not.toBe(before)
      expect(after.querySelector('slot:not([name])')).not.toBeNull()

      // The new first group is the one measured now.
      triggerResize(after, { width: 500, height: 40 })
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '12500ms',
      )
      await settle()
      // ceil(1000 / 500) = 2 sets.
      expect(copiesOf(el)).toHaveLength(2)
    })

    it('rebuilds the copies when the items change', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const added = document.createElement('span')
      added.textContent = 'Cedar'
      el.append(added)
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual([
        'Ash',
        'Cedar',
      ])

      // Text changing inside an item counts too.
      ;(originalsOf(el)[0] as HTMLElement).textContent = 'Alder'
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual([
        'Alder',
        'Cedar',
      ])

      originalsOf(el)[1].remove()
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual(['Alder'])
    })

    it('leaves the copies alone when only the host or a copy changes', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const before = copiesOf(el)[0]
      el.isPaused = true
      el.fadeEdges = true
      await settle()
      expect(copiesOf(el)[0]).toBe(before)
      before.setAttribute('title', 'changed')
      await settle()
      expect(copiesOf(el)[0]).toBe(before)
    })

    it('strips ids from the copies so they never clash with the originals', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee
          ><div id="logo-a"><svg><g id="mark"></g></svg></div></moul-marquee
        >`,
      )
      const [copy] = copiesOf(el)
      expect(copy.hasAttribute('id')).toBe(false)
      expect(copy.querySelector('[id]')).toBeNull()
      expect(el.querySelectorAll('#logo-a')).toHaveLength(1)
    })

    it('copies only elements, and makes none for an empty marquee', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee>Just text</moul-marquee>`,
      )
      expect(copiesOf(el)).toHaveLength(0)
      expect(shadow(el).querySelectorAll('[part="group"]')).toHaveLength(1)
    })

    it('removes every copy on disconnect and makes them again on reconnect', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
      )
      const parent = el.parentElement as HTMLElement
      el.remove()
      expect(copiesOf(el)).toHaveLength(0)
      expect(originalsOf(el)).toHaveLength(2)

      parent.append(el)
      await settle()
      expect(copiesOf(el)).toHaveLength(2)
    })
  })

  describe('direction and speed', () => {
    it('reflects direction and falls back to start for an unknown value', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee direction="up"><span>A</span></moul-marquee>`,
      )
      expect(el.getAttribute('direction')).toBe('up')
      el.setAttribute('direction', 'sideways')
      await el.updateComplete
      expect(el.direction).toBe('start')
      expect(el.getAttribute('direction')).toBe('start')
    })

    it('moves toward the inline start, swaps sides in RTL, and reverses for end and down', () => {
      expect(css).toMatch(/:host\(:dir\(rtl\)\)\s*\{[^}]*--_marquee-sign: 1/)
      expect(css).toMatch(
        /translate: calc\(var\(--_marquee-sign\) \* \(100% \+ var\(--_marquee-gap\)\)\) 0/,
      )
      expect(css).toMatch(
        /:host\(\[direction="end"\]\) \.group,\s*:host\(\[direction="down"\]\) \.group\s*\{\s*animation-direction: reverse/,
      )
      expect(css).toMatch(/translate: 0 calc\(-100% - var\(--_marquee-gap\)\)/)
      expect(css).toContain('animation-name: moul-marquee-column')
      expect(css).toContain('--marquee-gap, var(--spacing-8, 2rem)')
    })

    it('sets the duration from the group length, the gap and the speed', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      // A default duration holds until the first measurement.
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe('')
      expect(css).toContain('var(--_marquee-duration, 20s)')

      triggerResize(firstGroup(el), { width: 300, height: 40 })
      // (300 px + 0 px gap) / 40 px per second
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '7500ms',
      )

      el.speed = 100
      await el.updateComplete
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '3000ms',
      )

      el.speed = -5
      await el.updateComplete
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '7500ms',
      )
    })

    it('counts the gap in the distance of one loop', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      const real = window.getComputedStyle
      vi.spyOn(window, 'getComputedStyle').mockImplementation(
        (target: Element) =>
          target === track(el)
            ? ({ columnGap: '32px', rowGap: '32px' } as CSSStyleDeclaration)
            : real(target),
      )
      triggerResize(firstGroup(el), { width: 288, height: 40 })
      // (288 + 32) / 40 = 8 seconds
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '8000ms',
      )
    })

    it('never takes its length from its content, so copies cannot lengthen it', () => {
      expect(css).toMatch(
        /:host\s*\{[^}]*inline-size: 100%;[^}]*contain: inline-size/,
      )
      expect(css).toMatch(
        /:host\(\[direction="up"\]\),\s*:host\(\[direction="down"\]\)\s*\{\s*contain: size/,
      )
    })

    it('measures heights in a column', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee direction="up" speed="20"
          ><span>A</span></moul-marquee
        >`,
      )
      triggerResize(firstGroup(el), { width: 300, height: 100 })
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '5000ms',
      )
      triggerResize(el, { width: 300, height: 450 })
      await settle()
      // ceil(450 / 100) = 5 sets.
      expect(copiesOf(el)).toHaveLength(5)
    })
  })

  describe('pausing', () => {
    it('pauses while off screen and runs while on screen', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      io.enter(el)
      await el.updateComplete
      expect(track(el).classList.contains('is-offscreen')).toBe(false)
      io.leave(el)
      await el.updateComplete
      expect(track(el).classList.contains('is-offscreen')).toBe(true)
      expect(css).toMatch(
        /\.is-offscreen \.group\s*\{\s*animation-play-state: paused/,
      )
    })

    it('pauses with is-paused, on hover with pause-on-hover, and whenever focus is inside', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      el.isPaused = true
      el.pauseOnHover = true
      await el.updateComplete
      expect(el.hasAttribute('is-paused')).toBe(true)
      expect(el.hasAttribute('pause-on-hover')).toBe(true)
      const rule =
        /:host\(\[is-paused\]\) \.group,\s*:host\(\[pause-on-hover\]:hover\) \.group,\s*:host\(:focus-within\) \.group,\s*\.is-offscreen \.group\s*\{\s*animation-play-state: paused/
      expect(css).toMatch(rule)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the copies are hidden and inert', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><a href="#a">Alpha</a></moul-marquee>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      const [original] = originalsOf(el)
      expect(original.hasAttribute('aria-hidden')).toBe(false)
      expect(original.hasAttribute('inert')).toBe(false)
      const [copy] = copiesOf(el) as HTMLElement[]
      expect(copy.inert).toBe(true)
      expect(copy.getAttribute('aria-hidden')).toBe('true')
    })

    it('stops at its start and scrolls the focused item into view on keyboard focus', async () => {
      const el = await fixture<MoulMarquee>(
        html`<div>
          <moul-marquee
            ><a href="#a">Alpha</a><a href="#b">Beta</a></moul-marquee
          >
          <button>After</button>
        </div>`,
      ).then((wrapper) => wrapper.querySelector('moul-marquee') as MoulMarquee)
      const [, beta] = originalsOf(el) as HTMLElement[]
      triggerResize(track(el), { width: 400, height: 40 })
      triggerResize(beta, { width: 80, height: 40, left: 450 })
      const scrollBy = vi.fn()
      track(el).scrollBy = scrollBy as unknown as HTMLElement['scrollBy']

      beta.focus()
      await el.updateComplete
      await settle()
      expect(track(el).classList.contains('is-browsing')).toBe(true)
      // The item ends at 530, the track at 400.
      expect(scrollBy).toHaveBeenCalledWith({ left: 130 })

      const after = el.parentElement?.querySelector('button') as HTMLElement
      after.focus()
      await el.updateComplete
      expect(track(el).classList.contains('is-browsing')).toBe(false)
    })

    it('only pauses, without jumping, when a pointer puts focus inside', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><a href="#a">Alpha</a></moul-marquee>`,
      )
      const [alpha] = originalsOf(el) as HTMLElement[]
      // A mouse click focuses without :focus-visible.
      const matches = alpha.matches.bind(alpha)
      vi.spyOn(alpha, 'matches').mockImplementation((selector: string) =>
        selector === ':focus-visible' ? false : matches(selector),
      )
      alpha.focus()
      await el.updateComplete
      expect(track(el).classList.contains('is-browsing')).toBe(false)
    })

    it('lets the browsing row scroll with no animation and no fade', () => {
      const block = mediaBlock('prefers-reduced-motion: no-preference')
      expect(block).toMatch(/\.track\.is-browsing\s*\{\s*overflow: auto hidden/)
      expect(block).toMatch(
        /\.track\.is-browsing \.group\s*\{\s*animation: none/,
      )
      expect(block).toMatch(
        /\.track\.is-browsing\s*\{\s*-webkit-mask-image: none/,
      )
    })
  })

  describe('fade edges', () => {
    it('masks both ends along the direction of travel', () => {
      expect(css).toMatch(
        /:host\(\[fade-edges\]\) \.track\s*\{[^}]*mask-image: linear-gradient\(\s*to right/,
      )
      expect(css).toMatch(
        /:host\(\[fade-edges\]\[direction="up"\]\) \.track,[^{]*\{[^}]*mask-image: linear-gradient\(\s*to bottom/,
      )
    })
  })

  describe('reduced motion', () => {
    it('makes no copies, and makes them once motion is allowed again', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await fixture<MoulMarquee>(
          html`<moul-marquee><span>A</span><span>B</span></moul-marquee>`,
        )
        expect(copiesOf(el)).toHaveLength(0)
        expect(shadow(el).querySelectorAll('[part="group"]')).toHaveLength(1)

        motion.set(false)
        await settle()
        expect(copiesOf(el)).toHaveLength(2)

        motion.set(true)
        await settle()
        expect(copiesOf(el)).toHaveLength(0)

        el.remove()
        expect(motion.listenerCount()).toBe(0)
      } finally {
        motion.restore()
      }
    })

    it('stops the movement, hides the copies and lets the row scroll by hand', () => {
      const block = mediaBlock('prefers-reduced-motion: reduce')
      expect(block).toContain('animation: none !important')
      expect(block).toMatch(/\.group\.copy\s*\{\s*display: none/)
      expect(block).toMatch(/\.track\s*\{\s*overflow: auto hidden/)
      expect(block).toMatch(/\.track\s*\{\s*overflow: hidden auto/)
      expect(block).toContain('mask-image: none')
    })
  })
})

/** Gives the page a scroll range of 2000px. */
function mockPage() {
  const page = document.scrollingElement ?? document.documentElement
  let top = 0
  Object.defineProperties(page, {
    scrollHeight: { configurable: true, get: () => 3000 },
    clientHeight: { configurable: true, get: () => 1000 },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    },
  })
  return {
    scrollTo(value: number) {
      top = value
      window.dispatchEvent(new Event('scroll'))
    },
    restore() {
      const own = page as unknown as Record<string, unknown>
      delete own.scrollHeight
      delete own.clientHeight
      delete own.scrollTop
    },
  }
}

interface FakeAnimation {
  animationName: string
  playbackRate: number
  currentTime: number
  effect: { getComputedTiming(): { duration: number } }
  updatePlaybackRate: ReturnType<typeof vi.fn>
}

/** Stands in for the groups' CSS animations, which happy-dom does not run. */
function fakeAnimations(el: MoulMarquee, count = 2): FakeAnimation[] {
  const animations = Array.from({ length: count }, () => {
    const animation: FakeAnimation = {
      animationName: 'moul-marquee-row',
      playbackRate: 1,
      currentTime: 1500,
      effect: { getComputedTiming: () => ({ duration: 10_000 }) },
      updatePlaybackRate: vi.fn((rate: number) => {
        animation.playbackRate = rate
      }),
    }
    return animation
  })
  const other = {
    animationName: 'something-else',
    updatePlaybackRate: vi.fn(),
  }
  ;(shadow(el) as unknown as { getAnimations: () => unknown[] }).getAnimations =
    () => [...animations, other]
  return animations
}

describe('<moul-marquee scroll-velocity>', () => {
  let io: IntersectionMock
  let frames: ManualFrames
  let page: ReturnType<typeof mockPage>
  let now = 0

  /** Scrolls the page to `top`, `ms` after the last frame, and runs one frame. */
  const scrollPage = (top: number, ms = 16) => {
    now += ms
    page.scrollTo(top)
    frames.step(now)
  }

  /** Runs `count` frames with nothing scrolling. */
  const idle = (count: number) => {
    for (let index = 0; index < count; index++) {
      now += 16
      frames.step(now)
    }
  }

  async function mount(attributes = 'scroll-velocity') {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = `<moul-marquee ${attributes}><span>Ash</span><span>Birch</span></moul-marquee>`
    document.body.append(wrapper)
    const el = wrapper.querySelector('moul-marquee') as MoulMarquee
    await el.updateComplete
    io.enter(el)
    await el.updateComplete
    const animations = fakeAnimations(el)
    return { el, animations }
  }

  beforeEach(() => {
    io = mockIntersectionObserver()
    frames = manualAnimationFrames()
    page = mockPage()
    now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.restoreAllMocks()
    page.restore()
    frames.restore()
    io.restore()
  })

  it('reads the attribute: no value means 2, a missing or bad value turns it off', async () => {
    const { el } = await mount()
    expect(el.scrollVelocity).toBe(2)
    el.setAttribute('scroll-velocity', '3.5')
    expect(el.scrollVelocity).toBe(3.5)
    el.setAttribute('scroll-velocity', '-1')
    expect(el.scrollVelocity).toBe(0)
    el.setAttribute('scroll-velocity', 'fast')
    expect(el.scrollVelocity).toBe(0)
    el.removeAttribute('scroll-velocity')
    expect(el.scrollVelocity).toBe(0)
  })

  it('leaves the speed alone without it', async () => {
    const { animations } = await mount('')
    scrollPage(200)
    scrollPage(600)
    idle(5)
    for (const animation of animations) {
      expect(animation.updatePlaybackRate).not.toHaveBeenCalled()
    }
  })

  it('speeds up with the scroll, easing toward the target rather than jumping', async () => {
    const { animations } = await mount('scroll-velocity="2"')
    // 16px per 16ms is 1000 px/s: aim for 1 + 2 × 1 = 3 times the speed.
    scrollPage(16)
    scrollPage(32)
    scrollPage(48)
    const first = animations[0].playbackRate
    expect(first).toBeGreaterThan(1)
    expect(first).toBeLessThan(3)
    for (let top = 64; top <= 800; top += 16) scrollPage(top)
    expect(animations[0].playbackRate).toBeCloseTo(3, 1)
    // Every group runs at the same rate, so the loop keeps its seam.
    expect(animations[1].playbackRate).toBe(animations[0].playbackRate)
  })

  it('stops speeding up past 3000 px/s', async () => {
    const { animations } = await mount('scroll-velocity="2"')
    for (let top = 200; top <= 10_000; top += 200) scrollPage(top)
    expect(animations[0].playbackRate).toBeCloseTo(7, 1)
  })

  it('runs backward while the reader scrolls up', async () => {
    const { animations } = await mount('scroll-velocity="2"')
    page.scrollTo(1000)
    idle(2)
    for (let top = 984; top >= 200; top -= 16) scrollPage(top)
    expect(animations[0].playbackRate).toBeCloseTo(-3, 1)
  })

  it('moves the loop a whole number of loops ahead before running it backward', async () => {
    const { animations } = await mount('scroll-velocity="2"')
    page.scrollTo(1000)
    idle(2)
    for (let top = 984; top >= 600; top -= 16) scrollPage(top)
    expect(animations[0].playbackRate).toBeLessThan(0)
    // 1500ms into a 10s loop, plus 1000 loops: the same frame, far from the start.
    expect(animations[0].currentTime).toBe(1500 + 10_000 * 1000)
    expect(animations[1].currentTime).toBe(animations[0].currentTime)
  })

  it('eases back to its own speed once the reader stops, then stops working', async () => {
    const { animations } = await mount('scroll-velocity="2"')
    for (let top = 16; top <= 320; top += 16) scrollPage(top)
    expect(animations[0].playbackRate).toBeGreaterThan(2)
    // The scroll controller reports a stop 120ms after the last scroll.
    vi.advanceTimersByTime(200)
    idle(60)
    expect(animations[0].playbackRate).toBe(1)
    expect(frames.pending).toBe(0)
  })

  it('stays at its own speed while off screen', async () => {
    const { el, animations } = await mount('scroll-velocity="2"')
    for (let top = 16; top <= 160; top += 16) scrollPage(top)
    expect(animations[0].playbackRate).toBeGreaterThan(1)
    io.leave(el)
    await el.updateComplete
    scrollPage(400)
    expect(animations[0].playbackRate).toBe(1)
    scrollPage(800)
    expect(animations[0].playbackRate).toBe(1)
  })

  it('goes back to its own speed and stops listening when turned off', async () => {
    const { el, animations } = await mount('scroll-velocity="2"')
    for (let top = 16; top <= 160; top += 16) scrollPage(top)
    el.scrollVelocity = 0
    await el.updateComplete
    expect(animations[0].playbackRate).toBe(1)
    animations[0].updatePlaybackRate.mockClear()
    scrollPage(800)
    idle(5)
    expect(animations[0].updatePlaybackRate).not.toHaveBeenCalled()
  })

  it('goes back to its own speed when removed from the page', async () => {
    const { el, animations } = await mount('scroll-velocity="2"')
    for (let top = 16; top <= 160; top += 16) scrollPage(top)
    el.remove()
    expect(animations[0].playbackRate).toBe(1)
  })

  it('does not follow the scroll under reduced motion, and reacts to the setting', async () => {
    const motion = mockReducedMotion(true)
    try {
      const { el, animations } = await mount('scroll-velocity="2"')
      scrollPage(200)
      scrollPage(400)
      expect(animations[0].updatePlaybackRate).not.toHaveBeenCalled()

      motion.set(false)
      await el.updateComplete
      fakeAnimations(el)
      scrollPage(416)
      scrollPage(432)
      const live = (
        shadow(el) as unknown as { getAnimations: () => FakeAnimation[] }
      ).getAnimations()[0]
      expect(live.playbackRate).toBeGreaterThan(1)

      motion.set(true)
      expect(live.playbackRate).toBe(1)
    } finally {
      motion.restore()
    }
  })
})
