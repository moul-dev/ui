import { css } from 'lit'

export const scrollProgressStyles = css`
  :host {
    --_tone: var(--color-accent);

    display: block;
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: var(--z-dropdown, 1000);
    block-size: var(--scroll-progress-height, 3px);
    pointer-events: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([placement="bottom"]) {
    inset-block-start: auto;
    inset-block-end: 0;
  }

  /* In the normal flow, at the width of its parent; set position: sticky on it to pin it. */
  :host([placement="inline"]) {
    position: relative;
    inset: auto;
    z-index: auto;
  }

  :host([tone="accent"]) {
    --_tone: var(--color-primary-500);
  }

  :host([tone="success"]) {
    --_tone: var(--color-success);
  }

  :host([tone="warning"]) {
    --_tone: var(--color-warning);
  }

  :host([tone="error"]) {
    --_tone: var(--color-danger);
  }

  [part="base"] {
    block-size: 100%;
    overflow: hidden;
    background: var(--scroll-progress-track, transparent);
  }

  /* No easing of its own: the fill is exactly as far along as the scroll. */
  [part="bar"] {
    block-size: 100%;
    background: var(--scroll-progress-color, var(--_tone));
    transform: scaleX(var(--scroll-progress, 0));
    transform-origin: left;
    will-change: transform;
  }

  :host(:dir(rtl)) [part="bar"] {
    transform-origin: right;
  }
`
