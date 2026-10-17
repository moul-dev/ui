import * as fc from 'fast-check'
import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './Button/Button'
import './ButtonGroup/ButtonGroup'
import './ToggleButton/ToggleButton'
import './ToggleButtonGroup/ToggleButtonGroup'
import './Spinner/Spinner'
import type { ButtonSize, ButtonVariant, MoulButton } from './Button/Button'
import type { MoulButtonGroup } from './ButtonGroup/ButtonGroup'
import type { MoulSpinner } from './Spinner/Spinner'
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

describe('MoulButton (`moul-button`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ACT-BTN-01: Default initialization', async () => {
    const btn = await mount<MoulButton>(
      html`<moul-button>Click Me</moul-button>`,
    )
    expect(btn).toBeInstanceOf(HTMLElement)
    expect(btn.tagName.toLowerCase()).toBe('moul-button')
    expect(btn.variant).toBe('primary')
    expect(btn.size).toBe('md')
    expect(btn.type).toBe('button')
    expect(btn.isIcon).toBe(false)
    expect(btn.isDisabled).toBe(false)
    expect(btn.isPending).toBe(false)

    const innerBtn = btn.shadowRoot?.querySelector('button')
    expect(innerBtn).not.toBeNull()
    expect(innerBtn?.getAttribute('type')).toBe('button')
    expect(innerBtn?.hasAttribute('disabled')).toBe(false)
  })

  it('ACT-BTN-02: Visual variants and sizes reflection', async () => {
    const variants: ButtonVariant[] = [
      'primary',
      'secondary',
      'tertiary',
      'outline',
      'ghost',
      'danger',
      'danger-soft',
    ]
    const sizes: ButtonSize[] = ['sm', 'md', 'lg']

    for (const variant of variants) {
      for (const size of sizes) {
        const btn = await mount<MoulButton>(
          html`<moul-button variant=${variant} size=${size}>Label</moul-button>`,
        )
        expect(btn.getAttribute('variant')).toBe(variant)
        expect(btn.getAttribute('size')).toBe(size)
        expect(btn.variant).toBe(variant)
        expect(btn.size).toBe(size)
        document.body.innerHTML = ''
      }
    }
  })

  it('ACT-BTN-03: Press event dispatch on valid pointer interaction', async () => {
    const btn = await mount<MoulButton>(
      html`<moul-button>Press Me</moul-button>`,
    )
    let pressCount = 0
    btn.addEventListener('press', () => {
      pressCount++
    })

    await simulatePress(btn)
    expect(pressCount).toBe(1)

    // Non-primary pointer button should NOT dispatch press
    btn.dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    )
    btn.dispatchEvent(
      new PointerEvent('pointerup', {
        button: 1,
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(btn)
    expect(pressCount).toBe(1)
  })

  it('ACT-BTN-04: Keyboard activation via Enter and Space keys', async () => {
    const btn = await mount<MoulButton>(
      html`<moul-button>Press Me</moul-button>`,
    )
    let pressCount = 0
    btn.addEventListener('press', () => {
      pressCount++
    })

    // Space key activates
    await simulateKey(btn, ' ')
    expect(pressCount).toBe(1)

    // Enter key activates
    await simulateKey(btn, 'Enter')
    expect(pressCount).toBe(2)

    // Repeated keydown does not cause duplicate presses
    btn.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        repeat: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(btn)
    expect(pressCount).toBe(2)

    // Unrelated key does not activate
    await simulateKey(btn, 'ArrowDown')
    expect(pressCount).toBe(2)
  })

  it('ACT-BTN-05: Disabled state suppression', async () => {
    const btn = await mount<MoulButton>(
      html`<moul-button is-disabled>Disabled</moul-button>`,
    )
    expect(btn.isDisabled).toBe(true)
    expect(btn.hasAttribute('is-disabled')).toBe(true)
    expect(btn.getAttribute('aria-disabled')).toBe('true')

    const innerBtn = btn.shadowRoot?.querySelector('button')
    expect(innerBtn?.hasAttribute('disabled')).toBe(true)

    let pressCount = 0
    btn.addEventListener('press', () => {
      pressCount++
    })

    await simulatePress(btn)
    expect(pressCount).toBe(0)

    await simulateKey(btn, 'Enter')
    expect(pressCount).toBe(0)

    await simulateKey(btn, ' ')
    expect(pressCount).toBe(0)
  })

  it('ACT-BTN-06: Pending state and accessibility', async () => {
    const btn = await mount<MoulButton>(
      html`<moul-button is-pending>Submitting</moul-button>`,
    )
    expect(btn.isPending).toBe(true)
    expect(btn.hasAttribute('is-pending')).toBe(true)
    expect(btn.getAttribute('aria-busy')).toBe('true')

    const innerBtn = btn.shadowRoot?.querySelector('button')
    expect(innerBtn?.getAttribute('aria-busy')).toBe('true')

    const spinner = btn.shadowRoot?.querySelector('moul-spinner')
    expect(spinner).not.toBeNull()
    expect(spinner?.getAttribute('size')).toBe('sm')

    let pressCount = 0
    btn.addEventListener('press', () => {
      pressCount++
    })

    await simulatePress(btn)
    expect(pressCount).toBe(0)

    btn.click()
    expect(pressCount).toBe(0)
  })

  it('ACT-BTN-07: Icon-only button accessible label validation', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Unlabelled icon-only button should emit warning
    await mount<MoulButton>(html`<moul-button is-icon></moul-button>`)
    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0][0]).toContain('icon-only button')

    warnSpy.mockClear()

    // Icon button with aria-label should NOT emit warning
    await mount<MoulButton>(
      html`<moul-button is-icon aria-label="Search action"></moul-button>`,
    )
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('ACT-BTN-08: Slots projection for prefix, default, and suffix', async () => {
    const btn = await mount<MoulButton>(html`
      <moul-button>
        <span slot="prefix" id="test-prefix">★</span>
        <span id="test-content">Main Text</span>
        <span slot="suffix" id="test-suffix">➔</span>
      </moul-button>
    `)

    const prefixSlot = btn.shadowRoot?.querySelector('slot[name="prefix"]')
    const defaultSlot = btn.shadowRoot?.querySelector('slot:not([name])')
    const suffixSlot = btn.shadowRoot?.querySelector('slot[name="suffix"]')

    expect(prefixSlot).not.toBeNull()
    expect(defaultSlot).not.toBeNull()
    expect(suffixSlot).not.toBeNull()
  })

  it('ACT-BTN-09: Form submit and reset integration', async () => {
    const form = document.createElement('form')
    document.body.appendChild(form)

    let submitted = false
    let reset = false
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      submitted = true
    })
    form.addEventListener('reset', () => {
      reset = true
    })

    const submitBtn = document.createElement('moul-button') as MoulButton
    submitBtn.type = 'submit'
    submitBtn.textContent = 'Submit Form'
    form.appendChild(submitBtn)
    await awaitNestedUpdates(submitBtn)

    const resetBtn = document.createElement('moul-button') as MoulButton
    resetBtn.type = 'reset'
    resetBtn.textContent = 'Reset Form'
    form.appendChild(resetBtn)
    await awaitNestedUpdates(resetBtn)

    submitBtn.click()
    expect(submitted).toBe(true)

    resetBtn.click()
    expect(reset).toBe(true)
  })

  it('ACT-BTN-10: Fast-check property test on random variant and size combinations', () => {
    const variantArb = fc.constantFrom<ButtonVariant>(
      'primary',
      'secondary',
      'tertiary',
      'outline',
      'ghost',
      'danger',
      'danger-soft',
    )
    const sizeArb = fc.constantFrom<ButtonSize>('sm', 'md', 'lg')

    fc.assert(
      fc.property(variantArb, sizeArb, (variant, size) => {
        const btn = document.createElement('moul-button') as MoulButton
        btn.variant = variant
        btn.size = size
        expect(btn.variant).toBe(variant)
        expect(btn.size).toBe(size)
      }),
    )
  })
})

