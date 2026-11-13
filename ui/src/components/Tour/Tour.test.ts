import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import { getDeepActiveElement } from '../../utils/focus-trap'
import { placeCard, spotPath } from './spotlight'
import './Tour'
import type { MoulTour } from './Tour'
import type { MoulTourStep } from './TourStep'

function stubRect(
  el: Element,
  box: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      ...box,
      x: box.left,
      y: box.top,
      right: box.left + box.width,
      bottom: box.top + box.height,
      toJSON: () => box,
    }) as DOMRect
}

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

async function settle(tour: MoulTour): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await tour.updateComplete
    await wait()
  }
}

async function mountTour() {
  const root = await fixture<HTMLDivElement>(html`
    <div>
      <button id="tour-start">Take the tour</button>
      <div id="search"></div>
      <div id="save"></div>
      <moul-tour radius="10">
        <moul-tour-step heading="Welcome">
          <span>Here is how it works.</span>
        </moul-tour-step>
        <moul-tour-step target="#search" heading="Search" placement="bottom">
          <span>Find anything.</span> <a href="#docs">Docs</a>
          <input aria-label="Try it" />
        </moul-tour-step>
        <moul-tour-step target="#save" heading="Save">
          <span>Saves your work.</span>
        </moul-tour-step>
      </moul-tour>
    </div>
  `)
  const search = root.querySelector('#search') as HTMLElement
  const save = root.querySelector('#save') as HTMLElement
  stubRect(search, { left: 100, top: 100, width: 200, height: 40 })
  stubRect(save, { left: 600, top: 500, width: 80, height: 40 })
  const tour = root.querySelector('moul-tour') as MoulTour
  await settle(tour)
  const shadow = tour.shadowRoot as ShadowRoot
  const part = (name: string) =>
    shadow.querySelector<HTMLElement>(`[part~="${name}"]`)
  const inner = (name: string) =>
    part(name)?.shadowRoot?.querySelector('button') as HTMLButtonElement
  return {
    root,
    tour,
    shadow,
    part,
    inner,
    opener: root.querySelector('#tour-start') as HTMLButtonElement,
    steps: Array.from(
      root.querySelectorAll('moul-tour-step'),
    ) as MoulTourStep[],
    dialog: shadow.querySelector('dialog') as HTMLDialogElement,
  }
}

