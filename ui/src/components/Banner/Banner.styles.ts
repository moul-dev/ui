import { css } from 'lit'

export const bannerStyles = css`
  :host {
    --_banner-bg: var(--_banner-solid-bg);
    --_banner-fg: var(--_banner-solid-fg);
    --_banner-solid-bg: var(--color-accent);
    --_banner-solid-fg: var(--color-accent-fg);
    --_banner-soft-bg: var(--color-accent-soft);
    --_banner-soft-fg: var(--color-accent-soft-fg);
    --_banner-border: var(--color-alert-border-accent);

    display: block;
    font-family: var(--font-family-base, inherit);
  }

  :host([hidden]) {
    display: none;
  }

  :host([tone="accent"]) {
    --_banner-solid-bg: var(--color-primary-500);
    --_banner-soft-bg: var(--color-alert-bg-accent);
    --_banner-soft-fg: var(--color-primary-600);
  }

  :host([tone="success"]) {
    --_banner-solid-bg: var(--color-success);
    --_banner-solid-fg: var(--color-success-fg);
    --_banner-soft-bg: var(--color-success-soft);
    --_banner-soft-fg: var(--color-success-soft-fg);
    --_banner-border: var(--color-alert-border-success);
  }

  :host([tone="warning"]) {
    --_banner-solid-bg: var(--color-warning);
    --_banner-solid-fg: var(--color-warning-fg);
    --_banner-soft-bg: var(--color-warning-soft);
    --_banner-soft-fg: var(--color-warning-soft-fg);
    --_banner-border: var(--color-alert-border-warning);
  }

  :host([tone="error"]) {
    --_banner-solid-bg: var(--color-danger);
    --_banner-solid-fg: var(--color-danger-fg);
    --_banner-soft-bg: var(--color-danger-soft);
    --_banner-soft-fg: var(--color-danger-soft-fg);
    --_banner-border: var(--color-alert-border-error);
  }

  :host([variant="flat"]) {
    --_banner-bg: var(--_banner-soft-bg);
    --_banner-fg: var(--_banner-soft-fg);
  }

  :host([is-sticky]) {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--banner-z-index, 101);
  }

  /* Slid away: the space it leaves lets clicks through to the page. */
  :host([is-retracted]) {
    pointer-events: none;
  }

  /* Folds from its full height to none on dismiss, through a 1fr to 0fr
     grid row, so it never needs to know its own height. */
  .base {
    display: grid;
    grid-template-rows: 1fr;
    background: var(--banner-background, var(--_banner-bg));
    color: var(--banner-color, var(--_banner-fg));
    transition:
      grid-template-rows var(--duration-base, 250ms) var(--ease-out, ease-out),
      opacity var(--duration-base, 250ms) var(--ease-out, ease-out),
      translate var(--duration-base, 250ms) var(--ease-out, ease-out);
  }

  :host([variant="flat"]) .base {
    box-shadow: inset 0 -1px 0 0 var(--_banner-border);
  }

  .base.is-dismissing {
    grid-template-rows: 0fr;
    opacity: 0;
  }

  :host([is-retracted]) .base {
    translate: 0 -100%;
  }

  .fold {
    min-block-size: 0;
    overflow: hidden;
  }

  /* The message stays centred; the close button sits at the inline end,
     in padding kept free for it. */
  .content {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
    box-sizing: border-box;
    min-block-size: 2.5rem;
    padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
    font-size: var(--font-size-sm, 0.875rem);
    line-height: var(--line-height-sm, 1.25rem);
    text-align: center;
  }

  :host([is-dismissable]) .content {
    padding-inline: 2.75rem;
  }

  /* The icon stays beside the message when the message wraps. */
  .lead {
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    gap: var(--spacing-2, 0.5rem);
    min-inline-size: 0;
  }

  .icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
  }

  /* Empty boxes would still take a flex gap and push the message off centre. */
  .icon[hidden],
  .action[hidden] {
    display: none;
  }

  .message {
    min-inline-size: 0;
  }

  slot:not([name])::slotted(a) {
    color: inherit;
    font-weight: var(--font-weight-semibold, 600);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
  }

  slot:not([name])::slotted(a:focus-visible) {
    border-radius: 2px;
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .action {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2, 0.5rem);
  }

  .close-button {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: var(--spacing-2, 0.5rem);
    display: inline-grid;
    place-items: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    padding: 0;
    border: 0;
    border-radius: var(--radius-full, 9999px);
    background: transparent;
    color: inherit;
    cursor: pointer;
    translate: 0 -50%;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--duration-fast, 150ms)
      var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .close-button:hover {
      background: color-mix(in oklab, currentColor 16%, transparent);
    }
  }

  /* currentColor keeps the ring visible on every tone. */
  .close-button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 1px;
  }

  .close-button svg {
    inline-size: 0.875rem;
    block-size: 0.875rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
  }

  @media (prefers-reduced-motion: reduce) {
    .base,
    .close-button {
      transition: none !important;
    }
  }

  @media (forced-colors: active) {
    .base {
      border-block-end: 1px solid CanvasText;
    }
  }
`