describe('MoulButtonGroup (`moul-button-group`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ACT-GRP-01: Orientation and spacing attributes', async () => {
    const group = await mount<MoulButtonGroup>(html`
      <moul-button-group orientation="vertical" spacing="md">
        <moul-button>First</moul-button>
        <moul-button>Second</moul-button>
      </moul-button-group>
    `)

    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('orientation')).toBe('vertical')
    expect(group.getAttribute('spacing')).toBe('md')
    expect(group.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('ACT-GRP-02: Disabled state propagation to slotted buttons', async () => {
    const group = await mount<MoulButtonGroup>(html`
      <moul-button-group is-disabled>
        <moul-button id="btn1">Btn 1</moul-button>
        <moul-button id="btn2">Btn 2</moul-button>
      </moul-button-group>
    `)

    const btn1 = group.querySelector<MoulButton>('#btn1')
    const btn2 = group.querySelector<MoulButton>('#btn2')

    expect(btn1?.isDisabled).toBe(true)
    expect(btn2?.isDisabled).toBe(true)

    // Dynamically toggle group isDisabled
    group.isDisabled = false
    await awaitNestedUpdates(group)

    expect(btn1?.isDisabled).toBe(false)
    expect(btn2?.isDisabled).toBe(false)
  })

  it('ACT-GRP-03: Spacing none applies radius collapse layout attributes', async () => {
    const group = await mount<MoulButtonGroup>(html`
      <moul-button-group spacing="none" orientation="horizontal">
        <moul-button>Left</moul-button>
        <moul-button>Middle</moul-button>
        <moul-button>Right</moul-button>
      </moul-button-group>
    `)

    expect(group.getAttribute('spacing')).toBe('none')
    expect(group.getAttribute('orientation')).toBe('horizontal')
  })
})

