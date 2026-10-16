import fc from 'fast-check'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clampValue,
  FormInternalsController,
  MAX_NUMBER_VALUE,
  MIN_NUMBER_VALUE,
  NumberSpringController,
} from './index'

let challengeHostCounter = 0

class ChallengerReactiveHost
  extends HTMLElement
  implements ReactiveControllerHost
{
  static formAssociated = true
  readonly controllers = new Set<ReactiveController>()
  updateCalls: Array<{ name?: PropertyKey; oldValue?: unknown }> = []

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
    if (this.isConnected) {
      controller.hostConnected?.()
    }
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller)
  }

  requestUpdate(name?: PropertyKey, oldValue?: unknown): void {
    this.updateCalls.push({ name, oldValue })
  }

  get updateComplete(): Promise<boolean> {
    return Promise.resolve(true)
  }

  connectedCallback(): void {
    for (const c of this.controllers) {
      c.hostConnected?.()
    }
  }

  disconnectedCallback(): void {
    for (const c of this.controllers) {
      c.hostDisconnected?.()
    }
  }
}

function createChallengerHost(
  tagNameOrPrefix = 'challenger-host',
): ChallengerReactiveHost {
  const isCustomTag = tagNameOrPrefix.includes('-')
  const tag =
    isCustomTag && !tagNameOrPrefix.startsWith('challenger-')
      ? tagNameOrPrefix.toLowerCase()
      : `${tagNameOrPrefix}-${++challengeHostCounter}`

  if (!customElements.get(tag)) {
    customElements.define(tag, class extends ChallengerReactiveHost {})
  }
  const el = document.createElement(tag) as ChallengerReactiveHost
  document.body.appendChild(el)
  return el
}

