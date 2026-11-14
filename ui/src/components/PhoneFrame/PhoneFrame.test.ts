import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import './PhoneFrame'
import type { MoulPhoneFrame } from './PhoneFrame'
import { phoneFrameStyles } from './PhoneFrame.styles'

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null

/** The declarations of the rule whose whole selector is `selector`. */
function rule(selector: string): string {
  const css = phoneFrameStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

describe('<moul-phone-frame>', () => {
  it('renders the body, the screen and, by default, the iphone cut-out and side buttons', async () => {
    const el = await fixture<MoulPhoneFrame>(
      html`<moul-phone-frame
        ><img src="app.png" alt="The inbox"
      /></moul-phone-frame>`,
    )
    expect(el.variant).toBe('iphone')
    expect(el.getAttribute('variant')).toBe('iphone')
    const base = part(el, 'base')
    const screen = part(el, 'screen')
    expect(screen?.parentElement).toBe(base)
    expect(screen?.querySelector('slot')).not.toBeNull()
    expect(part(el, 'island')?.parentElement).toBe(screen)
    expect(part(el, 'camera')).toBeNull()
    expect(el.shadowRoot?.querySelectorAll('.button.left')).toHaveLength(3)
    expect(el.shadowRoot?.querySelectorAll('.button.right')).toHaveLength(1)
  })

  it('draws the android variant with a round camera hole instead of the cut-out', async () => {
    const el = await fixture<MoulPhoneFrame>(
      html`<moul-phone-frame variant="android"></moul-phone-frame>`,
    )
    expect(part(el, 'camera')?.parentElement).toBe(part(el, 'screen'))
    expect(part(el, 'island')).toBeNull()

    el.variant = 'iphone'
    await el.updateComplete
    expect(part(el, 'island')).not.toBeNull()
    expect(part(el, 'camera')).toBeNull()
  })

  it('falls back to iphone for an unknown variant', async () => {
    const el = await fixture<MoulPhoneFrame>(
      html`<moul-phone-frame variant="flip-phone"></moul-phone-frame>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('iphone')
    expect(el.getAttribute('variant')).toBe('iphone')
    expect(part(el, 'island')).not.toBeNull()
  })

  it('draws only shapes: no text, images or marks of its own', async () => {
    for (const variant of ['iphone', 'android']) {
      const el = await fixture<MoulPhoneFrame>(
        html`<moul-phone-frame variant=${variant}></moul-phone-frame>`,
      )
      const root = el.shadowRoot as ShadowRoot
      expect(root.textContent?.trim()).toBe('')
      expect(root.querySelector('img, svg, video, picture')).toBeNull()
    }
  })

  it('takes its width from --phone-frame-width and scales the rest with it', () => {
    const host = rule(':host')
    expect(host).toContain('inline-size: var(--phone-frame-width, 18rem)')
    expect(host).toContain('container-type: inline-size')
    // Bezel, corners, buttons and cut-outs are fractions of that width, never fixed lengths.
    for (const name of [
      '--_phone-button',
      '--_phone-inset',
      '--_phone-radius',
    ]) {
      expect(host).toMatch(new RegExp(`${name}: [\\d.]+cqi;`))
    }
    expect(rule('[part="island"]')).toMatch(/inline-size: [\d.]+cqi/)
    expect(rule('[part="camera"]')).toMatch(/inline-size: [\d.]+cqi/)
  })

  it('gives the screen the aspect ratio of a modern phone', () => {
    expect(rule(':host')).toContain('--_phone-ratio: 393 / 852')
    expect(rule(':host([variant="android"])')).toContain(
      '--_phone-ratio: 412 / 915',
    )
    expect(rule('[part="screen"]')).toContain(
      'aspect-ratio: var(--_phone-ratio)',
    )
  })

  it('covers the screen with an image or a video, and shows the surface when empty', () => {
    expect(rule('[part="screen"]')).toContain(
      'background: var(--color-surface)',
    )
    expect(phoneFrameStyles.cssText).toMatch(
      /::slotted\(img\),\s*::slotted\(video\) \{\s*object-fit: cover;/,
    )
  })

  it('keeps the bezel dark in both themes from a token, with an override', () => {
    const host = rule(':host')
    expect(host).toMatch(
      /--_phone-bezel: var\(\s*--phone-frame-bezel,\s*var\(--color-eclipse/,
    )
    const base = rule('[part="base"]')
    expect(base).toContain('background: var(--_phone-bezel)')
    expect(base).toContain('0 0 0 1px var(--color-border)')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role, so the screen keeps its own semantics', async () => {
      const el = await fixture<MoulPhoneFrame>(
        html`<moul-phone-frame
          ><img src="app.png" alt="The inbox, with two unread messages"
        /></moul-phone-frame>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(
        el.shadowRoot?.querySelector('a, button, input, [tabindex]'),
      ).toBeNull()

      const img = el.querySelector('img')
      const slot = el.shadowRoot?.querySelector('slot')
      expect(slot?.assignedElements()).toEqual([img])
      expect(slot?.closest('[aria-hidden]')).toBeNull()
      expect(img?.getAttribute('alt')).toBe(
        'The inbox, with two unread messages',
      )
    })

    it('hides the decoration, buttons and cut-out alike, from screen readers', async () => {
      for (const variant of ['iphone', 'android']) {
        const el = await fixture<MoulPhoneFrame>(
          html`<moul-phone-frame variant=${variant}></moul-phone-frame>`,
        )
        const root = el.shadowRoot as ShadowRoot
        const decoration = [
          ...root.querySelectorAll('.button'),
          part(el, variant === 'android' ? 'camera' : 'island'),
        ]
        for (const piece of decoration) {
          expect(piece?.closest('[aria-hidden="true"]')).not.toBeNull()
        }
      }
    })
  })

  describe('reduced motion', () => {
    it('has no motion to reduce: no animation or transition', () => {
      expect(phoneFrameStyles.cssText).not.toMatch(
        /@keyframes|animation|transition/,
      )
    })
  })
})