function key(
  target: EventTarget,
  name: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

describe('<moul-tour>', () => {
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    motion = mockReducedMotion(true)
  })

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('registers <moul-tour> and <moul-tour-step> and stays closed until started', async () => {
    const { tour, dialog, steps } = await mountTour()
    expect(customElements.get('moul-tour')).toBeDefined()
    expect(customElements.get('moul-tour-step')).toBeDefined()
    expect(tour.isOpen).toBe(false)
    expect(dialog.open).toBe(false)
    expect(tour.steps).toEqual(steps)
  })

  it('does nothing when started with no steps or ended while closed', async () => {
    const el = await fixture<MoulTour>(html`<moul-tour></moul-tour>`)
    const onOpen = vi.fn()
    el.addEventListener('openchange', onOpen)
    el.start()
    el.end()
    await el.updateComplete
    expect(el.isOpen).toBe(false)
    expect(onOpen).not.toHaveBeenCalled()
  })

  describe('keyboard and screen readers', () => {
    it('opens a modal dialog named by the heading and described by the body', async () => {
      const { tour, dialog, shadow, part, steps } = await mountTour()
      const onOpen = vi.fn()
      tour.addEventListener('openchange', onOpen)
      tour.start()
      await settle(tour)

      expect(tour.isOpen).toBe(true)
      expect(tour.hasAttribute('is-open')).toBe(true)
      expect(dialog.open).toBe(true)
      expect(onOpen.mock.calls[0][0].detail).toEqual({
        isOpen: true,
        isComplete: false,
      })
      const heading = shadow.getElementById(
        dialog.getAttribute('aria-labelledby') as string,
      )
      expect(heading?.textContent?.trim()).toBe('Welcome')
      expect(heading?.tagName).toBe('H2')
      const body = shadow.getElementById(
        dialog.getAttribute('aria-describedby') as string,
      )
      expect(body?.querySelector('slot')).not.toBeNull()
      expect(steps.map((step) => step.isActive)).toEqual([true, false, false])
      expect(steps[0].hasAttribute('is-active')).toBe(true)
      expect(part('progress')?.textContent?.trim()).toBe('1 of 3')
      expect(part('previous-button')).toBeNull()
      expect(part('next-button')?.textContent?.trim()).toBe('Next')
      expect(part('close-button')?.getAttribute('aria-label')).toBe('Skip tour')
    })

    it('moves focus to Next, ends on Escape and gives focus back', async () => {
      const { tour, dialog, inner, opener } = await mountTour()
      const onOpen = vi.fn()
      tour.addEventListener('openchange', onOpen)
      opener.focus()
      tour.start()
      await settle(tour)
      expect(getDeepActiveElement()).toBe(inner('next-button'))

      const escaped = key(inner('next-button'), 'Escape')
      await settle(tour)
      expect(escaped.defaultPrevented).toBe(true)
      expect(tour.isOpen).toBe(false)
      expect(dialog.open).toBe(false)
      expect(onOpen.mock.calls.at(-1)?.[0].detail).toEqual({
        isOpen: false,
        isComplete: false,
      })
      expect(document.activeElement).toBe(opener)
    })

    it('steps with Next and Back, and finishes with Done', async () => {
      const { tour, part, inner } = await mountTour()
      const onStep = vi.fn()
      const onOpen = vi.fn()
      tour.addEventListener('stepchange', onStep)
      tour.addEventListener('openchange', onOpen)
      tour.start()
      await settle(tour)

      inner('next-button').click()
      await settle(tour)
      expect(tour.current).toBe(1)
      expect(onStep.mock.calls[0][0].detail).toEqual({
        current: 1,
        previous: 0,
      })
      expect(part('heading')?.textContent?.trim()).toBe('Search')
      expect(part('progress')?.textContent?.trim()).toBe('2 of 3')
      expect(part('previous-button')?.textContent?.trim()).toBe('Back')

      inner('previous-button').click()
      await settle(tour)
      expect(tour.current).toBe(0)
      // Back is gone on the first step, so focus stays in the card on Next.
      expect(getDeepActiveElement()).toBe(inner('next-button'))

      tour.goTo(2)
      await settle(tour)
      expect(part('next-button')?.textContent?.trim()).toBe('Done')
      inner('next-button').click()
      await settle(tour)
      expect(tour.isOpen).toBe(false)
      expect(onOpen.mock.calls.at(-1)?.[0].detail).toEqual({
        isOpen: false,
        isComplete: true,
      })
    })

    it('announces each later step through a polite live region', async () => {
      const { tour, shadow } = await mountTour()
      tour.start()
      await settle(tour)
      const live = shadow.querySelector('[aria-live="polite"]') as HTMLElement
      expect(live.textContent?.trim()).toBe('')
      tour.next()
      await settle(tour)
      expect(live.textContent?.trim()).toBe('Search, 2 of 3')
    })

    it('goes back and forth with the arrow keys, but not from a text field or past the end', async () => {
      const { tour, inner, steps } = await mountTour()
      tour.start()
      await settle(tour)

      key(inner('next-button'), 'ArrowRight')
      await settle(tour)
      expect(tour.current).toBe(1)

      const field = steps[1].querySelector('input') as HTMLInputElement
      const typing = key(field, 'ArrowLeft')
      await settle(tour)
      expect(typing.defaultPrevented).toBe(false)
      expect(tour.current).toBe(1)

      key(inner('next-button'), 'ArrowLeft')
      await settle(tour)
      expect(tour.current).toBe(0)

      tour.goTo(2)
      await settle(tour)
      key(inner('next-button'), 'ArrowRight')
      await settle(tour)
      expect(tour.isOpen).toBe(true)
      expect(tour.current).toBe(2)
    })

    it('keeps Tab inside the card', async () => {
      const { tour, part, inner } = await mountTour()
      tour.start()
      await settle(tour)
      const close = part('close-button') as HTMLButtonElement
      const next = inner('next-button')

      const forward = key(next, 'Tab')
      expect(forward.defaultPrevented).toBe(true)
      expect(getDeepActiveElement()).toBe(close)

      const back = key(close, 'Tab', { shiftKey: true })
      expect(back.defaultPrevented).toBe(true)
      expect(getDeepActiveElement()).toBe(next)
    })

    it('ends the tour from the close button, unfinished', async () => {
      const { tour, part } = await mountTour()
      const onOpen = vi.fn()
      tour.addEventListener('openchange', onOpen)
      tour.start(1)
      await settle(tour)
      ;(part('close-button') as HTMLButtonElement).click()
      await settle(tour)
      expect(tour.isOpen).toBe(false)
      expect(onOpen.mock.calls.at(-1)?.[0].detail.isComplete).toBe(false)
    })

    it('takes translated labels', async () => {
      const { tour, part } = await mountTour()
      tour.nextLabel = 'បន្ទាប់'
      tour.doneLabel = 'រួចរាល់'
      tour.skipLabel = 'រំលង'
      tour.progressLabel = '{current}/{total}'
      tour.start()
      await settle(tour)
      expect(part('next-button')?.textContent?.trim()).toBe('បន្ទាប់')
      expect(part('progress')?.textContent?.trim()).toBe('1/3')
      expect(part('close-button')?.getAttribute('aria-label')).toBe('រំលង')
      tour.goTo(2)
      await settle(tour)
      expect(part('next-button')?.textContent?.trim()).toBe('រួចរាល់')
    })
  })

  it('lets a stepchange listener keep the tour on its step', async () => {
    const { tour } = await mountTour()
    tour.start()
    await settle(tour)
    tour.addEventListener('stepchange', (e) => e.preventDefault())
    expect(tour.next()).toBe(false)
    await settle(tour)
    expect(tour.current).toBe(0)
  })

  it('centres a step with no target and dims the whole page', async () => {
    const { tour, part } = await mountTour()
    tour.start()
    await settle(tour)
    expect(part('card')?.dataset.side).toBe('center')
    expect(part('overlay')?.style.clipPath).toBe(
      `path(evenodd, "M0 0H${window.innerWidth}V${window.innerHeight}H0Z")`,
    )
  })

  it('cuts the hole around the target and places the card beside it', async () => {
    const { tour, part } = await mountTour()
    tour.start(1)
    await settle(tour)
    // 8px padding around the 200 × 40 target at (100, 100), 10px corners.
    const clip = part('overlay')?.style.clipPath ?? ''
    expect(clip).toContain('M102 92H298A10 10 0 0 1 308 102V138')
    const card = part('card') as HTMLElement
    expect(card.dataset.side).toBe('bottom')
    expect(card.style.top).toBe(`${92 + 56 + 12}px`)
  })

  it('follows the target when the page scrolls', async () => {
    const { tour, part, root } = await mountTour()
    tour.start(1)
    await settle(tour)
    stubRect(root.querySelector('#search') as Element, {
      left: 100,
      top: 40,
      width: 200,
      height: 40,
    })
    window.dispatchEvent(new Event('scroll'))
    await wait(40)
    expect(part('overlay')?.style.clipPath).toContain('M102 32H298')
    expect(part('card')?.style.top).toBe(`${32 + 56 + 12}px`)
  })

  describe('reduced motion', () => {
    it('jumps the cutout and scrolls off-screen targets into view at once', async () => {
      const { tour, part, root } = await mountTour()
      const save = root.querySelector('#save') as HTMLElement
      stubRect(save, { left: 600, top: 2000, width: 80, height: 40 })
      const scroll = vi.fn()
      save.scrollIntoView = scroll
      tour.start(2)
      await settle(tour)
      expect(scroll).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'instant', block: 'center' }),
      )
      // No spring: the hole is already at its place.
      expect(part('overlay')?.style.clipPath).toContain('M602 1992')
    })

    it('springs the cutout open out of a point when motion is allowed', async () => {
      motion?.set(false)
      const { tour, part, root } = await mountTour()
      const search = root.querySelector('#search') as HTMLElement
      stubRect(search, { left: 100, top: 900, width: 200, height: 40 })
      const scroll = vi.fn()
      search.scrollIntoView = scroll
      tour.start(1)
      await tour.updateComplete
      await wait()
      await tour.updateComplete
      expect(scroll).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      )
      // It opens out of a point at the target's centre instead of jumping there.
      expect(part('overlay')?.style.clipPath).not.toContain('M102 892H298')
      await wait(900)
      expect(part('overlay')?.style.clipPath).toContain('M102 892H298')
      tour.end()
      await wait(400)
      expect(tour.dialogEl?.open).toBe(false)
    })
  })
})

