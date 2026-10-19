import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const radioStyles = [
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

    [part~='indicator'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: var(--radius-full, 9999px);
      border: none;
      background-color: light-dark(oklch(1 0 0), oklch(1 0 0 / 0.08));
      box-shadow:
        inset 0 0 0 1px var(--color-fill-track-strong),
        inset 0 1px 1px light-dark(oklch(0 0 0 / 0.06), oklch(0 0 0 / 0.3));
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

    :host([is-checked]) [part~='indicator'] {
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

    :host([is-checked]:focus-visible) [part~='indicator'] {
      box-shadow:
        inset 0 1px 0 oklch(1 0 0 / 0.28),
        var(--focus-ring);
    }

    /* White pip springs in (slight overshoot), collapses quickly when deselected */
    [part~='dot'] {
      width: 0.4375rem;
      height: 0.4375rem;
      border-radius: var(--radius-full, 9999px);
      background-color: oklch(1 0 0);
      box-shadow: 0 1px 1px oklch(0 0 0 / 0.2);
      transform: scale(0);
      transition: transform var(--duration-fast, 140ms) ease-in;
    }

    :host([is-checked]) [part~='dot'] {
      transform: scale(1);
      transition: transform var(--duration-slow, 420ms) var(--ease-spring, ease-out);
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
      [part~='indicator'],
      [part~='dot'] {
        transition: none;
      }
    }
  `,
]

export const radioGroupStyles = [
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
