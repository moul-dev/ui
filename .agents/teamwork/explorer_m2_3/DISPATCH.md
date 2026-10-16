## 2026-10-16T03:50:45Z
Scope: Milestone 2 Task 2.3 & 2.4 - Core Utilities & Verification Tests
Formulate a concrete, complete implementation strategy and code plan for:
1. `ui/src/utils/define-element.ts`:
   - Idempotent `defineElement(tagName: string, ctor: CustomElementConstructor): void`
   - Checks `customElements.get(tagName)` and emits `console.warn` without throwing or overriding.
2. `ui/src/utils/warn-missing-label.ts`:
   - Dev-only `warnMissingLabel(host: HTMLElement, description: string, hasVisibleLabel?: boolean): void`
   - Warns if `aria-label` and `aria-labelledby` are absent (no-op in production `process.env.NODE_ENV === 'production'`).
3. `ui/src/utils/focus-trap.ts`:
   - `safeShowModal(dialog: HTMLDialogElement | null, focusRoot?: HTMLElement): boolean` (catching disconnected DOMException with `console.warn`)
   - `focusFirstElement(root: HTMLElement): HTMLElement | null` (<100ms focus)
   - `trapFocus(container: HTMLElement, event: KeyboardEvent): void`
   - `supportsNativePopoverAndAnchor(): boolean`
4. `ui/src/utils/motion.ts`:
   - Vanilla `motion` DOM imports (`animate`, `stagger`)
   - Presets: `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`
   - `prefersReducedMotion(): boolean`
   - `subtleAnimate(target, keyframes, options)`
   - `animateActiveIndicator(indicator, previousRect, nextRect)`
   - `export { stagger }`
5. `ui/src/utils/icons.ts`:
   - Zero-dependency Lit `svg` templates: `close`, `chevronDown`, `search`, `clear`, `alertInfo`, `alertSuccess`, `alertWarning`, `alertError`, `spinnerRing`, `calendarNavPrev`, `calendarNavNext` with `aria-hidden="true"` and `focusable="false"`.
6. `ui/src/tokens/Tokens.test.ts`:
   - Fast-check property-based tests using `fast-check` (`fc`) and Vitest with `happy-dom`:
     - Verifying all `:root` CSS custom properties in `ui/src/styles/style.css`
     - Verifying all 25 tone × variant combinations in `semanticToneStyles`
     - Verifying resilience to invalid string inputs (`normalizeTone`, `normalizeVariant`)
     - Verifying utility functions (`defineElement`, `warnMissingLabel`, `safeShowModal`, `supportsNativePopoverAndAnchor`, `motion` reduced-motion collapse).

Do NOT modify files outside your working directory. Write your report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_3/handoff.md`.
When done, send a message back to the orchestrator (conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2).
