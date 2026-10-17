import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import './Form/Form'
import './TextField/TextField'
import './NumberField/NumberField'
import './SearchField/SearchField'
import './TextArea/TextArea'
import './Checkbox/Checkbox'
import './Checkbox/CheckboxGroup'
import './RadioGroup/Radio'
import './RadioGroup/RadioGroup'
import './Switch/Switch'
import './Slider/Slider'
import './InputOTP/InputOTP'
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
import type { MoulForm } from './Form/Form'
import type { MoulInputOTP } from './InputOTP/InputOTP'
import type { MoulNumberField } from './NumberField/NumberField'
import type { MoulRadioGroup } from './RadioGroup/RadioGroup'
import type { MoulSearchField } from './SearchField/SearchField'
import type { MoulSelect } from './Select/Select'
import type { MoulSlider } from './Slider/Slider'
import type { MoulSwitch } from './Switch/Switch'
import type { MoulTextArea } from './TextArea/TextArea'
import { MoulTextField } from './TextField/TextField'

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

async function simulateInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  await awaitNestedUpdates(input)
}

describe('Input & Form Components (Phase 7)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // 1. MoulForm (`moul-form`)
  // ---------------------------------------------------------------------------
  describe('MoulForm (`moul-form`)', () => {
    it('FRM-FRM-01: Form validation, submit re-dispatch with FormData, and reset', async () => {
      const form = await mount<MoulForm>(
        html`
          <moul-form>
            <moul-text-field name="username" value="phearak" is-required></moul-text-field>
            <moul-text-field name="email" value="" is-required></moul-text-field>
            <moul-checkbox name="newsletter" value="yes" is-checked></moul-checkbox>
            <button type="submit" id="submit-btn">Submit</button>
          </moul-form>
        `,
      )

      let invalidFired = false
      let invalidErrors: Record<string, string> = {}
      form.addEventListener('invalid', (e: Event) => {
        invalidFired = true
        invalidErrors = (e as CustomEvent).detail.errors
      })

      let submitFired = false
      let submittedFormData: FormData | null = null
      form.addEventListener('submit', (e: Event) => {
        submitFired = true
        submittedFormData = (e as CustomEvent).detail.formData
      })

      // First submit attempt: email is required and empty, so submit fails
      form.submit()
      expect(invalidFired).toBe(true)
      expect(submitFired).toBe(false)
      expect(invalidErrors.email).toBeDefined()

      // Fill in required email
      const emailField = form.querySelector(
        'moul-text-field[name="email"]',
      ) as MoulTextField
      emailField.value = 'phearak@example.com'
      await awaitNestedUpdates(form)

      // Second submit attempt: should succeed
      invalidFired = false
      form.submit()
      expect(invalidFired).toBe(false)
      expect(submitFired).toBe(true)
      expect(submittedFormData).not.toBeNull()
      expect(submittedFormData?.get('username')).toBe('phearak')
      expect(submittedFormData?.get('email')).toBe('phearak@example.com')
      expect(submittedFormData?.get('newsletter')).toBe('yes')

      // Test reset
      let resetFired = false
      form.addEventListener('reset', () => {
        resetFired = true
      })
      form.reset()
      expect(resetFired).toBe(true)
    })

    it('bypasses validation when novalidate is true', async () => {
      const form = await mount<MoulForm>(
        html`
          <moul-form novalidate>
            <moul-text-field name="requiredField" value="" is-required></moul-text-field>
          </moul-form>
        `,
      )

      let submitFired = false
      form.addEventListener('submit', () => {
        submitFired = true
      })

      form.submit()
      expect(submitFired).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. MoulTextField (`moul-text-field`)
  // ---------------------------------------------------------------------------
  describe('MoulTextField (`moul-text-field`)', () => {
    it('FRM-TXT-01: Form association, value synchronization, and events', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)

      const field = document.createElement('moul-text-field') as MoulTextField
      field.name = 'user'
      field.value = 'initial'
      form.appendChild(field)
      await awaitNestedUpdates(field)

      expect(MoulTextField.formAssociated).toBe(true)
      expect(field.internalsController).toBeDefined()
      expect(field.checkValidity()).toBe(true)

      const input = field.inputElement!
      expect(input).toBeInstanceOf(HTMLInputElement)
      expect(input.value).toBe('initial')

      // Simulate input event
      let inputEventFired = false
      field.addEventListener('input', () => {
        inputEventFired = true
      })
      await simulateInput(input, 'updated')
      expect(field.value).toBe('updated')
      expect(inputEventFired).toBe(true)
    })

    it('FRM-TXT-02: Required validation flags valueMissing and limits message <= 200 chars', async () => {
      const field = await mount<MoulTextField>(
        html`<moul-text-field is-required label="Username"></moul-text-field>`,
      )
      await awaitNestedUpdates(field)

      expect(field.checkValidity()).toBe(false)
      expect(field.validity?.valueMissing).toBe(true)
      expect(field.validationMessage.length).toBeLessThanOrEqual(200)
      expect(field.hasAttribute('is-invalid')).toBe(true)

      // Populating clears valueMissing
      field.value = 'validUser'
      await awaitNestedUpdates(field)
      expect(field.checkValidity()).toBe(true)
      expect(field.validity?.valueMissing).toBe(false)
      expect(field.hasAttribute('is-invalid')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. MoulNumberField (`moul-number-field`)
  // ---------------------------------------------------------------------------
  describe('MoulNumberField (`moul-number-field`)', () => {
    it('FRM-NUM-01: Numeric constraints, stepper controls, and bounds clamping', async () => {
      const field = await mount<MoulNumberField>(
        html`<moul-number-field min="0" max="10" step="2" value="4" label="Quantity"></moul-number-field>`,
      )

      expect(field.value).toBe(4)

      // Step up (+2)
      field.stepUp()
      expect(field.value).toBe(6)

      // Step down (-2)
      field.stepDown()
      expect(field.value).toBe(4)

      // Clamp at max
      field.value = 10
      await awaitNestedUpdates(field)
      field.stepUp()
      expect(field.value).toBe(10)

      // Clamp at min
      field.value = 0
      await awaitNestedUpdates(field)
      field.stepDown()
      expect(field.value).toBe(0)

      // Arrow keys
      await simulateKey(field.inputElement!, 'ArrowUp')
      expect(field.value).toBe(2)
      await simulateKey(field.inputElement!, 'ArrowDown')
      expect(field.value).toBe(0)

      // Home and End keys
      await simulateKey(field.inputElement!, 'End')
      expect(field.value).toBe(10)
      await simulateKey(field.inputElement!, 'Home')
      expect(field.value).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. MoulSearchField (`moul-search-field`)
  // ---------------------------------------------------------------------------
  describe('MoulSearchField (`moul-search-field`)', () => {
    it('FRM-SCH-01: Search landmark, clear button, submit on Enter, and clear on Escape', async () => {
      const field = await mount<MoulSearchField>(
        html`<moul-search-field value="query" label="Search"></moul-search-field>`,
      )

      const searchWrapper = field.renderRoot.querySelector('search')
      expect(searchWrapper).not.toBeNull()

      const clearBtn = field.renderRoot.querySelector(
        '[part="clear-btn"]',
      ) as HTMLButtonElement
      expect(clearBtn).not.toBeNull()

      // Click clear button
      let clearFired = false
      field.addEventListener('clear', () => {
        clearFired = true
      })
      clearBtn.click()
      await awaitNestedUpdates(field)

      expect(field.value).toBe('')
      expect(clearFired).toBe(true)

      // Enter key submits
      field.value = 'kittens'
      await awaitNestedUpdates(field)

      let submitDetail: string | null = null
      field.addEventListener('submit', (e: Event) => {
        submitDetail = (e as CustomEvent).detail.value
      })
      await simulateKey(field.inputElement!, 'Enter')
      expect(submitDetail).toBe('kittens')

      // Escape key clears
      await simulateKey(field.inputElement!, 'Escape')
      expect(field.value).toBe('')
    })
  })

  // ---------------------------------------------------------------------------
  // 5. MoulTextArea (`moul-text-area`)
  // ---------------------------------------------------------------------------
  describe('MoulTextArea (`moul-text-area`)', () => {
    it('FRM-TXA-01: Multiline textarea, rows attribute, and auto-resize capability', async () => {
      const area = await mount<MoulTextArea>(
        html`<moul-text-area rows="4" auto-resize label="Bio" value="Hello\nWorld"></moul-text-area>`,
      )

      const textarea = area.textareaElement!
      expect(textarea).toBeInstanceOf(HTMLTextAreaElement)
      expect(Number(textarea.rows)).toBe(4)
      expect(textarea.value).toBe('Hello\nWorld')

      await simulateInput(textarea, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
      expect(area.value).toBe('Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
    })
  })

  // ---------------------------------------------------------------------------
  // 6. MoulCheckbox & MoulCheckboxGroup (`moul-checkbox` & `moul-checkbox-group`)
  // ---------------------------------------------------------------------------
  describe('MoulCheckbox (`moul-checkbox`)', () => {
    it('FRM-CHK-01: Checked state, toggle, Space key, and indeterminate support', async () => {
      const checkbox = await mount<MoulCheckbox>(
        html`<moul-checkbox value="agree" label="I agree"></moul-checkbox>`,
      )

      expect(checkbox.isChecked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('false')

      // Click toggles checked
      let changeFired = false
      checkbox.addEventListener(
        'change',
        (e: Event) => {
          changeFired = true
          expect((e as CustomEvent).detail.isChecked).toBe(true)
          expect((e as CustomEvent).detail.value).toBe('agree')
        },
        { once: true },
      )
      await simulatePress(checkbox)
      expect(checkbox.isChecked).toBe(true)
      expect(checkbox.getAttribute('aria-checked')).toBe('true')
      expect(changeFired).toBe(true)

      // Space key toggles
      await simulateKey(checkbox, ' ')
      expect(checkbox.isChecked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('false')

      // Indeterminate mode
      checkbox.isIndeterminate = true
      await awaitNestedUpdates(checkbox)
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed')
    })
  })

  describe('MoulCheckboxGroup (`moul-checkbox-group`)', () => {
    it('FRM-CKG-01: Synchronizes array of checked values across child checkboxes', async () => {
      const group = await mount<MoulCheckboxGroup>(
        html`
          <moul-checkbox-group label="Interests" .value=${['art']}>
            <moul-checkbox value="tech" label="Technology"></moul-checkbox>
            <moul-checkbox value="art" label="Art"></moul-checkbox>
            <moul-checkbox value="music" label="Music"></moul-checkbox>
          </moul-checkbox-group>
        `,
      )

      const checkboxes = group.checkboxes
      expect(checkboxes[0].isChecked).toBe(false)
      expect(checkboxes[1].isChecked).toBe(true)
      expect(checkboxes[2].isChecked).toBe(false)

      let groupChangeValue: string[] = []
      group.addEventListener('change', (e: Event) => {
        groupChangeValue = (e as CustomEvent).detail.value
      })

      // Toggle first checkbox
      checkboxes[0].toggle()
      await awaitNestedUpdates(group)

      expect(group.value).toContain('tech')
      expect(group.value).toContain('art')
      expect(groupChangeValue).toEqual(['tech', 'art'])
    })
  })

  // ---------------------------------------------------------------------------
  // 7. MoulRadioGroup & MoulRadio (`moul-radio-group` & `moul-radio`)
  // ---------------------------------------------------------------------------
  describe('MoulRadioGroup (`moul-radio-group`) & MoulRadio (`moul-radio`)', () => {
    it('FRM-RAD-01: Mutual exclusion, arrow key roving navigation, and selection events', async () => {
      const group = await mount<MoulRadioGroup>(
        html`
          <moul-radio-group label="Plan" value="pro">
            <moul-radio value="free">Free</moul-radio>
            <moul-radio value="pro">Pro</moul-radio>
            <moul-radio value="enterprise">Enterprise</moul-radio>
          </moul-radio-group>
        `,
      )

      const radios = group.radios
      expect(radios[0].isChecked).toBe(false)
      expect(radios[1].isChecked).toBe(true)
      expect(radios[2].isChecked).toBe(false)

      let changeValue = ''
      group.addEventListener('change', (e: Event) => {
        changeValue = (e as CustomEvent).detail.value
      })

      // Click free radio
      await simulatePress(radios[0])
      expect(group.value).toBe('free')
      expect(radios[0].isChecked).toBe(true)
      expect(radios[1].isChecked).toBe(false)
      expect(changeValue).toBe('free')

      // Arrow down key moves to next radio
      await simulateKey(group, 'ArrowDown')
      expect(group.value).toBe('pro')
      expect(radios[1].isChecked).toBe(true)
      expect(radios[0].isChecked).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // 8. MoulSwitch (`moul-switch`)
  // ---------------------------------------------------------------------------
  describe('MoulSwitch (`moul-switch`)', () => {
    it('FRM-SWT-01: Role switch, aria-checked synchronization, and toggle action', async () => {
      const sw = await mount<MoulSwitch>(
        html`<moul-switch label="Notifications" value="notifs"></moul-switch>`,
      )

      expect(sw.getAttribute('role')).toBe('switch')
      expect(sw.isChecked).toBe(false)
      expect(sw.getAttribute('aria-checked')).toBe('false')

      let changeChecked = false
      sw.addEventListener('change', (e: Event) => {
        changeChecked = (e as CustomEvent).detail.isChecked
      })

      // Click toggle
      await simulatePress(sw)
      expect(sw.isChecked).toBe(true)
      expect(sw.getAttribute('aria-checked')).toBe('true')
      expect(changeChecked).toBe(true)

      // Enter key toggle
      await simulateKey(sw, 'Enter')
      expect(sw.isChecked).toBe(false)
      expect(sw.getAttribute('aria-checked')).toBe('false')
    })
  })

  // ---------------------------------------------------------------------------
  // 9. MoulSlider (`moul-slider`)
  // ---------------------------------------------------------------------------
  describe('MoulSlider (`moul-slider`)', () => {
    it('FRM-SLD-01: Range slider attributes, Arrow keys, Home/End, and output display', async () => {
      const slider = await mount<MoulSlider>(
        html`<moul-slider min="0" max="100" step="5" value="50" label="Volume"></moul-slider>`,
      )

      const thumb = slider.thumbElement!
      expect(thumb.getAttribute('role')).toBe('slider')
      expect(thumb.getAttribute('aria-valuenow')).toBe('50')
      expect(thumb.getAttribute('aria-valuemin')).toBe('0')
      expect(thumb.getAttribute('aria-valuemax')).toBe('100')

      // ArrowRight increases
      await simulateKey(thumb, 'ArrowRight')
      expect(slider.value).toBe(55)

      // ArrowLeft decreases
      await simulateKey(thumb, 'ArrowLeft')
      expect(slider.value).toBe(50)

      // End key jumps to max
      await simulateKey(thumb, 'End')
      expect(slider.value).toBe(100)

      // Home key jumps to min
      await simulateKey(thumb, 'Home')
      expect(slider.value).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // 10. MoulInputOTP (`moul-input-otp`)
  // ---------------------------------------------------------------------------
  describe('MoulInputOTP (`moul-input-otp`)', () => {
    it('FRM-OTP-01: Digit slots, auto-advance, backspace navigation, and paste distribution', async () => {
      const otp = await mount<MoulInputOTP>(
        html`<moul-input-otp length="6" label="Verification Code"></moul-input-otp>`,
      )

      const slots = otp.slotInputs
      expect(slots.length).toBe(6)

      let completeValue = ''
      otp.addEventListener('complete', (e: Event) => {
        completeValue = (e as CustomEvent).detail.value
      })

      // Simulate paste of 6 digits
      const pasteEvent = new Event('paste', {
        bubbles: true,
        cancelable: true,
      }) as any
      pasteEvent.clipboardData = {
        getData: (type: string) => (type === 'text' ? '987654' : ''),
      }
      slots[0].dispatchEvent(pasteEvent)
      await awaitNestedUpdates(otp)

      expect(otp.value).toBe('987654')
      expect(completeValue).toBe('987654')

      // Backspace clears last digit
      await simulateKey(slots[5], 'Backspace')
      expect(otp.value).toBe('98765')
    })
  })

  // ---------------------------------------------------------------------------
  // 11. MoulSelect & MoulSelectItem (`moul-select` & `moul-select-item`)
  // ---------------------------------------------------------------------------
  describe('MoulSelect (`moul-select`)', () => {
    it('FRM-SEL-01: Popover dropdown toggle, item selection, and events', async () => {
      const select = await mount<MoulSelect>(
        html`
          <moul-select label="Country" placeholder="Choose a country">
            <moul-select-item key="kh" value="Cambodia">Cambodia</moul-select-item>
            <moul-select-item key="us" value="United States">United States</moul-select-item>
            <moul-select-item key="fr" value="France">France</moul-select-item>
          </moul-select>
        `,
      )

      expect(select.isOpen).toBe(false)

      let selectionKey = ''
      select.addEventListener('selectionchange', (e: Event) => {
        selectionKey = (e as CustomEvent).detail.selectedKey
      })

      // Click trigger opens dropdown
      await simulatePress(select.triggerButton!)
      expect(select.isOpen).toBe(true)

      // Select first item
      const items = select.items
      items[0].click()
      await awaitNestedUpdates(select)

      expect(select.isOpen).toBe(false)
      expect(select.selectedKey).toBe('kh')
      expect(selectionKey).toBe('kh')
      expect(select.selectedText).toBe('Cambodia')
    })
  })

  // ---------------------------------------------------------------------------
  // 12. MoulComboBox & MoulComboBoxItem (`moul-combobox` & `moul-combobox-item`)
  // ---------------------------------------------------------------------------
  describe('MoulComboBox (`moul-combobox`)', () => {
    it('FRM-CMB-01: Live filtering of items, selection, and empty state', async () => {
      const combobox = await mount<MoulComboBox>(
        html`
          <moul-combobox label="Framework">
            <moul-combobox-item key="lit" text-value="Lit">Lit</moul-combobox-item>
            <moul-combobox-item key="svelte" text-value="Svelte">Svelte</moul-combobox-item>
            <moul-combobox-item key="vue" text-value="Vue">Vue</moul-combobox-item>
          </moul-combobox>
        `,
      )

      const input = combobox.inputElement!
      expect(combobox.isOpen).toBe(false)

      // Type "Li" to filter
      await simulateInput(input, 'Li')
      expect(combobox.isOpen).toBe(true)
      expect(combobox.items[0].hidden).toBe(false)
      expect(combobox.items[1].hidden).toBe(true)
      expect(combobox.items[2].hidden).toBe(true)

      // Select matching item
      combobox.items[0].click()
      await awaitNestedUpdates(combobox)

      expect(combobox.isOpen).toBe(false)
      expect(combobox.selectedKey).toBe('lit')
      expect(combobox.inputValue).toBe('Lit')
    })
  })

  // ---------------------------------------------------------------------------
  // 13. MoulCalendar (`moul-calendar`)
  // ---------------------------------------------------------------------------
  describe('MoulCalendar (`moul-calendar`)', () => {
    it('FRM-CAL-01: Intl.DateTimeFormat month header, navigation, and date selection', async () => {
      const calendar = await mount<MoulCalendar>(
        html`<moul-calendar locale="en-US" value="2026-10-15"></moul-calendar>`,
      )

      const heading = calendar.renderRoot.querySelector('[part="heading"]')
      expect(heading?.textContent).toContain('October 2026')

      let selectedDate = ''
      calendar.addEventListener('change', (e: Event) => {
        selectedDate = (e as CustomEvent).detail.value
      })

      // Next month button
      const nextBtn = calendar.renderRoot.querySelector(
        '[part="nav-btn nav-btn-next"]',
      ) as HTMLButtonElement
      nextBtn.click()
      await awaitNestedUpdates(calendar)
      expect(heading?.textContent).toContain('November 2026')

      // Previous month button
      const prevBtn = calendar.renderRoot.querySelector(
        '[part="nav-btn nav-btn-prev"]',
      ) as HTMLButtonElement
      prevBtn.click()
      await awaitNestedUpdates(calendar)
      expect(heading?.textContent).toContain('October 2026')

      // Select a date cell
      calendar.selectDate('2026-10-20')
      expect(calendar.value).toBe('2026-10-20')
      expect(selectedDate).toBe('2026-10-20')
    })
  })

  // ---------------------------------------------------------------------------
  // 14. MoulDatePicker (`moul-date-picker`)
  // ---------------------------------------------------------------------------
  describe('MoulDatePicker (`moul-date-picker`)', () => {
    it('FRM-DTP-01: Form-associated picker, calendar dropdown, and date selection', async () => {
      const picker = await mount<MoulDatePicker>(
        html`<moul-date-picker label="Birthdate" value="2026-05-10" locale="en-US"></moul-date-picker>`,
      )

      expect(picker.value).toBe('2026-05-10')
      expect(picker.formattedDisplayDate).toContain('May 10, 2026')

      const triggerBtn = picker.renderRoot.querySelector(
        '[part="trigger-btn"]',
      ) as HTMLButtonElement
      expect(picker.isOpen).toBe(false)

      // Click trigger opens popover
      triggerBtn.click()
      await awaitNestedUpdates(picker)
      expect(picker.isOpen).toBe(true)

      let changedDate = ''
      picker.addEventListener('change', (e: Event) => {
        changedDate = (e as CustomEvent).detail.value
      })

      // Calendar change event updates picker and closes popover
      const calendar = picker.calendarElement!
      calendar.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: '2026-05-25' },
          bubbles: true,
          composed: true,
        }),
      )
      await awaitNestedUpdates(picker)

      expect(picker.isOpen).toBe(false)
      expect(picker.value).toBe('2026-05-25')
      expect(changedDate).toBe('2026-05-25')
    })
  })
})
