import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './index'
import type { MoulDock } from './Dock'
import { dockItemStyles, dockStyles } from './Dock.styles'
import type { MoulDockItem } from './DockItem'
import { dockFalloff, dockLayout } from './dock-layout'

const ITEM = 40

/** Lets slotchange events and the renders they cause run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const bar = (el: MoulDock) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="bar"]') as HTMLElement
const items = (el: MoulDock) =>
  [...el.querySelectorAll('moul-dock-item')] as MoulDockItem[]
const control = (item: MoulDockItem) =>
  item.shadowRoot?.querySelector<HTMLElement>('[part="control"]') as HTMLElement
const scaleOf = (child: Element) =>
  Number((child as HTMLElement).style.getPropertyValue('--_dock-scale') || 1)
const shiftOf = (child: Element) =>
  Number.parseFloat(
    (child as HTMLElement).style.getPropertyValue('--_dock-shift') || '0',
  )

/** Gives every child a 40px layout box and the bar a fixed place on screen. */
function layOutDock(el: MoulDock, left = 100): void {
  for (const child of el.children) {
    Object.defineProperty(child, 'offsetWidth', {
      configurable: true,
      get: () => ITEM,
    })
    Object.defineProperty(child, 'offsetHeight', {
      configurable: true,
      get: () => ITEM,
    })
  }
  const count = el.children.length
  const width = count * ITEM + (count - 1) * 8 + 16
  bar(el).getBoundingClientRect = () =>
    ({
      left,
      top: 500,
      width,
      height: ITEM + 16,
      right: left + width,
      bottom: 500 + ITEM + 16,
      x: left,
      y: 500,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  el: HTMLElement,
  type: 'pointerenter' | 'pointermove' | 'pointerleave',
  clientX = 0,
  clientY = 520,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type === 'pointermove',
      composed: true,
    }),
  )
}

async function dock() {
  return fixture<MoulDock>(html`<moul-dock label="Quick links">
    <moul-dock-item label="Home" href="/" is-active>H</moul-dock-item>
    <moul-dock-item label="Search">S</moul-dock-item>
    <moul-dock-item label="Messages">M</moul-dock-item>
    <moul-dock-separator></moul-dock-separator>
    <moul-dock-item label="Settings">G</moul-dock-item>
  </moul-dock>`)
}

describe('dockLayout', () => {
  const centres = [20, 68, 116, 164, 212]
  const sizes = [40, 40, 40, 40, 40]
  const grows = [true, true, true, true, true]

  it('rests at scale 1 with no shift when there is no pointer', () => {
    const layout = dockLayout({
      centres,
      sizes,
      grows,
      focus: null,
      magnification: 1.6,
      distance: 140,
    })
    expect(layout.scales).toEqual([1, 1, 1, 1, 1])
    expect(layout.shifts).toEqual([0, 0, 0, 0, 0])
    expect(layout.grow).toBe(0)
  })

  it('grows the item under the pointer most and its neighbours evenly less', () => {
    const { scales } = dockLayout({
      centres,
      sizes,
      grows,
      focus: 116,
      magnification: 1.6,
      distance: 140,
    })
    expect(scales[2]).toBe(1.6)
    expect(scales[1]).toBe(scales[3])
    expect(scales[1]).toBeLessThan(1.6)
    expect(scales[1]).toBeGreaterThan(scales[0])
    expect(scales[0]).toBe(scales[4])
  })

  it('spreads the row evenly on both sides, so the middle item stays put', () => {
    const { scales, shifts, grow } = dockLayout({
      centres,
      sizes,
      grows,
      focus: 116,
      magnification: 1.6,
      distance: 140,
    })
    expect(shifts[2]).toBe(0)
    expect(shifts[0]).toBeCloseTo(-shifts[4])
    expect(shifts[1]).toBeCloseTo(-shifts[3])
    expect(shifts[0]).toBeLessThan(shifts[1])
    // The outer edges move out by half the total growth each.
    expect(grow).toBeGreaterThan(0)
    const leftEdge = centres[0] + shifts[0] - (sizes[0] * scales[0]) / 2
    const rightEdge = centres[4] + shifts[4] + (sizes[4] * scales[4]) / 2
    expect(leftEdge).toBeCloseTo(centres[0] - sizes[0] / 2 - grow / 2, 1)
    expect(rightEdge).toBeCloseTo(centres[4] + sizes[4] / 2 + grow / 2, 1)
  })

  it('never grows a separator, but moves it with its neighbours', () => {
    const layout = dockLayout({
      centres,
      sizes,
      grows: [true, true, false, true, true],
      focus: 116,
      magnification: 1.6,
      distance: 140,
    })
    expect(layout.scales[2]).toBe(1)
    expect(layout.scales[1]).toBeGreaterThan(1)
  })

  it('walks the children in screen order, so right-to-left rows spread the same way', () => {
    const ltr = dockLayout({
      centres,
      sizes,
      grows,
      focus: 68,
      magnification: 1.6,
      distance: 140,
    })
    const rtl = dockLayout({
      centres: [...centres].reverse(),
      sizes,
      grows,
      focus: 68,
      magnification: 1.6,
      distance: 140,
    })
    expect(rtl.shifts).toEqual([...ltr.shifts].reverse())
  })

  it('does nothing with a magnification of 1 or less', () => {
    const layout = dockLayout({
      centres,
      sizes,
      grows,
      focus: 116,
      magnification: 1,
      distance: 140,
    })
    expect(layout.scales.every((scale) => scale === 1)).toBe(true)
  })

  it('falls off smoothly from 1 to 0 over the distance', () => {
    expect(dockFalloff(0, 100)).toBe(1)
    expect(dockFalloff(50, 100)).toBeCloseTo(0.5)
    expect(dockFalloff(-50, 100)).toBeCloseTo(0.5)
    expect(dockFalloff(100, 100)).toBe(0)
    expect(dockFalloff(500, 100)).toBe(0)
    expect(dockFalloff(10, 0)).toBe(0)
  })
})

