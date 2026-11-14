import { html, nothing, type TemplateResult } from 'lit'
import { imageIcon } from '../../utils/icons'
import type {
  MarkdownBlock,
  MarkdownInline,
  MarkdownListItem,
} from '../../utils/markdown'
import '../CodeBlock/CodeBlock'

/** A source the answer drew on. */
export interface ResponseSource {
  title: string
  /** Opened in a new tab; only `http` and `https` links are made. */
  url?: string
  /** A line under the title: the site, a snippet. */
  description?: string
}

export interface MarkdownViewOptions {
  /** The `aria-level` of a `#` heading; `##` is one deeper. */
  headingLevel: number
  sources: ResponseSource[]
  /** Drawn at the end of the last line while text is still arriving. */
  caret: TemplateResult | typeof nothing
}

const HTTP = /^https?:\/\//i

/** The URL when it is an `http` or `https` link a source chip may open. */
export function sourceHref(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.href
      : null
  } catch {
    return null
  }
}

/** The host name a source chip shows: `docs.moul.dev`. */
export function sourceHost(url: string | undefined): string {
  const href = sourceHref(url)
  if (!href) return ''
  return new URL(href).hostname.replace(/^www\./, '')
}

function renderLink(
  node: Extract<MarkdownInline, { type: 'link' }>,
  options: MarkdownViewOptions,
): unknown {
  const content = renderInlines(node.children, options)
  if (!node.href) return content
  const isExternal = HTTP.test(node.href)
  return html`<a
    class=${node.isImage ? 'image-link' : ''}
    href=${node.href}
    title=${node.title || (node.isImage ? node.href : nothing)}
    target=${isExternal ? '_blank' : nothing}
    rel=${isExternal ? 'noopener noreferrer nofollow' : nothing}
    >${node.isImage ? imageIcon('image-icon') : nothing}${content}</a
  >`
}

function renderCitation(index: number, options: MarkdownViewOptions): unknown {
  const source = options.sources[index - 1]
  const href = sourceHref(source?.url)
  const name = source?.title
    ? `Source ${index}: ${source.title}`
    : `Source ${index}`
  return href
    ? html`<a
        class="citation"
        href=${href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        title=${source?.title ?? nothing}
        aria-label=${name}
        data-source=${index}
        >${index}</a
      >`
    : html`<span class="citation" title=${source?.title ?? nothing} aria-label=${name}
        >${index}</span
      >`
}

export function renderInlines(
  nodes: MarkdownInline[],
  options: MarkdownViewOptions,
): unknown[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text':
        return node.text
      case 'strong':
        return html`<strong>${renderInlines(node.children, options)}</strong>`
      case 'em':
        return html`<em>${renderInlines(node.children, options)}</em>`
      case 'del':
        return html`<del>${renderInlines(node.children, options)}</del>`
      case 'code':
        return html`<code class="inline-code">${node.text}</code>`
      case 'break':
        return html`<br />`
      case 'link':
        return renderLink(node, options)
      case 'citation':
        return renderCitation(node.index, options)
      default:
        return nothing
    }
  })
}

function renderItem(
  item: MarkdownListItem,
  options: MarkdownViewOptions,
  withCaret: boolean,
): TemplateResult {
  const only = item.children.length === 1 ? item.children[0] : undefined
  // A one-paragraph item is "tight": its text sits in the item, not in a <p>.
  const body =
    only?.type === 'paragraph'
      ? html`${renderInlines(only.children, options)}${withCaret ? options.caret : nothing}`
      : renderBlocks(item.children, options, withCaret)
  return item.checked === null
    ? html`<li>${body}</li>`
    : html`<li class="task">
        <input type="checkbox" disabled ?checked=${item.checked} />
        <span>${body}</span>
      </li>`
}

function renderBlock(
  block: MarkdownBlock,
  options: MarkdownViewOptions,
  withCaret: boolean,
): TemplateResult {
  const caret = withCaret ? options.caret : nothing
  switch (block.type) {
    case 'paragraph':
      return html`<p>${renderInlines(block.children, options)}${caret}</p>`
    case 'heading':
      return html`<div
        class="heading h${block.level}"
        role="heading"
        aria-level=${Math.min(6, options.headingLevel + block.level - 1)}
      >
        ${renderInlines(block.children, options)}${caret}
      </div>`
    case 'code':
      return html`<moul-code-block
        class="code"
        language=${block.language}
        .code=${block.code}
        ?data-open=${block.isOpen}
      ></moul-code-block>`
    case 'quote':
      return html`<blockquote>
        ${renderBlocks(block.children, options, withCaret)}
      </blockquote>`
    case 'list': {
      const items = block.items.map((item, i) =>
        renderItem(item, options, withCaret && i === block.items.length - 1),
      )
      return block.ordered
        ? html`<ol start=${block.start === 1 ? nothing : block.start}>${items}</ol>`
        : html`<ul class=${block.items.some((item) => item.checked !== null) ? 'tasks' : ''}>${items}</ul>`
    }
    case 'table':
      return html`<div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${block.head.map(
                  (cell, c) =>
                    html`<th style=${block.align[c] ? `text-align:${block.align[c]}` : nothing}>${renderInlines(cell, options)}</th>`,
                )}
              </tr>
            </thead>
            <tbody>
              ${block.rows.map(
                (row) =>
                  html`<tr>
                    ${row.map(
                      (cell, c) =>
                        html`<td style=${block.align[c] ? `text-align:${block.align[c]}` : nothing}>${renderInlines(cell, options)}</td>`,
                    )}
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
        ${caret}`
    case 'rule':
      return html`<hr />${caret}`
    default:
      return html``
  }
}

/** Renders parsed Markdown as Lit templates: text stays text, so no markup in it ever runs. */
export function renderBlocks(
  blocks: MarkdownBlock[],
  options: MarkdownViewOptions,
  withCaret = false,
): TemplateResult[] {
  return blocks.map((block, i) =>
    renderBlock(block, options, withCaret && i === blocks.length - 1),
  )
}
