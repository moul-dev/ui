# Testing Architecture & Verification Specification: Phases 4–7

**Agent:** explorer_p4_7_2  
**Working Directory:** `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2`  
**Target Test Suites:**
- `ui/src/components/Actions.test.ts` (Phase 4 — 4 components)
- `ui/src/components/Surfaces.test.ts` (Phase 5 — 16 components)
- `ui/src/components/Overlays.test.ts` (Phase 6 — 6 components)
- `ui/src/components/Navigation.test.ts` (Phase 6 — 4 components)
- `ui/src/components/Forms.test.ts` (Phase 7 — 15 components)

---

## 1. Observation

Direct observations from inspecting the codebase, test harness, controller tests, and specification documents:

### 1.1 Test Harness & Shims (`ui/src/test-setup.ts`)
- **Native `<dialog>` Shim (`lines 232–306`):**
  - `HTMLDialogElement.prototype.showModal()`: Throws `DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')` if `!this.isConnected` (directly supporting Requirement 6.10). Throws if already `open`. When valid, sets `this.open = true` (reflecting attribute `open=""`).
  - `HTMLDialogElement.prototype.close(returnValue)`: Sets `this.open = false`, sets `this.returnValue`, and dispatches a `'close'` Event.
  - `HTMLDialogElement.prototype.show()`: Sets `open = true`.
- **Popover API Shim (`lines 309–471`):**
  - `ToggleEvent` class is shimmed on `window` and `globalThis` with `oldState` and `newState`.
  - `showPopover()`: Throws `DOMException` if `popover` attribute is missing or `!this.isConnected`. Dispatches cancelable `'beforetoggle'` event (`oldState: 'closed', newState: 'open'`). Sets `:popover-open` attribute and class. Dispatches `'toggle'` event.
  - `hidePopover()`: Dispatches `'beforetoggle'`, removes `:popover-open` attribute/class, dispatches `'toggle'`.
  - `togglePopover(force)`: Toggles popover state.
  - `matches(':popover-open')`: Patched on `BaseElementClass.prototype.matches` to match `:popover-open` attribute or class.
- **`ElementInternals` Shim (`lines 47–226`):**
  - `attachInternals()`: Returns `MockElementInternalsImpl`. Throws `DOMException('ElementInternals already attached', 'NotSupportedError')` if called more than once.
  - `form`: Resolves via host's `form` attribute ID lookup or `this.closest('form')` (with Happy DOM proxy unwrapping).
  - `setFormValue(value)`: Sets internal `_value`.
  - `setValidity(flags, message)`: Clamps `validationMessage` to `<= 200` characters. Computes `validity.valid` as `!Object.values(flags).some(Boolean)`.
  - `checkValidity()`: If invalid, dispatches cancelable `'invalid'` Event on host element.
  - `reportValidity()`: Calls `checkValidity()`.
- **Deterministic `ResizeObserver` Shim (`lines 477–605`):**
  - Exports `MockResizeObserver` and `triggerResize(element, { width, height, top, left })`. Also attached to `window.__triggerResize`.
- **Animations & CSS (`lines 15–41`):**
  - `BaseElementClass.prototype.getAnimations = () => []`.
  - `CSS.supports` stubbed to return `false` unless explicitly mocked.
  - `window.matchMedia` stubbed to return `matches: false`.

### 1.2 Controller Test Patterns (`ui/src/controllers/Controllers.test.ts`)
- **Host Lifecycle & Mounting (`lines 25–70`):**
  - Custom elements are appended to `document.body.appendChild(el)`.
  - Teardown in `afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })`.
- **PressController Interaction Simulation (`lines 129–256`):**
  - Pointer events: `new PointerEvent('pointerdown', { button: 0, bubbles: true })`, `pointerup`, `pointercancel`, `pointerenter`, `pointerleave`.
  - Keyboard activation: `new KeyboardEvent('keydown', { key: ' ', repeat: false, bubbles: true })` and `key: 'Enter'`. Repeat key events (`repeat: true`) are ignored.
  - Focus events: `new FocusEvent('focusin', { bubbles: true })` and `focusout`.
  - Disabled state: Host with `disabled` or `is-disabled` attribute suppresses interaction.
