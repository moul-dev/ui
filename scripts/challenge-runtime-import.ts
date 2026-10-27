#!/usr/bin/env bun
/**
 * Adversarial Challenger: Runtime Importation & Idempotency Stress Harness
 *
 * Verifies:
 * 1. Headless importation of ui/dist/moul-ui.js
 * 2. Complete catalog parity (all 77 custom elements registered in customElements registry)
 * 3. Successful document.createElement instantiation & DOM lifecycle (connect/disconnect) for all 77 tags
 * 4. Repeated importation idempotency under high-frequency stress (25 iterations)
 * 5. Registry stability: constructor references remain immutable after barrage
 * 6. Non-element exports: 5 reactive controllers, singletons, pagination, log parsers
 * 7. Zero React runtime symbols
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { GlobalWindow } from '../ui/node_modules/happy-dom'

const rootDir = resolve(__dirname, '..')
const distUiPath = resolve(rootDir, 'ui/dist/moul-ui.js')
const cemPath = resolve(rootDir, 'ui/dist/custom-elements.json')

console.log(
  '======================================================================',
)
console.log(
  'CHALLENGE: Headless Runtime Import & Custom Element Idempotency Stress',
)
console.log(
  '======================================================================\n',
)

// 1. Verify bundle files exist
if (!existsSync(distUiPath)) {
  console.error(`FATAL: ${distUiPath} does not exist! Run build:ui first.`)
  process.exit(1)
}
if (!existsSync(cemPath)) {
  console.error(`FATAL: ${cemPath} does not exist!`)
  process.exit(1)
}

// 2. Setup headless browser environment
const win = new GlobalWindow()
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) {
    try {
      ;(globalThis as any)[key] = (win as any)[key]
    } catch {
      // Ignore read-only globals
    }
  }
}
globalThis.window = win as any
globalThis.document = win.document as any
globalThis.customElements = win.customElements as any
globalThis.HTMLElement = win.HTMLElement as any

// 3. Load expected tags from CEM
const cem = JSON.parse(readFileSync(cemPath, 'utf-8'))
const expectedTags: string[] = cem.modules
  .flatMap((m: any) => m.exports || [])
  .filter((e: any) => e.kind === 'custom-element-definition')
  .map((e: any) => e.name)

console.log(
  `[Phase 1] CEM declares ${expectedTags.length} custom element tags.`,
)
if (expectedTags.length !== 77) {
  console.error(
    `FAIL: Expected exactly 77 custom elements in CEM, but found ${expectedTags.length}`,
  )
  process.exit(1)
}

// 4. Initial runtime import
console.log('[Phase 2] Importing dist/moul-ui.js for the first time...')
const firstImport = await import(distUiPath)
console.log(
  `✓ Initial import succeeded with ${Object.keys(firstImport).length} exports.`,
)

// 5. Verify all 77 tags are defined in customElements registry
console.log('[Phase 3] Checking customElements registry for all 77 tags...')
const initialCtors = new Map<string, any>()
for (const tag of expectedTags) {
  const ctor = customElements.get(tag)
  if (!ctor) {
    console.error(
      `FAIL: Custom element <${tag}> was not registered in customElements!`,
    )
    process.exit(1)
  }
  initialCtors.set(tag, ctor)
}
console.log(
  `✓ All ${expectedTags.length} custom elements verified in registry.`,
)

// 6. Test document.createElement instantiation and lifecycle for all 77 elements
console.log(
  '[Phase 4] Testing document.createElement instantiation & DOM lifecycle for all 77 tags...',
)
for (const tag of expectedTags) {
  try {
    const el = document.createElement(tag)
    if (!(el instanceof HTMLElement)) {
      console.error(`FAIL: <${tag}> is not an instance of HTMLElement!`)
      process.exit(1)
    }
    const ctor = initialCtors.get(tag)
    if (el.constructor !== ctor) {
      console.error(`FAIL: <${tag}> constructor mismatch!`)
      process.exit(1)
    }

    // Mount to document.body (connectedCallback)
    document.body.appendChild(el)
    if (!el.isConnected) {
      console.error(`FAIL: <${tag}> isConnected is false after appendChild!`)
      process.exit(1)
    }

    // Unmount from document.body (disconnectedCallback)
    document.body.removeChild(el)
    if (el.isConnected) {
      console.error(`FAIL: <${tag}> isConnected is true after removeChild!`)
      process.exit(1)
    }
  } catch (err) {
    console.error(`FAIL: Error instantiating or mounting <${tag}>:`, err)
    process.exit(1)
  }
}
// Flush pending Lit microtasks before starting next phase
await new Promise((r) => setTimeout(r, 100))
console.log(
  `✓ All ${expectedTags.length} custom elements instantiated and cycled through DOM lifecycle cleanly.`,
)

// 7. Repeated importation and defineElement idempotency stress test
console.log(
  '[Phase 5] Stress testing repeated importation & defineElement idempotency (25 iterations)...',
)
const duplicateWarningsCaught: string[] = []
const otherWarningsCaught: string[] = []
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  const msg = args.join(' ')
  if (msg.includes('is already registered. Skipping duplicate registration')) {
    duplicateWarningsCaught.push(msg)
  } else {
    otherWarningsCaught.push(msg)
  }
}

try {
  for (let i = 1; i <= 25; i++) {
    // Cache-busting import to force module re-execution
    await import(`${distUiPath}?stress=${i}`)
  }
} finally {
  console.warn = originalWarn
}

console.log(
  `✓ Captured ${duplicateWarningsCaught.length} duplicate registration warnings during 25 re-imports.`,
)
const expectedWarnings = 77 * 25 // 77 tags * 25 runs
if (duplicateWarningsCaught.length !== expectedWarnings) {
  console.error(
    `FAIL: Expected ${expectedWarnings} warnings (77 tags * 25 iterations), got ${duplicateWarningsCaught.length}`,
  )
  process.exit(1)
}

// 8. Verify registry stability and prototype invariance post-stress
console.log('[Phase 6] Verifying registry constructor stability post-stress...')
for (const tag of expectedTags) {
  const currentCtor = customElements.get(tag)
  const initialCtor = initialCtors.get(tag)
  if (currentCtor !== initialCtor) {
    console.error(
      `FAIL: Constructor reference for <${tag}> changed after stress barrage!`,
    )
    process.exit(1)
  }

  // Verify instantiation still works
  const el = document.createElement(tag)
  if (el.constructor !== initialCtor) {
    console.error(
      `FAIL: Instantiated <${tag}> has altered constructor post-stress!`,
    )
    process.exit(1)
  }
}
console.log(
  '✓ All 77 custom element constructor references remained completely stable.',
)

// 9. Verify reactive controllers, singletons, pagination, log utilities
console.log('[Phase 7] Verifying non-element public exports...')
const requiredControllers = [
  'PressController',
  'LayoutIndicatorController',
  'OverlayPresenceController',
  'NumberSpringController',
  'FormInternalsController',
]
for (const ctrl of requiredControllers) {
  if (typeof firstImport[ctrl] !== 'function') {
    console.error(
      `FAIL: Controller ${ctrl} is not exported as a constructor/class!`,
    )
    process.exit(1)
  }
}
console.log('✓ All 5 reactive controllers verified.')

if (
  !firstImport.toastQueue ||
  typeof firstImport.toastQueue.add !== 'function'
) {
  console.error('FAIL: toastQueue singleton or its add method is missing!')
  process.exit(1)
}
console.log('✓ toastQueue singleton verified.')

if (typeof firstImport.generatePagination !== 'function') {
  console.error('FAIL: generatePagination helper is missing!')
  process.exit(1)
}
const pages = firstImport.generatePagination(5, 10, 1)
if (!Array.isArray(pages) || !pages.includes(5)) {
  console.error('FAIL: generatePagination produced unexpected result:', pages)
  process.exit(1)
}
console.log('✓ generatePagination verified:', pages)

const requiredLogParsers = [
  'parseLogs',
  'parseLogLine',
  'parseAttributes',
  'stripAttributes',
  'normalizeLogLevel',
  'SERVER_LOG_RAW',
  'SERVER_LOGS',
]
for (const parser of requiredLogParsers) {
  if (!firstImport[parser]) {
    console.error(`FAIL: Log parser/constant ${parser} is missing!`)
    process.exit(1)
  }
}
const parsedLogs = firstImport.parseLogs(
  '[2026-10-17 12:00:00] [INFO] system ready',
)
if (
  !Array.isArray(parsedLogs) ||
  parsedLogs.length !== 1 ||
  parsedLogs[0].level !== 'info'
) {
  console.error('FAIL: parseLogs produced unexpected result:', parsedLogs)
  process.exit(1)
}
console.log('✓ Log parsers verified cleanly.')

// 10. Verify zero React symbols
console.log('[Phase 8] Verifying absence of React symbols in exports...')
const reactSymbols = Object.keys(firstImport).filter(
  (k) =>
    k.toLowerCase().includes('react') ||
    k === 'useState' ||
    k === 'useEffect' ||
    k === 'useContext' ||
    k === 'useCallback' ||
    k === 'useMemo' ||
    k === 'useRef',
)
if (reactSymbols.length > 0) {
  console.error(
    `FAIL: React symbols detected in public exports: ${reactSymbols.join(', ')}`,
  )
  process.exit(1)
}
console.log('✓ Zero React symbols in public exports.')

console.log(
  '\n======================================================================',
)
console.log(
  'ALL RUNTIME IMPORT & IDEMPOTENCY CHALLENGES PASSED EMPIRICALLY (100%)',
)
console.log(
  '======================================================================',
)
