import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const avatarStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      position: relative;
      align-items: center;
      justify-content: center;
      /* Neutral fill behind initials and the fallback glyph */
      background-color: var(--color-default);
      color: var(--color-default-fg);
      font-weight: var(--font-weight-medium, 500);
      user-select: none;
      box-sizing: border-box;
      vertical-align: middle;
      flex-shrink: 0;
      line-height: 1;
    }

    /* Shapes */
    :host([shape="circle"]),
    :host(:not([shape])) {
      border-radius: var(--radius-full, 9999px);
    }

    :host([shape="square"]) {
      border-radius: var(--radius-xl, 0.75rem);
    }

    /* Sizes */
    :host([size="xs"]) {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.625rem;
    }

    :host([size="sm"]) {
      width: 2rem;
      height: 2rem;
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]),
    :host(:not([size])) {
      width: 2.5rem;
      height: 2.5rem;
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([size="lg"]) {
      width: 3rem;
      height: 3rem;
      font-size: var(--font-size-md, 1rem);
    }

    :host([size="xl"]) {
      width: 4rem;
      height: 4rem;
      font-size: var(--font-size-xl, 1.25rem);
    }

    [part~="image"] {
      width: 100%;
      height: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: inherit;
      display: block;
    }

    [part~="initials"] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      text-transform: uppercase;
    }

    [part~="fallback"] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--color-muted);
    }

    [part~="fallback"] svg {
      width: 60%;
      height: 60%;
    }

    /* Status indicator dot, ringed in the surface color it usually sits on */
    [part~="status"] {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      min-width: 8px;
      min-height: 8px;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid var(--color-surface);
      box-sizing: content-box;
      z-index: 1;
    }

    .status-online {
      background-color: var(--color-success);
    }

    .status-offline {
      background-color: var(--color-muted);
    }

    .status-away {
      background-color: var(--color-warning);
    }

    .status-busy {
      background-color: var(--color-danger);
    }
  `,
]

export const avatarGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      flex-direction: row;
      --_overlap: 0.5rem;
      --_seam: 2px;
    }

    /* Overlapping stack; a seam in the surface color separates neighbours */
    ::slotted(moul-avatar) {
      box-shadow: 0 0 0 var(--_seam) var(--color-surface);
    }

    ::slotted(moul-avatar:not(:first-child)) {
      margin-inline-start: calc(-1 * var(--_overlap));
    }

    ::slotted(moul-avatar:hover) {
      z-index: 2;
    }

    .overflow-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      margin-inline-start: calc(-1 * var(--_overlap));
      box-shadow: 0 0 0 var(--_seam) var(--color-surface);
      background-color: var(--color-default);
      color: var(--color-default-fg);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      border-radius: var(--radius-full, 9999px);
      z-index: 1;
    }

    :host([size="xs"]) .overflow-badge {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.625rem;
    }

    :host([size="sm"]) .overflow-badge {
      width: 2rem;
      height: 2rem;
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]) .overflow-badge,
    :host(:not([size])) .overflow-badge {
      width: 2.5rem;
      height: 2.5rem;
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([size="lg"]) .overflow-badge {
      width: 3rem;
      height: 3rem;
      font-size: var(--font-size-md, 1rem);
    }

    :host([size="xl"]) .overflow-badge {
      width: 4rem;
      height: 4rem;
      font-size: var(--font-size-xl, 1.25rem);
    }
  `,
]
