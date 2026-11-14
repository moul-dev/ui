import { css } from 'lit'

export const revealStyles = css`
  :host {
    display: block;
    --_reveal-x: 0px;
    --_reveal-y: var(--_reveal-distance, 16px);
    --_reveal-ease: var(--reveal-easing, var(--ease-out, ease-out));
    --_reveal-transition:
      opacity var(--_reveal-duration, 600ms) var(--_reveal-ease),
      filter var(--_reveal-duration, 600ms) var(--_reveal-ease),
      translate var(--_reveal-duration, 600ms) var(--_reveal-ease);
  }

  :host([hidden]) {
    display: none;
  }

  :host([direction="down"]) {
    --_reveal-y: calc(-1 * var(--_reveal-distance, 16px));
  }

  :host([direction="start"]),
  :host([direction="end"]:dir(rtl)) {
    --_reveal-x: calc(-1 * var(--_reveal-distance, 16px));
    --_reveal-y: 0px;
  }

  :host([direction="end"]),
  :host([direction="start"]:dir(rtl)) {
    --_reveal-x: var(--_reveal-distance, 16px);
    --_reveal-y: 0px;
  }

  :host([direction="none"]) {
    --_reveal-y: 0px;
  }

  /* One block: the wrapper moves. */
  [part="base"] {
    transition: var(--_reveal-transition);
    transition-delay: var(--_reveal-delay, 0ms);
  }

  /* Staggered: each child element moves, one after another. */
  :host([stagger]:not([stagger="0"])) ::slotted(*) {
    transition: var(--_reveal-transition);
    transition-delay: calc(
      var(--_reveal-delay, 0ms) + var(--moul-reveal-index, 0) * var(--_reveal-stagger, 0ms)
    );
  }

  :host(:not([is-revealed]):not(:focus-within):not([stagger]))
    [part="base"],
  :host(:not([is-revealed]):not(:focus-within)[stagger="0"]) [part="base"],
  :host(:not([is-revealed]):not(:focus-within)[stagger]:not([stagger="0"]))
    ::slotted(*) {
    opacity: 0;
    filter: blur(var(--_reveal-blur, 8px));
    translate: var(--_reveal-x) var(--_reveal-y);
  }

  /* play() hides the content in one step before revealing it again. */
  :host([data-resetting]) [part="base"],
  :host([data-resetting]) ::slotted(*) {
    /* Outranks the staggered rule, which names the host's attributes too. */
    transition: none !important;
  }

  /* Focus inside shows the content at once rather than waiting for the transition. */
  :host(:focus-within) [part="base"],
  :host(:focus-within) ::slotted(*) {
    transition-duration: 0s;
    transition-delay: 0s;
  }

  @media (prefers-reduced-motion: reduce), print {
    [part="base"],
    :host ::slotted(*) {
      opacity: 1 !important;
      filter: none !important;
      translate: none !important;
      transition: none !important;
    }
  }
`
