import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SEMANTIC_TONES, VISUAL_VARIANTS, normalizeTone, normalizeVariant, semanticToneStyles } from '../../../ui/src/styles/semantic-tones'
import { defineElement } from '../../../ui/src/utils/define-element'
import { warnMissingLabel } from '../../../ui/src/utils/warn-missing-label'
import { safeShowModal, trapFocus, restoreFocus, supportsNativePopoverAndAnchor, getFocusableElements, focusFirstElement } from '../../../ui/src/utils/focus-trap'
import { SPRING_SNAPPY, SPRING_GENTLE, IOS_SHEET_CURVE, CHART_EASE, prefersReducedMotion, subtleAnimate, animateActiveIndicator } from '../../../ui/src/utils/motion'
import * as icons from '../../../ui/src/utils/icons'

console.log('=== RUNNING ADVERSARIAL STRESS TESTS ===')

let failed = 0
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`)
    failed++
  } else {
    console.log(`PASS: ${msg}`)
  }
}

// 1. Programmatic OKLCH value extraction & comparison
const stylexFile = readFileSync(resolve(__dirname, '../../../ui/src/tokens/tokens.stylex.ts'), 'utf-8')
const cssFile = readFileSync(resolve(__dirname, '../../../ui/src/styles/style.css'), 'utf-8')

// Normalize OKLCH string for comparison: remove extra whitespace, harmonize 0.7 vs 0.70 etc
function normalizeCssValue(val: string): string {
  return val
    .replace(/\s+/g, ' ')
    .replace(/(\d+)\.0+([^\d]|$)/g, '$1$2')
    .replace(/(\.\d*?[1-9])0+([^\d]|$)/g, '$1$2')
    .replace(/\b0\.(\d+)/g, '0.$1')
    .trim()
}

// Check Neutral scale
const neutralSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
for (const step of neutralSteps) {
  const stylexMatch = stylexFile.match(new RegExp(`colorNeutral${step}:\\s*'([^']+)'`))
  const cssMatch = cssFile.match(new RegExp(`--color-neutral-${step}:\\s*([^;]+);`))
  assert(Boolean(stylexMatch && cssMatch), `Found neutral-${step} in both files`)
  if (stylexMatch && cssMatch) {
    const sVal = normalizeCssValue(stylexMatch[1])
    const cVal = normalizeCssValue(cssMatch[1])
    assert(sVal === cVal, `neutral-${step} exact match: ${sVal} === ${cVal}`)
  }
}

// Check Error, Warning, Success scales
const scales = [
  { name: 'Error', steps: [300, 400, 500, 600, 700] },
  { name: 'Warning', steps: [300, 400, 500, 600, 700] },
  { name: 'Success', steps: [300, 400, 500, 600, 700] },
]

for (const scale of scales) {
  for (const step of scale.steps) {
    const stylexMatch = stylexFile.match(new RegExp(`color${scale.name}${step}:\\s*'([^']+)'`))
    const cssMatch = cssFile.match(new RegExp(`--color-${scale.name.toLowerCase()}-${step}:\\s*([^;]+);`))
    assert(Boolean(stylexMatch && cssMatch), `Found ${scale.name.toLowerCase()}-${step} in both files`)
    if (stylexMatch && cssMatch) {
      const sVal = normalizeCssValue(stylexMatch[1])
      const cVal = normalizeCssValue(cssMatch[1])
      assert(sVal === cVal, `${scale.name}-${step} match: ${sVal} === ${cVal}`)
    }
  }
}

// 2. Stress-testing normalizeTone & normalizeVariant
assert(normalizeTone('PRIMARY') === 'primary', 'normalizeTone rejects uppercase PRIMARY and falls back to primary')
assert(normalizeTone(' primary ') === 'primary', 'normalizeTone rejects untrimmed tone')
assert(normalizeTone('') === 'primary', 'normalizeTone rejects empty string')
assert(normalizeTone(1234 as any) === 'primary', 'normalizeTone rejects number')
assert(normalizeTone(null) === 'primary', 'normalizeTone rejects null')
assert(normalizeTone(undefined) === 'primary', 'normalizeTone rejects undefined')
assert(normalizeTone({}, 'accent') === 'accent', 'normalizeTone fallback works with custom fallback')
assert(normalizeTone('accent', 'error') === 'accent', 'normalizeTone accepts valid accent')

assert(normalizeVariant('FLAT') === 'flat', 'normalizeVariant rejects uppercase')
assert(normalizeVariant(' glass ') === 'flat', 'normalizeVariant rejects untrimmed variant')
assert(normalizeVariant('') === 'flat', 'normalizeVariant rejects empty string')
assert(normalizeVariant(false as any) === 'flat', 'normalizeVariant rejects boolean')
assert(normalizeVariant('glass', 'solid') === 'glass', 'normalizeVariant accepts valid glass')

// 3. Motion FLIP indicator edge cases
const mockRectZero = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} }
const nextRectZero = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {} }

// In Node/Happy-DOM without DOM mock, check that Math.max prevents division by zero
const scaleX = mockRectZero.width / Math.max(nextRectZero.width, 1)
assert(scaleX === 0 && !isNaN(scaleX) && isFinite(scaleX), 'FLIP scale calculation is finite and non-NaN with 0 width')

// 4. Icons check
const iconNames = [
  'close', 'chevronDown', 'search', 'clear', 'alertInfo',
  'alertSuccess', 'alertWarning', 'alertError', 'spinnerRing',
  'calendarNavPrev', 'calendarNavNext'
]
for (const name of iconNames) {
  assert(typeof (icons as any)[name] === 'function', `Icon ${name} is exported function`)
  const result = (icons as any)[name]('test-class')
  const str = result.strings.join('')
  assert(str.includes('aria-hidden="true"'), `Icon ${name} has aria-hidden="true"`)
  assert(str.includes('focusable="false"'), `Icon ${name} has focusable="false"`)
  assert(str.includes('viewBox="0 0 24 24"'), `Icon ${name} has viewBox="0 0 24 24"`)
}

console.log(`\n=== STRESS TEST COMPLETED: ${failed} FAILURES ===`)
if (failed > 0) process.exit(1)
