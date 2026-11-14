import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './index'
import type {
  MoulStickyScroll,
  StickyScrollStepChangeDetail,
} from './StickyScroll'
import {
  stickyScrollItemStyles,
  stickyScrollStyles,
} from './StickyScroll.styles'
import type { MoulStickyScrollItem } from './StickyScrollItem'

const settle = () => new Promise((resolve) => setTimeout(resolve))
const items = (el: MoulStickyScroll) =>
  [...el.querySelectorAll('moul-sticky-scroll-item')] as MoulStickyScrollItem[]
const active = (el: MoulStickyScroll) => items(el).map((item) => item.isActive)
const box = (item: MoulStickyScrollItem) => item.stepBox as HTMLElement

/** The reading line in happy-dom's 768px-tall viewport: two fifths down. */
const LINE = window.innerHeight * 0.4

/** Puts the top of each step's text at the given distance from the top of the viewport. */
function place(el: MoulStickyScroll, tops: number[]): void {
  items(el).forEach((item, i) => {
    const top = tops[i] ?? 10_000
    box(item).getBoundingClientRect = () =>
      ({
        top,
        bottom: top + 120,
        left: 0,
        right: 400,
        width: 400,
        height: 120,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect
  })
}

async function walkThrough() {
  const el = await fixture<MoulStickyScroll>(
    html`<moul-sticky-scroll>
      <moul-sticky-scroll-item>
        <h3>Plan the route</h3>
        <p>Phnom Penh to Kampot.</p>
        <div slot="media" role="img" aria-label="A map of the coast"></div>
      </moul-sticky-scroll-item>
      <moul-sticky-scroll-item>
        <h3>Book the bus</h3>
        <p>Three hours on the new road.</p>
        <div slot="media"><button>Open the timetable</button></div>
      </moul-sticky-scroll-item>
      <moul-sticky-scroll-item style="--sticky-scroll-tint: wheat">
        <h3>Walk the river</h3>
        <p>Sunset on the Praek Tuek Chhu.</p>
        <div slot="media" role="img" aria-label="The river at dusk"></div>
      </moul-sticky-scroll-item>
    </moul-sticky-scroll>`,
  )
  await settle()
  await settle()
  return el
}

describe('<moul-sticky-scroll>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    fixtureCleanup()
    io.restore()
  })

  it('registers the walk-through and its steps', async () => {
    const el = await walkThrough()
    expect(customElements.get('moul-sticky-scroll')).toBeDefined()
    expect(customElements.get('moul-sticky-scroll-item')).toBeDefined()
    expect(el.shadowRoot?.querySelector('[part="grid"] slot')).not.toBeNull()
    const [first] = items(el)
    expect(
      first.shadowRoot?.querySelector('[part="content"] slot'),
    ).not.toBeNull()
    expect(
      first.shadowRoot?.querySelector('[part="media"] slot[name="media"]'),
    ).not.toBeNull()
  })

  it('starts on the first step and tells the grid how many rows the panel spans', async () => {
    const el = await walkThrough()
    expect(el.activeIndex).toBe(0)
    expect(active(el)).toEqual([true, false, false])
    await items(el)[0].updateComplete
    expect(items(el)[0].hasAttribute('is-active')).toBe(true)
    expect(el.style.getPropertyValue('--_sticky-scroll-count')).toBe('3')
  })

  it('watches the text of every step, and the walk-through, against the band above the reading line', async () => {
    const el = await walkThrough()
    expect(io.targets).toEqual([...items(el).map(box), el])
  })

  it('makes the last step that has reached the reading line active and fires stepchange', async () => {
    const el = await walkThrough()
    const events: StickyScrollStepChangeDetail[] = []
    el.addEventListener('stepchange', (event) =>
      events.push((event as CustomEvent<StickyScrollStepChangeDetail>).detail),
    )
    place(el, [-200, LINE - 20, LINE + 300])
    io.enter(box(items(el)[1]))
    expect(active(el)).toEqual([false, true, false])
    expect(el.activeIndex).toBe(1)
    expect(events).toEqual([{ current: 1, previous: 0, item: items(el)[1] }])
  })

  it('keeps the last step active once it scrolls on past the line', async () => {
    const el = await walkThrough()
    place(el, [-600, -300, LINE - 10])
    io.enter(box(items(el)[2]))
    place(el, [-900, -600, -300])
    io.leave(box(items(el)[2]))
    expect(el.activeIndex).toBe(2)
  })

  it('finds the right step after a jump that carries several past the line in one frame', async () => {
    const el = await walkThrough()
    // From before the walk-through straight into the room after its last
    // step: no step was ever seen crossing, but the walk-through entered the band.
    place(el, [-1600, -1200, -800])
    io.enter(el)
    expect(el.activeIndex).toBe(2)
    // And straight back to the start.
    place(el, [LINE + 10, LINE + 400, LINE + 800])
    io.leave(el)
    expect(el.activeIndex).toBe(0)
  })

  it('does not fire stepchange when the active step is reported again', async () => {
    const el = await walkThrough()
    let count = 0
    el.addEventListener('stepchange', () => count++)
    place(el, [LINE - 10, LINE + 300, LINE + 600])
    io.enter(box(items(el)[0]))
    expect(count).toBe(0)
  })

  it('takes the background from the active step’s tint', async () => {
    const el = await walkThrough()
    expect(el.style.getPropertyValue('--_sticky-scroll-tint')).toBe('')
    place(el, [-600, -300, LINE - 10])
    io.enter(box(items(el)[2]))
    expect(el.style.getPropertyValue('--_sticky-scroll-tint')).toBe('wheat')
    place(el, [LINE - 10, LINE + 300, LINE + 600])
    io.enter(box(items(el)[0]))
    expect(el.style.getPropertyValue('--_sticky-scroll-tint')).toBe('')
  })

  it('follows steps that are added and removed', async () => {
    const el = await walkThrough()
    place(el, [-600, -300, LINE - 10])
    io.enter(box(items(el)[2]))
    items(el)[2].remove()
    await settle()
    await settle()
    expect(el.style.getPropertyValue('--_sticky-scroll-count')).toBe('2')
    expect(el.activeIndex).toBe(0)
    expect(io.targets).toHaveLength(3)

    const step = document.createElement('moul-sticky-scroll-item')
    step.textContent = 'Eat crab in Kep'
    el.append(step)
    await settle()
    await settle()
    expect(io.targets).toHaveLength(4)
    place(el, [-600, -300, LINE - 10])
    io.enter(box(step))
    expect(el.activeIndex).toBe(2)
  })

  it('stops watching when it disconnects', async () => {
    const el = await walkThrough()
    el.remove()
    expect(io.targets).toHaveLength(0)
  })

  it('lays every step’s media in one sticky panel, shown only while active', () => {
    const item = stickyScrollItemStyles.cssText
    expect(item).toMatch(/:host\s*\{\s*display:\s*contents/)
    expect(item).toMatch(/grid-row:\s*1 \/ -1/)
    expect(stickyScrollStyles.cssText).toMatch(
      /repeat\(var\(--_sticky-scroll-count, 1\), auto\)\s*var\(--sticky-scroll-end-space/,
    )
    expect(item).toMatch(/position:\s*sticky/)
    expect(stickyScrollStyles.cssText).toMatch(/container-type:\s*inline-size/)
    expect(item).toMatch(/@container \(width < 600px\)/)
  })

  describe('keyboard and screen readers', () => {
    it('adds no role and takes no focus itself', async () => {
      const el = await walkThrough()
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('tabindex')).toBe(false)
      for (const item of items(el)) {
        expect(item.hasAttribute('role')).toBe(false)
        expect(item.hasAttribute('tabindex')).toBe(false)
      }
    })

    it('keeps the media of inactive steps readable', async () => {
      const el = await walkThrough()
      for (const item of items(el)) {
        const media = item.querySelector('[slot="media"]') as HTMLElement
        expect(media.closest('[aria-hidden], [inert]')).toBeNull()
      }
      const text = stickyScrollItemStyles.cssText
      expect(text).not.toMatch(/visibility:\s*hidden/)
    })

    it('makes the step that receives focus active, in its media too', async () => {
      const el = await walkThrough()
      const details: StickyScrollStepChangeDetail[] = []
      el.addEventListener('stepchange', (event) =>
        details.push(
          (event as CustomEvent<StickyScrollStepChangeDetail>).detail,
        ),
      )
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(el.activeIndex).toBe(1)
      expect(details[0]).toMatchObject({ current: 1, previous: 0 })
    })
  })

  describe('reduced motion', () => {
    it('swaps media and dims text at once', () => {
      const item = stickyScrollItemStyles.cssText
      const block = item.slice(item.indexOf('@media (prefers-reduced-motion'))
      expect(block).toMatch(/\.content,\s*\.media\s*\{\s*transition:\s*none/)
      const host = stickyScrollStyles.cssText
      expect(
        host.slice(host.indexOf('@media (prefers-reduced-motion')),
      ).toMatch(/transition:\s*none/)
    })
  })
})
