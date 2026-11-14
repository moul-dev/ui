import { css } from 'lit'

export const progressNavStyles = css`
  :host {
    --_progress-nav-offset: var(--progress-nav-offset, 1.5rem);
    /* Which way the pill and list travel as they appear: up from the bottom edge. */
    --_progress-nav-rise: 0.5rem;

    position: fixed;
    inset-inline: 0;
    inset-block-end: var(--_progress-nav-offset);
    z-index: var(--z-dropdown, 1000);
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([placement="top"]) {
    inset-block-start: var(--_progress-nav-offset);
    inset-block-end: auto;
    --_progress-nav-rise: -0.5rem;
  }

  :host([placement="inline"]) {
    position: relative;
    inset: auto;
    z-index: auto;
    display: inline-flex;
    --_progress-nav-rise: -0.5rem;
  }

  .base {
    position: relative;
    pointer-events: auto;
    opacity: 0;
    translate: 0 var(--_progress-nav-rise);
    visibility: hidden;
    transition:
      opacity var(--duration-base, 250ms) var(--ease-out, ease-out),
      translate var(--duration-base, 250ms) var(--ease-out, ease-out),
      visibility 0s linear var(--duration-base, 250ms);
  }

  .base[data-shown] {
    opacity: 1;
    translate: 0 0;
    visibility: visible;
    transition-delay: 0s;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2, 0.5rem);
    box-sizing: border-box;
    min-block-size: 2.5rem;
    margin: 0;
    padding-block: 0.375rem;
    padding-inline: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-glass, var(--color-border));
    border-radius: 9999px;
    background: var(--color-bg-glass, var(--color-surface));
    color: var(--color-fg);
    box-shadow: var(--shadow-glass, var(--shadow-md));
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    font: inherit;
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    line-height: var(--line-height-sm, 1.25rem);
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    /* Where the browser can, the pill eases to the width of the new heading. */
    interpolate-size: allow-keywords;
    transition:
      inline-size var(--duration-base, 250ms) var(--ease-out, ease-out),
      background-color var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .pill:hover {
      background: var(--color-bg-elevated, var(--color-surface));
    }
  }

  .pill:focus-visible {
    box-shadow:
      var(--focus-ring),
      var(--shadow-glass, var(--shadow-md));
  }

  /* The ring: a circle whose stroke is 100 units long, drawn as far as the
     scroll has gone. The px keeps Chrome interpolating the offset. */
  .ring {
    flex: none;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    rotate: -90deg;
  }

  .ring circle {
    fill: none;
    stroke-width: 2.5;
  }

  .ring .track {
    stroke: var(--color-border);
  }

  .ring .fill {
    stroke: var(--progress-nav-color, var(--color-accent));
    stroke-dasharray: 100px;
    stroke-dashoffset: calc((1 - var(--scroll-progress, 0)) * 100px);
  }

  :host(:dir(rtl)) .ring {
    scale: -1 1;
    rotate: 90deg;
  }

  .current {
    display: grid;
    min-inline-size: 0;
    max-inline-size: var(--progress-nav-max-width, 16rem);
    overflow: hidden;
    text-align: start;
    --_progress-nav-from: 100%;
  }

  .current[data-direction="backward"] {
    --_progress-nav-from: -100%;
  }

  .text {
    grid-area: 1 / 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* The new heading slides in from the direction of travel; the last one
     slides out the other way. */
  .entering {
    animation: moul-progress-nav-in var(--duration-base, 250ms)
      var(--ease-out, ease-out) both;
  }

  .leaving {
    animation: moul-progress-nav-out var(--duration-base, 250ms)
      var(--ease-out, ease-out) both;
  }

  @keyframes moul-progress-nav-in {
    from {
      opacity: 0;
      translate: 0 var(--_progress-nav-from);
    }
  }

  @keyframes moul-progress-nav-out {
    to {
      opacity: 0;
      translate: 0 calc(var(--_progress-nav-from) * -1);
    }
  }

  .chevron {
    flex: none;
    inline-size: 0.875rem;
    block-size: 0.875rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
    color: var(--color-fg-subtle);
    transition: rotate var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  /* Points to where the list opens: up from a bottom pill, down otherwise. */
  :host([placement="top"]) .chevron,
  :host([placement="inline"]) .chevron {
    rotate: 180deg;
  }

  .base[data-open] .chevron {
    rotate: 180deg;
  }

  :host([placement="top"]) .base[data-open] .chevron,
  :host([placement="inline"]) .base[data-open] .chevron {
    rotate: 0deg;
  }

  .panel {
    position: absolute;
    inset-block-end: calc(100% + 0.5rem);
    left: 50%;
    box-sizing: border-box;
    inline-size: min(20rem, calc(100vw - 2rem));
    max-block-size: min(60vh, 24rem);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.375rem;
    border: 1px solid var(--color-border-subtle, var(--color-border));
    border-radius: var(--radius-xl, 1rem);
    background: var(--color-bg-elevated, var(--color-surface));
    color: var(--color-fg);
    box-shadow: var(--shadow-overlay, var(--shadow-lg));
    opacity: 0;
    translate: -50% var(--_progress-nav-rise);
    visibility: hidden;
    transition:
      opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
      translate var(--duration-fast, 150ms) var(--ease-out, ease-out),
      visibility 0s linear var(--duration-fast, 150ms);
  }

  :host([placement="top"]) .panel,
  :host([placement="inline"]) .panel {
    inset-block-end: auto;
    inset-block-start: calc(100% + 0.5rem);
  }

  :host([placement="inline"]) .panel {
    left: 0;
    translate: 0 var(--_progress-nav-rise);
  }

  .base[data-open] .panel {
    opacity: 1;
    translate: -50% 0;
    visibility: visible;
    transition-delay: 0s;
  }

  :host([placement="inline"]) .base[data-open] .panel {
    translate: 0 0;
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .nested {
    padding-inline-start: 0.75rem;
  }

  .link {
    display: block;
    padding: 0.375rem 0.625rem;
    border-radius: var(--radius-md, 0.5rem);
    color: var(--color-fg-subtle);
    font-size: var(--font-size-sm, 0.875rem);
    line-height: var(--line-height-sm, 1.25rem);
    text-decoration: none;
    outline: none;
    transition:
      background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
      color var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .link:hover {
      background: var(--color-surface-hover, var(--color-surface-secondary));
      color: var(--color-fg);
    }
  }

  .link:focus-visible {
    box-shadow: var(--focus-ring);
  }

  .link[aria-current] {
    background: var(--color-surface-secondary);
    color: var(--color-fg);
    font-weight: var(--font-weight-medium, 500);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Everything appears and swaps in place. */
  @media (prefers-reduced-motion: reduce) {
    .base,
    .panel,
    .pill,
    .chevron,
    .link {
      transition: none;
    }

    .base,
    .base[data-shown] {
      translate: none;
    }

    .panel,
    .base[data-open] .panel {
      translate: -50% 0;
    }

    :host([placement="inline"]) .panel,
    :host([placement="inline"]) .base[data-open] .panel {
      translate: 0 0;
    }

    .entering {
      animation: none;
    }

    .leaving {
      display: none;
    }
  }

  @media (forced-colors: active) {
    .pill,
    .panel {
      border-color: CanvasText;
    }

    .ring .fill {
      stroke: Highlight;
    }

    .ring .track {
      stroke: GrayText;
    }

    .link[aria-current] {
      outline: 1px solid Highlight;
    }
  }
`
