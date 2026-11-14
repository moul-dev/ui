import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const buttonStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      font-family: var(--font-family-base, inherit);
      border-radius: var(--radius-3xl, 1.5rem);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      --_press-scale: var(--press-scale, 0.97);
      --_tint: var(--color-accent);
      -webkit-user-select: none;
      cursor: pointer;
    }

    [part~="button"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border-radius: inherit;
      gap: var(--_gap);
      border: 1px solid transparent;
      background-color: var(--_bg);
      color: var(--_fg);
      font-family: inherit;
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      text-decoration: none;
      transform-origin: center;
      transition:
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        color 100ms var(--ease-out, ease-out),
        border-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out),
        opacity var(--duration-fast, 150ms) ease;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
    }

    /* Sizes */
    :host([size="sm"]) {
      --_press-scale: 0.98;
    }

    :host([size="lg"]) {
      --_press-scale: 0.96;
    }

    :host([size="sm"]) [part~="button"] {
      height: 2rem;
      padding: 0 var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      --_gap: var(--spacing-1, 0.25rem);
    }

    :host([size="md"]) [part~="button"],
    :host(:not([size])) [part~="button"] {
      height: 2.25rem;
      padding: 0 var(--spacing-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      --_gap: var(--spacing-2, 0.5rem);
    }

    :host([size="lg"]) [part~="button"] {
      height: 2.5rem;
      padding: 0 var(--spacing-4, 1rem);
      font-size: var(--font-size-md, 1rem);
      --_gap: var(--spacing-2, 0.5rem);
    }

    /* Icon-only size variants */
    :host([is-icon][size="sm"]) [part~="button"] {
      width: 2rem;
      padding: 0;
    }

    :host([is-icon][size="md"]) [part~="button"],
    :host([is-icon]:not([size])) [part~="button"] {
      width: 2.25rem;
      padding: 0;
    }

    :host([is-icon][size="lg"]) [part~="button"] {
      width: 2.5rem;
      padding: 0;
    }

    /* Variants: each sets the fill trio; the shared rules below apply it. */
    :host([variant="primary"]),
    :host(:not([variant])) {
      --_bg: var(--color-accent);
      --_bg-hover: var(--color-accent-hover);
      --_fg: var(--color-accent-fg);
    }

    :host([variant="secondary"]) {
      --_bg: var(--color-default);
      --_bg-hover: var(--color-default-hover);
      --_fg: var(--color-accent-soft-fg);
    }

    :host([variant="tertiary"]) {
      --_bg: var(--color-default);
      --_bg-hover: var(--color-default-hover);
      --_fg: var(--color-default-fg);
    }

    :host([variant="ghost"]),
    :host([variant="outline"]) {
      --_bg: transparent;
      --_bg-hover: var(--color-default);
      --_fg: var(--color-default-fg);
    }

    :host([variant="outline"]) {
      --_bg-hover: color-mix(in srgb, var(--color-default) 60%, transparent);
    }

    :host([variant="outline"]) [part~="button"] {
      border-color: var(--color-border);
    }

    :host([variant="danger"]) {
      --_bg: var(--color-danger);
      --_bg-hover: var(--color-danger-hover);
      --_fg: var(--color-danger-fg);
    }

    :host([variant="danger-soft"]) {
      --_bg: var(--color-danger-soft);
      --_bg-hover: var(--color-danger-soft-hover);
      --_fg: var(--color-danger-soft-fg);
    }

    /* The glow and pulse colour */
    :host([variant^="danger"]) {
      --_tint: var(--color-danger);
    }

    /* Result tints, on the inner button so they override the host's fill trio */
    .success {
      --_tone: var(--color-success);
      --_tone-hover: var(--color-success-hover);
      --_tone-fg: var(--color-success-fg);
      --_tone-soft: var(--color-success-soft);
      --_tone-soft-hover: var(--color-success-soft-hover);
      --_tone-soft-fg: var(--color-success-soft-fg);
    }

    .error {
      --_tone: var(--color-danger);
      --_tone-hover: var(--color-danger-hover);
      --_tone-fg: var(--color-danger-fg);
      --_tone-soft: var(--color-danger-soft);
      --_tone-soft-hover: var(--color-danger-soft-hover);
      --_tone-soft-fg: var(--color-danger-soft-fg);
    }

    :host(:is(:not([variant]), [variant="primary"], [variant="danger"]))
      :is(.success, .error) {
      --_bg: var(--_tone);
      --_bg-hover: var(--_tone-hover);
      --_fg: var(--_tone-fg);
    }

    :host(:is([variant="secondary"], [variant="danger-soft"]))
      :is(.success, .error) {
      --_bg: var(--_tone-soft);
      --_bg-hover: var(--_tone-soft-hover);
      --_fg: var(--_tone-soft-fg);
    }

    :host(:is([variant="tertiary"], [variant="outline"], [variant="ghost"]))
      :is(.success, .error) {
      --_fg: var(--_tone-soft-fg);
      border-color: color-mix(in oklab, var(--_tone) 50%, transparent);
    }

    @media (hover: hover) {
      :host(:not([is-disabled]):not([is-pending]):not([state="pending"]))
        [part~="button"]:hover {
        background-color: var(--_bg-hover);
      }

      .idle:hover .swap > slot {
        translate: 0 -100%;
      }

      .idle:hover .hover {
        translate: none;
      }
    }

    :host(:not([is-disabled]):not([is-pending]):not([state="pending"]))
      [part~="button"]:active {
      background-color: var(--_bg-hover);
      transform: scale(var(--_press-scale));
    }

    [part~="button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Disabled State */
    :host([is-disabled]) {
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) [part~="button"] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Pending State */
    :host([is-pending]),
    :host([state="pending"]) {
      cursor: wait;
      pointer-events: none;
    }

    .pending {
      cursor: wait;
      pointer-events: none;
    }

    /* State icon: in idle it has no width and its margin cancels the gap */
    .icon {
      display: inline-flex;
      justify-content: center;
      flex-shrink: 0;
      width: 0;
      margin-inline-end: calc(-1 * var(--_gap));
      opacity: 0;
      scale: 0.5;
      transition-property: width, margin, opacity, scale;
      transition-duration: var(--duration-base, 250ms);
      transition-timing-function: var(--ease-out, ease-out);
    }

    :not(.idle) > .icon {
      width: 1rem;
      margin-inline-end: 0;
      opacity: 1;
      scale: 1;
    }

    /* Icon-only: the state icon replaces the content */
    :host([is-icon]) .icon {
      position: absolute;
      margin: 0;
    }

    :host([is-icon]) :not(.idle) > .content {
      opacity: 0;
    }

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
      transition: opacity var(--duration-fast, 150ms) ease;
    }

    /* Hover swap: label and hover content share one cell, full height */
    .hover {
      display: none;
      translate: 0 100%;
    }

    .swap {
      display: inline-grid;
      align-self: stretch;
      align-items: stretch;
      overflow: clip;
    }

    .swap > * {
      grid-area: 1 / 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: inherit;
      transition: translate var(--duration-base, 250ms) var(--ease-out, ease-out);
    }

    .idle:focus-visible .swap > slot {
      translate: 0 -100%;
    }

    .idle:focus-visible .hover {
      translate: none;
    }

    /* Effects: ring on ::before, rainbow glow under it on :host::before, pulse on ::after */
    [part~="button"]::before,
    [part~="button"]::after,
    :host::before {
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      pointer-events: none;
    }

    :host([effect="shimmer"]) [part~="button"]::before {
      --_stops: transparent 70%, var(--button-effect-color, var(--_fg)) 90%,
        transparent 0;
    }

    :host([effect="rainbow"]) {
      isolation: isolate;
      --_stops: var(--color-chart-1), var(--color-chart-2), var(--color-chart-3),
        var(--color-chart-4), var(--color-chart-5), var(--color-chart-1);
    }

    :host(:is([effect="shimmer"], [effect="rainbow"])) [part~="button"]::before,
    :host([effect="rainbow"])::before {
      content: "";
      background: conic-gradient(
        from var(--moul-button-angle, 0deg),
        var(--_stops)
      );
      animation: moul-button-turn var(--button-effect-duration, 3s) linear
        infinite;
    }

    :host(:is([effect="shimmer"], [effect="rainbow"])) [part~="button"]::before {
      padding: 2px;
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    :host([effect="rainbow"])::before {
      inset: 40% 8% -16%;
      z-index: -1;
      filter: blur(0.75rem);
      opacity: 0.7;
    }

    :host([effect="neon"]) [part~="button"]::before {
      --_neon: var(--button-effect-color, var(--_tint));
      content: "";
      border: 1px solid var(--_neon);
      box-shadow:
        0 0 0.75rem var(--_neon),
        inset 0 0 0.5rem color-mix(in oklab, var(--_neon) 50%, transparent);
      animation: moul-button-breathe var(--button-effect-duration, 3s)
        ease-in-out infinite;
    }

    :host([is-disabled]) [part~="button"]::before,
    :host([is-disabled])::before {
      animation: none;
    }

    :host([is-pulsing]:not([is-disabled])) .idle::after {
      content: "";
      animation: moul-button-pulse var(--button-pulse-duration, 1.5s) ease-out
        infinite;
    }

    @keyframes moul-button-turn {
      to {
        --moul-button-angle: 1turn;
      }
    }

    @keyframes moul-button-breathe {
      50% {
        opacity: 0.4;
      }
    }

    /* color-mix() lets Chrome interpolate tokens with calc() channels */
    @keyframes moul-button-pulse {
      from {
        box-shadow: 0 0 0 0
          color-mix(in oklab, var(--button-pulse-color, var(--_tint)) 70%, transparent);
      }
      to {
        box-shadow: 0 0 0 0.6em transparent;
      }
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    ::slotted(svg) {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="button"],
      .icon,
      .content,
      .swap > * {
        transition: none;
      }

      :host(:not([is-disabled]):not([is-pending]):not([state="pending"]))
        [part~="button"]:active {
        transform: none;
      }

      /* A still ring, a steady neon glow, and no pulse */
      [part~="button"]::before,
      [part~="button"]::after,
      :host::before {
        animation: none !important;
      }
    }
  `,
]
