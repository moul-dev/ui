import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const thinkingIndicatorStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      --_size: var(--thinking-indicator-size, 1.75rem);
    }

    :host([size='sm']) {
      --_size: var(--thinking-indicator-size, 1.25rem);
    }

    :host([size='lg']) {
      --_size: var(--thinking-indicator-size, 2.75rem);
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-width: 0;
    }

    .orb {
      display: block;
      flex-shrink: 0;
      width: var(--_size);
      height: var(--_size);
      color: var(--thinking-indicator-color, var(--color-accent));
    }

    .label {
      min-width: 0;
      overflow: hidden;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--color-fg-subtle);
      background-image: linear-gradient(
        90deg,
        var(--color-fg-subtle) 0%,
        var(--color-fg-subtle) 35%,
        var(--color-fg) 50%,
        var(--color-fg-subtle) 65%,
        var(--color-fg-subtle) 100%
      );
      background-size: 250% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: moul-thinking-shimmer 2.2s linear infinite;
    }

    :host([size='lg']) .label {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    :host([hide-label]) .label {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @keyframes moul-thinking-shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -150% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .label {
        animation: none;
        background-image: none;
        -webkit-text-fill-color: currentColor;
      }
    }

    @media (forced-colors: active) {
      .label {
        background-image: none;
        -webkit-text-fill-color: currentColor;
      }
    }
  `,
]
