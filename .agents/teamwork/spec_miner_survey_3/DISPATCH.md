## 2026-10-16T03:09:59Z

You are a Spec Miner agent (teamwork_preview_spec_miner).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_3
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md first.

Objective:
Mine the complete specifications from `rdt/requirements.md`, `rdt/design.md`, and `rdt/tasks.md` for Phase 1 and Phase 2.
Specifically document exact contracts and requirements for:
1. `scripts/verify-no-react.ts`: CLI usage (`bun ./scripts/verify-no-react.ts all`, `ui`, `docs`), exit codes, exact banned package patterns.
2. `ui/package.json` & `docs/package.json` manifests: exact dependencies, devDependencies, exports (`.` and `./style.css` only).
3. `ui/vite.config.ts`: `banReactImportsPlugin` specifications, library build outputs, Rollup banner `"use client";`, style.css copying to `dist/assets/style.css`.
4. `ui/custom-elements-manifest.config.mjs`: CEM schema v2 config.
5. `ui/src/test-setup.ts`: exact requirements for `ElementInternals`, native `<dialog>` (disconnected DOMException handling), Popover API, and `ResizeObserver` shims.
6. `ui/src/styles/semantic-tones.ts`: 25 combinations of 5 tones × 5 variants, backdrop-filter blur progressive enhancement with solid fallback, normalizeTone and normalizeVariant.
7. `ui/src/styles/reset.styles.ts`: Shadow DOM reset CSSResultGroup.
8. Core utilities in `ui/src/utils/`: `define-element.ts`, `warn-missing-label.ts`, `focus-trap.ts` (`safeShowModal`, focus trap, focus restoration, `supportsNativePopoverAndAnchor`), `motion.ts` (presets, `subtleAnimate`, `animateActiveIndicator`, `prefersReducedMotion`), and `icons.ts`.
9. Verification test requirements (`ui/src/tokens/Tokens.test.ts` with fast-check).

Scope boundary:
Do NOT implement changes. Extract and organize precise requirements and interfaces.
Write your report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_3/handoff.md`.
When done, send a message back to the orchestrator (conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2) with a summary and link to handoff.md.
