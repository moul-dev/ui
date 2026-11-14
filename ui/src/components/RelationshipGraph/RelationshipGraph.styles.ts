import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const relationshipGraphStyles = [
  resetStyles,
  css`
    :host {
      --_rg-up: var(--relationship-graph-upstream-color, var(--color-accent));
      --_rg-down: var(
        --relationship-graph-downstream-color,
        var(--color-chart-2)
      );
      --_rg-ease: var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));

      display: block;
      min-width: 0;
    }

    :host([hidden]) {
      display: none;
    }

    [part~='base'] {
      max-height: var(--relationship-graph-max-height, none);
      overflow: auto;
      overscroll-behavior: contain;
    }

    .graph {
      display: block;
      margin-inline: auto;
      overflow: visible;
      user-select: none;
      -webkit-user-select: none;
    }

    /* Links */

    .link-path,
    .link-flow {
      fill: none;
      stroke-linecap: round;
    }

    .link-path {
      stroke: var(--color-fill-track-strong, var(--color-border));
      stroke-width: 1.5;
    }

    .link.is-reversed .link-path {
      stroke-dasharray: 2 4;
    }

    .link-arrow {
      fill: var(--color-fill-track-strong, var(--color-border));
    }

    .link,
    .link-label,
    .node {
      transition: opacity var(--duration-fast, 150ms) var(--_rg-ease);
    }

    .link-path,
    .link-arrow {
      transition:
        stroke var(--duration-fast, 150ms) var(--_rg-ease),
        fill var(--duration-fast, 150ms) var(--_rg-ease);
    }

    .link.is-upstream,
    .link.is-downstream {
      --_rg-link: var(--_rg-up);
    }

    .link.is-downstream {
      --_rg-link: var(--_rg-down);
    }

    .link.is-upstream .link-path,
    .link.is-downstream .link-path {
      stroke: color-mix(in oklab, var(--_rg-link) 45%, transparent);
      stroke-width: 2;
    }

    .link.is-upstream .link-arrow,
    .link.is-downstream .link-arrow {
      fill: var(--_rg-link);
    }

    .link-flow {
      stroke: var(--_rg-link);
      stroke-width: 2;
      stroke-dasharray: 4 8;
      animation: rg-flow 0.9s linear infinite;
    }

    @keyframes rg-flow {
      to {
        stroke-dashoffset: -12;
      }
    }

    .link.is-dimmed,
    .link-label.is-dimmed {
      opacity: 0.25;
    }

    .link-label rect {
      fill: var(--color-surface);
      stroke: var(--color-border-subtle, var(--color-border));
    }

    .link-label text {
      fill: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      text-anchor: middle;
      dominant-baseline: central;
    }

    /* Nodes */

    .node {
      cursor: pointer;
      outline: none;
    }

    .node-box {
      fill: var(--color-surface);
      stroke: var(--color-border);
      stroke-width: 1;
      transition:
        stroke var(--duration-fast, 150ms) var(--_rg-ease),
        fill var(--duration-fast, 150ms) var(--_rg-ease);
    }

    .node:hover .node-box {
      fill: var(--color-surface-hover, var(--color-surface));
    }

    .node-ring {
      fill: none;
      stroke: var(--color-focus, var(--color-accent));
      stroke-width: 2;
      opacity: 0;
    }

    .node:focus-visible .node-ring {
      opacity: 1;
    }

    .node-dot {
      fill: var(--_node-color);
    }

    .node-label,
    .node-description {
      dominant-baseline: central;
    }

    .node-label {
      fill: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
    }

    .node-description {
      fill: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .node.is-selected .node-box {
      fill: color-mix(in oklab, var(--color-accent) 10%, var(--color-surface));
      stroke: var(--color-accent);
      stroke-width: 2;
    }

    .node.is-root .node-box {
      stroke: var(--color-fg);
      stroke-width: 2;
    }

    .node.is-upstream .node-box {
      fill: color-mix(in oklab, var(--_rg-up) 8%, var(--color-surface));
      stroke: var(--_rg-up);
      stroke-width: 1.5;
    }

    .node.is-downstream .node-box {
      fill: color-mix(in oklab, var(--_rg-down) 10%, var(--color-surface));
      stroke: var(--_rg-down);
      stroke-width: 1.5;
    }

    .node.is-dimmed {
      opacity: 0.35;
    }

    /* Legend, empty state and measuring probes */

    [part~='legend'] {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      margin: var(--spacing-3, 0.75rem) 0 0;
      padding: 0;
      list-style: none;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
    }

    [part~='legend'] li {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
    }

    .legend-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--_node-color);
    }

    [part~='empty'] {
      display: grid;
      place-items: center;
      min-height: 8rem;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-sm, 0.875rem);
    }

    .probe {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      pointer-events: none;
    }

    .probe-label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
    }

    .probe-description {
      font-size: var(--font-size-xs, 0.75rem);
    }

    @media (prefers-reduced-motion: reduce) {
      .link,
      .link-label,
      .node,
      .node-box,
      .link-path,
      .link-arrow {
        transition: none;
      }

      .link-flow {
        display: none;
        animation: none;
      }
    }
  `,
]
