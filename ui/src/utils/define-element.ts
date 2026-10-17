/**
 * Safe, idempotent custom element registration helper.
 *
 * Checks if a custom element tag name is already registered before calling
 * `customElements.define()`. Emits a console warning instead of throwing an error
 * or silently overriding the existing registration (Req 2.9, 16.5).
 */
export function defineElement(
  tagName: string,
  ctor: CustomElementConstructor,
): void {
  if (typeof customElements === 'undefined') return

  const existing = customElements.get(tagName)
  if (existing) {
    console.warn(
      `[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.`,
    )
    return
  }

  customElements.define(tagName, ctor)
}
