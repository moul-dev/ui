import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import type { MoulTree } from '../Tree/Tree'
import type { MoulTreeItem } from '../Tree/TreeItem'
import './FileTree'
import type {
  FileTreeActionDetail,
  FileTreeExpandedChangeDetail,
  FileTreeSelectionChangeDetail,
  MoulFileTree,
} from './FileTree'
import { fileKind } from './icons'

const PATHS = [
  'src/index.ts',
  'src/components/Button.ts',
  'src/components/button.css',
  'README.md',
  'package.json',
  'docs/',
  'src/components/Card10.ts',
  'src/components/Card2.ts',
]

/** Lets the file tree, its inner tree and every item finish their updates. */
async function settle(fileTree: MoulFileTree): Promise<void> {
  for (let round = 0; round < 3; round++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await fileTree.updateComplete
    const tree = innerTree(fileTree)
    await tree?.updateComplete
    await Promise.all(
      Array.from(
        fileTree.shadowRoot?.querySelectorAll('moul-tree-item') ?? [],
        (item) => (item as MoulTreeItem).updateComplete,
      ),
    )
  }
}

async function mount(props: Partial<MoulFileTree> = {}): Promise<MoulFileTree> {
  const fileTree = document.createElement('moul-file-tree')
  Object.assign(fileTree, { files: PATHS, ...props })
  document.body.append(fileTree)
  await settle(fileTree)
  return fileTree
}

const innerTree = (fileTree: MoulFileTree) =>
  fileTree.shadowRoot?.querySelector<MoulTree>('moul-tree') ?? null

const item = (fileTree: MoulFileTree, path: string): MoulTreeItem =>
  fileTree.shadowRoot?.querySelector(
    `moul-tree-item[value="${path}"]`,
  ) as MoulTreeItem

/** The labels of an item's (or the tree's) direct children, in order. */
const childLabels = (parent: Element | null): string[] =>
  Array.from(parent?.children ?? [])
    .filter((child) => child.localName === 'moul-tree-item')
    .map((child) => (child as MoulTreeItem).label)

const row = (el: MoulTreeItem) =>
  el.shadowRoot?.querySelector('[part~="row"]') as HTMLElement

function click(target: HTMLElement, type = 'click', detail = 1): void {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, composed: true, detail }),
  )
}

/** Presses a key on the item focused inside the file tree. */
function press(fileTree: MoulFileTree, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  ;(fileTree.shadowRoot?.activeElement ?? fileTree).dispatchEvent(event)
  return event
}

