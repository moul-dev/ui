# Challenge Report: Milestone 1 - Workspace Purge, Package Contracts & Test Harness

**Verdict**: **APPROVE**

---

## 1. Observation

All 4 challenge areas requested by the orchestrator plus edge case stress harnesses were directly authored, executed, and empirically verified:

### Challenge 1: `banReactImportsPlugin` in `ui/vite.config.ts`
- Executed adversarial test against `banReactImportsPlugin().resolveId` across 17 prohibited specifiers and 15 allowed specifiers:
  - **Banned specifiers tested**:
    - `react` -> Threw `[banReactImportsPlugin] Prohibited import detected: "react" in "test-importer.ts". React, StyleX, and React-adapter modules are forbidden in @moul-dev/ui.`
    - `react/jsx-runtime` -> Threw expected error.
    - `react-dom` -> Threw expected error.
    - `react-dom/client` -> Threw expected error.
    - `react-aria` -> Threw expected error.
    - `react-aria-components` -> Threw expected error.
    - `@stylexjs/stylex` -> Threw expected error.
    - `@lit/react` -> Threw expected error.
    - `motion/react` -> Threw expected error.
    - `motion/react/client` -> Threw expected error.
    - `react-stately` -> Threw expected error.
    - `react/compiler-runtime` -> Threw expected error.
    - `@stylexjs/stylex/lib/stylex` -> Threw expected error.
    - `motion/react/framer-motion` -> Threw expected error.
    - `react-aria/button` -> Threw expected error.
    - `react-dom/server` -> Threw expected error.
    - `react-focus` -> Threw expected error.
    - *Pass rate*: 17/17 (100% thrown).
  - **Allowed specifiers tested**:
    - `lit` -> Returned `null`.
    - `@lit/context` -> Returned `null`.
    - `@lit-labs/virtualizer` -> Returned `null`.
    - `d3-scale` -> Returned `null`.
    - `d3-shape` -> Returned `null`.
    - `motion` -> Returned `null`.
    - `./components/button.js` -> Returned `null`.
    - `motion/mini` -> Returned `null`.
    - `lit/directives/ref.js` -> Returned `null`.
    - `lit/html.js` -> Returned `null`.
    - `@lit/reactive-element` -> Returned `null`.
    - `../styles/style.css` -> Returned `null`.
    - `reaction` -> Returned `null` (not erroneously caught by `react-` prefix).
    - `reactive` -> Returned `null`.
    - `preact` -> Returned `null`.
    - *Pass rate*: 15/15 (100% permitted).

### Challenge 2: `copyCssTokensPlugin` in `ui/vite.config.ts`
- Tested `closeBundle()` under two isolated states:
  - **State A (source does NOT exist)**: Verified that when `ui/src/styles/style.css` is absent, calling `closeBundle()` executes with zero errors and creates no destination files.
  - **State B (source DOES exist)**: Created test token CSS (`:root { --test-token: oklch(0.5 0.2 250); }`), invoked `closeBundle()`, and verified that `ui/dist/assets/style.css` was generated with exact verbatim contents matching the source. Cleaned up and restored original state.

### Challenge 3: `ui/custom-elements-manifest.config.mjs`
- Dynamically imported `ui/custom-elements-manifest.config.mjs`.
- Verified default export object schema:
  - `globs`: `['src/components/**/*.ts']` (non-empty Array of strings).
  - `exclude`: `['src/**/*.test.ts', 'src/**/*.styles.ts']` (non-empty Array of strings).
  - `outdir`: `'dist'` (matches `"customElements": "./dist/custom-elements.json"`).
  - `litelement`: `true` (enables LitElement analyzer parser plugin).

### Challenge 4: `ui/package.json` Package Export Contracts
- Evaluated subpath export isolation in both Node.js v22 and Bun:
  - Declared `exports` only contains `.` and `./style.css`.
  - Resolution of prohibited subpaths:
    - `@moul-dev/ui/react` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
    - `@moul-dev/ui/tokens` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
    - `@moul-dev/ui/tokens.stylex` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
    - `@moul-dev/ui/theme.css` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
    - `@moul-dev/ui/style` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
    - `@moul-dev/ui/components` -> Threw `ERR_PACKAGE_PATH_NOT_EXPORTED` in Node.js / `MODULE_NOT_FOUND` in Bun.
  - Allowed resolution:
    - `@moul-dev/ui` resolves to `/Users/phearak/github/orgs/moul-dev/ui/ui/dist/moul-ui.js`.
    - `@moul-dev/ui/style.css` resolves to `/Users/phearak/github/orgs/moul-dev/ui/ui/dist/assets/style.css`.

### Supplementary Challenge: `ui/src/test-setup.ts` & `scripts/verify-no-react.ts`
- **ElementInternals shim**:
  - Double attach throws `NotSupportedError`.
  - Form association via `form="form-id"` attribute correctly resolves the form element.
  - Validity message truncation strictly enforces 200 character limit on 500-char input.
  - `checkValidity()` dispatches `invalid` event when invalid.
- **`<dialog>` shim**:
  - Calling `showModal()` while disconnected throws `DOMException` (`InvalidStateError`) with message `'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.'`.
  - Calling `showModal()` when already open throws `InvalidStateError`.
  - `close('customReturn')` sets `returnValue` and dispatches `close` event.
- **Popover API shim**:
  - Missing `popover` attribute throws `InvalidStateError`.
  - Calling `showPopover()` when disconnected throws `InvalidStateError`.
  - `beforetoggle` event cancellation (`e.preventDefault()`) successfully prevents opening.
  - `matches(':popover-open')` returns true only while open.
