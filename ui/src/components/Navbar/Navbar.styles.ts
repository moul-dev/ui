import { css } from 'lit'

export const navbarStyles = css`
  /* The host is the sticky box. It never takes the pointer itself: the
     strip a shrunk bar leaves, the gap round a floating pill and the room a
     slid-away banner leaves all let clicks through to the page. */
  :host {
    --_navbar-h: var(--navbar-height, 4rem);
    --_navbar-inset: 0px;
    --_navbar-duration: var(--duration-base, 250ms);

    display: block;
    position: sticky;
    inset-block-start: 0;
    z-index: var(--navbar-z-index, 100);
    pointer-events: none;
    color: var(--color-fg);
    font-family: var(--font-family-base, inherit);
  }

  :host([hidden]) {
    display: none;
  }

  :host([variant="floating"]) {
    --_navbar-inset: var(--navbar-inset, 0.75rem);
  }

  :host([effect~="shrink"][is-scrolled]) {
    --_navbar-h: var(--navbar-shrunk-height, 3.25rem);
  }

  /* Everything that slides: hide-on-scroll moves it all out of view, a
     hiding banner moves it up by the banner's height. */
  .base {
    transition: translate var(--_navbar-duration) var(--ease-out, ease-out);
  }

  .base.is-banner-away {
    translate: 0 calc(-1 * var(--_navbar-banner-h, 0px));
  }

  /* Past its own height, plus room for a floating pill's shadow. */
  :host([is-retracted]) .base {
    translate: 0 calc(-100% - 1.5rem);
  }

  .banner {
    pointer-events: auto;
  }

  /* Reserves the full height, so a shrinking bar never moves the page. */
  .frame {
    box-sizing: content-box;
    block-size: var(--navbar-height, 4rem);
    padding-block-start: var(--_navbar-inset);
    padding-inline: var(--_navbar-inset);
  }

  .bar {
    position: relative;
    z-index: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--spacing-4, 1rem);
    block-size: var(--_navbar-h);
    padding-inline: max(
      var(--spacing-4, 1rem),
      (100% - var(--navbar-max-width, 72rem)) / 2
    );
    pointer-events: auto;
    transition:
      block-size var(--_navbar-duration) var(--ease-out, ease-out),
      max-inline-size var(--_navbar-duration) var(--ease-out, ease-out);
  }

  /* The bar's surface is its own layer, so a backdrop-filter here never
     becomes the backdrop root of a navigation menu panel inside the bar. */
  .bar::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    border-block-end: 1px solid transparent;
    background: var(--navbar-background, var(--color-background));
    transition:
      background-color var(--_navbar-duration) var(--ease-out, ease-out),
      border-color var(--_navbar-duration) var(--ease-out, ease-out),
      box-shadow var(--_navbar-duration) var(--ease-out, ease-out),
      backdrop-filter var(--_navbar-duration) var(--ease-out, ease-out);
  }

  :host([is-scrolled]) .bar::before,
  :host([is-menu-open]) .bar::before {
    border-block-end-color: var(--color-border-subtle);
  }

  /* Floating: a pill inset from the viewport edges. */
  :host([variant="floating"]) .bar {
    max-inline-size: var(--navbar-max-width, 72rem);
    margin-inline: auto;
    padding-inline: var(--spacing-5, 1.25rem) var(--spacing-3, 0.75rem);
    border-radius: var(--radius-full, 9999px);
  }

  :host([variant="floating"]) .bar::before {
    border: 1px solid var(--color-border-subtle);
    box-shadow: var(--shadow-md);
  }

  :host([variant="floating"][effect~="shrink"][is-scrolled]) .bar {
    max-inline-size: min(
      var(--navbar-max-width, 72rem),
      var(--navbar-shrunk-width, 48rem)
    );
  }

  /* Glass: clear at the top of the page, a blurred surface once scrolled. */
  :host([effect~="glass"]) .bar::before {
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }

  :host([effect~="glass"][is-scrolled]) .bar::before,
  :host([effect~="glass"][is-menu-open]) .bar::before {
    border-color: var(--color-border-glass);
    background: color-mix(
      in oklab,
      var(--navbar-background, var(--color-surface)) 72%,
      transparent
    );
    -webkit-backdrop-filter: blur(16px) saturate(1.6);
    backdrop-filter: blur(16px) saturate(1.6);
  }

  :host([variant="floating"][effect~="glass"][is-scrolled]) .bar::before,
  :host([variant="floating"][effect~="glass"][is-menu-open]) .bar::before {
    box-shadow: var(--shadow-glass);
  }

  .brand {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    font-size: var(--font-size-lg, 1.125rem);
    font-weight: var(--font-weight-bold, 700);
  }

  slot[name="brand"]::slotted(a) {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2, 0.5rem);
    color: inherit;
    text-decoration: none;
  }

  .panel {
    display: flex;
    flex: 1;
    justify-content: center;
    min-inline-size: 0;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-1, 0.25rem);
    min-inline-size: 0;
  }

  /* Plain links look like navigation; a page's own link styles still win. */
  .nav slot::slotted(a) {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    border-radius: var(--radius-full, 9999px);
    color: var(--color-fg-subtle);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    text-decoration: none;
    white-space: nowrap;
    transition:
      color var(--duration-fast, 150ms) var(--ease-out, ease-out),
      background-color var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .nav slot::slotted(a:hover),
  .nav slot::slotted(a[aria-current="page"]) {
    color: var(--color-fg);
  }

  .nav slot::slotted(a:hover) {
    background: color-mix(in oklab, var(--color-fg) 6%, transparent);
  }

  .nav slot::slotted(a:focus-visible) {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--spacing-2, 0.5rem);
  }

  :host([is-collapsed]) .bar {
    gap: var(--spacing-2, 0.5rem);
  }

  :host([is-collapsed]) .brand {
    min-inline-size: 0;
  }

  :host([is-collapsed]) .actions {
    margin-inline-start: auto;
  }

  .menu-button {
    display: inline-grid;
    flex-shrink: 0;
    place-items: center;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    margin-inline-end: calc(-1 * var(--spacing-1, 0.25rem));
    padding: 0;
    border: 0;
    border-radius: var(--radius-full, 9999px);
    background: transparent;
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--duration-fast, 150ms)
      var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .menu-button:hover {
      background: color-mix(in oklab, var(--color-fg) 7%, transparent);
    }
  }

  .menu-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .menu-icon {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    overflow: visible;
  }

  /* Two lines meet in the middle and cross: menu becomes close. */
  .menu-line {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    transition:
      translate var(--_navbar-duration) var(--ease-out, ease-out),
      rotate var(--_navbar-duration) var(--ease-out, ease-out);
  }

  .menu-line-top {
    transform-origin: 12px 8px;
  }

  .menu-line-bottom {
    transform-origin: 12px 16px;
  }

  :host([is-menu-open]) .menu-line-top {
    translate: 0 4px;
    rotate: 45deg;
  }

  :host([is-menu-open]) .menu-line-bottom {
    translate: 0 -4px;
    rotate: -45deg;
  }

  /* Collapsed: the navigation drops into a panel under the bar. Hidden
     with visibility, so it leaves the focus order and the accessibility
     tree, and the visibility change waits for the fade to finish. */
  :host([is-collapsed]) .panel {
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    display: block;
    box-sizing: border-box;
    max-block-size: calc(100dvh - var(--_navbar-h) - var(--_navbar-inset) - 1rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: var(--spacing-2, 0.5rem)
      max(var(--spacing-3, 0.75rem), (100% - var(--navbar-max-width, 72rem)) / 2);
    border-block-end: 1px solid var(--color-border-subtle);
    background: var(--color-surface);
    box-shadow: var(--shadow-lg);
    visibility: hidden;
    opacity: 0;
    translate: 0 -0.5rem;
    transition:
      opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
      translate var(--duration-base, 250ms) var(--ease-out, ease-out),
      visibility var(--duration-fast, 150ms);
  }

  :host([is-collapsed][is-menu-open]) .panel {
    visibility: visible;
    opacity: 1;
    translate: none;
  }

  :host([variant="floating"][is-collapsed]) .panel {
    inset-block-start: calc(100% + var(--spacing-2, 0.5rem));
    padding: var(--spacing-2, 0.5rem);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-2xl, 1rem);
  }

  :host([is-collapsed]) .nav {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  :host([is-collapsed]) .nav slot::slotted(a) {
    display: flex;
    padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
    border-radius: var(--radius-lg, 0.5rem);
    font-size: var(--font-size-md, 1rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .base,
    .bar,
    .bar::before,
    :host([is-collapsed]) .panel,
    .menu-button,
    .menu-line,
    .nav slot::slotted(a) {
      transition: none !important;
    }
  }

  @media (forced-colors: active) {
    .bar::before,
    :host([is-collapsed]) .panel {
      border: 1px solid CanvasText;
    }
  }
`
