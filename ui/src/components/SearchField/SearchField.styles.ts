import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Layout and inner bits only; the shell look (fill, radius, shadow, hover,
   focus and invalid rings) comes from the shared fieldStyles appended last. */
export const searchFieldStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    /* Flex drops template whitespace so the required mark sits tight to the text */
    [part~='label'] {
      display: flex;
      align-items: baseline;
      width: fit-content;
      line-height: var(--line-height-sm, 1.25rem);
    }

    :host([is-required][label]:not([label=''])) [part~='label']::after {
      content: '*';
      margin-inline-start: 0.125rem;
      color: var(--color-danger);
    }

    :host([is-invalid]:is([data-touched], [error-message]:not([error-message='']))) [part~='label'] {
      color: var(--color-danger);
    }

    search,
    [part~='search'] {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
    }

    [part~='input-container'] {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      min-height: 2.25rem;
      font-size: var(--font-size-sm, 0.875rem);
    }

    [part~='search-icon'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-field-placeholder);
      width: 1rem;
      height: 1rem;
      margin-inline-start: var(--spacing-3, 0.75rem);
      flex-shrink: 0;
      pointer-events: none;
    }

    [part~='search-icon'] svg {
      width: 100%;
      height: 100%;
    }

    /* The icon sits on the leading edge, so the text tucks in closer to it */
    [part~='input'] {
      flex: 1;
      width: 100%;
      min-width: 0;
      border: none;
      border-radius: 0;
      outline: none;
      background: transparent;
      box-shadow: none;
      color: inherit;
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding-block: var(--spacing-2, 0.5rem);
      padding-inline: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    }

    [part~='input-container']:has([part~='clear-btn']) [part~='input'] {
      padding-inline-end: var(--spacing-2, 0.5rem);
    }

    [part~='input']::-webkit-search-cancel-button,
    [part~='input']::-webkit-search-decoration,
    [part~='input']::-webkit-search-results-button,
    [part~='input']::-webkit-search-results-decoration {
      display: none;
      -webkit-appearance: none;
    }

    [part~='input']:-webkit-autofill {
      box-shadow: 0 0 0 1000px transparent inset;
      -webkit-text-fill-color: var(--color-field-fg);
      caret-color: var(--color-field-fg);
      transition: background-color 9999s ease-in-out 0s;
    }

    [part~='clear-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
      padding: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin-inline-end: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-xl, 0.75rem);
      flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
      transition:
        color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='clear-btn']:hover {
        color: var(--color-fg, inherit);
      }
    }

    [part~='clear-btn']:active {
      transform: scale(0.95);
    }

    [part~='clear-btn']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='clear-btn'] svg {
      width: 1rem;
      height: 1rem;
    }

    /* Expandable: a round search button that springs open into the field.
       The container's width animates; the input inside is hidden (and so
       never focusable) while it is closed, and hides only once the width
       has finished closing. */
    :host([is-expandable]) {
      display: inline-block;
      width: auto;
      max-width: 100%;
      vertical-align: middle;
    }

    :host([is-expandable]) [part~='label'] {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    :host([is-expandable]) [part~='input-container'] {
      --_search-collapsed: 2.25rem;
      inline-size: var(--_search-collapsed);
      max-inline-size: 100%;
      overflow: hidden;
      border-radius: var(--radius-full, 9999px);
      transition:
        inline-size var(--duration-slow, 300ms) var(--ease-spring, ease-out),
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    :host([is-expandable][is-expanded]) [part~='input-container'] {
      inline-size: var(--search-field-expanded-width, 16rem);
    }

    [part~='expand-button'] {
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      inline-size: var(--_search-collapsed);
      block-size: var(--_search-collapsed);
      padding: 0;
      border: none;
      border-radius: inherit;
      background: transparent;
      color: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    :host([is-expanded]) [part~='expand-button'] {
      cursor: text;
    }

    [part~='expand-button'] [part~='search-icon'] {
      margin: 0;
    }

    /* The focus-within ring of the shell already marks the focused button. */
    [part~='expand-button']:focus-visible {
      outline: none;
    }

    :host([is-expandable]) [part~='input'] {
      padding-inline-start: 0;
      transition: visibility 0s linear 0s;
    }

    :host([is-expandable]:not([is-expanded])) [part~='input'] {
      visibility: hidden;
      transition-delay: var(--duration-slow, 300ms);
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='input-container'],
      [part~='clear-btn'] {
        transition: none;
      }

      [part~='clear-btn']:active {
        transform: none;
      }

      /* Opens and closes at once, without the width spring. */
      :host([is-expandable]) [part~='input-container'],
      :host([is-expandable]) [part~='input'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
