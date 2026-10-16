## 2026-10-16T03:18:33Z
You are an Explorer agent (teamwork_preview_explorer).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/PROJECT.md first.

Scope: Milestone 1 - Vitest + happy-dom Test Harness (`ui/src/test-setup.ts`)
1. Shims needed in `ui/src/test-setup.ts`:
   - `ElementInternals` shim:
     Attach to `HTMLElement.prototype.attachInternals`. Returns mock `ElementInternals` instance tracking:
     - `form`: `this.closest('form')`
     - `setFormValue(value)`
     - `setValidity(flags, message, anchor)`: stores validity flags, truncates `message` to `<= 200` chars
     - `reportValidity()`
     - `validity`: `ValidityState` getters based on flags
     - `validationMessage`: returns the current message
   - Native `<dialog>` shim:
     Shim on `HTMLDialogElement.prototype`:
     - `showModal()`: If `!this.isConnected`, MUST throw `new DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')` per Requirement 6.10 and Acceptance Criteria. If connected, sets `open = true`.
     - `close(returnValue)`: removes `open`, sets `returnValue`, dispatches `new Event('close')`.
   - Popover API shim:
     Shim on `HTMLElement.prototype`:
     - `showPopover()`, `hidePopover()`, `togglePopover()`
     - Toggles `:popover-open` simulation or attribute and dispatches `toggle` event.
   - Deterministic `ResizeObserver` controller:
     Global `ResizeObserver` mock that allows tests to register observers and includes a helper (e.g. `window.__triggerResize(element, { width, height })`) to deterministically fire observer callbacks with `ResizeObserverEntry[]`.

Formulate a detailed, concrete implementation strategy and code plan for the worker.
Do NOT modify files outside your working directory. Write your report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/handoff.md`.
When done, send a message back to the orchestrator (conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2).
