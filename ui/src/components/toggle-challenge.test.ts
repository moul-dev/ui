import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './Button/Button'
import './ButtonGroup/ButtonGroup'
import './ToggleButton/ToggleButton'
import './ToggleButtonGroup/ToggleButtonGroup'
import type { MoulToggleButton } from './ToggleButton/ToggleButton'
import type { MoulToggleButtonGroup } from './ToggleButtonGroup/ToggleButtonGroup'

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

describe('Empirical Adversarial Challenge Suite: Toggle Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // Challenge 1: MoulToggleButton Extreme Stress
  // =========================================================================
  describe('Challenge 1: MoulToggleButton Extreme Stress & Boundaries', () => {
    it('CHAL-TGL-01: 100 rapid toggle state flips via .toggle() maintains deterministic synchronization', async () => {
      const toggleBtn = await mount<MoulToggleButton>(
        html`<moul-toggle-button value="format-bold">Bold</moul-toggle-button>`,
      )

      expect(toggleBtn.isSelected).toBe(false)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')

      let changeEventCount = 0
      let pressEventCount = 0
      const changeStates: boolean[] = []

      toggleBtn.addEventListener('change', (e: Event) => {
        changeEventCount++
        changeStates.push((e as CustomEvent).detail.isSelected)
      })
      toggleBtn.addEventListener('press', () => {
        pressEventCount++
      })

      // Execute 100 rapid flips
      const TOTAL_FLIPS = 100
      for (let i = 1; i <= TOTAL_FLIPS; i++) {
        toggleBtn.toggle()
        const expectedSelected = i % 2 === 1
        expect(toggleBtn.isSelected).toBe(expectedSelected)
        expect(toggleBtn.getAttribute('aria-pressed')).toBe(
          expectedSelected ? 'true' : 'false',
        )
      }

      await awaitNestedUpdates(toggleBtn)

      // Even number of flips (100) must return to initial false state
      expect(toggleBtn.isSelected).toBe(false)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
      expect(changeEventCount).toBe(TOTAL_FLIPS)
      expect(pressEventCount).toBe(TOTAL_FLIPS)
      expect(changeStates.length).toBe(TOTAL_FLIPS)

      // Verify alternating event details
      for (let i = 0; i < TOTAL_FLIPS; i++) {
        expect(changeStates[i]).toBe(i % 2 === 0)
      }

      // One more flip makes it odd (101 flips -> true)
      toggleBtn.toggle()
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
      expect(changeEventCount).toBe(101)
      expect(pressEventCount).toBe(101)
    })

    it('CHAL-TGL-02: 100 rapid pointer/click triggers maintain accurate toggle cycle without double-toggling', async () => {
      const toggleBtn = await mount<MoulToggleButton>(
        html`<moul-toggle-button value="italic">Italic</moul-toggle-button>`,
      )

      let pressCount = 0
      toggleBtn.addEventListener('press', () => {
        pressCount++
      })

      // Simulate 100 discrete pointer interactions
      for (let i = 1; i <= 100; i++) {
        await simulatePress(toggleBtn)
        const expectedSelected = i % 2 === 1
        expect(toggleBtn.isSelected).toBe(expectedSelected)
        expect(toggleBtn.getAttribute('aria-pressed')).toBe(
          expectedSelected ? 'true' : 'false',
        )
      }

      expect(pressCount).toBe(100)
      expect(toggleBtn.isSelected).toBe(false)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')

      // Inner shadow DOM button must also match
      const innerBtn = toggleBtn.shadowRoot?.querySelector('button')
      expect(innerBtn?.getAttribute('aria-pressed')).toBe('false')
    })

    it('CHAL-TGL-03: aria-pressed synchronization accuracy across attribute and property mutations', async () => {
      const toggleBtn = await mount<MoulToggleButton>(
        html`<moul-toggle-button value="underline">Underline</moul-toggle-button>`,
      )

      const innerBtn = toggleBtn.shadowRoot?.querySelector('button')
      expect(innerBtn).not.toBeNull()

      // 1. Programmatic property mutation -> true
      toggleBtn.isSelected = true
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
      expect(toggleBtn.hasAttribute('is-selected')).toBe(true)
      expect(innerBtn?.getAttribute('aria-pressed')).toBe('true')

      // 2. Programmatic property mutation -> false
      toggleBtn.isSelected = false
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
      expect(toggleBtn.hasAttribute('is-selected')).toBe(false)
      expect(innerBtn?.getAttribute('aria-pressed')).toBe('false')

      // 3. Attribute reflection mutation -> set is-selected
      toggleBtn.setAttribute('is-selected', '')
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
      expect(innerBtn?.getAttribute('aria-pressed')).toBe('true')

      // 4. Attribute reflection mutation -> remove is-selected
      toggleBtn.removeAttribute('is-selected')
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(false)
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
      expect(innerBtn?.getAttribute('aria-pressed')).toBe('false')
    })

    it('CHAL-TGL-04: Disabled state transitions completely inhibit interaction and toggle logic', async () => {
      const toggleBtn = await mount<MoulToggleButton>(
        html`<moul-toggle-button value="strikethrough">Strike</moul-toggle-button>`,
      )

      let eventsFired = 0
      toggleBtn.addEventListener('change', () => eventsFired++)
      toggleBtn.addEventListener('press', () => eventsFired++)

      // Initial state: enabled and unselected
      expect(toggleBtn.isDisabled).toBe(false)
      expect(toggleBtn.isSelected).toBe(false)

      // Toggle to true while enabled
      toggleBtn.toggle()
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(eventsFired).toBe(2) // 1 change + 1 press

      // Now disable the button
      toggleBtn.isDisabled = true
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.getAttribute('aria-disabled')).toBe('true')
      const innerBtn = toggleBtn.shadowRoot?.querySelector('button')
      expect(innerBtn?.hasAttribute('disabled')).toBe(true)
      expect(innerBtn?.getAttribute('aria-disabled')).toBe('true')

      // 1. Attempt programmatic .toggle() while disabled -> must NO-OP
      toggleBtn.toggle()
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(eventsFired).toBe(2)

      // 2. Attempt pointer press while disabled -> must NO-OP
      await simulatePress(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(eventsFired).toBe(2)

      // 3. Attempt keyboard Space / Enter while disabled -> must NO-OP
      await simulateKey(toggleBtn, ' ')
      await simulateKey(toggleBtn, 'Enter')
      expect(toggleBtn.isSelected).toBe(true)
      expect(eventsFired).toBe(2)

      // 4. Attempt direct .click() while disabled -> must NO-OP
      toggleBtn.click()
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.isSelected).toBe(true)
      expect(eventsFired).toBe(2)

      // Re-enable button
      toggleBtn.isDisabled = false
      await awaitNestedUpdates(toggleBtn)
      expect(toggleBtn.hasAttribute('aria-disabled')).toBe(false)
      expect(innerBtn?.hasAttribute('disabled')).toBe(false)

      // Now interaction must resume normally
      await simulatePress(toggleBtn)
      expect(toggleBtn.isSelected).toBe(false)
      expect(eventsFired).toBe(4) // 2 change + 2 press
    })

    it('CHAL-TGL-05: Fast-check property test on random boolean state and disable transitions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              action: fc.constantFrom<'toggle' | 'setSelected' | 'setDisabled'>(
                'toggle',
                'setSelected',
                'setDisabled',
              ),
              boolValue: fc.boolean(),
            }),
            { minLength: 10, maxLength: 50 },
          ),
          async (operations) => {
            const btn = document.createElement(
              'moul-toggle-button',
            ) as MoulToggleButton
            btn.value = 'fc-test'
            document.body.appendChild(btn)
            await btn.updateComplete

            try {
              for (const op of operations) {
                if (op.action === 'toggle') {
                  const wasDisabled = btn.isDisabled
                  const prevSelected = btn.isSelected
                  btn.toggle()
                  await btn.updateComplete
                  if (wasDisabled) {
                    expect(btn.isSelected).toBe(prevSelected)
                  } else {
                    expect(btn.isSelected).toBe(!prevSelected)
                  }
                } else if (op.action === 'setSelected') {
                  btn.isSelected = op.boolValue
                  await btn.updateComplete
                  expect(btn.isSelected).toBe(op.boolValue)
                } else if (op.action === 'setDisabled') {
                  btn.isDisabled = op.boolValue
                  await btn.updateComplete
                  expect(btn.isDisabled).toBe(op.boolValue)
                }

                // Invariant: aria-pressed must always accurately reflect isSelected
                expect(btn.getAttribute('aria-pressed')).toBe(
                  btn.isSelected ? 'true' : 'false',
                )
              }
            } finally {
              btn.remove()
            }
          },
        ),
      )
    })
  })

  // =========================================================================
  // Challenge 2: MoulToggleButtonGroup Roving Tabindex & Boundary Stress
  // =========================================================================
  describe('Challenge 2: MoulToggleButtonGroup Roving Tabindex & Boundary Stress', () => {
    it('CHAL-TGG-01: WAI-ARIA roving tabindex continuous circular wrapping across 12 items (ArrowRight/ArrowDown)', async () => {
      const ITEM_COUNT = 12
      const itemsTemplate = Array.from({ length: ITEM_COUNT }, (_, i) => {
        return html`<moul-toggle-button value="item-${i}">Item ${i}</moul-toggle-button>`
      })

      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="item-0">
          ${itemsTemplate}
        </moul-toggle-button-group>
      `)

      const items = group.getItems()
      expect(items.length).toBe(ITEM_COUNT)

      // Initial state: item 0 has tabindex="0", all others "-1"
      expect(items[0].getAttribute('tabindex')).toBe('0')
      for (let i = 1; i < ITEM_COUNT; i++) {
        expect(items[i].getAttribute('tabindex')).toBe('-1')
      }

      // Continuous forward wrapping across 3 full cycles (36 steps)
      const CYCLES = 3
      let currentIndex = 0

      for (let step = 1; step <= ITEM_COUNT * CYCLES; step++) {
        const nextIndex = (currentIndex + 1) % ITEM_COUNT

        // Dispatch ArrowRight
        items[currentIndex].dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
          }),
        )
        await awaitNestedUpdates(group)

        // Verify roving tabindex invariant
        expect(items[nextIndex].getAttribute('tabindex')).toBe('0')
        expect(items[currentIndex].getAttribute('tabindex')).toBe('-1')

        // Verify only ONE item in the entire group has tabindex="0"
        const activeItems = items.filter(
          (item) => item.getAttribute('tabindex') === '0',
        )
        expect(activeItems.length).toBe(1)
        expect(activeItems[0]).toBe(items[nextIndex])

        currentIndex = nextIndex
      }

      // Ended at index 0 after full cycles
      expect(currentIndex).toBe(0)
      expect(items[0].getAttribute('tabindex')).toBe('0')
    })

    it('CHAL-TGG-02: Continuous backward circular wrapping across 12 items (ArrowLeft/ArrowUp)', async () => {
      const ITEM_COUNT = 12
      const itemsTemplate = Array.from({ length: ITEM_COUNT }, (_, i) => {
        return html`<moul-toggle-button value="item-${i}">Item ${i}</moul-toggle-button>`
      })

      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="item-0">
          ${itemsTemplate}
        </moul-toggle-button-group>
      `)

      const items = group.getItems()
      expect(items.length).toBe(ITEM_COUNT)

      // Backward navigation: from item 0, ArrowLeft wraps immediately to item 11 (last item)
      let currentIndex = 0
      const CYCLES = 2

      for (let step = 1; step <= ITEM_COUNT * CYCLES; step++) {
        const prevIndex = (currentIndex - 1 + ITEM_COUNT) % ITEM_COUNT

        items[currentIndex].dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowLeft',
            bubbles: true,
            cancelable: true,
          }),
        )
        await awaitNestedUpdates(group)

        expect(items[prevIndex].getAttribute('tabindex')).toBe('0')
        expect(items[currentIndex].getAttribute('tabindex')).toBe('-1')

        const activeItems = items.filter(
          (item) => item.getAttribute('tabindex') === '0',
        )
        expect(activeItems.length).toBe(1)
        expect(activeItems[0]).toBe(items[prevIndex])

        currentIndex = prevIndex
      }

      expect(currentIndex).toBe(0)
    })

    it('CHAL-TGG-03: Roving tabindex correctly skips disabled items during traversal', async () => {
      // 6 items where indices 1, 3, 4 are disabled
      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="it-0">
          <moul-toggle-button value="it-0">0</moul-toggle-button>
          <moul-toggle-button value="it-1">1</moul-toggle-button>
          <moul-toggle-button value="it-2">2</moul-toggle-button>
          <moul-toggle-button value="it-3">3</moul-toggle-button>
          <moul-toggle-button value="it-4">4</moul-toggle-button>
          <moul-toggle-button value="it-5">5</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const items = group.getItems()
      expect(items[0].getAttribute('tabindex')).toBe('0')

      // Set items 1, 3, 4 disabled programmatically post-mount
      items[1].isDisabled = true
      items[3].isDisabled = true
      items[4].isDisabled = true
      await awaitNestedUpdates(group)

      // Forward traversal from 0 should skip 1 and jump directly to 2
      items[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[2].getAttribute('tabindex')).toBe('0')
      expect(items[1].getAttribute('tabindex')).toBe('-1')

      // Forward traversal from 2 should skip 3 and 4 and jump to 5
      items[2].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[5].getAttribute('tabindex')).toBe('0')

      // Forward traversal from 5 wraps around, skipping disabled 1, back to 0
      items[5].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[0].getAttribute('tabindex')).toBe('0')

      // Backward traversal from 0 wraps back to 5
      items[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowLeft',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[5].getAttribute('tabindex')).toBe('0')
    })

    it('CHAL-TGG-04: Home and End keys jump accurately in horizontal and vertical orientations', async () => {
      // Test horizontal orientation
      const groupHorizontal = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group orientation="horizontal" selected-key="mid">
          <moul-toggle-button value="first">First</moul-toggle-button>
          <moul-toggle-button value="mid">Mid</moul-toggle-button>
          <moul-toggle-button value="last">Last</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const hItems = groupHorizontal.getItems()
      expect(hItems[1].getAttribute('tabindex')).toBe('0')

      // Home jumps to first
      hItems[1].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Home',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(groupHorizontal)
      expect(hItems[0].getAttribute('tabindex')).toBe('0')
      expect(hItems[1].getAttribute('tabindex')).toBe('-1')

      // End jumps to last
      hItems[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'End',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(groupHorizontal)
      expect(hItems[2].getAttribute('tabindex')).toBe('0')
      expect(hItems[0].getAttribute('tabindex')).toBe('-1')

      // Test vertical orientation
      const groupVertical = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group orientation="vertical" selected-key="v-mid">
          <moul-toggle-button value="v-first">V First</moul-toggle-button>
          <moul-toggle-button value="v-mid">V Mid</moul-toggle-button>
          <moul-toggle-button value="v-last">V Last</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const vItems = groupVertical.getItems()
      expect(vItems[1].getAttribute('tabindex')).toBe('0')

      // Home on vertical
      vItems[1].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Home',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(groupVertical)
      expect(vItems[0].getAttribute('tabindex')).toBe('0')

      // End on vertical
      vItems[0].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'End',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(groupVertical)
      expect(vItems[2].getAttribute('tabindex')).toBe('0')
    })

    it('CHAL-TGG-05: Home and End keys jump to first/last ENABLED item when boundary items are disabled', async () => {
      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="btn-2">
          <moul-toggle-button value="btn-0">Disabled 0</moul-toggle-button>
          <moul-toggle-button value="btn-1">Enabled 1</moul-toggle-button>
          <moul-toggle-button value="btn-2">Enabled 2</moul-toggle-button>
          <moul-toggle-button value="btn-3">Enabled 3</moul-toggle-button>
          <moul-toggle-button value="btn-4">Disabled 4</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const items = group.getItems()
      expect(items[2].getAttribute('tabindex')).toBe('0')

      // Set boundary items disabled programmatically post-mount
      items[0].isDisabled = true
      items[4].isDisabled = true
      await awaitNestedUpdates(group)

      // Home should jump to btn-1 (first enabled, skipping btn-0)
      items[2].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Home',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[1].getAttribute('tabindex')).toBe('0')
      expect(items[0].getAttribute('tabindex')).toBe('-1')

      // End should jump to btn-3 (last enabled, skipping btn-4)
      items[1].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'End',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)
      expect(items[3].getAttribute('tabindex')).toBe('0')
      expect(items[4].getAttribute('tabindex')).toBe('-1')
    })

    it('CHAL-TGG-06: Active indicator element integrity during dynamic child insertions and removals', async () => {
      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="beta">
          <moul-toggle-button value="alpha">Alpha</moul-toggle-button>
          <moul-toggle-button value="beta">Beta</moul-toggle-button>
          <moul-toggle-button value="gamma">Gamma</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const indicator = group.shadowRoot?.querySelector('.active-indicator')
      expect(indicator).not.toBeNull()

      // Initially beta is selected
      expect(group.getSelectedButton()?.value).toBe('beta')

      // 1. Dynamic child insertion: append delta
      const delta = document.createElement(
        'moul-toggle-button',
      ) as MoulToggleButton
      delta.value = 'delta'
      delta.textContent = 'Delta'
      group.appendChild(delta)
      await awaitNestedUpdates(group)

      // Notify slot change if needed
      group.shadowRoot
        ?.querySelector('slot')
        ?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(group)

      expect(group.getItems().length).toBe(4)
      expect(group.getSelectedButton()?.value).toBe('beta')

      // 2. Dynamic removal of selected child (beta)
      const beta = group.querySelector('moul-toggle-button[value="beta"]')
      expect(beta).not.toBeNull()
      beta?.remove()
      await awaitNestedUpdates(group)

      group.shadowRoot
        ?.querySelector('slot')
        ?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(group)

      expect(group.getItems().length).toBe(3)
      // Selected button is now null because 'beta' was removed
      expect(group.getSelectedButton()).toBeNull()
      // Indicator must not throw and must remove 'is-visible'
      expect(indicator?.classList.contains('is-visible')).toBe(false)
      // Roving tabindex defaults to first available non-disabled item
      expect(group.getItems()[0].getAttribute('tabindex')).toBe('0')

      // 3. Dynamic removal of ALL remaining children
      const remaining = Array.from(group.querySelectorAll('moul-toggle-button'))
      for (const el of remaining) {
        el.remove()
      }
      await awaitNestedUpdates(group)
      group.shadowRoot
        ?.querySelector('slot')
        ?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(group)

      expect(group.getItems().length).toBe(0)
      expect(group.getSelectedButton()).toBeNull()
      expect(() => {
        // Arrow key on empty group must not throw
        group.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
        )
      }).not.toThrow()

      // 4. Recovery: add new buttons to empty group
      const newBtn = document.createElement(
        'moul-toggle-button',
      ) as MoulToggleButton
      newBtn.value = 'fresh'
      newBtn.textContent = 'Fresh'
      group.appendChild(newBtn)
      await awaitNestedUpdates(group)
      group.shadowRoot
        ?.querySelector('slot')
        ?.dispatchEvent(new Event('slotchange'))
      await awaitNestedUpdates(group)

      expect(group.getItems().length).toBe(1)
      expect(group.getItems()[0].getAttribute('tabindex')).toBe('0')
    })

    it('CHAL-TGG-07: Unrecognized and unknown selected-key values are handled gracefully', async () => {
      // 1. Initialized with unknown selected-key
      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group selected-key="non-existent-404">
          <moul-toggle-button value="opt-a">A</moul-toggle-button>
          <moul-toggle-button value="opt-b">B</moul-toggle-button>
          <moul-toggle-button value="opt-c">C</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      expect(group.selectedKey).toBe('non-existent-404')
      expect(group.getSelectedButton()).toBeNull()

      const items = group.getItems()
      for (const item of items) {
        expect(item.isSelected).toBe(false)
        expect(item.getAttribute('aria-pressed')).toBe('false')
      }

      // First non-disabled item receives roving tabindex fallback
      expect(items[0].getAttribute('tabindex')).toBe('0')
      expect(items[1].getAttribute('tabindex')).toBe('-1')
      expect(items[2].getAttribute('tabindex')).toBe('-1')

      // Active indicator is not visible
      const indicator = group.shadowRoot?.querySelector('.active-indicator')
      expect(indicator?.classList.contains('is-visible')).toBe(false)

      // 2. Transition from unknown key to valid key
      group.selectedKey = 'opt-b'
      await awaitNestedUpdates(group)

      expect(group.getSelectedButton()).toBe(items[1])
      expect(items[0].isSelected).toBe(false)
      expect(items[1].isSelected).toBe(true)
      expect(items[2].isSelected).toBe(false)
      expect(items[1].getAttribute('aria-pressed')).toBe('true')
      expect(items[1].getAttribute('tabindex')).toBe('0')

      // 3. Transition from valid key back to another unrecognized key
      group.selectedKey = 'phantom-999'
      await awaitNestedUpdates(group)

      expect(group.getSelectedButton()).toBeNull()
      expect(items[1].isSelected).toBe(false)
      expect(items[1].getAttribute('aria-pressed')).toBe('false')
      expect(indicator?.classList.contains('is-visible')).toBe(false)

      // 4. Empty string selected-key
      group.selectedKey = ''
      await awaitNestedUpdates(group)
      expect(group.getSelectedButton()).toBeNull()
      expect(items.every((it) => !it.isSelected)).toBe(true)
    })

    it('CHAL-TGG-08: Disabled group suppresses all navigation and interaction', async () => {
      const group = await mount<MoulToggleButtonGroup>(html`
        <moul-toggle-button-group is-disabled selected-key="item-1">
          <moul-toggle-button value="item-0">0</moul-toggle-button>
          <moul-toggle-button value="item-1">1</moul-toggle-button>
          <moul-toggle-button value="item-2">2</moul-toggle-button>
        </moul-toggle-button-group>
      `)

      const items = group.getItems()
      // Group disabled state propagates to all child buttons
      expect(items.every((item) => item.isDisabled)).toBe(true)

      let selectionChanged = false
      group.addEventListener('selectionchange', () => {
        selectionChanged = true
      })

      // Arrow navigation on disabled group must be ignored
      items[1].dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(group)

      // Tabindex and selection remain unchanged
      expect(group.selectedKey).toBe('item-1')
      expect(selectionChanged).toBe(false)

      // Clicking child button on disabled group does not trigger selection
      await simulatePress(items[0])
      expect(group.selectedKey).toBe('item-1')
      expect(selectionChanged).toBe(false)
    })

    it('CHAL-TGG-09: Fast-check property test on random navigation sequences preserving roving tabindex invariant', () => {
      const navKeys = [
        'ArrowRight',
        'ArrowLeft',
        'ArrowDown',
        'ArrowUp',
        'Home',
        'End',
      ] as const

      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.array(fc.constantFrom(...navKeys), {
            minLength: 10,
            maxLength: 60,
          }),
          (buttonCount, keySequence) => {
            const group = document.createElement(
              'moul-toggle-button-group',
            ) as MoulToggleButtonGroup
            group.selectedKey = 'btn-0'

            for (let i = 0; i < buttonCount; i++) {
              const btn = document.createElement(
                'moul-toggle-button',
              ) as MoulToggleButton
              btn.value = `btn-${i}`
              btn.textContent = `Button ${i}`
              group.appendChild(btn)
            }

            document.body.appendChild(group)

            try {
              // Initial sync
              ;(group as any).syncSelection()

              const items = group.getItems()
              expect(items.length).toBe(buttonCount)

              // Execute arbitrary sequence of navigation keys
              for (const key of keySequence) {
                // Find currently focused / tabindex=0 item
                const activeIndex = items.findIndex(
                  (item) => item.getAttribute('tabindex') === '0',
                )
                const target = activeIndex >= 0 ? items[activeIndex] : items[0]

                target.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    cancelable: true,
                  }),
                )

                // Roving tabindex invariant:
                // 1. Exactly ONE button in the group has tabindex="0"
                const activeItems = items.filter(
                  (item) => item.getAttribute('tabindex') === '0',
                )
                expect(activeItems.length).toBe(1)

                // 2. All other buttons have tabindex="-1"
                const inactiveItems = items.filter(
                  (item) => item.getAttribute('tabindex') === '-1',
                )
                expect(inactiveItems.length).toBe(buttonCount - 1)
              }
            } finally {
              group.remove()
            }
          },
        ),
      )
    })
  })
})
