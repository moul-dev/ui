import { css } from 'lit'

export const buttonStyles = css`
  :host {
    display: inline-block;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--bs-btn-gap, var(--bs-btn-input-gap, 0.5rem));
    position: relative;
    font-family: inherit;
    font-size: var(--bs-btn-font-size, var(--bs-btn-input-font-size, 1rem));
    font-weight: var(--bs-btn-font-weight, var(--bs-btn-input-font-weight, 500));
    line-height: var(--bs-btn-line-height, var(--bs-btn-input-line-height, 1.5));
    cursor: pointer;
    user-select: none;
    text-decoration: none;
    white-space: nowrap;
    vertical-align: middle;
    background-color: var(--bs-btn-bg, var(--bs-theme-bg, transparent));
    color: var(--bs-btn-color, var(--bs-theme-contrast, inherit));
    border: var(--bs-btn-border-width, var(--bs-border-width, 1px)) solid var(--bs-btn-border-color, var(--bs-theme-border, transparent));
    padding: var(--bs-btn-padding-y, var(--bs-btn-input-padding-y, 0.375rem)) var(--bs-btn-padding-x, var(--bs-btn-input-padding-x, 0.75rem));
    min-height: var(--bs-btn-min-height, var(--bs-btn-input-min-height, 2.375rem));
    border-radius: var(--bs-btn-border-radius, var(--bs-border-radius, 0.375rem));
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .btn:hover:not(:disabled) {
    background-color: var(--bs-btn-hover-bg, var(--bs-btn-bg));
    border-color: var(--bs-btn-hover-border-color, var(--bs-btn-border-color));
    color: var(--bs-btn-hover-color, var(--bs-btn-color));
  }

  .btn:active:not(:disabled) {
    background-color: var(--bs-btn-active-bg, var(--bs-btn-hover-bg, var(--bs-btn-bg)));
    border-color: var(--bs-btn-active-border-color, var(--bs-btn-hover-border-color, var(--bs-btn-border-color)));
    color: var(--bs-btn-active-color, var(--bs-btn-hover-color, var(--bs-btn-color)));
  }

  .btn:focus-visible {
    outline: var(--bs-focus-ring-width, 3px) solid var(--bs-theme-focus-ring, var(--bs-primary-focus-ring, rgba(13, 110, 253, 0.5)));
    outline-offset: var(--bs-focus-ring-offset, 1px);
  }

  .btn:disabled,
  .btn.disabled {
    pointer-events: none;
    opacity: var(--bs-btn-disabled-opacity, 0.65);
    cursor: not-allowed;
  }

  :host([is-icon]) .btn {
    padding: 0.375rem;
    line-height: 1;
    min-height: unset;
  }

  :host([size="sm"]) .btn,
  .btn-sm {
    padding: var(--bs-btn-input-sm-padding-y, 0.25rem) var(--bs-btn-input-sm-padding-x, 0.5rem);
    font-size: var(--bs-btn-input-sm-font-size, 0.875rem);
    min-height: var(--bs-btn-input-sm-min-height, 1.875rem);
    border-radius: var(--bs-border-radius-sm, 0.25rem);
  }

  :host([size="lg"]) .btn,
  .btn-lg {
    padding: var(--bs-btn-input-lg-padding-y, 0.5rem) var(--bs-btn-input-lg-padding-x, 1rem);
    font-size: var(--bs-btn-input-lg-font-size, 1.25rem);
    min-height: var(--bs-btn-input-lg-min-height, 2.75rem);
    border-radius: var(--bs-border-radius-lg, 0.5rem);
  }

  .spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 0.15em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border .75s linear infinite;
  }

  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }

  /* Style Variants */
  .btn-solid {
    --bs-btn-bg: var(--bs-theme-bg);
    --bs-btn-color: var(--bs-theme-contrast);
    --bs-btn-border-color: var(--bs-theme-bg);
    --bs-btn-hover-bg: color-mix(in oklch, var(--bs-theme-bg) 90%, #000);
    --bs-btn-hover-border-color: color-mix(in oklch, var(--bs-theme-bg) 90%, #000);
    --bs-btn-hover-color: var(--bs-theme-contrast);
    --bs-btn-active-bg: color-mix(in oklch, var(--bs-theme-bg) 80%, #000);
    --bs-btn-active-border-color: color-mix(in oklch, var(--bs-theme-bg) 80%, #000);
    --bs-btn-active-color: var(--bs-theme-contrast);
  }

  .btn-outline {
    --bs-btn-bg: transparent;
    --bs-btn-color: var(--bs-theme-fg);
    --bs-btn-border-color: var(--bs-theme-border, var(--bs-theme-fg));
    --bs-btn-hover-bg: var(--bs-theme-bg);
    --bs-btn-hover-border-color: var(--bs-theme-border, var(--bs-theme-bg));
    --bs-btn-hover-color: var(--bs-theme-contrast);
    --bs-btn-active-bg: color-mix(in oklch, var(--bs-theme-bg) 85%, #000);
    --bs-btn-active-border-color: color-mix(in oklch, var(--bs-theme-bg) 85%, #000);
    --bs-btn-active-color: var(--bs-theme-contrast);
  }

  .btn-subtle {
    --bs-btn-bg: var(--bs-theme-bg-subtle, color-mix(in oklch, var(--bs-theme-bg) 15%, transparent));
    --bs-btn-color: var(--bs-theme-fg);
    --bs-btn-border-color: transparent;
    --bs-btn-hover-bg: color-mix(in oklch, var(--bs-theme-bg) 25%, transparent);
    --bs-btn-hover-border-color: transparent;
    --bs-btn-hover-color: var(--bs-theme-fg);
    --bs-btn-active-bg: color-mix(in oklch, var(--bs-theme-bg) 35%, transparent);
    --bs-btn-active-border-color: transparent;
    --bs-btn-active-color: var(--bs-theme-fg);
  }

  .btn-ghost, .btn-text {
    --bs-btn-bg: transparent;
    --bs-btn-color: var(--bs-theme-fg, inherit);
    --bs-btn-border-color: transparent;
    --bs-btn-hover-bg: color-mix(in oklch, currentColor 10%, transparent);
    --bs-btn-hover-border-color: transparent;
    --bs-btn-hover-color: var(--bs-theme-fg, inherit);
    --bs-btn-active-bg: color-mix(in oklch, currentColor 18%, transparent);
    --bs-btn-active-border-color: transparent;
    --bs-btn-active-color: var(--bs-theme-fg, inherit);
  }

  .btn-link {
    --bs-btn-bg: transparent;
    --bs-btn-color: var(--bs-link-color, var(--bs-theme-fg, #0d6efd));
    --bs-btn-border-color: transparent;
    --bs-btn-hover-bg: transparent;
    --bs-btn-hover-border-color: transparent;
    --bs-btn-hover-color: var(--bs-link-hover-color, color-mix(in oklch, var(--bs-btn-color) 85%, #000));
    --bs-btn-active-bg: transparent;
    --bs-btn-active-border-color: transparent;
    --bs-btn-active-color: var(--bs-btn-hover-color);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  /* Themes */
  .theme-primary, .btn-primary, .btn-outline-primary {
    --bs-theme-base: var(--bs-primary-base, var(--bs-primary, #0d6efd));
    --bs-theme-bg: var(--bs-primary-bg, var(--bs-primary-base, var(--bs-primary, #0d6efd)));
    --bs-theme-fg: var(--bs-primary-fg, var(--bs-primary-base, var(--bs-primary, #0d6efd)));
    --bs-theme-border: var(--bs-primary-border, var(--bs-primary-base, var(--bs-primary, #0d6efd)));
    --bs-theme-contrast: var(--bs-primary-contrast, #fff);
    --bs-theme-focus-ring: var(--bs-primary-focus-ring, rgba(13, 110, 253, 0.5));
    --bs-theme-bg-subtle: var(--bs-primary-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-secondary, .btn-secondary, .btn-outline-secondary, .theme-tertiary {
    --bs-theme-base: var(--bs-secondary-base, var(--bs-secondary, #6c757d));
    --bs-theme-bg: var(--bs-secondary-bg, var(--bs-secondary-base, var(--bs-secondary, #6c757d)));
    --bs-theme-fg: var(--bs-secondary-fg, var(--bs-secondary-base, var(--bs-secondary, #6c757d)));
    --bs-theme-border: var(--bs-secondary-border, var(--bs-secondary-base, var(--bs-secondary, #6c757d)));
    --bs-theme-contrast: var(--bs-secondary-contrast, #fff);
    --bs-theme-focus-ring: var(--bs-secondary-focus-ring, rgba(108, 117, 125, 0.5));
    --bs-theme-bg-subtle: var(--bs-secondary-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-success, .btn-success, .btn-outline-success {
    --bs-theme-base: var(--bs-success-base, var(--bs-success, #198754));
    --bs-theme-bg: var(--bs-success-bg, var(--bs-success-base, var(--bs-success, #198754)));
    --bs-theme-fg: var(--bs-success-fg, var(--bs-success-base, var(--bs-success, #198754)));
    --bs-theme-border: var(--bs-success-border, var(--bs-success-base, var(--bs-success, #198754)));
    --bs-theme-contrast: var(--bs-success-contrast, #fff);
    --bs-theme-focus-ring: var(--bs-success-focus-ring, rgba(25, 135, 84, 0.5));
    --bs-theme-bg-subtle: var(--bs-success-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-danger, .btn-danger, .btn-outline-danger, .btn-danger-soft {
    --bs-theme-base: var(--bs-danger-base, var(--bs-danger, #dc3545));
    --bs-theme-bg: var(--bs-danger-bg, var(--bs-danger-base, var(--bs-danger, #dc3545)));
    --bs-theme-fg: var(--bs-danger-fg, var(--bs-danger-base, var(--bs-danger, #dc3545)));
    --bs-theme-border: var(--bs-danger-border, var(--bs-danger-base, var(--bs-danger, #dc3545)));
    --bs-theme-contrast: var(--bs-danger-contrast, #fff);
    --bs-theme-focus-ring: var(--bs-danger-focus-ring, rgba(220, 53, 69, 0.5));
    --bs-theme-bg-subtle: var(--bs-danger-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-warning, .btn-warning, .btn-outline-warning {
    --bs-theme-base: var(--bs-warning-base, var(--bs-warning, #ffc107));
    --bs-theme-bg: var(--bs-warning-bg, var(--bs-warning-base, var(--bs-warning, #ffc107)));
    --bs-theme-fg: var(--bs-warning-fg, var(--bs-warning-base, var(--bs-warning, #ffc107)));
    --bs-theme-border: var(--bs-warning-border, var(--bs-warning-base, var(--bs-warning, #ffc107)));
    --bs-theme-contrast: var(--bs-warning-contrast, #000);
    --bs-theme-focus-ring: var(--bs-warning-focus-ring, rgba(255, 193, 7, 0.5));
    --bs-theme-bg-subtle: var(--bs-warning-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-info, .btn-info, .btn-outline-info {
    --bs-theme-base: var(--bs-info-base, var(--bs-info, #0dcaf0));
    --bs-theme-bg: var(--bs-info-bg, var(--bs-info-base, var(--bs-info, #0dcaf0)));
    --bs-theme-fg: var(--bs-info-fg, var(--bs-info-base, var(--bs-info, #0dcaf0)));
    --bs-theme-border: var(--bs-info-border, var(--bs-info-base, var(--bs-info, #0dcaf0)));
    --bs-theme-contrast: var(--bs-info-contrast, #000);
    --bs-theme-focus-ring: var(--bs-info-focus-ring, rgba(13, 202, 240, 0.5));
    --bs-theme-bg-subtle: var(--bs-info-bg-subtle, color-mix(in oklch, var(--bs-theme-base) 15%, transparent));
  }

  .theme-inverse, .theme-dark, .btn-dark, .btn-outline-dark {
    --bs-theme-base: var(--bs-inverse-base, var(--bs-dark-base, var(--bs-dark, #212529)));
    --bs-theme-bg: var(--bs-inverse-bg, var(--bs-dark-bg, var(--bs-dark, #212529)));
    --bs-theme-fg: var(--bs-inverse-fg, var(--bs-dark-fg, #fff));
    --bs-theme-border: var(--bs-inverse-border, var(--bs-dark-border, #212529));
    --bs-theme-contrast: var(--bs-inverse-contrast, #fff);
    --bs-theme-focus-ring: var(--bs-inverse-focus-ring, rgba(33, 37, 41, 0.5));
    --bs-theme-bg-subtle: var(--bs-inverse-bg-subtle, rgba(255, 255, 255, 0.1));
  }

  .theme-light, .btn-light, .btn-outline-light {
    --bs-theme-base: var(--bs-light-base, var(--bs-light, #f8f9fa));
    --bs-theme-bg: var(--bs-light-bg, var(--bs-light, #f8f9fa));
    --bs-theme-fg: var(--bs-light-fg, #212529);
    --bs-theme-border: var(--bs-light-border, #dee2e6);
    --bs-theme-contrast: var(--bs-light-contrast, #212529);
    --bs-theme-focus-ring: var(--bs-light-focus-ring, rgba(248, 249, 250, 0.5));
    --bs-theme-bg-subtle: var(--bs-light-bg-subtle, rgba(0, 0, 0, 0.05));
  }

  .btn {
    border-top-left-radius: var(--bs-border-top-left-radius, var(--bs-btn-border-radius, var(--bs-border-radius, 0.375rem)));
    border-bottom-left-radius: var(--bs-border-bottom-left-radius, var(--bs-btn-border-radius, var(--bs-border-radius, 0.375rem)));
    border-top-right-radius: var(--bs-border-top-right-radius, var(--bs-btn-border-radius, var(--bs-border-radius, 0.375rem)));
    border-bottom-right-radius: var(--bs-border-bottom-right-radius, var(--bs-btn-border-radius, var(--bs-border-radius, 0.375rem)));
  }
`
