import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const timelineStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
    }
  `,
]

/* Each item draws its own segment of the rail, from its top to its bottom
   (the first starts at its marker; a compact last item ends at its marker),
   so the segments meet into one line and each fills on its own: from the
   scroll position, from its status, or not at all. */
export const timelineItemStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: block;
      /* The item is the container its own layout queries, so a narrow
         timeline stacks the heading over the content. */
      container-type: inline-size;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      --_rail: 1.75rem;
      --_marker: 1.75rem;
      /* Space above the marker, so it centres on the heading's first line. */
      --_marker-top: 0px;
      --_marker-center: calc(var(--_marker-top) + var(--_marker) / 2);
      --_col-gap: var(--spacing-4, 1rem);
      --_gap: var(--moul-timeline-gap, var(--spacing-8, 2rem));
      position: relative;
      display: grid;
      grid-template-columns: var(--_rail) minmax(0, 1fr);
      column-gap: var(--_col-gap);
      padding-block-end: var(--_gap);
    }

    .base.compact {
      --_rail: 1.25rem;
      --_marker: 0.75rem;
      --_marker-top: calc((var(--line-height-sm, 1.25rem) - 0.75rem) / 2);
      --_col-gap: var(--spacing-3, 0.75rem);
      --_gap: var(--moul-timeline-gap, var(--spacing-4, 1rem));
    }

    /* Room for an icon or an xs avatar; it overhangs the rail column evenly,
       so every marker stays centred on the rail. */
    .base.compact.has-marker {
      --_marker: 1.5rem;
      --_marker-top: calc((var(--line-height-sm, 1.25rem) - 1.5rem) / 2);
    }

    .base.last {
      padding-block-end: 0;
    }

    /* Rail ------------------------------------------------------------- */

    .rail {
      position: absolute;
      inset-block: 0;
      inset-inline-start: calc(var(--_rail) / 2 - 1px);
      width: 2px;
      pointer-events: none;
    }

    .first.last .rail {
      display: none;
    }

    .track {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: var(--radius-full, 9999px);
      background: var(--moul-timeline-rail-color, var(--color-border));
    }

    .first .track {
      inset-block-start: var(--_marker-center);
    }

    .compact.last .track {
      inset-block-end: auto;
      block-size: var(--_marker-center);
    }

    .fill {
      position: absolute;
      inset-inline: 0;
      inset-block-start: 0;
      block-size: 100%;
      transform-origin: top;
      transform: scaleY(var(--_progress, 0));
      border-radius: inherit;
      background: var(--moul-timeline-progress-color, var(--color-accent));
    }

    .none .fill {
      display: none;
    }

    .status .fill {
      transition:
        transform var(--duration-slow, 400ms) var(--ease-out, ease-out),
        block-size var(--duration-slow, 400ms) var(--ease-out, ease-out);
    }

    :host([status='complete']) .status .fill {
      --_progress: 1;
    }

    :host([status='current']) .status:not(.first) .fill {
      --_progress: 1;
      block-size: var(--_marker-center);
    }

    /* Where the browser has scroll-driven animations, the fill tracks the
       segment's own view timeline through a line at the middle of the
       scrollport, and the marker lights up as that line crosses it. */
    @supports (animation-timeline: view()) {
      .scroll .track {
        view-timeline-name: --moul-timeline-track;
        view-timeline-axis: block;
        view-timeline-inset: 50% 49%;
      }

      .scroll .fill {
        animation: moul-timeline-fill linear both;
        animation-timeline: --moul-timeline-track;
        animation-range: cover 0% cover 100%;
      }

      .scroll:not(.has-status) .marker {
        animation: moul-timeline-reach linear both;
        animation-timeline: view(block 50% 49%);
        animation-range: cover 0% cover 50%;
      }
    }

    @keyframes moul-timeline-fill {
      from {
        transform: scaleY(0);
      }
      to {
        transform: scaleY(1);
      }
    }

    @keyframes moul-timeline-reach {
      to {
        border-color: var(--_tone-solid-bg);
        color: var(--_tone-solid-bg);
      }
    }

    /* Marker and heading ------------------------------------------------ */

    .aside {
      grid-column: 1 / span 2;
      display: grid;
      grid-template-columns: var(--_rail) minmax(0, 1fr);
      column-gap: var(--_col-gap);
      align-items: start;
    }

    .marker {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      justify-self: center;
      inline-size: var(--_marker);
      block-size: var(--_marker);
      margin-block-start: var(--_marker-top);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-surface);
      color: var(--color-muted);
      transition:
        background-color var(--duration-base, 250ms) var(--ease-out, ease-out),
        border-color var(--duration-base, 250ms) var(--ease-out, ease-out),
        color var(--duration-base, 250ms) var(--ease-out, ease-out);
    }

    .dot {
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-radius: inherit;
      background: currentColor;
    }

    .check {
      inline-size: 0.875rem;
      block-size: 0.875rem;
    }

    ::slotted([slot='marker']) {
      display: grid;
      place-items: center;
      max-inline-size: 100%;
      max-block-size: 100%;
    }

    .scroll:not(.has-status) .marker[data-reached] {
      border-color: var(--_tone-solid-bg);
      color: var(--_tone-solid-bg);
    }

    :host([status='complete']) .marker {
      border-color: transparent;
      background: var(--_tone-solid-bg);
      color: var(--_tone-solid-fg);
    }

    :host([status='current']) .marker {
      border: 2px solid var(--_tone-solid-bg);
      color: var(--_tone-solid-bg);
    }

    :host([status='current']) .marker::after {
      content: '';
      position: absolute;
      inset: -5px;
      border: 2px solid var(--_tone-solid-bg);
      border-radius: inherit;
      opacity: 0;
      animation: moul-timeline-pulse 2.4s var(--ease-out, ease-out) infinite;
    }

    @keyframes moul-timeline-pulse {
      from {
        opacity: 0.55;
        transform: scale(0.85);
      }
      to {
        opacity: 0;
        transform: scale(1.35);
      }
    }

    :host([status='upcoming']) .marker {
      border-style: dashed;
    }

    /* A compact marker without an icon is the dot itself. */
    .compact:not(.has-marker) .marker {
      border: 0;
      background: currentColor;
    }

    .compact:not(.has-marker) .marker .dot {
      display: none;
    }

    :host([status='complete']) .compact:not(.has-marker) .marker,
    :host([status='current']) .compact:not(.has-marker) .marker {
      background: var(--_tone-solid-bg);
      box-shadow: 0 0 0 3px var(--_tone-soft-bg);
    }

    :host([status='complete']) .compact:not(.has-marker) .marker {
      box-shadow: none;
    }

    :host([status='current']) .compact .marker::after {
      inset: -4px;
      border-width: 1.5px;
    }

    :host([status='upcoming']) .compact:not(.has-marker) .marker {
      border: 1.5px dashed var(--color-muted);
      background: var(--color-surface);
    }

    .heading {
      grid-column: 2;
      min-inline-size: 0;
    }

    .title {
      color: var(--color-fg);
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-xl, 1.75rem);
    }

    .meta {
      color: var(--color-fg-subtle);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .compact .heading {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: var(--spacing-2, 0.5rem);
    }

    .compact .title {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .compact .meta {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    :host([status='upcoming']) .title {
      color: var(--color-fg-subtle);
    }

    .content {
      grid-column: 2;
      min-inline-size: 0;
      margin-block-start: var(--spacing-3, 0.75rem);
    }

    .compact .content {
      margin-block-start: var(--spacing-1, 0.25rem);
      color: var(--color-fg-subtle);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .empty .content {
      display: none;
    }

    /* The content box sets the spacing; the content's own outer margins would add to it. */
    .content ::slotted(:first-child) {
      margin-block-start: 0;
    }

    .content ::slotted(:last-child) {
      margin-block-end: 0;
    }

    /* A wide, roomy timeline puts the heading in its own column and keeps
       it, with the marker, stuck to the top while the content scrolls by. */
    @container (min-width: 40rem) {
      .comfortable {
        grid-template-columns:
          var(--_rail) var(--moul-timeline-heading-width, 12rem)
          minmax(0, 1fr);
      }

      .comfortable .aside {
        position: sticky;
        inset-block-start: var(--moul-timeline-sticky-top, var(--spacing-4, 1rem));
        align-self: start;
      }

      .comfortable .content {
        grid-column: 3;
        margin-block-start: 0;
      }
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .marker,
      .status .fill {
        transition: none;
      }

      :host([status='current']) .marker::after {
        animation: none;
      }
    }
  `,
]
