import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './Typography/Typography'
import './Kbd/Kbd'
import './Separator/Separator'
import './Spinner/Spinner'
import './Skeleton/Skeleton'
import './Badge/Badge'
import './Card/Card'
import './EmptyState/EmptyState'
import './Alert/Alert'
import './ProgressBar/ProgressBar'
import './Avatar/Avatar'
import './Avatar/AvatarGroup'
import './TagGroup/Tag'
import './TagGroup/TagGroup'
import './Table/Table'
import './Toast/Toast'
import './Toast/ToastQueue'

import type { MoulAlert } from './Alert/Alert'
import type { MoulAvatar } from './Avatar/Avatar'
import type { MoulAvatarGroup } from './Avatar/AvatarGroup'
import type { MoulBadge } from './Badge/Badge'
import type { MoulCard } from './Card/Card'
import type { MoulEmptyState } from './EmptyState/EmptyState'
import type { MoulKbd } from './Kbd/Kbd'
import type { MoulProgressBar } from './ProgressBar/ProgressBar'
import type { MoulSeparator } from './Separator/Separator'
import type { MoulSkeleton } from './Skeleton/Skeleton'
import type { MoulSpinner } from './Spinner/Spinner'
import type { MoulTable } from './Table/Table'
import type { MoulTag } from './TagGroup/Tag'
import type { MoulTagGroup } from './TagGroup/TagGroup'
import type { MoulToast } from './Toast/Toast'
import { toastQueue } from './Toast/ToastQueue'
import type { MoulTypography } from './Typography/Typography'

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