describe('Adversarial Challenge Suite: NumberSpringController & FormInternalsController', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  // =========================================================================
  // 1. NumberSpringController: Extreme Numeric Inputs & Clamping
  // =========================================================================
  describe('NumberSpringController: Extreme Numeric Inputs & Invariants', () => {
    it('clamps extreme numeric inputs to exact boundary specifications', () => {
      // Number.MAX_SAFE_INTEGER & Number.MIN_SAFE_INTEGER
      expect(clampValue(Number.MAX_SAFE_INTEGER)).toBe(MAX_NUMBER_VALUE)
      expect(clampValue(Number.MIN_SAFE_INTEGER)).toBe(MIN_NUMBER_VALUE)

      // Extreme exponents
      expect(clampValue(1e12)).toBe(MAX_NUMBER_VALUE)
      expect(clampValue(-1e12)).toBe(MIN_NUMBER_VALUE)
      expect(clampValue(1e18)).toBe(MAX_NUMBER_VALUE)
      expect(clampValue(-1e18)).toBe(MIN_NUMBER_VALUE)
      expect(clampValue(Number.MAX_VALUE)).toBe(MAX_NUMBER_VALUE)
      expect(clampValue(-Number.MAX_VALUE)).toBe(MIN_NUMBER_VALUE)

      // Invalids, Infinities, and NaNs
      expect(clampValue(Number.POSITIVE_INFINITY)).toBe(0)
      expect(clampValue(Number.NEGATIVE_INFINITY)).toBe(0)
      expect(clampValue(Number.NaN)).toBe(0)

      // Subnormals, zero variants, and epsilon
      expect(clampValue(-0) === 0).toBe(true)
      expect(clampValue(0)).toBe(0)
      expect(clampValue(Number.EPSILON)).toBe(Number.EPSILON)
      expect(clampValue(Number.MIN_VALUE)).toBe(Number.MIN_VALUE)

      // Type corruptions passed at runtime
      expect(clampValue(null as unknown as number)).toBe(0)
      expect(clampValue(undefined as unknown as number)).toBe(0)
      expect(clampValue('999999999' as unknown as number)).toBe(0)
      expect(clampValue({} as unknown as number)).toBe(0)
    })

    it('fast-check: clampValue ALWAYS returns a safe finite number within [-999999999, 999999999]', () => {
      fc.assert(
        fc.property(
          fc.double({ noNaN: false, noDefaultInfinity: false }),
          (val) => {
            const clamped = clampValue(val)
            expect(Number.isFinite(clamped)).toBe(true)
            expect(clamped).toBeGreaterThanOrEqual(MIN_NUMBER_VALUE)
            expect(clamped).toBeLessThanOrEqual(MAX_NUMBER_VALUE)
          },
        ),
      )
    })

    it('initializes and clamps extreme initialValue in constructor', () => {
      const host1 = createChallengerHost('spring-extreme-init-1')
      const c1 = new NumberSpringController(host1, {
        initialValue: Number.MAX_SAFE_INTEGER,
      })
      expect(c1.targetValue).toBe(MAX_NUMBER_VALUE)
      expect(c1.displayValue).toBe(MAX_NUMBER_VALUE)

      const host2 = createChallengerHost('spring-extreme-init-2')
      const c2 = new NumberSpringController(host2, {
        initialValue: -1e12,
      })
      expect(c2.targetValue).toBe(MIN_NUMBER_VALUE)
      expect(c2.displayValue).toBe(MIN_NUMBER_VALUE)

      const host3 = createChallengerHost('spring-extreme-init-3')
      const c3 = new NumberSpringController(host3, {
        initialValue: Number.POSITIVE_INFINITY,
      })
      expect(c3.targetValue).toBe(0)
      expect(c3.displayValue).toBe(0)

      const host4 = createChallengerHost('spring-extreme-init-4')
      const c4 = new NumberSpringController(host4, {
        initialValue: Number.NaN,
      })
      expect(c4.targetValue).toBe(0)
      expect(c4.displayValue).toBe(0)
    })

    it('resets correctly with extreme numeric values', () => {
      const host = createChallengerHost('spring-extreme-reset')
      const controller = new NumberSpringController(host, { initialValue: 0 })

      controller.reset(Number.MAX_SAFE_INTEGER)
      expect(controller.targetValue).toBe(MAX_NUMBER_VALUE)
      expect(controller.displayValue).toBe(MAX_NUMBER_VALUE)

      controller.reset(Number.NEGATIVE_INFINITY)
      expect(controller.targetValue).toBe(0)
      expect(controller.displayValue).toBe(0)

      controller.reset(-1e15)
      expect(controller.targetValue).toBe(MIN_NUMBER_VALUE)
      expect(controller.displayValue).toBe(MIN_NUMBER_VALUE)
    })
  })

  // =========================================================================
  // 2. NumberSpringController: Snapping Threshold Boundaries (<= 0.5)
  // =========================================================================
  describe('NumberSpringController: Exact Snapping Threshold Boundaries', () => {
    it('snaps immediately when delta is <= 0.5 without launching animation controls', () => {
      const host = createChallengerHost('spring-snap-boundary')
      const controller = new NumberSpringController(host, {
        initialValue: 100,
      })

      // Exact +0.5 delta
      controller.setTarget(100.5)
      expect(controller.targetValue).toBe(100.5)
      expect(controller.displayValue).toBe(100.5)
      expect(host.updateCalls.length).toBe(1)

      // Reset to 100
      controller.reset(100)
      host.updateCalls = []

      // Exact -0.5 delta
      controller.setTarget(99.5)
      expect(controller.targetValue).toBe(99.5)
      expect(controller.displayValue).toBe(99.5)
      expect(host.updateCalls.length).toBe(1)

      // Delta just below threshold: +0.499999
      controller.reset(100)
      host.updateCalls = []
      controller.setTarget(100.499999)
      expect(controller.targetValue).toBe(100.499999)
      expect(controller.displayValue).toBe(100.499999)
      expect(host.updateCalls.length).toBe(1)
    })

    it('does NOT snap immediately when delta is strictly greater than 0.5', () => {
      const host = createChallengerHost('spring-no-snap')
      const controller = new NumberSpringController(host, {
        initialValue: 100,
      })

      // Delta is 0.500001 (> 0.5)
      controller.setTarget(100.500001)
      expect(controller.targetValue).toBe(100.500001)
      // When animation starts, displayValue has not snapped immediately in the synchronous setTarget step
      expect(controller.displayValue).not.toBe(100.500001)
    })

    it('honors custom threshold values including boundary 0 and 1.0', () => {
      const host = createChallengerHost('spring-custom-threshold')
      const c1 = new NumberSpringController(host, {
        initialValue: 50,
        threshold: 1.0,
      })

      c1.setTarget(51.0) // Delta 1.0 <= 1.0 -> snaps immediately
      expect(c1.displayValue).toBe(51.0)

      c1.reset(50)
      c1.setTarget(51.001) // Delta 1.001 > 1.0 -> animates
      expect(c1.displayValue).not.toBe(51.001)

      // Threshold 0 (only exact equality snaps synchronously)
      const c2 = new NumberSpringController(host, {
        initialValue: 10,
        threshold: 0,
      })
      c2.setTarget(10.0001) // Delta 0.0001 > 0 -> animates
      expect(c2.displayValue).not.toBe(10.0001)
    })
  })

  // =========================================================================
  // 3. NumberSpringController: Rapid Retargeting & Disconnection Mid-Spring
  // =========================================================================
  describe('NumberSpringController: Stress Retargeting & Mid-Animation Disconnection', () => {
    it('handles 200 rapid retargeting calls in a tight loop without leaking or crashing', () => {
      const host = createChallengerHost('spring-rapid-retarget')
      const controller = new NumberSpringController(host, { initialValue: 0 })

      const targets = [-500, 1000, 250, -100, 800, -999, 42, 5000]
      for (let i = 0; i < 200; i++) {
        const nextTarget = targets[i % targets.length]! + i
        expect(() => controller.setTarget(nextTarget)).not.toThrow()
      }

      // Final targetValue must match last clamped invocation
      const lastTarget = targets[199 % targets.length]! + 199
      expect(controller.targetValue).toBe(clampValue(lastTarget))
    })

    it('cancels active animation loop on hostDisconnected mid-spring and achieves quiescence', async () => {
      const host = createChallengerHost('spring-mid-disconnect')
      const controller = new NumberSpringController(host, {
        initialValue: 0,
        stiffness: 10, // Slow animation
        damping: 10,
      })

      controller.setTarget(50000)
      expect(controller.targetValue).toBe(50000)

      // Allow one microtask/tick
      await new Promise((resolve) => setTimeout(resolve, 20))
      const callCountAtDisconnect = host.updateCalls.length

      // Disconnect host
      host.remove()

      // Wait 100ms (in an active animation loop, dozens of ticks would fire)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify the active loop is stopped: no continuous ticks occur (at most 1 in-flight frame settles)
      expect(
        host.updateCalls.length - callCountAtDisconnect,
      ).toBeLessThanOrEqual(1)

      // Wait another 50ms to confirm complete quiescence
      const callCountAfterWait = host.updateCalls.length
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(host.updateCalls.length).toBe(callCountAfterWait)
    })
  })

  // =========================================================================
  // 4. FormInternalsController: Missing attachInternals Fallback Simulation
  // =========================================================================
  describe('FormInternalsController: Missing attachInternals Fallback', () => {
    it('warns with exact message and executes all methods as safe no-ops when attachInternals is absent', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createChallengerHost('internals-missing-feature')

      // Remove attachInternals from host
      ;(host as unknown as { attachInternals?: unknown }).attachInternals =
        undefined

      const controller = new FormInternalsController(host)

      expect(warnSpy).toHaveBeenCalledWith(
        '[@moul-dev/ui] ElementInternals is not supported in this environment.',
      )
      expect(controller.internals).toBeNull()

      // Assert all methods operate safely as non-throwing no-ops
      expect(() => controller.setValue('test-val')).not.toThrow()
      expect(() => controller.setValue(null)).not.toThrow()
      expect(() =>
        controller.setValue(new FormData(), { state: 1 }),
      ).not.toThrow()
      expect(() =>
        controller.setValidity({ customError: true }, 'error message'),
      ).not.toThrow()
      expect(controller.checkValidity()).toBe(true)
      expect(controller.reportValidity()).toBe(true)

      // Assert all getters return safe fallback defaults
      expect(controller.form).toBeNull()
      expect(controller.validity).toBeNull()
      expect(controller.validationMessage).toBe('')
      expect(controller.willValidate).toBe(false)
      expect(controller.labels).toBeNull()

      warnSpy.mockRestore()
    })
  })

  // =========================================================================
  // 5. FormInternalsController: Double Attachment & Reconnection Protection
  // =========================================================================
  describe('FormInternalsController: Double Attachment & Lifecycle Reconnection', () => {
    it('retains ElementInternals across DOM disconnection and reconnection cycles without re-attaching', () => {
      const host = createChallengerHost('internals-reconnect-safe')
      const controller = new FormInternalsController(host)
      const initialInternals = controller.internals
      expect(initialInternals).not.toBeNull()

      // Disconnect and reconnect multiple times
      for (let i = 0; i < 5; i++) {
        host.remove()
        expect(host.isConnected).toBe(false)
        document.body.appendChild(host)
        expect(host.isConnected).toBe(true)
        // Must preserve the identical internals instance
        expect(controller.internals).toBe(initialInternals)
      }
    })

    it('gracefully catches NotSupportedError if attachInternals was already called on host', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createChallengerHost('internals-preattached')

      // Pre-attach ElementInternals directly on the host
      host.attachInternals()

      // Constructing FormInternalsController now must NOT crash
      const controller = new FormInternalsController(host)

      expect(warnSpy).toHaveBeenCalledWith(
        '[@moul-dev/ui] Failed to attach ElementInternals:',
        expect.any(Error),
      )
      expect(controller.internals).toBeNull()

      warnSpy.mockRestore()
    })
  })

  // =========================================================================
  // 6. FormInternalsController: Detached <form> Warnings Across Component Tags
  // =========================================================================
  describe('FormInternalsController: Detached <form> Warnings with Varied Tags', () => {
    const componentTags = [
      'moul-text-field',
      'moul-number-field',
      'moul-search-field',
      'moul-text-area',
      'moul-checkbox',
      'moul-select',
      'moul-slider',
      'moul-switch',
      'custom-input-box',
    ]

    for (const tag of componentTags) {
      it(`emits lowercase detached form warning for <${tag}> when host has name attribute outside <form>`, () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const host = createChallengerHost(tag)
        host.setAttribute('name', 'fieldName')

        new FormInternalsController(host)

        expect(warnSpy).toHaveBeenCalledWith(
          `[@moul-dev/ui] Form-associated element <${tag}> is not connected to a <form>.`,
        )
        warnSpy.mockRestore()
      })
    }

    it('emits lowercased tag warning when host tagName is uppercase', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createChallengerHost('UPPERCASE-INPUT-FIELD')
      host.setAttribute('name', 'testField')

      new FormInternalsController(host)

      expect(warnSpy).toHaveBeenCalledWith(
        '[@moul-dev/ui] Form-associated element <uppercase-input-field> is not connected to a <form>.',
      )
      warnSpy.mockRestore()
    })

    it('falls back to <element> if host tagName is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createChallengerHost('fallback-tag')
      host.setAttribute('name', 'testField')
      // Corrupt tagName
      Object.defineProperty(host, 'tagName', {
        value: undefined,
        configurable: true,
      })

      new FormInternalsController(host)

      expect(warnSpy).toHaveBeenCalledWith(
        '[@moul-dev/ui] Form-associated element <element> is not connected to a <form>.',
      )
      warnSpy.mockRestore()
    })

    it('emits detached warning when requireFormConnection: true even without name attribute', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createChallengerHost('require-conn-no-name')

      new FormInternalsController(host, { requireFormConnection: true })

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is not connected to a <form>'),
      )
      warnSpy.mockRestore()
    })

    it('does NOT emit detached warning when host is connected inside a <form>', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const form = document.createElement('form')
      document.body.appendChild(form)

      const host = createChallengerHost('connected-in-form')
      host.setAttribute('name', 'userEmail')
      form.appendChild(host)

      const controller = new FormInternalsController(host)
      expect(controller.form).toBe(form)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  // =========================================================================
  // 7. FormInternalsController: setValue with Complex Types
  // =========================================================================
  describe('FormInternalsController: Complex Data Types in setValue', () => {
    it('handles string, null, undefined, File, and complex FormData objects', () => {
      const host = createChallengerHost('internals-values')
      const controller = new FormInternalsController(host)
      const internals = controller.internals as unknown as {
        formValue: unknown
      }

      // String
      controller.setValue('moul-input-val')
      expect(internals.formValue).toBe('moul-input-val')

      // Null
      controller.setValue(null)
      expect(internals.formValue).toBeNull()

      // Undefined
      expect(() =>
        controller.setValue(undefined as unknown as null),
      ).not.toThrow()
      expect(internals.formValue).toBeUndefined()

      // File
      const file = new File(['mock content'], 'avatar.png', {
        type: 'image/png',
      })
      controller.setValue(file)
      expect(internals.formValue).toBe(file)

      // FormData with multiple keys, files, and text
      const formData = new FormData()
      formData.append('username', 'phearak')
      formData.append('resume', file)
      formData.append('tag', 'lead')
      controller.setValue(formData)
      expect(internals.formValue).toBe(formData)
    })
  })

  // =========================================================================
  // 8. FormInternalsController: setValidity 10,000-Char Truncation & Flags
  // =========================================================================
  describe('FormInternalsController: setValidity Truncation & Custom Flags', () => {
    it('asserts EXACT 200-character truncation on 10,000-character validation messages', () => {
      const host = createChallengerHost('internals-truncation-10k')
      const controller = new FormInternalsController(host)

      const tenThousandChars = 'X'.repeat(10000)
      controller.setValidity({ customError: true }, tenThousandChars)

      expect(controller.validationMessage.length).toBe(200)
      expect(controller.validationMessage).toBe('X'.repeat(200))
      expect(controller.checkValidity()).toBe(false)
    })

    it('handles edge-case string lengths: 0, 199, 200, 201, Unicode, and null/undefined', () => {
      const host = createChallengerHost('internals-truncation-bounds')
      const controller = new FormInternalsController(host)

      // Length 199
      controller.setValidity({ customError: true }, 'A'.repeat(199))
      expect(controller.validationMessage.length).toBe(199)

      // Length 200
      controller.setValidity({ customError: true }, 'B'.repeat(200))
      expect(controller.validationMessage.length).toBe(200)
      expect(controller.validationMessage).toBe('B'.repeat(200))

      // Length 201 -> truncated to 200
      controller.setValidity({ customError: true }, 'C'.repeat(201))
      expect(controller.validationMessage.length).toBe(200)
      expect(controller.validationMessage).toBe('C'.repeat(200))

      // Empty string
      controller.setValidity({ customError: true }, '')
      expect(controller.validationMessage).toBe('')

      // Null / undefined message
      controller.setValidity({ customError: true }, undefined)
      expect(controller.validationMessage).toBe('')
      controller.setValidity({ customError: true }, null as unknown as string)
      expect(controller.validationMessage).toBe('')
    })

    it('exercises all standard ValidityStateFlags individually and in combination', () => {
      const host = createChallengerHost('internals-validity-flags')
      const controller = new FormInternalsController(host)

      const flagKeys: Array<keyof ValidityStateFlags> = [
        'valueMissing',
        'typeMismatch',
        'patternMismatch',
        'tooLong',
        'tooShort',
        'rangeUnderflow',
        'rangeOverflow',
        'stepMismatch',
        'badInput',
        'customError',
      ]

      for (const flag of flagKeys) {
        controller.setValidity({ [flag]: true }, `Failed on ${flag}`)
        expect(controller.checkValidity()).toBe(false)
        expect(controller.validity?.[flag]).toBe(true)
        expect(controller.validationMessage).toBe(`Failed on ${flag}`)
      }

      // Clear flags back to valid
      controller.setValidity({})
      expect(controller.checkValidity()).toBe(true)
      expect(controller.validity?.valid).toBe(true)
      expect(controller.validationMessage).toBe('')
    })

    it('passes custom anchor element without errors', () => {
      const host = createChallengerHost('internals-anchor')
      const anchor = document.createElement('div')
      host.appendChild(anchor)

      const controller = new FormInternalsController(host)
      expect(() =>
        controller.setValidity({ valueMissing: true }, 'Required', anchor),
      ).not.toThrow()
      expect(controller.validationMessage).toBe('Required')
    })
  })

  // =========================================================================
  // 9. Stress & Memory Harness: 1,000 Controller Instances
  // =========================================================================
  describe('High-Throughput Stress Harness: 1,000 Controller Instances', () => {
    it('creates, activates, updates, and disposes 1,000 NumberSpringControllers cleanly', () => {
      const hosts: ChallengerReactiveHost[] = []
      for (let i = 0; i < 1000; i++) {
        const host = createChallengerHost(`spring-stress-${i}`)
        hosts.push(host)
        const c = new NumberSpringController(host, { initialValue: i })
        c.setTarget(i + 100)
      }

      // Cleanup all hosts
      for (const host of hosts) {
        host.remove()
      }
      expect(document.body.children.length).toBe(0)
    })

    it('creates, connects, mutates, and disposes 1,000 FormInternalsControllers cleanly', () => {
      const hosts: ChallengerReactiveHost[] = []
      for (let i = 0; i < 1000; i++) {
        const host = createChallengerHost(`internals-stress-${i}`)
        hosts.push(host)
        const c = new FormInternalsController(host)
        c.setValue(`val-${i}`)
        c.setValidity({ customError: true }, `err-${i}`)
      }

      // Cleanup all hosts
      for (const host of hosts) {
        host.remove()
      }
      expect(document.body.children.length).toBe(0)
    })
  })
})
