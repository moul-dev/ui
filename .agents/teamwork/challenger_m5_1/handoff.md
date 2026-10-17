# Milestone 5 Challenge Report: Surfaces & Feedback Adversarial Verification

**Verdict: REQUEST_CHANGES**

## 1. Observation

### Empirical Test Suite Execution
Authored a 32-test adversarial stress harness in `ui/src/components/surfaces-challenge.test.ts`.
Executed via Vitest:
`node ui/node_modules/.bin/vitest run --root ui src/components/surfaces-challenge.test.ts`
Result:
```text
 ✓ src/components/surfaces-challenge.test.ts (32) 721ms
   ✓ Empirical Adversarial Challenge Suite: Surfaces & Feedback (32) 721ms
     ✓ Challenge 1: MoulAlert Rapid Interactions, Role Consistency & Event Contracts (5) 317ms
       ✓ CHAL-ALT-01: Rapid dismissal trigger (burst 10 rapid clicks on dismiss button) fires dismiss events with valid MouseEvent detail
       ✓ CHAL-ALT-02: 100 rapid tone attribute mutations strictly maintain role="alert" for error/warning and role="status" for others
       ✓ CHAL-ALT-03: Dismiss button contract & accessibility attributes
       ✓ CHAL-ALT-04: Non-dismissible alert does not render dismiss button, and dynamically adding is-dismissible mounts it
       ✓ CHAL-ALT-05: Fast-check property test across all 25 tone × variant combinations preserves valid role
     ✓ Challenge 2: MoulTag & MoulTagGroup High-Volume Removals & Selection Transitions (6) 386ms
       ✓ CHAL-TAG-01: High-volume 50 tag removals in MoulTagGroup updates selectedKeys and fires 50 distinct remove events
       ✓ CHAL-TAG-02: Selection mode transitions from multiple to single to none
       ✓ CHAL-TAG-03: Remove button click isolates event: stops propagation and does NOT fire press event
       ✓ CHAL-TAG-04: Disabled tag (is-disabled=true) suppresses press events and click events
       ✓ CHAL-TAG-05: Group is-removable attribute propagates isRemovable=true to slotted tags
       ✓ CHAL-TAG-06: Tag with missing key does not break group selection handling
     ✓ Challenge 3: MoulAvatar & MoulAvatarGroup Initials, Unicode, Error Recovery & Boundaries (12)
       ✓ CHAL-AVT-01: Whitespace-only name string causes TypeError crash in unhandled getInitials
       ✓ CHAL-AVT-02: Empty name string fallback renders SVG icon and sets default aria-label="Avatar"
       ✓ CHAL-AVT-03: Single character names extract single uppercase initial
       ✓ CHAL-AVT-04: Multi-word names and irregular whitespace derive first two uppercase initials
       ✓ CHAL-AVT-05: Non-ASCII and accented names extract initials correctly
       ✓ CHAL-AVT-06: Unicode surrogate pairs render without uncaught exception
       ✓ CHAL-AVT-07: Empirical Lifecycle Flaw: Image error recovery fails on src change because hasImageError is cleared post-render in updated()
       ✓ CHAL-AVG-01: AvatarGroup extreme boundary max=0 hides all avatars and renders +N overflow badge
       ✓ CHAL-AVG-02: AvatarGroup boundary max=1 displays exactly 1 avatar and +2 badge
       ✓ CHAL-AVG-03: AvatarGroup large boundary max=100 displays all avatars with zero overflow badge
       ✓ CHAL-AVG-04: Dynamic DOM addition and removal recalculates avatar group overflow count
       ✓ CHAL-AVG-05: Empirical Cascade Flaw: AvatarGroup size cascade is blocked by MoulAvatar default size reflection
     ✓ Challenge 4: MoulCard Interactive States & Keyboard Interaction (5)
       ✓ CHAL-CRD-01: Dynamic isInteractive toggling reflects role="button" and tabindex="0" accurately
       ✓ CHAL-CRD-02: Non-interactive card ignores pointer and keyboard triggers (0 press events)
       ✓ CHAL-CRD-03: Interactive card keyboard triggers: Space and Enter keyup fire press event; repeat=true keydown ignored
       ✓ CHAL-CRD-04: Rapid synthetic click burst (50 clicks) on interactive card fires 50 press events
       ✓ CHAL-CRD-05: Slotted interactive elements: clicks inside card slot bubble up to card press handler
     ✓ Challenge 5: MoulBadge Resilience, Tone/Variant Normalization & Slot Edge Cases (4)
       ✓ CHAL-BDG-01: Rapid 50-cycle tone & variant mutations leave badge in consistent state matching final properties
       ✓ CHAL-BDG-02: Invalid tone and variant values normalize safely to defaults without throwing
       ✓ CHAL-BDG-03: Slotted content edge cases (empty slots, whitespace only, large content)
       ✓ CHAL-BDG-04: Empirical Audit: MoulBadge does not support is-dot despite worker claim

 Test Files  1 passed (1)
      Tests  32 passed (32)
```

