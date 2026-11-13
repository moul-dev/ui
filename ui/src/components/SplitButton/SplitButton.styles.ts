import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/* Two moul-buttons drawn as one pill, styled through their `button` part:
   the inner corners are squared, the main part drops its inline-end border
   and the chevron's inline-start border is the divider. */
export const splitButtonStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      max-width: 100%;
    }

    .main {
      flex: 1 1 auto;
    }

    /* The menu host and its trigger wrapper add no box, so the chevron sits
       in the row like the main part (the popover is fixed, out of the flow). */
    .dropdown {
      display: flex;
    }

    /* A disabled menu dims its trigger wrapper; the chevron dims itself. */
    .dropdown::part(trigger) {
      display: contents;
    }

    /* The focused part rises so its focus ring paints over its neighbour. */
    .main:focus-within,
    .trigger:focus-within {
      z-index: 1;
    }

    .main::part(button) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
      border-inline-end-width: 0;
    }

    .trigger::part(button) {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      border-inline-start-color: var(--_divider);
    }

    /* Each part scaling on its own would pull the pill apart. */
    .main::part(button):active,
    .trigger::part(button):active {
      transform: none;
    }

    .trigger {
      --_divider: var(
        --split-button-divider,
        color-mix(in oklab, var(--color-accent-fg) 30%, transparent)
      );
    }

    .trigger[variant='danger'] {
      --_divider: var(
        --split-button-divider,
        color-mix(in oklab, var(--color-danger-fg) 30%, transparent)
      );
    }

    .trigger:is([variant='secondary'], [variant='tertiary'], [variant='ghost']) {
      --_divider: var(
        --split-button-divider,
        color-mix(in oklab, var(--color-default-fg) 15%, transparent)
      );
    }

    .trigger[variant='outline'] {
      --_divider: var(--split-button-divider, var(--color-border));
    }

    .chevron {
      display: inline-flex;
      width: 1rem;
      height: 1rem;
      transition: transform var(--duration-base, 250ms) var(--ease-out, ease-out);
    }

    .chevron svg {
      width: 100%;
      height: 100%;
    }

    .dropdown[is-open] .chevron {
      transform: rotate(180deg);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .chevron {
        transition: none;
      }
    }
  `,
]
