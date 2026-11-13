import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './HoverCard'
import type { MoulHoverCard } from './HoverCard'

const isShown = (el: MoulHoverCard): boolean =>
  Boolean(el.cardEl?.matches(':popover-open'))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function pointer(
  type: string,
  target: EventTarget,
  pointerType = 'mouse',
): void {
  target.dispatchEvent(new PointerEvent(type, { bubbles: false, pointerType }))
}

async function mountCard(
  attrs: { openDelay?: number; closeDelay?: number } = {},
): Promise<MoulHoverCard> {
  return fixture<MoulHoverCard>(html`
    <moul-hover-card
      open-delay=${attrs.openDelay ?? 500}
      close-delay=${attrs.closeDelay ?? 300}
    >
      <a slot="trigger" href="#sophea">@sophea</a>
      <p>Sophea Chan · Designer in Phnom Penh</p>
      <button id="follow">Follow</button>
    </moul-hover-card>
  `)
}

const triggerWrap = (el: MoulHoverCard) =>
  el.shadowRoot?.querySelector('[part="trigger"]') as HTMLElement
const link = (el: MoulHoverCard) =>
  el.querySelector('a[slot="trigger"]') as HTMLAnchorElement
const follow = (el: MoulHoverCard) =>
  el.querySelector('#follow') as HTMLButtonElement

describe('<moul-hover-card>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.useRealTimers()
    for (const node of document.querySelectorAll('[data-outside]'))
      node.remove()
  })

  it('renders a trigger slot and a manual popover card, closed by default', async () => {
    const el = await mountCard()
    expect(customElements.get('moul-hover-card')).toBeDefined()
    expect(el.placement).toBe('bottom')
    expect(el.openDelay).toBe(500)
    expect(el.closeDelay).toBe(300)
    expect(el.isOpen).toBe(false)
    expect(triggerWrap(el).querySelector('slot[name="trigger"]')).not.toBeNull()
    expect(el.cardEl?.getAttribute('popover')).toBe('manual')
    expect(isShown(el)).toBe(false)
  })

  describe('hover', () => {
    it('opens after open-delay and closes close-delay after the pointer leaves', async () => {
      const el = await mountCard()
      const changes: boolean[] = []
      el.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )
      vi.useFakeTimers()
      pointer('pointerenter', triggerWrap(el))
      vi.advanceTimersByTime(499)
      expect(el.isOpen).toBe(false)
      vi.advanceTimersByTime(1)
      expect(el.isOpen).toBe(true)

      pointer('pointerleave', triggerWrap(el))
      vi.advanceTimersByTime(299)
      expect(el.isOpen).toBe(true)
      vi.advanceTimersByTime(1)
      expect(el.isOpen).toBe(false)
      expect(changes).toEqual([true, false])
    })

    it('stays open while the pointer crosses from the trigger into the card', async () => {
      const el = await mountCard({ openDelay: 0 })
      vi.useFakeTimers()
      pointer('pointerenter', triggerWrap(el))
      expect(el.isOpen).toBe(true)
      pointer('pointerleave', triggerWrap(el))
      vi.advanceTimersByTime(100)
      pointer('pointerenter', el.cardEl as HTMLElement)
      vi.advanceTimersByTime(1000)
      expect(el.isOpen).toBe(true)

      pointer('pointerleave', el.cardEl as HTMLElement)
      vi.advanceTimersByTime(300)
      expect(el.isOpen).toBe(false)
    })

    it('a quick pass over the trigger never opens it', async () => {
      const el = await mountCard()
      vi.useFakeTimers()
      pointer('pointerenter', triggerWrap(el))
      vi.advanceTimersByTime(200)
      pointer('pointerleave', triggerWrap(el))
      vi.advanceTimersByTime(1000)
      expect(el.isOpen).toBe(false)
    })

    it('ignores touch, so a tap just follows the link', async () => {
      const el = await mountCard({ openDelay: 0 })
      pointer('pointerenter', triggerWrap(el), 'touch')
      expect(el.isOpen).toBe(false)
    })
  })

  describe('keyboard and screen readers', () => {
    it('opens at once on keyboard focus and keeps the card next in Tab order', async () => {
      const el = await mountCard()
      link(el).focus()
      expect(el.isOpen).toBe(true)
      await wait(0)
      expect(isShown(el)).toBe(true)

      // The card's content comes right after the trigger: tabbing on keeps it open.
      follow(el).focus()
      await wait(400)
      expect(el.isOpen).toBe(true)
      expect(
        link(el).compareDocumentPosition(follow(el)) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('closes when focus leaves both the trigger and the card', async () => {
      const outside = document.createElement('button')
      outside.dataset.outside = ''
      document.body.append(outside)
      const el = await mountCard()
      link(el).focus()
      follow(el).focus()
      outside.focus()
      expect(el.isOpen).toBe(false)
    })

    it('does not open at once when a press focuses the trigger', async () => {
      const el = await mountCard()
      link(el).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      link(el).focus()
      expect(el.isOpen).toBe(false)
    })

    it('Escape closes it, returns focus to the trigger and stops there', async () => {
      const el = await mountCard()
      const outerEscape = vi.fn()
      document.body.addEventListener('keydown', outerEscape)
      link(el).focus()
      follow(el).focus()
      follow(el).dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          composed: true,
        }),
      )
      expect(el.isOpen).toBe(false)
      expect(document.activeElement).toBe(link(el))
      // Focus back on the trigger does not reopen what Escape just closed.
      expect(el.isOpen).toBe(false)
      expect(outerEscape).not.toHaveBeenCalled()
      document.body.removeEventListener('keydown', outerEscape)
    })

    it('adds no popup semantics to the trigger or the card', async () => {
      const el = await mountCard()
      link(el).focus()
      expect(link(el).hasAttribute('aria-expanded')).toBe(false)
      expect(link(el).hasAttribute('aria-haspopup')).toBe(false)
      expect(el.cardEl?.hasAttribute('role')).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('grows the card in and out when motion is allowed', async () => {
      motion = mockReducedMotion(false)
      const el = await mountCard()
      await el.setOpen(true)
      const closing = el.setOpen(false)
      await wait(30)
      expect(isShown(el)).toBe(true)
      await closing
      expect(isShown(el)).toBe(false)
    })

    it('appears and disappears at once', async () => {
      motion = mockReducedMotion(true)
      const el = await mountCard()
      await el.setOpen(true)
      expect(isShown(el)).toBe(true)
      expect(el.cardEl?.style.transform ?? '').toBe('')
      void el.setOpen(false)
      await wait(30)
      expect(isShown(el)).toBe(false)
    })
  })
})
