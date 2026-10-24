import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const tagStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      position: relative;
      gap: var(--spacing-1, 0.25rem);
      box-sizing: border-box;
      border-radius: var(--radius-xl, 0.75rem);
      font-family: var(--font-family-base, inherit);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition:
        color 100ms var(--ease-smooth, ease),
        opacity 100ms var(--ease-smooth, ease),
        background-color 100ms var(--ease-smooth, ease),
        box-shadow 100ms var(--ease-out, ease-out),
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    /* scale, not transform: removal animates transform on the host */
    :host(:not([is-disabled]):active) {
      scale: var(--press-scale, 0.97);
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      height: 100%;
    }

    ::slotted(svg) {
      width: 0.75rem;
      height: 0.75rem;
      flex-shrink: 0;
      pointer-events: none;
    }

    /* Sizes */
    :host([size="sm"]) {
      height: 1.25rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]),
    :host(:not([size])) {
      height: 1.5rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="lg"]) {
      height: 2rem;
      padding: 0 0.625rem;
      font-size: var(--font-size-sm, 0.875rem);
      border-radius: var(--radius-2xl, 1rem);
    }

    /* The default tag (flat + primary) is a neutral chip, as in HeroUI */
    :host([variant="flat"][tone="primary"]) {
      background-color: var(--color-default);
      color: var(--color-default-fg);
    }

    @media (hover: hover) {
      :host([variant="flat"][tone="primary"]:not([is-selected]):hover) {
        background-color: var(--color-default-hover);
      }
    }

    /* Selected: a neutral tag turns accent-soft; a toned tag fills solid */
    :host([is-selected]) {
      background-color: var(--_tone-solid-bg);
      color: var(--_tone-solid-fg);
      border-color: transparent;
    }

    :host([is-selected][variant="flat"][tone="primary"]) {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    @media (hover: hover) {
      :host([is-selected][variant="flat"][tone="primary"]:hover) {
        background-color: var(--color-accent-soft-hover);
      }
    }

    :host(:focus-visible) {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* A 12px glyph with a 24px invisible hit area */
    .remove-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 0.75rem;
      height: 0.75rem;
      padding: 0;
      border: none;
      background: transparent;
      color: inherit;
      border-radius: var(--radius-full, 9999px);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 100ms var(--ease-smooth, ease);
    }

    .remove-button::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1.5rem;
      height: 1.5rem;
      translate: -50% -50%;
    }

    @media (hover: hover) {
      .remove-button:hover {
        opacity: 1;
      }
    }

    .remove-button:focus-visible {
      opacity: 1;
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .remove-button svg {
      width: 100%;
      height: 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .remove-button {
        transition: none;
      }

      :host(:not([is-disabled]):active) {
        scale: none;
      }
    }
  `,
]

export const tagGroupStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      box-sizing: border-box;
    }

    [part~="label"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
    }

    [part~="container"] {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      align-items: center;
    }
  `,
]
