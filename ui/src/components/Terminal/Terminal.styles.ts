import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { copyButtonStyles } from '../CodeBlock/code-view'

export const terminalStyles = [
  resetStyles,
  copyButtonStyles,
  css`
    :host {
      display: block;
      min-width: 0;
    }

    .base {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl, 0.75rem);
      background: var(--color-code-bg);
      color: var(--color-code-fg);
      box-shadow: var(--shadow-surface);
    }

    .header {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-height: 2.5rem;
      padding-inline: var(--spacing-4, 1rem) var(--spacing-2, 0.5rem);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .lights {
      display: flex;
      gap: 0.4rem;
    }

    .lights span {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-danger);
    }

    .lights span:nth-child(2) {
      background: var(--color-warning);
    }

    .lights span:nth-child(3) {
      background: var(--color-success);
    }

    .title {
      overflow: hidden;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-1, 0.25rem);
    }

    .actions .copy-button {
      width: 1.75rem;
      height: 1.75rem;
    }

    .actions .copy-button > svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .body {
      display: flex;
      min-height: var(--terminal-min-height, auto);
      flex-direction: column;
      gap: 0.15rem;
      padding: var(--spacing-4, 1rem);
      overflow-x: auto;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: 1.6;
    }
  `,
]

export const terminalLineStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      color: var(--color-code-fg);
      font-family: var(--font-family-mono);
    }

    :host([tone='success']) {
      color: var(--color-success-soft-fg);
    }

    :host([tone='warning']) {
      color: var(--color-warning-soft-fg);
    }

    :host([tone='error']) {
      color: var(--color-danger-soft-fg);
    }

    :host([tone='muted']) {
      color: var(--color-code-comment);
    }

    .body {
      display: flex;
      gap: 1ch;
    }

    /* A waiting line keeps its room, so the window never grows, and stays readable to screen readers. */
    :host([data-state='waiting']) .body {
      opacity: 0;
    }

    .prompt {
      flex-shrink: 0;
      color: var(--color-success-soft-fg);
      user-select: none;
    }

    /* The typed copy sits over the real text, which stays hidden until it is done. */
    .stack {
      display: grid;
      min-width: 0;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }

    .content,
    .typed {
      grid-area: 1 / 1;
    }

    :host([data-state='typing']) .content {
      opacity: 0;
    }

    .cursor {
      display: inline-block;
      width: 0.55em;
      height: 1.1em;
      margin-inline-start: 1px;
      vertical-align: text-bottom;
      background: currentColor;
      animation: blink 1s steps(1) infinite;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cursor {
        animation: none;
      }
    }
  `,
]
