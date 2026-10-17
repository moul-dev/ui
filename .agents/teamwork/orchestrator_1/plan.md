# Orchestration Plan: Foundation Rebuild (Phase 1 & Phase 2)

## Scope
Fulfill all requirements and acceptance criteria for Phase 1 and Phase 2 from `ORIGINAL_REQUEST.md`, `rdt/requirements.md` (Req 1, 2, 3, 4, 6, 15, 16), `rdt/design.md` (Sections 1, 2, 3, 4, 5, 7, 10, 11), and `rdt/tasks.md` (Tasks 1.1–1.4, 2.1–2.4).

## Architecture & Code Layout
- `scripts/verify-no-react.ts`: Disallowed dependency guard script.
- `ui/package.json` & `docs/package.json`: Manifest updates removing React/StyleX/Waku/Fumadocs and establishing Lit 3 dependencies and strict package exports (`.` and `./style.css`).
- `ui/vite.config.ts`: Library build mode, `banReactImportsPlugin`, `"use client";` banner, and CSS asset copying to `dist/assets/style.css`.
- `ui/custom-elements-manifest.config.mjs`: CEM schema v2 config.
- `ui/src/test-setup.ts`: Vitest happy-dom test harness with `ElementInternals`, native `<dialog>` (disconnected DOMException), Popover API, and `ResizeObserver` shims.
- `ui/src/styles/style.css`: `:root` CSS token layer using `light-dark()` and `oklch()`, brand hooks, 5 color scales, semantic aliases, typography, spacing, radius, shadows, z-index, chart tokens, and alert tokens.
- `ui/src/styles/semantic-tones.ts`: 25 combinations of 5 semantic tones × 5 visual variants + `normalizeTone` & `normalizeVariant`.
- `ui/src/styles/reset.styles.ts`: Shared Shadow DOM CSS reset.
- `ui/src/utils/`:
  - `define-element.ts`: Idempotent registration with warning.
  - `warn-missing-label.ts`: Dev-only accessibility warning.
  - `focus-trap.ts`: Safe showModal, focus trap, focus restoration, popover/anchor fallback helper.
  - `motion.ts`: Presets (`SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`), `subtleAnimate`, `animateActiveIndicator`, `prefersReducedMotion`, `stagger`.
  - `icons.ts`: Zero-dependency Lit SVG templates.
- `ui/src/tokens/Tokens.test.ts`: Fast-check property-based and unit tests.

## Milestones
1. **Milestone 0: Survey & Scope Mapping**
   - 3 Explorers inspect the existing monorepo state, files in `ui/`, `docs/`, `scripts/`, existing tokens in `ui/src/tokens/tokens.stylex.ts`, current package.json files, and requirements.
2. **Milestone 1: Phase 1 Rebuild (Tasks 1.1–1.4)**
   - Workspace purge, verify-no-react guard, package manifests, Vite library build, CEM config, and happy-dom test harness setup.
3. **Milestone 2: Phase 2 Rebuild (Tasks 2.1–2.4)**
   - CSS token layer, 25-combination semantic tone matrix, reset styles, core utilities, and property-based test suite.
4. **Milestone 3: Verification, Forensic Audit & Acceptance Check**
   - Run verification guard, test suite, and Biome linting via worker, followed by review, challenge, and forensic audit.
