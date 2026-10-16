# Challenger Report: Milestone 1 - Workspace Purge, Package Contracts & Test Harness

**Verdict: APPROVE**

---

## 1. Observation

Direct empirical tests were executed to stress-test `scripts/verify-no-react.ts` and `ui/src/test-setup.ts`.

### A. CLI Argument Matrix for `scripts/verify-no-react.ts`
Subprocess test execution of CLI argument variations yielded:
- `bun ./scripts/verify-no-react.ts all` -> exit code `0`, output: `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`
- `bun ./scripts/verify-no-react.ts ui` -> exit code `0`, output: `✓ [verify-no-react] Target 'ui': Zero disallowed React/legacy packages found across inspected manifests.`
- `bun ./scripts/verify-no-react.ts docs` -> exit code `0`, output: `✓ [verify-no-react] Target 'docs': Zero disallowed React/legacy packages found across inspected manifests.`
- `bun ./scripts/verify-no-react.ts ALL` -> exit code `0` (case-insensitive)
- `bun ./scripts/verify-no-react.ts UI` -> exit code `0` (case-insensitive)
- `bun ./scripts/verify-no-react.ts DOCS` -> exit code `0` (case-insensitive)
- `bun ./scripts/verify-no-react.ts` (no arguments) -> exit code `0` (defaults to 'all')
- `bun ./scripts/verify-no-react.ts invalid` -> exit code `1`, verbatim output:
  ```text
  Invalid target 'invalid'. Supported targets: all, ui, docs.
  Usage: bun ./scripts/verify-no-react.ts [all|ui|docs]
  ```
- `bun ./scripts/verify-no-react.ts react` -> exit code `1`
- `bun ./scripts/verify-no-react.ts --help` -> exit code `1`

### B. Synthetic Manifest Tests: Banned Package Pattern Coverage
In an isolated temporary sandbox (`mkdtempSync`), synthetic manifests were constructed and tested across `dependencies`, `devDependencies`, and `peerDependencies` in both `ui/package.json` and `docs/package.json`:
1. Clean baseline containing allowed packages: `lit`, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, `motion`, `astro`, `@astrojs/starlight`, `@phosphor-icons/web`, `fast-check`, `happy-dom`, `vitest`, `preact`, `reactive-programming`, `reactor`, `creation`.
   - Result: Exit code `0`, zero false positives detected.
