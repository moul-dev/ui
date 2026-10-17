# Handoff Report: Phase 9 LogsViewer Investigation

## 1. Observation

- **Existing LogsViewer Files**:
  - `ui/src/components/LogsViewer/index.ts` (lines 1–28): Currently exports legacy subcomponents `HighlightText`, `LogAttributeChip`, `LogLevelBadge`, `LogCopyIconButton`, `Logs`, `LogsViewer`, along with pure utilities `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, and `SERVER_LOGS`.
  - `ui/src/components/LogsViewer/Logs.tsx` (lines 1–1415): Contains 1,415 lines of React 19 code importing `react`, `react-aria-components`, `@stylexjs/stylex`, and `@phosphor-icons/react`.
  - `ui/src/components/LogsViewer/Logs.styles.ts` (lines 1–498): Contains StyleX style declarations importing `@stylexjs/stylex` and `../../tokens/tokens.stylex`.
  - `ui/src/components/LogsViewer/Logs.types.ts` (lines 1–218): Imports `StyleXStyles` from `@stylexjs/stylex`, `React` from `'react'`, and `Key` from `'react-aria-components'`. Lines 5–17 define pure interfaces `LogLevel`, `LogItem`, and `LogFilterLevel`.
  - `ui/src/components/LogsViewer/parseLogs.ts` (lines 1–210): Pure TypeScript implementation with zero DOM or React imports (`import type { LogItem, LogLevel } from './Logs.types'`). Implements `normalizeLogLevel`, `parseAttributes`, `stripAttributes`, `parseLogLine`, and `parseLogs`.
  - `ui/src/components/LogsViewer/exampleLogs.ts` (lines 1–23): Pure sample log dataset exporting `SERVER_LOG_RAW` and `SERVER_LOGS`.
  - `ui/src/components/LogsViewer/Logs.test.tsx` (lines 1–464): Legacy React Testing Library test suite importing `@testing-library/react`.
- **Package Manifest & Dependency Guards**:
  - `ui/package.json` (line 64): Contains `"@lit-labs/virtualizer": "^2.1.0"` in `dependencies`, alongside `"lit": "^3.2.1"` and `"motion": "^13.4.1"`.
  - `ui/vite.config.ts` (lines 7–38): Implements `banReactImportsPlugin` which throws an error if any import matches `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
  - `scripts/verify-no-react.ts`: CLI guard rejecting banned React and StyleX dependencies.
- **Design Tokens & Shared Styles**:
  - `ui/src/styles/style.css`: Defines `:root` CSS variables for background, foreground, border, and status alert colors (`--color-alert-bg-error`, `--color-alert-border-error`, `--color-alert-bg-warning`, `--color-primary-100`, etc.).
  - `ui/src/styles/reset.styles.ts` (lines 9–81): Exports `resetStyles: CSSResultGroup` for Shadow DOM resets and accessible `:focus-visible`.
  - `ui/src/styles/semantic-tones.ts` (lines 8–170): Exports `semanticToneStyles`, `normalizeTone`, and `normalizeVariant`.
  - `ui/src/utils/motion.ts` (lines 9–77): Exports `SPRING_SNAPPY`, `SPRING_GENTLE`, `subtleAnimate`, and `animateActiveIndicator`.
  - `ui/src/utils/icons.ts`: Exports zero-dependency Lit SVG templates (`search`, `close`, `clear`, `alertInfo`, etc.).
- **Codebase Virtualization Precedent**:
  - `ui/src/components/CommandPalette/CommandPalette.ts` (lines 1, 280–286): Uses `import { virtualize } from '@lit-labs/virtualizer/virtualize.js'` with fallback to standard map iteration when items are few or in headless test environments.
- **Root Entrypoint Exports**:
  - `ui/src/index.ts` (lines 178–201): Currently exports `HighlightText`, `LogAttributeChip`, `LogLevelBadge`, `Logs`, `LogsViewer`, `normalizeLogLevel`, `parseAttributes`, `parseLogLine`, `parseLogs`, `SERVER_LOG_RAW`, `SERVER_LOGS`, and `stripAttributes`.

---

## 2. Logic Chain

