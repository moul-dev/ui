import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { live } from 'lit/directives/live.js'
import { repeat } from 'lit/directives/repeat.js'
import '../Tree/Tree'
import { defineElement } from '../../utils/define-element'
import type {
  TreeActionDetail,
  TreeExpandedChangeDetail,
  TreeSelectionChangeDetail,
} from '../Tree/Tree'
import { isItem, type MoulTreeItem } from '../Tree/TreeItem'
import { fileTreeStyles } from './FileTree.styles'
import { type FileKind, fileIcon, fileKind } from './icons'

/** A file or folder given as an object; folders have `children` or `isFolder`. */
export interface FileTreeNode {
  name: string
  children?: FileTreeNode[]
  /** A folder whose children are not loaded yet: it shows a chevron and fires `expandedchange` when opened. */
  isFolder?: boolean
  isDisabled?: boolean
  /** Short text after the name, such as a git status or a size. */
  meta?: string
}

/** A file or folder as the tree holds it, with its full path. */
export interface FileTreeEntry {
  name: string
  /** Folder names joined with `/`, such as `src/components/Button.ts`. */
  path: string
  isFolder: boolean
  children: FileTreeEntry[]
  isDisabled: boolean
  meta: string
  /** What `files` gave for it: the node, the path string, or nothing for a folder implied by a path. */
  source: FileTreeNode | string | null
}

export interface FileTreeSelectionChangeDetail {
  path: string
  entry: FileTreeEntry | null
}

export interface FileTreeExpandedChangeDetail {
  path: string
  entry: FileTreeEntry
  isExpanded: boolean
  /** Every open folder path, after the change. */
  expanded: string[]
}

export interface FileTreeActionDetail {
  path: string
  entry: FileTreeEntry
}

export type FileTreeSort = 'folders-first' | 'none'

const compareNames = (a: FileTreeEntry, b: FileTreeEntry): number =>
  a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  })

/** The folder paths above `path`: `a/b/c.ts` gives `a` and `a/b`. */
function ancestors(path: string): string[] {
  const parts = path.split('/')
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'))
}

/**
 * A file browser: folders and files that open and close, built on
 * `<moul-tree>`. Give `files` a list of paths (`['src/index.ts',
 * 'package.json']`), nested nodes (`{ name, children }`), or both; folders
 * implied by a path are created for you, and a path ending in `/` is an
 * empty folder. Folders come first, then files, each in natural order
 * (`sort="none"` keeps yours). Folders show an open or closed icon and files
 * one for their kind (code, markup, styles, data, docs, images), tinted with
 * the chart colours. Selection and open folders are paths: `selected-key` and
 * `expanded`. Clicking a folder's row opens or closes it; activating a file
 * (double-click or `Enter`) fires `action`.
 *
 * Keyboard and screen readers: the inner `moul-tree` provides everything:
 * `role="tree"` named by `label` (or "Files"), one tab stop that moves with
 * `Arrow Up` and `Arrow Down`, `Arrow Right` and `Arrow Left` to open, close
 * and move between levels, `Home`, `End`, `*` and type-ahead by name. `Enter`
 * activates an item (and opens or closes a folder unless an `action`
 * listener calls `preventDefault()`), `Space` selects it. Each item is a
 * `treeitem` named by the file or folder name alone; the icons are hidden
 * and the `meta` text is not read. Events fire for user actions only;
 * setting `selectedKey` or `expanded` from code does not fire them.
 *
 * Reduced motion: folders open and close at once instead of growing with a
 * spring, the chevron turns and the row colours change without easing, and
 * the guide lines appear without drawing, as in `moul-tree`; the folder icon
 * swaps at once either way.
 *
 * @slot empty - Shown instead of the tree when `files` is empty.
 * @fires selectionchange - The user selected a file or folder; `detail` is `{ path, entry }`.
 * @fires expandedchange - The user opened or closed a folder; `detail` is `{ path, entry, isExpanded, expanded }`. Append a lazy folder's children here.
 * @fires action - The user activated a file or folder (`Enter`, double-click); `detail` is `{ path, entry }`. Cancelable: `preventDefault()` keeps a folder from toggling on `Enter`.
 * @csspart tree - The inner `moul-tree`.
 * @csspart icon - Each file or folder icon.
 * @csspart meta - Each item's meta text.
 * @csspart empty - The box shown when there are no files.
 * @cssprop --moul-file-tree-indent - How far each level is indented. Defaults to `1.25rem`.
 */
export class MoulFileTree extends LitElement {
  static override styles = fileTreeStyles

  static override properties = {
    files: { attribute: false },
    selectedKey: { type: String, reflect: true, attribute: 'selected-key' },
    expanded: { attribute: false },
    sort: { type: String, reflect: true },
    label: { type: String },
  }

