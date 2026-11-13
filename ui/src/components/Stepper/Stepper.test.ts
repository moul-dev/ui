import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Step'
import './Stepper'
import type { MoulStep } from './Step'
import type { MoulStepper } from './Stepper'

async function mount(
  template = html`
    <moul-stepper>
      <moul-step label="Account" description="Email and password">Account form</moul-step>
      <moul-step label="Details">Details form</moul-step>
      <moul-step label="Plan">Plan picker</moul-step>
      <moul-step label="Review">Summary</moul-step>
    </moul-stepper>
  `,
): Promise<{ stepper: MoulStepper; steps: MoulStep[] }> {
  const stepper = await fixture<MoulStepper>(template)
  const steps = stepper.steps
  await settle(stepper)
  return { stepper, steps }
}

async function settle(stepper: MoulStepper): Promise<void> {
  await stepper.updateComplete
  await Promise.all(stepper.steps.map((step) => step.updateComplete))
}

const part = (step: MoulStep, name: string): HTMLElement =>
  step.shadowRoot!.querySelector<HTMLElement>(`[part~="${name}"]`)!

const trigger = (step: MoulStep) => part(step, 'trigger') as HTMLButtonElement

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

function stubRect(el: HTMLElement, left: number, top = 0, size = 32): void {
  el.getBoundingClientRect = () =>
    ({
      top,
      left,
      right: left + size,
      bottom: top + size,
      width: size,
      height: size,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

describe('<moul-stepper>', () => {
  it('registers both elements and starts on the first step', async () => {
    const { stepper, steps } = await mount()
    expect(customElements.get('moul-stepper')).toBeDefined()
    expect(customElements.get('moul-step')).toBeDefined()
    expect(stepper.current).toBe(0)
    expect(stepper.getAttribute('current')).toBe('0')
    expect(stepper.orientation).toBe('horizontal')
    expect(stepper.isLinear).toBe(false)
    expect(steps.map((step) => step.dataset.status)).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ])
    expect(steps.map((step) => part(step, 'panel').hidden)).toEqual([
      false,
      true,
      true,
      true,
    ])
  })

  it('moves with next, previous and goTo within bounds', async () => {
    const { stepper, steps } = await mount()
    expect(stepper.previous()).toBe(false)
    expect(stepper.next()).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(1)
    expect(part(steps[1], 'panel').hidden).toBe(false)
    expect(part(steps[0], 'panel').hidden).toBe(true)
    expect(steps[0].dataset.status).toBe('complete')

    expect(stepper.goTo(3)).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(3)
    expect(stepper.next()).toBe(false)
    expect(stepper.goTo(3)).toBe(false)
    expect(stepper.goTo(4)).toBe(false)
    expect(stepper.goTo(-1)).toBe(false)
    expect(stepper.goTo(1.5)).toBe(false)
    expect(stepper.previous()).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(2)
  })

  it('skips disabled steps and refuses to go to them', async () => {
    const { stepper } = await mount(html`
      <moul-stepper>
        <moul-step label="One">1</moul-step>
        <moul-step label="Two" is-disabled>2</moul-step>
        <moul-step label="Three">3</moul-step>
      </moul-stepper>
    `)
    expect(stepper.goTo(1)).toBe(false)
    expect(stepper.next()).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(2)
    expect(stepper.previous()).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(0)
  })

  it('clamps current to the steps it has', async () => {
    const { stepper } = await mount(html`
      <moul-stepper current="9">
        <moul-step label="One">1</moul-step>
        <moul-step label="Two">2</moul-step>
      </moul-stepper>
    `)
    expect(stepper.current).toBe(1)
    stepper.current = -3
    await settle(stepper)
    expect(stepper.current).toBe(0)
  })

  it('fires a cancelable stepchange before moving, and none for current set from code', async () => {
    const { stepper } = await mount()
    const change = vi.fn()
    stepper.addEventListener('stepchange', change)

    stepper.next()
    expect(change).toHaveBeenCalledTimes(1)
    const event = change.mock.calls[0][0] as CustomEvent
    expect(event.cancelable).toBe(true)
    expect(event.detail).toEqual({ current: 1, previous: 0 })
    await settle(stepper)

    const block = (e: Event) => e.preventDefault()
    stepper.addEventListener('stepchange', block)
    expect(stepper.next()).toBe(false)
    await settle(stepper)
    expect(stepper.current).toBe(1)
    stepper.removeEventListener('stepchange', block)

    stepper.current = 3
    await settle(stepper)
    expect(change).toHaveBeenCalledTimes(2)
  })

  it('lets the user click any enabled step unless is-linear', async () => {
    const { stepper, steps } = await mount()
    const change = vi.fn()
    stepper.addEventListener('stepchange', change)
    trigger(steps[2]).click()
    await settle(stepper)
    expect(stepper.current).toBe(2)
    expect(change.mock.calls[0][0].detail).toEqual({ current: 2, previous: 0 })
    trigger(steps[2]).click()
    expect(change).toHaveBeenCalledTimes(1)
  })

  it('in linear mode, lets the user go back but not ahead by clicking', async () => {
    const { stepper, steps } = await mount(html`
      <moul-stepper is-linear current="1">
        <moul-step label="One">1</moul-step>
        <moul-step label="Two">2</moul-step>
        <moul-step label="Three">3</moul-step>
      </moul-stepper>
    `)
    trigger(steps[2]).click()
    await settle(stepper)
    expect(stepper.current).toBe(1)
    expect(trigger(steps[2]).getAttribute('aria-disabled')).toBe('true')
    expect(trigger(steps[0]).hasAttribute('aria-disabled')).toBe(false)

    trigger(steps[0]).click()
    await settle(stepper)
    expect(stepper.current).toBe(0)
    // next() still moves forward one step at a time.
    expect(stepper.next()).toBe(true)
    await settle(stepper)
    expect(stepper.current).toBe(1)
  })

  it('shows the invalid state on the indicator and in the name', async () => {
    const { stepper, steps } = await mount(html`
      <moul-stepper current="1">
        <moul-step label="One" is-invalid>1</moul-step>
        <moul-step label="Two">2</moul-step>
      </moul-stepper>
    `)
    expect(steps[0].hasAttribute('is-invalid')).toBe(true)
    // The alert mark replaces the check on a completed step.
    expect(
      part(steps[0], 'indicator').querySelector('path')?.getAttribute('d'),
    ).toBe('M12 6v7')
    expect(steps[0].shadowRoot!.getElementById('state')?.textContent).toBe(
      ', has an error',
    )

    steps[0].isInvalid = false
    await settle(stepper)
    expect(
      part(steps[0], 'indicator').querySelector('path')?.getAttribute('d'),
    ).toBe('M20 6 9 17l-5-5')
    expect(steps[0].shadowRoot!.getElementById('state')?.textContent).toBe(
      ', completed',
    )
    expect(part(steps[1], 'indicator').textContent?.trim()).toBe('2')
  })

  it('treats an unknown orientation as horizontal', async () => {
    const { steps } = await mount(html`
      <moul-stepper orientation="diagonal">
        <moul-step label="One">1</moul-step>
      </moul-stepper>
    `)
    expect(steps[0].dataset.orientation).toBe('horizontal')
  })

  it('renders a custom icon from the icon slot', async () => {
    const { steps } = await mount(html`
      <moul-stepper>
        <moul-step label="One"><span slot="icon">★</span>1</moul-step>
      </moul-stepper>
    `)
    const slot = part(steps[0], 'indicator').querySelector<HTMLSlotElement>(
      'slot[name="icon"]',
    )!
    expect(slot.assignedElements()[0]?.textContent).toBe('★')
  })

  describe('keyboard and screen readers', () => {
    it('is an ordered list of step buttons with aria-current', async () => {
      const { stepper, steps } = await mount()
      const list = stepper.shadowRoot!.querySelector('[part~="list"]')!
      expect(list.localName).toBe('ol')
      expect(list.getAttribute('role')).toBe('list')
      expect(
        steps.every((step) => step.getAttribute('role') === 'listitem'),
      ).toBe(true)

      const button = trigger(steps[0])
      expect(button.localName).toBe('button')
      expect(button.getAttribute('aria-current')).toBe('step')
      expect(trigger(steps[1]).hasAttribute('aria-current')).toBe(false)
      expect(button.getAttribute('aria-labelledby')).toBe('label state')
      expect(button.getAttribute('aria-describedby')).toBe('description')
      expect(trigger(steps[1]).hasAttribute('aria-describedby')).toBe(false)
      const panel = part(steps[0], 'panel')
      expect(panel.getAttribute('role')).toBe('group')
      expect(panel.getAttribute('aria-labelledby')).toBe('label')

      stepper.next()
      await settle(stepper)
      expect(trigger(steps[1]).getAttribute('aria-current')).toBe('step')
      expect(button.hasAttribute('aria-current')).toBe(false)
    })

    it('marks disabled steps aria-disabled and ignores clicks on them', async () => {
      const { stepper, steps } = await mount(html`
        <moul-stepper>
          <moul-step label="One">1</moul-step>
          <moul-step label="Two" is-disabled>2</moul-step>
        </moul-stepper>
      `)
      expect(trigger(steps[1]).getAttribute('aria-disabled')).toBe('true')
      trigger(steps[1]).click()
      await settle(stepper)
      expect(stepper.current).toBe(0)

      steps[1].isDisabled = false
      await settle(stepper)
      await settle(stepper)
      expect(trigger(steps[1]).hasAttribute('aria-disabled')).toBe(false)
    })

    it('roves focus with the arrow keys, Home and End without changing step', async () => {
      const { stepper, steps } = await mount()
      const tabStops = () =>
        steps.map((step) => trigger(step).getAttribute('tabindex'))
      expect(tabStops()).toEqual(['0', '-1', '-1', '-1'])

      steps[0].focus()
      expect(key(trigger(steps[0]), 'ArrowRight').defaultPrevented).toBe(true)
      await settle(stepper)
      expect(document.activeElement).toBe(steps[1])
      expect(tabStops()).toEqual(['-1', '0', '-1', '-1'])
      expect(stepper.current).toBe(0)

      key(trigger(steps[1]), 'End')
      expect(document.activeElement).toBe(steps[3])
      key(trigger(steps[3]), 'ArrowRight')
      expect(document.activeElement).toBe(steps[0]) // wraps
      key(trigger(steps[0]), 'ArrowLeft')
      expect(document.activeElement).toBe(steps[3]) // wraps back
      key(trigger(steps[3]), 'Home')
      expect(document.activeElement).toBe(steps[0])
      // Vertical keys do nothing in a horizontal stepper.
      expect(key(trigger(steps[0]), 'ArrowDown').defaultPrevented).toBe(false)
    })

    it('uses Up and Down in a vertical stepper', async () => {
      const { stepper, steps } = await mount(html`
        <moul-stepper orientation="vertical">
          <moul-step label="One">1</moul-step>
          <moul-step label="Two">2</moul-step>
        </moul-stepper>
      `)
      expect(steps[0].dataset.orientation).toBe('vertical')
      steps[0].focus()
      key(trigger(steps[0]), 'ArrowDown')
      expect(document.activeElement).toBe(steps[1])
      expect(key(trigger(steps[1]), 'ArrowRight').defaultPrevented).toBe(false)
      key(trigger(steps[1]), 'ArrowUp')
      expect(document.activeElement).toBe(steps[0])
      expect(stepper.current).toBe(0)
    })

    it('goes to the focused step on Enter or Space through the native button', async () => {
      const { stepper, steps } = await mount()
      steps[0].focus()
      key(trigger(steps[0]), 'ArrowRight')
      key(trigger(steps[1]), 'ArrowRight')
      // A native button turns Enter and Space into a click.
      trigger(steps[2]).click()
      await settle(stepper)
      expect(stepper.current).toBe(2)
      expect(document.activeElement).toBe(steps[2])
    })

    it('leaves arrow keys inside a panel alone', async () => {
      const { stepper } = await mount(html`
        <moul-stepper>
          <moul-step label="One"><input /></moul-step>
          <moul-step label="Two">2</moul-step>
        </moul-stepper>
      `)
      const input = stepper.querySelector('input')!
      expect(key(input, 'ArrowRight').defaultPrevented).toBe(false)
    })

    it('announces each change politely without moving focus', async () => {
      const { stepper } = await mount()
      const status = stepper.shadowRoot!.querySelector('[part~="status"]')!
      expect(status.getAttribute('role')).toBe('status')
      expect(status.textContent?.trim()).toBe('')

      const before = document.activeElement
      stepper.next()
      await settle(stepper)
      expect(status.textContent?.trim()).toBe('Step 2 of 4: Details')
      stepper.current = 3
      await settle(stepper)
      expect(status.textContent?.trim()).toBe('Step 4 of 4: Review')
      expect(document.activeElement).toBe(before)
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock | null = null
    afterEach(() => {
      motion?.restore()
      motion = null
    })

    it('slides the new panel in and glides the halo to the current indicator', async () => {
      motion = mockReducedMotion(false)
      const { stepper, steps } = await mount()
      const list =
        stepper.shadowRoot!.querySelector<HTMLElement>('[part~="list"]')!
      const highlight = stepper.shadowRoot!.querySelector<HTMLElement>(
        '[part~="highlight"]',
      )!
      stubRect(list, 0, 0, 600)
      for (const [i, step] of steps.entries()) {
        stubRect(part(step, 'indicator'), i * 150)
      }

      stepper.next()
      await settle(stepper)
      await Promise.resolve()
      expect(steps[1].hasAttribute('data-entering')).toBe(true)
      expect(highlight.style.translate).toBe('150px 0px')
      expect(highlight.hasAttribute('data-visible')).toBe(true)
    })

    it('stops a running slide when the step is left mid-way', async () => {
      motion = mockReducedMotion(false)
      const { stepper, steps } = await mount()
      stepper.next()
      await settle(stepper)
      expect(steps[1].hasAttribute('data-entering')).toBe(true)
      stepper.next()
      await settle(stepper)
      expect(steps[1].hasAttribute('data-entering')).toBe(false)
      expect(part(steps[1], 'panel').style.opacity).toBe('')
      expect(part(steps[1], 'panel').hidden).toBe(true)
    })

    it('changes the panel at once under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const { stepper, steps } = await mount()
      stepper.next()
      await settle(stepper)
      const panel = part(steps[1], 'panel')
      expect(panel.hidden).toBe(false)
      expect(steps[1].hasAttribute('data-entering')).toBe(false)
      expect(panel.style.transform).toBe('')
      expect(panel.style.opacity).toBe('')
    })
  })
})
