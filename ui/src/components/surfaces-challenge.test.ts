import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './Alert/Alert'
import './Avatar/Avatar'
import './Avatar/AvatarGroup'
import './Badge/Badge'
import './Card/Card'
import './TagGroup/Tag'
import './TagGroup/TagGroup'

import type { MoulAlert } from './Alert/Alert'
import type { MoulAvatar } from './Avatar/Avatar'
import type { MoulAvatarGroup } from './Avatar/AvatarGroup'
import type { MoulBadge } from './Badge/Badge'
import type { MoulCard } from './Card/Card'
import type { MoulTag } from './TagGroup/Tag'
import type { MoulTagGroup } from './TagGroup/TagGroup'

async function awaitNestedUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const children = Array.from(root.querySelectorAll('*'))
  await Promise.all(
    children.map((child) => {
      if ('updateComplete' in child && (child as LitElement).updateComplete) {
        return (child as LitElement).updateComplete
      }
      return Promise.resolve()
    }),
  )
}

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

async function simulatePress(element: HTMLElement): Promise<void> {
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      button: 0,
      bubbles: true,
      cancelable: true,
    }),
  )
  element.dispatchEvent(
    new PointerEvent('pointerup', {
      button: 0,
      bubbles: true,
      cancelable: true,
    }),
  )
  element.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
  await awaitNestedUpdates(element)
}

async function simulateKey(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {},
): Promise<void> {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  await awaitNestedUpdates(element)
}

