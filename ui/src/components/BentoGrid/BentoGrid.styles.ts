import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/**
 * Below this width of the grid itself, it becomes one column. Container query
 * conditions cannot read custom properties, so it is fixed here and in the
 * docs.
 */
const NARROW = css`36rem`

export const bentoGridStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      /* The cards query this container for the narrow layout. Container names
         are not tree-scoped, and a query container is looked up through the
         flat tree, so the cards' own shadow styles find it through the slot. */
      container: moul-bento / inline-size;
    }

    [part="base"] {
      display: grid;
      grid-template-columns: repeat(var(--_bento-columns, 3), minmax(0, 1fr));
      grid-auto-rows: var(--bento-row-height, minmax(12rem, auto));
      gap: var(--bento-gap, var(--spacing-4, 1rem));
    }

    @container moul-bento (max-width: ${NARROW}) {
      [part="base"] {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
]

export const bentoCardStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      position: relative;
      /* Keeps the art behind the text inside the card, and clips it to the
         rounded corners while it grows. */
      isolation: isolate;
      overflow: hidden;
      min-inline-size: 0;
      grid-column: span var(--_bento-col-span, 1);
      grid-row: span var(--_bento-row-span, 1);
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--color-surface);
      color: var(--color-fg);
      box-shadow: var(--shadow-surface);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      --_bento-ease: var(--ease-out, ease-out);
      --_bento-duration: var(--duration-base, 250ms);
    }

    /* In a narrow grid every card takes the one column and one row. */
    @container moul-bento (max-width: ${NARROW}) {
      :host {
        grid-column: auto;
        grid-row: auto;
      }
    }

    [part="base"] {
      position: relative;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-block-size: 0;
      padding: var(--spacing-6, 1.5rem);
    }

    /* Behind the whole card: washes and patterns. */
    [part="background"] {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      transition: scale var(--duration-slow, 400ms) var(--_bento-ease);
    }

    /* Above the text, edge to edge: screenshots, code, device frames. It
       takes the card's spare height, so the text stays at the bottom. */
    [part="visual"] {
      position: relative;
      z-index: 0;
      flex: 1 1 auto;
      min-block-size: 5rem;
      margin: calc(-1 * var(--spacing-6, 1.5rem)) calc(-1 * var(--spacing-6, 1.5rem))
        var(--spacing-4, 1rem);
      overflow: hidden;
      transition: scale var(--duration-slow, 400ms) var(--_bento-ease);
    }

    [part="visual"][hidden] {
      display: none;
    }

    ::slotted([slot="visual"]),
    ::slotted([slot="background"]) {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    [part="content"] {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      transition: translate var(--_bento-duration) var(--_bento-ease);
    }

    [part="icon"] {
      display: flex;
      margin-block-end: var(--spacing-3, 0.75rem);
      color: var(--color-fg);
    }

    ::slotted([slot="heading"]) {
      margin: 0;
      font-size: var(--font-size-lg, 1.125rem);
      line-height: var(--line-height-lg, 1.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg);
    }

    .description {
      color: var(--color-muted);
    }

    .description ::slotted(*) {
      margin: 0;
    }

    [part="action"] {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      padding-block-start: var(--spacing-4, 1rem);
      transition:
        translate var(--_bento-duration) var(--_bento-ease),
        opacity var(--_bento-duration) var(--_bento-ease);
    }

    /* Only under a real cursor and only when motion is welcome: the action
       waits below the text, out of sight, and the text sits where the action
       will be. Hover or focus inside brings both up. */
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      :host(:not(:hover):not(:focus-within)) [part="content"],
      :host(:not(:hover):not(:focus-within)) [part="action"] {
        translate: 0 var(--_bento-action-size, 0px);
      }

      :host(:not(:hover):not(:focus-within)) [part="action"] {
        opacity: 0;
      }

      :host(:hover) :is([part="visual"], [part="background"]),
      :host(:focus-within) :is([part="visual"], [part="background"]) {
        scale: 1.03;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part="content"],
      [part="action"],
      [part="visual"],
      [part="background"] {
        transition: none;
        translate: none;
        scale: none;
      }

      [part="action"] {
        opacity: 1;
      }
    }
  `,
]

/**
 * How the shared card effects (`styles/card-effects.styles.ts`) sit in a
 * bento card's layers. Kept apart from `bentoCardStyles`, which is the card's
 * own look.
 */
export const bentoCardEffectStyles = css`
  /* Above the background art, under the visual and the text. */
  [part="base"] > .card-spotlight {
    z-index: 0;
  }

  /* The glow lies outside the card, so the host stops clipping and the inner
     layout clips the art to the rounded corners instead. */
  :host([effect~="glow"]) {
    overflow: visible;
    min-block-size: 0;
  }

  :host([effect~="glow"]) [part="base"] {
    overflow: hidden;
    border-radius: inherit;
  }
`