describe('<moul-tour-step>', () => {
  it('finds its target by selector or takes an element, and reflects is-active', async () => {
    const root = await fixture<HTMLDivElement>(html`
      <div>
        <p id="here">Here</p>
        <moul-tour>
          <moul-tour-step target="#here" heading="Here"></moul-tour-step>
          <moul-tour-step target="#nowhere" heading="Nowhere"></moul-tour-step>
          <moul-tour-step target="[" heading="Broken"></moul-tour-step>
        </moul-tour>
      </div>
    `)
    const [here, nowhere, broken] = Array.from(
      root.querySelectorAll('moul-tour-step'),
    ) as MoulTourStep[]
    const target = root.querySelector('#here')
    expect(here.resolveTarget()).toBe(target)
    expect(nowhere.resolveTarget()).toBeNull()
    expect(broken.resolveTarget()).toBeNull()
    nowhere.target = target
    expect(nowhere.resolveTarget()).toBe(target)
    expect(here.placement).toBe('auto')
    await here.updateComplete
    expect(here.getAttribute('is-active')).toBe('')
    expect(nowhere.hasAttribute('is-active')).toBe(false)
  })
})

describe('spotlight geometry', () => {
  it('cuts a rounded hole, with corners no larger than half the shorter side', () => {
    expect(spotPath(100, 80, null)).toBe('M0 0H100V80H0Z')
    expect(
      spotPath(100, 80, { x: 10, y: 10, width: 20, height: 10, radius: 50 }),
    ).toBe(
      'M0 0H100V80H0ZM15 10H25A5 5 0 0 1 30 15V15A5 5 0 0 1 25 20H15A5 5 0 0 1 10 15V15A5 5 0 0 1 15 10Z',
    )
  })

  it('places the card on the preferred side, flips when there is no room, and centres as a last resort', () => {
    const view = { width: 1000, height: 800 }
    const card = { width: 300, height: 150 }
    const spot = { x: 400, y: 100, width: 200, height: 50, radius: 0 }
    expect(placeCard(spot, card, view)).toEqual({
      side: 'bottom',
      left: 350,
      top: 162,
    })
    const low = { ...spot, y: 700 }
    expect(placeCard(low, card, view).side).toBe('top')
    const nearLeft = { ...spot, x: 20 }
    const right = placeCard(nearLeft, card, view, 'left')
    expect(right.side).toBe('right')
    // Kept 12px inside the view along the side.
    expect(placeCard(nearLeft, card, view, 'bottom').left).toBe(12)
    const huge = { x: 0, y: 0, width: 1000, height: 800, radius: 0 }
    expect(placeCard(huge, card, view).side).toBe('center')
    expect(placeCard(null, card, view)).toEqual({
      side: 'center',
      left: 350,
      top: 325,
    })
  })
})
