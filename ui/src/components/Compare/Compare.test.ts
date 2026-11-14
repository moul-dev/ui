import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import './Compare'
import type { CompareChangeDetail, MoulCompare } from './Compare'
import { compareStyles } from './Compare.styles'

const css = compareStyles.cssText

/** The declarations of the rule whose whole selector is `selector`. */
function rule(selector: string): string {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    source,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  expect(start, `no @media ${query}`).toBeGreaterThanOrEqual(0)
  let depth = 0
  const open = css.indexOf('{', start)
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return ''
}

const part = (el: MoulCompare, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) as HTMLElement

/** Lays the frame out at 400 × 200 px, 100 px from the left and 50 px from the top. */
function layOut(el: MoulCompare): void {
  part(el, 'base').getBoundingClientRect = () =>
    ({
      left: 100,
      top: 50,
      right: 500,
      bottom: 250,
      width: 400,
      height: 200,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  type: string,
  target: EventTarget,
  x: number,
  y = 150,
  pointerType = 'mouse',
): PointerEvent {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType,
    clientX: x,
    clientY: y,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

function key(el: MoulCompare, name: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    shiftKey,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  part(el, 'handle').dispatchEvent(event)
  return event
}

/** Records the positions of every `input` and `change` event. */
function record(el: MoulCompare) {
  const input: number[] = []
  const change: number[] = []
  el.addEventListener('input', (e) =>
    input.push(
      (e as unknown as CustomEvent<CompareChangeDetail>).detail.position,
    ),
  )
  el.addEventListener('change', (e) =>
    change.push(
      (e as unknown as CustomEvent<CompareChangeDetail>).detail.position,
    ),
  )
  return { input, change }
}

describe('<moul-compare>', () => {
  afterEach(() => {
    fixtureCleanup()
  })

  it('stacks the before and after slots with a divider and a slider handle', async () => {
    const el = await fixture<MoulCompare>(html`
      <moul-compare>
        <img slot="before" alt="Sketch of a stilt house" />
        <img slot="after" alt="The finished painting" />
      </moul-compare>
    `)
    expect(customElements.get('moul-compare')).toBeDefined()
    expect(
      part(el, 'before').querySelector('slot[name="before"]'),
    ).not.toBeNull()
    expect(part(el, 'after').querySelector('slot[name="after"]')).not.toBeNull()
    expect(part(el, 'divider').getAttribute('aria-hidden')).toBe('true')
    const handle = part(el, 'handle')
    expect(handle.getAttribute('role')).toBe('slider')
    expect(handle.getAttribute('tabindex')).toBe('0')
    expect(handle.getAttribute('aria-label')).toBe('Compare images')
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal')
    expect(handle.getAttribute('aria-valuemin')).toBe('0')
    expect(handle.getAttribute('aria-valuemax')).toBe('100')
    expect(handle.getAttribute('aria-valuenow')).toBe('50')
    expect(handle.getAttribute('aria-valuetext')).toBe('50% Before, 50% After')
  })

  it('applies its defaults and normalises bad values', async () => {
    const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
    expect(el.position).toBe(50)
    expect(el.orientation).toBe('horizontal')
    expect(el.mode).toBe('drag')

    el.position = 140
    await el.updateComplete
    expect(el.position).toBe(100)
    el.position = -3
    await el.updateComplete
    expect(el.position).toBe(0)
    el.position = Number.NaN
    await el.updateComplete
    expect(el.position).toBe(50)

    el.setAttribute('orientation', 'diagonal')
    el.setAttribute('mode', 'spin')
    await el.updateComplete
    expect(el.orientation).toBe('horizontal')
    expect(el.mode).toBe('drag')
  })

  it('writes the position on the frame, where the after layer is clipped to it', async () => {
    const el = await fixture<MoulCompare>(
      html`<moul-compare position="30"></moul-compare>`,
    )
    expect(part(el, 'base').style.getPropertyValue('--_compare-position')).toBe(
      '30%',
    )
    expect(rule('.after')).toContain(
      'clip-path: inset(0 0 0 var(--_compare-position, 50%))',
    )
    expect(rule(':host(:dir(rtl)) .after')).toContain(
      'clip-path: inset(0 var(--_compare-position, 50%) 0 0)',
    )
    expect(rule(':host([orientation="vertical"]) .after')).toContain(
      'clip-path: inset(var(--_compare-position, 50%) 0 0 0)',
    )
  })

  it('shows a chip for each label it is given and names the sides in the value text', async () => {
    const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
    expect(part(el, 'before-label')).toBeNull()
    expect(part(el, 'after-label')).toBeNull()

    el.beforeLabel = 'Sketch'
    el.afterLabel = 'Final'
    el.position = 60
    await el.updateComplete
    expect(part(el, 'before-label')?.textContent).toBe('Sketch')
    expect(part(el, 'after-label')?.textContent).toBe('Final')
    // Each chip sits inside its own layer, so the divider covers it as it passes.
    expect(part(el, 'before').contains(part(el, 'before-label'))).toBe(true)
    expect(part(el, 'after').contains(part(el, 'after-label'))).toBe(true)
    expect(part(el, 'handle').getAttribute('aria-valuetext')).toBe(
      '60% Sketch, 40% Final',
    )
  })

  describe('keyboard', () => {
    it('moves the divider with the arrows, Page keys, Home and End, firing input and change', async () => {
      const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
      const events = record(el)

      expect(key(el, 'ArrowRight').defaultPrevented).toBe(true)
      expect(el.position).toBe(51)
      key(el, 'ArrowRight', true)
      expect(el.position).toBe(61)
      key(el, 'ArrowLeft')
      expect(el.position).toBe(60)
      key(el, 'ArrowUp')
      expect(el.position).toBe(61)
      key(el, 'ArrowDown')
      expect(el.position).toBe(60)
      key(el, 'PageUp')
      expect(el.position).toBe(70)
      key(el, 'PageDown')
      expect(el.position).toBe(60)
      key(el, 'Home')
      expect(el.position).toBe(0)
      key(el, 'End')
      expect(el.position).toBe(100)

      expect(events.input).toEqual([51, 61, 60, 61, 60, 70, 60, 0, 100])
      expect(events.change).toEqual(events.input)

      // Already at the end: nothing moves and nothing fires.
      key(el, 'End')
      key(el, 'ArrowRight')
      expect(events.change).toHaveLength(9)

      await el.updateComplete
      expect(part(el, 'handle').getAttribute('aria-valuenow')).toBe('100')
    })

    it('leaves other keys to the page', async () => {
      const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
      expect(key(el, 'Tab').defaultPrevented).toBe(false)
      expect(key(el, 'a').defaultPrevented).toBe(false)
      expect(el.position).toBe(50)
    })

    it('mirrors the inline arrows in right-to-left text', async () => {
      const el = await fixture<MoulCompare>(
        html`<div dir="rtl"><moul-compare></moul-compare></div>`,
      ).then((wrapper) => wrapper.querySelector('moul-compare') as MoulCompare)
      key(el, 'ArrowLeft')
      expect(el.position).toBe(51)
      key(el, 'ArrowRight', true)
      expect(el.position).toBe(41)
    })

    it('moves a vertical divider down with Down and up with Up', async () => {
      const el = await fixture<MoulCompare>(
        html`<moul-compare orientation="vertical"></moul-compare>`,
      )
      expect(part(el, 'handle').getAttribute('aria-orientation')).toBe(
        'vertical',
      )
      key(el, 'ArrowDown')
      expect(el.position).toBe(51)
      key(el, 'ArrowUp')
      key(el, 'ArrowUp')
      expect(el.position).toBe(49)
      key(el, 'PageDown')
      expect(el.position).toBe(59)
      key(el, 'PageUp')
      expect(el.position).toBe(49)
    })
  })

  describe('pointer', () => {
    it('jumps to a mouse press, follows the drag and fires change once on release', async () => {
      const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
      layOut(el)
      const events = record(el)
      const frame = part(el, 'base')

      const down = pointer('pointerdown', frame, 200)
      expect(down.defaultPrevented).toBe(true)
      expect(el.position).toBe(25)
      // Pressed but not yet moved: the divider still glides to the press.
      await el.updateComplete
      expect(frame.hasAttribute('data-dragging')).toBe(false)
      // The press focuses the slider, so the keys carry on from here.
      expect(el.shadowRoot?.activeElement).toBe(part(el, 'handle'))

      pointer('pointermove', window, 300)
      await el.updateComplete
      expect(frame.hasAttribute('data-dragging')).toBe(true)
      expect(el.position).toBe(50)
      pointer('pointermove', window, 420)
      expect(el.position).toBe(80)
      // Past the edge it stops at the end.
      pointer('pointermove', window, 700)
      expect(el.position).toBe(100)
      pointer('pointerup', window, 700)
      await el.updateComplete
      expect(frame.hasAttribute('data-dragging')).toBe(false)

      expect(events.input).toEqual([25, 50, 80, 100])
      expect(events.change).toEqual([100])

      // Later moves without a press do nothing in drag mode.
      pointer('pointermove', frame, 150)
      expect(el.position).toBe(100)
    })

    it('ignores a secondary mouse button', async () => {
      const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
      layOut(el)
      const event = new PointerEvent('pointerdown', {
        pointerId: 1,
        isPrimary: true,
        button: 2,
        pointerType: 'mouse',
        clientX: 150,
        bubbles: true,
        composed: true,
      })
      part(el, 'base').dispatchEvent(event)
      expect(el.position).toBe(50)
    })

    it('leaves a vertical swipe to scrolling, but follows a sideways one and a tap', async () => {
      const el = await fixture<MoulCompare>(html`<moul-compare></moul-compare>`)
      layOut(el)
      const events = record(el)
      const frame = part(el, 'base')

      // A touch press does not move the divider by itself.
      pointer('pointerdown', frame, 200, 150, 'touch')
      expect(el.position).toBe(50)
      pointer('pointermove', window, 204, 190, 'touch')
      pointer('pointermove', window, 380, 220, 'touch')
      pointer('pointerup', window, 380, 220, 'touch')
      expect(el.position).toBe(50)
      expect(events.input).toEqual([])

      pointer('pointerdown', frame, 300, 150, 'touch')
      pointer('pointermove', window, 340, 152, 'touch')
      expect(el.position).toBe(60)
      pointer('pointerup', window, 340, 152, 'touch')
      expect(events.change).toEqual([60])

      // A tap moves it to where the finger landed.
      pointer('pointerdown', frame, 140, 150, 'touch')
      pointer('pointerup', window, 140, 150, 'touch')
      expect(el.position).toBe(10)
      expect(events.change).toEqual([60, 10])
    })

    it('measures from the right edge in right-to-left text', async () => {
      const wrapper = await fixture<HTMLElement>(
        html`<div dir="rtl"><moul-compare></moul-compare></div>`,
      )
      const el = wrapper.querySelector('moul-compare') as MoulCompare
      await el.updateComplete
      layOut(el)
      pointer('pointerdown', part(el, 'base'), 400)
      pointer('pointerup', window, 400)
      expect(el.position).toBe(25)
    })

    it('measures from the top when vertical', async () => {
      const el = await fixture<MoulCompare>(
        html`<moul-compare orientation="vertical"></moul-compare>`,
      )
      layOut(el)
      pointer('pointerdown', part(el, 'base'), 300, 200)
      pointer('pointerup', window, 300, 200)
      expect(el.position).toBe(75)
    })

    it('follows a hovering mouse in hover mode and fires change when it leaves', async () => {
      const el = await fixture<MoulCompare>(
        html`<moul-compare mode="hover"></moul-compare>`,
      )
      layOut(el)
      const events = record(el)
      const frame = part(el, 'base')

      pointer('pointermove', frame, 180)
      expect(el.position).toBe(20)
      pointer('pointermove', frame, 260)
      expect(el.position).toBe(40)
      // A finger hovering is not a thing; touch moves need a press.
      pointer('pointermove', frame, 460, 150, 'touch')
      expect(el.position).toBe(40)
      frame.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }))
      expect(events.input).toEqual([20, 40])
      expect(events.change).toEqual([40])
    })
  })

  describe('reduced motion', () => {
    it('glides on clicks and keys only when motion is allowed, never while dragging', () => {
      expect(rule('.after')).toContain('transition: clip-path')
      expect(
        rule(
          '.frame[data-dragging] .after,\n  .frame[data-dragging] .divider,\n  .frame[data-dragging] .handle',
        ),
      ).toContain('transition: none')
      const reduced = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(reduced).toMatch(
        /\.after,\s*\.divider,\s*\.handle\s*\{\s*transition: none !important/,
      )
      expect(reduced).toContain('scale: none')
    })
  })
})
