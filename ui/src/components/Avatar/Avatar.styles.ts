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
      background-color: var(--color-bg-subtle, #e5e7eb);
      color: var(--color-fg, #374151);
      font-weight: 600;
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
      border-radius: var(--radius-md, 0.375rem);
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
      font-size: 0.75rem;
    }

    :host([size="md"]),
    :host(:not([size])) {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.875rem;
    }

    :host([size="lg"]) {
      width: 3rem;
      height: 3rem;
      font-size: 1rem;
    }

    :host([size="xl"]) {
      width: 4rem;
      height: 4rem;
      font-size: 1.25rem;
    }

    [part="image"] {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
      display: block;
    }

    [part="initials"] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    [part="fallback"] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--color-fg-subtle, #9ca3af);
    }

    [part="fallback"] svg {
      width: 60%;
      height: 60%;
    }

    /* Status indicator dot */
    [part="status"] {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      min-width: 8px;
      min-height: 8px;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid var(--color-bg, #ffffff);
      box-sizing: content-box;
      z-index: 1;
    }

    .status-online {
      background-color: var(--color-success-500, #22c55e);
    }

    .status-offline {
      background-color: var(--color-fg-subtle, #9ca3af);
    }

    .status-away {
      background-color: var(--color-warning-500, #f59e0b);
    }

    .status-busy {
      background-color: var(--color-error-500, #ef4444);
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
    }

    ::slotted(moul-avatar:not(:first-child)) {
      margin-inline-start: -0.625rem;
      box-shadow: 0 0 0 2px var(--color-bg, #ffffff);
      transition: transform 0.15s ease;
    }

    ::slotted(moul-avatar:first-child) {
      box-shadow: 0 0 0 2px var(--color-bg, #ffffff);
    }

    ::slotted(moul-avatar:hover) {
      z-index: 2;
      transform: translateY(-2px);
    }

    .overflow-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-inline-start: -0.625rem;
      box-shadow: 0 0 0 2px var(--color-bg, #ffffff);
      background-color: var(--color-bg-subtle, #e5e7eb);
      color: var(--color-fg, #374151);
      font-weight: 600;
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
      font-size: 0.75rem;
    }

    :host([size="md"]) .overflow-badge,
    :host(:not([size])) .overflow-badge {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.875rem;
    }

    :host([size="lg"]) .overflow-badge {
      width: 3rem;
      height: 3rem;
      font-size: 1rem;
    }

    :host([size="xl"]) .overflow-badge {
      width: 4rem;
      height: 4rem;
      font-size: 1.25rem;
    }
  `,
]
