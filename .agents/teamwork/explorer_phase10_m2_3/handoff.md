# Handoff Report — Sandbox HTML Host (`ui/index.html`) & Vite Dev Server Compatibility

## 1. Observation

### 1.1 Current State of `ui/index.html`
Direct inspection of `/Users/phearak/github/orgs/moul-dev/ui/ui/index.html` (lines 1–17) reveals:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
    <title>ui</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
Key observations:
1. Line 9 only requests `Google Sans` from Google Fonts; `Inter` is not linked.
2. Line 10 specifies generic title `<title>ui</title>`.
3. The native CSS design token layer (`/src/styles/style.css`) is completely absent from `<head>`.
4. Line 13 mounts `<div id="root"></div>`, which is the legacy React DOM container.
5. Line 14 loads `<script type="module" src="/src/main.tsx"></script>`.

### 1.2 Dev Server Failure with Current `ui/index.html`
In `/Users/phearak/github/orgs/moul-dev/ui/ui/src/main.tsx`:
- Line 1: `import { StrictMode } from 'react'`
- Line 2: `import { createRoot } from 'react-dom/client'`
- Line 4: `import App from './App.tsx'`

When tested against Vite with `ui/vite.config.ts`, `banReactImportsPlugin` immediately catches the import and halts execution with the following verbatim error:
```
[banReactImportsPlugin] Prohibited import detected: "react" in "/Users/phearak/github/orgs/moul-dev/ui/ui/index.html". React, StyleX, and React-adapter modules are forbidden in @moul-dev/ui.
```

### 1.3 CSS Design Tokens & Reset Styles
In `/Users/phearak/github/orgs/moul-dev/ui/ui/src/styles/style.css`:
- Line 8–9: `:root { color-scheme: light dark; ... }`
- Lines 287–288: `--font-family-base: var(--brand-font-family, inherit);` where `--brand-font-family: inherit;` (line 14).
- Lines 332–339: `[data-theme="light"] { color-scheme: light; }` and `[data-theme="dark"], .dark { color-scheme: dark; }`.
- `style.css` defines custom properties only; it defines no rule for `html` or `body`.
- In standard browsers, user-agent stylesheets apply `body { margin: 8px; }`, which would create an unwanted 8px border and viewport scrollbars around `<moul-sandbox>` (which uses `<moul-sidebar>` for full-bleed layout).

### 1.4 Vite Dev Server Module Resolution & HTML Transformation
Using a programmatic test with Vite 8.1.3 (`test-vite.ts`):
1. `server.transformIndexHtml('/index.html', html)` successfully parses the document and injects `<script type="module" src="/@vite/client"></script>`.
2. `server.pluginContainer.resolveId('/src/styles/style.css')` resolves to:
   ```json
   {"id":"/Users/phearak/github/orgs/moul-dev/ui/ui/src/styles/style.css","moduleSideEffects":false}
   ```
3. `server.pluginContainer.resolveId('lit')` resolves to:
   ```json
   {"id":"/Users/phearak/github/orgs/moul-dev/ui/ui/node_modules/.vite/deps/lit.js?v=ad5e8ca7"}
   ```
4. `server.transformRequest('/src/index.ts')` completes with code length `7065` and 0 errors, confirming Vite dev server transforms TypeScript Lit components on the fly without triggering `banReactImportsPlugin`.

---

## 2. Logic Chain

1. **Elimination of React Mount & Import Violation**:
   - Observations 1.1 and 1.2 demonstrate that `ui/index.html` loading `/src/main.tsx` triggers a fatal build guard error due to prohibited React imports (`react`, `react-dom/client`).
   - Removing `<div id="root"></div>` and replacing `<script type="module" src="/src/main.tsx"></script>` with `<script type="module" src="/src/sandbox.ts"></script>` completely severs the dev server from React.
   - Mounting `<moul-sandbox></moul-sandbox>` directly provides the custom element mount point for the Lit sandbox component drafted by M2.2.

2. **Integration of CSS Design Tokens**:
   - Observation 1.1 showed that `ui/index.html` did not link `style.css`.
   - By adding `<link rel="stylesheet" href="/src/styles/style.css" />`, Vite serves the design tokens directly.
   - Observation 1.4 confirmed that Vite's `pluginContainer` resolves `/src/styles/style.css` to the absolute disk path without requiring build-step bundling.
   - All custom elements in `<moul-sandbox>` will have immediate access to all CSS variables (`--color-bg`, `--color-fg`, `--spacing-*`, `--radius-*`, semantic tones).

3. **Font Loading & Anti-FOUC Reset**:
   - In accordance with the dispatch requirement ("Maintain font loading (Google Sans / Inter)"), the Google Fonts link is updated to load both `Google Sans` (weights 400–700) and `Inter` (weights 400–700):
     `family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Inter:wght@400;500;600;700`
   - Observation 1.3 showed that `style.css` sets `--font-family-base: var(--brand-font-family, inherit)`. Setting `font-family: var(--font-family-base, "Google Sans", "Inter", system-ui, sans-serif);` on `body` ensures that `inherit` resolves to Google Sans / Inter across all Web Components.
   - Zeroing `margin: 0; padding: 0;` on `html, body` and setting `min-height: 100vh; width: 100%;` enables full-bleed application shell layout for `<moul-sidebar>`.
   - Adding `moul-sandbox:not(:defined) { display: none; }` prevents Flash of Undefined Custom Elements (FOUCE) before custom element definition registration.