describe('Empirical Adversarial Challenge Suite: Surfaces & Feedback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // =========================================================================
  // Challenge 1: MoulAlert Rapid Interactions, Role Consistency & Event Contracts
  // =========================================================================
  describe('Challenge 1: MoulAlert Rapid Interactions, Role Consistency & Event Contracts', () => {
    it('CHAL-ALT-01: Rapid dismissal trigger (burst 10 rapid clicks on dismiss button) fires dismiss events with valid MouseEvent detail', async () => {
      const alert = await mount<MoulAlert>(
        html`<moul-alert tone="warning" title="Warning" is-dismissible></moul-alert>`,
      )
      const closeBtn = alert.shadowRoot?.querySelector(
        '[part="dismiss-button"]',
      ) as HTMLButtonElement
      expect(closeBtn).toBeTruthy()

      const dismissEvents: CustomEvent[] = []
      alert.addEventListener('dismiss', (e) => {
        dismissEvents.push(e as CustomEvent)
      })

      // 10 rapid clicks in immediate succession
      for (let i = 0; i < 10; i++) {
        closeBtn.click()
      }

      await alert.updateComplete
      await new Promise((r) => setTimeout(r, 250))

      // Alert fires dismiss events without throwing
      expect(dismissEvents.length).toBeGreaterThan(0)
      for (const ev of dismissEvents) {
        expect(ev.bubbles).toBe(true)
        expect(ev.composed).toBe(true)
        expect(ev.detail.originalEvent).toBeInstanceOf(MouseEvent)
      }
    })

    it('CHAL-ALT-02: 100 rapid tone attribute mutations strictly maintain role="alert" for error/warning and role="status" for others', async () => {
      const alert = await mount<MoulAlert>(
        html`<moul-alert tone="error" title="Critical Alert"></moul-alert>`,
      )
      expect(alert.getAttribute('role')).toBe('alert')

      const toneCycle = [
        'error',
        'warning',
        'primary',
        'accent',
        'success',
        'invalid-tone',
      ] as const

      for (let i = 0; i < 100; i++) {
        const nextTone = toneCycle[i % toneCycle.length]
        alert.tone = nextTone as any
      }

      await alert.updateComplete

      // 99 % 6 = 3 -> toneCycle[3] is 'accent'
      expect(alert.tone).toBe('accent')
      expect(alert.getAttribute('role')).toBe('status')

      // Switch to error
      alert.tone = 'error'
      await alert.updateComplete
      expect(alert.getAttribute('role')).toBe('alert')

      // Switch to warning
      alert.tone = 'warning'
      await alert.updateComplete
      expect(alert.getAttribute('role')).toBe('alert')

      // Switch to primary
      alert.tone = 'primary'
      await alert.updateComplete
      expect(alert.getAttribute('role')).toBe('status')

      // Switch to invalid
      alert.tone = 'nonexistent-tone' as any
      await alert.updateComplete
      expect(alert.tone).toBe('primary')
      expect(alert.getAttribute('role')).toBe('status')
    })

    it('CHAL-ALT-03: Dismiss button contract & accessibility attributes', async () => {
      const alert = await mount<MoulAlert>(
        html`<moul-alert tone="error" title="Action Needed" is-dismissible></moul-alert>`,
      )
      const closeBtn = alert.shadowRoot?.querySelector(
        '[part="dismiss-button"]',
      )
      expect(closeBtn).toBeTruthy()
      expect(closeBtn?.getAttribute('aria-label')).toBe('Dismiss alert')
      expect(closeBtn?.getAttribute('class')).toContain('dismiss-button')
      expect(closeBtn?.querySelector('svg')).toBeTruthy()
    })

    it('CHAL-ALT-04: Non-dismissible alert does not render dismiss button, and dynamically adding is-dismissible mounts it', async () => {
      const alert = await mount<MoulAlert>(
        html`<moul-alert tone="primary" title="Static Notice"></moul-alert>`,
      )
      expect(
        alert.shadowRoot?.querySelector('[part="dismiss-button"]'),
      ).toBeNull()

      // Dynamically make it dismissible
      alert.isDismissible = true
      await alert.updateComplete
      expect(
        alert.shadowRoot?.querySelector('[part="dismiss-button"]'),
      ).not.toBeNull()

      // Dynamically revert
      alert.isDismissible = false
      await alert.updateComplete
      expect(
        alert.shadowRoot?.querySelector('[part="dismiss-button"]'),
      ).toBeNull()
    })

    it('CHAL-ALT-05: Fast-check property test across all 25 tone × variant combinations preserves valid role', async () => {
      const tones = [
        'primary',
        'accent',
        'success',
        'warning',
        'error',
      ] as const
      const variants = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const

      fc.assert(
        fc.property(
          fc.constantFrom(...tones),
          fc.constantFrom(...variants),
          fc.string({ maxLength: 50 }),
          (tone, variant, title) => {
            const el = document.createElement('moul-alert') as MoulAlert
            el.tone = tone
            el.variant = variant
            el.title = title
            document.body.appendChild(el)

            const expectedRole =
              tone === 'error' || tone === 'warning' ? 'alert' : 'status'
            expect(el.getAttribute('role')).toBe(expectedRole)
            expect(el.tone).toBe(tone)
            expect(el.variant).toBe(variant)

            document.body.removeChild(el)
          },
        ),
      )
    })
  })

  // =========================================================================
  // Challenge 2: MoulTag & MoulTagGroup High-Volume Removals & Selection Transitions
  // =========================================================================
  describe('Challenge 2: MoulTag & MoulTagGroup High-Volume Removals & Selection Transitions', () => {
    it('CHAL-TAG-01: High-volume 50 tag removals in MoulTagGroup updates selectedKeys and fires 50 distinct remove events', async () => {
      const group = document.createElement('moul-tag-group') as MoulTagGroup
      group.selectionMode = 'multiple'
      group.isRemovable = true
      document.body.appendChild(group)

      const COUNT = 50
      const preselected: string[] = []
      const tags: MoulTag[] = []

      for (let i = 0; i < COUNT; i++) {
        const tag = document.createElement('moul-tag') as MoulTag
        tag.key = `tag-${i}`
        tag.textContent = `Tag ${i}`
        tag.isRemovable = true
        if (i < 25) {
          preselected.push(`tag-${i}`)
        }
        group.appendChild(tag)
        tags.push(tag)
      }

      group.selectedKeys = [...preselected]
      await awaitNestedUpdates(group)

      expect(group.selectedKeys.length).toBe(25)

      const removedKeys: string[] = []
      group.addEventListener('remove', (e) => {
        removedKeys.push((e as CustomEvent).detail.key)
      })

      // Sequentially trigger removal on all 50 tags
      for (const tag of tags) {
        const removeBtn = tag.shadowRoot?.querySelector(
          '[part="remove-button"]',
        ) as HTMLButtonElement
        expect(removeBtn).toBeTruthy()
        removeBtn.click()
      }

      await awaitNestedUpdates(group)
      await new Promise((r) => setTimeout(r, 200))

      // 50 remove events received
      expect(removedKeys.length).toBe(50)
      expect(removedKeys[0]).toBe('tag-0')
      expect(removedKeys[49]).toBe('tag-49')

      // All preselected tags removed from selectedKeys
      expect(group.selectedKeys).toEqual([])
    })

    it('CHAL-TAG-02: Selection mode transitions from multiple to single to none', async () => {
      const group = await mount<MoulTagGroup>(html`
        <moul-tag-group selection-mode="multiple" label="Filters">
          <moul-tag key="alpha">Alpha</moul-tag>
          <moul-tag key="beta">Beta</moul-tag>
          <moul-tag key="gamma">Gamma</moul-tag>
        </moul-tag-group>
      `)
      expect(group.getAttribute('role')).toBe('listbox')

      const tags = Array.from(group.querySelectorAll('moul-tag'))
      expect(tags.length).toBe(3)

      let lastSelectedKeys: string[] = []
      group.addEventListener('selectionchange', (e) => {
        lastSelectedKeys = (e as CustomEvent).detail.selectedKeys
      })

      // Multiple selection: select alpha and beta
      tags[0].click()
      await group.updateComplete
      tags[1].click()
      await group.updateComplete
      expect(lastSelectedKeys).toEqual(['alpha', 'beta'])
      expect(tags[0].isSelected).toBe(true)
      expect(tags[1].isSelected).toBe(true)

      // Transition to single selection mode
      group.selectionMode = 'single'
      await group.updateComplete
      expect(group.getAttribute('role')).toBe('listbox')

      // Click gamma in single mode -> replaces selection with only gamma
      tags[2].click()
      await group.updateComplete
      expect(lastSelectedKeys).toEqual(['gamma'])
      expect(tags[0].isSelected).toBe(false)
      expect(tags[1].isSelected).toBe(false)
      expect(tags[2].isSelected).toBe(true)

      // Click gamma again in single mode -> deselects
      tags[2].click()
      await group.updateComplete
      expect(lastSelectedKeys).toEqual([])
      expect(tags[2].isSelected).toBe(false)

      // Transition to none mode
      group.selectionMode = 'none'
      await group.updateComplete
      expect(group.getAttribute('role')).toBe('group')

      // Clicks in none mode do not trigger selection change
      let noneSelectionFired = false
      group.addEventListener('selectionchange', () => {
        noneSelectionFired = true
      })
      tags[0].click()
      await group.updateComplete
      expect(noneSelectionFired).toBe(false)
      expect(tags[0].isSelected).toBe(false)
    })

    it('CHAL-TAG-03: Remove button click isolates event: stops propagation and does NOT fire press event', async () => {
      const tag = await mount<MoulTag>(
        html`<moul-tag key="isolated" is-removable>Isolated Tag</moul-tag>`,
      )
      const removeBtn = tag.shadowRoot?.querySelector(
        '[part="remove-button"]',
      ) as HTMLButtonElement
      expect(removeBtn).toBeTruthy()

      let pressFired = false
      let removeFired = false

      tag.addEventListener('press', () => {
        pressFired = true
      })
      tag.addEventListener('remove', () => {
        removeFired = true
      })

      removeBtn.click()
      await tag.updateComplete
      await new Promise((r) => setTimeout(r, 160))

      expect(removeFired).toBe(true)
      expect(pressFired).toBe(false)
      expect(tag.isSelected).toBe(false)
    })

    it('CHAL-TAG-04: Disabled tag (is-disabled=true) suppresses press events and click events', async () => {
      const tag = await mount<MoulTag>(
        html`<moul-tag key="disabled-tag" is-disabled is-removable>Disabled</moul-tag>`,
      )

      let pressFired = false
      tag.addEventListener('press', () => {
        pressFired = true
      })

      tag.click()
      await simulatePress(tag)
      expect(pressFired).toBe(false)
    })

    it('CHAL-TAG-05: Group is-removable attribute propagates isRemovable=true to slotted tags', async () => {
      const group = await mount<MoulTagGroup>(html`
        <moul-tag-group is-removable>
          <moul-tag key="child-1">Child 1</moul-tag>
          <moul-tag key="child-2">Child 2</moul-tag>
        </moul-tag-group>
      `)

      const children = Array.from(group.querySelectorAll('moul-tag'))
      for (const child of children) {
        expect(child.isRemovable).toBe(true)
        expect(
          child.shadowRoot?.querySelector('[part="remove-button"]'),
        ).not.toBeNull()
      }
    })

    it('CHAL-TAG-06: Tag with missing key does not break group selection handling', async () => {
      const group = await mount<MoulTagGroup>(html`
        <moul-tag-group selection-mode="single">
          <moul-tag id="no-key">No Key</moul-tag>
          <moul-tag key="with-key">With Key</moul-tag>
        </moul-tag-group>
      `)

      const noKeyTag = group.querySelector<MoulTag>('#no-key')!
      noKeyTag.click()
      await group.updateComplete

      // Since tag has no key, selectedKeys should remain empty
      expect(group.selectedKeys).toEqual([])
    })
  })

  // =========================================================================
  // Challenge 3: MoulAvatar & MoulAvatarGroup Initials, Unicode, Error Recovery & Boundaries
  // =========================================================================
  describe('Challenge 3: MoulAvatar & MoulAvatarGroup Initials, Unicode, Error Recovery & Boundaries', () => {
    it('CHAL-AVT-01: Whitespace-only name string does not crash and falls back safely to SVG avatar', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const avatar = document.createElement('moul-avatar') as MoulAvatar
      avatar.name = '   '
      container.appendChild(avatar)

      await expect(avatar.updateComplete).resolves.toBe(true)
      expect(avatar.getAttribute('role')).toBe('img')
      expect(avatar.getAttribute('aria-label')).toBe('Avatar')
      expect(avatar.shadowRoot?.querySelector('[part="fallback"]')).toBeTruthy()
      expect(avatar.shadowRoot?.querySelector('[part="initials"]')).toBeNull()
    })

    it('CHAL-AVT-02: Empty name string fallback renders SVG icon and sets default aria-label="Avatar"', async () => {
      const avatar = await mount<MoulAvatar>(
        html`<moul-avatar name=""></moul-avatar>`,
      )
      expect(avatar.getAttribute('role')).toBe('img')
      expect(avatar.getAttribute('aria-label')).toBe('Avatar')
      expect(avatar.shadowRoot?.querySelector('[part="fallback"]')).toBeTruthy()
      expect(avatar.shadowRoot?.querySelector('[part="initials"]')).toBeNull()
    })

    it('CHAL-AVT-03: Single character names extract single uppercase initial', async () => {
      const av1 = await mount<MoulAvatar>(
        html`<moul-avatar name="k"></moul-avatar>`,
      )
      expect(
        av1.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('K')

      const av2 = await mount<MoulAvatar>(
        html`<moul-avatar name="9"></moul-avatar>`,
      )
      expect(
        av2.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('9')
    })

    it('CHAL-AVT-04: Multi-word names and irregular whitespace derive first two uppercase initials', async () => {
      const av = await mount<MoulAvatar>(
        html`<moul-avatar name="   ada   lovelace   byron  "></moul-avatar>`,
      )
      expect(
        av.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('AL')
    })

    it('CHAL-AVT-05: Non-ASCII and accented names extract initials correctly', async () => {
      const av1 = await mount<MoulAvatar>(
        html`<moul-avatar name="Élodie Dupond"></moul-avatar>`,
      )
      expect(
        av1.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('ÉD')

      const av2 = await mount<MoulAvatar>(
        html`<moul-avatar name="Øyvind Ås"></moul-avatar>`,
      )
      expect(
        av2.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('ØÅ')
    })

    it('CHAL-AVT-06: Unicode surrogate pairs render without uncaught exception', async () => {
      const av = await mount<MoulAvatar>(
        html`<moul-avatar name="🚀 Rocket"></moul-avatar>`,
      )
      expect(av.shadowRoot?.querySelector('[part="initials"]')).toBeTruthy()
    })

    it('CHAL-AVT-07: Image error recovery succeeds on src change with hasImageError reset in lifecycle', async () => {
      const avatar = await mount<MoulAvatar>(
        html`<moul-avatar src="https://broken.invalid/photo.jpg" name="Grace Hopper"></moul-avatar>`,
      )
      const img = avatar.shadowRoot?.querySelector('img')
      expect(img).toBeTruthy()

      let errorFired = false
      avatar.addEventListener('error', () => {
        errorFired = true
      })

      // Simulate image load error
      img?.dispatchEvent(new Event('error'))
      await avatar.updateComplete

      expect(errorFired).toBe(true)
      expect(avatar.shadowRoot?.querySelector('img')).toBeNull()
      expect(
        avatar.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('GH')

      // When src updates, hasImageError is cleared and new img renders immediately
      avatar.src = 'https://valid.example/new-photo.jpg'
      await avatar.updateComplete

      expect(avatar.shadowRoot?.querySelector('img')).toBeTruthy()
      expect(avatar.shadowRoot?.querySelector('img')?.getAttribute('src')).toBe(
        'https://valid.example/new-photo.jpg',
      )
    })

    it('CHAL-AVG-01: AvatarGroup extreme boundary max=0 hides all avatars and renders +N overflow badge', async () => {
      const group = await mount<MoulAvatarGroup>(html`
        <moul-avatar-group max="0">
          <moul-avatar name="One"></moul-avatar>
          <moul-avatar name="Two"></moul-avatar>
          <moul-avatar name="Three"></moul-avatar>
        </moul-avatar-group>
      `)

      const avatars = Array.from(group.querySelectorAll('moul-avatar'))
      for (const av of avatars) {
        expect(av.style.display).toBe('none')
      }

      const overflow = group.shadowRoot?.querySelector('.overflow-badge')
      expect(overflow?.textContent).toBe('+3')
    })

    it('CHAL-AVG-02: AvatarGroup boundary max=1 displays exactly 1 avatar and +2 badge', async () => {
      const group = await mount<MoulAvatarGroup>(html`
        <moul-avatar-group max="1">
          <moul-avatar name="One"></moul-avatar>
          <moul-avatar name="Two"></moul-avatar>
          <moul-avatar name="Three"></moul-avatar>
        </moul-avatar-group>
      `)

      const avatars = Array.from(group.querySelectorAll('moul-avatar'))
      expect(avatars[0].style.display).not.toBe('none')
      expect(avatars[1].style.display).toBe('none')
      expect(avatars[2].style.display).toBe('none')

      const overflow = group.shadowRoot?.querySelector('.overflow-badge')
      expect(overflow?.textContent).toBe('+2')
    })

    it('CHAL-AVG-03: AvatarGroup large boundary max=100 displays all avatars with zero overflow badge', async () => {
      const group = await mount<MoulAvatarGroup>(html`
        <moul-avatar-group max="100">
          <moul-avatar name="One"></moul-avatar>
          <moul-avatar name="Two"></moul-avatar>
          <moul-avatar name="Three"></moul-avatar>
        </moul-avatar-group>
      `)

      const avatars = Array.from(group.querySelectorAll('moul-avatar'))
      for (const av of avatars) {
        expect(av.style.display).not.toBe('none')
      }

      const overflow = group.shadowRoot?.querySelector('.overflow-badge')
      expect(overflow).toBeNull()
    })

    it('CHAL-AVG-04: Dynamic DOM addition and removal recalculates avatar group overflow count', async () => {
      const group = await mount<MoulAvatarGroup>(html`
        <moul-avatar-group max="2">
          <moul-avatar name="One"></moul-avatar>
          <moul-avatar name="Two"></moul-avatar>
        </moul-avatar-group>
      `)

      expect(group.shadowRoot?.querySelector('.overflow-badge')).toBeNull()

      // Dynamically add a third avatar
      const av3 = document.createElement('moul-avatar') as MoulAvatar
      av3.name = 'Three'
      group.appendChild(av3)
      await awaitNestedUpdates(group)

      // Slotchange updates group
      group.requestUpdate()
      await awaitNestedUpdates(group)

      expect(
        group.shadowRoot?.querySelector('.overflow-badge')?.textContent,
      ).toBe('+1')
      expect(av3.style.display).toBe('none')

      // Remove third avatar
      group.removeChild(av3)
      await awaitNestedUpdates(group)
      group.requestUpdate()
      await awaitNestedUpdates(group)

      expect(group.shadowRoot?.querySelector('.overflow-badge')).toBeNull()
    })

    it('CHAL-AVG-05: AvatarGroup size cascade correctly cascades to slotted MoulAvatar without explicit size', async () => {
      const group = await mount<MoulAvatarGroup>(html`
        <moul-avatar-group size="lg">
          <moul-avatar id="av-inherited" name="User"></moul-avatar>
          <moul-avatar id="av-explicit" size="xs" name="Special"></moul-avatar>
        </moul-avatar-group>
      `)

      const inherited = group.querySelector<MoulAvatar>('#av-inherited')!
      const explicit = group.querySelector<MoulAvatar>('#av-explicit')!

      expect(inherited.getAttribute('size')).toBe('lg')
      expect(inherited.size).toBe('lg')
      expect(explicit.getAttribute('size')).toBe('xs')
      expect(explicit.size).toBe('xs')
    })
  })

  // =========================================================================
  // Challenge 4: MoulCard Interactive States & Keyboard Interaction
  // =========================================================================
  describe('Challenge 4: MoulCard Interactive States & Keyboard Interaction', () => {
    it('CHAL-CRD-01: Dynamic isInteractive toggling reflects role="button" and tabindex="0" accurately', async () => {
      const card = await mount<MoulCard>(html`<moul-card>Content</moul-card>`)
      expect(card.hasAttribute('role')).toBe(false)
      expect(card.hasAttribute('tabindex')).toBe(false)

      // Enable interactive
      card.isInteractive = true
      await card.updateComplete
      expect(card.getAttribute('role')).toBe('button')
      expect(card.getAttribute('tabindex')).toBe('0')

      // Disable interactive
      card.isInteractive = false
      await card.updateComplete
      expect(card.hasAttribute('role')).toBe(false)
      expect(card.hasAttribute('tabindex')).toBe(false)
    })

    it('CHAL-CRD-02: Non-interactive card ignores pointer and keyboard triggers (0 press events)', async () => {
      const card = await mount<MoulCard>(
        html`<moul-card>Static Card</moul-card>`,
      )

      let pressCount = 0
      card.addEventListener('press', () => {
        pressCount++
      })

      card.click()
      await simulatePress(card)
      await simulateKey(card, 'Enter')
      await simulateKey(card, ' ')

      expect(pressCount).toBe(0)
    })

    it('CHAL-CRD-03: Interactive card keyboard triggers: Space and Enter keyup fire press event; repeat=true keydown ignored', async () => {
      const card = await mount<MoulCard>(
        html`<moul-card is-interactive>Interactive Card</moul-card>`,
      )

      let pressCount = 0
      card.addEventListener('press', () => {
        pressCount++
      })

      // Space key
      await simulateKey(card, ' ')
      expect(pressCount).toBe(1)

      // Enter key
      await simulateKey(card, 'Enter')
      expect(pressCount).toBe(2)

      // Key repeat=true should not fire extra press events
      card.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          repeat: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      expect(pressCount).toBe(2)

      // Unrelated keys (Escape, ArrowDown) do not trigger press
      await simulateKey(card, 'Escape')
      await simulateKey(card, 'ArrowDown')
      expect(pressCount).toBe(2)
    })

    it('CHAL-CRD-04: Rapid synthetic click burst (50 clicks) on interactive card fires 50 press events', async () => {
      const card = await mount<MoulCard>(
        html`<moul-card is-interactive>Clickable Card</moul-card>`,
      )

      let pressCount = 0
      card.addEventListener('press', () => {
        pressCount++
      })

      for (let i = 0; i < 50; i++) {
        card.click()
      }

      await card.updateComplete
      expect(pressCount).toBe(50)
    })

    it('CHAL-CRD-05: Slotted interactive elements: clicks inside card slot bubble up to card press handler', async () => {
      const card = await mount<MoulCard>(html`
        <moul-card is-interactive>
          <div slot="body">
            <button id="slotted-btn">Click Inside</button>
          </div>
        </moul-card>
      `)

      let cardPressCount = 0
      card.addEventListener('press', () => {
        cardPressCount++
      })

      const innerBtn = card.querySelector('#slotted-btn') as HTMLButtonElement
      innerBtn.click()

      await card.updateComplete
      expect(cardPressCount).toBe(1)
    })
  })

  // =========================================================================
  // Challenge 5: MoulBadge Resilience, Tone/Variant Normalization & Slot Edge Cases
  // =========================================================================
  describe('Challenge 5: MoulBadge Resilience, Tone/Variant Normalization & Slot Edge Cases', () => {
    it('CHAL-BDG-01: Rapid 50-cycle tone & variant mutations leave badge in consistent state matching final properties', async () => {
      const badge = await mount<MoulBadge>(
        html`<moul-badge>Status</moul-badge>`,
      )

      const tones = [
        'primary',
        'accent',
        'success',
        'warning',
        'error',
      ] as const
      const variants = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const

      for (let i = 0; i < 50; i++) {
        badge.tone = tones[i % tones.length]
        badge.variant = variants[i % variants.length]
      }

      await badge.updateComplete

      // 49 % 5 = 4 -> tone: error, variant: glass
      expect(badge.tone).toBe('error')
      expect(badge.variant).toBe('glass')
      expect(badge.getAttribute('tone')).toBe('error')
      expect(badge.getAttribute('variant')).toBe('glass')
    })

    it('CHAL-BDG-02: Invalid tone and variant values normalize safely to defaults without throwing', async () => {
      const badge = await mount<MoulBadge>(html`<moul-badge>Item</moul-badge>`)

      badge.tone = 'completely-bogus' as any
      badge.variant = 'unsupported-variant' as any
      await badge.updateComplete

      expect(badge.tone).toBe('primary')
      expect(badge.variant).toBe('flat')
    })

    it('CHAL-BDG-03: Slotted content edge cases (empty slots, whitespace only, large content)', async () => {
      const badge = await mount<MoulBadge>(html`
        <moul-badge>
          <span slot="prefix"></span>
          <span slot="suffix"></span>
        </moul-badge>
      `)

      expect(badge.shadowRoot?.querySelector('[part="base"]')).toBeTruthy()
      expect(
        badge.shadowRoot?.querySelector('slot[name="prefix"]'),
      ).toBeTruthy()
      expect(
        badge.shadowRoot?.querySelector('slot[name="suffix"]'),
      ).toBeTruthy()
    })

    it('CHAL-BDG-04: MoulBadge supports isDot property and is-dot attribute with compact dot presentation', async () => {
      const badge = await mount<MoulBadge>(
        html`<moul-badge is-dot size="sm" tone="success"></moul-badge>`,
      )
      expect('isDot' in badge).toBe(true)
      expect(badge.isDot).toBe(true)
      expect(badge.hasAttribute('is-dot')).toBe(true)
      expect(badge.getAttribute('size')).toBe('sm')
      expect(badge.getAttribute('tone')).toBe('success')

      badge.isDot = false
      await badge.updateComplete
      expect(badge.isDot).toBe(false)
      expect(badge.hasAttribute('is-dot')).toBe(false)
    })
  })
})
