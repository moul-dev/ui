import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import { triggerResize } from '../../test-setup'
import './BentoGrid'
import type { MoulBentoCard, MoulBentoGrid } from './BentoGrid'
import { bentoCardStyles, bentoGridStyles } from './BentoGrid.styles'

const gridCss = bentoGridStyles.map((sheet) => String(sheet)).join('\n')
const cardCss = bentoCardStyles.map((sheet) => String(sheet)).join('\n')

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement

/** The body of the first block that starts with `prelude`. */
function block(css: string, prelude: string): string {
  const start = css.indexOf(prelude)
  if (start < 0) return ''
  const open = css.indexOf('{', start)
  let depth = 0
  for (let index = open; index < css.length; index++) {
    if (css[index] === '{') depth++
    else if (css[index] === '}' && --depth === 0) {
      return css.slice(open + 1, index)
    }
  }
  return ''
}

async function grid(columns?: number): Promise<MoulBentoGrid> {
  const el = await fixture<MoulBentoGrid>(
    html`<moul-bento-grid columns=${columns ?? 3}>
      <moul-bento-card col-span="2">
        <h3 slot="heading">Previews</h3>
        Every push gets its own URL.
      </moul-bento-card>
      <moul-bento-card row-span="2">
        <h3 slot="heading">Logs</h3>
        Search every request.
      </moul-bento-card>
      <moul-bento-card col-span="5">
        <h3 slot="heading">Rollbacks</h3>
        One click back.
      </moul-bento-card>
    </moul-bento-grid>`,
  )
  await Promise.all(
    [...el.querySelectorAll('moul-bento-card')].map(
      (card) => card.updateComplete,
    ),
  )
  return el
}

const cards = (el: MoulBentoGrid) =>
  [...el.querySelectorAll('moul-bento-card')] as MoulBentoCard[]

const spans = (card: MoulBentoCard) => [
  card.style.getPropertyValue('--_bento-col-span'),
  card.style.getPropertyValue('--_bento-row-span'),
]

describe('<moul-bento-grid>', () => {
  it('lays the cards out in a CSS grid of `columns` columns', async () => {
    const el = await grid()
    expect(el.columns).toBe(3)
    expect(el.getAttribute('columns')).toBe('3')
    const base = part(el, 'base')
    expect(base.style.getPropertyValue('--_bento-columns')).toBe('3')
    expect(base.querySelector('slot')).not.toBeNull()
    expect(gridCss).toContain(
      'grid-template-columns: repeat(var(--_bento-columns, 3), minmax(0, 1fr))',
    )
    expect(gridCss).toContain(
      'grid-auto-rows: var(--bento-row-height, minmax(12rem, auto))',
    )
    expect(gridCss).toContain('gap: var(--bento-gap, var(--spacing-4, 1rem))')
  })

  it('falls back to three columns for a value that is not a whole number of at least 1', async () => {
    const el = await grid(0)
    expect(el.columns).toBe(3)
    el.columns = 2.7
    await el.updateComplete
    expect(el.columns).toBe(2)
  })

  it('becomes one column below 36rem of its own width', () => {
    expect(gridCss).toContain('container: moul-bento / inline-size')
    const narrow = block(gridCss, '@container moul-bento (max-width: 36rem)')
    expect(narrow).toMatch(
      /\[part="base"\]\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/,
    )
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role', async () => {
      const el = await grid()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(part(el, 'base').hasAttribute('role')).toBe(false)
    })

    it('never reorders the cards, so reading order matches what is seen', () => {
      expect(gridCss).not.toContain('dense')
      expect(cardCss).not.toMatch(/\border\s*:/)
    })
  })

  describe('reduced motion', () => {
    it('has nothing to move', () => {
      expect(gridCss).not.toMatch(/transition|animation/)
    })
  })
})