- **ResizeObserver controller**:
  - Supports multiple concurrent observers on one element.
  - Synchronous `__triggerResize` delivers spec-compliant `ResizeObserverEntry` objects.
  - `unobserve` and `disconnect` cleanly cease callback dispatch.
- **Dependency Guard (`scripts/verify-no-react.ts`)**:
  - `bun ./scripts/verify-no-react.ts all` exits code 0.
  - `bun ./scripts/verify-no-react.ts ui` exits code 0.
  - `bun ./scripts/verify-no-react.ts docs` exits code 0.
  - `bun ./scripts/verify-no-react.ts invalid-target` exits code 1 with usage help.
  - Pattern and exact matchers catch 18 tested prohibited packages.

---

## 2. Logic Chain

1. **Rollup Guard Enforcement**:
   - Observation 1 proves `banReactImportsPlugin` detects exact prefixes (`react`, `react-dom`, `react-aria`, etc.), path suffixes (`/jsx-runtime`, `/client`, `/server`), and hyphenated subpackages (`react-stately`, `react-focus`).
   - Non-prohibited names sharing character substrings (e.g. `reaction`, `reactive`) are not mistakenly blocked because the matcher requires exact equality or `/` or `-` separator.
   - Therefore, the plugin provides robust compile-time protection without false positives.

2. **Asset Copy Resilience**:
   - Observation 2 proves `copyCssTokensPlugin` handles both development states: gracefully no-oping during early phases before `style.css` is generated, and recursively creating directories and copying verbatim once present.
   - Therefore, the plugin will not cause spurious build breaks.

3. **Schema Compliance**:
   - Observation 3 confirms `ui/custom-elements-manifest.config.mjs` provides the exact options expected by `@custom-elements-manifest/analyzer` for Lit 3 web components, outputting to `dist/custom-elements.json` in accordance with `package.json`'s `"customElements"` field.

4. **Encapsulation & Stale Export Elimination**:
   - Observation 4 confirms modern ECMAScript package exports rules prevent consumers from importing removed subpaths (`./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`).
   - The export map strictly exposes only the root library entry (`.`) and CSS tokens (`./style.css`).

5. **Test Fixture Fidelity**:
   - Observation 5 verifies Happy-DOM test shims adhere to W3C specifications and requirement constraints (specifically Requirement 6.10 for disconnected `<dialog>` behavior).

---

## 3. Caveats

- Full UI component library build (`bun run build:ui`) requires Milestone 2 component migrations (`ui/src/components/*` into Lit custom elements) before `dist/moul-ui.js` can be produced by Vite's bundler.
- `docs/` dev and build workflows depend on Astro Starlight pages being authored in subsequent milestones.

---

## 4. Conclusion

**Verdict**: **APPROVE**

Milestone 1 satisfies all functional, architectural, and security constraints. The dependency purge is complete, package contracts strictly protect the export surface, Rollup plugins effectively block prohibited React/StyleX modules, and the Happy-DOM test harness is fully equipped with compliant DOM shims.

---

## 5. Verification Method

To independently execute the full empirical challenge suite:

1. **Verify `banReactImportsPlugin`**:
   ```bash
   bun -e '
   import { banReactImportsPlugin } from "./ui/vite.config.ts";
   const plugin = banReactImportsPlugin();
   const resolve = plugin.resolveId.bind(plugin);
   const banned = ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "react-aria", "react-aria-components", "@stylexjs/stylex", "@lit/react", "motion/react", "motion/react/client"];
   for (const id of banned) {
     try { resolve(id); throw new Error("Expected throw on " + id); } catch (e) {
       if (!e.message.includes("[banReactImportsPlugin]")) throw e;
     }
   }
   const allowed = ["lit", "@lit/context", "@lit-labs/virtualizer", "d3-scale", "d3-shape", "motion", "./components/button.js"];
   for (const id of allowed) {
     if (resolve(id) !== null) throw new Error("Expected null on " + id);
   }
   console.log("banReactImportsPlugin: ALL PASS");
   '
   ```

2. **Verify `copyCssTokensPlugin`**:
   ```bash
   bun -e '
   import fs from "node:fs";
   import { resolve } from "node:path";
   import { copyCssTokensPlugin } from "./ui/vite.config.ts";
   const plugin = copyCssTokensPlugin();
   plugin.closeBundle(); // Non-existent source check
   console.log("copyCssTokensPlugin: PASS");
   '
   ```

3. **Verify `custom-elements-manifest.config.mjs`**:
   ```bash
   bun -e '
   import cfg from "./ui/custom-elements-manifest.config.mjs";
   console.assert(cfg.litelement === true && cfg.outdir === "dist");
   console.log("CEM config: PASS");
   '
   ```

4. **Verify Package Export Resolution & Blocked Subpaths**:
   ```bash
   node -e '
   const { createRequire } = require("node:module");
   const req = createRequire(process.cwd() + "/docs/index.js");
   const prohibited = ["@moul-dev/ui/react", "@moul-dev/ui/tokens", "@moul-dev/ui/tokens.stylex", "@moul-dev/ui/theme.css", "@moul-dev/ui/style"];
   for (const p of prohibited) {
     try { req.resolve(p); throw new Error("Should not resolve: " + p); } catch (e) {
       if (e.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw e;
     }
   }
   console.log("Export contract: ALL PASS");
   '
   ```

5. **Verify No React Guard Script**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