describe('<moul-dock>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    fixtureCleanup()
    frames.restore()
    motion.restore()
  })

  it('is a labelled toolbar holding a bar, a glass background and the items', async () => {
    const el = await dock()
    expect(el.getAttribute('role')).toBe('toolbar')
    expect(el.getAttribute('aria-label')).toBe('Quick links')
    expect(el.getAttribute('aria-orientation')).toBe('horizontal')
    expect(bar(el).querySelector('[part="background"]')).not.toBeNull()
    expect(
      bar(el).querySelector('[part="background"]')?.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(bar(el).querySelector('slot')).not.toBeNull()
  })

  it('applies its defaults and falls back from an unknown orientation', async () => {
    const el = await fixture<MoulDock>(
      html`<moul-dock orientation="diagonal"></moul-dock>`,
    )
    expect(el.magnification).toBe(1.6)
    expect(el.distance).toBe(140)
    expect(el.orientation).toBe('horizontal')
  })

  it('turns separators across the dock and tells items which way it runs', async () => {
    const el = await dock()
    await settle()
    const separator = el.querySelector('moul-dock-separator') as HTMLElement
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    expect(items(el)[0].getAttribute('data-orientation')).toBe('horizontal')

    el.orientation = 'vertical'
    await el.updateComplete
    expect(el.getAttribute('aria-orientation')).toBe('vertical')
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal')
    expect(items(el)[0].getAttribute('data-orientation')).toBe('vertical')
  })

  describe('keyboard', () => {
    it('keeps one item in the tab order', async () => {
      const el = await dock()
      await settle()
      await Promise.all(items(el).map((item) => item.updateComplete))
      const tabIndexes = items(el).map((item) =>
        control(item).getAttribute('tabindex'),
      )
      expect(tabIndexes).toEqual(['0', '-1', '-1', '-1'])
    })

    it('moves focus with the arrow keys, wrapping at the ends, and Home and End', async () => {
      const el = await dock()
      await settle()
      const [home, search, messages, settings] = items(el)
      home.focus()
      const press = async (key: string) => {
        const active = (document.activeElement as MoulDockItem | null) ?? el
        active.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
        )
        await settle()
      }

      await press('ArrowRight')
      expect(document.activeElement).toBe(search)
      await press('ArrowRight')
      expect(document.activeElement).toBe(messages)
      // The separator is not a stop.
      await press('ArrowRight')
      expect(document.activeElement).toBe(settings)
      await press('ArrowRight')
      expect(document.activeElement).toBe(home)
      await press('ArrowLeft')
      expect(document.activeElement).toBe(settings)
      await press('Home')
      expect(document.activeElement).toBe(home)
      await press('End')
      expect(document.activeElement).toBe(settings)

      // The focused item becomes the tab stop, so Tab comes back to it.
      await settings.updateComplete
      expect(control(settings).getAttribute('tabindex')).toBe('0')
      expect(control(home).getAttribute('tabindex')).toBe('-1')
    })

    it('uses Up and Down when vertical', async () => {
      const el = await fixture<MoulDock>(html`<moul-dock
        label="Side"
        orientation="vertical"
      >
        <moul-dock-item label="One">1</moul-dock-item>
        <moul-dock-item label="Two">2</moul-dock-item>
      </moul-dock>`)
      await settle()
      const [one, two] = items(el)
      one.focus()
      one.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          composed: true,
        }),
      )
      expect(document.activeElement).toBe(one)
      one.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          composed: true,
        }),
      )
      expect(document.activeElement).toBe(two)
    })

    it('skips disabled items', async () => {
      const el = await fixture<MoulDock>(html`<moul-dock label="Dock">
        <moul-dock-item label="One">1</moul-dock-item>
        <moul-dock-item label="Two" is-disabled>2</moul-dock-item>
        <moul-dock-item label="Three">3</moul-dock-item>
      </moul-dock>`)
      await settle()
      const [one, , three] = items(el)
      one.focus()
      one.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          composed: true,
        }),
      )
      expect(document.activeElement).toBe(three)
    })
  })

  describe('magnification', () => {
    it('grows the item under a mouse and its neighbours less, and rests when it leaves', async () => {
      const el = await dock()
      await settle()
      layOutDock(el)
      const children = [...el.children]

      // Over the third child (Messages): bar left 100 + padding + 2 slots.
      pointer(el, 'pointerenter')
      pointer(el, 'pointermove', 100 + 8 + 2 * 48 + 20)
      frames.step(16)

      const scales = children.map(scaleOf)
      expect(scales[2]).toBeGreaterThan(1.4)
      expect(scales[1]).toBeGreaterThan(1)
      expect(scales[1]).toBeLessThan(scales[2])
      // The separator never grows; the far item barely does.
      expect(scales[3]).toBe(1)
      expect(scales[0]).toBeLessThan(scales[1])
      // Neighbours move apart: before goes back, after goes forward.
      expect(shiftOf(children[0])).toBeLessThan(0)
      expect(shiftOf(children[4])).toBeGreaterThan(0)
      expect(
        Number.parseFloat(bar(el).style.getPropertyValue('--_dock-grow')),
      ).toBeGreaterThan(0)

      pointer(el, 'pointerleave')
      frames.step(32)
      expect(children.map(scaleOf)).toEqual([1, 1, 1, 1, 1])
      expect(bar(el).style.getPropertyValue('--_dock-grow')).toBe('0px')
    })

    it('moves items by transforms only, so the page is not laid out again', () => {
      const item = dockItemStyles.cssText
      expect(item).toContain('translate: var(--_dock-shift, 0px) 0')
      expect(item).toContain('scale: var(--_dock-scale, 1)')
      expect(item).toContain('transform-origin: bottom center')
      // The tooltip scales back so it stays the same size.
      expect(item).toContain('scale: calc(1 / var(--_dock-scale, 1))')
      expect(dockStyles.cssText).toContain(
        'inset-inline: calc(var(--_dock-grow, 0px) / -2)',
      )
    })

    it('ignores touch', async () => {
      const el = await dock()
      await settle()
      layOutDock(el)
      pointer(el, 'pointerenter', 0, 520, 'touch')
      pointer(el, 'pointermove', 200, 520, 'touch')
      frames.step(16)
      expect([...el.children].map(scaleOf)).toEqual([1, 1, 1, 1, 1])
    })

    it('grows around an item that has visible keyboard focus', async () => {
      const el = await dock()
      await settle()
      layOutDock(el)
      const search = items(el)[1]
      await search.updateComplete
      const inner = control(search)
      inner.matches = ((selector: string): boolean =>
        selector === ':focus-visible') as unknown as typeof inner.matches
      search.focus()
      inner.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, composed: true }),
      )
      expect(scaleOf(search)).toBe(1.6)
      expect(scaleOf(items(el)[0])).toBeGreaterThan(1)

      inner.dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          composed: true,
          relatedTarget: document.body,
        }),
      )
      expect(scaleOf(search)).toBe(1)
    })

    it('does not grow when magnification is 1', async () => {
      const el = await dock()
      el.magnification = 1
      await el.updateComplete
      await settle()
      layOutDock(el)
      pointer(el, 'pointerenter')
      pointer(el, 'pointermove', 200)
      frames.step(16)
      expect([...el.children].map(scaleOf)).toEqual([1, 1, 1, 1, 1])
    })
  })

  describe('reduced motion', () => {
    it('never grows or moves anything', async () => {
      motion.set(true)
      const el = await dock()
      await settle()
      layOutDock(el)
      pointer(el, 'pointerenter')
      pointer(el, 'pointermove', 200)
      frames.step(16)
      expect([...el.children].map(scaleOf)).toEqual([1, 1, 1, 1, 1])
      expect([...el.children].map(shiftOf)).toEqual([0, 0, 0, 0, 0])
    })

    it('lets a magnified dock rest when the setting turns on mid-hover', async () => {
      const el = await dock()
      await settle()
      layOutDock(el)
      pointer(el, 'pointerenter')
      pointer(el, 'pointermove', 200)
      frames.step(16)
      expect(Math.max(...[...el.children].map(scaleOf))).toBeGreaterThan(1)

      motion.set(true)
      expect([...el.children].map(scaleOf)).toEqual([1, 1, 1, 1, 1])
    })

    it('drops the transitions, and the label stops sliding', () => {
      const css = dockItemStyles.cssText
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('transition: none')
      expect(block).toContain('--_dock-label-offset: 0px')
    })
  })

  it('clears what it wrote on its items when it is removed', async () => {
    const el = await dock()
    await settle()
    layOutDock(el)
    pointer(el, 'pointerenter')
    pointer(el, 'pointermove', 200)
    frames.step(16)
    const first = items(el)[0]
    expect(first.style.getPropertyValue('--_dock-scale')).not.toBe('')
    el.remove()
    expect(first.style.getPropertyValue('--_dock-scale')).toBe('')
  })
})

