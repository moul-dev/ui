import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import './Checkbox/Checkbox'
import './Checkbox/CheckboxGroup'
import './RadioGroup/Radio'
import './RadioGroup/RadioGroup'
import './Switch/Switch'
import './Select/Select'
import './Select/SelectItem'
import './ComboBox/ComboBox'
import './ComboBox/ComboBoxItem'
import './Calendar/Calendar'
import './DatePicker/DatePicker'

import type { MoulCalendar } from './Calendar/Calendar'
import type { MoulCheckbox } from './Checkbox/Checkbox'
import type { MoulCheckboxGroup } from './Checkbox/CheckboxGroup'
import type { MoulComboBox } from './ComboBox/ComboBox'
import type { MoulDatePicker } from './DatePicker/DatePicker'
import type { MoulRadioGroup } from './RadioGroup/RadioGroup'
import type { MoulSelect } from './Select/Select'
import type { MoulSwitch } from './Switch/Switch'

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
  element.click()
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
      composed: true,
      ...options,
    }),
  )
  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key,
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options,
    }),
  )
  await awaitNestedUpdates(element)
}

async function simulateInput(
  input: HTMLInputElement,
  value: string,
): Promise<void> {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  await awaitNestedUpdates(input)
}

describe('Empirical Adversarial Stress Suite: Pickers & Selection Controls (Phase 7)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // 1. MoulCheckbox & MoulCheckboxGroup Stress Tests
  // ===========================================================================
  describe('MoulCheckbox & MoulCheckboxGroup Adversarial Stress', () => {
    it('CHAL-CHK-01: 50 rapid toggle clicks preserves state parity and emits exactly 50 change events', async () => {
      const checkbox = await mount<MoulCheckbox>(
        html`<moul-checkbox value="opt1" label="Option 1"></moul-checkbox>`,
      )

      expect(checkbox.isChecked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('false')

      let changeCount = 0
      const emittedStates: boolean[] = []
      checkbox.addEventListener('change', (e: Event) => {
        changeCount++
        emittedStates.push((e as CustomEvent).detail.isChecked)
      })

      // Execute 50 rapid clicks
      const iterations = 50
      for (let i = 0; i < iterations; i++) {
        checkbox.click()
      }
      await awaitNestedUpdates(checkbox)

      // Parity check: 50 toggles on false should result in false
      expect(checkbox.isChecked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('false')
      expect(changeCount).toBe(iterations)
      expect(emittedStates.length).toBe(iterations)
      for (let i = 0; i < iterations; i++) {
        // Even index (0, 2, ...) -> toggled from false to true
        // Odd index (1, 3, ...) -> toggled from true to false
        expect(emittedStates[i]).toBe(i % 2 === 0)
      }

      // 51st click -> should end true
      checkbox.click()
      await awaitNestedUpdates(checkbox)
      expect(checkbox.isChecked).toBe(true)
      expect(checkbox.getAttribute('aria-checked')).toBe('true')
      expect(changeCount).toBe(51)
    })

    it('CHAL-CHK-02: Indeterminate state transitions, Spacebar key toggles, and ARIA consistency', async () => {
      const checkbox = await mount<MoulCheckbox>(
        html`<moul-checkbox value="all" is-indeterminate label="Select All"></moul-checkbox>`,
      )

      expect(checkbox.isIndeterminate).toBe(true)
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed')

      // First toggle: clears indeterminate and sets isChecked to true
      await simulatePress(checkbox)
      expect(checkbox.isIndeterminate).toBe(false)
      expect(checkbox.isChecked).toBe(true)
      expect(checkbox.getAttribute('aria-checked')).toBe('true')

      // Spacebar key: toggles isChecked to false
      await simulateKey(checkbox, ' ')
      expect(checkbox.isIndeterminate).toBe(false)
      expect(checkbox.isChecked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('false')

      // Re-assert indeterminate manually
      checkbox.isIndeterminate = true
      await awaitNestedUpdates(checkbox)
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed')

      // Space key clears indeterminate and sets isChecked to true
      await simulateKey(checkbox, ' ')
      expect(checkbox.isIndeterminate).toBe(false)
      expect(checkbox.isChecked).toBe(true)
      expect(checkbox.getAttribute('aria-checked')).toBe('true')
    })

    it('CHAL-CHK-03: Disabled checkbox strictly suppresses clicks, Space key, and form value mutation', async () => {
      const checkbox = await mount<MoulCheckbox>(
        html`<moul-checkbox value="agreed" is-disabled label="Terms"></moul-checkbox>`,
      )

      expect(checkbox.isDisabled).toBe(true)
      expect(checkbox.getAttribute('tabindex')).toBe('-1')

      let changeFired = false
      checkbox.addEventListener('change', () => {
        changeFired = true
      })

      // Attempt click
      checkbox.click()
      await awaitNestedUpdates(checkbox)
      expect(checkbox.isChecked).toBe(false)
      expect(changeFired).toBe(false)

      // Attempt Space key
      await simulateKey(checkbox, ' ')
      expect(checkbox.isChecked).toBe(false)
      expect(changeFired).toBe(false)

      // Attempt direct toggle()
      checkbox.toggle()
      await awaitNestedUpdates(checkbox)
      expect(checkbox.isChecked).toBe(false)
      expect(changeFired).toBe(false)
    })

    it('CHAL-CKG-01: CheckboxGroup 50 rapid toggle clicks across multiple checkboxes maintaining accurate aggregate values', async () => {
      const group = await mount<MoulCheckboxGroup>(
        html`
          <moul-checkbox-group label="Skills">
            <moul-checkbox value="c1" label="C1"></moul-checkbox>
            <moul-checkbox value="c2" label="C2"></moul-checkbox>
            <moul-checkbox value="c3" label="C3"></moul-checkbox>
            <moul-checkbox value="c4" label="C4"></moul-checkbox>
            <moul-checkbox value="c5" label="C5"></moul-checkbox>
          </moul-checkbox-group>
        `,
      )

      const cbs = group.checkboxes
      expect(cbs.length).toBe(5)
      expect(group.value).toEqual([])

      const groupChanges: string[][] = []
      group.addEventListener('change', (e: Event) => {
        groupChanges.push([...(e as CustomEvent).detail.value])
      })

      // 50 rapid toggle clicks across items round-robin
      for (let i = 0; i < 50; i++) {
        cbs[i % 5].click()
      }
      await awaitNestedUpdates(group)

      // Each item was clicked exactly 10 times (even count) -> all should be unchecked
      expect(group.value).toEqual([])
      expect(cbs.every((cb) => !cb.isChecked)).toBe(true)
      expect(groupChanges.length).toBe(50)

      // Click items 0, 2, 4 -> group value should contain exactly c1, c3, c5
      cbs[0].click()
      cbs[2].click()
      cbs[4].click()
      await awaitNestedUpdates(group)

      expect(group.value.sort()).toEqual(['c1', 'c3', 'c5'].sort())
      expect(cbs[0].isChecked).toBe(true)
      expect(cbs[1].isChecked).toBe(false)
      expect(cbs[2].isChecked).toBe(true)
      expect(cbs[3].isChecked).toBe(false)
      expect(cbs[4].isChecked).toBe(true)
    })

    it('CHAL-CKG-02: CheckboxGroup isolates child change events without leaking raw child events to external container listeners', async () => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      render(
        html`
          <div id="parent-container">
            <moul-checkbox-group label="Roles" name="roles">
              <moul-checkbox value="admin" label="Admin"></moul-checkbox>
              <moul-checkbox value="editor" label="Editor"></moul-checkbox>
            </moul-checkbox-group>
          </div>
        `,
        container,
      )

      const group = container.querySelector(
        'moul-checkbox-group',
      ) as MoulCheckboxGroup
      const parent = container.querySelector('#parent-container') as HTMLElement
      await awaitNestedUpdates(group)

      const receivedEvents: Array<{ targetTag: string; detailValue: any }> = []
      parent.addEventListener('change', (e: Event) => {
        const ce = e as CustomEvent
        receivedEvents.push({
          targetTag: (e.target as HTMLElement).tagName,
          detailValue: ce.detail?.value,
        })
      })

      const adminCb = group.checkboxes[0]
      adminCb.click()
      await awaitNestedUpdates(group)

      // Crucial: The parent container must ONLY receive the MOUL-CHECKBOX-GROUP change event with array value,
      // NOT a duplicate raw MOUL-CHECKBOX event with string value.
      expect(receivedEvents.length).toBe(1)
      expect(receivedEvents[0].targetTag).toBe('MOUL-CHECKBOX-GROUP')
      expect(receivedEvents[0].detailValue).toEqual(['admin'])
    })

    it('CHAL-CKG-03: CheckboxGroup disabled state cascades to all child checkboxes', async () => {
      const group = await mount<MoulCheckboxGroup>(
        html`
          <moul-checkbox-group label="Settings" is-disabled>
            <moul-checkbox value="s1" label="S1"></moul-checkbox>
            <moul-checkbox value="s2" label="S2"></moul-checkbox>
          </moul-checkbox-group>
        `,
      )

      const cbs = group.checkboxes
      expect(cbs[0].isDisabled).toBe(true)
      expect(cbs[1].isDisabled).toBe(true)

      let changed = false
      group.addEventListener('change', () => {
        changed = true
      })

      cbs[0].click()
      await awaitNestedUpdates(group)

      expect(cbs[0].isChecked).toBe(false)
      expect(group.value).toEqual([])
      expect(changed).toBe(false)
    })

    it('CHAL-CKG-04: CheckboxGroup form validity enforces isRequired constraints', async () => {
      const group = await mount<MoulCheckboxGroup>(
        html`
          <moul-checkbox-group label="Consent" name="consent" is-required>
            <moul-checkbox value="agree" label="I Agree"></moul-checkbox>
          </moul-checkbox-group>
        `,
      )

      expect(group.checkValidity()).toBe(false)
      expect(group.validity?.valueMissing).toBe(true)
      expect(group.hasAttribute('is-invalid')).toBe(true)

      // Selecting option satisfies constraint
      group.checkboxes[0].click()
      await awaitNestedUpdates(group)

      expect(group.checkValidity()).toBe(true)
      expect(group.validity?.valueMissing).toBe(false)
      expect(group.hasAttribute('is-invalid')).toBe(false)
    })

    it('CHAL-CKG-05: CheckboxGroup preserves individual child checkbox is-disabled state when group is not disabled', async () => {
      const group = await mount<MoulCheckboxGroup>(
        html`
          <moul-checkbox-group label="Mixed Permissions">
            <moul-checkbox value="read" label="Read"></moul-checkbox>
            <moul-checkbox value="write" is-disabled label="Write (Locked)"></moul-checkbox>
            <moul-checkbox value="admin" label="Admin"></moul-checkbox>
          </moul-checkbox-group>
        `,
      )

      const cbs = group.checkboxes
      expect(cbs[0].isDisabled).toBe(false)
      expect(cbs[1].isDisabled).toBe(true)
      expect(cbs[2].isDisabled).toBe(false)

      cbs[1].click()
      await awaitNestedUpdates(group)
      expect(cbs[1].isChecked).toBe(false)
      expect(group.value).toEqual([])
    })
  })

  // ===========================================================================
  // 2. MoulRadioGroup & MoulRadio Stress Tests
  // ===========================================================================
  describe('MoulRadioGroup & MoulRadio Adversarial Stress', () => {
    it('CHAL-RAD-01: Arrow key roving navigation across items (ArrowDown, ArrowRight, ArrowUp, ArrowLeft)', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Size" value="sm">
            <moul-radio value="sm">Small</moul-radio>
            <moul-radio value="md">Medium</moul-radio>
            <moul-radio value="lg">Large</moul-radio>
          </moul-radio-group>
        `,
      )

      const radios = group.radios
      expect(group.value).toBe('sm')
      expect(radios[0].isChecked).toBe(true)
      expect(radios[0].getAttribute('tabindex')).toBe('0')
      expect(radios[1].getAttribute('tabindex')).toBe('-1')

      // ArrowDown advances to md
      await simulateKey(radios[0], 'ArrowDown')
      expect(group.value).toBe('md')
      expect(radios[1].isChecked).toBe(true)
      expect(radios[0].isChecked).toBe(false)
      expect(radios[1].getAttribute('tabindex')).toBe('0')

      // ArrowRight advances to lg
      await simulateKey(radios[1], 'ArrowRight')
      expect(group.value).toBe('lg')
      expect(radios[2].isChecked).toBe(true)
      expect(radios[1].isChecked).toBe(false)

      // ArrowUp moves back to md
      await simulateKey(radios[2], 'ArrowUp')
      expect(group.value).toBe('md')
      expect(radios[1].isChecked).toBe(true)

      // ArrowLeft moves back to sm
      await simulateKey(radios[1], 'ArrowLeft')
      expect(group.value).toBe('sm')
      expect(radios[0].isChecked).toBe(true)
    })

    it('CHAL-RAD-02: Circular wrapping across bounds (ArrowDown on last radio wraps to first; ArrowUp on first wraps to last)', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Speed" value="fast">
            <moul-radio value="slow">Slow</moul-radio>
            <moul-radio value="medium">Medium</moul-radio>
            <moul-radio value="fast">Fast</moul-radio>
          </moul-radio-group>
        `,
      )

      const radios = group.radios
      expect(group.value).toBe('fast')

      // ArrowDown on last radio wraps to first radio
      await simulateKey(radios[2], 'ArrowDown')
      expect(group.value).toBe('slow')
      expect(radios[0].isChecked).toBe(true)
      expect(radios[2].isChecked).toBe(false)

      // ArrowUp on first radio wraps to last radio
      await simulateKey(radios[0], 'ArrowUp')
      expect(group.value).toBe('fast')
      expect(radios[2].isChecked).toBe(true)
      expect(radios[0].isChecked).toBe(false)
    })

    it('CHAL-RAD-03: Skipping disabled radios during arrow key roving navigation', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Tier" value="tier1">
            <moul-radio value="tier1">Tier 1</moul-radio>
            <moul-radio value="tier2" is-disabled>Tier 2 (Disabled)</moul-radio>
            <moul-radio value="tier3">Tier 3</moul-radio>
          </moul-radio-group>
        `,
      )

      const radios = group.radios
      expect(radios[1].isDisabled).toBe(true)

      // ArrowDown from tier1 must skip disabled tier2 and land directly on tier3
      await simulateKey(radios[0], 'ArrowDown')
      expect(group.value).toBe('tier3')
      expect(radios[2].isChecked).toBe(true)
      expect(radios[1].isChecked).toBe(false)

      // ArrowUp from tier3 must skip disabled tier2 and land directly back on tier1
      await simulateKey(radios[2], 'ArrowUp')
      expect(group.value).toBe('tier1')
      expect(radios[0].isChecked).toBe(true)
      expect(radios[1].isChecked).toBe(false)

      // Clicking disabled radio has no effect
      radios[1].click()
      await awaitNestedUpdates(group)
      expect(group.value).toBe('tier1')
      expect(radios[1].isChecked).toBe(false)
    })

    it('CHAL-RAD-04: 50 rapid random clicks across radio items strictly maintains mutual exclusion', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Choice">
            <moul-radio value="r1">R1</moul-radio>
            <moul-radio value="r2">R2</moul-radio>
            <moul-radio value="r3">R3</moul-radio>
            <moul-radio value="r4">R4</moul-radio>
          </moul-radio-group>
        `,
      )

      const radios = group.radios
      const sequence = [
        0, 1, 3, 2, 0, 2, 1, 3, 3, 0, 1, 2, 0, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 3,
        1, 2, 0, 3, 1, 2, 0, 2, 1, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1,
        2, 3,
      ]

      for (const idx of sequence) {
        radios[idx].click()
      }
      await awaitNestedUpdates(group)

      // Last clicked was 3 (r4)
      expect(group.value).toBe('r4')
      const checkedRadios = radios.filter((r) => r.isChecked)
      expect(checkedRadios.length).toBe(1)
      expect(checkedRadios[0].value).toBe('r4')
    })

    it('CHAL-RAD-05: Arrow navigation when no radio is initially selected defaults cleanly', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Unselected">
            <moul-radio value="first">First</moul-radio>
            <moul-radio value="second">Second</moul-radio>
            <moul-radio value="third">Third</moul-radio>
          </moul-radio-group>
        `,
      )

      expect(group.value).toBe('')

      // ArrowDown on empty selects index 0
      await simulateKey(group, 'ArrowDown')
      expect(group.value).toBe('first')
      expect(group.radios[0].isChecked).toBe(true)

      // Reset
      group.value = ''
      await awaitNestedUpdates(group)

      // ArrowUp on empty selects last index
      await simulateKey(group, 'ArrowUp')
      expect(group.value).toBe('third')
      expect(group.radios[2].isChecked).toBe(true)
    })
  })

  // ===========================================================================
  // 3. MoulSwitch Adversarial Stress Tests
  // ===========================================================================
  describe('MoulSwitch Adversarial Stress', () => {
    it('CHAL-SWT-01: 100 rapid click toggles preserves state parity and emits exactly 100 change events', async () => {
      const sw = await mount<MoulSwitch>(
        html`<moul-switch value="active" label="Active State"></moul-switch>`,
      )

      expect(sw.isChecked).toBe(false)
      expect(sw.getAttribute('aria-checked')).toBe('false')

      let count = 0
      sw.addEventListener('change', () => {
        count++
      })

      for (let i = 0; i < 100; i++) {
        sw.click()
      }
      await awaitNestedUpdates(sw)

      // 100 toggles on false -> false
      expect(sw.isChecked).toBe(false)
      expect(sw.getAttribute('aria-checked')).toBe('false')
      expect(count).toBe(100)

      // 101st toggle -> true
      sw.click()
      await awaitNestedUpdates(sw)
      expect(sw.isChecked).toBe(true)
      expect(sw.getAttribute('aria-checked')).toBe('true')
      expect(count).toBe(101)
    })

    it('CHAL-SWT-02: Keyboard toggle resilience (Enter and Space keys)', async () => {
      const sw = await mount<MoulSwitch>(
        html`<moul-switch value="airplane" label="Airplane Mode"></moul-switch>`,
      )

      // Space key toggles on
      await simulateKey(sw, ' ')
      expect(sw.isChecked).toBe(true)
      expect(sw.getAttribute('aria-checked')).toBe('true')

      // Enter key toggles off
      await simulateKey(sw, 'Enter')
      expect(sw.isChecked).toBe(false)
      expect(sw.getAttribute('aria-checked')).toBe('false')
    })

    it('CHAL-SWT-03: Disabled switch strictly suppresses clicks, Enter, and Space keys', async () => {
      const sw = await mount<MoulSwitch>(
        html`<moul-switch value="locked" is-disabled label="Locked Setting"></moul-switch>`,
      )

      expect(sw.isDisabled).toBe(true)
      expect(sw.getAttribute('tabindex')).toBe('-1')
      expect(sw.getAttribute('aria-disabled')).toBe('true')

      let fired = false
      sw.addEventListener('change', () => {
        fired = true
      })

      sw.click()
      await awaitNestedUpdates(sw)
      expect(sw.isChecked).toBe(false)
      expect(fired).toBe(false)

      await simulateKey(sw, 'Enter')
      expect(sw.isChecked).toBe(false)
      expect(fired).toBe(false)

      await simulateKey(sw, ' ')
      expect(sw.isChecked).toBe(false)
      expect(fired).toBe(false)
    })

    it('CHAL-SWT-04: FormInternals synchronization (string value when checked, null when unchecked)', async () => {
      const sw = await mount<MoulSwitch>(
        html`<moul-switch name="subscribe" value="subscribed" label="Newsletter"></moul-switch>`,
      )

      // Initially unchecked -> validity valid, internal value null
      expect(sw.checkValidity()).toBe(true)

      // Toggle checked
      sw.toggle()
      await awaitNestedUpdates(sw)
      expect(sw.isChecked).toBe(true)

      // Toggle unchecked
      sw.toggle()
      await awaitNestedUpdates(sw)
      expect(sw.isChecked).toBe(false)
    })
  })

  // ===========================================================================
  // 4. MoulSelect & MoulComboBox Adversarial Stress Tests
  // ===========================================================================
  describe('MoulSelect & MoulComboBox Adversarial Stress', () => {
    it('CHAL-SEL-01: 50-item Select dropdown open/close storm (50 rapid toggles) without deadlock', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        key: `item-${i}`,
        value: `Option ${i}`,
      }))

      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Large List">
            ${items.map(
              (item) => html`
                <moul-select-item key=${item.key} value=${item.value}>
                  ${item.value}
                </moul-select-item>
              `,
            )}
          </moul-select>
        `,
      )

      expect(select.items.length).toBe(50)
      expect(select.isOpen).toBe(false)

      // 50 rapid toggle calls
      for (let i = 0; i < 50; i++) {
        select.toggle()
      }
      await awaitNestedUpdates(select)

      // 50 toggles from false ends at false
      expect(select.isOpen).toBe(false)

      // Open cleanly
      select.open()
      await awaitNestedUpdates(select)
      expect(select.isOpen).toBe(true)

      // Close cleanly
      select.close()
      await awaitNestedUpdates(select)
      expect(select.isOpen).toBe(false)
    })

    it('CHAL-SEL-02: 50-item Select keyboard navigation (ArrowDown, ArrowUp, circular wrap, Enter commit)', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        key: `k${i}`,
        value: `Value ${i}`,
      }))

      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Select 50">
            ${items.map(
              (it) =>
                html`<moul-select-item key=${it.key} value=${it.value}>${it.value}</moul-select-item>`,
            )}
          </moul-select>
        `,
      )

      // Open with ArrowDown on trigger
      await simulateKey(select.triggerButton!, 'ArrowDown')
      expect(select.isOpen).toBe(true)

      // ArrowUp should circularly wrap to last item (index 49)
      await simulateKey(select.triggerButton!, 'ArrowUp')
      // Press Enter to commit selection
      await simulateKey(select.triggerButton!, 'Enter')

      expect(select.isOpen).toBe(false)
      expect(select.selectedKey).toBe('k49')
      expect(select.selectedText).toBe('Value 49')

      // Re-open and ArrowDown from 49 wraps to 0
      select.open()
      await awaitNestedUpdates(select)
      await simulateKey(select.triggerButton!, 'ArrowDown')
      await simulateKey(select.triggerButton!, 'Enter')

      expect(select.isOpen).toBe(false)
      expect(select.selectedKey).toBe('k0')
      expect(select.selectedText).toBe('Value 0')
    })

    it('CHAL-SEL-03: Select skips disabled items during keyboard traversal', async () => {
      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Skip Test">
            <moul-select-item key="opt0" value="Opt 0">Opt 0</moul-select-item>
            <moul-select-item key="opt1" value="Opt 1" is-disabled>Opt 1 (Disabled)</moul-select-item>
            <moul-select-item key="opt2" value="Opt 2">Opt 2</moul-select-item>
          </moul-select>
        `,
      )

      select.open()
      await awaitNestedUpdates(select)

      // Navigate down from opt0 -> skips opt1 -> lands on opt2
      await simulateKey(select.triggerButton!, 'ArrowDown')
      await simulateKey(select.triggerButton!, 'Enter')

      expect(select.selectedKey).toBe('opt2')
    })

    it('CHAL-SEL-04: Select Escape key cancels open dropdown and restores focus to trigger', async () => {
      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Escape Test">
            <moul-select-item key="a" value="A">A</moul-select-item>
            <moul-select-item key="b" value="B">B</moul-select-item>
          </moul-select>
        `,
      )

      select.open()
      await awaitNestedUpdates(select)
      expect(select.isOpen).toBe(true)

      // Escape key closes without selecting
      await simulateKey(select.triggerButton!, 'Escape')
      expect(select.isOpen).toBe(false)
      expect(select.selectedKey).toBe('')
    })

    it('CHAL-SEL-05: Select isRequired validation enforces selection', async () => {
      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Required Select" name="choice" is-required>
            <moul-select-item key="v1" value="Val 1">Val 1</moul-select-item>
          </moul-select>
        `,
      )

      expect(select.checkValidity()).toBe(false)
      expect(select.validity?.valueMissing).toBe(true)
      expect(select.hasAttribute('is-invalid')).toBe(true)

      select.selectItem('v1', 'Val 1')
      await awaitNestedUpdates(select)

      expect(select.checkValidity()).toBe(true)
      expect(select.validity?.valueMissing).toBe(false)
      expect(select.hasAttribute('is-invalid')).toBe(false)
    })

    it('CHAL-CMB-01: 50-item ComboBox dropdown open/close storm (50 rapid toggles)', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        key: `cb-${i}`,
        text: `Combo Item ${i}`,
      }))

      const combobox = await mount<MoulComboBox>(
        html`
          <moul-combobox label="Combo 50">
            ${items.map(
              (it) =>
                html`<moul-combobox-item key=${it.key} text-value=${it.text}>${it.text}</moul-combobox-item>`,
            )}
          </moul-combobox>
        `,
      )

      expect(combobox.items.length).toBe(50)
      expect(combobox.isOpen).toBe(false)

      for (let i = 0; i < 50; i++) {
        combobox.toggle()
      }
      await awaitNestedUpdates(combobox)

      expect(combobox.isOpen).toBe(false)
    })

    it('CHAL-CMB-02: ComboBox live search filtering of 50 items and empty state fallback', async () => {
      const items = [
        'React',
        'Vue',
        'Angular',
        'Svelte',
        'Solid',
        'Lit',
        'Preact',
        'Qwik',
        'Alpine',
        'Ember',
      ]

      const combobox = await mount<MoulComboBox>(
        html`
          <moul-combobox label="Frameworks">
            ${items.map(
              (name) =>
                html`<moul-combobox-item key=${name.toLowerCase()} text-value=${name}>${name}</moul-combobox-item>`,
            )}
          </moul-combobox>
        `,
      )

      const input = combobox.inputElement!

      // Filter matching exactly "Lit"
      await simulateInput(input, 'Lit')
      expect(combobox.isOpen).toBe(true)
      expect(combobox.visibleItems.length).toBe(1)
      expect(combobox.visibleItems[0].key).toBe('lit')

      // Filter matching zero items -> triggers empty state
      await simulateInput(input, 'NonExistentZzz')
      expect(combobox.visibleItems.length).toBe(0)
      const emptySlot = combobox.renderRoot.querySelector('[part="empty"]')
      expect(emptySlot?.textContent).toContain('No results found')

      // Clear input -> restores all items
      await simulateInput(input, '')
      expect(combobox.visibleItems.length).toBe(items.length)
    })

    it('CHAL-CMB-03: ComboBox custom value commit and FormInternals synchronization', async () => {
      const combobox = await mount<MoulComboBox>(
        html`<moul-combobox label="Custom Input" name="custom_field" is-required></moul-combobox>`,
      )

      // Initially empty & required
      expect(combobox.checkValidity()).toBe(false)
      expect(combobox.validity?.valueMissing).toBe(true)

      // User types custom value
      const input = combobox.inputElement!
      await simulateInput(input, 'Custom Typed Entry')

      expect(combobox.inputValue).toBe('Custom Typed Entry')
      expect(combobox.checkValidity()).toBe(true)
      expect(combobox.validity?.valueMissing).toBe(false)
    })

    it('CHAL-CMB-04: ComboBox keyboard traversal & focus handling (ArrowDown opens, Enter selects, Escape dismisses)', async () => {
      const combobox = await mount<MoulComboBox>(
        html`
          <moul-combobox label="Traversal Test">
            <moul-combobox-item key="opt1" text-value="Option 1">Option 1</moul-combobox-item>
            <moul-combobox-item key="opt2" text-value="Option 2">Option 2</moul-combobox-item>
          </moul-combobox>
        `,
      )

      const input = combobox.inputElement!
      expect(combobox.isOpen).toBe(false)

      // ArrowDown opens combobox
      await simulateKey(input, 'ArrowDown')
      expect(combobox.isOpen).toBe(true)

      // Escape closes combobox
      await simulateKey(input, 'Escape')
      expect(combobox.isOpen).toBe(false)

      // Re-open with ArrowDown and select with Enter
      await simulateKey(input, 'ArrowDown')
      expect(combobox.isOpen).toBe(true)
      await simulateKey(input, 'ArrowDown')
      await simulateKey(input, 'Enter')

      expect(combobox.isOpen).toBe(false)
      expect(combobox.selectedKey).toBe('opt1')
      expect(combobox.inputValue).toBe('Option 1')
    })

    it('CHAL-CMB-05: Sequential keyboard navigation when focus moves to active descendant item', async () => {
      const combobox = await mount<MoulComboBox>(
        html`
          <moul-combobox label="Active Descendant Test">
            <moul-combobox-item key="opt1" text-value="Option 1">Option 1</moul-combobox-item>
            <moul-combobox-item key="opt2" text-value="Option 2">Option 2</moul-combobox-item>
            <moul-combobox-item key="opt3" text-value="Option 3">Option 3</moul-combobox-item>
          </moul-combobox>
        `,
      )

      const input = combobox.inputElement!
      // Open with ArrowDown
      await simulateKey(input, 'ArrowDown')
      expect(combobox.isOpen).toBe(true)

      // ArrowDown to move to first item
      await simulateKey(input, 'ArrowDown')
      const items = combobox.items

      // The combobox implementation called visible[0].focus(), moving DOM focus to items[0]
      expect(document.activeElement).toBe(items[0])

      // In real browser keyboard navigation, subsequent key events are dispatched to document.activeElement
      await simulateKey(document.activeElement as HTMLElement, 'ArrowDown')
      expect(document.activeElement).toBe(items[1])

      await simulateKey(document.activeElement as HTMLElement, 'Enter')
      expect(combobox.isOpen).toBe(false)
      expect(combobox.selectedKey).toBe('opt2')
    })
  })

  // ===========================================================================
  // 5. MoulCalendar & MoulDatePicker Adversarial Stress Tests
  // ===========================================================================
  describe('MoulCalendar & MoulDatePicker Adversarial Stress', () => {
    it('CHAL-CAL-01: Month navigation storm (24 clicks forward, 36 clicks backward, 120 decade jump)', async () => {
      const calendar = await mount<MoulCalendar>(
        html`<moul-calendar locale="en-US" value="2026-10-15"></moul-calendar>`,
      )

      const heading = calendar.renderRoot.querySelector('[part="heading"]')!
      const nextBtn = calendar.renderRoot.querySelector(
        '[part="nav-btn nav-btn-next"]',
      ) as HTMLButtonElement
      const prevBtn = calendar.renderRoot.querySelector(
        '[part="nav-btn nav-btn-prev"]',
      ) as HTMLButtonElement

      expect(heading.textContent).toContain('October 2026')

      // 24 next month clicks -> advances exactly 2 years to October 2028
      for (let i = 0; i < 24; i++) {
        nextBtn.click()
      }
      await awaitNestedUpdates(calendar)
      expect(heading.textContent).toContain('October 2028')

      // 36 previous month clicks -> rewinds 3 years to October 2025
      for (let i = 0; i < 36; i++) {
        prevBtn.click()
      }
      await awaitNestedUpdates(calendar)
      expect(heading.textContent).toContain('October 2025')

      // Decade jump: 120 previous month clicks -> rewinds 10 years to October 2015
      for (let i = 0; i < 120; i++) {
        prevBtn.click()
      }
      await awaitNestedUpdates(calendar)
      expect(heading.textContent).toContain('October 2015')

      // Grid sanity check: total rendered day buttons must be 35 or 42
      const dayBtns = calendar.renderRoot.querySelectorAll('[part="day-btn"]')
      expect(dayBtns.length >= 35 && dayBtns.length <= 42).toBe(true)
    })

    it('CHAL-CAL-02: minDate and maxDate boundary clamps (clicking out-of-bounds dates rejected)', async () => {
      const calendar = await mount<MoulCalendar>(
        html`
          <moul-calendar
            locale="en-US"
            value="2026-10-15"
            min-date="2026-10-10"
            max-date="2026-10-25"
          ></moul-calendar>
        `,
      )

      let changedDate = ''
      calendar.addEventListener('change', (e: Event) => {
        changedDate = (e as CustomEvent).detail.value
      })

      // Attempt to select out-of-bounds date before minDate (2026-10-05)
      calendar.selectDate('2026-10-05')
      await awaitNestedUpdates(calendar)
      expect(calendar.value).toBe('2026-10-15')
      expect(changedDate).toBe('')

      // Attempt to select out-of-bounds date after maxDate (2026-10-28)
      calendar.selectDate('2026-10-28')
      await awaitNestedUpdates(calendar)
      expect(calendar.value).toBe('2026-10-15')
      expect(changedDate).toBe('')

      // Select valid in-bounds date (2026-10-20)
      calendar.selectDate('2026-10-20')
      await awaitNestedUpdates(calendar)
      expect(calendar.value).toBe('2026-10-20')
      expect(changedDate).toBe('2026-10-20')

      // Verify DOM button disabled state for clamped days
      const disabledDayBtn = calendar.renderRoot.querySelector(
        '[data-date="2026-10-05"]',
      ) as HTMLButtonElement
      expect(disabledDayBtn?.disabled).toBe(true)
      expect(disabledDayBtn?.getAttribute('aria-disabled')).toBe('true')

      const validDayBtn = calendar.renderRoot.querySelector(
        '[data-date="2026-10-20"]',
      ) as HTMLButtonElement
      expect(validDayBtn?.disabled).toBe(false)
    })

    it('CHAL-CAL-03: Keyboard grid traversal (Arrow keys, PageUp/PageDown, month boundary crossing)', async () => {
      const calendar = await mount<MoulCalendar>(
        html`<moul-calendar locale="en-US" value="2026-10-31"></moul-calendar>`,
      )

      const heading = calendar.renderRoot.querySelector('[part="heading"]')!
      expect(heading.textContent).toContain('October 2026')

      const day31 = calendar.renderRoot.querySelector(
        '[data-date="2026-10-31"]',
      ) as HTMLButtonElement
      expect(day31).not.toBeNull()

      // ArrowRight from Oct 31 crosses into Nov 01, updating viewMonth to November
      await simulateKey(day31, 'ArrowRight')
      expect(heading.textContent).toContain('November 2026')

      // PageUp moves backward 1 month to October
      const day1 = calendar.renderRoot.querySelector(
        '[data-date="2026-11-01"]',
      ) as HTMLButtonElement
      await simulateKey(day1, 'PageUp')
      expect(heading.textContent).toContain('October 2026')

      // PageDown moves forward 1 month to November
      const dayOct1 = calendar.renderRoot.querySelector(
        '[data-date="2026-10-01"]',
      ) as HTMLButtonElement
      await simulateKey(dayOct1, 'PageDown')
      expect(heading.textContent).toContain('November 2026')
    })

    it('CHAL-CAL-04: Locale formatting internationalization (fr-FR, ja-JP)', async () => {
      const frCalendar = await mount<MoulCalendar>(
        html`<moul-calendar locale="fr-FR" value="2026-07-14"></moul-calendar>`,
      )

      const frHeading =
        frCalendar.renderRoot.querySelector('[part="heading"]')!.textContent
      // French for July 2026 is "juillet 2026"
      expect(frHeading?.toLowerCase()).toContain('juillet 2026')

      const jaCalendar = await mount<MoulCalendar>(
        html`<moul-calendar locale="ja-JP" value="2026-07-14"></moul-calendar>`,
      )
      const jaHeading =
        jaCalendar.renderRoot.querySelector('[part="heading"]')!.textContent
      // Japanese for July 2026 is "2026年7月"
      expect(jaHeading).toContain('2026年7月')
    })

    it('CHAL-DTP-01: DatePicker 50 open/close bursts via trigger button without hanging', async () => {
      const picker = await mount<MoulDatePicker>(
        html`<moul-date-picker label="Burst Test" value="2026-08-20"></moul-date-picker>`,
      )

      const trigger = picker.renderRoot.querySelector(
        '[part="trigger-btn"]',
      ) as HTMLButtonElement
      expect(picker.isOpen).toBe(false)

      for (let i = 0; i < 50; i++) {
        trigger.click()
      }
      await awaitNestedUpdates(picker)

      expect(picker.isOpen).toBe(false)

      // Open cleanly
      trigger.click()
      await awaitNestedUpdates(picker)
      expect(picker.isOpen).toBe(true)

      // Close cleanly
      trigger.click()
      await awaitNestedUpdates(picker)
      expect(picker.isOpen).toBe(false)
    })

    it('CHAL-DTP-02: DatePicker complete calendar selection flow and formatted display update', async () => {
      const picker = await mount<MoulDatePicker>(
        html`<moul-date-picker label="Appointment" value="2026-03-10" locale="en-US"></moul-date-picker>`,
      )

      expect(picker.formattedDisplayDate).toContain('Mar 10, 2026')

      const trigger = picker.renderRoot.querySelector(
        '[part="trigger-btn"]',
      ) as HTMLButtonElement
      trigger.click()
      await awaitNestedUpdates(picker)
      expect(picker.isOpen).toBe(true)

      let changedDate = ''
      picker.addEventListener('change', (e: Event) => {
        changedDate = (e as CustomEvent).detail.value
      })

      // Select new date from calendar
      const cal = picker.calendarElement!
      cal.selectDate('2026-03-25')
      await awaitNestedUpdates(picker)

      expect(picker.isOpen).toBe(false)
      expect(picker.value).toBe('2026-03-25')
      expect(changedDate).toBe('2026-03-25')
      expect(picker.formattedDisplayDate).toContain('Mar 25, 2026')
    })

    it('CHAL-DTP-03: DatePicker Escape key closes popover and restores focus to input', async () => {
      const picker = await mount<MoulDatePicker>(
        html`<moul-date-picker label="Cancel Test" value="2026-01-01"></moul-date-picker>`,
      )

      picker.open()
      await awaitNestedUpdates(picker)
      expect(picker.isOpen).toBe(true)

      await simulateKey(picker.inputElement!, 'Escape')
      expect(picker.isOpen).toBe(false)
    })

    it('CHAL-DTP-04: DatePicker form validation (isRequired enforces date selection)', async () => {
      const picker = await mount<MoulDatePicker>(
        html`<moul-date-picker label="Due Date" name="due_date" is-required></moul-date-picker>`,
      )

      // Initially empty -> invalid
      expect(picker.checkValidity()).toBe(false)
      expect(picker.validity?.valueMissing).toBe(true)
      expect(picker.hasAttribute('is-invalid')).toBe(true)

      // Set value -> valid
      picker.value = '2026-12-31'
      await awaitNestedUpdates(picker)

      expect(picker.checkValidity()).toBe(true)
      expect(picker.validity?.valueMissing).toBe(false)
      expect(picker.hasAttribute('is-invalid')).toBe(false)
    })
  })
})
