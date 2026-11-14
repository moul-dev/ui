import { css, html, type TemplateResult } from 'lit'
import { type CodeToken, dedent } from '../../utils/highlight'

/**
 * Pieces shared by the elements that show code: `<moul-code-block>`,
 * `<moul-code-comparison>` and the payloads in `<moul-activity-feed>`.
 */

/** One snippet: its code and how to show it. */
export interface CodeSource {
  label: string
  code: string
  language: string
  filename: string
  highlightLines: string
}

/** Payloads longer than this are cut, so one huge value cannot stall the page. */
const MAX_PAYLOAD_CHARS = 50_000

/**
 * A payload (an event's, a tool call's input or output) as display text:
 * formatted JSON when it is JSON or a JSON string, else plain text. Text
 * past 50,000 characters is cut with a note of how much is left out.
 */
export function payloadText(payload: unknown): {
  text: string
  language: string
} {
  let text: string
  let language = 'json'
  try {
    if (typeof payload === 'string') {
      try {
        text = JSON.stringify(JSON.parse(payload), null, 2)
      } catch {
        text = payload
        language = 'text'
      }
    } else {
      text = JSON.stringify(payload, null, 2) ?? String(payload)
    }
  } catch {
    // Circular or otherwise unserialisable.
    text = String(payload)
    language = 'text'
  }
  if (text.length > MAX_PAYLOAD_CHARS) {
    text = `${text.slice(0, MAX_PAYLOAD_CHARS)}\n… (${text.length - MAX_PAYLOAD_CHARS} more characters)`
  }
  return { text, language }
}

/** Renders highlighted tokens as text inside classed spans; plain text stays a bare string. */
export function renderTokens(tokens: CodeToken[]): (TemplateResult | string)[] {
  return tokens.map((token) =>
    token.type
      ? html`<span class="tok-${token.type}">${token.text}</span>`
      : token.text,
  )
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&nbsp;': ' ',
}

/**
 * The source text of a `<template>`: its markup as written, give or take what
 * the HTML parser normalises. Text is unescaped again, and an empty attribute
 * value (`is-open=""`, which is how the parser stores `is-open`) prints as a
 * bare attribute.
 */
function templateSource(template: HTMLTemplateElement): string {
  return template.innerHTML
    .replace(/(<[^>]*?\s[\w:.-]+)=""/g, (match, start: string) =>
      match.startsWith('<!') ? match : start,
    )
    .replace(/&(?:amp|lt|gt|quot|nbsp);/g, (entity) => ENTITIES[entity] ?? '')
}

function isSourceElement(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLTemplateElement ||
    (el instanceof HTMLScriptElement && el.type === 'text/plain')
  )
}

/**
 * Reads the snippets written in an element's light DOM. Every
 * `<script type="text/plain">` or `<template>` child is one snippet, named by
 * its `data-label` and described by `data-language`, `data-filename` and
 * `data-highlight-lines`. With no such child, the element's own text is the
 * one snippet. Code is dedented, so it can sit indented in the markup.
 */
export function readLightSources(host: HTMLElement): CodeSource[] {
  const children = Array.from(host.children).filter(isSourceElement)
  if (children.length === 0) {
    const code = dedent(host.textContent ?? '')
    return code
      ? [{ label: '', code, language: '', filename: '', highlightLines: '' }]
      : []
  }
  return children.map((child) => ({
    label: child.dataset.label ?? '',
    code: dedent(
      child instanceof HTMLTemplateElement
        ? templateSource(child)
        : (child.textContent ?? ''),
    ),
    language: child.dataset.language ?? '',
    filename: child.dataset.filename ?? '',
    highlightLines: child.dataset.highlightLines ?? '',
  }))
}

/** Token colours, from the `--color-code-*` tokens. */
export const codeTokenStyles = css`
  .tok-comment {
    color: var(--color-code-comment);
    font-style: italic;
  }

  .tok-keyword {
    color: var(--color-code-keyword);
  }

  .tok-string {
    color: var(--color-code-string);
  }

  .tok-number,
  .tok-literal {
    color: var(--color-code-number);
  }

  .tok-function,
  .tok-meta {
    color: var(--color-code-function);
  }

  .tok-type,
  .tok-variable {
    color: var(--color-code-type);
  }

  .tok-property {
    color: var(--color-code-property);
  }

  .tok-tag {
    color: var(--color-code-tag);
  }

  .tok-attr {
    color: var(--color-code-attr);
  }

  .tok-operator,
  .tok-punctuation {
    color: var(--color-code-punctuation);
  }

  .tok-inserted {
    color: var(--color-success-soft-fg);
  }

  .tok-deleted {
    color: var(--color-danger-soft-fg);
  }
`

/** A ghost icon button for copying, shared so every code surface's button looks the same. */
export const copyButtonStyles = css`
  .copy-button {
    position: relative;
    display: inline-grid;
    flex-shrink: 0;
    place-items: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md, 0.375rem);
    background: transparent;
    color: var(--color-fg-subtle);
    cursor: pointer;
    transition:
      background-color var(--duration-fast, 150ms) ease,
      color var(--duration-fast, 150ms) ease;
  }

  .copy-button:hover {
    background: var(--color-fill-hover);
    color: var(--color-fg);
  }

  .copy-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 1px;
  }

  .copy-button svg {
    grid-area: 1 / 1;
    width: 1rem;
    height: 1rem;
    transition:
      opacity var(--duration-fast, 150ms) ease,
      scale 200ms var(--ease-out, ease-out);
  }

  .copy-button .icon-check {
    color: var(--color-success-soft-fg);
    opacity: 0;
    scale: 0.6;
  }

  .copy-button[data-copied] .icon-copy {
    opacity: 0;
    scale: 0.6;
  }

  .copy-button[data-copied] .icon-check {
    opacity: 1;
    scale: 1;
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
    .copy-button,
    .copy-button svg {
      transition: none;
    }
  }
`
