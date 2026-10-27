# Adversarial Challenge Handoff Report: Milestone 2 Core Utilities

## Verdict: APPROVE

The Milestone 2 core utilities (`ui/src/utils/define-element.ts`, `ui/src/utils/warn-missing-label.ts`, `ui/src/utils/focus-trap.ts`, `ui/src/utils/motion.ts`, and `ui/src/utils/icons.ts`) have been empirically stress-tested and challenged across 36 adversarial test scenarios in `ui/src/utils/utils-challenge.test.ts`. All 36 challenge tests pass with 100% success rate, alongside 35 existing unit and property tests in `ui/src/tokens/tokens.test.ts` (total 71 tests passed).

---

## 1. Observation

1. **`ui/src/utils/define-element.ts`**:
   - Tested registering an element first time: `customElements.get(tag)` accurately stores the constructor; zero warnings or errors.
   - Tested duplicate registration with a different constructor: `defineElement(tag, DuplicateElem)` emits `console.warn` matching `[@moul-dev/ui] Custom element "..." is already registered. Skipping duplicate registration.`.
   - Verified that the original constructor is strictly preserved and duplicate registration does not throw or crash.
   - Tested in SSR context where `window.customElements` is undefined: cleanly exits without throwing.

2. **`ui/src/utils/warn-missing-label.ts`**:
   - Tested with `aria-label`: zero warnings.
   - Tested with `aria-labelledby`: zero warnings.
   - Tested with whitespace-only `aria-label` (`"   \t  \n "`): emits warning `<button> is missing an accessible label (...)`.
   - Tested with whitespace-only `aria-labelledby` (`"   "`): emits warning `<button> is missing an accessible label (...)`.
   - Tested with both missing: emits warning.
   - Tested with `hasVisibleLabel = true`: zero warnings.
   - Tested with `process.env.NODE_ENV === 'production'`: completely silent no-op (zero DOM attribute inspection or warning).
   - Tested with `process` undefined (browser context without Node global): executes without `ReferenceError`.
   - Tested with missing host `tagName`: gracefully defaults to `<element>`.

3. **`ui/src/utils/focus-trap.ts`**:
   - Tested `safeShowModal` on disconnected `<dialog>`: catches `DOMException` ('InvalidStateError'), logs warning with `console.warn`, returns `false`, and does NOT attempt to focus child elements.
   - Tested `safeShowModal` on connected `<dialog>`: opens dialog (`dialog.open === true`), focuses first interactive element, and returns `true`.
   - Tested `safeShowModal` on already open `<dialog>`: does not re-invoke `dialog.showModal()`, safely focuses first interactive element, and returns `true`.
   - Tested `safeShowModal(null)`: returns `false` without throwing.
   - Tested `supportsNativePopoverAndAnchor`: returns `true` only when `popover` exists in `HTMLElement.prototype` and `CSS.supports('anchor-name', '--moul-anchor')` returns `true`; returns `false` otherwise.
   - Tested `getFocusableElements`: strictly queries interactive elements and filters out `disabled`, `[hidden]`, `[aria-hidden="true"]`, `display: none`, `visibility: hidden`, and `[tabindex="-1"]`.
   - Tested `trapFocus`:
     - Forward `Tab` when focused on the last element wraps to the first element and calls `event.preventDefault()`.
     - Backward `Shift+Tab` when focused on the first element wraps to the last element and calls `event.preventDefault()`.
     - `Tab` and `Shift+Tab` when focus is outside the container restores focus to container boundaries and calls `event.preventDefault()`.
     - Non-Tab events (Enter, Escape, etc.) are ignored and not prevented.
     - Containers with 0 focusables call `event.preventDefault()` to prevent tab escape.
     - Containers with exactly 1 focusable element maintain focus trapped on that element.
   - Tested `restoreFocus`: returns focus to previous active element, safely handling null or elements that throw on focus.

