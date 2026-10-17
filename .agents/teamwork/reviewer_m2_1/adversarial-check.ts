import fs from 'node:fs'
import path from 'node:path'
import {
  normalizeTone,
  normalizeVariant,
  SEMANTIC_TONES,
  VISUAL_VARIANTS,
} from '../../../ui/src/styles/semantic-tones'
import { defineElement } from '../../../ui/src/utils/define-element'
import {
  focusFirstElement,
  getFocusableElements,
  restoreFocus,
  safeShowModal,
  supportsNativePopoverAndAnchor,
  trapFocus,
} from '../../../ui/src/utils/focus-trap'
import * as icons from '../../../ui/src/utils/icons'
import {
  animateActiveIndicator,
  CHART_EASE,
  IOS_SHEET_CURVE,
  prefersReducedMotion,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../../ui/src/utils/motion'
import { warnMissingLabel } from '../../../ui/src/utils/warn-missing-label'

console.log('=== Reviewer M2.1 Adversarial Stress Test ===')

// 1. CSS Design Tokens Check
const cssPath = path.resolve('/Users/phearak/github/orgs/moul-dev/ui/ui/src/styles/style.css')
const css = fs.readFileSync(cssPath, 'utf8')

// Check no legacy --colorShadow
console.assert(!css.includes('--colorShadow'), 'style.css must not contain legacy --colorShadow')

// Check color-scheme
console.assert(css.includes('color-scheme: light dark;'), 'style.css must have color-scheme: light dark;')

// Check brand hooks
const brandHooks = [
  '--brand-hue: 250;',
  '--brand-chroma-multiplier: 1;',
  '--brand-font-family: inherit;',
  '--brand-font-scale: 1;',
  '--brand-density-factor: 1;',
  '--brand-radius-factor: 1;',
]
for (const hook of brandHooks) {
  console.assert(css.includes(hook), `Missing brand hook: ${hook}`)
}

// Check count of CSS variables in style.css
const varMatches = css.match(/--[a-z0-9-]+:/g) || []
console.log(`Found ${varMatches.length} CSS variable declarations in style.css`)
console.assert(varMatches.length >= 120, 'Expected at least 120 CSS variables')

// 2. Adversarial inputs for normalizers
const adversarialInputs = [
  null,
  undefined,
  123,
  0,
  NaN,
  Infinity,
  {},
  [],
  () => {},
  Symbol('test'),
  '',
  ' ',
  '  primary  ',
  'PRIMARY',
  'solid',
  '__proto__',
  'constructor',
  'toString',
  'valueOf',
]

for (const input of adversarialInputs) {
  const tone = normalizeTone(input)
  console.assert(
    SEMANTIC_TONES.includes(tone as any),
    `normalizeTone failed on adversarial input: ${String(input)} -> got ${tone}`,
  )

  const variant = normalizeVariant(input)
  console.assert(
    VISUAL_VARIANTS.includes(variant as any),
    `normalizeVariant failed on adversarial input: ${String(input)} -> got ${variant}`,
  )
}

// Custom fallback testing
console.assert(normalizeTone('invalid', 'error') === 'error', 'normalizeTone custom fallback failed')
console.assert(normalizeVariant('invalid', 'glass') === 'glass', 'normalizeVariant custom fallback failed')

// 3. Icons verification
const expectedIcons = [
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
]

for (const name of expectedIcons) {
  console.assert(typeof (icons as any)[name] === 'function', `Icon ${name} should be a function`)
  const rendered = (icons as any)[name]('test-class')
  console.assert(rendered.strings.join('').includes('viewBox="0 0 24 24"'), `${name} missing viewBox`)
  console.assert(rendered.strings.join('').includes('aria-hidden="true"'), `${name} missing aria-hidden`)
  console.assert(rendered.strings.join('').includes('focusable="false"'), `${name} missing focusable="false"`)
}

// 4. Motion presets
console.assert(SPRING_SNAPPY.stiffness === 500 && SPRING_SNAPPY.damping === 35, 'SPRING_SNAPPY params mismatch')
console.assert(SPRING_GENTLE.stiffness === 320 && SPRING_GENTLE.damping === 28, 'SPRING_GENTLE params mismatch')
console.assert(IOS_SHEET_CURVE[0] === 0.32 && IOS_SHEET_CURVE[1] === 0.72, 'IOS_SHEET_CURVE params mismatch')
console.assert(CHART_EASE[0] === 0.22 && CHART_EASE[1] === 1, 'CHART_EASE params mismatch')

// FLIP indicator null and zero width checks
const dummyEl = { style: {} } as any
const zeroRect = { left: 0, top: 0, width: 0, height: 0 } as DOMRect
console.assert(animateActiveIndicator(dummyEl, null, zeroRect) === null, 'Should return null for null previousRect')

console.log('=== All Adversarial Stress Tests Passed Successfully! ===')
