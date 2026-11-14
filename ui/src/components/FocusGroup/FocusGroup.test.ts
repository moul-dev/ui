import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import './FocusGroup'
import type { MoulFocusGroup } from './FocusGroup'
import { focusGroupStyles } from './FocusGroup.styles'

const css = focusGroupStyles.cssText

/** The body of the first block whose prelude starts with `prelude`. */
function block(text: string, prelude: string): string {
  const start = text.indexOf(prelude)
  if (start < 0) return ''
  const open = text.indexOf('{', start)
  let depth = 0
  for (let index = open; index < text.length; index++) {
    if (text[index] === '{') depth++
    else if (text[index] === '}' && --depth === 0) {
      return text.slice(open + 1, index)
    }
  }
  return ''
}

async function group(): Promise<MoulFocusGroup> {
  return fixture<MoulFocusGroup>(
    html`<moul-focus-group>
      <a id="one" href="#one"><img alt="Angkor Wat at dawn" /></a>
      <a id="two" href="#two"><span>Koh Rong</span></a>
      <a id="three" href="#three">Mondulkiri</a>
    </moul-focus-group>`,
  )
}

const item = (el: HTMLElement, id: string) =>
  el.querySelector(`#${id}`) as HTMLElement

function over(target: EventTarget, pointerType = 'mouse'): void {
  target.dispatchEvent(
    new PointerEvent('pointerover', {
      pointerType,
      bubbles: true,
      composed: true,
    }),
  )
}

function leave(target: EventTarget, pointerType = 'mouse'): void {
  target.dispatchEvent(new PointerEvent('pointerleave', { pointerType }))
}

describe('<moul-focus-group>', () => {
  it('lays its children out as a responsive grid', async () => {
    const el = await group()
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    const host = block(css, ':host {')
    expect(host).toContain('display: grid')
    expect(host).toMatch(
      /grid-template-columns: repeat\(\s*auto-fill,\s*minmax\(min\(var\(--focus-group-min-width, 14rem\), 100%\), 1fr\)/,
    )
    expect(host).toContain(
      'gap: var(--focus-group-gap, var(--spacing-4, 1rem))',
    )
    expect(css).toMatch(/:host\(\[hidden\]\)\s*\{\s*display: none/)
  })

  it('keeps the item under the pointer sharp and blurs the rest', async () => {
    const el = await group()
    expect(el.hasAttribute('data-active')).toBe(false)

    // Deep inside the second item still counts as that item.
    over(item(el, 'two').querySelector('span') as HTMLElement)
    expect(el.getAttribute('data-active')).toBe('pointer')

    const blurred = block(
      css,
      ':host([data-active="pointer"]) ::slotted(:not(:hover)),',
    )
    expect(blurred).toContain('filter: blur(var(--focus-group-blur, 4px))')
    expect(blurred).toContain('opacity: var(--focus-group-dim, 0.6)')
    expect(blurred).toContain('scale: var(--focus-group-scale, 0.98)')

    leave(el)
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('counts the gap between items as no item', async () => {
    const el = await group()
    over(item(el, 'one'))
    expect(el.getAttribute('data-active')).toBe('pointer')
    // Over the group itself, between the tiles.
    over(el)
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('ignores a finger', async () => {
    const el = await group()
    over(item(el, 'one'), 'touch')
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('never writes to the items, and clears its own state when it disconnects', async () => {
    const el = await group()
    const before = [...el.children].map((child) => child.outerHTML)
    over(item(el, 'one'))
    expect([...el.children].map((child) => child.outerHTML)).toEqual(before)
    el.remove()
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('lets go of an item that is removed while active', async () => {
    const el = await group()
    item(el, 'two').focus()
    expect(el.getAttribute('data-active')).toBe('focus')
    item(el, 'two').remove()
    await new Promise((resolve) => setTimeout(resolve))
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and leaves the items their semantics', async () => {
      const el = await group()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.shadowRoot?.querySelector('[role], [aria-hidden]')).toBeNull()
      expect(item(el, 'one').querySelector('img')?.getAttribute('alt')).toBe(
        'Angkor Wat at dawn',
      )
    })

    it('keeps the item holding keyboard focus sharp, then follows the latest of pointer and focus', async () => {
      const el = await group()
      item(el, 'three').focus()
      expect(document.activeElement).toBe(item(el, 'three'))
      expect(el.getAttribute('data-active')).toBe('focus')
      expect(css).toContain(
        ':host([data-active="focus"]) ::slotted(:not(:focus-within))',
      )

      // The pointer takes over, and focus takes back over when it leaves.
      over(item(el, 'one'))
      expect(el.getAttribute('data-active')).toBe('pointer')
      leave(el)
      expect(el.getAttribute('data-active')).toBe('focus')

      // Focus moving between items keeps the group active.
      item(el, 'two').focus()
      expect(el.getAttribute('data-active')).toBe('focus')

      item(el, 'two').blur()
      expect(el.hasAttribute('data-active')).toBe(false)
    })

    it('ignores focus that is not keyboard focus, such as from a mouse click', async () => {
      const el = await group()
      const link = item(el, 'one')
      const matches = link.matches.bind(link)
      // As a browser reports a link focused by a click.
      link.matches = (selector: string) =>
        selector === ':focus-visible' ? false : matches(selector)
      link.focus()
      expect(document.activeElement).toBe(link)
      expect(el.hasAttribute('data-active')).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('blurs and dims at once, without a transition or a scale', () => {
      expect(block(css, '::slotted(*) {')).toContain(
        'filter var(--focus-group-duration',
      )
      const reduce = block(css, '@media (prefers-reduced-motion: reduce)')
      expect(reduce).toMatch(/::slotted\(\*\)\s*\{\s*transition: none/)
      expect(reduce).toContain('scale: none')
      expect(reduce).not.toContain('filter: none')
    })
  })

  it('keeps every item legible where the system forces its own colours', () => {
    const forced = block(css, '@media (forced-colors: active)')
    expect(forced).toContain('filter: none')
    expect(forced).toContain('opacity: 1')
  })
})
