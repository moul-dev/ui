/**
 * Moul UI - Compound Sidebar Element Suite Styles
 * Authored with Lit css + resetStyles and CSS design tokens.
 *
 * HeroUI look: the off-white page holds a white surface card (the framed aside
 * or the framed main), and rows behave like HeroUI list-box items — rounded,
 * a --color-default wash on hover, and the same neutral fill marks the current page.
 */

import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const sidebarStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg);
      background-color: var(--color-bg);
    }
  `,
]

export const sidebarAsideStyles: CSSResultGroup = [
  resetStyles,
  css`
    /* Unframed fallback: a full-height white rail with a separator hairline. */
    :host {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      width: var(--sidebar-width, 260px);
      height: 100%;
      background-color: var(--color-surface);
      border-inline-end: 1px solid var(--color-separator);
      transition:
        width var(--duration-base, 250ms)
          var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1)),
        background-color 200ms var(--ease-smooth, ease);
    }

    :host([collapsed]) {
      width: var(--sidebar-collapsed-width, 72px);
    }

    /* Sidebar-framed: the aside is a HeroUI card floating on the page. */
    :host([layout='sidebar-framed']) {
      margin-block: var(--spacing-3);
      margin-inline-start: var(--spacing-3);
      margin-inline-end: 0;
      border: none;
      border-radius: var(--radius-surface);
      box-shadow: var(--shadow-surface);
      height: calc(100% - var(--spacing-3) * 2);
    }

    /* Main-framed: the aside sits directly on the page; the main is the card. */
    :host([layout='main-framed']) {
      border: none;
      background-color: transparent;
    }

    .aside {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      box-sizing: border-box;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
    }

    /* Collapse toggle: HeroUI tertiary icon button (sm). */
    .toggle-button {
      position: absolute;
      bottom: var(--spacing-4);
      right: var(--spacing-4);
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      border-radius: var(--radius-full);
      background-color: var(--color-default);
      color: var(--color-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      outline: none;
      transition:
        translate var(--duration-base, 250ms)
          var(--ease-out-fluid, cubic-bezier(0.32, 0.72, 0, 1)),
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .toggle-button:hover {
        background-color: var(--color-default-hover);
        color: var(--color-fg);
      }
    }

    /* scale (not transform) so it composes with the collapsed centering. */
    .toggle-button:active {
      background-color: var(--color-default-hover);
      scale: var(--press-scale, 0.97);
    }

    .toggle-button:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /*
     * Stay pinned to the right edge, which rides the width transition, and nudge into
     * the rail's center with translate. Jumping right to 50% teleported the button
     * across the still-wide rail before the collapse had started.
     */
    :host([collapsed]) .toggle-button {
      translate: calc(
          var(--spacing-4) - (var(--sidebar-collapsed-width, 72px) - 2rem) / 2
        )
        0;
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .toggle-button {
        transition: none !important;
      }

      .toggle-button:active {
        scale: none;
      }
    }
  `,
]

export const sidebarMainStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      overflow: auto;
    }

    /* Main-framed: the content area is a HeroUI card on the page. */
    :host([layout='main-framed']) {
      margin: var(--spacing-3);
      border-radius: var(--radius-surface);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-surface);
      padding: var(--spacing-4);
    }

    :host([layout='sidebar-framed']) {
      padding: var(--spacing-4);
    }

    .main {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
  `,
]

