import { css } from 'lit'

/*
 * The follower is one fixed, zero-sized layer at the viewport's top-left
 * corner, shown in the top layer as a manual popover so that transformed or
 * clipped ancestors never move or cut it. It stays `display: block` even
 * while it is not open (author styles beat the popover's UA `display: none`),
 * so it still works, as a plain fixed layer, where the popover API is
 * missing. Its two parts are placed by an inline `translate` written once
 * per frame: `.lead` sits on the pointer, `.trail` follows on a spring.
 * State lives on the follower: data-visible, data-interactive (over a link or
 * button), data-pressed and data-has-label.
 */

export const cursorStyles = css`
  :host {
    --_cursor-color: var(--cursor-color, var(--color-fg));
    --_cursor-outline: var(--cursor-outline, var(--color-bg));
    --_cursor-label-background: var(
      --cursor-label-background,
      var(--color-primary-solid)
    );
    --_cursor-label-color: var(--cursor-label-color, var(--color-fg-on-primary));

    display: block;
  }

  :host([scope='page']) {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }

  .follower {
    --_cursor-scale: 1;

    display: block;
    position: fixed;
    inset: 0 auto auto 0;
    z-index: 2147483647;
    width: 0;
    height: 0;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: visible;
    background: none;
    color: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-fast, 150ms) ease;
  }

  .follower[data-visible] {
    opacity: 1;
  }

  .follower[data-interactive] {
    --_cursor-scale: 1.6;
  }

  .follower[data-pressed] {
    --_cursor-scale: 0.8;
  }

  .follower[data-interactive][data-pressed] {
    --_cursor-scale: 1.35;
  }

  .lead,
  .trail {
    position: absolute;
    top: 0;
    left: 0;
  }

  .follower[data-visible] .lead,
  .follower[data-visible] .trail {
    will-change: translate;
  }

  /* The dot. */
  .dot {
    position: absolute;
    width: 0.5rem;
    height: 0.5rem;
    margin: -0.25rem;
    border-radius: 50%;
    background: var(--_cursor-color);
    box-shadow: 0 0 0 1px var(--_cursor-outline);
    transition: scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .follower[data-interactive] .dot,
  .follower[data-has-label] .dot {
    scale: 0;
  }

  .follower[data-pressed] .dot {
    scale: 0.75;
  }

  /* The arrow, its tip on the pointer. */
  .arrow {
    position: absolute;
    left: -3.5px;
    top: -2.5px;
    width: 24px;
    height: 24px;
    overflow: visible;
    fill: var(--_cursor-color);
    stroke: var(--_cursor-outline);
    stroke-width: 1.5;
    stroke-linejoin: round;
    transform-origin: 3.5px 2.5px;
    transition: scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .follower[data-interactive] .arrow {
    scale: 1.1;
  }

  .follower[data-pressed] .arrow {
    scale: 0.9;
  }

  /* The trailing shape: a ring in the dot variant, a pill beside the arrow otherwise. */
  .shape {
    position: absolute;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    white-space: nowrap;
    font-family: var(--font-family-base, inherit);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    line-height: 1.2;
    transition:
      transform var(--duration-base, 250ms) var(--ease-out, ease-out),
      background-color var(--duration-fast, 150ms) ease,
      border-color var(--duration-fast, 150ms) ease,
      opacity var(--duration-fast, 150ms) ease;
  }

  .text {
    display: none;
  }

  .follower[data-has-label] .text {
    display: inline;
  }

  :host(:not([variant])) .shape,
  :host([variant='dot']) .shape {
    width: var(--cursor-size, 2.25rem);
    height: var(--cursor-size, 2.25rem);
    border: 1.5px solid var(--_cursor-color);
    border-radius: 9999px;
    transform: translate(-50%, -50%) scale(var(--_cursor-scale));
  }

  :host(:not([variant])) .follower[data-interactive] .shape,
  :host([variant='dot']) .follower[data-interactive] .shape {
    background: color-mix(in oklab, var(--_cursor-color) 10%, transparent);
  }

  /* With a label, the ring opens into a pill round the text. */
  :host(:not([variant])) .follower[data-has-label] .shape,
  :host([variant='dot']) .follower[data-has-label] .shape {
    width: auto;
    height: auto;
    min-width: var(--cursor-size, 2.25rem);
    padding: 0.5rem 0.875rem;
    border-color: transparent;
    background: var(--_cursor-label-background);
    color: var(--_cursor-label-color);
    transform: translate(-50%, -50%) scale(1);
  }

  :host([variant='label']) .shape,
  :host([variant='arrow']) .shape {
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    background: var(--_cursor-label-background);
    color: var(--_cursor-label-color);
    box-shadow: var(--shadow-md);
    transform-origin: 0 0;
    transform: translate(0.875rem, 1.25rem) scale(var(--_cursor-scale));
  }

  :host([variant='label']) .follower[data-interactive] .shape,
  :host([variant='arrow']) .follower[data-interactive] .shape {
    transform: translate(0.875rem, 1.25rem) scale(1.05);
  }

  :host([variant='label']) .follower:not([data-has-label]) .shape,
  :host([variant='arrow']) .follower:not([data-has-label]) .shape {
    opacity: 0;
  }

  /* The setting can change while the follower shows; the script hides it at once as well. */
  @media (prefers-reduced-motion: reduce) {
    .follower {
      display: none;
    }
  }

  /* The system cursor stays, so no follower is drawn. */
  @media (forced-colors: active) {
    .follower {
      display: none;
    }
  }
`