describe('Phase 5: Surface & Feedback Components', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // 1. MoulTypography
  describe('MoulTypography (`moul-typography`)', () => {
    it('SURF-TYP-01: Semantic tag mapping for variants', async () => {
      const heading = await mount<MoulTypography>(
        html`<moul-typography variant="h1">Heading 1</moul-typography>`,
      )
      expect(heading.shadowRoot?.querySelector('h1')).toBeTruthy()

      heading.variant = 'h2'
      await heading.updateComplete
      expect(heading.shadowRoot?.querySelector('h2')).toBeTruthy()

      heading.variant = 'h3'
      await heading.updateComplete
      expect(heading.shadowRoot?.querySelector('h3')).toBeTruthy()

      heading.variant = 'caption'
      await heading.updateComplete
      expect(heading.shadowRoot?.querySelector('span')).toBeTruthy()

      heading.variant = 'code'
      await heading.updateComplete
      expect(heading.shadowRoot?.querySelector('code')).toBeTruthy()

      heading.variant = 'body'
      await heading.updateComplete
      expect(heading.shadowRoot?.querySelector('p')).toBeTruthy()
    })

    it('SURF-TYP-02: Tone attribute reflection', async () => {
      const el = await mount<MoulTypography>(
        html`<moul-typography tone="primary">Primary text</moul-typography>`,
      )
      expect(el.getAttribute('tone')).toBe('primary')

      el.tone = 'error'
      await el.updateComplete
      expect(el.getAttribute('tone')).toBe('error')
    })
  })

  // 2. MoulKbd
  describe('MoulKbd (`moul-kbd`)', () => {
    it('SURF-KBD-01: Keyboard notation with slot fallback and keys splitting', async () => {
      const fallbackKbd = await mount<MoulKbd>(html`<moul-kbd>Ctrl</moul-kbd>`)
      expect(fallbackKbd.shadowRoot?.querySelector('kbd')).toBeTruthy()

      const multiKbd = await mount<MoulKbd>(
        html`<moul-kbd keys="⌘+K"></moul-kbd>`,
      )
      const kbds = multiKbd.shadowRoot?.querySelectorAll('kbd')
      expect(kbds?.length).toBe(2)
      expect(kbds?.[0].textContent?.trim()).toBe('⌘')
      expect(kbds?.[1].textContent?.trim()).toBe('K')

      const group = multiKbd.shadowRoot?.querySelector('[role="group"]')
      expect(group?.getAttribute('aria-label')).toBe('Command plus K')
    })
  })

  // 3. MoulSeparator
  describe('MoulSeparator (`moul-separator`)', () => {
    it('SURF-SEP-01: ARIA separator role and orientation', async () => {
      const sep = await mount<MoulSeparator>(
        html`<moul-separator></moul-separator>`,
      )
      const hr = sep.shadowRoot?.querySelector('hr')
      expect(hr?.getAttribute('role')).toBe('separator')
      expect(hr?.getAttribute('aria-orientation')).toBe('horizontal')

      sep.orientation = 'vertical'
      await sep.updateComplete
      expect(hr?.getAttribute('aria-orientation')).toBe('vertical')
    })
  })

  // 4. MoulSpinner
  describe('MoulSpinner (`moul-spinner`)', () => {
    it('SURF-SPN-01: Accessible loading status and SVG rendering', async () => {
      const spinner = await mount<MoulSpinner>(
        html`<moul-spinner size="lg" label="Saving"></moul-spinner>`,
      )
      const base = spinner.shadowRoot?.querySelector('[part="base"]')
      expect(base?.getAttribute('role')).toBe('status')
      expect(base?.getAttribute('aria-label')).toBe('Saving')
      expect(spinner.shadowRoot?.querySelector('svg')).toBeTruthy()
      expect(spinner.getAttribute('size')).toBe('lg')
    })
  })

  // 5. MoulSkeleton
  describe('MoulSkeleton (`moul-skeleton`)', () => {
    it('SURF-SKL-01: Shape, animation variant, and dimension styling', async () => {
      const skeleton = await mount<MoulSkeleton>(
        html`<moul-skeleton shape="circle" variant="wave" width="3rem" height="3rem"></moul-skeleton>`,
      )
      expect(skeleton.getAttribute('aria-hidden')).toBe('true')
      expect(skeleton.getAttribute('shape')).toBe('circle')
      expect(skeleton.getAttribute('variant')).toBe('wave')

      const base = skeleton.shadowRoot?.querySelector(
        '[part="base"]',
      ) as HTMLElement
      expect(base).toBeTruthy()
      expect(base.style.width).toBe('3rem')
      expect(base.style.height).toBe('3rem')
    })
  })

  // 6. MoulBadge
  describe('MoulBadge (`moul-badge`)', () => {
    it('SURF-BDG-01: Tone × Variant combination matrix & size', async () => {
      const tones = [
        'primary',
        'accent',
        'success',
        'warning',
        'error',
      ] as const
      const variants = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const
      const sizes = ['sm', 'md', 'lg'] as const

      fc.assert(
        fc.property(
          fc.constantFrom(...tones),
          fc.constantFrom(...variants),
          fc.constantFrom(...sizes),
          (tone, variant, size) => {
            const badge = document.createElement('moul-badge') as MoulBadge
            badge.tone = tone
            badge.variant = variant
            badge.size = size
            expect(badge.tone).toBe(tone)
            expect(badge.variant).toBe(variant)
            expect(badge.size).toBe(size)
          },
        ),
      )
    })

    it('SURF-BDG-02: Slots projection for prefix, default, and suffix', async () => {
      const badge = await mount<MoulBadge>(
        html`
          <moul-badge tone="success">
            <span slot="prefix">●</span>
            Active
            <span slot="suffix">✓</span>
          </moul-badge>
        `,
      )
      expect(
        badge.shadowRoot?.querySelector('slot[name="prefix"]'),
      ).toBeTruthy()
      expect(badge.shadowRoot?.querySelector('slot:not([name])')).toBeTruthy()
      expect(
        badge.shadowRoot?.querySelector('slot[name="suffix"]'),
      ).toBeTruthy()
    })

    it('SURF-BDG-03: Dot badge presentation with is-dot attribute and isDot property', async () => {
      const dotBadge = await mount<MoulBadge>(
        html`<moul-badge is-dot tone="error" size="sm"></moul-badge>`,
      )
      expect(dotBadge.isDot).toBe(true)
      expect(dotBadge.hasAttribute('is-dot')).toBe(true)
      expect(dotBadge.getAttribute('tone')).toBe('error')
      expect(dotBadge.getAttribute('size')).toBe('sm')

      dotBadge.isDot = false
      await dotBadge.updateComplete
      expect(dotBadge.hasAttribute('is-dot')).toBe(false)
    })
  })

  // 7. MoulCard
  describe('MoulCard (`moul-card`)', () => {
    it('SURF-CRD-01: Slots projection for header, body, and footer', async () => {
      const card = await mount<MoulCard>(
        html`
          <moul-card>
            <div slot="header">Card Title</div>
            <div slot="body">Card Body</div>
            <div slot="footer">Card Footer</div>
          </moul-card>
        `,
      )
      expect(card.shadowRoot?.querySelector('slot[name="header"]')).toBeTruthy()
      expect(card.shadowRoot?.querySelector('slot[name="body"]')).toBeTruthy()
      expect(card.shadowRoot?.querySelector('slot[name="footer"]')).toBeTruthy()
      expect(card.hasAttribute('role')).toBe(false)
    })

    it('SURF-CRD-02: Interactive card button role and press event', async () => {
      const card = await mount<MoulCard>(
        html`<moul-card is-interactive>Clickable Card</moul-card>`,
      )
      expect(card.getAttribute('role')).toBe('button')
      expect(card.getAttribute('tabindex')).toBe('0')

      let pressFired = false
      card.addEventListener('press', () => {
        pressFired = true
      })

      await simulatePress(card)
      expect(pressFired).toBe(true)
    })
  })

  // 8. MoulEmptyState
  describe('MoulEmptyState (`moul-empty-state`)', () => {
    it('SURF-EMP-01: Slot layout, alignment, and status role', async () => {
      const emptyState = await mount<MoulEmptyState>(
        html`
          <moul-empty-state align="start" size="lg">
            <div slot="icon">🔍</div>
            <div slot="title">No Results Found</div>
            <div slot="description">Try adjusting your filters</div>
            <div slot="actions"><button>Reset</button></div>
          </moul-empty-state>
        `,
      )
      expect(emptyState.getAttribute('role')).toBe('status')
      expect(emptyState.getAttribute('align')).toBe('start')
      expect(emptyState.getAttribute('size')).toBe('lg')
      expect(
        emptyState.shadowRoot?.querySelector('[part="icon"] slot[name="icon"]'),
      ).toBeTruthy()
      expect(
        emptyState.shadowRoot?.querySelector(
          '[part="title"] slot[name="title"]',
        ),
      ).toBeTruthy()
      expect(
        emptyState.shadowRoot?.querySelector('[part="description"]'),
      ).toBeTruthy()
      expect(
        emptyState.shadowRoot?.querySelector(
          '[part="actions"] slot[name="actions"]',
        ),
      ).toBeTruthy()
    })
  })

  // 9. MoulAlert
  describe('MoulAlert (`moul-alert`)', () => {
    it('SURF-ALT-01: Alert role for error/warning and status role for info', async () => {
      const errorAlert = await mount<MoulAlert>(
        html`<moul-alert tone="error" title="Critical Failure"></moul-alert>`,
      )
      expect(errorAlert.getAttribute('role')).toBe('alert')

      const infoAlert = await mount<MoulAlert>(
        html`<moul-alert tone="primary" title="Information"></moul-alert>`,
      )
      expect(infoAlert.getAttribute('role')).toBe('status')
    })

    it('SURF-ALT-02: Dismissible alert triggers dismiss event on button click', async () => {
      const alert = await mount<MoulAlert>(
        html`<moul-alert tone="warning" title="Warning" is-dismissible></moul-alert>`,
      )
      const closeBtn = alert.shadowRoot?.querySelector(
        '[part="dismiss-button"]',
      ) as HTMLButtonElement
      expect(closeBtn).toBeTruthy()
      expect(closeBtn.getAttribute('aria-label')).toBe('Dismiss alert')

      let dismissFired = false
      alert.addEventListener('dismiss', () => {
        dismissFired = true
      })

      closeBtn.click()
      await alert.updateComplete
      await new Promise((r) => setTimeout(r, 200))

      expect(dismissFired).toBe(true)
    })
  })

  // 10. MoulProgressBar
  describe('MoulProgressBar (`moul-progress-bar`)', () => {
    it('SURF-PRG-01: ARIA progress role, bounds, and clamping', async () => {
      const pb = await mount<MoulProgressBar>(
        html`<moul-progress-bar value="45" min="0" max="100"></moul-progress-bar>`,
      )
      expect(pb.getAttribute('role')).toBe('progressbar')
      expect(pb.getAttribute('aria-valuenow')).toBe('45')
      expect(pb.getAttribute('aria-valuemin')).toBe('0')
      expect(pb.getAttribute('aria-valuemax')).toBe('100')

      const fill = pb.shadowRoot?.querySelector('[part="fill"]') as HTMLElement
      expect(fill.style.width).toBe('45%')

      // Clamping below min
      pb.value = -20
      await pb.updateComplete
      expect(pb.getAttribute('aria-valuenow')).toBe('0')
      expect(pb.clampedValue).toBe(0)

      // Clamping above max
      pb.value = 150
      await pb.updateComplete
      expect(pb.getAttribute('aria-valuenow')).toBe('100')
      expect(pb.clampedValue).toBe(100)
    })

    it('SURF-PRG-02: Indeterminate progress removes aria-valuenow', async () => {
      const pb = await mount<MoulProgressBar>(
        html`<moul-progress-bar is-indeterminate></moul-progress-bar>`,
      )
      expect(pb.hasAttribute('aria-valuenow')).toBe(false)
    })
  })

  // 11. MoulAvatar & MoulAvatarGroup
  describe('MoulAvatar (`moul-avatar`)', () => {
    it('SURF-AVT-01: Initials fallback derivation from name', async () => {
      const singleWord = await mount<MoulAvatar>(
        html`<moul-avatar name="Phearak"></moul-avatar>`,
      )
      expect(singleWord.getAttribute('role')).toBe('img')
      expect(singleWord.getAttribute('aria-label')).toBe('Phearak')
      expect(
        singleWord.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('P')

      const twoWords = await mount<MoulAvatar>(
        html`<moul-avatar name="John Doe"></moul-avatar>`,
      )
      expect(
        twoWords.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('JD')
    })

    it('SURF-AVT-02: Image error dispatches error event and shows initials fallback', async () => {
      const avatar = await mount<MoulAvatar>(
        html`<moul-avatar src="https://invalid.example/avatar.png" name="Alice Smith"></moul-avatar>`,
      )
      const img = avatar.shadowRoot?.querySelector('img')
      expect(img).toBeTruthy()

      let errorFired = false
      avatar.addEventListener('error', () => {
        errorFired = true
      })

      img?.dispatchEvent(new Event('error'))
      await avatar.updateComplete

      expect(errorFired).toBe(true)
      expect(
        avatar.shadowRoot?.querySelector('[part="initials"]')?.textContent,
      ).toBe('AS')
    })

    it('SURF-AVT-03: Empty and whitespace name strings fall back safely to SVG icon', async () => {
      const whitespaceAvatar = await mount<MoulAvatar>(
        html`<moul-avatar name="   "></moul-avatar>`,
      )
      expect(whitespaceAvatar.getAttribute('role')).toBe('img')
      expect(whitespaceAvatar.getAttribute('aria-label')).toBe('Avatar')
      expect(
        whitespaceAvatar.shadowRoot?.querySelector('[part="fallback"]'),
      ).toBeTruthy()
      expect(
        whitespaceAvatar.shadowRoot?.querySelector('[part="initials"]'),
      ).toBeNull()
    })

    it('SURF-AVT-04: Image error recovery restores image on src update', async () => {
      const avatar = await mount<MoulAvatar>(
        html`<moul-avatar src="https://broken.invalid/img.png" name="Bob Ross"></moul-avatar>`,
      )
      const img = avatar.shadowRoot?.querySelector('img')
      img?.dispatchEvent(new Event('error'))
      await avatar.updateComplete

      expect(avatar.shadowRoot?.querySelector('img')).toBeNull()

      avatar.src = 'https://valid.example/bob.png'
      await avatar.updateComplete

      expect(avatar.shadowRoot?.querySelector('img')).toBeTruthy()
      expect(avatar.shadowRoot?.querySelector('img')?.getAttribute('src')).toBe(
        'https://valid.example/bob.png',
      )
    })
  })

  describe('MoulAvatarGroup (`moul-avatar-group`)', () => {
    it('SURF-AVG-01: Overflow counter badge when avatars exceed max', async () => {
      const group = await mount<MoulAvatarGroup>(
        html`
          <moul-avatar-group max="3">
            <moul-avatar name="User One"></moul-avatar>
            <moul-avatar name="User Two"></moul-avatar>
            <moul-avatar name="User Three"></moul-avatar>
            <moul-avatar name="User Four"></moul-avatar>
            <moul-avatar name="User Five"></moul-avatar>
          </moul-avatar-group>
        `,
      )
      expect(group.getAttribute('role')).toBe('group')
      expect(group.getAttribute('aria-label')).toBe('Avatar group')

      const badge = group.shadowRoot?.querySelector('.overflow-badge')
      expect(badge?.textContent).toBe('+2')

      const slottedAvatars = group.querySelectorAll('moul-avatar')
      expect(slottedAvatars[0].style.display).not.toBe('none')
      expect(slottedAvatars[1].style.display).not.toBe('none')
      expect(slottedAvatars[2].style.display).not.toBe('none')
      expect(slottedAvatars[3].style.display).toBe('none')
      expect(slottedAvatars[4].style.display).toBe('none')
    })

    it('SURF-AVG-02: Group size cascades to slotted avatars lacking explicit size', async () => {
      const group = await mount<MoulAvatarGroup>(
        html`
          <moul-avatar-group size="lg">
            <moul-avatar id="inherited" name="A B"></moul-avatar>
            <moul-avatar id="explicit" size="xs" name="C D"></moul-avatar>
          </moul-avatar-group>
        `,
      )
      const inherited = group.querySelector<MoulAvatar>('#inherited')!
      const explicit = group.querySelector<MoulAvatar>('#explicit')!

      expect(inherited.size).toBe('lg')
      expect(inherited.getAttribute('size')).toBe('lg')
      expect(explicit.size).toBe('xs')
      expect(explicit.getAttribute('size')).toBe('xs')
    })
  })

  // 12. MoulTag & MoulTagGroup
  describe('MoulTag & MoulTagGroup', () => {
    it('SURF-TAG-01: MoulTag removal button dispatches remove event', async () => {
      const tag = await mount<MoulTag>(
        html`<moul-tag key="tag-1" is-removable>Removable Tag</moul-tag>`,
      )
      const removeBtn = tag.shadowRoot?.querySelector(
        '.remove-button',
      ) as HTMLButtonElement
      expect(removeBtn).toBeTruthy()

      let removeDetail: string | null = null
      tag.addEventListener('remove', (e) => {
        removeDetail = (e as CustomEvent).detail.key
      })

      removeBtn.click()
      await tag.updateComplete
      await new Promise((r) => setTimeout(r, 160))

      expect(removeDetail).toBe('tag-1')
    })

    it('SURF-TAG-02: MoulTagGroup manages single and multiple selection', async () => {
      const group = await mount<MoulTagGroup>(
        html`
          <moul-tag-group selection-mode="multiple" label="Technologies">
            <moul-tag key="ts">TypeScript</moul-tag>
            <moul-tag key="lit">Lit</moul-tag>
            <moul-tag key="vite">Vite</moul-tag>
          </moul-tag-group>
        `,
      )
      expect(group.getAttribute('role')).toBe('listbox')
      expect(group.getAttribute('aria-label')).toBe('Technologies')

      const tags = group.querySelectorAll('moul-tag')
      expect(tags.length).toBe(3)

      let selected: string[] = []
      group.addEventListener('selectionchange', (e) => {
        selected = (e as CustomEvent).detail.selectedKeys
      })

      // Click first tag
      tags[0].click()
      await group.updateComplete
      expect(selected).toEqual(['ts'])
      expect(tags[0].isSelected).toBe(true)

      // Click second tag in multiple mode
      tags[1].click()
      await group.updateComplete
      expect(selected).toEqual(['ts', 'lit'])
      expect(tags[1].isSelected).toBe(true)

      // Click first tag again to deselect
      tags[0].click()
      await group.updateComplete
      expect(selected).toEqual(['lit'])
      expect(tags[0].isSelected).toBe(false)
    })
  })

  // 13. MoulTable
  describe('MoulTable (`moul-table`)', () => {
    it('SURF-TBL-01: Loading state renders skeleton placeholder rows', async () => {
      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-loading
            columns='[{"key":"name","title":"Name"},{"key":"role","title":"Role"}]'
          ></moul-table>
        `,
      )
      const loadingRows = table.shadowRoot?.querySelectorAll(
        '[part="loading-row"]',
      )
      expect(loadingRows?.length).toBe(3)

      const skeletons = table.shadowRoot?.querySelectorAll('moul-skeleton')
      expect(skeletons?.length).toBeGreaterThan(0)
    })

    it('SURF-TBL-02: Sorting headers and selection change events', async () => {
      const data = [
        { id: '1', name: 'Alice', role: 'Engineer' },
        { id: '2', name: 'Bob', role: 'Designer' },
      ]
      const columns = [
        { key: 'name', title: 'Name', sortable: true },
        { key: 'role', title: 'Role', sortable: true },
      ]

      const table = await mount<MoulTable>(
        html`
          <moul-table
            is-sortable
            is-selectable
            .data=${data}
            .columns=${columns}
          ></moul-table>
        `,
      )

      let sortEventDetail: { column: string; direction: string } | null = null
      table.addEventListener('sortchange', (e) => {
        sortEventDetail = (e as CustomEvent).detail
      })

      const headers = table.shadowRoot?.querySelectorAll('th')
      // headers[0] is checkbox column, headers[1] is Name
      headers?.[1]?.click()
      await table.updateComplete

      expect(sortEventDetail).toEqual({ column: 'name', direction: 'asc' })

      headers?.[1]?.click()
      await table.updateComplete
      expect(sortEventDetail).toEqual({ column: 'name', direction: 'desc' })

      // Row selection
      let selectionEventDetail: { selectedKeys: string[] } | null = null
      table.addEventListener('selectionchange', (e) => {
        selectionEventDetail = (e as CustomEvent).detail
      })

      const rowCheckboxes = table.shadowRoot?.querySelectorAll(
        'tbody input[type="checkbox"]',
      )
      ;(rowCheckboxes?.[0] as HTMLInputElement)?.click()
      await table.updateComplete

      expect(selectionEventDetail).toEqual({ selectedKeys: ['1'] })
    })

    it('SURF-TBL-03: Empty state when data is empty and not loading', async () => {
      const table = await mount<MoulTable>(
        html`<moul-table .data=${[]}></moul-table>`,
      )
      const emptyCell = table.shadowRoot?.querySelector('.empty-cell')
      expect(emptyCell).toBeTruthy()
      expect(emptyCell?.textContent?.trim()).toBe('No data available')
    })
  })

  // 14. MoulToast & toastQueue
  describe('MoulToast & toastQueue', () => {
    it('SURF-TST-01: Toast initialization, role status, and popover manual', async () => {
      const toast = await mount<MoulToast>(
        html`<moul-toast title="File Saved" description="Your changes are saved."></moul-toast>`,
      )
      expect(toast.getAttribute('popover')).toBe('manual')
      expect(toast.getAttribute('role')).toBe('status')
      expect(toast.getAttribute('aria-live')).toBe('polite')
      expect(
        toast.shadowRoot?.querySelector('[part="title"]')?.textContent?.trim(),
      ).toBe('File Saved')
    })

    it('SURF-TST-02: toastQueue adds toast, auto-dismisses after duration', async () => {
      vi.useFakeTimers()

      const toastId = toastQueue.add({
        title: 'Uploaded Successfully',
        duration: 3000,
        tone: 'success',
      })

      expect(toastId).toBeTruthy()
      const region = document.querySelector('moul-toast-region')
      expect(region).toBeTruthy()

      const toast = region?.querySelector(`#${toastId}`) as MoulToast
      expect(toast).toBeTruthy()
      expect(toast.title).toBe('Uploaded Successfully')
      expect(toast.tone).toBe('success')

      // Advance timers to trigger auto-dismiss
      await vi.advanceTimersByTimeAsync(3000)
      await toast.updateComplete

      // Closed state
      expect(toast.isOpen).toBe(false)
      vi.useRealTimers()
    })

    it('SURF-TST-03: Close button dismisses toast', async () => {
      const toast = await mount<MoulToast>(
        html`<moul-toast title="Notice" duration="0"></moul-toast>`,
      )
      const closeBtn = toast.shadowRoot?.querySelector(
        '.dismiss-button',
      ) as HTMLButtonElement
      expect(closeBtn).toBeTruthy()

      let dismissFired = false
      toast.addEventListener('dismiss', () => {
        dismissFired = true
      })

      closeBtn.click()
      await toast.updateComplete
      await new Promise((r) => setTimeout(r, 50))

      expect(dismissFired).toBe(true)
      expect(toast.isOpen).toBe(false)
    })
  })
})