  /** Paths, nested nodes, or both. */
  declare files: (string | FileTreeNode)[]
  /** The selected path; `''` for none. Setting it from code opens its folders. */
  declare selectedKey: string
  /** The open folder paths. */
  declare expanded: string[]
  /** `folders-first` (default) sorts folders before files, each by name; `none` keeps the given order. */
  declare sort: FileTreeSort
  /** The tree's accessible name. */
  declare label: string

  private roots: FileTreeEntry[] = []
  private readonly entries = new Map<string, FileTreeEntry>()
  private open = new Set<string>()
  private selectedKeys: string[] = []
  /** Set by a double-click, so the activation it causes does not toggle a folder the clicks already toggled. */
  private isDoubleClick = false

  constructor() {
    super()
    this.files = []
    this.selectedKey = ''
    this.expanded = []
    this.sort = 'folders-first'
    this.label = 'Files'
    // The last listener a double-click reaches, so a flag no activation used never lingers.
    this.addEventListener('dblclick', () => {
      this.isDoubleClick = false
    })
  }

  /** Looks up a file or folder by path. */
  public entry(path: string): FileTreeEntry | null {
    return this.entries.get(path) ?? null
  }

  /** Opens every folder. Fires no event. */
  public expandAll(): void {
    this.expanded = [...this.entries.values()]
      .filter((entry) => entry.isFolder)
      .map((entry) => entry.path)
  }