export const sidebarHeaderStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      align-items: center;
      padding: var(--spacing-4);
      min-height: 64px;
      box-sizing: border-box;
      gap: var(--spacing-3);
      flex-shrink: 0;
      width: 100%;
    }

    :host([dense]) {
      min-height: 48px;
      padding: var(--spacing-2) var(--spacing-3);
      gap: var(--spacing-2);
    }

    :host([collapsed]) {
      justify-content: center;
      padding: var(--spacing-3) var(--spacing-2);
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }

    :host([collapsed]) .header {
      justify-content: center;
      gap: 0;
    }
  `,
]

export const sidebarBrandStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      min-width: 0;
      overflow: hidden;
      box-sizing: border-box;
      border-radius: var(--radius-xl);
      text-decoration: none;
      color: var(--color-fg);
      user-select: none;
    }

    :host([dense]) {
      gap: var(--spacing-2);
    }

    :host([collapsed]) {
      justify-content: center;
      gap: 0;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      min-width: 0;
      overflow: hidden;
      color: inherit;
      text-decoration: none;
      border-radius: var(--radius-xl);
    }

    /* Flush ring: the header clips overflow, so an offset ring would be cut. */
    .brand-link:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    :host([collapsed]) .brand-link {
      justify-content: center;
      gap: 0;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    :host([collapsed]) .brand-info {
      display: none !important;
    }

    .brand-title {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .brand-subtitle {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
]

export const sidebarGroupStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      padding-inline: var(--spacing-3);
      padding-block-end: var(--spacing-4);
      gap: var(--spacing-1);
      box-sizing: border-box;
      width: 100%;
    }

    :host([dense]) {
      padding-inline: var(--spacing-2);
      padding-block-end: var(--spacing-2);
    }

    :host([collapsed-sidebar]) {
      padding-inline: var(--spacing-2);
      align-items: center;
    }

    /* Group label: HeroUI list-box section header (text-xs, medium, muted). */
    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2);
      padding-block: var(--spacing-1);
      padding-inline: var(--spacing-2);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      user-select: none;
      box-sizing: border-box;
      height: var(--spacing-7, 1.75rem);
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: default;
      outline: none;
      border-radius: var(--radius-xl);
      font-family: inherit;
      transition:
        background-color 150ms var(--ease-smooth, ease),
        color 150ms var(--ease-smooth, ease);
    }

    :host([dense]) .group-header {
      height: var(--spacing-6, 1.5rem);
      padding-block: 0;
      padding-inline: var(--spacing-2);
    }

    :host([collapsible]) .group-header {
      cursor: pointer;
    }

    @media (hover: hover) {
      :host([collapsible]) .group-header:hover {
        background-color: var(--color-default);
        color: var(--color-fg);
      }
    }

    .group-header:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    :host([collapsed-sidebar]) .group-header {
      display: none;
    }

    .group-title {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .chevron {
      width: var(--spacing-3, 12px);
      height: var(--spacing-3, 12px);
      flex-shrink: 0;
      transition: transform 200ms var(--ease-out, ease-out);
    }

    :host([collapsed]) .chevron {
      transform: rotate(-90deg);
    }

    /* Pure CSS Grid Height Collapse (Requirement 12.7) */
    .group-items {
      display: grid;
      grid-template-rows: 1fr;
      opacity: 1;
      transition:
        grid-template-rows 200ms var(--ease-out, ease-out),
        opacity 200ms var(--ease-out, ease-out);
      width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    :host([collapsed]) .group-items,
    .group-items.collapsed {
      grid-template-rows: 0fr;
      opacity: 0;
      pointer-events: none;
    }

    .group-items-inner {
      min-height: 0;
      overflow: clip;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 4px);
    }

    :host([dense]) .group-items-inner {
      gap: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .group-header,
      .chevron,
      .group-items {
        transition: none !important;
      }
    }
  `,
]

