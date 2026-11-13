import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const fileUploadStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      --_thumb: var(--file-upload-thumbnail-size, 2.75rem);
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
    }

    [part~='base'] {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      width: 100%;
    }

    [part~='label'] {
      display: flex;
      align-items: baseline;
      gap: 0.125rem;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
    }

    [part~='required-indicator'] {
      color: var(--color-danger);
    }

    [part~='dropzone'] {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2, 0.5rem);
      width: 100%;
      padding: var(--spacing-5, 1.25rem) var(--spacing-4, 1rem);
      border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-field, 0.75rem);
      background-color: var(--color-bg-subtle);
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: center;
      cursor: pointer;
      transition:
        border-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    [part~='dropzone']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='dropzone']:disabled {
      cursor: not-allowed;
    }

    @media (hover: hover) {
      [part~='dropzone']:hover:not(:disabled) {
        border-color: color-mix(in oklch, var(--color-accent) 60%, var(--color-border));
      }
    }

    [part~='dropzone-icon'] {
      display: inline-flex;
      color: var(--color-accent);
    }

    [part~='dropzone-icon'] svg {
      width: 1.75rem;
      height: 1.75rem;
    }

    [part~='browse'] {
      color: var(--color-accent);
      font-weight: var(--font-weight-medium, 500);
    }

    :host([data-dragging]) [part~='dropzone'],
    :host([data-dragging]:not([is-multiple])) [part~='item'] {
      border-color: var(--color-accent);
      background-color: color-mix(in oklch, var(--color-accent) 8%, var(--color-bg-subtle));
      transform: scale(1.01);
    }

    :host(:is([is-invalid], [error-message]:not([error-message='']))) [part~='dropzone'] {
      border-color: var(--color-danger);
      background-color: color-mix(in oklch, var(--color-danger) 5%, var(--color-bg-subtle));
    }

    [part~='list'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    [part~='item'] {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      min-width: 0;
      padding: var(--spacing-2, 0.5rem);
      border: 1.5px solid transparent;
      border-radius: var(--radius-field, 0.75rem);
      background-color: var(--color-field);
      color: var(--color-field-fg, inherit);
      box-shadow: var(--shadow-field);
      transition:
        border-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    [part~='item-error'] {
      border-color: color-mix(in oklch, var(--color-danger) 45%, transparent);
    }

    [part~='thumbnail'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--_thumb);
      height: var(--_thumb);
      overflow: hidden;
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    [part~='thumbnail'] img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    [part~='thumbnail'] svg {
      width: 45%;
      height: 45%;
    }

    [part~='info'] {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1;
      min-width: 0;
    }

    [part~='name'] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
    }

    [part~='meta'] {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      font-variant-numeric: tabular-nums;
      color: var(--color-muted);
    }

    [part~='upload-error'],
    [part~='rejection'],
    [part~='error'] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-danger);
    }

    [part~='progress'] {
      margin-top: var(--spacing-1, 0.25rem);
    }

    [part~='actions'] {
      display: flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      flex-shrink: 0;
    }

    /* Tooltip hosts are inline-block; flex keeps them from adding a line box below the button */
    [part~='actions'] moul-tooltip {
      display: inline-flex;
    }

    [part~='action'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      min-width: 2rem;
      height: 2rem;
      padding: 0 var(--spacing-2, 0.5rem);
      border: none;
      border-radius: var(--radius-lg, 0.5rem);
      background-color: transparent;
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    [part~='action'] svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    [part~='open'],
    [part~='retry'],
    [part~='remove'] {
      padding: 0;
    }

    [part~='replace'] {
      box-shadow: inset 0 0 0 1px var(--color-border);
      color: var(--color-fg);
    }

    [part~='remove'] {
      color: var(--color-danger);
    }

    @media (hover: hover) {
      [part~='action']:hover:not(:disabled) {
        background-color: var(--color-default);
      }
    }

    [part~='action']:active:not(:disabled) {
      transform: scale(var(--press-scale, 0.97));
    }

    [part~='action']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='action']:disabled {
      cursor: not-allowed;
    }

    [part~='description'] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
    }

    [part~='status'] {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='dropzone'],
      [part~='item'],
      [part~='action'] {
        transition: none;
      }

      :host([data-dragging]) [part~='dropzone'],
      :host([data-dragging]:not([is-multiple])) [part~='item'],
      [part~='action']:active:not(:disabled) {
        transform: none;
      }
    }
  `,
]
