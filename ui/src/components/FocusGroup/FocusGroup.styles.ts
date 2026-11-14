import { css } from 'lit'

export const focusGroupStyles = css`
  :host {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(min(var(--focus-group-min-width, 14rem), 100%), 1fr)
    );
    gap: var(--focus-group-gap, var(--spacing-4, 1rem));
  }

  :host([hidden]) {
    display: none;
  }

  /* The group's own transition list replaces an item's, so it carries the
     properties a moul-card animates on hover too. Your own transition on an
     item wins over this one; include filter, opacity and scale in it. */
  ::slotted(*) {
    transition:
      filter var(--focus-group-duration, var(--duration-slow, 400ms))
        var(--ease-out, ease-out),
      opacity var(--focus-group-duration, var(--duration-slow, 400ms))
        var(--ease-out, ease-out),
      scale var(--focus-group-duration, var(--duration-slow, 400ms))
        var(--ease-out, ease-out),
      translate var(--duration-base, 250ms) var(--ease-out, ease-out),
      box-shadow var(--duration-base, 250ms) var(--ease-out, ease-out),
      background-color var(--duration-base, 250ms) var(--ease-smooth, ease);
  }

  /* Every item but the active one: data-active says whether the pointer
     (:hover) or keyboard focus (:focus-within) picks it. */
  :host([data-active="pointer"]) ::slotted(:not(:hover)),
  :host([data-active="focus"]) ::slotted(:not(:focus-within)) {
    filter: blur(var(--focus-group-blur, 4px));
    opacity: var(--focus-group-dim, 0.6);
    scale: var(--focus-group-scale, 0.98);
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*) {
      transition: none;
    }

    :host([data-active="pointer"]) ::slotted(:not(:hover)),
    :host([data-active="focus"]) ::slotted(:not(:focus-within)) {
      scale: none;
    }
  }

  /* Where the system forces its own colours, every item stays legible. */
  @media (forced-colors: active) {
    :host([data-active="pointer"]) ::slotted(:not(:hover)),
    :host([data-active="focus"]) ::slotted(:not(:focus-within)) {
      filter: none;
      opacity: 1;
      scale: none;
    }
  }
`
