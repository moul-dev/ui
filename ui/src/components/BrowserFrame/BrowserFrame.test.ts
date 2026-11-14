import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import './BrowserFrame'
import type { MoulBrowserFrame } from './BrowserFrame'
import { browserFrameStyles } from './BrowserFrame.styles'

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) ?? null

/** The declarations of the rule whose whole selector is `selector`. */
function rule(selector: string): string {
  const css = browserFrameStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(
    css,
  )
  expect(match, `no rule for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

describe('<moul-browser-frame>', () => {
  it('renders the window, its toolbar, the address and the content', async () => {
    const el = await fixture<MoulBrowserFrame>(
      html`<moul-browser-frame url="https://example.com/pricing"
        ><img src="shot.png" alt="Pricing page"
      /></moul-browser-frame>`,
    )
    const base = part(el, 'base')
    const toolbar = part(el, 'toolbar')
    const content = part(el, 'content')
    expect(base).not.toBeNull()
    expect(toolbar?.parentElement).toBe(base)
    expect(content?.parentElement).toBe(base)
    expect(part(el, 'address')?.parentElement).toBe(toolbar)
    expect(toolbar?.querySelectorAll('.dot')).toHaveLength(3)
    expect(content?.querySelector('slot')).not.toBeNull()
  })

  it('shows url in the address pill, updates it, and starts empty', async () => {
    const el = await fixture<MoulBrowserFrame>(
      html`<moul-browser-frame></moul-browser-frame>`,
    )
    expect(el.url).toBe('')
    expect(part(el, 'address')?.textContent).toBe('')

    el.setAttribute('url', 'example.com')
    await el.updateComplete
    expect(el.url).toBe('example.com')
    expect(part(el, 'address')?.textContent).toBe('example.com')
  })

  it('shows the address as plain text, never as markup or a link', async () => {
    const el = await fixture<MoulBrowserFrame>(
      html`<moul-browser-frame
        url="https://example.com/<b>bold</b>"
      ></moul-browser-frame>`,
    )
    const address = part(el, 'address')
    expect(address?.textContent).toBe('https://example.com/<b>bold</b>')
    expect(address?.querySelector('b')).toBeNull()
    expect(el.shadowRoot?.querySelector('a')).toBeNull()
  })

  it('keeps the address left to right, as browsers do, in right-to-left pages', async () => {
    const el = await fixture<MoulBrowserFrame>(
      html`<div dir="rtl">
        <moul-browser-frame url="https://example.com"></moul-browser-frame>
      </div>`,
    )
    const frame = el.querySelector('moul-browser-frame') as MoulBrowserFrame
    expect(part(frame, 'address')?.getAttribute('dir')).toBe('ltr')
  })

  it('draws the window from tokens: secondary toolbar, border, surface corners and shadow', () => {
    const base = rule('[part="base"]')
    expect(base).toContain('border: 1px solid var(--color-border)')
    expect(base).toContain('border-radius: var(--radius-surface')
    expect(base).toContain('box-shadow: var(--shadow-surface)')
    expect(base).toContain('background: var(--color-surface)')
    expect(rule('[part="toolbar"]')).toContain(
      'background: var(--color-surface-secondary)',
    )
    expect(rule('.dot')).toContain('background: var(--color-danger)')
    expect(rule('.dot:nth-child(2)')).toContain(
      'background: var(--color-warning)',
    )
    expect(rule('.dot:nth-child(3)')).toContain(
      'background: var(--color-success)',
    )
  })

  it('cuts a long address short with an ellipsis', () => {
    const address = rule('[part="address"]')
    expect(address).toContain('text-overflow: ellipsis')
    expect(address).toContain('white-space: nowrap')
    expect(address).toContain('overflow: hidden')
  })

  it('shows images and videos as full-width blocks', () => {
    const media =
      /::slotted\(img\),\s*::slotted\(video\),\s*::slotted\(iframe\) \{([^}]*)\}/.exec(
        browserFrameStyles.cssText,
      )?.[1]
    expect(media).toContain('display: block')
    expect(media).toContain('inline-size: 100%')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role, so the content keeps its own semantics', async () => {
      const el = await fixture<MoulBrowserFrame>(
        html`<moul-browser-frame url="https://example.com"
          ><img src="shot.png" alt="The dashboard, with three charts"
        /></moul-browser-frame>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(
        el.shadowRoot?.querySelector('a, button, input, [tabindex]'),
      ).toBeNull()

      const img = el.querySelector('img')
      expect(img?.getAttribute('alt')).toBe('The dashboard, with three charts')
      const slot = el.shadowRoot?.querySelector('slot')
      expect(slot?.assignedElements()).toEqual([img])
      expect(slot?.closest('[aria-hidden]')).toBeNull()
    })

    it('hides the toolbar, dots and address, from screen readers', async () => {
      const el = await fixture<MoulBrowserFrame>(
        html`<moul-browser-frame url="https://example.com"></moul-browser-frame>`,
      )
      const toolbar = part(el, 'toolbar')
      expect(toolbar?.getAttribute('aria-hidden')).toBe('true')
      expect(part(el, 'address')?.closest('[aria-hidden="true"]')).toBe(toolbar)
    })
  })

  describe('reduced motion', () => {
    it('has no motion to reduce: no animation or transition', () => {
      const css = browserFrameStyles.cssText
      expect(css).not.toMatch(/@keyframes|animation|transition/)
    })
  })
})