  /** Closes every folder. Fires no event. */
  public collapseAll(): void {
    this.expanded = []
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('files') || changed.has('sort')) this.build()
    if (!Array.isArray(this.expanded)) this.expanded = []
    if (changed.has('selectedKey')) {
      this.selectedKeys = this.selectedKey ? [this.selectedKey] : []
      // A selection made in code shows itself: its folders open.
      const closed = ancestors(this.selectedKey ?? '').filter(
        (path) => !this.expanded.includes(path),
      )
      if (this.selectedKey && closed.length > 0) {
        this.expanded = [...this.expanded, ...closed]
      }
    }
    this.open = new Set(this.expanded)
  }

  /** Turns `files` into entries, merging folders that several paths share. */
  private build(): void {
    this.entries.clear()
    const roots: FileTreeEntry[] = []
    const childOf = (parent: FileTreeEntry | null) =>
      parent ? parent.children : roots

    const add = (
      parent: FileTreeEntry | null,
      name: string,
      isFolder: boolean,
      source: FileTreeNode | string | null,
    ): FileTreeEntry => {
      const path = parent ? `${parent.path}/${name}` : name
      const existing = this.entries.get(path)
      if (existing) {
        // A folder named again, by a path or a node, keeps its first entry.
        if (isFolder) existing.isFolder = true
        if (source && typeof source === 'object') {
          existing.source = source
          existing.isDisabled = !!source.isDisabled
          existing.meta = source.meta ?? existing.meta
        }
        return existing
      }
      const node = source && typeof source === 'object' ? source : null
      const entry: FileTreeEntry = {
        name,
        path,
        isFolder,
        children: [],
        isDisabled: !!node?.isDisabled,
        meta: node?.meta ?? '',
        source,
      }
      this.entries.set(path, entry)
      childOf(parent).push(entry)
      return entry
    }

    const addPath = (raw: string): void => {
      const isFolder = raw.endsWith('/')
      const parts = raw.split('/').filter((part) => part !== '' && part !== '.')
      let parent: FileTreeEntry | null = null
      parts.forEach((part, i) => {
        const isLast = i === parts.length - 1
        parent = add(parent, part, !isLast || isFolder, isLast ? raw : null)
      })
    }

    const addNode = (parent: FileTreeEntry | null, node: FileTreeNode) => {
      if (!node || typeof node.name !== 'string' || !node.name) return
      const isFolder = !!node.isFolder || Array.isArray(node.children)
      const entry = add(parent, node.name, isFolder, node)
      for (const child of node.children ?? []) addNode(entry, child)
    }

    for (const item of Array.isArray(this.files) ? this.files : []) {
      if (typeof item === 'string') addPath(item)
      else addNode(null, item)
    }

    if (this.sort !== 'none') {
      const order = (list: FileTreeEntry[]): void => {
        list.sort(
          (a, b) =>
            Number(b.isFolder) - Number(a.isFolder) || compareNames(a, b),
        )
        for (const entry of list) order(entry.children)
      }
      order(roots)
    }
    this.roots = roots
  }

  private emit<T>(type: string, detail: T, cancelable = false): boolean {
    return this.dispatchEvent(
      new CustomEvent<T>(type, {
        bubbles: true,
        composed: true,
        cancelable,
        detail,
      }),
    )
  }

  private setOpen(entry: FileTreeEntry, isExpanded: boolean): void {
    const isOpen = this.open.has(entry.path)
    if (isOpen === isExpanded) return
    this.expanded = isExpanded
      ? [...this.expanded, entry.path]
      : this.expanded.filter((path) => path !== entry.path)
    this.emit<FileTreeExpandedChangeDetail>('expandedchange', {
      path: entry.path,
      entry,
      isExpanded,
      expanded: [...this.expanded],
    })
  }

  // The inner tree's events are composed, so each is stopped here and
  // re-fired from the host with paths and entries.

  private readonly handleSelection = (
    event: CustomEvent<TreeSelectionChangeDetail>,
  ): void => {
    event.stopPropagation()
    const path = event.detail.selectedKeys[0] ?? ''
    this.selectedKey = path
    this.emit<FileTreeSelectionChangeDetail>('selectionchange', {
      path,
      entry: this.entry(path),
    })
  }

  private readonly handleExpanded = (
    event: CustomEvent<TreeExpandedChangeDetail>,
  ): void => {
    event.stopPropagation()
    const entry = this.entry(event.detail.value)
    if (entry) this.setOpen(entry, event.detail.isExpanded)
  }

  private readonly handleAction = (
    event: CustomEvent<TreeActionDetail>,
  ): void => {
    event.stopPropagation()
    const entry = this.entry(event.detail.value)
    const wasDoubleClick = this.isDoubleClick
    this.isDoubleClick = false
    if (!entry) return
    // The two clicks of a double-click already opened and closed the folder.
    if (wasDoubleClick && entry.isFolder) event.preventDefault()
    const allowed = this.emit<FileTreeActionDetail>(
      'action',
      { path: entry.path, entry },
      true,
    )
    if (!allowed) event.preventDefault()
  }

  /** The item whose row a pointer event went through, and whether it hit the chevron. */
  private hit(event: Event): { item: MoulTreeItem; onToggle: boolean } | null {
    const path = event.composedPath()
    const item = path.find(isItem)
    const root = item?.shadowRoot
    if (!item || !root) return null
    const through = (part: string) =>
      path.includes(root.querySelector(`[part~="${part}"]`) as Element)
    return through('row') ? { item, onToggle: through('toggle') } : null
  }

  /** A click on a folder's row opens or closes it; the tree has already selected it. */
  private readonly handleClick = (event: MouseEvent): void => {
    if (event.detail > 1) return
    const hit = this.hit(event)
    if (!hit || hit.onToggle) return
    const entry = this.entry(hit.item.value)
    if (entry?.isFolder) this.setOpen(entry, !this.open.has(entry.path))
  }

  private readonly handleDoubleClick = {
    handleEvent: (event: MouseEvent): void => {
      const hit = this.hit(event)
      this.isDoubleClick = !!hit && !hit.onToggle
    },
    // Before the tree's own listener turns it into an activation.
    capture: true,
  }

  private renderEntry(entry: FileTreeEntry): unknown {
    const isOpen = this.open.has(entry.path)
    const kind: FileKind = entry.isFolder ? 'folder' : fileKind(entry.name)
    return html`<moul-tree-item
      value=${entry.path}
      label=${entry.name}
      .isExpanded=${live(entry.isFolder && isOpen)}
      ?is-disabled=${entry.isDisabled}
      ?has-children=${entry.isFolder && entry.children.length === 0}
    >
      <span slot="prefix" part="icon" class="icon ${kind}" aria-hidden="true"
        >${fileIcon(kind, isOpen)}</span
      >
      ${
        entry.meta
          ? html`<span slot="suffix" part="meta" class="meta">${entry.meta}</span>`
          : nothing
      }
      ${
        entry.isFolder
          ? repeat(
              entry.children,
              (child) => child.path,
              (child) => this.renderEntry(child),
            )
          : nothing
      }
    </moul-tree-item>`
  }

  protected override render() {
    if (this.roots.length === 0) {
      return html`<div part="empty" class="empty">
        <slot name="empty">No files</slot>
      </div>`
    }
    return html`<div class="frame" @dblclick=${this.handleDoubleClick}>
      <moul-tree
        part="tree"
        selection-mode="single"
        label=${this.label}
        .selectedKeys=${this.selectedKeys}
        @selectionchange=${this.handleSelection}
        @expandedchange=${this.handleExpanded}
        @action=${this.handleAction}
        @click=${this.handleClick}
      >
        ${repeat(
          this.roots,
          (entry) => entry.path,
          (entry) => this.renderEntry(entry),
        )}
      </moul-tree>
    </div>`
  }
}

defineElement('moul-file-tree', MoulFileTree)

declare global {
  interface HTMLElementTagNameMap {
    'moul-file-tree': MoulFileTree
  }
}