describe('MoulToggleButton (`moul-toggle-button`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ACT-TGL-01: State toggle and aria-pressed synchronization', async () => {
    const toggleBtn = await mount<MoulToggleButton>(
      html`<moul-toggle-button value="bold">Bold</moul-toggle-button>`,
    )
    expect(toggleBtn.isSelected).toBe(false)
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')

    let changeCount = 0
    let pressCount = 0
    let lastChangeDetail: unknown = null

    toggleBtn.addEventListener('change', (e: Event) => {
      changeCount++
      lastChangeDetail = (e as CustomEvent).detail
    })
    toggleBtn.addEventListener('press', () => {
      pressCount++
    })

    // First click selects
    await simulatePress(toggleBtn)
    expect(toggleBtn.isSelected).toBe(true)
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
    expect(changeCount).toBe(1)
    expect(pressCount).toBe(1)
    expect(lastChangeDetail).toEqual({ isSelected: true, value: 'bold' })

    const innerBtn = toggleBtn.shadowRoot?.querySelector('button')
    expect(innerBtn?.getAttribute('aria-pressed')).toBe('true')

    // Second click unselects
    await simulatePress(toggleBtn)
    expect(toggleBtn.isSelected).toBe(false)
    expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
    expect(changeCount).toBe(2)
    expect(pressCount).toBe(2)
    expect(lastChangeDetail).toEqual({ isSelected: false, value: 'bold' })
  })

  it('ACT-TGL-02: Disabled state blocks toggle and events', async () => {
    const toggleBtn = await mount<MoulToggleButton>(
      html`<moul-toggle-button is-disabled value="italic">Italic</moul-toggle-button>`,
    )
    expect(toggleBtn.isDisabled).toBe(true)

    let eventFired = false
    toggleBtn.addEventListener('change', () => {
      eventFired = true
    })
    toggleBtn.addEventListener('press', () => {
      eventFired = true
    })

    await simulatePress(toggleBtn)
    expect(toggleBtn.isSelected).toBe(false)
    expect(eventFired).toBe(false)

    await simulateKey(toggleBtn, 'Enter')
    expect(toggleBtn.isSelected).toBe(false)
    expect(eventFired).toBe(false)
  })

  it('ACT-TGL-03: Keyboard Space and Enter toggling', async () => {
    const toggleBtn = await mount<MoulToggleButton>(
      html`<moul-toggle-button value="underline">Underline</moul-toggle-button>`,
    )

    await simulateKey(toggleBtn, ' ')
    expect(toggleBtn.isSelected).toBe(true)

    await simulateKey(toggleBtn, 'Enter')
    expect(toggleBtn.isSelected).toBe(false)
  })
})

