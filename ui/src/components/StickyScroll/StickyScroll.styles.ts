import { css } from 'lit'

/*
 * Layout: `moul-sticky-scroll` is a two-column grid and a size container.
 * Each `moul-sticky-scroll-item` is `display: contents`, so its two shadow
 * boxes (.content and .column) become cells of that grid while the author's
 * text and media stay in the item's light DOM:
 *
 * - every .content is placed in column 1 and takes the next row;
 * - the grid has one explicit row per step (--_sticky-scroll-count, written
 *   by the parent) and one more for --sticky-scroll-end-space;
 * - every .column spans column 2 over all of those rows, so the columns of
 *   all the items lie on top of each other, and each holds a .media panel
 *   that is sticky within it: one pinned panel, as many layers as steps;
 * - only the active item's panel is opaque and takes the pointer.
 *
 * Below 600px of the parent's width the item becomes a column of its own,
 * media first, and nothing is pinned or dimmed. Container queries look up
 * the flat tree, so the item's rules see the parent's width.
 */

export const stickyScrollStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    background-color: var(--_sticky-scroll-tint, transparent);
    transition: background-color var(--duration-slow, 400ms)
      var(--ease-out, ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  .grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, var(--sticky-scroll-media-width, 1fr));
    /* One row per step, then the room after the last one, which the panel stays pinned through. */
    grid-template-rows:
      repeat(var(--_sticky-scroll-count, 1), auto)
      var(--sticky-scroll-end-space, 0px);
    column-gap: var(--sticky-scroll-gap, var(--spacing-8, 2rem));
    align-items: start;
  }

  @container (width < 600px) {
    .grid {
      display: flex;
      flex-direction: column;
      gap: var(--sticky-scroll-gap, var(--spacing-8, 2rem));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }
`

export const stickyScrollItemStyles = css`
  :host {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }

  .content {
    grid-column: 1;
    padding-block: var(--sticky-scroll-spacing, var(--spacing-8, 2rem));
    opacity: var(--sticky-scroll-dim, 0.45);
    transition: opacity var(--duration-base, 200ms) var(--ease-out, ease-out);
  }

  :host([is-active]) .content {
    opacity: 1;
  }

  .column {
    grid-column: 2;
    grid-row: 1 / -1;
    align-self: stretch;
    pointer-events: none;
  }

  .media {
    position: sticky;
    top: var(
      --sticky-scroll-top,
      max(
        var(--spacing-4, 1rem),
        calc(50% - var(--sticky-scroll-media-height, 18rem) / 2)
      )
    );
    block-size: var(--sticky-scroll-media-height, 18rem);
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl, 1rem);
    background: var(--color-surface-secondary);
    box-shadow: var(--shadow-md);
    opacity: 0;
    transition: opacity var(--duration-slow, 400ms) var(--ease-out, ease-out);
  }

  /* The active panel lies above the others and is the only one that takes the pointer. */
  :host([is-active]) .column {
    z-index: 1;
  }

  :host([is-active]) .media {
    opacity: 1;
    pointer-events: auto;
  }

  ::slotted([slot="media"]) {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }

  @container (width < 600px) {
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 1rem);
    }

    .content {
      padding-block: 0;
      opacity: 1;
    }

    .column {
      order: -1;
      pointer-events: auto;
    }

    .media {
      position: static;
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .content,
    .media {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .media {
      border-color: CanvasText;
    }
  }
`
