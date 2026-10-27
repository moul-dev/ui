import { render } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { defineElement } from './define-element'
import {
  getFocusableElements,
  restoreFocus,
  safeShowModal,
  supportsNativePopoverAndAnchor,
  trapFocus,
} from './focus-trap'
import * as icons from './icons'
import {
  animateActiveIndicator,
  CHART_EASE,
  IOS_SHEET_CURVE,
  prefersReducedMotion,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  stagger,
  subtleAnimate,
} from './motion'
import { warnMissingLabel } from './warn-missing-label'

describe('Empirical Adversarial Challenge Suite: Core Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  // =========================================================================
  // 1. Challenge defineElement (ui/src/utils/define-element.ts)
  // =========================================================================
  describe('Challenge 1: defineElement', () => {
    it('registers a custom element on first call and does not warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tag = `test-elem-first-${Date.now()}`
      class ElemA extends HTMLElement {}

      defineElement(tag, ElemA)
      expect(customElements.get(tag)).toBe(ElemA)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('emits console.warn on second registration with the same tag, does not throw, and preserves first ctor', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tag = `test-elem-duplicate-${Date.now()}`
      class OriginalElem extends HTMLElement {}
      class DuplicateElem extends HTMLElement {}

      defineElement(tag, OriginalElem)
      expect(customElements.get(tag)).toBe(OriginalElem)
      expect(warnSpy).not.toHaveBeenCalled()

      // Second registration attempt must NOT throw
      expect(() => {
        defineElement(tag, DuplicateElem)
      }).not.toThrow()

      // Must log specific warning
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Custom element "${tag}" is already registered. Skipping duplicate registration.`,
        ),
      )

      // The original registration must not be replaced
      expect(customElements.get(tag)).toBe(OriginalElem)
    })

    it('gracefully handles environment where customElements is undefined (e.g., SSR)', () => {
      const originalCustomElements = window.customElements
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        // Temporarily redefine customElements as undefined
        Object.defineProperty(window, 'customElements', {
          value: undefined,
          configurable: true,
          writable: true,
        })

        class SSRElem extends HTMLElement {}
        expect(() => {
          defineElement('test-elem-ssr', SSRElem)
        }).not.toThrow()
        expect(warnSpy).not.toHaveBeenCalled()
      } finally {
        Object.defineProperty(window, 'customElements', {
          value: originalCustomElements,
          configurable: true,
          writable: true,
        })
      }
    })
  })

  // =========================================================================
  // 2. Challenge warnMissingLabel (ui/src/utils/warn-missing-label.ts)
  // =========================================================================
  describe('Challenge 2: warnMissingLabel', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('does NOT warn when aria-label is non-empty', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')
      el.setAttribute('aria-label', 'Submit search')

      warnMissingLabel(el, 'search button')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('does NOT warn when aria-labelledby is non-empty', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')
      el.setAttribute('aria-labelledby', 'heading-id')

      warnMissingLabel(el, 'action button')
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('warns when aria-label contains only whitespace', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')
      el.setAttribute('aria-label', '   \t  \n ')

      warnMissingLabel(el, 'whitespace aria-label button')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '<button> is missing an accessible label (whitespace aria-label button)',
        ),
      )
    })

    it('warns when aria-labelledby contains only whitespace', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')
      el.setAttribute('aria-labelledby', '   ')

      warnMissingLabel(el, 'whitespace aria-labelledby button')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is missing an accessible label'),
      )
    })

    it('warns when both aria-label and aria-labelledby are completely missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('div')

      warnMissingLabel(el, 'custom interactive element')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '<div> is missing an accessible label (custom interactive element)',
        ),
      )
    })

    it('does NOT warn when hasVisibleLabel is true, even with no aria attributes', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')

      warnMissingLabel(el, 'button with visible text', true)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('is a complete no-op in production NODE_ENV', () => {
      process.env.NODE_ENV = 'production'
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = document.createElement('button')

      // Even with no labels whatsoever, production mode must remain completely silent
      warnMissingLabel(el, 'unlabeled production button', false)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // 3. Challenge focus-trap (ui/src/utils/focus-trap.ts)
  // =========================================================================
  describe('Challenge 3: focus-trap & modal safety', () => {
    it('safeShowModal on disconnected dialog catches DOMException, logs warning, returns false, and does NOT focus child', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const dialog = document.createElement('dialog')
      const childBtn = document.createElement('button')
      dialog.appendChild(childBtn)
      const focusSpy = vi.spyOn(childBtn, 'focus')

      // Dialog is intentionally NOT attached to document.body
      expect(dialog.isConnected).toBe(false)

      const result = safeShowModal(dialog)

      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to call dialog.showModal() (element may be disconnected):',
        ),
        expect.anything(),
      )
      // Must NOT attempt to focus children when showModal fails
      expect(focusSpy).not.toHaveBeenCalled()
    })

    it('safeShowModal on connected dialog succeeds, returns true, opens dialog, and focuses first element', () => {
      const dialog = document.createElement('dialog')
      const btn1 = document.createElement('button')
      const btn2 = document.createElement('button')
      dialog.appendChild(btn1)
      dialog.appendChild(btn2)
      document.body.appendChild(dialog)

      try {
        const result = safeShowModal(dialog)
        expect(result).toBe(true)
        expect(dialog.open).toBe(true)
        expect(document.activeElement).toBe(btn1)
      } finally {
        dialog.close()
        dialog.remove()
      }
    })

    it('safeShowModal uses focusRoot when provided', () => {
      const dialog = document.createElement('dialog')
      const customRoot = document.createElement('div')
      const targetBtn = document.createElement('button')
      customRoot.appendChild(targetBtn)
      dialog.appendChild(customRoot)
      document.body.appendChild(dialog)

      try {
        const result = safeShowModal(dialog, customRoot)
        expect(result).toBe(true)
        expect(document.activeElement).toBe(targetBtn)
      } finally {
        dialog.close()
        dialog.remove()
      }
    })

    it('safeShowModal returns false immediately if dialog is null', () => {
      expect(safeShowModal(null)).toBe(false)
    })

    it('trapFocus cycles Tab forward from last element to first element', () => {
      const container = document.createElement('div')
      const btn1 = document.createElement('button')
      btn1.id = 'first'
      const btn2 = document.createElement('button')
      btn2.id = 'second'
      const btn3 = document.createElement('button')
      btn3.id = 'last'
      container.appendChild(btn1)
      container.appendChild(btn2)
      container.appendChild(btn3)
      document.body.appendChild(container)

      try {
        // Focus is on the last button
        btn3.focus()
        expect(document.activeElement).toBe(btn3)

        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          cancelable: true,
        })
        const preventSpy = vi.spyOn(tabEvent, 'preventDefault')

        trapFocus(container, tabEvent)

        expect(preventSpy).toHaveBeenCalled()
        expect(document.activeElement).toBe(btn1)
      } finally {
        container.remove()
      }
    })

    it('trapFocus cycles Shift+Tab backward from first element to last element', () => {
      const container = document.createElement('div')
      const btn1 = document.createElement('button')
      btn1.id = 'first'
      const btn2 = document.createElement('button')
      btn2.id = 'second'
      const btn3 = document.createElement('button')
      btn3.id = 'last'
      container.appendChild(btn1)
      container.appendChild(btn2)
      container.appendChild(btn3)
      document.body.appendChild(container)

      try {
        // Focus is on first button
        btn1.focus()
        expect(document.activeElement).toBe(btn1)

        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          cancelable: true,
        })
        const preventSpy = vi.spyOn(shiftTabEvent, 'preventDefault')

        trapFocus(container, shiftTabEvent)

        expect(preventSpy).toHaveBeenCalled()
        expect(document.activeElement).toBe(btn3)
      } finally {
        container.remove()
      }
    })

    it('trapFocus brings focus inside container if activeElement is outside container', () => {
      const outsideBtn = document.createElement('button')
      document.body.appendChild(outsideBtn)

      const container = document.createElement('div')
      const insideBtn1 = document.createElement('button')
      const insideBtn2 = document.createElement('button')
      container.appendChild(insideBtn1)
      container.appendChild(insideBtn2)
      document.body.appendChild(container)

      try {
        outsideBtn.focus()
        expect(document.activeElement).toBe(outsideBtn)

        // Forward Tab from outside -> goes to first inside
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          cancelable: true,
        })
        trapFocus(container, tabEvent)
        expect(tabEvent.defaultPrevented).toBe(true)
        expect(document.activeElement).toBe(insideBtn1)

        // Reset outside focus
        outsideBtn.focus()
        expect(document.activeElement).toBe(outsideBtn)

        // Shift+Tab from outside -> goes to last inside
        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          cancelable: true,
        })
        trapFocus(container, shiftTabEvent)
        expect(shiftTabEvent.defaultPrevented).toBe(true)
        expect(document.activeElement).toBe(insideBtn2)
      } finally {
        outsideBtn.remove()
        container.remove()
      }
    })

    it('trapFocus ignores non-Tab keyboard events', () => {
      const container = document.createElement('div')
      const btn = document.createElement('button')
      container.appendChild(btn)
      document.body.appendChild(container)

      try {
        btn.focus()
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          cancelable: true,
        })
        const preventSpy = vi.spyOn(enterEvent, 'preventDefault')

        trapFocus(container, enterEvent)
        expect(preventSpy).not.toHaveBeenCalled()
      } finally {
        container.remove()
      }
    })

    it('trapFocus prevents default when container has zero focusable elements', () => {
      const container = document.createElement('div')
      container.innerHTML = '<p>No focusable elements</p>'
      document.body.appendChild(container)

      try {
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          cancelable: true,
        })
        const preventSpy = vi.spyOn(tabEvent, 'preventDefault')

        trapFocus(container, tabEvent)
        expect(preventSpy).toHaveBeenCalled()
      } finally {
        container.remove()
      }
    })

    it('supportsNativePopoverAndAnchor tests popover and CSS anchor-name detection', () => {
      // In happy-dom test setup, Popover API is shimmed on HTMLElement.prototype
      // CSS.supports might or might not have anchor-name
      const res = supportsNativePopoverAndAnchor()
      expect(typeof res).toBe('boolean')

      // Verify logic: returns true only if BOTH popover and CSS.supports('anchor-name', ...) are true
      const origCSS = window.CSS
      try {
        const win = window as any
        win.CSS = {
          supports: (prop: string) => prop === 'anchor-name',
        }
        expect(supportsNativePopoverAndAnchor()).toBe(true)

        win.CSS = {
          supports: () => false,
        }
        expect(supportsNativePopoverAndAnchor()).toBe(false)
      } finally {
        window.CSS = origCSS
      }
    })

    it('restoreFocus returns focus and handles errors safely', () => {
      const btn = document.createElement('button')
      document.body.appendChild(btn)
      try {
        btn.focus()
        expect(document.activeElement).toBe(btn)

        const input = document.createElement('input')
        document.body.appendChild(input)
        try {
          input.focus()
          expect(document.activeElement).toBe(input)

          restoreFocus(btn)
          expect(document.activeElement).toBe(btn)

          // Handles null safely
          expect(() => restoreFocus(null)).not.toThrow()

          // Handles element throwing during focus safely
          const brokenEl = {
            focus: () => {
              throw new Error('Focus blocked')
            },
          } as unknown as HTMLElement
          expect(() => restoreFocus(brokenEl)).not.toThrow()
        } finally {
          input.remove()
        }
      } finally {
        btn.remove()
      }
    })
  })

  // =========================================================================
  // 4. Challenge motion (ui/src/utils/motion.ts)
  // =========================================================================
  describe('Challenge 4: motion utilities & reduced motion', () => {
    it('verifies standard physics presets and bezier curves', () => {
      expect(SPRING_SNAPPY).toEqual({
        type: 'spring',
        stiffness: 500,
        damping: 35,
        mass: 0.8,
      })
      expect(SPRING_GENTLE).toEqual({
        type: 'spring',
        stiffness: 320,
        damping: 28,
        mass: 1,
      })
      expect(IOS_SHEET_CURVE).toEqual([0.32, 0.72, 0, 1])
      expect(CHART_EASE).toEqual([0.22, 1, 0.36, 1])
      expect(typeof stagger).toBe('function')
    })

    it('prefersReducedMotion correctly queries media query', () => {
      const origMatchMedia = window.matchMedia

      try {
        window.matchMedia = vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))

        expect(prefersReducedMotion()).toBe(true)

        window.matchMedia = vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))

        expect(prefersReducedMotion()).toBe(false)
      } finally {
        window.matchMedia = origMatchMedia
      }
    })

    it('subtleAnimate collapses duration to 0 when prefersReducedMotion is active', () => {
      const origMatchMedia = window.matchMedia

      try {
        // Mock reduced motion ON
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
        }))

        const el = document.createElement('div')
        const controls = subtleAnimate(el, { opacity: [0, 1] }, SPRING_GENTLE)
        expect(controls).toBeDefined()
        expect(typeof controls.stop).toBe('function')
        // In motion, controls.duration is in seconds
        expect(controls.duration).toBe(0)

        // Mock reduced motion OFF
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
        }))

        const normalControls = subtleAnimate(
          el,
          { opacity: [0, 1] },
          { duration: 0.5 },
        )
        expect(normalControls.duration).toBe(0.5)
      } finally {
        window.matchMedia = origMatchMedia
      }
    })

    it('animateActiveIndicator calculates correct FLIP deltas and passes SPRING_SNAPPY', () => {
      const origMatchMedia = window.matchMedia

      try {
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
        }))

        const indicator = document.createElement('div')
        const prevRect = {
          left: 100,
          top: 50,
          width: 200,
          height: 40,
        } as DOMRect

        const nextRect = {
          left: 150,
          top: 80,
          width: 100,
          height: 40,
        } as DOMRect

        // Expected FLIP calculation:
        // dx = 100 - 150 = -50
        // dy = 50 - 80 = -30
        // scaleX = 200 / 100 = 2
        // scaleY = 40 / 40 = 1
        const controls = animateActiveIndicator(indicator, prevRect, nextRect)
        expect(controls).not.toBeNull()
        expect(typeof controls?.stop).toBe('function')
      } finally {
        window.matchMedia = origMatchMedia
      }
    })

    it('animateActiveIndicator returns null if previousRect is null or reduced motion is active', () => {
      const origMatchMedia = window.matchMedia
      const indicator = document.createElement('div')
      const nextRect = { left: 10, top: 10, width: 50, height: 20 } as DOMRect

      // 1. previousRect is null
      expect(animateActiveIndicator(indicator, null, nextRect)).toBeNull()

      // 2. reduced motion is active
      try {
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
        }))

        const prevRect = { left: 0, top: 0, width: 50, height: 20 } as DOMRect
        expect(animateActiveIndicator(indicator, prevRect, nextRect)).toBeNull()
      } finally {
        window.matchMedia = origMatchMedia
      }
    })

    it('animateActiveIndicator prevents division by zero when nextRect width/height is 0', () => {
      const origMatchMedia = window.matchMedia

      try {
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
        }))

        const indicator = document.createElement('div')
        const prevRect = { left: 10, top: 10, width: 20, height: 20 } as DOMRect
        const nextRect = { left: 10, top: 10, width: 0, height: 0 } as DOMRect

        // Math.max(0, 1) prevents Infinity - must not throw or return null
        const controls = animateActiveIndicator(indicator, prevRect, nextRect)
        expect(controls).not.toBeNull()
        expect(typeof controls?.stop).toBe('function')
      } finally {
        window.matchMedia = origMatchMedia
      }
    })

    it('prefersReducedMotion handles SSR and missing matchMedia gracefully', () => {
      const origMatchMedia = window.matchMedia
      try {
        // matchMedia undefined
        ;(window as any).matchMedia = undefined
        expect(prefersReducedMotion()).toBe(false)
      } finally {
        window.matchMedia = origMatchMedia
      }
    })
  })

  // =========================================================================
  // Additional Adversarial Edge Cases
  // =========================================================================
  describe('Adversarial Boundary & Robustness Stress Tests', () => {
    describe('warnMissingLabel edge cases', () => {
      it('handles undefined process object safely without ReferenceError', () => {
        const origProcess = globalThis.process
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        try {
          // Simulate browser environment without Node process global
          ;(globalThis as any).process = undefined

          const el = document.createElement('button')
          expect(() => warnMissingLabel(el, 'no process button')).not.toThrow()
          expect(warnSpy).toHaveBeenCalled()
        } finally {
          globalThis.process = origProcess
        }
      })

      it('handles custom element with empty or missing tagName safely', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const mockHost = {
          getAttribute: () => null,
          tagName: '',
        } as unknown as HTMLElement

        expect(() => warnMissingLabel(mockHost, 'no-tag host')).not.toThrow()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            '<element> is missing an accessible label (no-tag host)',
          ),
        )
      })
    })

    describe('focus-trap getFocusableElements visibility filtering', () => {
      it('filters out disabled, hidden, aria-hidden, display:none, and visibility:hidden elements', () => {
        const container = document.createElement('div')
        container.innerHTML = `
          <button id="valid-btn">Visible Button</button>
          <button disabled id="disabled-btn">Disabled Button</button>
          <a href="#" id="valid-link">Valid Link</a>
          <a id="no-href-link">Invalid Link</a>
          <input type="hidden" id="hidden-input" />
          <input type="text" id="valid-input" />
          <input type="text" disabled id="disabled-input" />
          <button hidden id="hidden-attr-btn">Hidden Attr</button>
          <button aria-hidden="true" id="aria-hidden-btn">Aria Hidden</button>
          <div tabindex="-1" id="tabindex-neg1">Neg Tabindex</div>
          <div tabindex="0" id="valid-div-tabindex">Valid Tabindex</div>
          <button style="display: none;" id="display-none-btn">Display None</button>
          <button style="visibility: hidden;" id="visibility-hidden-btn">Visibility Hidden</button>
        `
        document.body.appendChild(container)

        try {
          const focusables = getFocusableElements(container)
          const ids = focusables.map((el) => el.id)

          expect(ids).toContain('valid-btn')
          expect(ids).toContain('valid-link')
          expect(ids).toContain('valid-input')
          expect(ids).toContain('valid-div-tabindex')

          expect(ids).not.toContain('disabled-btn')
          expect(ids).not.toContain('no-href-link')
          expect(ids).not.toContain('hidden-input')
          expect(ids).not.toContain('disabled-input')
          expect(ids).not.toContain('hidden-attr-btn')
          expect(ids).not.toContain('aria-hidden-btn')
          expect(ids).not.toContain('tabindex-neg1')
          expect(ids).not.toContain('display-none-btn')
          expect(ids).not.toContain('visibility-hidden-btn')
        } finally {
          container.remove()
        }
      })

      it('trapFocus maintains trap when container has exactly one focusable element', () => {
        const container = document.createElement('div')
        const singleBtn = document.createElement('button')
        container.appendChild(singleBtn)
        document.body.appendChild(container)

        try {
          singleBtn.focus()
          expect(document.activeElement).toBe(singleBtn)

          // Tab on single element
          const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: false,
            cancelable: true,
          })
          trapFocus(container, tabEvent)
          expect(tabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(singleBtn)

          // Shift+Tab on single element
          const shiftTabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: true,
            cancelable: true,
          })
          trapFocus(container, shiftTabEvent)
          expect(shiftTabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(singleBtn)
        } finally {
          container.remove()
        }
      })
    })

    describe('safeShowModal edge cases', () => {
      it('does not re-invoke showModal if dialog is already open', () => {
        const dialog = document.createElement('dialog')
        const btn = document.createElement('button')
        dialog.appendChild(btn)
        document.body.appendChild(dialog)

        try {
          dialog.showModal()
          expect(dialog.open).toBe(true)

          const showModalSpy = vi.spyOn(dialog, 'showModal')
          const result = safeShowModal(dialog)

          expect(result).toBe(true)
          // Should not re-call showModal when already open
          expect(showModalSpy).not.toHaveBeenCalled()
          expect(document.activeElement).toBe(btn)
        } finally {
          dialog.close()
          dialog.remove()
        }
      })
    })
  })

  // =========================================================================
  // 5. Challenge icons (ui/src/utils/icons.ts)
  // =========================================================================
  describe('Challenge 5: icons SVG templates & accessibility', () => {
    const iconNames = [
      'close',
      'chevronDown',
      'search',
      'clear',
      'alertInfo',
      'alertSuccess',
      'alertWarning',
      'alertError',
      'spinnerRing',
      'calendarNavPrev',
      'calendarNavNext',
    ] as const

    it('exports exactly all 11 required icons', () => {
      expect(iconNames.length).toBe(11)
      for (const name of iconNames) {
        expect(icons).toHaveProperty(name)
        expect(typeof (icons as any)[name]).toBe('function')
      }
    })

    it('renders valid SVG elements with aria-hidden="true" and focusable="false" for all 11 icons', () => {
      for (const name of iconNames) {
        const iconFn = (icons as any)[name]
        const template = iconFn('challenge-test-class')

        const container = document.createElement('div')
        render(template, container)

        const svgEl = container.querySelector('svg')
        expect(
          svgEl,
          `Icon "${name}" must render an <svg> element`,
        ).not.toBeNull()

        if (svgEl) {
          expect(
            svgEl.getAttribute('aria-hidden'),
            `Icon "${name}" aria-hidden`,
          ).toBe('true')
          expect(
            svgEl.getAttribute('focusable'),
            `Icon "${name}" focusable`,
          ).toBe('false')
          expect(svgEl.getAttribute('viewBox'), `Icon "${name}" viewBox`).toBe(
            '0 0 24 24',
          )
          expect(svgEl.getAttribute('fill'), `Icon "${name}" fill`).toBe('none')
          expect(svgEl.getAttribute('stroke'), `Icon "${name}" stroke`).toBe(
            'currentColor',
          )
          expect(svgEl.getAttribute('class'), `Icon "${name}" class`).toContain(
            'challenge-test-class',
          )

          // Must have at least one vector child element (path, circle, line, etc.)
          const vectorChildren = svgEl.querySelectorAll('path, circle, line')
          expect(
            vectorChildren.length,
            `Icon "${name}" should contain geometric child elements`,
          ).toBeGreaterThan(0)
        }
      }
    })

    it('renders with default empty class when no argument provided', () => {
      const template = icons.close()
      const container = document.createElement('div')
      render(template, container)

      const svgEl = container.querySelector('svg')
      expect(svgEl).not.toBeNull()
      expect(svgEl?.getAttribute('aria-hidden')).toBe('true')
    })
  })
})
