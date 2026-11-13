import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ResultCard'
import type { MoulResultCard } from './ResultCard'
import { resultCardStyles } from './ResultCard.styles'

const icon = (el: MoulResultCard) =>
  el.shadowRoot?.querySelector<SVGElement>('svg.status-icon')
const glyphs = (el: MoulResultCard) =>
  el.shadowRoot?.querySelectorAll('.glyph') ?? []
const region = (el: MoulResultCard, role: 'status' | 'alert') =>
  el.shadowRoot?.querySelector(`[role="${role}"]`)?.textContent?.trim()

describe('<moul-result-card>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
  })

  it('shows a ring and a check for success by default', async () => {
    const el = await fixture<MoulResultCard>(
      html`<moul-result-card heading="Payment sent"></moul-result-card>`,
    )
    expect(el.status).toBe('success')
    expect(el.getAttribute('status')).toBe('success')
    expect(icon(el)?.querySelector('.ring')?.getAttribute('pathLength')).toBe(
      '1',
    )
    expect(glyphs(el)).toHaveLength(1)
  })

  it('draws a cross for error and only a turning arc while pending', async () => {
    const el = await fixture<MoulResultCard>(
      html`<moul-result-card status="error"></moul-result-card>`,
    )
    expect(glyphs(el)).toHaveLength(2)
    el.status = 'pending'
    await el.updateComplete
    expect(glyphs(el)).toHaveLength(0)
    expect(icon(el)?.querySelector('.ring')).not.toBeNull()
  })

  it('draws a fresh icon whenever the status changes', async () => {
    const el = await fixture<MoulResultCard>(
      html`<moul-result-card status="pending"></moul-result-card>`,
    )
    const before = icon(el)
    el.status = 'success'
    await el.updateComplete
    expect(icon(el)).not.toBe(before)
    expect(glyphs(el)).toHaveLength(1)
  })

  it('falls back to success for an unknown status', async () => {
    const el = await fixture<MoulResultCard>(
      html`<moul-result-card status="maybe"></moul-result-card>`,
    )
    await el.updateComplete
    expect(el.status).toBe('success')
  })

  it('renders the heading, description, details and actions', async () => {
    const el = await fixture<MoulResultCard>(html`
      <moul-result-card heading="Paid" description="Receipt sent to your email.">
        <dl><dt>Amount</dt><dd>$42.00</dd></dl>
        <button slot="actions">Done</button>
      </moul-result-card>
    `)
    await el.updateComplete
    const root = el.shadowRoot as ShadowRoot
    expect(root.querySelector('[part="heading"]')?.textContent?.trim()).toBe(
      'Paid',
    )
    expect(root.querySelector('[part="description"]')?.textContent).toBe(
      'Receipt sent to your email.',
    )
    expect(root.querySelector('[part="details"]')?.hasAttribute('hidden')).toBe(
      false,
    )
    expect(root.querySelector('[part="actions"]')?.hasAttribute('hidden')).toBe(
      false,
    )
  })

  it('hides the empty details and actions wrappers', async () => {
    const el = await fixture<MoulResultCard>(
      html`<moul-result-card heading="Saved"></moul-result-card>`,
    )
    const root = el.shadowRoot as ShadowRoot
    expect(root.querySelector('[part="details"]')?.hasAttribute('hidden')).toBe(
      true,
    )
    expect(root.querySelector('[part="actions"]')?.hasAttribute('hidden')).toBe(
      true,
    )
    expect(root.querySelector('[part="description"]')).toBeNull()
  })

  it('lets the icon slot replace the status icon', async () => {
    const el = await fixture<MoulResultCard>(html`
      <moul-result-card><span slot="icon" id="custom">★</span></moul-result-card>
    `)
    const slot =
      el.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="icon"]')
    expect(slot?.assignedElements()[0]?.id).toBe('custom')
  })

  describe('keyboard and screen readers', () => {
    it('takes no focus, hides the icon and exposes a heading at heading-level', async () => {
      const el = await fixture<MoulResultCard>(
        html`<moul-result-card heading="Imported" heading-level="3"></moul-result-card>`,
      )
      expect(el.tabIndex).toBe(-1)
      expect(
        el.shadowRoot
          ?.querySelector('[part="icon"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
      const heading = el.shadowRoot?.querySelector('[part="heading"]')
      expect(heading?.getAttribute('role')).toBe('heading')
      expect(heading?.getAttribute('aria-level')).toBe('3')
      el.headingLevel = 9
      await el.updateComplete
      expect(heading?.getAttribute('aria-level')).toBe('6')
    })

    it('does not announce the first render', async () => {
      const el = await fixture<MoulResultCard>(
        html`<moul-result-card heading="Paid" description="Thanks"></moul-result-card>`,
      )
      expect(region(el, 'status')).toBe('')
      expect(region(el, 'alert')).toBe('')
    })

    it('announces a success politely and an error assertively', async () => {
      const el = await fixture<MoulResultCard>(
        html`<moul-result-card status="pending" heading="Processing"></moul-result-card>`,
      )
      const polite = el.shadowRoot?.querySelector('[role="status"]')
      const alert = el.shadowRoot?.querySelector('[role="alert"]')
      expect(polite?.getAttribute('aria-live')).toBe('polite')
      expect(alert?.getAttribute('aria-live')).toBe('assertive')

      el.status = 'success'
      el.heading = 'Payment sent'
      el.description = '$42.00 to Dara'
      await el.updateComplete
      expect(region(el, 'status')).toBe('Payment sent. $42.00 to Dara')
      expect(region(el, 'alert')).toBe('')

      el.status = 'error'
      el.heading = 'Payment failed'
      el.description = 'The card was declined.'
      await el.updateComplete
      expect(region(el, 'alert')).toBe('Payment failed. The card was declined.')
      expect(region(el, 'status')).toBe('')
    })
  })

  describe('reduced motion', () => {
    it('shows the icon fully drawn and the pending arc still', async () => {
      motion = mockReducedMotion(true)
      const css = resultCardStyles.map((sheet) => String(sheet)).join('\n')
      const reduced = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      )
      expect(reduced).toMatch(
        /\.ring,\s*\.glyph,\s*:host\(:not\(\[status="pending"\]\)\) \.status-icon,\s*:host\(\[status="pending"\]\) \.ring\s*{\s*animation: none;\s*stroke-dashoffset: 0/,
      )
      // Status changes still swap the icon; only its motion goes.
      const el = await fixture<MoulResultCard>(
        html`<moul-result-card status="pending"></moul-result-card>`,
      )
      el.status = 'error'
      await el.updateComplete
      expect(glyphs(el)).toHaveLength(2)
    })
  })
})