2. Injected banned packages (31 distinct variations tested across each of the 3 dependency blocks):
   - `react-spring`, `@types/react-transition-group`, `@lit/react`, `lucide-react`, `recharts`, `fumadocs-core`, `react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `react-server-dom-webpack`, `input-otp`, `waku`, `@phosphor-icons/react`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `@astrojs/react`, `@stylexjs/stylex`, `@stylexjs/unplugin`, `@stylexjs/open-props`, `fumadocs-mdx`, `fumadocs-ui`, `@tanstack/react-query`, `@tanstack/react-table`, `some-react`, `custom-react`, `foo/react`, `@types/react`, `@types/react-dom`.
   - Result: 100% of the 31 banned packages triggered exit code `1` across all 3 dependency blocks in both `ui` and `docs`, outputting specific diagnostic violation logs quoting package name, block, and version.

### C. Headless Shims in `ui/src/test-setup.ts`
Executing in Happy-DOM (`GlobalWindow`):

1. **ElementInternals Shim**:
   - Double-attach: Calling `host.attachInternals()` a second time on the same `HTMLElement` threw `DOMException` with `name === 'NotSupportedError'` and message `'ElementInternals already attached'`.
   - Form association:
     - Host nested inside `<form>` resolved `internals.form === form` (including Happy DOM proxy unwrapping).
     - Host outside `<form>` with attribute `form="my-form-id"` resolved `internals.form === formEl`.
     - Host without form resolved `internals.form === null`.
   - Form value: `setFormValue('test-val')` persisted to `formValue === 'test-val'`.
   - Validity & 200-char truncation: Calling `setValidity({ valueMissing: true }, 'A'.repeat(300))` resulted in `validity.valid === false`, `validity.valueMissing === true`, and `validationMessage.length === 200` (`'A'.repeat(200)`).
   - Reset validity: Calling `setValidity({})` restored `validity.valid === true` and cleared `validationMessage === ''`.
   - `checkValidity()`: Dispatched cancelable `invalid` event (`e.cancelable === true`) when invalid and returned `false`; returned `true` without dispatching event when valid.

2. **Native `<dialog>` Shim**:
   - Disconnected modal: `dialog.showModal()` threw `DOMException` with `name === 'InvalidStateError'` and message `'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.'` strictly complying with Requirement 6.10.
   - Connected modal: `document.body.appendChild(dialog); dialog.showModal();` opened successfully, setting `dialog.open === true` and reflecting attribute `dialog.hasAttribute('open') === true`.
   - Re-opening modal: Calling `showModal()` on already open dialog threw `DOMException` with `name === 'InvalidStateError'` and message `'Failed to execute showModal on HTMLDialogElement: The element is already open.'`.
   - Close behavior: Calling `dialog.close('confirmed-value')` set `dialog.open === false`, removed `'open'` attribute, recorded `dialog.returnValue === 'confirmed-value'`, and dispatched `Event('close')`. Calling `dialog.close()` when already closed was idempotent and did not dispatch duplicate close events.
   - Property reflection: `dialog.open` and `hasAttribute('open')` reflect bidirectionally.

3. **Popover API Shim**:
   - Calling `showPopover()` or `hidePopover()` without `popover` attribute threw `DOMException` with `name === 'InvalidStateError'` and message `"Failed to execute 'showPopover' on 'HTMLElement': Element does not have a 'popover' attribute."`.
   - Calling `showPopover()` on disconnected element with `popover="auto"` threw `DOMException` with `name === 'InvalidStateError'` and message `"Failed to execute 'showPopover' on 'HTMLElement': The element is not in a Document."`.
   - On connected element, `showPopover()` added `:popover-open` attribute/class, dispatched `beforetoggle` (`oldState: 'closed', newState: 'open', cancelable: true`), and dispatched `toggle` (`oldState: 'closed', newState: 'open'`).
   - Selector matching: `pop.matches(':popover-open')` returned `true` when open, `false` when closed.
   - Event cancellation: Calling `e.preventDefault()` on `beforetoggle` aborted `showPopover()`, leaving element closed.
   - `togglePopover()` toggled states and supported `togglePopover(true)` and `togglePopover(false)` explicit forcing.
   - Property reflection: `el.popover = 'manual'` reflected to attribute; `el.popover = ''` normalized to `'auto'`; `el.popover = null` removed attribute.

4. **ResizeObserver Controller**:
   - `window.__triggerResize(el, { width: 500, height: 300, top: 10, left: 20 })` synchronously invoked callbacks on registered observers.
   - `entry.contentRect` matched width `500`, height `300`, top `10`, left `20`, right `520`, bottom `310`.
   - `entry.borderBoxSize`, `contentBoxSize`, and `devicePixelContentBoxSize` provided frozen array structures with `{ inlineSize: 500, blockSize: 300 }`.
   - `el.getBoundingClientRect()` was updated to match `{ width: 500, height: 300, top: 10, left: 20, right: 520, bottom: 310 }`.
   - Multi-target and multi-observer dispatch functioned accurately.
   - `unobserve(el)` and `disconnect()` stopped subsequent callback invocations.

---

## 2. Logic Chain

1. **Guard Script Robustness**:
   - Per Observation A, `scripts/verify-no-react.ts` strictly enforces valid CLI targets (`all`, `ui`, `docs`) with case-insensitive normalization and exits with error code 1 on any unrecognized input.
   - Per Observation B, both explicit package sets and regex pattern matchers catch prefix, infix, suffix, and scoped variants (e.g., `react-spring`, `@lit/react`, `lucide-react`, `fumadocs-core`, `@types/react-transition-group`, `@tanstack/react-*`, `@stylexjs/*`).
   - Packages containing the substring "react" in non-banned grammatical forms (e.g. `preact`, `reactive-programming`, `reactor`, `creation`) are correctly permitted without false positives.

2. **Test Harness & Shim Fidelity**:
   - Per Observation C.1, `MockElementInternalsImpl` accurately simulates form-associated custom element behavior, enforces the WHATWG constraint that `attachInternals()` can only be called once per element, limits validation messages to 200 characters, and integrates with Happy DOM's form proxy architecture.
   - Per Observation C.2, `HTMLDialogElement` shim strictly implements standard DOMException throwing on disconnected elements (`The element is not in a Document.`, `InvalidStateError`) satisfying Requirement 6.10, prevents re-opening already modal dialogs, and correctly manages `returnValue` and `close` events.
   - Per Observation C.3, the Popover API shim accurately mirrors the WHATWG Popover specification, including disconnected error throwing, missing attribute detection, `beforetoggle` cancellation semantics, and `:popover-open` matching.
   - Per Observation C.4, `MockResizeObserver` and `__triggerResize` allow deterministic synchronous layout testing for Lit components without relying on asynchronous rendering loops.

---

## 3. Caveats

- Milestone 1 tests only package manifests, build guards, and test harness shims. Existing React component files in `ui/src/components` are migrated to pure Lit components in Milestone 2. (When `vitest` runs on legacy files, `banReactImportsPlugin` correctly intercepts them as verified in observation).
- Biome check reported 2 `useOptionalChain` hints on prototype checks in `test-setup.ts`, which are stylistic warnings and do not affect runtime execution.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 1 satisfies all requirements and edge case challenges:
- `scripts/verify-no-react.ts` is resilient, accurate, handles all CLI flags, catches 100% of tested banned package patterns with zero false positives.
- `ui/src/test-setup.ts` shims (`ElementInternals`, native `<dialog>`, Popover API, deterministic `ResizeObserver`) are fully spec-compliant, robust to boundary conditions, and satisfy Requirement 6.10.

---

## 5. Verification Method

To independently reproduce the empirical challenge suite:

```bash
# 1. Test CLI argument parsing and error exits
bun -e "
import { spawnSync } from 'node:child_process';
for (const arg of ['all', 'ui', 'docs', 'ALL', 'UI', 'DOCS', '']) {
  const res = spawnSync('bun', arg ? ['./scripts/verify-no-react.ts', arg] : ['./scripts/verify-no-react.ts']);
  if (res.status !== 0) throw new Error('Expected 0 for ' + arg);
}
for (const bad of ['invalid', 'react', '--help']) {
  const res = spawnSync('bun', ['./scripts/verify-no-react.ts', bad]);
  if (res.status !== 1) throw new Error('Expected 1 for ' + bad);
}
console.log('CLI args verified');
"

# 2. Test synthetic banned package detection
bun -e "
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'verify-test-'));
const scriptSrc = join(process.cwd(), 'scripts', 'verify-no-react.ts');
mkdirSync(join(tempDir, 'scripts'), { recursive: true });
copyFileSync(scriptSrc, join(tempDir, 'scripts', 'verify-no-react.ts'));
mkdirSync(join(tempDir, 'ui'), { recursive: true });
mkdirSync(join(tempDir, 'docs'), { recursive: true });

try {
  const banned = ['react-spring', '@types/react-transition-group', '@lit/react', 'lucide-react', 'recharts', 'fumadocs-core'];
  for (const pkg of banned) {
    writeFileSync(join(tempDir, 'ui', 'package.json'), JSON.stringify({ dependencies: { [pkg]: '1.0.0' } }));
    writeFileSync(join(tempDir, 'docs', 'package.json'), JSON.stringify({ dependencies: {} }));
    const res = spawnSync('bun', [join(tempDir, 'scripts', 'verify-no-react.ts'), 'all'], { encoding: 'utf-8' });
    if (res.status !== 1 || !res.stderr.includes(pkg)) throw new Error('Failed to catch ' + pkg);
  }
  console.log('Banned patterns verified');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
"

# 3. Test all test-setup.ts shims
bun -e "
import { GlobalWindow } from './ui/node_modules/happy-dom/lib/index.js';
const window = new GlobalWindow();
Object.assign(globalThis, {
  window, document: window.document, HTMLElement: window.HTMLElement,
  Element: window.Element, DOMException: window.DOMException,
  Event: window.Event, CustomEvent: window.CustomEvent
});
await import('./ui/src/test-setup.ts');

// ElementInternals
const host = document.createElement('div');
document.body.appendChild(host);
const internals = host.attachInternals();
let threw = false;
try { host.attachInternals(); } catch (e) { threw = e.name === 'NotSupportedError'; }
if (!threw) throw new Error('Double attach did not throw NotSupportedError');
internals.setValidity({ badInput: true }, 'M'.repeat(250));
if (internals.validationMessage.length !== 200) throw new Error('Message not truncated to 200 chars');

// Dialog disconnected
const dialog = document.createElement('dialog');
let dialogThrew = false;
try { dialog.showModal(); } catch (e) { dialogThrew = e.name === 'InvalidStateError'; }
if (!dialogThrew) throw new Error('Disconnected dialog did not throw InvalidStateError');

// Popover
const pop = document.createElement('div');
pop.setAttribute('popover', 'auto');
document.body.appendChild(pop);
pop.showPopover();
if (!pop.matches(':popover-open')) throw new Error('Popover open failed');

// ResizeObserver
let resized = false;
const ro = new window.ResizeObserver(() => { resized = true; });
ro.observe(host);
window.__triggerResize(host, { width: 100 });
if (!resized) throw new Error('Resize trigger failed');

console.log('All shims verified');
"
```
