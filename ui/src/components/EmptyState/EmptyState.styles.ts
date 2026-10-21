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
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-muted);
    }

    [part~="base"] {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      border-radius: var(--radius-surface, 1.5rem);
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

    /* Variants. Flat (the default) has no container: muted copy on whatever it sits in. */
    :host([variant="flat"]) [part~="base"],
    :host(:not([variant])) [part~="base"] {
      background-color: transparent;
    }

    :host([variant="bordered"]) [part~="base"] {
      background-color: transparent;
      border: 1px dashed var(--color-border);
    }

    /* Solid: a surface card lifted by the soft surface shadow */
    :host([variant="solid"]) [part~="base"] {
      background-color: var(--color-surface);
      box-shadow: var(--shadow-surface);
    }

    /* Glass: opt-in translucent material */
    :host([variant="glass"]) [part~="base"] {
      background-color: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      box-shadow: var(--glass-highlight), var(--shadow-glass);
      -webkit-backdrop-filter: var(--glass-filter, blur(12px));
      backdrop-filter: var(--glass-filter, blur(12px));
    }

    [part~="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      font-size: 2rem;
      line-height: 1;
    }

    [part~="title"] {
      font-size: var(--font-size-md, 1rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-md, 1.5rem);
      color: var(--color-fg);
    }

    [part~="description"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-muted);
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