4. **`ui/src/utils/motion.ts`**:
   - Presets verified: `SPRING_SNAPPY` (500/35/0.8), `SPRING_GENTLE` (320/28/1), `IOS_SHEET_CURVE` ([0.32, 0.72, 0, 1]), `CHART_EASE` ([0.22, 1, 0.36, 1]).
   - `prefersReducedMotion`: correctly queries `window.matchMedia('(prefers-reduced-motion: reduce)')` and handles SSR / undefined `matchMedia` by returning `false`.
   - `subtleAnimate`: collapses duration to `0` when `prefersReducedMotion` is active (`{ duration: 0 }`); uses provided options when inactive.
   - `animateActiveIndicator`:
     - Accurately computes FLIP deltas: `dx = prev.left - next.left`, `dy = prev.top - next.top`, `scaleX = prev.width / Math.max(next.width, 1)`, `scaleY = prev.height / Math.max(next.height, 1)`.
     - Returns `null` when `previousRect === null` or when `prefersReducedMotion()` is active.
     - Guards against zero-width and zero-height elements via `Math.max(nextRect.width, 1)`, avoiding division by zero / `Infinity`.

5. **`ui/src/utils/icons.ts`**:
   - Exactly 11 icons exported: `close`, `chevronDown`, `search`, `clear`, `alertInfo`, `alertSuccess`, `alertWarning`, `alertError`, `spinnerRing`, `calendarNavPrev`, `calendarNavNext`.
   - Rendered each icon into actual DOM nodes via Lit `render()`:
     - Confirmed each renders a valid `<svg>` element.
     - Confirmed `aria-hidden="true"` and `focusable="false"`.
     - Confirmed `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`.
     - Confirmed each contains valid geometric SVG child elements (`path`, `circle`, `line`).
     - Confirmed custom classes and default empty classes are rendered cleanly.

---

## 2. Logic Chain

1. **Idempotence & Safety under Microfrontend / HMR Reloads**:
   - `customElements.define` throws `NotSupportedError` if a tag is registered twice. `defineElement` guards by inspecting `customElements.get(tagName)` before definition, which turns a fatal crash into an informative `console.warn` while preserving the existing custom element constructor intact.

2. **Zero Runtime Overhead in Production**:
   - `warnMissingLabel` gates all DOM reads behind `process.env.NODE_ENV !== 'production'`. In production builds, the function exits immediately, ensuring zero attribute parsing overhead for end-user bundles.

3. **Defensive Modal Invocation**:
   - Invoking native `showModal()` on disconnected DOM elements is an invalid state in the WHATWG HTML standard and throws `DOMException`. Wrapping this in `safeShowModal` prevents uncaught exceptions, warns developer logs, returns `false`, and aborts focus manipulation that would otherwise fail.

4. **Robust Motion Accessibility**:
   - `subtleAnimate` and `animateActiveIndicator` integrate directly with `prefers-reduced-motion: reduce`. Collapsing animation duration to 0 and returning `null` on FLIP indicators honors user accessibility preferences deterministically without throwing or requiring application-level boilerplate.

---

## 3. Caveats

1. **Legacy React Test Files**:
   - Running full Vitest without path filtering (`vitest run --root ui`) runs legacy component tests in `src/components/**/*.test.tsx`, which are intentionally blocked by `banReactImportsPlugin` as designed in Phase 1 until those components are migrated to Web Components in subsequent phases.
2. **Deterministic Focus Trap Dependency**:
   - `trapFocus` relies on standard keyboard events with `event.key === 'Tab'`. Custom synthetic events without `key: 'Tab'` will bypass the trap by design.

---

## 4. Conclusion

**Verdict: APPROVE**

All 5 core utility modules in `ui/src/utils/` fulfill all functional and non-functional requirements specified in `rdt/requirements.md` and `rdt/design.md`. The implementation is robust against adversarial edge cases, SSR environments, disconnected DOM states, zero dimensions, and reduced motion settings.

---

## 5. Verification Method

To reproduce and verify the empirical challenge test suite:

1. **Run Vitest on Both Test Suites**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   *Expected Result*: `Test Files 2 passed (2)`, `Tests 71 passed (71)`, duration < 1s.

2. **Run Biome Lint Check**:
   ```bash
   ./node_modules/.bin/biome check ui/src/utils/utils-challenge.test.ts
   ```
   *Expected Result*: Exit code 0, `Checked 1 file in ...ms. No fixes applied.`

3. **Run TypeScript Check**:
   ```bash
   ./ui/node_modules/.bin/tsc --noEmit --project ui/tsconfig.json
   ```
   *Expected Result*: Exit code 0, 0 diagnostic errors.

4. **Run Disallowed Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected Result*: Exit code 0, 0 disallowed packages.