function record<T>(fileTree: MoulFileTree, type: string): T[] {
  const seen: T[] = []
  fileTree.addEventListener(type, (event) => {
    seen.push((event as CustomEvent<T>).detail)
  })
  return seen
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('<moul-file-tree>', () => {
  it('builds folders from paths: folders first, then files, in natural order', async () => {
    const fileTree = await mount({ expanded: ['src', 'src/components'] })
    expect(customElements.get('moul-file-tree')).toBeDefined()
    expect(childLabels(innerTree(fileTree))).toEqual([
      'docs',
      'src',
      'package.json',
      'README.md',
    ])
    expect(childLabels(item(fileTree, 'src'))).toEqual([
      'components',
      'index.ts',
    ])
    expect(childLabels(item(fileTree, 'src/components'))).toEqual([
      'button.css',
      'Button.ts',
      'Card2.ts',
      'Card10.ts',
    ])
    expect(fileTree.entry('src/components/Button.ts')?.isFolder).toBe(false)
    expect(fileTree.entry('src/components')?.isFolder).toBe(true)
  })

  it('keeps the given order with sort="none"', async () => {
    const fileTree = await mount({ sort: 'none' })
    expect(childLabels(innerTree(fileTree))).toEqual([
      'src',
      'README.md',
      'package.json',
      'docs',
    ])
  })

  it('accepts nested nodes, merged with paths', async () => {
    const fileTree = await mount({
      files: [
        { name: 'src', children: [{ name: 'main.rs', meta: 'M' }] },
        'src/lib.rs',
        { name: 'assets', isFolder: true },
        { name: 'secret.key', isDisabled: true },
      ],
      expanded: ['src'],
    })
    expect(childLabels(item(fileTree, 'src'))).toEqual(['lib.rs', 'main.rs'])
    expect(
      item(fileTree, 'src/main.rs').querySelector('[slot="suffix"]')
        ?.textContent,
    ).toBe('M')
    expect(item(fileTree, 'secret.key').isDisabled).toBe(true)
    // A folder with nothing loaded yet still opens, so its children can be fetched then.
    expect(item(fileTree, 'assets').hasChildren).toBe(true)
    expect(item(fileTree, 'assets').isBranch).toBe(true)
  })

  it('draws a folder icon that opens, and file icons by kind', async () => {
    const fileTree = await mount({ expanded: ['src'] })
    const icon = (path: string) =>
      item(fileTree, path).querySelector('[slot="prefix"]')
    expect(icon('src')?.classList.contains('folder')).toBe(true)
    expect(icon('src/index.ts')?.classList.contains('code')).toBe(true)
    expect(icon('package.json')?.classList.contains('data')).toBe(true)
    expect(icon('README.md')?.classList.contains('doc')).toBe(true)
    const openPath = icon('src')?.querySelectorAll('path').length
    const closedPath = icon('docs')?.querySelectorAll('path').length
    expect(openPath).not.toBe(closedPath)
  })

  it('knows file kinds by extension and by name', () => {
    expect(fileKind('App.tsx')).toBe('code')
    expect(fileKind('index.html')).toBe('markup')
    expect(fileKind('theme.scss')).toBe('style')
    expect(fileKind('bun.lock')).toBe('data')
    expect(fileKind('.env.local')).toBe('data')
    expect(fileKind('logo.svg')).toBe('image')
    expect(fileKind('Dockerfile')).toBe('code')
    expect(fileKind('LICENSE')).toBe('doc')
    expect(fileKind('data.bin')).toBe('file')
  })

  it('selects by path and opens the folders above a selection made in code', async () => {
    const fileTree = await mount()
    fileTree.selectedKey = 'src/components/Button.ts'
    await settle(fileTree)
    expect(fileTree.expanded).toEqual(
      expect.arrayContaining(['src', 'src/components']),
    )
    expect(item(fileTree, 'src').isExpanded).toBe(true)
    expect(item(fileTree, 'src/components/Button.ts').isSelected).toBe(true)
  })

  it('opens and closes everything from code without firing events', async () => {
    const fileTree = await mount()
    const events = record(fileTree, 'expandedchange')
    fileTree.expandAll()
    await settle(fileTree)
    expect(item(fileTree, 'src/components').isExpanded).toBe(true)
    fileTree.collapseAll()
    await settle(fileTree)
    expect(item(fileTree, 'src').isExpanded).toBe(false)
    expect(events).toEqual([])
  })

  it('opens a folder when its row is clicked and reports it by path', async () => {
    const fileTree = await mount()
    const expanded = record<FileTreeExpandedChangeDetail>(
      fileTree,
      'expandedchange',
    )
    const selected = record<FileTreeSelectionChangeDetail>(
      fileTree,
      'selectionchange',
    )
    click(row(item(fileTree, 'src')))
    await settle(fileTree)
    expect(item(fileTree, 'src').isExpanded).toBe(true)
    expect(expanded.map((d) => [d.path, d.isExpanded])).toEqual([['src', true]])
    expect(expanded[0].expanded).toEqual(['src'])
    expect(selected.map((d) => d.path)).toEqual(['src'])
    expect(selected[0].entry?.isFolder).toBe(true)

    click(row(item(fileTree, 'src')))
    await settle(fileTree)
    expect(item(fileTree, 'src').isExpanded).toBe(false)
  })

  it('re-fires the inner tree events once, from the host, with paths', async () => {
    const fileTree = await mount({ expanded: ['src'] })
    const outer: Event[] = []
    document.body.addEventListener('selectionchange', (event) =>
      outer.push(event),
    )
    click(row(item(fileTree, 'src/index.ts')))
    await settle(fileTree)
    expect(outer).toHaveLength(1)
    expect(outer[0].target).toBe(fileTree)
    expect((outer[0] as CustomEvent).detail.path).toBe('src/index.ts')
  })

  it('activates a file on double-click, without toggling a folder twice', async () => {
    const fileTree = await mount()
    const actions = record<FileTreeActionDetail>(fileTree, 'action')
    const src = row(item(fileTree, 'src'))
    click(src, 'click', 1)
    click(src, 'click', 2)
    click(src, 'dblclick', 2)
    await settle(fileTree)
    expect(item(fileTree, 'src').isExpanded).toBe(true)

    const file = row(item(fileTree, 'src/index.ts'))
    click(file, 'click', 1)
    click(file, 'click', 2)
    click(file, 'dblclick', 2)
    await settle(fileTree)
    expect(actions.map((d) => d.path)).toEqual(['src', 'src/index.ts'])
    expect(actions[1].entry.isFolder).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('is a tree named by label with one tab stop', async () => {
      const fileTree = await mount({ label: 'Project files' })
      const tree = innerTree(fileTree)
      expect(tree?.getAttribute('role')).toBe('tree')
      expect(tree?.getAttribute('aria-label')).toBe('Project files')
      const stops = Array.from(
        fileTree.shadowRoot?.querySelectorAll('moul-tree-item') ?? [],
      ).filter((el) => el.getAttribute('tabindex') === '0')
      expect(stops).toHaveLength(1)
      expect(item(fileTree, 'docs').getAttribute('aria-label')).toBe('docs')
      expect(
        item(fileTree, 'docs')
          .querySelector('[slot="prefix"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('moves with the arrow keys and opens folders, through the shadow root', async () => {
      const fileTree = await mount()
      const expanded = record<FileTreeExpandedChangeDetail>(
        fileTree,
        'expandedchange',
      )
      item(fileTree, 'docs').focus()
      press(fileTree, 'ArrowDown')
      expect(fileTree.shadowRoot?.activeElement).toBe(item(fileTree, 'src'))
      press(fileTree, 'ArrowRight')
      await settle(fileTree)
      expect(item(fileTree, 'src').isExpanded).toBe(true)
      expect(expanded.map((d) => d.path)).toEqual(['src'])
      press(fileTree, 'ArrowRight')
      expect(fileTree.shadowRoot?.activeElement).toBe(
        item(fileTree, 'src/components'),
      )
      press(fileTree, 'End')
      expect(fileTree.shadowRoot?.activeElement).toBe(
        item(fileTree, 'README.md'),
      )
    })

    it('fires action on Enter, and preventDefault keeps a folder closed', async () => {
      const fileTree = await mount()
      const actions = record<FileTreeActionDetail>(fileTree, 'action')
      fileTree.addEventListener('action', (event) => event.preventDefault())
      item(fileTree, 'src').focus()
      press(fileTree, 'Enter')
      await settle(fileTree)
      expect(actions.map((d) => d.path)).toEqual(['src'])
      expect(item(fileTree, 'src').isExpanded).toBe(false)
      expect(fileTree.selectedKey).toBe('src')
    })

    it('opens a folder on Enter when nothing cancels it', async () => {
      const fileTree = await mount()
      item(fileTree, 'src').focus()
      press(fileTree, 'Enter')
      await settle(fileTree)
      expect(item(fileTree, 'src').isExpanded).toBe(true)
      expect(fileTree.expanded).toEqual(['src'])
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    beforeEach(() => {
      motion = mockReducedMotion(true)
    })

    afterEach(() => {
      motion.restore()
    })

    it('opens a folder at once', async () => {
      const fileTree = await mount()
      click(row(item(fileTree, 'src')))
      await settle(fileTree)
      const group = item(fileTree, 'src').shadowRoot?.querySelector(
        '[part~="group"]',
      ) as HTMLElement
      expect(group.hidden).toBe(false)
      expect(group.hasAttribute('data-animating')).toBe(false)
      expect(group.style.height).toBe('')
    })
  })

  it('shows the empty slot without files', async () => {
    const fileTree = await mount({ files: [] })
    expect(
      fileTree.shadowRoot?.querySelector('[part="empty"]')?.textContent,
    ).toContain('No files')
  })
})