1. From observation of `ui/vite.config.ts` (`banReactImportsPlugin`) and `scripts/verify-no-react.ts`, any inclusion of `react`, `react-aria-components`, or `@stylexjs/stylex` causes immediate build failures. Therefore, `Logs.tsx`, `Logs.styles.ts`, and `Logs.test.tsx` must be removed/replaced completely with zero-React Lit implementations.
2. From observation of `parseLogs.ts` and `exampleLogs.ts`, neither file contains any React or StyleX imports. Their pure parsing logic (`parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`) and dataset (`SERVER_LOG_RAW`, `SERVER_LOGS`) can be preserved directly as required by Requirement 12.3.
3. From observation of `Logs.types.ts`, lines 5–17 define `LogLevel`, `LogItem`, and `LogFilterLevel` without React dependencies, whereas lines 19–218 are legacy React prop types. Retaining the pure types and replacing the React interfaces with Lit custom element types (`LogsViewerProps`, event details) produces clean TypeScript typings without build guard violations.
4. From observation of `ui/package.json` and `CommandPalette.ts`, `@lit-labs/virtualizer` is available, and the `virtualize` directive pattern (`import { virtualize } from '@lit-labs/virtualizer/virtualize.js'`) with conditional fallback provides scalable virtualization in the browser while maintaining deterministic test execution under Happy DOM.
5. From observation of `rdt/design.md` (Sections 6.6, 8.6) and `ui/src/utils/motion.ts`, `animateActiveIndicator` with `SPRING_SNAPPY` directly satisfies the level filter indicator pill glide requirement, and `subtleAnimate` with `SPRING_GENTLE` satisfies the attribute drawer opening animation.
6. From observation of `ui/src/styles/reset.styles.ts` and `style.css`, Lit component styles can be authored in `LogsViewer.styles.ts` using `css` and native CSS tokens without any StyleX dependency.
7. From observation of `ui/src/index.ts`, updating the barrel export to provide `MoulLogsViewer`, `LogsViewer`, `MoulLogs`, `Logs`, the 5 pure parsing utilities, 2 sample constants, and types maintains the public contract specified in Requirement 12.

---

## 3. Caveats

- **Network Sandbox for bun install**: In the isolated sandbox environment, external npm registry access is blocked, preventing fresh package downloads. However, all required dependencies (`@lit-labs/virtualizer`, `lit`, `motion`, etc.) are declared in `package.json` and locked in `bun.lock`.
- **Happy DOM Layout Dimensions**: Happy DOM defaults all layout dimensions (`getBoundingClientRect`, `clientHeight`) to 0 unless triggered via `__triggerResize`. The hybrid virtualization fallback pattern (mirroring `CommandPalette.ts`) must be employed so that unit tests in `Blocks.test.ts` can assert on rendered DOM nodes without timing out or failing.

---

## 4. Conclusion

The migration plan for LogsViewer in Phase 9 is fully specified, low risk, and ready for implementation:
1. **Preserve intact**: `ui/src/components/LogsViewer/parseLogs.ts` and `ui/src/components/LogsViewer/exampleLogs.ts`.
2. **Refactor types**: Clean `ui/src/components/LogsViewer/Logs.types.ts` into pure Web Component interfaces (`LogItem`, `LogLevel`, `LogFilterLevel`, etc.).
3. **Author Lit Styles**: Create `ui/src/components/LogsViewer/LogsViewer.styles.ts` using Lit `css` + `resetStyles` and native design tokens.
4. **Implement Lit Components**:
   - `MoulLogsViewer` (`ui/src/components/LogsViewer/LogsViewer.ts`): Tag `moul-logs-viewer`, virtualization via `@lit-labs/virtualizer`, search/level filtering, timestamp toggling, line wrapping, FLIP indicator animation via `animateActiveIndicator`, and inspector drawer.
   - `MoulLogs` (`ui/src/components/LogsViewer/Logs.ts`): Tag `moul-logs`, companion parser element forwarding `LogItem[]` to internal `moul-logs-viewer`.
5. **Update Barrels**: Export `MoulLogsViewer`, `LogsViewer`, `MoulLogs`, `Logs`, pure parsers, and sample data from `ui/src/components/LogsViewer/index.ts` and `ui/src/index.ts`.
6. **Author Tests**: Write comprehensive test coverage in `ui/src/components/Blocks.test.ts` verifying parsing, rendering, filtering, toggling, and registration.

---

## 5. Verification Method

To verify the survey findings and eventual implementation:
1. **Check Disallowed Imports**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
2. **Inspect Files**:
   Confirm zero occurrences of `react`, `react-dom`, `@stylexjs`, `react-aria` in `ui/src/components/LogsViewer/`:
   ```bash
   grep -rn "react" ui/src/components/LogsViewer/
   grep -rn "@stylexjs" ui/src/components/LogsViewer/
   ```
3. **Run Test Suite**:
   ```bash
   bun --cwd ui test src/components/Blocks.test.ts
   ```
4. **Build Library Bundle**:
   ```bash
   bun run --cwd ui build
   ```
