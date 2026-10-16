import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as fc from 'fast-check'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  normalizeTone,
  normalizeVariant,
  SEMANTIC_TONES,
  semanticToneStyles,
  VISUAL_VARIANTS,
} from '../styles/semantic-tones'
import { defineElement } from '../utils/define-element'
import {
  focusFirstElement,
  restoreFocus,
  safeShowModal,
  supportsNativePopoverAndAnchor,
  trapFocus,
} from '../utils/focus-trap'
import * as icons from '../utils/icons'
import {
  animateActiveIndicator,
  CHART_EASE,
  IOS_SHEET_CURVE,
  prefersReducedMotion,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../utils/motion'
import { warnMissingLabel } from '../utils/warn-missing-label'

describe('Milestone 2 Token & Utility Verification Test Suite', () => {
  // ===========================================================================
  // 1. CSS Design Token Layer (:root properties in ui/src/styles/style.css)
  // ===========================================================================
  describe('CSS Design Token Layer (style.css)', () => {
    const cssPath = resolve(__dirname, '../styles/style.css')
    const cssContent = readFileSync(cssPath, 'utf-8')

    it('defines color-scheme and theme selectors', () => {
      expect(cssContent).toMatch(/color-scheme:\s*light dark;/)
      expect(cssContent).toMatch(/\[data-theme="light"\]/)
      expect(cssContent).toMatch(/\[data-theme="dark"\]/)
      expect(cssContent).toMatch(/\.dark/)
    })

    it('defines all 6 brand customization hooks with required default values', () => {
      expect(cssContent).toMatch(/--brand-hue:\s*250;/)
      expect(cssContent).toMatch(/--brand-chroma-multiplier:\s*1;/)
      expect(cssContent).toMatch(/--brand-font-family:\s*inherit;/)
      expect(cssContent).toMatch(/--brand-font-scale:\s*1;/)
      expect(cssContent).toMatch(/--brand-density-factor:\s*1;/)
      expect(cssContent).toMatch(/--brand-radius-factor:\s*1;/)
    })

    it('defines all Neutral scale tokens (50–900) using light-dark(oklch(...))', () => {
      const neutralSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      for (const step of neutralSteps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-neutral-${step}:\\s*light-dark\\(\\s*oklch\\(`),
        )
      }
    })

    it('defines all Primary scale tokens (50–900) using light-dark(oklch(...))', () => {
      const primarySteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      for (const step of primarySteps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-primary-${step}:\\s*light-dark\\(\\s*oklch\\(`),
        )
      }
    })

    it('defines all Error, Warning, and Success scales (300–700) using light-dark(oklch(...))', () => {
      const steps = [300, 400, 500, 600, 700]
      for (const step of steps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-error-${step}:\\s*light-dark\\(\\s*oklch\\(`),
        )
        expect(cssContent).toMatch(
          new RegExp(`--color-warning-${step}:\\s*light-dark\\(\\s*oklch\\(`),
        )
        expect(cssContent).toMatch(
          new RegExp(`--color-success-${step}:\\s*light-dark\\(\\s*oklch\\(`),
        )
      }
    })

    it('defines all 13 semantic surface, text, and border aliases', () => {
      const aliases = [
        '--color-bg',
        '--color-bg-subtle',
        '--color-bg-elevated',
        '--color-fg',
        '--color-fg-subtle',
        '--color-fg-on-primary',
        '--color-border',
        '--color-border-subtle',
        '--color-border-focus',
        '--color-bg-glass',
        '--color-border-glass',
        '--color-shadow',
        '--color-overlay',
      ]
      for (const alias of aliases) {
        expect(cssContent).toMatch(new RegExp(`${alias}:`))
      }
    })

    it('defines all 20 alert status color tokens', () => {
      const tones = ['info', 'accent', 'success', 'warning', 'error']
      const props = ['bg', 'border', 'hover', 'active']
      for (const tone of tones) {
        for (const prop of props) {
          expect(cssContent).toMatch(
            new RegExp(`--color-alert-${prop}-${tone}:`),
          )
        }
      }
    })

    it('defines typography tokens (sizes xs-4xl, line-heights xs-4xl, font-weights)', () => {
      const sizeSteps = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl']
      for (const step of sizeSteps) {
        expect(cssContent).toMatch(new RegExp(`--font-size-${step}:`))
        expect(cssContent).toMatch(new RegExp(`--line-height-${step}:`))
      }
      expect(cssContent).toMatch(/--font-weight-normal:\s*400;/)
      expect(cssContent).toMatch(/--font-weight-medium:\s*500;/)
      expect(cssContent).toMatch(/--font-weight-semibold:\s*600;/)
      expect(cssContent).toMatch(/--font-weight-bold:\s*700;/)
      expect(cssContent).toMatch(/--font-family-base:/)
    })

    it('defines spacing-1 through spacing-8 tokens', () => {
      for (let i = 1; i <= 8; i++) {
        expect(cssContent).toMatch(new RegExp(`--spacing-${i}:`))
      }
    })

    it('defines radius tokens (none, sm, md, lg, full)', () => {
      const radii = ['none', 'sm', 'md', 'lg', 'full']
      for (const r of radii) {
        expect(cssContent).toMatch(new RegExp(`--radius-${r}:`))
      }
    })

    it('strictly references --color-shadow in shadow tokens and never legacy --colorShadow', () => {
      expect(cssContent).toMatch(/--shadow-sm:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).toMatch(/--shadow-md:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).toMatch(/--shadow-lg:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).not.toMatch(/--colorShadow/)
    })

    it('defines z-index tokens and chart colors 1 through 8', () => {
      expect(cssContent).toMatch(/--z-base:\s*0;/)
      expect(cssContent).toMatch(/--z-dropdown:\s*1000;/)
      expect(cssContent).toMatch(/--z-modal:\s*1300;/)
      expect(cssContent).toMatch(/--z-tooltip:\s*1500;/)
      expect(cssContent).toMatch(/--z-toast:\s*1700;/)

      for (let i = 1; i <= 8; i++) {
        expect(cssContent).toMatch(
          new RegExp(`--color-chart-${i}:\\s*light-dark\\(\\s*oklch\\(`),
        )
      }
    })
  })

  // ===========================================================================
  // 2. Semantic Tone & Visual Variant Matrix (25 combinations)
  // ===========================================================================
  describe('Semantic Tones & Visual Variants Matrix', () => {
    it('covers all 25 tone × variant combinations using fast-check', () => {
      const stylesText = Array.isArray(semanticToneStyles)
        ? semanticToneStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((semanticToneStyles as any).cssText ?? String(semanticToneStyles))

      fc.assert(
        fc.property(
          fc.constantFrom(...SEMANTIC_TONES),
          fc.constantFrom(...VISUAL_VARIANTS),
          (tone, variant) => {
            const hasToneSelector =
              stylesText.includes(`tone="${tone}"`) ||
              stylesText.includes(`data-tone="${tone}"`)
            const hasVariantSelector =
              stylesText.includes(`variant="${variant}"`) ||
              stylesText.includes(`data-variant="${variant}"`)
            return hasToneSelector && hasVariantSelector
          },
        ),
      )
    })

    it('provides solid background fallback and progressive blur enhancement for glass variant', () => {
      const stylesText = Array.isArray(semanticToneStyles)
        ? semanticToneStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((semanticToneStyles as any).cssText ?? String(semanticToneStyles))

      expect(stylesText).toMatch(/var\(--color-bg-glass\)/)
      expect(stylesText).toMatch(/var\(--color-border-glass\)/)
      expect(stylesText).toMatch(/@supports\s*\([^)]*backdrop-filter:\s*blur/)
      expect(stylesText).toMatch(/var\(--shadow-md\)/)
    })
  })

  // ===========================================================================
  // 3. Property-Based Input Normalization Resilience
  // ===========================================================================
  describe('Input Normalizers Property Tests', () => {
    it('normalizeTone safely handles arbitrary string inputs', () => {
      fc.assert(
        fc.property(fc.string(), (val) => {
          const result = normalizeTone(val)
          if (SEMANTIC_TONES.includes(val as any)) {
            return result === val
          }
          return result === 'primary'
        }),
      )
    })

    it('normalizeTone supports custom fallback', () => {
      expect(normalizeTone('invalid-random-tone', 'success')).toBe('success')
      expect(normalizeTone(null, 'error')).toBe('error')
      expect(normalizeTone(undefined, 'warning')).toBe('warning')
      expect(normalizeTone(12345 as any, 'accent')).toBe('accent')
    })

    it('normalizeVariant safely handles arbitrary string inputs', () => {
      fc.assert(
        fc.property(fc.string(), (val) => {
          const result = normalizeVariant(val)
          if (VISUAL_VARIANTS.includes(val as any)) {
            return result === val
          }
          return result === 'flat'
        }),
      )
    })

    it('normalizeVariant supports custom fallback', () => {
      expect(normalizeVariant('unknown-variant', 'glass')).toBe('glass')
      expect(normalizeVariant(null, 'solid')).toBe('solid')
      expect(normalizeVariant(undefined, 'shadow')).toBe('shadow')
      expect(normalizeVariant({} as any, 'bordered')).toBe('bordered')
    })
  })

  // ===========================================================================
  // 4. Core Utilities Verification
  // ===========================================================================
  describe('Core Utilities', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    describe('defineElement', () => {
      it('idempotently registers custom elements and emits console.warn on duplicates', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const tagName = `moul-test-idempotent-${Date.now()}`
        class TestElement extends HTMLElement {}

        // First registration
        defineElement(tagName, TestElement)
        expect(customElements.get(tagName)).toBe(TestElement)
        expect(warnSpy).not.toHaveBeenCalled()

        // Duplicate registration attempt
        class DuplicateElement extends HTMLElement {}
        expect(() => defineElement(tagName, DuplicateElement)).not.toThrow()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `Custom element "${tagName}" is already registered`,
          ),
        )
        // Original constructor must be preserved
        expect(customElements.get(tagName)).toBe(TestElement)
      })
    })

    describe('warnMissingLabel', () => {
      it('warns when aria-label and aria-labelledby are missing in dev mode', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'is missing an accessible label (icon-only action)',
          ),
        )
      })

      it('does not warn when aria-label or aria-labelledby is present', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        button.setAttribute('aria-label', 'Close dialog')
        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).not.toHaveBeenCalled()

        button.removeAttribute('aria-label')
        button.setAttribute('aria-labelledby', 'title-id')
        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('warns when aria-label contains only whitespace', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')
        button.setAttribute('aria-label', '   ')

        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).toHaveBeenCalled()
      })

      it('does not warn when hasVisibleLabel is true', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        warnMissingLabel(button, 'action', true)
        expect(warnSpy).not.toHaveBeenCalled()
      })
    })

    describe('focus-trap utilities', () => {
      it('supportsNativePopoverAndAnchor correctly identifies environment features', () => {
        const result = supportsNativePopoverAndAnchor()
        expect(typeof result).toBe('boolean')
      })

      it('safeShowModal catches disconnected DOMException and emits console.warn', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const dialog = document.createElement('dialog') // Disconnected

        const success = safeShowModal(dialog)
        expect(success).toBe(false)
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to call dialog.showModal()'),
          expect.anything(),
        )
      })

      it('safeShowModal opens connected dialog and focuses first interactive element', () => {
        const dialog = document.createElement('dialog')
        const button = document.createElement('button')
        dialog.appendChild(button)
        document.body.appendChild(dialog)

        try {
          const success = safeShowModal(dialog)
          expect(success).toBe(true)
          expect(dialog.open).toBe(true)
          expect(document.activeElement).toBe(button)
        } finally {
          dialog.close()
          dialog.remove()
        }
      })

      it('safeShowModal safely returns false on null dialog', () => {
        expect(safeShowModal(null)).toBe(false)
      })

      it('focusFirstElement safely finds focusable elements', () => {
        const container = document.createElement('div')
        const btn1 = document.createElement('button')
        const btn2 = document.createElement('button')
        container.appendChild(btn1)
        container.appendChild(btn2)
        document.body.appendChild(container)

        try {
          const focused = focusFirstElement(container)
          expect(focused).toBe(btn1)
          expect(document.activeElement).toBe(btn1)
        } finally {
          container.remove()
        }
      })

      it('trapFocus cycles Tab forward and backward', () => {
        const container = document.createElement('div')
        const firstBtn = document.createElement('button')
        const lastBtn = document.createElement('button')
        container.appendChild(firstBtn)
        container.appendChild(lastBtn)
        document.body.appendChild(container)

        try {
          lastBtn.focus()
          expect(document.activeElement).toBe(lastBtn)

          // Forward Tab from last element wraps to first
          const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: false,
            cancelable: true,
          })
          trapFocus(container, tabEvent)
          expect(tabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(firstBtn)

          // Backward Shift+Tab from first element wraps to last
          const shiftTabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: true,
            cancelable: true,
          })
          trapFocus(container, shiftTabEvent)
          expect(shiftTabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(lastBtn)
        } finally {
          container.remove()
        }
      })

      it('restoreFocus returns focus to previous element', () => {
        const btn = document.createElement('button')
        document.body.appendChild(btn)
        try {
          btn.focus()
          expect(document.activeElement).toBe(btn)
          const other = document.createElement('input')
          document.body.appendChild(other)
          try {
            other.focus()
            expect(document.activeElement).toBe(other)
            restoreFocus(btn)
            expect(document.activeElement).toBe(btn)
          } finally {
            other.remove()
          }
        } finally {
          btn.remove()
        }
      })
    })

    describe('motion utilities', () => {
      it('exports correct animation presets', () => {
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
      })

      it('prefersReducedMotion returns boolean', () => {
        expect(typeof prefersReducedMotion()).toBe('boolean')
      })

      it('subtleAnimate initiates animation controls', () => {
        const el = document.createElement('div')
        const controls = subtleAnimate(
          el,
          { opacity: [0, 1] },
          { duration: 0.1 },
        )
        expect(controls).toBeDefined()
        expect(typeof controls.stop).toBe('function')
      })

      it('animateActiveIndicator returns null if previousRect is null', () => {
        const el = document.createElement('div')
        const nextRect = {
          left: 10,
          top: 10,
          width: 100,
          height: 40,
        } as DOMRect
        const controls = animateActiveIndicator(el, null, nextRect)
        expect(controls).toBeNull()
      })
    })

    describe('icons utility', () => {
      it('exports all 11 required SVG icon templates with aria-hidden and focusable=false', () => {
        const requiredIcons = [
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

        for (const name of requiredIcons) {
          expect(icons).toHaveProperty(name)
          const template = (icons as any)[name]()
          expect(template).toBeDefined()
          const html = template.strings.join('')
          expect(html).toContain('aria-hidden="true"')
          expect(html).toContain('focusable="false"')
          expect(html).toContain('viewBox="0 0 24 24"')
        }
      })
    })
  })
})