describe('<moul-dock-item>', () => {
  afterEach(() => fixtureCleanup())

  it('is a link named by its label when it has an href', async () => {
    const item = await fixture<MoulDockItem>(
      html`<moul-dock-item label="Home" href="/home" is-active
        >H</moul-dock-item
      >`,
    )
    const link = control(item)
    expect(link.localName).toBe('a')
    expect(link.getAttribute('href')).toBe('/home')
    expect(link.getAttribute('aria-label')).toBe('Home')
    expect(link.getAttribute('aria-current')).toBe('page')
  })

  it('is a button otherwise, pressed while active', async () => {
    const item = await fixture<MoulDockItem>(
      html`<moul-dock-item label="Mute" is-active>M</moul-dock-item>`,
    )
    const button = control(item)
    expect(button.localName).toBe('button')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  it('shows its label as a tooltip hidden from screen readers, and a dot when active', async () => {
    const item = await fixture<MoulDockItem>(
      html`<moul-dock-item label="Home" is-active>H</moul-dock-item>`,
    )
    const label = item.shadowRoot?.querySelector('[part="label"]')
    expect(label?.textContent?.trim()).toBe('Home')
    expect(label?.getAttribute('aria-hidden')).toBe('true')
    expect(
      item.shadowRoot
        ?.querySelector('[part="indicator"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('swallows clicks and drops the link target while disabled', async () => {
    const item = await fixture<MoulDockItem>(
      html`<moul-dock-item label="Home" href="/home" is-disabled
        >H</moul-dock-item
      >`,
    )
    const link = control(item)
    expect(link.hasAttribute('href')).toBe(false)
    expect(link.getAttribute('aria-disabled')).toBe('true')
    const onClick = vi.fn()
    item.addEventListener('click', onClick)
    link.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('focuses its link or button', async () => {
    const item = await fixture<MoulDockItem>(
      html`<moul-dock-item label="Home">H</moul-dock-item>`,
    )
    item.focus()
    expect(item.shadowRoot?.activeElement).toBe(control(item))
  })

  it('warns when it has no label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await fixture(html`<moul-dock-item>H</moul-dock-item>`)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