- **OverlayPresenceController Orchestration (`lines 572–732`):**
  - Async `setOpen(true)` and `setOpen(false)` manage `isMounted` and `isOpen`.
  - Dialog modal timing: `setOpen(true)` awaits enter animation and sets `dialog.open = true`. `setOpen(false)` awaits exit animation before setting `dialog.open = false` and `isMounted = false`.
  - Disconnected dialog handles `safeShowModal` by catching `DOMException` and warning without throwing.
- **FormInternalsController Integration (`lines 838–958`):**
  - Attached custom elements require `static formAssociated = true`.
  - Emits `console.warn` when host element has `name` attribute but is not inside a `<form>`.
  - `setValue()` synchronously updates `internals.setFormValue()`.

### 1.3 Requirements & Design Specifications (`rdt/design.md` & `rdt/requirements.md`)
- **Actions (Phase 4):** 4 components (`moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group`). Roving tabindex with arrow keys, `selected-key` synchronization, `aria-pressed`, `is-pending` with inline spinner and `aria-busy="true"`, `warnMissingLabel` when `is-icon` lacks `aria-label`.
- **Surfaces & Feedback (Phase 5):** 16 components (`moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, `moul-skeleton`, `moul-badge`, `moul-card`, `moul-empty-state`, `moul-alert`, `moul-progress-bar`, `moul-avatar`, `moul-avatar-group`, `moul-tag`, `moul-tag-group`, `moul-table`, `moul-toast` + `toastQueue`). 25 tone × variant combinations, avatar initials fallback, avatar group overflow badges, table skeleton loading state, toast top-layer manual popover.
- **Overlays (Phase 6):** 6 components (`moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-popover`, `moul-tooltip`, `moul-command-palette`). Native `<dialog>`, `safeShowModal()`, focus trapping, Escape key dismiss, Popover API, 300ms tooltip delay, virtualized command palette.
- **Navigation (Phase 6):** 4 components (`moul-link`, `moul-breadcrumbs` + `moul-breadcrumb-item`, `moul-pagination` + `generatePagination`, `moul-tabs` + `moul-tab` + `moul-tab-panel`). Roving tabindex in tabs, `aria-current="page"`, pagination math and bounds.
- **Forms (Phase 7):** 15 components (`moul-form`, `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area`, `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group` + `moul-radio`, `moul-switch`, `moul-slider`, `moul-input-otp`, `moul-select` + `moul-select-item`, `moul-combobox` + `moul-combobox-item`, `moul-calendar`, `moul-date-picker`). FormInternalsController, synchronous `setFormValue`, `valueMissing` validation, `submit`/`reset` re-dispatch, `Intl.DateTimeFormat` date handling.

---

## 2. Logic Chain

From these observations, we derive the structural testing architecture:

1. **Happy-DOM Asynchronous Lifecycle:**
   - In Happy DOM, custom elements instantiated via `document.createElement()` or `render(html`...`)` schedule render microtasks.
   - Asserting against `element.shadowRoot` before `await element.updateComplete` leads to null references or stale DOM assertions.
   - For composite elements with slotted custom elements (e.g., `moul-button-group` containing `moul-button`s, or `moul-tabs` containing `moul-tab`s), child custom elements also schedule updates. The harness must provide an `awaitNestedUpdates(root)` helper that awaits all descendant `updateComplete` promises.

2. **Event & Interaction Fidelity:**
   - Synthetic events dispatched via `dispatchEvent()` must specify `{ bubbles: true, cancelable: true }` so that event handlers attached to hosts or inner shadow elements capture them as real browser events would.
   - Pointer events require `{ button: 0 }` to trigger primary action paths in `PressController`.
   - Keyboard events require testing both Space (`' '`) and Enter (`'Enter'`), as well as ensuring repeated events (`repeat: true`) do not trigger duplicate activations.
   - Arrow navigation in collections (`moul-toggle-button-group`, `moul-tabs`, `moul-radio-group`) must verify circular wrapping (e.g. from last element to first on `ArrowRight`/`ArrowDown`, and first to last on `ArrowLeft`/`ArrowUp`) and updating `tabindex="0"` vs `tabindex="-1"`.

3. **Overlay & Popover Top-Layer Simulation:**
   - The native `<dialog>` and Popover shims operate synchronously in `test-setup.ts`, but `OverlayPresenceController` triggers entrance and exit animations.
   - In tests, opening and closing overlays must await the controller's promise or the component's `updateComplete`.
   - For `moul-tooltip` (300ms hover delay) and `moul-toast` (duration-based dismissal), tests must use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`, ensuring `vi.useRealTimers()` is restored in `afterEach()`.
   - For disconnected `<dialog>` testing (`safeShowModal()`), asserting that calling `dialog.showModal()` on a detached element throws `DOMException('InvalidStateError')`, while `safeShowModal()` wraps this call, emits `console.warn`, and prevents unhandled errors.

4. **Form Association & Validity Protocol:**
   - Form controls must participate natively in `<form>` containers.
   - Tests must verify:
     1. Attaching outside `<form>` logs a dev warning when `name` is present.
     2. Setting `value` immediately updates `internals.formValue`.
     3. An empty required control sets `validity.valueMissing = true`, has `validity.valid = false`, and returns `false` on `checkValidity()`.
     4. Populating the control clears `valueMissing` and restores `validity.valid = true`.
     5. Querying `new FormData(form).get(name)` produces the submitted value.
     6. `moul-form` handles child validity checking and dispatches custom `submit` with `detail: { formData }`.

---

## 3. Concrete Testing Patterns & Helper Setups

To ensure test consistency and zero boilerplate duplication across the five test files, implement the following shared test utilities (or define them inline in test files):

### 3.1 Test Fixture & Lifecycle Helpers

```typescript
import { html, render, type TemplateResult, type LitElement } from 'lit'

/**
 * Mounts a Lit template into document.body and awaits update completion
 * for the root element and all slotted custom element descendants.
 */
export async function mount<T extends HTMLElement>(
  template: TemplateResult,
): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

/**
 * Creates and appends an element by tag name and attributes.
 */
export async function createElement<T extends HTMLElement>(
  tag: string,
  attrs: Record<string, string | boolean> = {},
): Promise<T> {
  const el = document.createElement(tag) as T
  for (const [key, val] of Object.entries(attrs)) {
    if (typeof val === 'boolean') {
      if (val) el.setAttribute(key, '')
      else el.removeAttribute(key)
    } else {
      el.setAttribute(key, val)
    }
  }
  document.body.appendChild(el)
  await awaitNestedUpdates(el)
  return el
}

/**
 * Recursively awaits updateComplete on the root and all child custom elements.
 */
export async function awaitNestedUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const children = Array.from(root.querySelectorAll('*'))
  await Promise.all(
    children.map((child) => {
      if ('updateComplete' in child && (child as LitElement).updateComplete) {
        return (child as LitElement).updateComplete
      }
      return Promise.resolve()
    }),
  )
}
```

### 3.2 Interaction Simulation Helpers

```typescript
/**
 * Simulates a full pointer click/press cycle on a target element.
 */
export async function simulatePress(element: HTMLElement): Promise<void> {
  element.dispatchEvent(
    new PointerEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }),
  )
  element.dispatchEvent(
    new PointerEvent('pointerup', { button: 0, bubbles: true, cancelable: true }),
  )
  await awaitNestedUpdates(element)
}

/**
 * Simulates a keyboard key press on a target element.
 */
export async function simulateKey(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {},
): Promise<void> {
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }),
  )
  element.dispatchEvent(
    new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true, ...options }),
  )
  await awaitNestedUpdates(element)
}

/**
 * Simulates text input on a control.
 */
export async function simulateInput(
  input: HTMLElement,
  value: string,
): Promise<void> {
  if ('value' in input) {
    ;(input as any).value = value
  }
  input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
  await awaitNestedUpdates(input)
}
```

---

## 4. Test Case Structure & Matrix per Suite

### 4.1 Suite 1: `ui/src/components/Actions.test.ts` (Phase 4)
Target Components: `moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group`

| Component | Test Case ID | Test Description | Assertions & Invariants |
| :--- | :--- | :--- | :--- |
| `moul-button` | ACT-BTN-01 | Default initialization | Renders `<button>` in shadow DOM; `variant="primary"`, `size="md"`, `type="button"`, `isIcon=false`, `isDisabled=false`, `isPending=false`. |
| `moul-button` | ACT-BTN-02 | Visual variants & sizes | Setting `variant` (`secondary`, `tertiary`, `outline`, `ghost`, `danger`, `danger-soft`) and `size` (`sm`, `md`, `lg`) reflects attribute and applies corresponding CSS class/tokens. |
| `moul-button` | ACT-BTN-03 | Press event dispatch | `simulatePress(btn)` dispatches custom `'press'` event; pointerup with non-primary button (`button: 1`) does not fire `'press'`. |
| `moul-button` | ACT-BTN-04 | Keyboard activation | Space and Enter keys trigger `'press'` event; repeated keydown (`repeat: true`) does not fire duplicate events. |
| `moul-button` | ACT-BTN-05 | Disabled state suppression | When `is-disabled` is true, inner `<button>` has `disabled=""`, pointer/keyboard events do not dispatch `'press'`. |
| `moul-button` | ACT-BTN-06 | Pending state & accessibility | When `is-pending` is true: host and inner `<button>` have `aria-busy="true"`, renders `moul-spinner` with `size="sm"`, suppresses `'press'` activation. |
| `moul-button` | ACT-BTN-07 | Icon-only button validation | When `is-icon` is true without `aria-label`/`aria-labelledby`, emits `console.warn` in dev mode; does NOT warn when `aria-label` is present. |
| `moul-button` | ACT-BTN-08 | Slots projection | Default slot renders label text; `prefix` and `suffix` named slots project icons/content correctly. |
| `moul-button-group` | ACT-GRP-01 | Orientation & spacing | `orientation="horizontal"` / `"vertical"` and `spacing="none"` / `"sm"` / `"md"` reflect to attributes and apply layout styling; host has `role="group"`. |
| `moul-button-group` | ACT-GRP-02 | Disabled propagation | When `moul-button-group` has `is-disabled`, slotted `moul-button`s inherit disabled behavior. |
| `moul-toggle-button` | ACT-TGL-01 | State toggle & aria-pressed | Clicking toggles `isSelected` (`true` <-> `false`); updates `aria-pressed` on inner button; dispatches `'change'` (`detail: { isSelected, value }`) and `'press'`. |
| `moul-toggle-button` | ACT-TGL-02 | Disabled toggle | When `is-disabled` is set, clicking does not toggle state or fire events. |
| `moul-toggle-button-group` | ACT-TGG-01 | Selection synchronization | Setting `selected-key="opt2"` sets `is-selected` on the matching child `moul-toggle-button[value="opt2"]` and unsets on others. |
| `moul-toggle-button-group` | ACT-TGG-02 | Child click selection | Clicking an unselected child updates group's `selected-key` and dispatches `'selectionchange'` (`detail: { selectedKey }`). |
| `moul-toggle-button-group` | ACT-TGG-03 | Roving tabindex & Arrow keys | Selected button has `tabindex="0"`, other buttons have `tabindex="-1"`. `ArrowRight`/`ArrowDown` moves focus to next button with wrapping; `ArrowLeft`/`ArrowUp` moves to previous with wrapping. |
| `moul-toggle-button-group` | ACT-TGG-04 | Home / End keys | `Home` focuses first toggle button; `End` focuses last toggle button. |

---

### 4.2 Suite 2: `ui/src/components/Surfaces.test.ts` (Phase 5)
Target Components: 16 components (`moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, `moul-skeleton`, `moul-badge`, `moul-card`, `moul-empty-state`, `moul-alert`, `moul-progress-bar`, `moul-avatar`, `moul-avatar-group`, `moul-tag`, `moul-tag-group`, `moul-table`, `moul-toast` + `toastQueue`)

| Component | Test Case ID | Test Description | Assertions & Invariants |
| :--- | :--- | :--- | :--- |
| `moul-typography` | SURF-TYP-01 | Semantic tag mapping | `variant="h1"` renders `<h1>`, `h2`–`h6` render `<h2>`–`<h6>`, `body` renders `<p>`, `caption` renders `<span>`, `code`/`mono` render `<code>`. Tone styling applied. |
| `moul-kbd` | SURF-KBD-01 | Keyboard notation | `keys="⌘+K"` renders separate `<kbd>` tags for `"⌘"` and `"K"`; default slot fallback rendered. |
| `moul-separator` | SURF-SEP-01 | ARIA separator | Renders `<hr role="separator" aria-orientation="horizontal">`; changes to `"vertical"` when `orientation="vertical"`. |
| `moul-spinner` | SURF-SPN-01 | Accessible spinner | Renders SVG spinner with `role="status"` and `aria-label="Loading"`; supports sizes `sm`, `md`, `lg`. |
| `moul-skeleton` | SURF-SKL-01 | Shape & animation variant | Supports `shape` (`line`, `circle`, `rect`), `variant` (`pulse`, `wave`), custom `width`/`height` styles; has `aria-hidden="true"`. |
| `moul-badge` | SURF-BDG-01 | 25 Tone × Variant matrix | Tests property-based matrix of 5 tones (`primary`, `accent`, `success`, `warning`, `error`) × 5 variants (`solid`, `flat`, `shadow`, `bordered`, `glass`). Slot projections (`prefix`, default, `suffix`). |
| `moul-card` | SURF-CRD-01 | Slots & interactive mode | Slotted `header`, `body`, and `footer` render cleanly; when `is-interactive` is true, clicking dispatches `'press'` event and applies PressController. |
| `moul-empty-state` | SURF-EMP-01 | Slot layout & alignment | Projects `icon`, `title`, `description`, `actions` slots; respects `align="start"` and `align="center"`. |
| `moul-alert` | SURF-ALT-01 | Alert role & dismiss action | Has `role="alert"`; when `is-dismissible` is true, close button is present; clicking close button triggers exit animation and dispatches `'dismiss'` event. |
| `moul-progress-bar` | SURF-PRG-01 | ARIA progress & clamping | Host sets `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`. Value `< 0` clamped to `0`, `> 100` clamped to `100`. Fill bar width style matches `clamped%`. |
| `moul-avatar` | SURF-AVT-01 | Initials fallback & error | Image error or empty `src` derives initials from `name` (e.g. "John Doe" -> "JD", "Phearak" -> "P"); dispatches `'error'` event on `<img>` failure. |
| `moul-avatar-group` | SURF-AVG-01 | Overflow counter | Slotted avatars with `max=3`: when 5 avatars provided, renders first 3 avatars and a `+2` overflow badge. |
| `moul-tag` & `moul-tag-group` | SURF-TAG-01 | Removal & selection | Removable tag renders close button; clicking close button dispatches `'remove'` (`detail: { key }`). `moul-tag-group` with `selectionMode="single"` / `"multiple"` manages selection and dispatches `'selectionchange'`. |
| `moul-table` | SURF-TBL-01 | Loading skeleton state | When `is-loading` is true, data rows are replaced by `moul-skeleton` rows (Requirement 11.13). |
| `moul-table` | SURF-TBL-02 | Sorting & selection | Clicking sortable header updates sort direction and dispatches `'sortchange'`; row selection toggles row checkbox and dispatches `'selectionchange'`. |
| `moul-toast` & `toastQueue` | SURF-TST-01 | Queue & auto-dismiss | `toastQueue.add({ title: 'Saved', duration: 3000 })` mounts toast promoted via `popover="manual"`; `vi.advanceTimersByTime(3000)` triggers dismissal. |

---

### 4.3 Suite 3: `ui/src/components/Overlays.test.ts` (Phase 6)
Target Components: `moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-popover`, `moul-tooltip`, `moul-command-palette`

| Component | Test Case ID | Test Description | Assertions & Invariants |
| :--- | :--- | :--- | :--- |
| `moul-modal` | OV-MOD-01 | Native `<dialog>` lifecycle | Setting `is-open="true"` invokes `dialog.showModal()`, sets `isMounted=true`; setting `false` invokes exit animation, closes dialog, unmounts. |
| `moul-modal` | OV-MOD-02 | Disconnected DOMException | Calling `safeShowModal()` when dialog is disconnected catches `DOMException` and warns without throwing (Requirement 6.10). |
| `moul-modal` | OV-MOD-03 | Escape key close & focus restore | Pressing `Escape` closes modal, dispatches `'openchange'` (`detail: { isOpen: false }`), and restores focus to previous trigger element. |
| `moul-modal` | OV-MOD-04 | Focus trapping | Slotted interactive elements inside modal trap `Tab` and `Shift+Tab` within the dialog boundary. |
| `moul-alert-dialog` | OV-ALT-01 | Alertdialog role & buttons | Inner `<dialog>` has `role="alertdialog"`; confirm and cancel buttons dispatch `'confirm'`, `'cancel'`, and close modal. |
| `moul-drawer` | OV-DRW-01 | Placement & animation | Supports `placement` (`left`, `right`, `top`, `bottom`); sets preset on OverlayPresenceController (`drawer-left`, etc.); handles Escape dismissal. |
| `moul-popover` | OV-POP-01 | Popover API integration | Clicking trigger calls `showPopover()`; sets `:popover-open` attribute; clicking outside or close trigger calls `hidePopover()` and dispatches `'openchange'`. |
| `moul-tooltip` | OV-TLP-01 | 300ms hover delay | `pointerenter` starts timer; `vi.advanceTimersByTime(299)` leaves tooltip closed; `advanceTimersByTime(1)` opens tooltip (`:popover-open`); `pointerleave` closes it. |
| `moul-tooltip` | OV-TLP-02 | Focusin immediate display | `focusin` on trigger displays tooltip immediately without delay; `focusout` hides it. |
| `moul-command-palette` | OV-CMD-01 | Palette filtering & selection | Keyboard shortcut (`⌘K`) opens palette `<dialog>`; typing in search field filters items; Arrow keys navigate and Enter selects item, dispatching `'select'`. |

---

### 4.4 Suite 4: `ui/src/components/Navigation.test.ts` (Phase 6)
Target Components: `moul-link`, `moul-breadcrumbs` (+ `moul-breadcrumb-item`), `moul-pagination`, `moul-tabs` (+ `moul-tab`, `moul-tab-panel`)

| Component | Test Case ID | Test Description | Assertions & Invariants |
| :--- | :--- | :--- | :--- |
| `moul-link` | NAV-LNK-01 | Normal link rendering | Renders `<a>` with `href`, `target`, `rel`; dispatches `'press'` on activation. |
| `moul-link` | NAV-LNK-02 | External link contract | When `is-external` is true: adds `rel="noopener noreferrer"` and renders external arrow icon SVG. |
| `moul-breadcrumbs` | NAV-BRD-01 | Semantic breadcrumb nav | Renders `<nav aria-label="Breadcrumb"><ol>...</ol></nav>`; items separated by `separator` character (`'/'`); item with `is-current` has `aria-current="page"`. |
| `moul-pagination` | NAV-PAG-01 | `generatePagination` helper | Pure unit tests: (1, 10, 1) -> `[1, 2, '...', 10]`; (5, 10, 1) -> `[1, '...', 4, 5, 6, '...', 10]`; (10, 10, 1) -> `[1, '...', 9, 10]`. Boundary: totalPages=1. |
| `moul-pagination` | NAV-PAG-02 | Page change event & bounds | Clicking page button updates `current-page` and dispatches `'pagechange'` (`detail: { page }`). Prev button disabled on page 1, Next button disabled on last page. |
| `moul-tabs` | NAV-TAB-01 | Tablist & panel sync | Host/wrapper has `role="tablist"`, active `moul-tab` has `role="tab"`, `aria-selected="true"`, `tabindex="0"`. Matching `moul-tab-panel` has `role="tabpanel"` and is visible; inactive panels are hidden. |
| `moul-tabs` | NAV-TAB-02 | Arrow roving focus | `ArrowRight`/`ArrowDown` moves active focus to next tab (wrapping around); `ArrowLeft`/`ArrowUp` moves to previous tab; dispatches `'selectionchange'`. |
| `moul-tabs` | NAV-TAB-03 | Disabled tab skip | A `moul-tab` with `is-disabled` is skipped during keyboard arrow navigation. |

---

### 4.5 Suite 5: `ui/src/components/Forms.test.ts` (Phase 7)
Target Components: 15 components (`moul-form`, `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area`, `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group` + `moul-radio`, `moul-switch`, `moul-slider`, `moul-input-otp`, `moul-select` + `moul-select-item`, `moul-combobox` + `moul-combobox-item`, `moul-calendar`, `moul-date-picker`)

| Component | Test Case ID | Test Description | Assertions & Invariants |
| :--- | :--- | :--- | :--- |
| `moul-form` | FRM-FRM-01 | Form validation & submit | Slotted form controls are validated before submit; invalid controls cancel submit and fire `'invalid'`; valid controls dispatch custom `'submit'` with `detail: { formData }`. Reset restores initial values. |
| `moul-text-field` | FRM-TXT-01 | Form association & value sync | `static formAssociated = true`; setting `value="test"` updates `internals.setFormValue()`; `new FormData(form).get('user') === 'test'`. |
| `moul-text-field` | FRM-TXT-02 | Required validation | When `is-required` is true and value is empty, `validity.valueMissing` is `true`, `checkValidity()` returns `false`, validation message <= 200 chars. |
| `moul-number-field` | FRM-NUM-01 | Numeric constraints & steppers | Stepper buttons increment/decrement by `step`; enforces `min` and `max`; parsing invalid input flags `badInput`. |
| `moul-search-field` | FRM-SCH-01 | Clear button & submit | Non-empty value reveals clear button; clicking clear empties value and fires `'clear'` and `'input'`; Enter key in field dispatches `'submit'`. |
| `moul-text-area` | FRM-TXA-01 | Multiline & rows | Renders `<textarea rows="3">`; updates form value on input; supports `auto-resize`. |
| `moul-checkbox` | FRM-CHK-01 | Checked value & indeterminate | Checked: form value is `value` (default `'on'`); unchecked: form value is `null`. `is-indeterminate` sets visual indeterminate state. |
| `moul-checkbox-group` | FRM-CKG-01 | Group array value | Slotted checkboxes synchronize with group `value: string[]`; toggling child dispatches `'change'` with updated array. |
| `moul-radio-group` | FRM-RAD-01 | Mutual exclusion & arrows | Only one `moul-radio` can be checked; Arrow keys navigate and check next radio; required radio group fails validation if none checked. |
| `moul-switch` | FRM-SWT-01 | Role switch & toggle | `role="switch"`, `aria-checked="true|false"`; click toggles checked state and dispatches `'change'`. |
| `moul-slider` | FRM-SLD-01 | Range track & arrow keys | `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; Arrow keys increment/decrement by step; clamped between min/max. |
| `moul-input-otp` | FRM-OTP-01 | Digit slots & completion | Renders `length` (default 6) input slots; typing advances focus to next slot; backspace navigates to previous; pasting 6 digits fills all slots and dispatches `'complete'` (`detail: { value }`). |
| `moul-select` | FRM-SEL-01 | Dropdown Popover & selection | Trigger opens Popover dropdown listbox; Arrow keys navigate items, Enter/click selects item, updates `selected-key` and form value, closes dropdown. |
| `moul-combobox` | FRM-CMB-01 | Combobox filter & select | Typing in input filters visible `moul-combobox-item`s; selecting item updates input value and form value. |
| `moul-calendar` | FRM-CAL-01 | `Intl.DateTimeFormat` | Formats month header and weekdays according to `locale` attribute (e.g. `'en-US'` vs `'km-KH'`); month nav buttons update month; clicking day cell updates `value` and dispatches `'change'`. |
| `moul-date-picker` | FRM-DTP-01 | Popover calendar picker | Form-associated date picker; clicking calendar icon opens Popover containing `moul-calendar`; selecting date updates input, closes popover, updates form value. |

---

## 5. Caveats

1. **Happy DOM Shadow DOM Piercing:** Happy DOM implements Shadow DOM query methods (`shadowRoot.querySelector`), but does not fully emulate browser CSS layout engine (e.g. `window.getComputedStyle` does not calculate actual pixel layout or font metrics). Visual layout tests must assert against attributes, classes, and CSS custom property values rather than computed bounding boxes.
2. **Web Animations API Mock:** In `test-setup.ts`, `Element.prototype.getAnimations` returns `[]`. Motion animations using Web Animations API or spring loops settle synchronously or via microtasks in this test harness. For asynchronous timing, relying on `await element.updateComplete` or `await controller.setOpen(...)` is necessary.
3. **Locale Support in happy-dom:** `Intl.DateTimeFormat` relies on the Node.js / Bun runtime's ICU data. All modern Node/Bun versions include full ICU (`full-icu`), but edge locale formatting checks should verify standard format strings rather than asserting exact byte sequences if localized strings vary across OS ICU versions.
4. **No caveats** regarding browser API shimming—`test-setup.ts` covers `ElementInternals`, native `<dialog>`, Popover API, and `ResizeObserver`.

---

## 6. Conclusion

The testing architecture for Phases 4 through 7 is fully specified and ready for implementation.
1. The 5 target test suites (`Actions.test.ts`, `Surfaces.test.ts`, `Overlays.test.ts`, `Navigation.test.ts`, `Forms.test.ts`) partition the 45 components cleanly into domain categories.
2. The testing patterns established here leverage the exact shims configured in `ui/src/test-setup.ts`, eliminating testing gaps in Popover API, `<dialog>`, and `ElementInternals`.
3. The helper utilities (`mount`, `awaitNestedUpdates`, `simulatePress`, `simulateKey`, `simulateInput`) guarantee deterministic execution without asynchronous race conditions in Happy DOM.

---

## 7. Verification Method

To verify the test architecture once test suites are authored:

1. **Targeted Test Execution:**
   Run each test file individually using Vitest:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts
   node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts
   node ui/node_modules/.bin/vitest run --root ui src/components/Overlays.test.ts
   node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts
   ```

2. **Full Test Suite Run:**
   ```bash
   bun run --cwd ui test
   ```

3. **Biome Lint Check:**
   ```bash
   bun run lint
   ```

4. **Zero-React Guard Verification:**
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```

5. **Invalidation Conditions:**
   - Any test suite importing from React, React Aria, StyleX, or `@lit/react`.
   - Any test failing to clean up mounted DOM nodes (`document.body.innerHTML = ''`).
   - Any flaky test caused by asserting on shadow DOM prior to `await element.updateComplete` or `awaitNestedUpdates(element)`.
