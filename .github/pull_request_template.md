## What changed

<!-- What the change does and why, in a few sentences. -->

## Element checklist

For each new or changed `<moul-*>` element (`ui/src/element-checklist.test.ts` checks what it can):

- [ ] Class JSDoc has a summary, a `Keyboard and screen readers:` paragraph and a `Reduced motion:` paragraph
- [ ] Tests cover keyboard use, the accessible name and role, and reduced motion
- [ ] Animation has a `prefers-reduced-motion` path
- [ ] Looks right in light and dark themes; colours come from tokens
- [ ] Demo on an English docs page and its Khmer twin

## Bundle size

- [ ] `bun run build:ui` passes the size budget, or `ui/size-budget.json` was raised on purpose (say why above)
