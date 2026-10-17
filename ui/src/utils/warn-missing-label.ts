/**
 * Dev-only accessible label check helper.
 *
 * Emits a console.warn in development environments when an interactive element
 * lacks an accessible name (no `aria-label`, no `aria-labelledby`, and no visible label).
 * In production (`NODE_ENV === 'production'`), this check is a complete no-op (Req 2.8, 8.3).
 */
export function warnMissingLabel(
  host: HTMLElement,
  description: string,
  hasVisibleLabel = false,
): void {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'production'
  ) {
    return
  }

  const ariaLabel = host.getAttribute('aria-label')?.trim()
  const ariaLabelledBy = host.getAttribute('aria-labelledby')?.trim()
  const hasAriaLabel = Boolean(ariaLabel) || Boolean(ariaLabelledBy)

  if (!hasAriaLabel && !hasVisibleLabel) {
    const tagName = host.tagName ? host.tagName.toLowerCase() : 'element'
    console.warn(
      `[@moul-dev/ui] <${tagName}> is missing an accessible label (${description}). Provide an "aria-label" or "aria-labelledby" attribute.`,
    )
  }
}
