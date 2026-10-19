import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const checkboxStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    /* Recessed well when off, lit brand-color gem when on */
    [part~='indicator'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: calc(0.3125rem * var(--brand-radius-factor, 1));
      border: none;
      background-color: light-dark(oklch(1 0 0), oklch(1 0 0 / 0.08));
      box-shadow:
        inset 0 0 0 1px var(--color-fill-track-strong),
        inset 0 1px 1px light-dark(oklch(0 0 0 / 0.06), oklch(0 0 0 / 0.3));
      color: var(--color-fg-on-primary, #ffffff);
      transition:
        background-color var(--duration-fast, 140ms) ease,
        box-shadow var(--duration-fast, 140ms) ease;
      flex-shrink: 0;
    }

    [part~='base']:hover:not([data-disabled]) [part~='indicator'] {
      box-shadow:
        inset 0 0 0 1px light-dark(oklch(0.5 0 0 / 0.36), oklch(1 0 0 / 0.3)),
        inset 0 1px 1px light-dark(oklch(0 0 0 / 0.06), oklch(0 0 0 / 0.3));
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~='indicator'] {
      box-shadow:
        inset 0 0 0 1px var(--color-fill-track-strong),
        var(--focus-ring);
    }

    :host([is-checked]) [part~='indicator'],
    :host([is-indeterminate]) [part~='indicator'] {
      background: linear-gradient(
        to bottom,
        var(--color-primary-400, #60a5fa),
        var(--color-primary-500, #3b82f6)
      );
      box-shadow:
        inset 0 1px 0 oklch(1 0 0 / 0.28),
        inset 0 0 0 1px oklch(0 0 0 / 0.08),
        0 1px 2px color-mix(in oklch, var(--color-primary-500) 40%, transparent);
    }

    :host([is-checked]:focus-visible) [part~='indicator'],
    :host([is-indeterminate]:focus-visible) [part~='indicator'] {
      box-shadow:
        inset 0 1px 0 oklch(1 0 0 / 0.28),
        var(--focus-ring);
    }

    :host([is-invalid][data-touched]) [part~='indicator'] {
      box-shadow: inset 0 0 0 1px var(--color-error-500, #ef4444);
    }

    [part~='icon'] {
      width: 0.8125rem;
      height: 0.8125rem;
      stroke: currentColor;
      stroke-width: 3;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* The check mark draws itself in */
    [part~='icon'] path {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: moul-check-draw var(--duration-base, 240ms) var(--ease-out, ease-out) forwards;
    }

    @keyframes moul-check-draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    [part~='label'] {
      display: inline-flex;
      align-items: center;
      color: inherit;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='indicator'] {
        transition: none;
      }

      [part~='icon'] path {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  `,
]

export const checkboxGroupStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~='label'] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    [part~='description'] {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    [part~='group'] {
      display: flex;
      gap: var(--spacing-3, 0.75rem);
    }

    :host([orientation='vertical']) [part~='group'] {
      flex-direction: column;
    }

    :host([orientation='horizontal']) [part~='group'] {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
]
