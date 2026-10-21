import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const typographyStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      color: var(--color-fg);
      font-family: var(--font-family-base, inherit);
    }

    .typography {
      margin: 0;
      padding: 0;
      color: inherit;
      font-family: inherit;
    }

    /* Headings: semibold with tight tracking */
    :host([variant="h1"]) .typography,
    :host([variant="h2"]) .typography,
    :host([variant="h3"]) .typography,
    :host([variant="h4"]) .typography,
    :host([variant="h5"]) .typography,
    :host([variant="h6"]) .typography {
      font-weight: var(--font-weight-semibold, 600);
      letter-spacing: -0.025em;
    }

    :host([variant="h1"]) .typography {
      font-size: var(--font-size-4xl, 2.25rem);
      line-height: var(--line-height-4xl, 2.5rem);
    }

    :host([variant="h2"]) .typography {
      font-size: var(--font-size-3xl, 1.875rem);
      line-height: var(--line-height-3xl, 2.25rem);
    }

    :host([variant="h3"]) .typography {
      font-size: var(--font-size-2xl, 1.5rem);
      line-height: var(--line-height-2xl, 2rem);
    }

    :host([variant="h4"]) .typography {
      font-size: var(--font-size-xl, 1.25rem);
      line-height: var(--line-height-xl, 1.75rem);
    }

    :host([variant="h5"]) .typography {
      font-size: var(--font-size-lg, 1.125rem);
      line-height: var(--line-height-lg, 1.75rem);
    }

    :host([variant="h6"]) .typography {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    /* Body copy: relaxed leading-7 */
    :host([variant="body"]) .typography,
    :host(:not([variant])) .typography {
      font-size: var(--font-size-md, 1rem);
      line-height: 1.75rem;
      font-weight: var(--font-weight-normal, 400);
    }

    /* Caption: small muted text */
    :host([variant="caption"]) .typography {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: 1.5rem;
      color: var(--color-muted);
    }

    /* Inline code: a neutral chip */
    :host([variant="code"]) .typography {
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      background-color: var(--color-default);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-md, 0.375rem);
    }

    :host([variant="mono"]) .typography {
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-md, 1rem);
      line-height: 1.75rem;
    }

    /* Tones: readable foregrounds on light and dark surfaces */
    :host([tone="primary"]) {
      color: var(--color-accent-soft-fg);
    }

    :host([tone="accent"]) {
      color: var(--color-accent);
    }

    :host([tone="success"]) {
      color: var(--color-success-soft-fg);
    }

    :host([tone="warning"]) {
      color: var(--color-warning-soft-fg);
    }

    :host([tone="error"]) {
      color: var(--color-danger);
    }
  `,
]
