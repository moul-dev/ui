/**
 * Demo wiring for the dissolve page, so the MDX stays plain markup:
 *   data-dissolve             dissolves the <moul-dissolve> the button sits in
 *   data-dissolve="a b"       dissolves the elements with those ids
 *   data-dissolve-reset="a b" brings those elements back
 */
document.addEventListener('click', (event) => {
  const trigger = event.target?.closest?.(
    '[data-dissolve], [data-dissolve-reset]',
  )
  if (!trigger) return
  const byIds = (value) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
  if (trigger.hasAttribute('data-dissolve')) {
    // MDX writes a bare attribute as "true".
    const ids = trigger.getAttribute('data-dissolve')
    const isSelf = !ids || ids === 'true'
    const targets = isSelf ? [trigger.closest('moul-dissolve')] : byIds(ids)
    for (const target of targets) target?.dissolve?.()
  }
  const reset = trigger.getAttribute('data-dissolve-reset')
  if (reset) for (const target of byIds(reset)) target.reset?.()
})