export const sidebarItemStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      position: relative;
      box-sizing: border-box;
      width: 100%;
    }

    /* Row: HeroUI list-box item / ghost button — h-9, rounded-xl, text-sm. */
    .item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding-block: 0;
      padding-inline: var(--spacing-2);
      border-radius: var(--radius-xl);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-normal, 400);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg);
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      box-sizing: border-box;
      height: 2.25rem;
      width: 100%;
      transition:
        background-color 150ms var(--ease-smooth, ease),
        color 150ms var(--ease-smooth, ease),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
      position: relative;
      border: none;
      background: transparent;
      text-align: left;
      font-family: inherit;
    }

    :host([dense]) .item {
      height: 2rem;
      padding-inline: var(--spacing-2);
      gap: var(--spacing-2);
    }

    @media (hover: hover) {
      :host(:not([is-selected]):not([is-disabled])) .item:hover {
        background-color: var(--color-default);
      }
    }

    :host(:not([is-disabled])) .item:active {
      transform: scale(0.98);
    }

    /* Current page: neutral --color-default fill, fg text, medium weight. */
    :host([is-selected]) .item {
      color: var(--color-fg);
      font-weight: var(--font-weight-medium, 500);
    }

    .indicator {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-color: var(--color-default);
      pointer-events: none;
      z-index: 0;
      transition: background-color 150ms var(--ease-smooth, ease);
    }

    @media (hover: hover) {
      :host([is-selected]) .item:hover .indicator {
        background-color: var(--color-default-hover);
      }
    }

    /* Flush ring: group rows clip overflow, so an offset ring would be cut. */
    .item:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--spacing-4, 16px);
      height: var(--spacing-4, 16px);
      position: relative;
      z-index: 1;
      color: var(--color-muted);
      transition: color 150ms var(--ease-smooth, ease);
    }

    :host([is-selected]) .icon {
      color: var(--color-fg);
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      position: relative;
      z-index: 1;
    }

    /* Badge: HeroUI default chip (sm); lifts to the surface on a filled row. */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1.25rem;
      font-variant-numeric: tabular-nums;
      color: var(--color-muted);
      background-color: var(--color-default);
      padding: 0 var(--spacing-2);
      border-radius: var(--radius-2xl);
      margin-inline-start: auto;
      position: relative;
      z-index: 1;
    }

    :host([is-selected]) .badge {
      background-color: var(--color-surface);
    }

    @media (hover: hover) {
      :host(:not([is-disabled])) .item:hover .badge {
        background-color: var(--color-surface);
      }
    }

    :host([collapsed]) .item {
      justify-content: center;
      padding-inline: 0;
      width: 2.25rem;
      height: 2.25rem;
      margin-inline: auto;
    }

    :host([collapsed][dense]) .item {
      width: 2rem;
      height: 2rem;
    }

    :host([collapsed]) .label,
    :host([collapsed]) .badge {
      display: none !important;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      pointer-events: none;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .item,
      .indicator,
      .icon {
        transition: none;
      }

      :host(:not([is-disabled])) .item:active {
        transform: none;
      }
    }
  `,
]

export const sidebarDividerStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
      margin-block: var(--spacing-3);
      margin-inline: var(--spacing-3);
      height: 1px;
      border-radius: var(--radius-sm);
      background-color: var(--color-separator);
      border: none;
    }

    :host([dense]) {
      margin-block: var(--spacing-2);
    }

    :host([collapsed]) {
      margin-inline: var(--spacing-2);
    }
  `,
]

export const sidebarFooterStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: flex;
      align-items: center;
      padding-block: var(--spacing-3);
      padding-inline: var(--spacing-3);
      box-sizing: border-box;
      margin-top: auto;
      gap: var(--spacing-3);
      min-height: 64px;
      flex-shrink: 0;
      width: 100%;
    }

    :host([show-border]) {
      border-block-start: 1px solid var(--color-separator);
    }

    :host([dense]) {
      min-height: 48px;
      padding-block: var(--spacing-2);
      padding-inline: var(--spacing-2);
      gap: var(--spacing-2);
    }

    :host([collapsed]) {
      justify-content: center;
      padding-inline: var(--spacing-2);
      padding-block: var(--spacing-3);
    }

    .footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }

    :host([collapsed]) .footer {
      justify-content: center;
      gap: 0;
    }
  `,
]

export const sidebarUserStyles: CSSResultGroup = [
  resetStyles,
  css`
    /* User row: card-header typography (title + muted description) in a list-box row. */
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      min-width: 0;
      overflow: hidden;
      box-sizing: border-box;
      border-radius: var(--radius-xl);
      text-decoration: none;
      color: var(--color-fg);
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      padding: var(--spacing-2);
      transition:
        background-color 150ms var(--ease-smooth, ease),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      :host(:hover) {
        background-color: var(--color-default);
      }
    }

    :host(:active) {
      transform: scale(0.98);
    }

    :host([dense]) {
      gap: var(--spacing-2);
      padding: var(--spacing-1) var(--spacing-2);
    }

    :host([collapsed]) {
      justify-content: center;
      gap: 0;
      padding-inline: 0;
    }

    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    :host([collapsed]) .user-info {
      display: none !important;
    }

    .user-name {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-email {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-action {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-muted);
      margin-inline-start: auto;
    }

    :host([collapsed]) .user-action {
      display: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }

      :host(:active) {
        transform: none;
      }
    }
  `,
]