describe('<moul-bento-card>', () => {
  it('spans the columns and rows it is given', async () => {
    const el = await grid()
    const [wide, tall] = cards(el)
    expect(spans(wide)).toEqual(['2', '1'])
    expect(spans(tall)).toEqual(['1', '2'])
    expect(cardCss).toContain('grid-column: span var(--_bento-col-span, 1)')
    expect(cardCss).toContain('grid-row: span var(--_bento-row-span, 1)')
  })

  it('clamps its column span to the grid, and follows the grid when columns change', async () => {
    const el = await grid()
    const [wide, , tooWide] = cards(el)
    expect(spans(tooWide)).toEqual(['3', '1'])

    el.columns = 2
    await el.updateComplete
    await tooWide.updateComplete
    expect(spans(tooWide)).toEqual(['2', '1'])
    expect(spans(wide)).toEqual(['2', '1'])

    el.columns = 1
    await el.updateComplete
    await wide.updateComplete
    expect(spans(wide)).toEqual(['1', '1'])
  })

  it('reads the columns attribute of a grid that is not upgraded', async () => {
    const wrapper = await fixture<HTMLElement>(
      html`<div>
        <x-plain-grid columns="2"></x-plain-grid>
      </div>`,
    )
    const plain = wrapper.querySelector('x-plain-grid') as HTMLElement
    // Stands in for a grid that has not upgraded yet.
    Object.defineProperty(plain, 'localName', { value: 'moul-bento-grid' })
    const card = document.createElement('moul-bento-card')
    card.colSpan = 4
    plain.append(card)
    await card.updateComplete
    expect(spans(card)).toEqual(['2', '1'])
  })

  it('does not clamp outside a grid, and falls back to 1 for a bad span', async () => {
    const card = await fixture<MoulBentoCard>(
      html`<moul-bento-card col-span="4" row-span="-2"></moul-bento-card>`,
    )
    expect(spans(card)).toEqual(['4', '1'])
  })

  it('drops its spans in a narrow grid, through a container query that reaches it across the shadow boundary', () => {
    const narrow = block(cardCss, '@container moul-bento (max-width: 36rem)')
    expect(narrow).toMatch(
      /:host\s*\{\s*grid-column: auto;\s*grid-row: auto;?\s*\}/,
    )
    // The narrow rule comes after the span rule, so it wins when it applies.
    expect(cardCss.indexOf('@container moul-bento')).toBeGreaterThan(
      cardCss.indexOf('grid-column: span'),
    )
  })

  it('looks like moul-card: the surface colour, shadow and radius', () => {
    // The card's own sheet, after the shared reset.
    const host = block(String(bentoCardStyles[1]), ':host {')
    expect(host).toContain('background-color: var(--color-surface)')
    expect(host).toContain('box-shadow: var(--shadow-surface)')
    expect(host).toContain('border-radius: var(--radius-surface, 1.5rem)')
  })

  it('shows the icon and action wrappers only when they have content', async () => {
    const card = await fixture<MoulBentoCard>(
      html`<moul-bento-card><h3 slot="heading">Plain</h3></moul-bento-card>`,
    )
    expect(part(card, 'icon').hidden).toBe(true)
    expect(part(card, 'action').hidden).toBe(true)

    const full = await fixture<MoulBentoCard>(
      html`<moul-bento-card>
        <svg slot="icon" aria-hidden="true"></svg>
        <h3 slot="heading">Full</h3>
        <a slot="action" href="#more">Learn more</a>
      </moul-bento-card>`,
    )
    expect(part(full, 'icon').hidden).toBe(false)
    expect(part(full, 'action').hidden).toBe(false)
    expect(
      (
        part(full, 'action').querySelector('slot') as HTMLSlotElement
      ).assignedElements()[0]?.textContent,
    ).toBe('Learn more')
  })

  it('puts visual art above the text and background art behind the card', async () => {
    const plain = await fixture<MoulBentoCard>(
      html`<moul-bento-card><h3 slot="heading">Plain</h3></moul-bento-card>`,
    )
    // With nothing in it, the visual area takes no room.
    expect(part(plain, 'visual').hidden).toBe(true)

    const card = await fixture<MoulBentoCard>(
      html`<moul-bento-card>
        <img slot="visual" alt="The dashboard" />
        <div slot="background" aria-hidden="true"></div>
        <h3 slot="heading">Art</h3>
      </moul-bento-card>`,
    )
    expect(part(card, 'visual').hidden).toBe(false)
    const order = [...part(card, 'base').children].map((child) =>
      child.getAttribute('part'),
    )
    // Background first (painted behind), then visual above the content.
    expect(order.slice(0, 3)).toEqual(['background', 'visual', 'content'])
    const css = bentoCardStyles
      .map((sheet) => ('cssText' in sheet ? sheet.cssText : ''))
      .join('\n')
    expect(css).toMatch(/\[part="background"\] \{\s*position: absolute;/)
    expect(css).toMatch(
      /\[part="visual"\] \{\s*position: relative;[^}]*flex: 1 1 auto;/,
    )
  })

  it('measures the action so the text lifts by exactly its height', async () => {
    const card = await fixture<MoulBentoCard>(
      html`<moul-bento-card>
        <h3 slot="heading">Lift</h3>
        <a slot="action" href="#more">Learn more</a>
      </moul-bento-card>`,
    )
    triggerResize(part(card, 'action'), { width: 240, height: 52 })
    expect(
      part(card, 'base').style.getPropertyValue('--_bento-action-size'),
    ).toBe('52px')
    card.remove()
    // The observer let go: no further writes after disconnect.
    triggerResize(part(card, 'action'), { width: 240, height: 80 })
    expect(
      part(card, 'base').style.getPropertyValue('--_bento-action-size'),
    ).toBe('52px')
  })

  it('lifts the text, slides the action in and grows the art only under a real cursor with motion allowed', () => {
    const hover = block(
      cardCss,
      '@media (hover: hover) and (prefers-reduced-motion: no-preference)',
    )
    expect(hover).toMatch(
      /:host\(:not\(:hover\):not\(:focus-within\)\) \[part="content"\],\s*:host\(:not\(:hover\):not\(:focus-within\)\) \[part="action"\]\s*\{\s*translate: 0 var\(--_bento-action-size, 0px\)/,
    )
    expect(hover).toMatch(/\[part="action"\]\s*\{\s*opacity: 0/)
    expect(hover).toContain('scale: 1.03')
    // Outside that block the action is never hidden, so touch screens always show it.
    const outside = cardCss.replace(hover, '')
    expect(outside).not.toContain('opacity: 0')
    expect(outside).not.toContain('var(--_bento-action-size')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the action keeps its own semantics', async () => {
      const card = await fixture<MoulBentoCard>(
        html`<moul-bento-card>
          <h3 slot="heading">Keys</h3>
          <a slot="action" href="#more">Learn more</a>
        </moul-bento-card>`,
      )
      expect(card.hasAttribute('tabindex')).toBe(false)
      expect(card.hasAttribute('role')).toBe(false)
      expect(card.shadowRoot?.querySelector('[aria-hidden]')).toBeNull()
      const link = card.querySelector('a') as HTMLElement
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    it('shows the action as soon as focus moves into the card', () => {
      expect(cardCss).toContain(':not(:focus-within)')
      expect(cardCss).toMatch(
        /:host\(:focus-within\) :is\(\[part="visual"\], \[part="background"\]\)/,
      )
    })
  })

  describe('reduced motion', () => {
    it('nothing lifts, slides or grows, and the action is always shown', () => {
      const reduce = block(cardCss, '@media (prefers-reduced-motion: reduce)')
      expect(reduce).toContain('transition: none')
      expect(reduce).toContain('translate: none')
      expect(reduce).toContain('scale: none')
      expect(reduce).toMatch(/\[part="action"\]\s*\{\s*opacity: 1/)
    })
  })
})
