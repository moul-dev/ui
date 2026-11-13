import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const slideToConfirmStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      --_handle: var(--slide-to-confirm-handle-size, 2.75rem);
      --_inset: 0.25rem;
      display: inline-block;
      width: 18rem;
      max-width: 100%;
      vertical-align: middle;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      -webkit-tap-highlight-color: transparent;
    }

    :host([hidden]) {
      display: none;
    }

    .track {
      position: relative;
      height: calc(var(--_handle) + 2 * var(--_inset));
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-surface-secondary);
      box-shadow: inset 0 0 0 1px var(--color-border-subtle, transparent);
      user-select: none;
      -webkit-user-select: none;
    }

    /* The tinted trail grows behind the handle as it travels. */
    .fill {
      position: absolute;
      inset-block: 0;
      left: 0;
      width: clamp(
        calc(var(--_handle) + 2 * var(--_inset)),
        calc(var(--_handle) + 2 * var(--_inset) + var(--_drag-x, 0px)),
        100%
      );
      border-radius: inherit;
      background-color: var(--_tone-soft-bg);
    }

    .label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline: calc(var(--_handle) + 2 * var(--_inset));
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--color-muted);
      opacity: calc(1 - var(--_progress, 0) * 1.6);
      transition: opacity var(--duration-base, 200ms) var(--ease-out, ease-out);
    }

    .track[data-dragging] .label {
      transition: none;
    }

    /* A soft light sweeps across the instruction, pointing the way. */
    .label-text {
      overflow: hidden;
      text-overflow: ellipsis;
      background-image: linear-gradient(
        100deg,
        var(--color-muted) 40%,
        var(--color-fg) 50%,
        var(--color-muted) 60%
      );
      background-size: 250% 100%;
      background-position: 100% 0;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      animation: moul-slide-shimmer 2.4s linear infinite;
    }

    :host([is-confirmed]) .label {
      opacity: 1;
      color: var(--_tone-soft-fg);
    }

    :host([is-confirmed]) .label-text,
    :host([is-disabled]) .label-text {
      animation: none;
      background-image: none;
      color: inherit;
    }

    .handle {
      position: absolute;
      top: var(--_inset);
      left: var(--_inset);
      z-index: 1;
      display: grid;
      place-items: center;
      width: var(--_handle);
      height: var(--_handle);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--_tone-solid-bg);
      color: var(--_tone-solid-fg);
      box-shadow: var(--shadow-sm);
      translate: var(--_drag-x, 0px) 0;
      cursor: grab;
      touch-action: pan-y;
      outline: none;
      transition:
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .handle svg {
      width: 45%;
      height: 45%;
    }

    .handle:focus-visible {
      box-shadow: var(--focus-ring), var(--shadow-sm);
    }

    .track[data-dragging] .handle {
      cursor: grabbing;
      scale: 1.04;
    }

    :host([is-confirmed]) .handle,
    :host([is-pending]) .handle {
      cursor: default;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
    }

    :host([is-disabled]) .handle {
      cursor: not-allowed;
    }

    @keyframes moul-slide-shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: 0% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .label,
      .handle {
        transition: none;
      }

      .label-text {
        animation: none;
        background-image: none;
        color: inherit;
      }
    }
  `,
]
