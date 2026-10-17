import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const typographyStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      color: var(--color-fg, inherit);
      font-family: var(--font-family-base, inherit);
    }

    .typography {
      margin: 0;
      padding: 0;
      color: inherit;
      font-family: inherit;
    }

    :host([variant="h1"]) .typography {
      font-size: var(--font-size-4xl, 2.25rem);
      line-height: var(--line-height-4xl, 2.5rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    :host([variant="h2"]) .typography {
      font-size: var(--font-size-3xl, 1.875rem);
      line-height: var(--line-height-3xl, 2.25rem);
      font-weight: 700;
      letter-spacing: -0.015em;
    }

    :host([variant="h3"]) .typography {
      font-size: var(--font-size-2xl, 1.5rem);
      line-height: var(--line-height-2xl, 2rem);
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    :host([variant="h4"]) .typography {
      font-size: var(--font-size-xl, 1.25rem);
      line-height: var(--line-height-xl, 1.75rem);
      font-weight: 600;
    }

    :host([variant="h5"]) .typography {
      font-size: var(--font-size-lg, 1.125rem);
      line-height: var(--line-height-lg, 1.75rem);
      font-weight: 600;
    }

    :host([variant="h6"]) .typography {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: 600;
    }

    :host([variant="body"]) .typography,
    :host(:not([variant])) .typography {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: 400;
    }

    :host([variant="caption"]) .typography {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    :host([variant="code"]) .typography {
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      background-color: var(--color-bg-subtle, #f3f4f6);
      padding: 0.125em 0.375em;
      border-radius: var(--radius-sm, 0.25rem);
    }

    :host([variant="mono"]) .typography {
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    :host([tone="primary"]) {
      color: var(--color-primary-600, oklch(0.55 0.22 250));
    }

    :host([tone="accent"]) {
      color: var(--color-primary-500, oklch(0.65 0.2 250));
    }

    :host([tone="success"]) {
      color: var(--color-success-500, oklch(0.65 0.17 145));
    }

    :host([tone="warning"]) {
      color: var(--color-warning-500, oklch(0.7 0.16 80));
    }

    :host([tone="error"]) {
      color: var(--color-error-500, oklch(0.6 0.22 25));
    }
  `,
]
