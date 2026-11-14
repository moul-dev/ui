import { css } from 'lit'
import { placeholderCycleStyles } from '../../controllers/placeholder-cycle.controller'
import { resetStyles } from '../../styles/reset.styles'

export const promptInputStyles = [
  resetStyles,
  placeholderCycleStyles,
  css`
    :host {
      display: block;
      min-width: 0;
      --_text-padding: var(--spacing-2, 0.5rem);
    }

    .base {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-2xl, 1.25rem);
      background: var(--color-field);
      color: var(--color-field-fg);
      box-shadow: var(--shadow-field);
      cursor: text;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .base:hover:not(:focus-within):not([data-disabled]) {
        background: var(--color-field-hover);
      }
    }

    .base:focus-within {
      background: var(--color-field-focus);
      box-shadow: var(--focus-ring-field), var(--shadow-field);
    }

    .base[data-dragging] {
      background: var(--color-accent-soft);
      box-shadow:
        0 0 0 2px var(--color-accent),
        var(--shadow-field);
    }

    .base[data-disabled] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    .field {
      position: relative;
      display: flex;
    }

    textarea {
      display: block;
      width: 100%;
      min-height: calc(var(--line-height-md, 1.5rem) + 2 * var(--_text-padding));
      margin: 0;
      padding: var(--_text-padding);
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      resize: none;
      overflow-y: hidden;
      scrollbar-width: thin;
    }

    /* The composer draws the focus ring around itself; the reset's ring would double it. */
    textarea:focus-visible {
      outline: none;
    }

    textarea::placeholder {
      color: var(--color-field-placeholder);
    }

    textarea[data-cycling]::placeholder {
      color: transparent;
    }

    textarea:disabled {
      cursor: not-allowed;
    }

    .cycling-placeholder,
    .vanish-layer {
      inset: 0;
      align-items: start;
      padding: var(--_text-padding);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    .vanish-layer {
      position: absolute;
      overflow: hidden;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      color: var(--color-field-fg);
      pointer-events: none;
    }

    .vanish-layer:empty {
      display: none;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      min-width: 0;
    }

    .spacer {
      flex: 1;
    }

    .tool-button {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      height: 2rem;
      max-width: 14rem;
      padding: 0 var(--spacing-2, 0.5rem);
      border: 0;
      border-radius: var(--radius-full, 9999px);
      background: transparent;
      color: var(--color-fg-subtle);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease;
    }

    .tool-button.icon {
      width: 2rem;
      padding: 0;
    }

    .tool-button:hover:not(:disabled) {
      background: var(--color-fill-hover);
      color: var(--color-fg);
    }

    .tool-button:focus-visible,
    .send:focus-visible,
    .remove:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .tool-button:disabled {
      cursor: not-allowed;
      opacity: var(--disabled-opacity, 0.5);
    }

    .tool-button svg {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    .model-button {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .model-button .chevron {
      width: 0.875rem;
      height: 0.875rem;
    }

    .model-option {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .model-description {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle);
    }

    .send {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-accent);
      color: var(--color-accent-fg);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease,
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .send:hover:not(:disabled) {
      background: var(--color-accent-hover);
    }

    .send:active:not(:disabled) {
      scale: var(--press-scale, 0.96);
    }

    .send:disabled {
      background: var(--color-fill-track);
      color: var(--color-fg-subtle);
      cursor: not-allowed;
    }

    .send.stop {
      background: var(--color-fg);
      color: var(--color-bg);
    }

    .send svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .send.stop svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .attachments {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      margin: 0;
      padding: var(--spacing-1, 0.25rem) var(--spacing-1, 0.25rem) 0;
      list-style: none;
      cursor: default;
    }

    .attachment {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      max-width: 15rem;
      padding: var(--spacing-1, 0.25rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--color-surface);
      overflow: hidden;
    }

    .attachment[data-status='error'] {
      border-color: var(--color-danger);
    }

    .thumb {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-md, 0.5rem);
      background: var(--color-bg-subtle);
      color: var(--color-fg-subtle);
      overflow: hidden;
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .attachment-text {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      line-height: 1.3;
    }

    .attachment-name,
    .attachment-meta {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: var(--font-size-xs, 0.75rem);
    }

    .attachment-name {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
    }

    .attachment-meta {
      color: var(--color-fg-subtle);
    }

    .attachment[data-status='error'] .attachment-meta {
      color: var(--color-danger-soft-fg);
    }

    .attachment-progress {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      height: 2px;
      background: var(--color-fill-track);
    }

    .attachment-progress::after {
      content: '';
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      width: var(--_progress);
      background: var(--color-accent);
      transition: width var(--duration-base, 200ms) var(--ease-out, ease-out);
    }

    .attachment-progress[data-indeterminate]::after {
      animation: moul-prompt-upload 1.1s var(--ease-smooth, ease-in-out) infinite;
    }

    @keyframes moul-prompt-upload {
      from {
        translate: -100% 0;
      }
      to {
        translate: 350% 0;
      }
    }

    .remove {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-full, 9999px);
      background: transparent;
      color: var(--color-fg-subtle);
      cursor: pointer;
    }

    .remove:hover {
      background: var(--color-fill-hover);
      color: var(--color-fg);
    }

    .remove svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .base,
      .tool-button,
      .send,
      .attachment-progress::after {
        transition: none;
      }

      .send:active:not(:disabled) {
        scale: none;
      }

      .attachment-progress[data-indeterminate]::after {
        animation: none;
        width: 100%;
        opacity: 0.5;
      }
    }
  `,
]