Combined suite verification (`node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts src/components/surfaces-challenge.test.ts src/components/Actions.test.ts`):
- `79 passed (79)` across all 3 test suites.

Lint and formatting verification:
- `node_modules/.bin/biome check ui/src/components/surfaces-challenge.test.ts`: Checked 1 file in 14ms. No errors.
- `bun ./scripts/verify-no-react.ts all`: Zero disallowed React/legacy packages found.

### Confirmed Bugs & Deficiencies

#### Defect 1 (CRITICAL): `MoulAvatar` crashes with unhandled `TypeError` on whitespace-only name strings
- **File**: `ui/src/components/Avatar/Avatar.ts`, lines 10–17:
  ```ts
  function getInitials(name: string): string {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0][0].toUpperCase()
    }
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  ```
- **Observed Behavior**:
  When `<moul-avatar name="   "></moul-avatar>` is mounted, `name` is truthy, so `if (!name) return ''` does not trigger.
  `name.trim()` evaluates to `""`.
  `"".split(/\s+/)` returns `[""]`.
  `parts.length` is `1`.
  `parts[0]` is `""`.
  `parts[0][0]` is `undefined`.
  Calling `parts[0][0].toUpperCase()` throws `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
- **Reproduced in Test**: `CHAL-AVT-01` in `ui/src/components/surfaces-challenge.test.ts` line 440:
  `await expect(avatar.updateComplete).rejects.toThrow(/Cannot read properties of undefined/)`.
  Lit's render method throws and permanently crashes the component instance.

#### Defect 2 (HIGH): `MoulAvatar` fails to restore image when `src` updates after an error
- **File**: `ui/src/components/Avatar/Avatar.ts`, lines 36, 52–60, 83–86:
  ```ts
  private hasImageError = false
  ...
  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)
    if (changedProps.has('src')) {
      this.hasImageError = false
    }
    ...
  }
  ...
  protected override render() {
    const shouldShowImage = Boolean(this.src) && !this.hasImageError
    ...
  ```
- **Observed Behavior**:
  `hasImageError` is a non-reactive private field.
  When an image fails to load, `this.hasImageError = true`.
  When a consumer subsequent sets `avatar.src = 'https://valid.example/image.png'`, Lit executes `render()` before `updated()`.
  During `render()`, `this.hasImageError` is still `true`, so `shouldShowImage` is `false`, and the fallback initials are rendered instead of `<img>`.
  In `updated()`, `this.hasImageError` is set to `false`, but modifying a plain private field in `updated()` does not trigger another render.
  Consequently, the avatar remains stuck displaying the initials fallback and never renders the new image unless a secondary, unrelated property update occurs.
- **Reproduced in Test**: `CHAL-AVT-07` in `ui/src/components/surfaces-challenge.test.ts` line 527:
  After `avatar.src` is updated to a valid URL, `avatar.shadowRoot.querySelector('img')` remains `null`. Only after a manual `avatar.requestUpdate()` does the image element appear.

#### Defect 3 (MEDIUM): `MoulAvatarGroup` size cascade is completely non-functional
- **File**: `ui/src/components/Avatar/AvatarGroup.ts`, lines 43–47:
  ```ts
  assigned.forEach((avatar, index) => {
    if (this.size && !avatar.hasAttribute('size')) {
      avatar.size = this.size
    }
  ```
- **File**: `ui/src/components/Avatar/Avatar.ts`, lines 25, 42:
  ```ts
  size: { type: String, reflect: true },
  ...
  this.size = 'md'
  ```
- **Observed Behavior**:
  Because `MoulAvatar` declares `size` with `reflect: true` and defaults `this.size = 'md'` in its constructor, every single `moul-avatar` element reflects `size="md"` as an HTML attribute upon connection.
  When `MoulAvatarGroup` executes `if (this.size && !avatar.hasAttribute('size'))`, `!avatar.hasAttribute('size')` is always `false`.
  As a result, `avatar.size = this.size` NEVER runs, and child avatars without an explicit size remain locked at `md` instead of inheriting the group's `size` (e.g. `size="lg"`).
- **Reproduced in Test**: `CHAL-AVG-05` in `ui/src/components/surfaces-challenge.test.ts` line 604.

#### Discrepancy 4 (DOCUMENTATION / AUDIT): Worker handoff falsely claims `is-dot` support on `MoulBadge`
- **File**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/handoff.md`, line 10:
  `moul-badge: 25 combinations of tone × variant, size, is-dot, and prefix/default/suffix slots.`
- **Inspection**:
  Neither `ui/src/components/Badge/Badge.ts` nor `Badge.styles.ts` has any reference to `is-dot` or `isDot`.
- **Reproduced in Test**: `CHAL-BDG-04` in `ui/src/components/surfaces-challenge.test.ts` line 748.

---

## 2. Logic Chain

1. **Premise 1**: Robust production components must never crash on benign user input, such as leading/trailing or whitespace-only strings.
   - Observation: Passing `name="   "` causes an unhandled `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` in `Avatar.ts:14`, terminating the Lit element's update cycle and crashing the component.
   - Conclusion: Defect 1 is a blocking runtime crash.

2. **Premise 2**: Error states in reactive components must be cleanly recoverable when the underlying erroneous property is replaced with a valid value.
   - Observation: When `src` changes on `MoulAvatar` after an error, `render()` reads `hasImageError` while it is still `true`. The subsequent clearing of `hasImageError` in `updated()` does not schedule a re-render.
   - Conclusion: Defect 2 leaves `MoulAvatar` permanently broken in its error state after `src` mutation.

3. **Premise 3**: Parent container components that document property cascading (such as `MoulAvatarGroup` cascading `size`) must actually cascade properties to slotted children.
   - Observation: `MoulAvatar` automatically reflects its default `size="md"` to an HTML attribute on construction. `MoulAvatarGroup` checks `!avatar.hasAttribute('size')` to determine whether to cascade. Since all children have `size="md"` attribute, the cascade condition is universally false.
   - Conclusion: Defect 3 completely disables `MoulAvatarGroup`'s size cascading capability.

4. **Premise 4**: Worker handoff reports must accurately reflect what was implemented and verified.
   - Observation: `worker_m5_1` reported implementing `is-dot` for `MoulBadge`. The implementation has neither the property nor the styling for dots.
   - Conclusion: Discrepancy 4 indicates unverified claims in worker documentation.

---

## 3. Caveats

- All 26 worker tests in `Surfaces.test.ts` and 21 tests in `Actions.test.ts` continue to pass without regression.
- The other components (`MoulAlert`, `MoulCard`, `MoulTag`, `MoulTagGroup`, `MoulBadge`) exhibited excellent resilience under 50-burst clicks, 50-tag removals, keyboard interaction cycles, and rapid attribute mutations.
- The proposed mitigations are straightforward to implement by the worker and will not introduce breaking changes to the public API contract.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 5 cannot be approved in its current state due to a fatal runtime `TypeError` in `MoulAvatar` (whitespace names), an image error recovery lifecycle failure, and a broken size cascade in `MoulAvatarGroup`.

### Required Worker Fixes:
1. **Fix `getInitials` in `ui/src/components/Avatar/Avatar.ts`**:
   Sanitize trimmed input:
   ```ts
   function getInitials(name: string): string {
     const trimmed = name?.trim() ?? ''
     if (!trimmed) return ''
     const parts = trimmed.split(/\s+/)
     if (parts.length === 1) {
       return parts[0][0].toUpperCase()
     }
     return (parts[0][0] + parts[1][0]).toUpperCase()
   }
   ```
2. **Fix Image Error Recovery in `ui/src/components/Avatar/Avatar.ts`**:
   Declare `hasImageError` as internal reactive state:
   ```ts
   static override properties = {
     ...
     hasImageError: { state: true },
   }
   ```
   Or clear `this.hasImageError = false` inside `willUpdate(changedProps)` before `render()` executes.
3. **Fix Size Cascade in `ui/src/components/Avatar/AvatarGroup.ts`**:
   Either avoid reflecting default `size` on `MoulAvatar` unless explicitly set, or allow `MoulAvatarGroup` to override default `size="md"` on child avatars.
4. **Correct `MoulBadge` documentation**:
   Either implement `is-dot` support on `MoulBadge` or remove the false claim from the milestone report.

---

## 5. Verification Method

To independently verify all findings and reproduce the exact failures:

1. **Run the Adversarial Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/surfaces-challenge.test.ts
   ```
   *Expected*: All 32 tests pass, with `CHAL-AVT-01`, `CHAL-AVT-07`, `CHAL-AVG-05`, and `CHAL-BDG-04` specifically asserting and validating the presence of the 4 findings.

2. **Run Biome Verification**:
   ```bash
   node_modules/.bin/biome check ui/src/components/surfaces-challenge.test.ts
   ```

3. **Run Zero-React Manifest Verification**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
