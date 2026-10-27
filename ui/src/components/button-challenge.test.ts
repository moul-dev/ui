import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './Button/Button'
import './ButtonGroup/ButtonGroup'
import './Spinner/Spinner'
import type { MoulButton } from './Button/Button'
import type {
  ButtonGroupOrientation,
  ButtonGroupSpacing,
  MoulButtonGroup,
} from './ButtonGroup/ButtonGroup'

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

describe('Empirical Adversarial Challenge Suite: Button & ButtonGroup', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // Challenge 1: Burst Interactions & Pending State Immunity
  // =========================================================================
  describe('Challenge 1: Burst Interactions & Pending State Immunity', () => {
    it('CHAL-BTN-01: 50 rapid synthetic clicks during is-pending=true fire 0 press events and 0 form submits', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)
      let formSubmits = 0
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        formSubmits++
      })

      const btn = document.createElement('moul-button') as MoulButton
      btn.type = 'submit'
      btn.isPending = true
      btn.textContent = 'Submit Action'
      form.appendChild(btn)
      await awaitNestedUpdates(btn)

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      // 50 rapid synthetic clicks
      const BURST_COUNT = 50
      for (let i = 0; i < BURST_COUNT; i++) {
        btn.click()
      }

      await awaitNestedUpdates(btn)
      expect(pressCount).toBe(0)
      expect(formSubmits).toBe(0)
    })

    it('CHAL-BTN-02: 50 rapid pointerdown+pointerup+click bursts during is-pending=true fire 0 press events', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button is-pending>Pending Button</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      for (let i = 0; i < 50; i++) {
        await simulatePress(btn)
      }

      expect(pressCount).toBe(0)
    })

    it('CHAL-BTN-03: Switching is-pending from true to false instantly restores interaction and press events', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button is-pending>Dynamic Button</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      // Attempt press while pending
      await simulatePress(btn)
      expect(pressCount).toBe(0)

      // Restore to active
      btn.isPending = false
      await awaitNestedUpdates(btn)
      expect(btn.hasAttribute('is-pending')).toBe(false)
      expect(btn.hasAttribute('aria-busy')).toBe(false)

      await simulatePress(btn)
      expect(pressCount).toBe(1)
    })

    it('CHAL-BTN-04: Pending state renders inline spinner with size="sm" and part="spinner", and aria-busy="true"', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button is-pending>Loading</moul-button>`,
      )

      expect(btn.getAttribute('aria-busy')).toBe('true')
      const innerBtn = btn.shadowRoot?.querySelector('button')
      expect(innerBtn?.getAttribute('aria-busy')).toBe('true')

      const spinner = btn.shadowRoot?.querySelector('moul-spinner')
      expect(spinner).not.toBeNull()
      expect(spinner?.getAttribute('size')).toBe('sm')
      expect(spinner?.getAttribute('part')).toBe('spinner')
    })

    it('CHAL-BTN-05: Space and Enter keypresses during is-pending=true fire 0 press events', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button is-pending>Key Pending</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      await simulateKey(btn, ' ')
      await simulateKey(btn, 'Enter')

      expect(pressCount).toBe(0)
    })

    it('CHAL-BTN-06: 50 rapid synthetic clicks during is-disabled=true fire 0 press events', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button is-disabled>Disabled Button</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      for (let i = 0; i < 50; i++) {
        btn.click()
      }

      await awaitNestedUpdates(btn)
      expect(pressCount).toBe(0)
    })
  })

  // =========================================================================
  // Challenge 2: Dynamic Disabled & Pending State Toggling During Active Pointer Events
  // =========================================================================
  describe('Challenge 2: Dynamic Disabled & Pending State Toggling During Active Pointer Events', () => {
    it('CHAL-BTN-07: Pointerdown when enabled -> dynamically set isDisabled=true before pointerup -> 0 press events fire', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Interruptible Button</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      // Pointerdown initiates press cycle
      btn.dispatchEvent(
        new PointerEvent('pointerdown', {
          button: 0,
          bubbles: true,
          cancelable: true,
        }),
      )

      // Dynamically disable button before pointerup
      btn.isDisabled = true
      await awaitNestedUpdates(btn)

      btn.dispatchEvent(
        new PointerEvent('pointerup', {
          button: 0,
          bubbles: true,
          cancelable: true,
        }),
      )
      btn.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(btn)

      expect(pressCount).toBe(0)
    })

    it('CHAL-BTN-08: Pointerdown when enabled -> dynamically set isPending=true before pointerup -> 0 press events fire', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Interruptible Pending</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      btn.dispatchEvent(
        new PointerEvent('pointerdown', {
          button: 0,
          bubbles: true,
          cancelable: true,
        }),
      )

      // Dynamically make button pending before pointerup
      btn.isPending = true
      await awaitNestedUpdates(btn)

      btn.dispatchEvent(
        new PointerEvent('pointerup', {
          button: 0,
          bubbles: true,
          cancelable: true,
        }),
      )
      btn.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(btn)

      expect(pressCount).toBe(0)
    })

    it('CHAL-BTN-09: 100 rapid toggles between isDisabled true/false leaves button in consistent DOM state matching final boolean', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Stress Toggle</moul-button>`,
      )

      for (let i = 1; i <= 100; i++) {
        btn.isDisabled = i % 2 === 1
      }
      await awaitNestedUpdates(btn)

      // After 100 toggles (even number), isDisabled should be false
      expect(btn.isDisabled).toBe(false)
      expect(btn.hasAttribute('is-disabled')).toBe(false)
      expect(btn.hasAttribute('aria-disabled')).toBe(false)
      const innerBtn = btn.shadowRoot?.querySelector('button')
      expect(innerBtn?.hasAttribute('disabled')).toBe(false)

      // Should be clickable now
      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })
      await simulatePress(btn)
      expect(pressCount).toBe(1)
    })

    it('CHAL-BTN-10: 100 rapid toggles between isPending true/false leaves aria-busy and spinner in consistent DOM state', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Stress Pending</moul-button>`,
      )

      for (let i = 1; i <= 101; i++) {
        btn.isPending = i % 2 === 1
      }
      await awaitNestedUpdates(btn)

      // After 101 toggles (odd number), isPending should be true
      expect(btn.isPending).toBe(true)
      expect(btn.hasAttribute('is-pending')).toBe(true)
      expect(btn.getAttribute('aria-busy')).toBe('true')
      expect(btn.shadowRoot?.querySelector('moul-spinner')).not.toBeNull()

      // Toggle one more time to make it false
      btn.isPending = false
      await awaitNestedUpdates(btn)
      expect(btn.isPending).toBe(false)
      expect(btn.hasAttribute('is-pending')).toBe(false)
      expect(btn.hasAttribute('aria-busy')).toBe(false)
      expect(btn.shadowRoot?.querySelector('moul-spinner')).toBeNull()
    })

    it('CHAL-BTN-11: Secondary pointer button (right click button=2) does not trigger press', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Right Click Test</moul-button>`,
      )

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      btn.dispatchEvent(
        new PointerEvent('pointerdown', {
          button: 2,
          bubbles: true,
          cancelable: true,
        }),
      )
      btn.dispatchEvent(
        new PointerEvent('pointerup', {
          button: 2,
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(btn)

      expect(pressCount).toBe(0)
    })
  })

  // =========================================================================
  // Challenge 3: Form Submission Stress & Deep/Detached DOM Hierarchies
  // =========================================================================
  describe('Challenge 3: Form Submission Stress & Deep/Detached DOM Hierarchies', () => {
    it('CHAL-BTN-12: type="submit" and type="reset" inside a 20-level deeply nested DOM structure within form', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)

      let submitted = false
      let reset = false
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        submitted = true
      })
      form.addEventListener('reset', (e) => {
        e.preventDefault()
        reset = true
      })

      // Construct a 20-level deep nesting hierarchy
      let currentParent: HTMLElement = form
      for (let i = 0; i < 20; i++) {
        const wrapper = document.createElement('div')
        wrapper.setAttribute('data-depth', String(i))
        currentParent.appendChild(wrapper)
        currentParent = wrapper
      }

      const submitBtn = document.createElement('moul-button') as MoulButton
      submitBtn.type = 'submit'
      submitBtn.textContent = 'Deep Submit'
      currentParent.appendChild(submitBtn)

      const resetBtn = document.createElement('moul-button') as MoulButton
      resetBtn.type = 'reset'
      resetBtn.textContent = 'Deep Reset'
      currentParent.appendChild(resetBtn)

      await awaitNestedUpdates(form)

      submitBtn.click()
      expect(submitted).toBe(true)

      resetBtn.click()
      expect(reset).toBe(true)
    })

    it('CHAL-BTN-13: Button inside detached <form> element vs dynamically attached form', async () => {
      // 1. Detached form: native DOM specification prevents submission when form is not connected
      const detachedForm = document.createElement('form')
      let detachedSubmitted = false
      detachedForm.addEventListener('submit', (e) => {
        e.preventDefault()
        detachedSubmitted = true
      })
      const detachedBtn = document.createElement('moul-button') as MoulButton
      detachedBtn.type = 'submit'
      detachedForm.appendChild(detachedBtn)

      expect(() => detachedBtn.click()).not.toThrow()
      expect(detachedSubmitted).toBe(false)

      // 2. Dynamically attached form test: once connected to document, submission and reset succeed
      const dynForm = document.createElement('form')
      let dynSubmitted = false
      let dynReset = false
      dynForm.addEventListener('submit', (e) => {
        e.preventDefault()
        dynSubmitted = true
      })
      dynForm.addEventListener('reset', (e) => {
        e.preventDefault()
        dynReset = true
      })

      const submitBtn = document.createElement('moul-button') as MoulButton
      submitBtn.type = 'submit'
      dynForm.appendChild(submitBtn)

      const resetBtn = document.createElement('moul-button') as MoulButton
      resetBtn.type = 'reset'
      dynForm.appendChild(resetBtn)

      // Dynamically attach form to document.body
      document.body.appendChild(dynForm)
      await awaitNestedUpdates(dynForm)

      submitBtn.click()
      expect(dynSubmitted).toBe(true)

      resetBtn.click()
      expect(dynReset).toBe(true)

      // 3. Detached form test (detached after being connected): safe no-op
      document.body.removeChild(dynForm)
      await awaitNestedUpdates(dynForm)

      let postDetachSubmitted = false
      dynForm.addEventListener('submit', (e) => {
        e.preventDefault()
        postDetachSubmitted = true
      })
      submitBtn.click()
      expect(postDetachSubmitted).toBe(false)
    })

    it('CHAL-BTN-14: Button dynamically migrated from Form A to Form B routes submission strictly to Form B', async () => {
      const formA = document.createElement('form')
      const formB = document.createElement('form')
      document.body.appendChild(formA)
      document.body.appendChild(formB)

      let formASubmits = 0
      let formBSubmits = 0
      formA.addEventListener('submit', (e) => {
        e.preventDefault()
        formASubmits++
      })
      formB.addEventListener('submit', (e) => {
        e.preventDefault()
        formBSubmits++
      })

      const btn = document.createElement('moul-button') as MoulButton
      btn.type = 'submit'
      formA.appendChild(btn)
      await awaitNestedUpdates(btn)

      // Click in Form A
      btn.click()
      expect(formASubmits).toBe(1)
      expect(formBSubmits).toBe(0)

      // Move to Form B
      formB.appendChild(btn)
      await awaitNestedUpdates(btn)

      btn.click()
      expect(formASubmits).toBe(1)
      expect(formBSubmits).toBe(1)
    })

    it('CHAL-BTN-15: Button removed from form into orphan container does not throw or submit orphaned forms', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)
      let formSubmits = 0
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        formSubmits++
      })

      const btn = document.createElement('moul-button') as MoulButton
      btn.type = 'submit'
      form.appendChild(btn)
      await awaitNestedUpdates(btn)

      // Move button outside form
      const standaloneContainer = document.createElement('div')
      document.body.appendChild(standaloneContainer)
      standaloneContainer.appendChild(btn)
      await awaitNestedUpdates(btn)

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      expect(() => btn.click()).not.toThrow()
      expect(pressCount).toBe(1)
      expect(formSubmits).toBe(0)
    })

    it('CHAL-BTN-16: type="button" inside form never triggers submit or reset across pointer or keyboard triggers', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)
      let formSubmits = 0
      let formResets = 0
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        formSubmits++
      })
      form.addEventListener('reset', (e) => {
        e.preventDefault()
        formResets++
      })

      const btn = document.createElement('moul-button') as MoulButton
      btn.type = 'button'
      form.appendChild(btn)
      await awaitNestedUpdates(btn)

      let pressCount = 0
      btn.addEventListener('press', () => {
        pressCount++
      })

      btn.click()
      await simulatePress(btn)
      await simulateKey(btn, 'Enter')
      await simulateKey(btn, ' ')

      expect(pressCount).toBe(4)
      expect(formSubmits).toBe(0)
      expect(formResets).toBe(0)
    })

    it('CHAL-BTN-17: Disabled or pending submit button inside form prevents form submission on both pointer and programmatic click', async () => {
      const form = document.createElement('form')
      document.body.appendChild(form)
      let formSubmits = 0
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        formSubmits++
      })

      const btn = document.createElement('moul-button') as MoulButton
      btn.type = 'submit'
      btn.isDisabled = true
      form.appendChild(btn)
      await awaitNestedUpdates(btn)

      btn.click()
      await simulatePress(btn)
      expect(formSubmits).toBe(0)

      btn.isDisabled = false
      btn.isPending = true
      await awaitNestedUpdates(btn)

      btn.click()
      await simulatePress(btn)
      expect(formSubmits).toBe(0)
    })
  })

  // =========================================================================
  // Challenge 4: Dev Warning Verification (warnMissingLabel)
  // =========================================================================
  describe('Challenge 4: Dev Warning Verification (warnMissingLabel)', () => {
    it('CHAL-BTN-18: Icon-only button lacking accessible label triggers warnMissingLabel exactly once on initial mount', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const btn = await mount<MoulButton>(
        html`<moul-button is-icon></moul-button>`,
      )
      expect(btn).not.toBeNull()

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '<moul-button> is missing an accessible label (icon-only button)',
        ),
      )
    })

    it('CHAL-BTN-19: Icon-only button with aria-label does NOT trigger warnMissingLabel', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await mount<MoulButton>(
        html`<moul-button is-icon aria-label="Settings navigation"></moul-button>`,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('CHAL-BTN-20: Icon-only button with aria-labelledby does NOT trigger warnMissingLabel', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const heading = document.createElement('span')
      heading.id = 'icon-btn-label'
      heading.textContent = 'Settings'
      document.body.appendChild(heading)

      await mount<MoulButton>(
        html`<moul-button is-icon aria-labelledby="icon-btn-label"></moul-button>`,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('CHAL-BTN-21: Icon-only button with visible text content does NOT trigger warnMissingLabel', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await mount<MoulButton>(
        html`<moul-button is-icon><span>Close</span></moul-button>`,
      )
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('CHAL-BTN-22: Icon-only button with whitespace-only aria-label triggers warning', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await mount<MoulButton>(
        html`<moul-button is-icon aria-label="   \t   "></moul-button>`,
      )
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is missing an accessible label'),
      )
    })

    it('CHAL-BTN-23: Non-icon button without aria-label does NOT trigger warnMissingLabel', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await mount<MoulButton>(html`<moul-button>Regular Text</moul-button>`)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('CHAL-BTN-24: Production environment (NODE_ENV=production) suppresses warnMissingLabel completely', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        await mount<MoulButton>(html`<moul-button is-icon></moul-button>`)
        expect(warnSpy).not.toHaveBeenCalled()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('CHAL-BTN-25: Subsequent property updates on unlabelled icon button behavior check', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const btn = await mount<MoulButton>(
        html`<moul-button is-icon></moul-button>`,
      )
      expect(warnSpy).toHaveBeenCalledTimes(1)

      // When another property changes on unlabelled icon button
      btn.size = 'lg'
      await awaitNestedUpdates(btn)

      // Observe if warnMissingLabel is called again
      expect(warnSpy).toHaveBeenCalledTimes(2)
    })
  })

  // =========================================================================
  // Challenge 5: moul-button-group Dynamic Modifications & Propagation Stress
  // =========================================================================
  describe('Challenge 5: moul-button-group Dynamic Modifications & Propagation Stress', () => {
    it('CHAL-GRP-01: Dynamic addition of child buttons via DOM appendChild inherits group disabled state', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group is-disabled>
          <moul-button id="b1">First</moul-button>
          <moul-button id="b2">Second</moul-button>
        </moul-button-group>
      `)

      const b1 = group.querySelector<MoulButton>('#b1')!
      const b2 = group.querySelector<MoulButton>('#b2')!
      expect(b1.isDisabled).toBe(true)
      expect(b2.isDisabled).toBe(true)

      // Dynamically append new button
      const b3 = document.createElement('moul-button') as MoulButton
      b3.id = 'b3'
      b3.textContent = 'Third'
      group.appendChild(b3)
      await awaitNestedUpdates(group)

      // Trigger slot change or group updateComplete
      group.requestUpdate()
      await awaitNestedUpdates(group)

      expect(b3.isDisabled).toBe(true)
    })

    it('CHAL-GRP-02: Dynamic removal of child buttons updates group cleanly without orphaned listeners', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group>
          <moul-button id="rem1">Button 1</moul-button>
          <moul-button id="rem2">Button 2</moul-button>
        </moul-button-group>
      `)

      const rem1 = group.querySelector<MoulButton>('#rem1')!
      group.removeChild(rem1)
      await awaitNestedUpdates(group)

      expect(group.children.length).toBe(1)
      expect(group.querySelector('#rem1')).toBeNull()
      expect(group.querySelector('#rem2')).not.toBeNull()
    })

    it('CHAL-GRP-03: Dynamic switching of orientation (horizontal <-> vertical) updates aria-orientation and reflects attribute', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group orientation="horizontal">
          <moul-button>One</moul-button>
          <moul-button>Two</moul-button>
        </moul-button-group>
      `)

      expect(group.orientation).toBe('horizontal')
      expect(group.getAttribute('aria-orientation')).toBe('horizontal')

      // Switch to vertical
      group.orientation = 'vertical'
      await awaitNestedUpdates(group)

      expect(group.getAttribute('orientation')).toBe('vertical')
      expect(group.getAttribute('aria-orientation')).toBe('vertical')

      // Switch back to horizontal
      group.orientation = 'horizontal'
      await awaitNestedUpdates(group)

      expect(group.getAttribute('orientation')).toBe('horizontal')
      expect(group.getAttribute('aria-orientation')).toBe('horizontal')
    })

    it('CHAL-GRP-04: Dynamic switching of spacing (none <-> sm <-> md) reflects attribute accurately', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group spacing="sm">
          <moul-button>A</moul-button>
          <moul-button>B</moul-button>
        </moul-button-group>
      `)

      const spacings: ButtonGroupSpacing[] = ['none', 'sm', 'md']
      for (const sp of spacings) {
        group.spacing = sp
        await awaitNestedUpdates(group)
        expect(group.spacing).toBe(sp)
        expect(group.getAttribute('spacing')).toBe(sp)
      }
    })

    it('CHAL-GRP-05: Group disabled state toggling propagates synchronously to all slotted moul-button elements', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group>
          <moul-button id="g1">Btn 1</moul-button>
          <moul-button id="g2">Btn 2</moul-button>
          <moul-button id="g3">Btn 3</moul-button>
        </moul-button-group>
      `)

      const buttons = Array.from(
        group.querySelectorAll<MoulButton>('moul-button'),
      )
      for (const b of buttons) {
        expect(b.isDisabled).toBe(false)
      }

      // Disable group
      group.isDisabled = true
      await awaitNestedUpdates(group)
      for (const b of buttons) {
        expect(b.isDisabled).toBe(true)
        expect(b.hasAttribute('is-disabled')).toBe(true)
        expect(b.getAttribute('aria-disabled')).toBe('true')
      }

      // Re-enable group
      group.isDisabled = false
      await awaitNestedUpdates(group)
      for (const b of buttons) {
        expect(b.isDisabled).toBe(false)
        expect(b.hasAttribute('is-disabled')).toBe(false)
        expect(b.hasAttribute('aria-disabled')).toBe(false)
      }
    })

    it('CHAL-GRP-06: Group disabled state propagates to non-Lit standard HTMLElement children via is-disabled attribute', async () => {
      const group = await mount<MoulButtonGroup>(html`
        <moul-button-group>
          <button id="native-btn" type="button">Native Button</button>
          <div id="custom-div">Custom Item</div>
        </moul-button-group>
      `)

      const nativeBtn = group.querySelector('#native-btn')!
      const customDiv = group.querySelector('#custom-div')!

      group.isDisabled = true
      await awaitNestedUpdates(group)

      expect(nativeBtn.hasAttribute('is-disabled')).toBe(true)
      expect(customDiv.hasAttribute('is-disabled')).toBe(true)

      group.isDisabled = false
      await awaitNestedUpdates(group)

      expect(nativeBtn.hasAttribute('is-disabled')).toBe(false)
      expect(customDiv.hasAttribute('is-disabled')).toBe(false)
    })
  })

  // =========================================================================
  // Challenge 6: Fast-Check Property Stress Testing
  // =========================================================================
  describe('Challenge 6: Fast-Check Property Stress Testing', () => {
    it('CHAL-PBT-01: Invariant: when isDisabled=true or isPending=true, no clicks/keys dispatch press event', async () => {
      const btn = await mount<MoulButton>(
        html`<moul-button>Property Button</moul-button>`,
      )

      const stateArb = fc.record({
        isDisabled: fc.boolean(),
        isPending: fc.boolean(),
        interactionType: fc.constantFrom('click', 'pointer', 'space', 'enter'),
      })

      let totalPressEvents = 0
      btn.addEventListener('press', () => {
        totalPressEvents++
      })

      await fc.assert(
        fc.asyncProperty(
          stateArb,
          async ({ isDisabled, isPending, interactionType }) => {
            btn.isDisabled = isDisabled
            btn.isPending = isPending
            await awaitNestedUpdates(btn)

            const beforeCount = totalPressEvents

            if (interactionType === 'click') {
              btn.click()
            } else if (interactionType === 'pointer') {
              await simulatePress(btn)
            } else if (interactionType === 'space') {
              await simulateKey(btn, ' ')
            } else if (interactionType === 'enter') {
              await simulateKey(btn, 'Enter')
            }

            const pressDiff = totalPressEvents - beforeCount

            if (isDisabled || isPending) {
              expect(pressDiff).toBe(0)
            } else {
              expect(pressDiff).toBe(1)
            }
          },
        ),
        { numRuns: 50 },
      )
    })

    it('CHAL-PBT-02: Invariant: random sequences of orientation and spacing mutations always preserve valid attributes', async () => {
      const group = await mount<MoulButtonGroup>(
        html`<moul-button-group><moul-button>PBT</moul-button></moul-button-group>`,
      )

      const configArb = fc.record({
        orientation: fc.constantFrom<ButtonGroupOrientation>(
          'horizontal',
          'vertical',
        ),
        spacing: fc.constantFrom<ButtonGroupSpacing>('none', 'sm', 'md'),
        isDisabled: fc.boolean(),
      })

      await fc.assert(
        fc.asyncProperty(
          configArb,
          async ({ orientation, spacing, isDisabled }) => {
            group.orientation = orientation
            group.spacing = spacing
            group.isDisabled = isDisabled
            await awaitNestedUpdates(group)

            expect(group.getAttribute('orientation')).toBe(orientation)
            expect(group.getAttribute('aria-orientation')).toBe(orientation)
            expect(group.getAttribute('spacing')).toBe(spacing)
            expect(group.hasAttribute('is-disabled')).toBe(isDisabled)

            const slotted = group.querySelector<MoulButton>('moul-button')!
            expect(slotted.isDisabled).toBe(isDisabled)
          },
        ),
        { numRuns: 40 },
      )
    })
  })
})
