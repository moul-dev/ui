/**
 * Moul UI - Compound Sidebar Element Suite Styles
 * Authored with Lit css + resetStyles and CSS design tokens.
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
    :host {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      width: var(--sidebar-width, 260px);
      height: 100%;
      background-color: var(--color-bg-subtle);
      border-inline-end: 1px solid var(--color-border);
      transition: width 0.3s cubic-bezier(0.32, 0.72, 0, 1),
        background-color 0.2s ease,
        border-color 0.2s ease;
    }

    :host([collapsed]) {
      width: var(--sidebar-collapsed-width, 72px);
    }

    :host([layout='sidebar-framed']) {
      margin-block: var(--spacing-3);
      margin-inline-start: var(--spacing-3);
      margin-inline-end: 0;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      height: calc(100% - var(--spacing-3) * 2);
    }

    :host([layout='main-framed']) {
      border-inline-end: 1px solid var(--color-border);
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
    }

    .toggle-button {
      position: absolute;
      bottom: var(--spacing-4);
      right: var(--spacing-4);
      width: var(--spacing-8, 32px);
      height: var(--spacing-8, 32px);
      border-radius: var(--radius-full);
      background-color: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      color: var(--color-fg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      z-index: 10;
      transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
    }

    .toggle-button:hover {
      background-color: var(--color-neutral-100, rgba(0, 0, 0, 0.05));
      color: var(--color-fg);
    }

    :host([collapsed]) .toggle-button {
      right: 50%;
      transform: translateX(50%);
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .toggle-button {
        transition: none !important;
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

    :host([layout='main-framed']) {
      margin: var(--spacing-3);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background-color: var(--color-bg-subtle);
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
      border-radius: var(--radius-md);
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
      border-radius: var(--radius-md);
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
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .brand-subtitle {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
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

    .group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-block: var(--spacing-2);
      padding-inline: var(--spacing-3);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      user-select: none;
      box-sizing: border-box;
      height: var(--spacing-7, 28px);
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: default;
      outline: none;
      border-radius: var(--radius-sm);
      font-family: inherit;
    }

    :host([dense]) .group-header {
      height: var(--spacing-6, 24px);
      padding-block: var(--spacing-1);
      padding-inline: var(--spacing-2);
    }

    :host([collapsible]) .group-header {
      cursor: pointer;
    }

    :host([collapsible]) .group-header:hover {
      background-color: var(--color-neutral-100, rgba(0, 0, 0, 0.05));
      color: var(--color-fg);
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
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host([collapsed]) .chevron {
      transform: rotate(-90deg);
    }

    /* Pure CSS Grid Height Collapse (Requirement 12.7) */
    .group-items {
      display: grid;
      grid-template-rows: 1fr;
      opacity: 1;
      transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.25s ease;
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

    .item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding-block: var(--spacing-2);
      padding-inline: var(--spacing-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      outline: none;
      box-sizing: border-box;
      height: 36px;
      width: 100%;
      transition: background-color 0.15s ease, color 0.15s ease;
      position: relative;
      border: none;
      background: transparent;
      text-align: left;
      font-family: inherit;
    }

    :host([dense]) .item {
      height: 30px;
      padding-block: var(--spacing-1);
      padding-inline: var(--spacing-2);
      gap: var(--spacing-2);
    }

    :host(:not([is-selected]):not([is-disabled])) .item:hover {
      background-color: var(--color-neutral-100, rgba(0, 0, 0, 0.05));
    }

    :host([is-selected]) .item {
      color: var(--color-primary-600, var(--color-primary, #2563eb));
      font-weight: var(--font-weight-semibold, 600);
    }

    .indicator {
      position: absolute;
      inset: 0;
      border-radius: var(--radius-md);
      background-color: var(--color-primary-100, rgba(59, 130, 246, 0.12));
      pointer-events: none;
      z-index: 0;
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
    }

    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .badge {
      font-size: var(--font-size-xs, 0.75rem);
      background-color: var(--color-neutral-200, rgba(0, 0, 0, 0.08));
      padding: 1px 6px;
      border-radius: var(--radius-full);
      margin-inline-start: auto;
      position: relative;
      z-index: 1;
    }

    :host([collapsed]) .item {
      justify-content: center;
      padding-inline: 0;
      width: 36px;
      height: 36px;
      margin-inline: auto;
    }

    :host([collapsed][dense]) .item {
      width: 30px;
      height: 30px;
    }

    :host([collapsed]) .label,
    :host([collapsed]) .badge {
      display: none !important;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }

    :focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
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
      margin-inline: var(--spacing-4);
      height: 1px;
      background-color: var(--color-border-subtle);
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
      padding-block: var(--spacing-4);
      padding-inline: var(--spacing-4);
      box-sizing: border-box;
      margin-top: auto;
      gap: var(--spacing-3);
      min-height: 64px;
      flex-shrink: 0;
      width: 100%;
    }

    :host([show-border]) {
      border-block-start: 1px solid var(--color-border-subtle);
    }

    :host([dense]) {
      min-height: 48px;
      padding-block: var(--spacing-2);
      padding-inline: var(--spacing-3);
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
    :host {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      width: 100%;
      min-width: 0;
      overflow: hidden;
      box-sizing: border-box;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--color-fg);
      cursor: pointer;
      user-select: none;
      padding-block: var(--spacing-1);
      padding-inline: var(--spacing-2);
      transition: background-color 0.15s ease;
    }

    :host(:hover) {
      background-color: var(--color-neutral-100, rgba(0, 0, 0, 0.05));
    }

    :host([dense]) {
      gap: var(--spacing-2);
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
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-email {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }

    .user-action {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-fg-subtle);
      margin-inline-start: auto;
    }

    :host([collapsed]) .user-action {
      display: none !important;
    }
  `,
]
