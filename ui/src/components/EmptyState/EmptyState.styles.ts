import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const emptyStateStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
    }

    [part~="base"] {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      border-radius: var(--radius-lg, 0.75rem);
    }

    :host([align="center"]) [part~="base"],
    :host(:not([align])) [part~="base"] {
      align-items: center;
      text-align: center;
    }

    :host([align="start"]) [part~="base"] {
      align-items: flex-start;
      text-align: start;
    }

    /* Sizes */
    :host([size="sm"]) [part~="base"] {
      padding: var(--spacing-4, 1rem) var(--spacing-3, 0.75rem);
      gap: var(--spacing-2, 0.5rem);
    }

    :host([size="md"]) [part~="base"],
    :host(:not([size])) [part~="base"] {
      padding: var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
      gap: var(--spacing-3, 0.75rem);
    }

    :host([size="lg"]) [part~="base"] {
      padding: var(--spacing-8, 2rem) var(--spacing-6, 1.5rem);
      gap: var(--spacing-4, 1rem);
    }

    /* Variants */
    :host([variant="flat"]) [part~="base"],
    :host(:not([variant])) [part~="base"] {
      background-color: var(--color-bg-subtle, #f3f4f6);
    }

    :host([variant="bordered"]) [part~="base"] {
      background-color: var(--color-bg, #ffffff);
      border: 1px dashed var(--color-border, #e5e7eb);
    }

    :host([variant="solid"]) [part~="base"] {
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border-subtle, #f3f4f6);
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    :host([variant="glass"]) [part~="base"] {
      background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.7));
      border: 1px solid var(--color-border-glass, rgba(255, 255, 255, 0.2));
      box-shadow: var(--glass-highlight), var(--shadow-glass);
      backdrop-filter: var(--glass-filter, blur(12px));
      -webkit-backdrop-filter: var(--glass-filter, blur(12px));
    }

    [part~="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-fg-subtle, #6b7280);
      font-size: 2.5rem;
    }

    [part~="title"] {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-fg, inherit);
      line-height: var(--line-height-lg, 1.75rem);
    }

    [part~="description"] {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle, #6b7280);
      line-height: var(--line-height-sm, 1.25rem);
      max-width: 48ch;
    }

    [part~="actions"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      margin-top: var(--spacing-2, 0.5rem);
    }

    /* Parts whose slots received nothing are flagged by the element so gaps don't stack up */
    [data-empty] {
      display: none;
    }
  `,
]
