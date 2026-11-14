import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { copyButtonStyles } from '../CodeBlock/code-view'

export const chatStyles = [
  resetStyles,
  copyButtonStyles,
  css`
    :host {
      display: block;
      height: 100%;
      min-height: 24rem;
      min-width: 0;
    }

    .base {
      position: relative;
      display: flex;
      height: 100%;
      min-height: inherit;
      overflow: hidden;
      background: var(--color-bg);
      color: var(--color-fg);
    }

    /* History */

    .sidebar {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      width: var(--chat-sidebar-width, 16rem);
      min-height: 0;
      border-inline-end: 1px solid var(--color-border);
      background: var(--color-bg-subtle);
    }

    [data-narrow] .sidebar {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      z-index: 2;
      max-width: 85%;
      box-shadow: var(--shadow-overlay, var(--shadow-lg));
      animation: moul-chat-sidebar-in 220ms var(--ease-out, ease-out) both;
    }

    :host(:dir(rtl)) [data-narrow] .sidebar {
      animation-name: moul-chat-sidebar-in-rtl;
    }

    @keyframes moul-chat-sidebar-in {
      from {
        translate: -100% 0;
      }
      to {
        translate: 0 0;
      }
    }

    @keyframes moul-chat-sidebar-in-rtl {
      from {
        translate: 100% 0;
      }
      to {
        translate: 0 0;
      }
    }

    .backdrop {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: var(--color-overlay);
      animation: moul-chat-fade-in 220ms var(--ease-out, ease-out) both;
    }

    @keyframes moul-chat-fade-in {
      from {
        opacity: 0;
      }
    }

    .sidebar-top {
      padding: var(--spacing-2, 0.5rem);
    }

    .new-chat,
    .conversation {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      width: 100%;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border: 0;
      border-radius: var(--radius-md, 0.5rem);
      background: transparent;
      color: var(--color-fg);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: start;
      cursor: pointer;
      transition: background-color var(--duration-fast, 150ms) ease;
    }

    .new-chat {
      font-weight: var(--font-weight-medium, 500);
    }

    .new-chat svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .new-chat:hover,
    .conversation:hover {
      background: var(--color-fill-hover);
    }

    .conversation[aria-current='true'] {
      background: var(--color-fill-pressed, var(--color-fill-hover));
      font-weight: var(--font-weight-medium, 500);
    }

    .new-chat:focus-visible,
    .conversation:focus-visible,
    .sidebar-toggle:focus-visible,
    .suggestion:focus-visible,
    .jump:focus-visible,
    .file:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    .conversation {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .conversations {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 0 var(--spacing-2, 0.5rem) var(--spacing-2, 0.5rem);
      scrollbar-width: thin;
    }

    .group-label {
      margin: 0;
      padding: var(--spacing-3, 0.75rem) var(--spacing-3, 0.75rem) var(--spacing-1, 0.25rem);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg-subtle);
    }

    .conversation-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .no-history {
      margin: 0;
      padding: var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle);
    }

    /* Conversation */

    .main {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }

    .header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-height: 3rem;
      padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
      border-bottom: 1px solid var(--color-border);
    }

    .sidebar-toggle {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-md, 0.5rem);
      background: transparent;
      color: var(--color-fg-subtle);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease;
    }

    .sidebar-toggle:hover {
      background: var(--color-fill-hover);
      color: var(--color-fg);
    }

    .sidebar-toggle svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    :host(:dir(rtl)) .sidebar-toggle svg {
      scale: -1 1;
    }

    .title {
      flex: 1;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-sm, 1.25rem);
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
    }

    .messages:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    .thread {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6, 1.5rem);
      max-width: var(--chat-max-width, 48rem);
      min-height: 100%;
      margin: 0 auto;
      padding: var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
    }

    .message {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .message.user {
      align-self: flex-end;
      align-items: flex-end;
      gap: var(--spacing-1, 0.25rem);
      max-width: min(85%, 36rem);
    }

    .bubble {
      padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      border-radius: var(--radius-2xl, 1.25rem);
      background: var(--color-surface-secondary, var(--color-bg-subtle));
      color: var(--color-fg);
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .message-actions {
      display: flex;
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) ease;
    }

    .message:hover .message-actions,
    .message:focus-within .message-actions {
      opacity: 1;
    }

    @media (hover: none) {
      .message-actions {
        opacity: 1;
      }
    }

    .message.assistant {
      gap: var(--spacing-3, 0.75rem);
    }

    .thinking {
      align-self: flex-start;
    }

    .message-files {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--spacing-2, 0.5rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .file {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      max-width: 15rem;
      padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem) var(--spacing-1, 0.25rem)
        var(--spacing-1, 0.25rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--color-surface);
      color: var(--color-fg);
      text-decoration: none;
    }

    a.file:hover {
      background: var(--color-surface-hover);
    }

    .file-thumb {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-md, 0.5rem);
      background: var(--color-bg-subtle);
      color: var(--color-fg-subtle);
      overflow: hidden;
    }

    .file-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-thumb svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .file-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.3;
    }

    .file-name,
    .file-meta {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: var(--font-size-xs, 0.75rem);
    }

    .file-name {
      font-weight: var(--font-weight-medium, 500);
    }

    .file-meta {
      color: var(--color-fg-subtle);
    }

    /* Empty */

    .empty {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-6, 1.5rem);
      padding-block: var(--spacing-8, 2rem);
    }

    .greeting {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
    }

    .greeting-mark {
      display: grid;
      place-items: center;
      color: var(--color-accent);
    }

    .greeting-mark svg {
      width: 1.75rem;
      height: 1.75rem;
    }

    .greeting-text {
      margin: 0;
      font-size: var(--font-size-2xl, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: 1.25;
      text-align: center;
    }

    .suggestions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      gap: var(--spacing-2, 0.5rem);
      width: 100%;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .suggestion {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      height: 100%;
      padding: var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--color-surface);
      color: var(--color-fg);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: start;
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        border-color var(--duration-fast, 150ms) ease;
    }

    .suggestion:hover:not(:disabled) {
      background: var(--color-surface-hover);
    }

    .suggestion:disabled {
      cursor: not-allowed;
      opacity: var(--disabled-opacity, 0.5);
    }

    .suggestion-label {
      font-weight: var(--font-weight-medium, 500);
    }

    .suggestion-description {
      color: var(--color-fg-subtle);
    }

    /* Composer */

    .composer-area {
      position: relative;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      width: 100%;
      max-width: var(--chat-max-width, 48rem);
      margin: 0 auto;
      padding: 0 var(--spacing-4, 1rem) var(--spacing-4, 1rem);
    }

    .jump {
      position: absolute;
      bottom: calc(100% + var(--spacing-2, 0.5rem));
      left: 50%;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-bg-elevated, var(--color-surface));
      color: var(--color-fg);
      font: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      box-shadow: var(--shadow-md);
      translate: -50% 0;
      cursor: pointer;
      animation: moul-chat-jump-in 200ms var(--ease-out, ease-out) both;
    }

    .jump svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    @keyframes moul-chat-jump-in {
      from {
        opacity: 0;
        translate: -50% 4px;
      }
    }

    ::slotted([slot='footer']) {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-fg-subtle);
      text-align: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      [data-narrow] .sidebar,
      .backdrop,
      .jump {
        animation: none;
      }

      .new-chat,
      .conversation,
      .sidebar-toggle,
      .suggestion,
      .message-actions {
        transition: none;
      }
    }
  `,
]
