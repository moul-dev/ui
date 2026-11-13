import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulAnimatedList } from '../AnimatedList/AnimatedList'
import './NotificationBell'
import type { MoulNotificationBell } from './NotificationBell'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mount(markup?: string): Promise<MoulNotificationBell> {
  const host = document.createElement('div')
  host.innerHTML =
    markup ??
    `<moul-notification-bell count="3">
      <button slot="header-actions" type="button">Mark all read</button>
      <a href="#one">Deploy finished</a>
      <a href="#two">New sign-up</a>
    </moul-notification-bell>
    <button id="outside" type="button">Outside</button>`
  document.body.append(host)
  const bell = host.querySelector(
    'moul-notification-bell',
  ) as MoulNotificationBell
  await bell.updateComplete
  await Promise.resolve()
  await bell.updateComplete
  return bell
}

const part = (bell: MoulNotificationBell, name: string) =>
  bell.shadowRoot?.querySelector<HTMLElement>(
    `[part~="${name}"]`,
  ) as HTMLElement

const isShown = (bell: MoulNotificationBell) =>
  part(bell, 'popover').matches(':popover-open')

function key(target: EventTarget, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

describe('<moul-notification-bell>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
  })

  it('is registered and starts closed with its defaults', async () => {
    const bell = await mount(
      '<moul-notification-bell></moul-notification-bell>',
    )
    expect(customElements.get('moul-notification-bell')).toBeDefined()
    expect(bell.count).toBe(0)
    expect(bell.max).toBe(99)
    expect(bell.label).toBe('Notifications')
    expect(bell.placement).toBe('bottom-end')
    expect(bell.isOpen).toBe(false)
    expect(isShown(bell)).toBe(false)
  })

  it('shows the count on a badge, capped by `max`, and hides it at 0', async () => {
    const bell = await mount()
    const badge = part(bell, 'badge')
    expect(badge.tagName).toBe('MOUL-BADGE')
    expect(badge.getAttribute('count')).toBe('3')
    expect(badge.getAttribute('max')).toBe('99')
    expect(badge.getAttribute('aria-hidden')).toBe('true')

    bell.count = 0
    await bell.updateComplete
    expect(part(bell, 'badge')).toBeNull()
  })

  it('forwards the notifications into an animated list, and shows the empty message without them', async () => {
    const bell = await mount()
    const list = part(bell, 'list') as unknown as MoulAnimatedList
    await list.updateComplete
    expect(list.tagName).toBe('MOUL-ANIMATED-LIST')
    expect(list.items.map((el) => el.textContent)).toEqual([
      'Deploy finished',
      'New sign-up',
    ])
    expect(part(bell, 'empty').hidden).toBe(true)

    for (const link of bell.querySelectorAll('a')) link.remove()
    await bell.updateComplete
    expect(part(bell, 'empty').hidden).toBe(false)
    expect(part(bell, 'empty').textContent?.trim()).toBe('No notifications')
  })

  it('removeItem() takes a notification out through the list', async () => {
    const bell = await mount()
    const [first, second] = Array.from(bell.querySelectorAll('a'))
    await bell.removeItem(first)
    expect(first.isConnected).toBe(false)
    const list = part(bell, 'list') as unknown as MoulAnimatedList
    expect(list.items).toEqual([second])
  })

  it('shows the footer row only when the footer slot has content', async () => {
    const bell = await mount()
    expect(part(bell, 'footer').hidden).toBe(true)
    const link = document.createElement('a')
    link.slot = 'footer'
    link.href = '#all'
    link.textContent = 'View all'
    bell.append(link)
    await Promise.resolve()
    await bell.updateComplete
    expect(part(bell, 'footer').hidden).toBe(false)
  })

  it('swings the bell when the count goes up, not when it goes down', async () => {
    motion = mockReducedMotion(false)
    const bell = await mount()
    const icon = part(bell, 'icon')
    expect(icon.hasAttribute('data-swinging')).toBe(false)
    bell.count = 4
    await bell.updateComplete
    expect(icon.hasAttribute('data-swinging')).toBe(true)
    await wait(850)
    expect(icon.hasAttribute('data-swinging')).toBe(false)
    bell.count = 1
    await bell.updateComplete
    expect(icon.hasAttribute('data-swinging')).toBe(false)
  })

  it('opens below the bell, aligned to its end, and follows `placement`', async () => {
    const bell = await mount()
    const button = part(bell, 'button')
    button.getBoundingClientRect = () =>
      ({
        top: 20,
        bottom: 60,
        left: 500,
        right: 540,
        width: 40,
        height: 40,
      }) as DOMRect
    const popover = part(bell, 'popover')
    Object.defineProperty(popover, 'offsetWidth', { get: () => 300 })
    Object.defineProperty(popover, 'offsetHeight', { get: () => 200 })

    await bell.setOpen(true)
    expect(popover.style.top).toBe('68px')
    expect(popover.style.left).toBe('240px')
    expect(popover.getAttribute('data-side')).toBe('bottom')

    await bell.setOpen(false)
    bell.placement = 'bottom-start'
    await bell.updateComplete
    await bell.setOpen(true)
    expect(popover.style.left).toBe('500px')
  })

  describe('keyboard and screen readers', () => {
    it('names the bell with the label and the unread count', async () => {
      const bell = await mount()
      const button = part(bell, 'button')
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('aria-label')).toBe('Notifications, 3 unread')
      expect(button.getAttribute('aria-haspopup')).toBe('dialog')
      expect(button.getAttribute('aria-expanded')).toBe('false')

      bell.count = 120
      bell.unreadLabel = 'new'
      await bell.updateComplete
      expect(button.getAttribute('aria-label')).toBe('Notifications, 99+ new')
      bell.count = 0
      await bell.updateComplete
      expect(button.getAttribute('aria-label')).toBe('Notifications')
    })

    it('opens a labelled dialog from the bell, moves focus in, and fires openchange', async () => {
      const bell = await mount()
      const changes: boolean[] = []
      bell.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )
      const button = part(bell, 'button')
      button.focus()
      button.click()
      await bell.updateComplete
      await Promise.resolve()

      expect(bell.isOpen).toBe(true)
      expect(isShown(bell)).toBe(true)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      const panel = part(bell, 'panel')
      expect(panel.getAttribute('role')).toBe('dialog')
      expect(panel.getAttribute('aria-label')).toBe('Notifications')
      expect(button.getAttribute('aria-controls')).toBe(panel.id)
      expect(document.activeElement?.textContent).toBe('Mark all read')
      expect(changes).toEqual([true])
    })

    it('closes on Escape and returns focus to the bell', async () => {
      const bell = await mount()
      await bell.setOpen(true)
      const action = bell.querySelector('button') as HTMLButtonElement
      expect(document.activeElement).toBe(action)

      const event = key(action, 'Escape')
      expect(event.defaultPrevented).toBe(true)
      await bell.updateComplete
      expect(bell.isOpen).toBe(false)
      expect(bell.shadowRoot?.activeElement).toBe(part(bell, 'button'))
    })

    it('finds a moul-button in the header as the first focusable element', async () => {
      await import('../Button/Button')
      const bell = await mount(
        `<moul-notification-bell>
          <moul-button slot="header-actions" size="sm">Mark all read</moul-button>
          <p>Deploy finished</p>
        </moul-notification-bell>`,
      )
      const action = bell.querySelector('moul-button') as HTMLElement & {
        updateComplete: Promise<unknown>
      }
      await action.updateComplete
      await bell.setOpen(true)
      expect(document.activeElement).toBe(action)
      expect(action.shadowRoot?.activeElement?.tagName).toBe('BUTTON')
    })

    it('focuses the panel itself when it holds nothing focusable', async () => {
      const bell = await mount(
        '<moul-notification-bell><p>Plain text</p></moul-notification-bell>',
      )
      await bell.setOpen(true)
      expect(bell.shadowRoot?.activeElement).toBe(part(bell, 'panel'))
    })

    it('closes on a click outside, and when focus leaves it', async () => {
      const bell = await mount()
      const outside = document.getElementById('outside') as HTMLButtonElement
      await bell.setOpen(true)
      outside.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
      )
      await bell.updateComplete
      expect(bell.isOpen).toBe(false)

      await bell.setOpen(true)
      // A press on a notification is inside.
      bell
        .querySelector('a')
        ?.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, composed: true }),
        )
      expect(bell.isOpen).toBe(true)

      const links = bell.querySelectorAll('a')
      links[1].dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          composed: true,
          relatedTarget: outside,
        }),
      )
      await bell.updateComplete
      expect(bell.isOpen).toBe(false)
    })

    it('follows `is-open` set directly without firing openchange or taking focus', async () => {
      const bell = await mount()
      let fired = 0
      bell.addEventListener('openchange', () => fired++)
      const outside = document.getElementById('outside') as HTMLButtonElement
      outside.focus()
      bell.isOpen = true
      await bell.updateComplete
      await Promise.resolve()
      expect(isShown(bell)).toBe(true)
      expect(document.activeElement).toBe(outside)
      expect(fired).toBe(0)
    })
  })

  describe('reduced motion', () => {
    it('does not swing, and opens and closes at once', async () => {
      motion = mockReducedMotion(true)
      const bell = await mount()
      bell.count = 5
      await bell.updateComplete
      expect(part(bell, 'icon').hasAttribute('data-swinging')).toBe(false)

      const popover = part(bell, 'popover')
      await bell.setOpen(true)
      expect(popover.style.opacity).toBe('')
      expect(popover.style.transform).toBe('')
      await bell.setOpen(false)
      expect(isShown(bell)).toBe(false)
    })
  })
})
