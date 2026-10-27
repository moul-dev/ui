# Dispatch — Explorer M2.3

## Mission
Design the sandbox HTML host (`ui/index.html`) and verify Vite dev server integration for Milestone 2.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/handoff.md

## Scope & Tasks
1. Design `ui/index.html` to:
   - Link CSS design tokens: `<link rel="stylesheet" href="/src/styles/style.css" />`.
   - Mount `<moul-sandbox></moul-sandbox>`.
   - Load sandbox entry: `<script type="module" src="/src/sandbox.ts"></script>`.
   - Maintain font loading (Google Sans / Inter).
2. Check compatibility with `bun run dev:ui` (`vite`).
3. Report verified HTML snippet and instructions in `handoff.md`.

## 2026-10-17T13:23:10Z
From: dae9e90c-c048-4fc8-8e06-169a5a42bbad
Content:
You are explorer_phase10_m2_3, a teamwork_preview_explorer.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

Your task:
1. Design ui/index.html to mount <moul-sandbox></moul-sandbox>, link /src/styles/style.css, and load <script type="module" src="/src/sandbox.ts"></script>.
2. Verify dev server compatibility (bun run dev:ui).
3. Write your report in handoff.md and message the orchestrator.