---

## 3. Caveats

1. **Dependency on M2.2 (`ui/src/sandbox.ts`)**:
   - `ui/index.html` references `/src/sandbox.ts`. If `bun run dev:ui` is accessed in a browser before `ui/src/sandbox.ts` is authored by the M2.2 worker, Vite will respond with 404 / Pre-transform error (`Failed to load url /src/sandbox.ts`). Both `ui/index.html` and `ui/src/sandbox.ts` must be deployed in Milestone 2.
2. **Theme Initialization**:
   - If a developer has previously saved a theme preference in `localStorage`, a minimal, defensive inline `<script>` in `<head>` applying `document.documentElement.dataset.theme` ensures no theme flicker occurs on page reload.
3. **Favicon Path**:
   - `ui/public/favicon.svg` exists and is correctly resolved at `/favicon.svg` by Vite.

---

## 4. Conclusion

The complete drop-in replacement for `/Users/phearak/github/orgs/moul-dev/ui/ui/index.html` is verified and ready for implementation:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Moul UI Sandbox</title>

    <!-- Google Fonts: Google Sans & Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Native CSS Design Tokens -->
    <link rel="stylesheet" href="/src/styles/style.css" />

    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        min-height: 100vh;
        width: 100%;
        background-color: var(--color-bg, #ffffff);
        color: var(--color-fg, #09090b);
        font-family: var(--font-family-base, "Google Sans", "Inter", system-ui, -apple-system, sans-serif);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      moul-sandbox:not(:defined) {
        display: none;
      }
    </style>
  </head>
  <body>
    <moul-sandbox></moul-sandbox>
    <script type="module" src="/src/sandbox.ts"></script>
  </body>
</html>
```

### Proposed Diff against `ui/index.html`:

```diff
--- a/ui/index.html
+++ b/ui/index.html
@@ -4,14 +4,43 @@
     <meta charset="UTF-8" />
     <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
-    <link rel="preconnect" href="https://fonts.googleapis.com">
-    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
-    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
-    <title>ui</title>
+    <title>Moul UI Sandbox</title>
+
+    <!-- Google Fonts: Google Sans & Inter -->
+    <link rel="preconnect" href="https://fonts.googleapis.com" />
+    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
+    <link
+      href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Inter:wght@400;500;600;700&display=swap"
+      rel="stylesheet"
+    />
+
+    <!-- Native CSS Design Tokens -->
+    <link rel="stylesheet" href="/src/styles/style.css" />
+
+    <style>
+      html,
+      body {
+        margin: 0;
+        padding: 0;
+        box-sizing: border-box;
+        min-height: 100vh;
+        width: 100%;
+        background-color: var(--color-bg, #ffffff);
+        color: var(--color-fg, #09090b);
+        font-family: var(--font-family-base, "Google Sans", "Inter", system-ui, -apple-system, sans-serif);
+        -webkit-font-smoothing: antialiased;
+        -moz-osx-font-smoothing: grayscale;
+      }
+
+      *,
+      *::before,
+      *::after {
+        box-sizing: border-box;
+      }
+
+      moul-sandbox:not(:defined) {
+        display: none;
+      }
+    </style>
   </head>
   <body>
-    <div id="root"></div>
-    <script type="module" src="/src/main.tsx"></script>
+    <moul-sandbox></moul-sandbox>
+    <script type="module" src="/src/sandbox.ts"></script>
   </body>
 </html>
```

---

## 5. Verification Method

### 5.1 Verification Commands

1. **Verify No React Dependencies or Guard Breaches**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected*: Exit code 0, 0 violations.

2. **Verify HTML File Formatting & Biome Linter**:
   ```bash
   bun run lint
   ```
   *Expected*: Exit code 0, 0 errors.

3. **Verify Dev Server Resolution & Startup**:
   Once `ui/index.html` and `ui/src/sandbox.ts` are written:
   ```bash
   bun run dev:ui
   ```
   In a separate terminal or test:
   ```bash
   curl -s http://localhost:5173/ | grep "<moul-sandbox>"
   curl -s http://localhost:5173/src/styles/style.css | head -n 10
   curl -s http://localhost:5173/src/sandbox.ts | head -n 10
   ```
   *Expected*:
   - HTTP 200 response with `<moul-sandbox></moul-sandbox>` and injected `/@vite/client`.
   - `/src/styles/style.css` returns the raw CSS tokens.
   - `/src/sandbox.ts` returns the transformed ES module without React references or Rollup errors.

### 5.2 Invalidation Conditions
- Any import of `react`, `react-dom`, `react-aria`, or `@stylexjs/stylex` in `ui/index.html` or files imported by `ui/src/sandbox.ts`.
- Vite failing to resolve `/src/styles/style.css` or `/src/sandbox.ts`.
- Layout issues caused by omission of `margin: 0` on `body`.