describe('MoulToggleButtonGroup (`moul-toggle-button-group`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ACT-TGG-01: Selection synchronization with selected-key', async () => {
    const group = await mount<MoulToggleButtonGroup>(html`
      <moul-toggle-button-group selected-key="opt2">
        <moul-toggle-button value="opt1">Option 1</moul-toggle-button>
        <moul-toggle-button value="opt2">Option 2</moul-toggle-button>
        <moul-toggle-button value="opt3">Option 3</moul-toggle-button>
      </moul-toggle-button-group>
    `)

    const items = group.getItems()
    expect(items[0].isSelected).toBe(false)
    expect(items[1].isSelected).toBe(true)
    expect(items[2].isSelected).toBe(false)

    // Update selected-key dynamically
    group.selectedKey = 'opt3'
    await awaitNestedUpdates(group)

    expect(items[0].isSelected).toBe(false)
    expect(items[1].isSelected).toBe(false)
    expect(items[2].isSelected).toBe(true)
  })

  it('ACT-TGG-02: Child click triggers selectionchange and updates selectedKey', async () => {
    const group = await mount<MoulToggleButtonGroup>(html`
      <moul-toggle-button-group selected-key="left">
        <moul-toggle-button value="left">Left</moul-toggle-button>
        <moul-toggle-button value="center">Center</moul-toggle-button>
        <moul-toggle-button value="right">Right</moul-toggle-button>
      </moul-toggle-button-group>
    `)

    let selectionChangeDetail: unknown = null
    group.addEventListener('selectionchange', (e: Event) => {
      selectionChangeDetail = (e as CustomEvent).detail
    })

    const items = group.getItems()
    // Click unselected item "center"
    await simulatePress(items[1])

    expect(group.selectedKey).toBe('center')
    expect(items[0].isSelected).toBe(false)
    expect(items[1].isSelected).toBe(true)
    expect(items[2].isSelected).toBe(false)
    expect(selectionChangeDetail).toEqual({ selectedKey: 'center' })
  })

  it('ACT-TGG-03: Roving tabindex and Arrow keys navigation with circular wrapping', async () => {
    const group = await mount<MoulToggleButtonGroup>(html`
      <moul-toggle-button-group selected-key="first">
        <moul-toggle-button value="first">First</moul-toggle-button>
        <moul-toggle-button value="second">Second</moul-toggle-button>
        <moul-toggle-button value="third">Third</moul-toggle-button>
      </moul-toggle-button-group>
    `)

    const items = group.getItems()
    expect(items[0].getAttribute('tabindex')).toBe('0')
    expect(items[1].getAttribute('tabindex')).toBe('-1')
    expect(items[2].getAttribute('tabindex')).toBe('-1')

    // ArrowRight from first moves to second
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[0].getAttribute('tabindex')).toBe('-1')
    expect(items[1].getAttribute('tabindex')).toBe('0')
    expect(items[2].getAttribute('tabindex')).toBe('-1')

    // ArrowDown from second moves to third
    items[1].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[2].getAttribute('tabindex')).toBe('0')

    // ArrowRight from third wraps circularly back to first
    items[2].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[0].getAttribute('tabindex')).toBe('0')

    // ArrowLeft from first wraps circularly to third
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[2].getAttribute('tabindex')).toBe('0')
  })

  it('ACT-TGG-04: Home and End keys jump to first and last items', async () => {
    const group = await mount<MoulToggleButtonGroup>(html`
      <moul-toggle-button-group selected-key="second">
        <moul-toggle-button value="first">First</moul-toggle-button>
        <moul-toggle-button value="second">Second</moul-toggle-button>
        <moul-toggle-button value="third">Third</moul-toggle-button>
      </moul-toggle-button-group>
    `)

    const items = group.getItems()

    // Home key jumps to first
    items[1].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[0].getAttribute('tabindex')).toBe('0')
    expect(items[1].getAttribute('tabindex')).toBe('-1')

    // End key jumps to last
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
        cancelable: true,
      }),
    )
    await awaitNestedUpdates(group)

    expect(items[2].getAttribute('tabindex')).toBe('0')
    expect(items[0].getAttribute('tabindex')).toBe('-1')
  })
})

describe('MoulSpinner (`moul-spinner`)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('ACT-SPN-01: Accessible loading status and SVG rendering', async () => {
    const spinner = await mount<MoulSpinner>(
      html`<moul-spinner size="lg" label="Processing data"></moul-spinner>`,
    )
    expect(spinner.size).toBe('lg')
    expect(spinner.label).toBe('Processing data')

    const base = spinner.shadowRoot?.querySelector('[part="base"]')
    expect(base?.getAttribute('role')).toBe('status')
    expect(base?.getAttribute('aria-label')).toBe('Processing data')

    const srOnly = spinner.shadowRoot?.querySelector('.sr-only')
    expect(srOnly?.textContent?.trim()).toBe('Processing data')

    const svg = spinner.shadowRoot?.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
