import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulNumberTicker } from '../NumberTicker/NumberTicker'
import './Badge'
import { MoulBadge } from './Badge'

const shadow = (el: HTMLElement) => el.shadowRoot as ShadowRoot
const ticker = (el: MoulBadge) =>
  shadow(el).querySelector<MoulNumberTicker>('moul-number-ticker')
/** What a screen reader reads for the count: the ticker's final value and the "+" after it. */
const countText = (el: MoulBadge) => {
  const count = shadow(el).querySelector('.count')
  const value = ticker(el)?.shadowRoot?.querySelector('.sr-only')?.textContent
  const after = Array.from(count?.childNodes ?? [])
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join('')
    .trim()
  return `${value ?? ''}${after}`
}
const styleText = () =>
  (MoulBadge.styles as unknown as { cssText: string }[])
    .map((style) => style.cssText)
    .join('\n')

describe('<moul-badge>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
  })

  describe('count', () => {
    it('shows the count in a number ticker in place of the label', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="5">Label</moul-badge>`,
      )
      expect(el.count).toBe(5)
      expect(shadow(el).querySelector('slot:not([name])')).toBeNull()
      const count = ticker(el)
      expect(count?.getAttribute('part')).toBe('count')
      await count?.updateComplete
      expect(count?.value).toBe(5)
      expect(countText(el)).toBe('5')
    })

    it('rolls the ticker to each new count', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="3"></moul-badge>`,
      )
      el.count = 12
      await el.updateComplete
      expect(ticker(el)?.value).toBe(12)
    })

    it('caps the count at max and reads 99+ past it', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="150"></moul-badge>`,
      )
      await ticker(el)?.updateComplete
      expect(el.max).toBe(99)
      expect(countText(el)).toBe('99+')

      el.max = 9
      el.count = 9
      await el.updateComplete
      await ticker(el)?.updateComplete
      expect(countText(el)).toBe('9')
      el.count = 10
      await el.updateComplete
      await ticker(el)?.updateComplete
      expect(countText(el)).toBe('9+')
    })

    it('treats an invalid max as 99', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="120" max="0"></moul-badge>`,
      )
      await ticker(el)?.updateComplete
      expect(countText(el)).toBe('99+')
    })

    it('returns to the slotted label when count is cleared', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="2">New</moul-badge>`,
      )
      el.count = undefined
      await el.updateComplete
      expect(ticker(el)).toBeNull()
      expect(shadow(el).querySelector('slot:not([name])')).not.toBeNull()
    })
  })

  describe('is-live', () => {
    it('leads a text badge with a pulsing dot', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge is-live tone="success">Live</moul-badge>`,
      )
      expect(el.isLive).toBe(true)
      expect(shadow(el).querySelector('[part="live-dot"]')).not.toBeNull()
      expect(shadow(el).querySelector('[part="pulse"]')).toBeNull()
    })

    it('sends a ring out of a dot badge', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge is-dot is-live tone="error"></moul-badge>`,
      )
      expect(shadow(el).querySelector('[part="pulse"]')).not.toBeNull()
      expect(shadow(el).querySelector('[part="live-dot"]')).toBeNull()
      el.isLive = false
      await el.updateComplete
      expect(el.hasAttribute('is-live')).toBe(false)
      expect(shadow(el).querySelector('[part="pulse"]')).toBeNull()
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and has no role', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="4" is-live>Inbox</moul-badge>`,
      )
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      expect(shadow(el).querySelector('[tabindex]')).toBeNull()
    })

    it('hides the live dot and pulse from screen readers', async () => {
      const text = await fixture<MoulBadge>(
        html`<moul-badge is-live>Live</moul-badge>`,
      )
      const dot = await fixture<MoulBadge>(
        html`<moul-badge is-dot is-live aria-label="Live"></moul-badge>`,
      )
      expect(
        shadow(text)
          .querySelector('[part="live-dot"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(
        shadow(dot)
          .querySelector('[part="pulse"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('reads the final count, not the digits rolling toward it', async () => {
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="8"></moul-badge>`,
      )
      el.count = 31
      await el.updateComplete
      await ticker(el)?.updateComplete
      expect(countText(el)).toBe('31')
      // The rolling digits themselves are hidden.
      const digits = ticker(el)?.shadowRoot?.querySelector('[part="digits"]')
      expect(digits?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('reduced motion', () => {
    it('stops the pulse in CSS and keeps the dot', () => {
      const css = styleText()
      const reduced = css.slice(css.indexOf('prefers-reduced-motion'))
      expect(css).toMatch(/\.pulse\s*\{[^}]*animation: moul-badge-pulse/)
      expect(reduced).toMatch(
        /\.pulse,\s*\.live-dot::after\s*\{\s*animation: none;\s*opacity: 0;/,
      )
    })

    it('jumps the count to its new value', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulBadge>(
        html`<moul-badge count="9"></moul-badge>`,
      )
      el.count = 10
      await el.updateComplete
      await ticker(el)?.updateComplete
      const digits = ticker(el)?.shadowRoot?.querySelectorAll('.roll > .digit')
      expect(digits).toHaveLength(2)
      const strips = Array.from(digits ?? []).map(
        (digit) =>
          (digit.querySelector('.strip') as HTMLElement).style.transform,
      )
      expect(strips).toEqual(['translateY(-5%)', 'translateY(0%)'])
      vi.restoreAllMocks()
    })
  })
})
