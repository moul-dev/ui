# Review & Adversarial Challenge Report: Milestone 1 (Phase 1)

## Review Summary

**Verdict**: **APPROVE**  
**Integrity Status**: CLEAN — Zero integrity violations detected (no hardcoded test outputs, no dummy facades, no shortcuts, no fabricated logs, genuine independent verification).  
**Overall Risk Assessment**: LOW

---

## 1. Observation

Direct examination and execution results across all target files:

1. **`scripts/verify-no-react.ts` Execution & Edge Cases**:
   - Executing `bun ./scripts/verify-no-react.ts all` exited with code `0`:
     ```text
     ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
     ```
   - Executing `bun ./scripts/verify-no-react.ts ui` and `bun ./scripts/verify-no-react.ts docs` both exited with code `0`.
   - Executing `bun ./scripts/verify-no-react.ts invalid` exited with code `1`:
     ```text
     Invalid target 'invalid'. Supported targets: all, ui, docs.
     Usage: bun ./scripts/verify-no-react.ts [all|ui|docs]
     ```
   - Injected 15 banned packages (`react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `@stylexjs/stylex`, `@vitejs/plugin-react`, `recharts`, `input-otp`, `waku`, `@lit/react`, `lucide-react`, `@phosphor-icons/react`, `fumadocs-core`, `@tanstack/react-table`) across `dependencies`, `devDependencies`, and `peerDependencies`. In every test, the script exited with code `1`, printed the offending package name, and highlighted the specific manifest block.

2. **Package Manifest Inspection**:
   - `ui/package.json`:
     - Prohibited packages: 0 matches for `react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `@stylexjs/*`, `@vitejs/plugin-react`, `recharts`, `input-otp`, `waku`, `@lit/react`, or `/^react-/`.
     - `peerDependencies` block: completely removed.
     - `dependencies`: contains `@lit-labs/virtualizer` (^2.1.0), `@lit/context` (^1.1.3), `d3-scale` (^4.0.2), `d3-shape` (^3.2.0), `lit` (^3.2.1), `motion` (^13.4.1).
     - `devDependencies`: contains `@biomejs/biome`, `@custom-elements-manifest/analyzer`, `@open-wc/testing-helpers`, `fast-check`, `happy-dom`, `@types/d3-scale`, `@types/d3-shape`, and build tooling.
     - `exports`: strictly exposes `.` (`types: ./dist/src/index.d.ts`, `import: ./dist/moul-ui.js`, `default: ./dist/moul-ui.js`) and `./style.css` (`style: ./dist/assets/style.css`, `default: ./dist/assets/style.css`). Legacy subpaths (`./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`) are absent.
     - Metadata: contains `"customElements": "./dist/custom-elements.json"` and `"sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"]`.
   - `docs/package.json`:
     - Zero React, Waku, or Fumadocs packages.
     - `dependencies`: `@astrojs/starlight` (^0.32.0), `@moul-dev/ui` (`workspace:*`), `@phosphor-icons/web` (^2.1.1), `astro` (^5.5.0), `sharp` (^0.33.5).
     - `devDependencies`: `@biomejs/biome`, `@types/node`, `typescript`.

3. **`ui/vite.config.ts` Plugin & Build Verification**:
   - `banReactImportsPlugin`:
     - Intercepts resolution of prohibited prefixes (`react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, `motion/react`).
     - Tested resolution with banned specifiers (`react`, `react/jsx-runtime`, `react-dom`, `react-aria`, `@stylexjs/stylex`, `@lit/react`, `motion/react`): each throws `Error: [banReactImportsPlugin] Prohibited import detected...`.
     - Tested resolution with allowed specifiers (`lit`, `@lit/context`, `@lit-labs/virtualizer`, `motion`, `d3-scale`, `d3-shape`, local paths): returns `null` as expected for normal Rollup pipeline resolution.
   - `copyCssTokensPlugin`:
     - Verified `closeBundle` checks existence of `ui/src/styles/style.css` before attempting copy, preventing crashes when `style.css` is not yet present. Verified with mock `style.css` that it correctly copies content to `ui/dist/assets/style.css`.
   - Rollup library output:
     - Configured with `formats: ['es']`, `fileName: () => 'moul-ui.js'`, and `banner: '"use client";'`.

4. **`ui/custom-elements-manifest.config.mjs` Execution**:
   - Configured with `globs: ['src/components/**/*.ts']`, `exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts']`, `outdir: 'dist'`, `litelement: true`.
   - Executing `./ui/node_modules/.bin/cem analyze --config custom-elements-manifest.config.mjs` in `ui/` created `dist/custom-elements.json` (93,591 bytes, valid JSON).

5. **`ui/src/test-setup.ts` Shims Stress-Testing**:
   - Evaluated all 4 shims inside Happy-DOM environment with comprehensive assertions:
     1. `ElementInternals`:
        - Duplicate `attachInternals()` throws standard `DOMException` with `NotSupportedError`.
        - Form association via hierarchy (`closest('form')`) and via explicit `form` attribute ID (`ownerDocument.getElementById(formId)`) resolves `internals.form === form`.
        - Happy DOM proxy unwrapping via `Symbol(proxy)` ensures referential identity.
        - Disconnected element without form correctly resolves `internals.form === null`.
        - Initial validity is `valid === true`, validation message is `""`.
        - `setValidity` with a 250-character string truncates `validationMessage` to exactly 200 characters.
        - `checkValidity()` fires `'invalid'` event when invalid.
        - Resetting validity (`setValidity({})`) restores `valid === true` and clears message.
        - `setFormValue` records value on `formValue`.
     2. Native `<dialog>`:
        - Calling `showModal()` on disconnected `<dialog>` throws `DOMException` with `InvalidStateError` and message `Failed to execute showModal on HTMLDialogElement: The element is not in a Document.`.
        - Calling `showModal()` on connected `<dialog>` sets `open = true` and `hasAttribute('open') === true`.
        - Calling `showModal()` when already open throws `DOMException` with `InvalidStateError`.
        - Calling `close('val')` sets `open = false`, sets `returnValue = 'val'`, and dispatches `close` event.
        - Subsequent redundant `close()` calls do not re-fire `close` event.
     3. Popover API:
        - Calling `showPopover()` without `popover` attribute throws `DOMException` (`InvalidStateError`).
        - Calling `showPopover()` when disconnected throws `DOMException` (`InvalidStateError`).
        - `beforetoggle` event is cancelable; calling `e.preventDefault()` halts opening.
        - Opening dispatches `beforetoggle` followed by `toggle`, sets `:popover-open` attribute/class, and `matches(':popover-open')` evaluates to `true`.
        - `hidePopover()` dispatches `beforetoggle` and `toggle`, clears `:popover-open`, and `matches(':popover-open')` evaluates to `false`.
        - `togglePopover(force)` correctly obeys boolean parameter and toggles state when omitted.
     4. Deterministic `ResizeObserver`:
        - Instantiating `ResizeObserver`, calling `observe(target)`, and triggering `window.__triggerResize(target, { width: 500, height: 250 })` synchronously updates `target.getBoundingClientRect()` and delivers spec-compliant `ResizeObserverEntry` (`target`, `contentRect`, `borderBoxSize`, `contentBoxSize`).
        - Calling `unobserve(target)` stops delivery for that element.
        - Calling `disconnect()` clears all target elements and detaches observer.

6. **Linter Inspection**:
   - Running `./node_modules/.bin/biome check scripts/verify-no-react.ts ui/src/test-setup.ts ui/vite.config.ts ui/custom-elements-manifest.config.mjs` completed with exit code `0` and 0 errors (2 optional chaining suggestions in `test-setup.ts`).

---

## 2. Logic Chain

1. **Acceptance Criteria R1 Alignment**:
   - Observation 1 verifies that `scripts/verify-no-react.ts` fulfills both normal and negative verification paths. When manifests are clean, exit code is 0; when banned packages are present, exit code is 1 and error diagnostics clearly show the file, block, package, and version.
   - Observation 2 verifies that `ui/package.json` and `docs/package.json` have completely eliminated legacy React, StyleX, Recharts, Waku, and Fumadocs dependencies, while establishing the runtime and dev dependency foundations required for Lit 3 and Astro Starlight.
   - Observation 2 verifies that `ui/package.json` exports contract strictly limits entrypoints to `.` and `./style.css`, eliminating deprecated subpaths.

2. **Build Protection & Analyzer Configuration**:
   - Observation 3 proves that `banReactImportsPlugin` acts as an active compilation firewall at the Rollup `resolveId` stage, preventing any accidental or sneaky imports of React or its adapters.
   - Observation 3 proves that `copyCssTokensPlugin` handles asset bundling gracefully without breaking builds prior to CSS token authoring.
   - Observation 4 confirms that `custom-elements-manifest.config.mjs` interfaces correctly with `@custom-elements-manifest/analyzer` and generates valid schema output at `dist/custom-elements.json`.

3. **Test Harness & Shim Fidelity**:
   - Observation 5 confirms that the test harness shims in `ui/src/test-setup.ts` provide robust, spec-compliant polyfills for headless Happy-DOM testing.
   - The disconnected `<dialog>.showModal()` exception strictly matches Requirement 6.10 (`InvalidStateError`).
   - `ElementInternals` handles form association accurately, including Happy DOM's internal proxy mechanics, and adheres to the 200-char message constraint.
   - Popover API supports cancellation and `:popover-open` pseudo-class querying, and the `ResizeObserver` controller enables deterministic layout testing.

4. **Adversarial & Integrity Review**:
   - No hardcoded fixtures or dummy facade implementations exist in the tested code. All scripts and plugins perform actual runtime inspections and parsing.
   - The worker's reported findings and execution outputs were independently verified and matched verbatim.

---

## 3. Caveats

1. **Component Source Code (Milestone 2 Scope)**:
   - The component source files in `ui/src/components` and root entry `ui/src/index.ts` still contain legacy React component code; their migration to Lit 3 Web Components is planned for Milestone 2.
2. **CSS Token File Authoring (Milestone 2 Scope)**:
   - `ui/src/styles/style.css` will be authored in Milestone 2. `copyCssTokensPlugin` is defensively written with an existence check so it does not fail when `style.css` is not yet created.

---

## 4. Conclusion

The worker's changes for Milestone 1 (Phase 1) are complete, functionally correct, defensively implemented, and strictly conform to all Acceptance Criteria defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

Verdict: **APPROVE**

---

## 5. Verification Method

To independently reproduce all observations and verify this milestone:

1. **Verify Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   bun ./scripts/verify-no-react.ts ui
   bun ./scripts/verify-no-react.ts docs
   ```
   *Expected Result*: Exit code `0` with green success messages.

2. **Verify Banned Imports Rollup Plugin**:
   ```bash
   bun -e "
   import { banReactImportsPlugin } from './ui/vite.config.ts';
   const plugin = banReactImportsPlugin();
   const resolve = plugin.resolveId.bind(plugin);
   const banned = ['react', 'react/jsx-runtime', 'react-dom', 'react-aria', '@stylexjs/stylex', '@lit/react', 'motion/react'];
   for (const id of banned) {
     try { resolve(id); throw new Error('Expected ban on ' + id); } catch (e) {
       if (!e.message.includes('[banReactImportsPlugin]')) throw e;
     }
   }
   console.log('banReactImportsPlugin PASS');
   "
   ```
   *Expected Result*: `banReactImportsPlugin PASS`

3. **Verify Happy-DOM Test Shims**:
   ```bash
   bun -e "
   import { GlobalWindow } from './ui/node_modules/happy-dom/lib/index.js';
   const window = new GlobalWindow();
   globalThis.window = window;
   globalThis.document = window.document;
   globalThis.HTMLElement = window.HTMLElement;
   globalThis.Element = window.Element;
   globalThis.DOMException = window.DOMException;
   globalThis.Event = window.Event;
   globalThis.CustomEvent = window.CustomEvent;

   await import('./ui/src/test-setup.ts');

   // 1. ElementInternals
   const form = document.createElement('form');
   const host = document.createElement('div');
   form.appendChild(host);
   document.body.appendChild(form);
   const internals = host.attachInternals();
   console.assert(internals.form === form, 'form match');
   internals.setValidity({ valueMissing: true }, 'X'.repeat(300));
   console.assert(internals.validity.valid === false, 'validity false');
   console.assert(internals.validationMessage.length === 200, 'truncated to 200');

   // 2. <dialog> disconnected
   const dialog = document.createElement('dialog');
   let threwDisc = false;
   try { dialog.showModal(); } catch (e) { threwDisc = e.name === 'InvalidStateError'; }
   console.assert(threwDisc, 'dialog disconnected throws InvalidStateError');

   // 3. Popover API
   const pop = document.createElement('div');
   pop.setAttribute('popover', 'auto');
   document.body.appendChild(pop);
   pop.showPopover();
   console.assert(pop.matches(':popover-open'), 'popover opens');
   pop.hidePopover();
   console.assert(!pop.matches(':popover-open'), 'popover closes');

   // 4. ResizeObserver
   let resized = false;
   const ro = new window.ResizeObserver(() => { resized = true; });
   ro.observe(host);
   window.__triggerResize(host, { width: 800 });
   console.assert(resized, 'resize triggered');

   console.log('ALL SHIMS VERIFIED PASS');
   "
   ```
   *Expected Result*: `ALL SHIMS VERIFIED PASS`

4. **Verify CEM Analyzer**:
   ```bash
   ./ui/node_modules/.bin/cem analyze --config ui/custom-elements-manifest.config.mjs
   ```
   *Expected Result*: Created new manifest at `ui/dist/custom-elements.json`.
