import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Accordion'
import './AccordionItem'
import type { MoulAccordion } from './Accordion'
import type { MoulAccordionItem } from './AccordionItem'

async function mount(
  template = html`
    <moul-accordion>
      <moul-accordion-item value="a" heading="Shipping">Ships in two days.</moul-accordion-item>
      <moul-accordion-item value="b" heading="Returns">Thirty days.</moul-accordion-item>
      <moul-accordion-item value="c" heading="Warranty">One year.</moul-accordion-item>
    </moul-accordion>
  `,
): Promise<{ accordion: MoulAccordion; items: MoulAccordionItem[] }> {
  const accordion = await fixture<MoulAccordion>(template)
  const items = accordion.items
  await Promise.all(items.map((item) => item.updateComplete))
  // slotchange runs after the first render
  await new Promise((resolve) => setTimeout(resolve))
  await accordion.updateComplete
  return { accordion, items }
}

const part = (item: MoulAccordionItem, name: string): HTMLElement =>
  item.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!

const trigger = (item: MoulAccordionItem) =>
  part(item, 'trigger') as HTMLButtonElement

async function settle(items: MoulAccordionItem[]): Promise<void> {
  await Promise.all(items.map((item) => item.updateComplete))
}

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

function stubHeight(el: HTMLElement, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      right: 300,
      bottom: height,
      width: 300,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

describe('<moul-accordion>', () => {
  it('registers both elements and renders closed items by default', async () => {
    const { accordion, items } = await mount()
    expect(customElements.get('moul-accordion')).toBeDefined()
    expect(customElements.get('moul-accordion-item')).toBeDefined()
    expect(accordion.isMultiple).toBe(false)
    expect(accordion.variant).toBe('default')
    expect(accordion.headingLevel).toBe(3)
    expect(accordion.value).toEqual([])
    for (const item of items) {
      expect(item.isOpen).toBe(false)
      expect(part(item, 'panel').hidden).toBe(true)
    }
  })

  it('toggles an item on click and fires openchange and valuechange', async () => {
    const { accordion, items } = await mount()
    const openchange = vi.fn()
    const change = vi.fn()
    items[0].addEventListener('openchange', openchange)
    accordion.addEventListener('valuechange', change)

    trigger(items[0]).click()
    await settle(items)
    expect(items[0].isOpen).toBe(true)
    expect(items[0].hasAttribute('is-open')).toBe(true)
    expect(part(items[0], 'panel').hidden).toBe(false)
    expect(openchange.mock.calls[0][0].detail).toEqual({ isOpen: true })
    expect(change.mock.calls[0][0].detail).toEqual({ value: ['a'] })

    trigger(items[0]).click()
    await settle(items)
    expect(items[0].isOpen).toBe(false)
    expect(part(items[0], 'panel').hidden).toBe(true)
    expect(openchange.mock.calls[1][0].detail).toEqual({ isOpen: false })
    expect(change.mock.calls[1][0].detail).toEqual({ value: [] })
  })

  it('keeps one item open at a time unless is-multiple', async () => {
    const { accordion, items } = await mount()
    const change = vi.fn()
    const closed = vi.fn()
    accordion.addEventListener('valuechange', change)
    items[0].addEventListener('openchange', closed)

    trigger(items[0]).click()
    trigger(items[1]).click()
    await settle(items)
    expect(items.map((item) => item.isOpen)).toEqual([false, true, false])
    // The first item reports being closed by the second opening, and each
    // click adds exactly one change.
    expect(closed.mock.calls.at(-1)?.[0].detail).toEqual({ isOpen: false })
    expect(change).toHaveBeenCalledTimes(2)
    expect(change.mock.calls[1][0].detail).toEqual({ value: ['b'] })

    accordion.isMultiple = true
    await accordion.updateComplete
    trigger(items[2]).click()
    await settle(items)
    expect(items.map((item) => item.isOpen)).toEqual([false, true, true])
    expect(accordion.value).toEqual(['b', 'c'])

    accordion.isMultiple = false
    await accordion.updateComplete
    await settle(items)
    expect(accordion.value).toEqual(['b'])
  })

  it('closes the others when an item is opened from code in single mode', async () => {
    const { accordion, items } = await mount()
    const change = vi.fn()
    accordion.addEventListener('valuechange', change)
    items[0].isOpen = true
    await settle(items)
    items[2].isOpen = true
    await settle(items)
    await settle(items)
    expect(items.map((item) => item.isOpen)).toEqual([false, false, true])
    expect(change).not.toHaveBeenCalled()
  })

  it('reads and sets value without firing events', async () => {
    const { accordion, items } = await mount(html`
      <moul-accordion is-multiple>
        <moul-accordion-item value="a" heading="A" is-open>A</moul-accordion-item>
        <moul-accordion-item value="b" heading="B">B</moul-accordion-item>
        <moul-accordion-item value="c" heading="C" is-open>C</moul-accordion-item>
      </moul-accordion>
    `)
    expect(accordion.value).toEqual(['a', 'c'])
    const change = vi.fn()
    accordion.addEventListener('valuechange', change)

    accordion.value = ['b', 'c']
    await settle(items)
    expect(items.map((item) => item.isOpen)).toEqual([false, true, true])

    accordion.isMultiple = false
    await accordion.updateComplete
    accordion.value = ['c', 'a']
    await settle(items)
    // Single mode opens only the first named item in document order.
    expect(accordion.value).toEqual(['a'])
    expect(change).not.toHaveBeenCalled()
  })

  it('applies a value set before its items arrive', async () => {
    const accordion = document.createElement('moul-accordion')
    accordion.value = ['y']
    document.body.append(accordion)
    accordion.innerHTML = `
      <moul-accordion-item value="x" heading="X">X</moul-accordion-item>
      <moul-accordion-item value="y" heading="Y">Y</moul-accordion-item>
    `
    await accordion.updateComplete
    await new Promise((resolve) => setTimeout(resolve))
    expect(accordion.value).toEqual(['y'])
    accordion.remove()
  })

  it('generates a value when none is given', async () => {
    const { items } = await mount(html`
      <moul-accordion>
        <moul-accordion-item heading="One">1</moul-accordion-item>
        <moul-accordion-item heading="Two">2</moul-accordion-item>
      </moul-accordion>
    `)
    expect(items[0].value).toMatch(/^moul-accordion-item-\d+$/)
    expect(items[0].value).not.toBe(items[1].value)
  })

  it('does not toggle a disabled item', async () => {
    const { accordion, items } = await mount(html`
      <moul-accordion>
        <moul-accordion-item value="a" heading="A">A</moul-accordion-item>
        <moul-accordion-item value="b" heading="B" is-disabled>B</moul-accordion-item>
      </moul-accordion>
    `)
    const change = vi.fn()
    accordion.addEventListener('valuechange', change)
    expect(trigger(items[1]).disabled).toBe(true)
    trigger(items[1]).click()
    await settle(items)
    expect(items[1].isOpen).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  it('renders the heading slot, prefix slot and heading text', async () => {
    const { items } = await mount(html`
      <moul-accordion>
        <moul-accordion-item heading="Plain">Body</moul-accordion-item>
        <moul-accordion-item>
          <span slot="prefix">*</span>
          <strong slot="heading">Rich</strong>
          Body
        </moul-accordion-item>
      </moul-accordion>
    `)
    expect(part(items[0], 'label').textContent?.trim()).toBe('Plain')
    expect(part(items[0], 'prefix').hidden).toBe(true)
    await new Promise((resolve) => setTimeout(resolve))
    await settle(items)
    expect(part(items[1], 'prefix').hidden).toBe(false)
  })

  it('reflects the variant', async () => {
    const { accordion } = await mount(html`
      <moul-accordion variant="separated">
        <moul-accordion-item heading="A">A</moul-accordion-item>
      </moul-accordion>
    `)
    expect(accordion.getAttribute('variant')).toBe('separated')
    accordion.variant = 'bordered'
    await accordion.updateComplete
    expect(accordion.getAttribute('variant')).toBe('bordered')
  })

  describe('keyboard and screen readers', () => {
    it('wires the heading, button and region per the accordion pattern', async () => {
      const { items } = await mount()
      const heading = part(items[0], 'heading')
      const button = trigger(items[0])
      const panel = part(items[0], 'panel')
      expect(heading.getAttribute('role')).toBe('heading')
      expect(heading.getAttribute('aria-level')).toBe('3')
      expect(button.localName).toBe('button')
      expect(button.getAttribute('type')).toBe('button')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.getAttribute('aria-controls')).toBe(panel.id)
      expect(panel.getAttribute('role')).toBe('region')
      expect(panel.getAttribute('aria-labelledby')).toBe(button.id)
      // Both ids resolve inside the item's own shadow root.
      expect(items[0].shadowRoot!.getElementById(panel.id)).toBe(panel)
      expect(items[0].shadowRoot!.getElementById(button.id)).toBe(button)

      button.click()
      await settle(items)
      expect(button.getAttribute('aria-expanded')).toBe('true')
    })

    it('sets aria-level from heading-level', async () => {
      const { accordion, items } = await mount(html`
        <moul-accordion heading-level="2">
          <moul-accordion-item heading="A">A</moul-accordion-item>
          <moul-accordion-item heading="B">B</moul-accordion-item>
        </moul-accordion>
      `)
      expect(part(items[1], 'heading').getAttribute('aria-level')).toBe('2')
      accordion.headingLevel = 4
      await accordion.updateComplete
      await settle(items)
      expect(part(items[0], 'heading').getAttribute('aria-level')).toBe('4')
      accordion.headingLevel = 9
      await accordion.updateComplete
      await settle(items)
      expect(part(items[0], 'heading').getAttribute('aria-level')).toBe('6')
    })

    it('keeps closed panel content out of reach and inert while closing', async () => {
      const { items } = await mount()
      const panel = part(items[0], 'panel')
      expect(panel.hidden).toBe(true)
      trigger(items[0]).click()
      await settle(items)
      expect(panel.hasAttribute('inert')).toBe(false)
      trigger(items[0]).click()
      await settle(items)
      expect(panel.hasAttribute('inert')).toBe(true)
      expect(panel.hidden).toBe(true)
    })

    it('toggles with Enter and Space through the native button', async () => {
      const { items } = await mount()
      // A native button turns Enter and Space into a click.
      const button = trigger(items[1])
      expect(key(button, 'Enter').defaultPrevented).toBe(false)
      button.click()
      await settle(items)
      expect(items[1].isOpen).toBe(true)
    })

    it('moves focus between headers with the arrow keys, Home and End', async () => {
      const { items } = await mount(html`
        <moul-accordion>
          <moul-accordion-item value="a" heading="A">A</moul-accordion-item>
          <moul-accordion-item value="b" heading="B" is-disabled>B</moul-accordion-item>
          <moul-accordion-item value="c" heading="C">C</moul-accordion-item>
          <moul-accordion-item value="d" heading="D">D</moul-accordion-item>
        </moul-accordion>
      `)
      const focused = () => document.activeElement
      items[0].focus()
      expect(focused()).toBe(items[0])

      expect(key(trigger(items[0]), 'ArrowDown').defaultPrevented).toBe(true)
      expect(focused()).toBe(items[2]) // skips the disabled item
      key(trigger(items[2]), 'ArrowDown')
      expect(focused()).toBe(items[3])
      key(trigger(items[3]), 'ArrowDown')
      expect(focused()).toBe(items[0]) // wraps
      key(trigger(items[0]), 'ArrowUp')
      expect(focused()).toBe(items[3]) // wraps back
      key(trigger(items[3]), 'Home')
      expect(focused()).toBe(items[0])
      key(trigger(items[0]), 'End')
      expect(focused()).toBe(items[3])
      // Moving focus never toggles.
      expect(items.every((item) => !item.isOpen)).toBe(true)
    })

    it('leaves arrow keys inside a panel alone', async () => {
      const { items } = await mount(html`
        <moul-accordion>
          <moul-accordion-item heading="A" is-open><input /></moul-accordion-item>
          <moul-accordion-item heading="B">B</moul-accordion-item>
        </moul-accordion>
      `)
      const input = items[0].querySelector('input')!
      expect(key(input, 'ArrowDown').defaultPrevented).toBe(false)
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock | null = null
    afterEach(() => {
      motion?.restore()
      motion = null
    })

    it('springs the height from the current height when interrupted', async () => {
      motion = mockReducedMotion(false)
      const { items } = await mount()
      const panel = part(items[0], 'panel')
      stubHeight(part(items[0], 'content'), 200)

      trigger(items[0]).click()
      await settle(items)
      expect(panel.hasAttribute('data-animating')).toBe(true)
      expect(panel.hidden).toBe(false)

      // Close mid-spring: the panel is 80px tall at that moment.
      stubHeight(panel, 80)
      trigger(items[0]).click()
      await settle(items)
      expect(panel.hasAttribute('data-animating')).toBe(true)
      expect(panel.hasAttribute('inert')).toBe(true)
      expect(panel.style.height).toBe('80px')
      // Still shown until the spring reaches zero.
      expect(panel.hidden).toBe(false)
    })

    it('opens and closes at once under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const { items } = await mount()
      const panel = part(items[0], 'panel')
      stubHeight(part(items[0], 'content'), 200)

      trigger(items[0]).click()
      await settle(items)
      expect(panel.hidden).toBe(false)
      expect(panel.hasAttribute('data-animating')).toBe(false)
      expect(panel.style.height).toBe('')

      stubHeight(panel, 200)
      trigger(items[0]).click()
      await settle(items)
      expect(panel.hidden).toBe(true)
      expect(panel.hasAttribute('data-animating')).toBe(false)
    })
  })
})
