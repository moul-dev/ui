import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import './Spinner'
import type { MoulSpinner } from './Spinner'
import { spinnerStyles } from './Spinner.styles'

const css = spinnerStyles.map((sheet) => String(sheet)).join('\n')
const reducedBlock = css.slice(
  css.indexOf('@media (prefers-reduced-motion: reduce)'),
)

describe('<moul-spinner> variants', () => {
  it('draws the ring by default', async () => {
    const el = await fixture<MoulSpinner>(html`<moul-spinner></moul-spinner>`)
    expect(el.variant).toBe('ring')
    expect(el.getAttribute('variant')).toBe('ring')
    expect(el.shadowRoot?.querySelector('svg.spinner-svg')).not.toBeNull()
  })

  it('draws three dots, a shape or an orbiting dot', async () => {
    const dots = await fixture<MoulSpinner>(
      html`<moul-spinner variant="dots"></moul-spinner>`,
    )
    expect(dots.shadowRoot?.querySelectorAll('.dot')).toHaveLength(3)
    expect(dots.shadowRoot?.querySelector('svg')).toBeNull()

    const shape = await fixture<MoulSpinner>(
      html`<moul-spinner variant="shape"></moul-spinner>`,
    )
    expect(shape.shadowRoot?.querySelector('.shape')).not.toBeNull()

    const orbit = await fixture<MoulSpinner>(
      html`<moul-spinner variant="orbit"></moul-spinner>`,
    )
    expect(orbit.shadowRoot?.querySelector('.orbit .satellite')).not.toBeNull()
  })

  it('falls back to the ring for an unknown variant', async () => {
    const el = await fixture<MoulSpinner>(
      html`<moul-spinner variant="wobble"></moul-spinner>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('ring')
    expect(el.shadowRoot?.querySelector('svg.spinner-svg')).not.toBeNull()
  })

  it('swaps the drawing when the variant changes', async () => {
    const el = await fixture<MoulSpinner>(html`<moul-spinner></moul-spinner>`)
    el.variant = 'orbit'
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('svg')).toBeNull()
    expect(el.shadowRoot?.querySelector('.orbit')).not.toBeNull()
  })

  describe('keyboard and screen readers', () => {
    it('is an unfocusable status named by its label in every variant', async () => {
      for (const variant of ['ring', 'dots', 'shape', 'orbit']) {
        const el = await fixture<MoulSpinner>(
          html`<moul-spinner variant=${variant} label="Syncing"></moul-spinner>`,
        )
        const base = el.shadowRoot?.querySelector('[part="base"]')
        expect(base?.getAttribute('role')).toBe('status')
        expect(base?.getAttribute('aria-label')).toBe('Syncing')
        expect(el.shadowRoot?.querySelector('.sr-only')?.textContent).toBe(
          'Syncing',
        )
        // The drawing itself is hidden from screen readers.
        const drawing = base?.firstElementChild
        expect(drawing?.getAttribute('aria-hidden')).toBe('true')
        expect(el.tabIndex).toBe(-1)
      }
    })
  })

  describe('reduced motion', () => {
    it('stops turning and travelling, and pulses instead', () => {
      expect(reducedBlock).not.toBe('')
      expect(reducedBlock).toMatch(
        /\.spinner-svg,\s*\.shape,\s*\.satellite::before\s*{\s*animation: moul-spin-pulse/,
      )
      expect(reducedBlock).toMatch(/\.satellite\s*{\s*animation: none/)
    })

    it('pulses the dots one after another without rising', () => {
      expect(reducedBlock).toMatch(/\.dot\s*{\s*animation: moul-spinner-fade/)
      expect(reducedBlock).toMatch(
        /\.dot:nth-child\(3\)\s*{\s*animation-delay: 0\.6s/,
      )
      const fade = /@keyframes moul-spinner-fade\s*{([\s\S]*?)}\s*}/.exec(css)
      expect(fade?.[1]).toContain('opacity')
      expect(fade?.[1]).not.toContain('transform')
    })
  })
})
