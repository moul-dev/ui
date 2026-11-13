import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Tree'
import type { MoulTree } from './Tree'
import type { MoulTreeItem } from './TreeItem'

/** Lets the mutation observer, the tree and its items finish their updates. */
async function settle(tree: MoulTree): Promise<void> {
  for (let round = 0; round < 3; round++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await tree.updateComplete
    await Promise.all(
      Array.from(tree.querySelectorAll('moul-tree-item'), (item) => {
        return item.updateComplete
      }),
    )
  }
}

async function mount(template: unknown): Promise<MoulTree> {
  const tree = await fixture<MoulTree>(template)
  await settle(tree)
  return tree
}

const files = (mode = 'single') => html`
  <moul-tree label="Files" selection-mode=${mode}>
    <moul-tree-item value="src" label="src" is-expanded>
      <moul-tree-item value="components" label="components">
        <moul-tree-item value="button.ts" label="button.ts"></moul-tree-item>
      </moul-tree-item>
      <moul-tree-item value="index.ts" label="index.ts"></moul-tree-item>
    </moul-tree-item>
    <moul-tree-item value="docs" label="docs" has-children></moul-tree-item>
    <moul-tree-item value="readme" label="README.md"></moul-tree-item>
  </moul-tree>
`

const item = (tree: MoulTree, value: string): MoulTreeItem =>
  tree.querySelector(`moul-tree-item[value="${value}"]`) as MoulTreeItem

const part = (el: MoulTreeItem, name: string): HTMLElement =>
  el.shadowRoot?.querySelector(`[part~="${name}"]`) as HTMLElement

/** Presses a key on the focused item, the way a keyboard would. */
function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init,
  })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  return event
}

function click(target: HTMLElement, type = 'click', detail = 1): void {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, composed: true, detail }),
  )
}

const focused = () => (document.activeElement as MoulTreeItem | null)?.value

function record<T>(tree: MoulTree, type: string): T[] {
  const details: T[] = []
  tree.addEventListener(type, (event) =>
    details.push((event as CustomEvent<T>).detail),
  )
  return details
}

const aria = (el: Element, ...names: string[]) =>
  names.map((name) => el.getAttribute(name))

describe('<moul-tree> and <moul-tree-item>', () => {
  describe('roles and ARIA', () => {
    it('puts the tree roles in light DOM with levels, set sizes and positions', async () => {
      const tree = await mount(files())
      expect(tree.getAttribute('role')).toBe('tree')
      expect(tree.getAttribute('aria-label')).toBe('Files')
      expect(tree.hasAttribute('aria-multiselectable')).toBe(false)

      const levels = ['src', 'components', 'button.ts', 'index.ts', 'docs']
      expect(
        levels.map((value) =>
          aria(
            item(tree, value),
            'role',
            'aria-level',
            'aria-setsize',
            'aria-posinset',
          ),
        ),
      ).toEqual([
        ['treeitem', '1', '3', '1'],
        ['treeitem', '2', '2', '1'],
        ['treeitem', '3', '1', '1'],
        ['treeitem', '2', '2', '2'],
        ['treeitem', '1', '3', '2'],
      ])
      expect(aria(item(tree, 'readme'), 'aria-level', 'aria-posinset')).toEqual(
        ['1', '3'],
      )
    })

    it('sets aria-expanded on branches only, has-children included', async () => {
      const tree = await mount(files())
      expect(item(tree, 'src').getAttribute('aria-expanded')).toBe('true')
      expect(item(tree, 'components').getAttribute('aria-expanded')).toBe(
        'false',
      )
      expect(item(tree, 'docs').getAttribute('aria-expanded')).toBe('false')
      expect(item(tree, 'readme').hasAttribute('aria-expanded')).toBe(false)
      expect(item(tree, 'button.ts').hasAttribute('aria-expanded')).toBe(false)
    })

    it('wraps the children in a role="group" container', async () => {
      const tree = await mount(files())
      const group = part(item(tree, 'src'), 'group')
      expect(group.getAttribute('role')).toBe('group')
      expect(group.hidden).toBe(false)
      // Branches open on first render without animating.
      expect(group.hasAttribute('data-animating')).toBe(false)
      expect(part(item(tree, 'components'), 'group').hidden).toBe(true)
    })

    it('marks aria-selected as the selection mode asks, and aria-disabled', async () => {
      const tree = await mount(html`
        <moul-tree selection-mode="multiple">
          <moul-tree-item value="a" label="A" is-selected></moul-tree-item>
          <moul-tree-item value="b" label="B" is-disabled></moul-tree-item>
          <moul-tree-item value="c" label="C"></moul-tree-item>
        </moul-tree>
      `)
      const selected = () =>
        ['a', 'b', 'c'].map((v) => item(tree, v).getAttribute('aria-selected'))
      // Multiple: every selectable item says true or false.
      expect(tree.getAttribute('aria-multiselectable')).toBe('true')
      expect(selected()).toEqual(['true', null, 'false'])
      expect(item(tree, 'b').getAttribute('aria-disabled')).toBe('true')
      expect(item(tree, 'a').hasAttribute('aria-disabled')).toBe(false)

      // Single: only the selected item carries aria-selected.
      tree.selectionMode = 'single'
      await settle(tree)
      expect(tree.hasAttribute('aria-multiselectable')).toBe(false)
      expect(selected()).toEqual(['true', null, null])

      // None: no selection at all.
      tree.selectionMode = 'none'
      await settle(tree)
      expect(selected()).toEqual([null, null, null])
      expect(item(tree, 'a').isSelected).toBe(false)
    })

    it('names each item from its own label, never its descendants', async () => {
      const tree = await mount(html`
        <moul-tree aria-label="Project">
          <moul-tree-item value="src" label="src" is-expanded>
            <moul-tree-item value="a" label="a.ts"></moul-tree-item>
          </moul-tree-item>
          <moul-tree-item value="rich" is-expanded>
            <span slot="label"><b>Rich</b>  label</span>
            <span slot="suffix">2</span>
            <moul-tree-item value="b" label="b.ts"></moul-tree-item>
          </moul-tree-item>
          <moul-tree-item value="own" label="own" aria-label="Custom name">
            <moul-tree-item value="c" label="c.ts"></moul-tree-item>
          </moul-tree-item>
        </moul-tree>
      `)
      expect(tree.getAttribute('aria-label')).toBe('Project')
      expect(item(tree, 'src').getAttribute('aria-label')).toBe('src')
      expect(item(tree, 'rich').getAttribute('aria-label')).toBe('Rich label')
      expect(item(tree, 'own').getAttribute('aria-label')).toBe('Custom name')
      expect(item(tree, 'b').getAttribute('aria-label')).toBe('b.ts')

      // Renaming, in the attribute or in the slotted text, renames the item.
      item(tree, 'src').label = 'source'
      const bold = tree.querySelector('b') as HTMLElement
      ;(bold.firstChild as Text).data = 'Richer'
      await settle(tree)
      expect(item(tree, 'src').getAttribute('aria-label')).toBe('source')
      expect(item(tree, 'rich').getAttribute('aria-label')).toBe('Richer label')
    })

    it('gives dynamically added items their level, set size and position', async () => {
      const tree = await mount(files())
      const extra = document.createElement('moul-tree-item')
      extra.value = 'utils'
      extra.label = 'utils'
      extra.innerHTML =
        '<moul-tree-item value="math.ts" label="math.ts"></moul-tree-item>'
      item(tree, 'src').append(extra)
      await settle(tree)

      expect(
        aria(extra, 'aria-level', 'aria-setsize', 'aria-posinset'),
      ).toEqual(['2', '3', '3'])
      expect(item(tree, 'components').getAttribute('aria-setsize')).toBe('3')
      expect(aria(item(tree, 'math.ts'), 'aria-level', 'aria-label')).toEqual([
        '3',
        'math.ts',
      ])
      expect(extra.getAttribute('tabindex')).toBe('-1')

      item(tree, 'readme').remove()
      await settle(tree)
      expect(item(tree, 'docs').getAttribute('aria-setsize')).toBe('2')
    })
  })

  describe('keyboard', () => {
    it('has one tab stop, on the first selected item or else the first item', async () => {
      const tree = await mount(files())
      const stops = () =>
        Array.from(tree.querySelectorAll('[tabindex="0"]'), (el) =>
          el.getAttribute('value'),
        )
      expect(stops()).toEqual(['src'])
      expect(item(tree, 'readme').getAttribute('tabindex')).toBe('-1')

      const selected = await mount(html`
        <moul-tree>
          <moul-tree-item value="a" label="A"></moul-tree-item>
          <moul-tree-item value="b" label="B" is-selected></moul-tree-item>
        </moul-tree>
      `)
      expect(selected.selectedKeys).toEqual(['b'])
      expect(item(selected, 'b').getAttribute('tabindex')).toBe('0')
      expect(item(selected, 'a').getAttribute('tabindex')).toBe('-1')
    })

    it('moves through visible items with the arrows, Home and End, without wrapping', async () => {
      const tree = await mount(files())
      item(tree, 'src').focus()
      const path: (string | undefined)[] = []
      for (let n = 0; n < 5; n++) {
        press('ArrowDown')
        path.push(focused())
      }
      // "components" is closed, so "button.ts" is skipped; the end does not wrap.
      expect(path).toEqual([
        'components',
        'index.ts',
        'docs',
        'readme',
        'readme',
      ])
      expect(item(tree, 'readme').getAttribute('tabindex')).toBe('0')
      expect(item(tree, 'src').getAttribute('tabindex')).toBe('-1')

      press('ArrowUp')
      expect(focused()).toBe('docs')
      press('Home')
      expect(focused()).toBe('src')
      press('ArrowUp')
      expect(focused()).toBe('src')
      const end = press('End')
      expect(focused()).toBe('readme')
      expect(end.defaultPrevented).toBe(true)
    })

    it('opens with Arrow Right, then moves to the first child', async () => {
      const tree = await mount(files())
      const changes = record<{ value: string; isExpanded: boolean }>(
        tree,
        'expandedchange',
      )
      item(tree, 'components').focus()
      press('ArrowRight')
      await settle(tree)
      expect(item(tree, 'components').isExpanded).toBe(true)
      expect(item(tree, 'components').getAttribute('aria-expanded')).toBe(
        'true',
      )
      expect(focused()).toBe('components')
      expect(changes).toMatchObject([{ value: 'components', isExpanded: true }])

      press('ArrowRight')
      expect(focused()).toBe('button.ts')
      press('ArrowRight')
      expect(focused()).toBe('button.ts')
      expect(changes).toHaveLength(1)
    })

    it('closes with Arrow Left, then moves to the parent', async () => {
      const tree = await mount(files())
      const changes = record<{ value: string; isExpanded: boolean }>(
        tree,
        'expandedchange',
      )
      item(tree, 'index.ts').focus()
      press('ArrowLeft')
      expect(focused()).toBe('src')
      press('ArrowLeft')
      await settle(tree)
      expect(item(tree, 'src').isExpanded).toBe(false)
      expect(changes).toMatchObject([{ value: 'src', isExpanded: false }])
      press('ArrowLeft')
      expect(focused()).toBe('src')
      press('ArrowDown')
      expect(focused()).toBe('docs')
    })

    it('mirrors Arrow Left and Arrow Right under dir="rtl"', async () => {
      // happy-dom does not map dir="rtl" to the direction property, so set both.
      const wrapper = await fixture<HTMLElement>(
        html`<div dir="rtl" style="direction: rtl">${files()}</div>`,
      )
      const tree = wrapper.querySelector('moul-tree') as MoulTree
      await settle(tree)
      item(tree, 'components').focus()
      press('ArrowLeft')
      expect(item(tree, 'components').isExpanded).toBe(true)
      press('ArrowRight')
      expect(item(tree, 'components').isExpanded).toBe(false)
      press('ArrowRight')
      expect(focused()).toBe('src')
    })

    it('opens every sibling branch with *', async () => {
      const tree = await mount(html`
        <moul-tree>
          <moul-tree-item value="a" label="A">
            <moul-tree-item value="a1" label="A1"></moul-tree-item>
          </moul-tree-item>
          <moul-tree-item value="b" label="B">
            <moul-tree-item value="b1" label="B1"></moul-tree-item>
          </moul-tree-item>
          <moul-tree-item value="c" label="C"></moul-tree-item>
          <moul-tree-item value="d" label="D" has-children></moul-tree-item>
        </moul-tree>
      `)
      const changes = record<{ value: string }>(tree, 'expandedchange')
      item(tree, 'c').focus()
      press('*')
      expect(['a', 'b', 'c', 'd'].map((v) => item(tree, v).isExpanded)).toEqual(
        [true, true, false, true],
      )
      expect(changes.map((detail) => detail.value)).toEqual(['a', 'b', 'd'])
      expect(focused()).toBe('c')
    })

    it('moves to the next item whose label starts with the typed letters', async () => {
      vi.useFakeTimers()
      try {
        const tree = await fixture<MoulTree>(html`
          <moul-tree>
            <moul-tree-item value="alpha" label="Alpha"></moul-tree-item>
            <moul-tree-item value="beta" label="Beta"></moul-tree-item>
            <moul-tree-item value="bravo" label="Bravo"></moul-tree-item>
            <moul-tree-item value="charlie" label="Charlie"></moul-tree-item>
          </moul-tree>
        `)
        await tree.updateComplete
        item(tree, 'alpha').focus()
        press('b')
        expect(focused()).toBe('beta')
        press('b')
        expect(focused()).toBe('bravo')
        press('B')
        expect(focused()).toBe('beta')
        vi.advanceTimersByTime(600)
        press('c')
        expect(focused()).toBe('charlie')
        vi.advanceTimersByTime(600)
        press('b')
        press('r')
        expect(focused()).toBe('bravo')
        // Modified keys are left to the browser.
        const copy = press('a', { ctrlKey: true })
        expect(copy.defaultPrevented).toBe(false)
        expect(focused()).toBe('bravo')
      } finally {
        vi.useRealTimers()
      }
    })

    it('activates with Enter and selects in single mode', async () => {
      const tree = await mount(files())
      const actions = record<{ value: string; item: MoulTreeItem }>(
        tree,
        'action',
      )
      const selections = record<{ selectedKeys: string[] }>(
        tree,
        'selectionchange',
      )
      item(tree, 'readme').focus()
      press('Enter')
      expect(actions).toHaveLength(1)
      expect(actions[0].value).toBe('readme')
      expect(actions[0].item).toBe(item(tree, 'readme'))
      expect(selections).toEqual([{ selectedKeys: ['readme'] }])
      await settle(tree)
      expect(item(tree, 'readme').isSelected).toBe(true)
      expect(item(tree, 'readme').getAttribute('aria-selected')).toBe('true')
      expect(item(tree, 'docs').hasAttribute('aria-selected')).toBe(false)

      // Activating a branch also toggles it, unless the listener prevents it.
      item(tree, 'components').focus()
      press('Enter')
      expect(item(tree, 'components').isExpanded).toBe(true)
      tree.addEventListener('action', (event) => event.preventDefault(), {
        once: true,
      })
      press('Enter')
      expect(item(tree, 'components').isExpanded).toBe(true)
    })

    it('selects with Space in single mode and toggles in multiple mode', async () => {
      const single = await mount(files())
      const singleChanges = record<{ selectedKeys: string[] }>(
        single,
        'selectionchange',
      )
      item(single, 'docs').focus()
      expect(press(' ').defaultPrevented).toBe(true)
      press(' ')
      press('ArrowDown')
      press(' ')
      expect(singleChanges).toEqual([
        { selectedKeys: ['docs'] },
        { selectedKeys: ['readme'] },
      ])

      const multi = await mount(files('multiple'))
      const multiChanges = record<{ selectedKeys: string[] }>(
        multi,
        'selectionchange',
      )
      const actions = record(multi, 'action')
      item(multi, 'docs').focus()
      press(' ')
      press('ArrowDown')
      press(' ')
      press(' ')
      // Enter activates without selecting in multiple mode.
      press('Enter')
      expect(multiChanges.map((detail) => detail.selectedKeys)).toEqual([
        ['docs'],
        ['docs', 'readme'],
        ['docs'],
      ])
      expect(actions).toHaveLength(1)
      await settle(multi)
      expect(item(multi, 'docs').getAttribute('aria-selected')).toBe('true')
      expect(item(multi, 'readme').getAttribute('aria-selected')).toBe('false')
    })

    it('skips disabled items for selection and activation but still reaches them', async () => {
      const tree = await mount(html`
        <moul-tree>
          <moul-tree-item value="a" label="A"></moul-tree-item>
          <moul-tree-item value="b" label="B" is-disabled>
            <moul-tree-item value="b1" label="B1"></moul-tree-item>
          </moul-tree-item>
        </moul-tree>
      `)
      const actions = record(tree, 'action')
      const selections = record(tree, 'selectionchange')
      item(tree, 'a').focus()
      press('ArrowDown')
      expect(focused()).toBe('b')
      press(' ')
      press('Enter')
      click(part(item(tree, 'b'), 'row'))
      click(part(item(tree, 'b'), 'row'), 'dblclick', 2)
      expect(actions).toHaveLength(0)
      expect(selections).toHaveLength(0)
      expect(tree.selectedKeys).toEqual([])
      // A disabled branch still opens, so its enabled children stay reachable.
      press('ArrowRight')
      expect(item(tree, 'b').isExpanded).toBe(true)
    })

    it('moves focus to a branch that closes over the focused item', async () => {
      const tree = await mount(files())
      item(tree, 'index.ts').focus()
      item(tree, 'src').isExpanded = false
      await settle(tree)
      expect(focused()).toBe('src')
      expect(item(tree, 'src').getAttribute('tabindex')).toBe('0')
      expect(item(tree, 'index.ts').getAttribute('tabindex')).toBe('-1')
    })
  })

  describe('mouse', () => {
    it('toggles a branch from the chevron without selecting it', async () => {
      const tree = await mount(files())
      const changes = record<{ value: string; isExpanded: boolean }>(
        tree,
        'expandedchange',
      )
      const selections = record(tree, 'selectionchange')
      click(part(item(tree, 'components'), 'toggle'))
      expect(item(tree, 'components').isExpanded).toBe(true)
      expect(focused()).toBe('components')
      click(part(item(tree, 'components'), 'toggle'))
      expect(item(tree, 'components').isExpanded).toBe(false)
      expect(changes).toMatchObject([
        { value: 'components', isExpanded: true },
        { value: 'components', isExpanded: false },
      ])
      expect(selections).toHaveLength(0)
    })

    it('selects on a row click, toggles in multiple mode, and activates on a double-click', async () => {
      const tree = await mount(files('multiple'))
      const selections = record<{ selectedKeys: string[] }>(
        tree,
        'selectionchange',
      )
      const actions = record<{ value: string }>(tree, 'action')
      const row = part(item(tree, 'readme'), 'row')
      click(row)
      expect(focused()).toBe('readme')
      // A double-click: the second click is left alone, then `dblclick` activates.
      click(row, 'click', 2)
      click(row, 'dblclick', 2)
      click(row)
      expect(selections.map((detail) => detail.selectedKeys)).toEqual([
        ['readme'],
        [],
      ])
      expect(actions.map((detail) => detail.value)).toEqual(['readme'])
      // The row of a nested item answers for that item, not its parent.
      click(part(item(tree, 'index.ts'), 'row'))
      expect(selections.at(-1)?.selectedKeys).toEqual(['index.ts'])
    })

    it('activates and toggles a branch on a row click in none mode', async () => {
      const tree = await mount(files('none'))
      const actions = record<{ value: string }>(tree, 'action')
      const selections = record(tree, 'selectionchange')
      click(part(item(tree, 'components'), 'row'))
      expect(item(tree, 'components').isExpanded).toBe(true)
      click(part(item(tree, 'readme'), 'row'))
      click(part(item(tree, 'readme'), 'row'), 'dblclick', 2)
      expect(actions.map((detail) => detail.value)).toEqual([
        'components',
        'readme',
      ])
      expect(selections).toHaveLength(0)
      expect(item(tree, 'readme').hasAttribute('aria-selected')).toBe(false)
    })
  })

  describe('selection', () => {
    it('applies selectedKeys set from code without firing selectionchange', async () => {
      const tree = await mount(files('multiple'))
      const selections = record(tree, 'selectionchange')
      tree.selectedKeys = ['docs', 'button.ts']
      await settle(tree)
      expect(item(tree, 'docs').isSelected).toBe(true)
      expect(item(tree, 'docs').hasAttribute('is-selected')).toBe(true)
      expect(item(tree, 'button.ts').getAttribute('aria-selected')).toBe('true')
      expect(item(tree, 'src').getAttribute('aria-selected')).toBe('false')
      expect(selections).toHaveLength(0)

      tree.selectionMode = 'single'
      await settle(tree)
      expect(tree.selectedKeys).toEqual(['docs'])
      expect(item(tree, 'button.ts').isSelected).toBe(false)
    })

    it('adopts is-selected set on an item', async () => {
      const tree = await mount(files())
      item(tree, 'docs').isSelected = true
      await settle(tree)
      expect(tree.selectedKeys).toEqual(['docs'])
      item(tree, 'readme').setAttribute('is-selected', '')
      await settle(tree)
      expect(tree.selectedKeys).toEqual(['readme'])
      expect(item(tree, 'docs').isSelected).toBe(false)
      item(tree, 'readme').isSelected = false
      await settle(tree)
      expect(tree.selectedKeys).toEqual([])
    })

    it('keeps user selection when it races a pending sync', async () => {
      const tree = await mount(files())
      click(part(item(tree, 'docs'), 'row'))
      // The tree has written "docs" but the item has not reflected it yet.
      await tree.updateComplete
      click(part(item(tree, 'readme'), 'row'))
      await settle(tree)
      expect(tree.selectedKeys).toEqual(['readme'])
      expect(item(tree, 'docs').isSelected).toBe(false)
      expect(item(tree, 'readme').isSelected).toBe(true)
    })
  })

  describe('lazy branches', () => {
    it('fires expandedchange for an empty has-children branch and takes children added later', async () => {
      const tree = await mount(files())
      const changes = record<{
        value: string
        isExpanded: boolean
        item: MoulTreeItem
      }>(tree, 'expandedchange')
      tree.addEventListener('expandedchange', (event) => {
        const { item: branch, isExpanded } = (
          event as CustomEvent<{ item: MoulTreeItem; isExpanded: boolean }>
        ).detail
        if (!isExpanded || branch.childElementCount) return
        branch.innerHTML =
          '<moul-tree-item value="guide.md" label="guide.md"></moul-tree-item>' +
          '<moul-tree-item value="api.md" label="api.md"></moul-tree-item>'
      })
      const docs = item(tree, 'docs')
      docs.focus()
      press('ArrowRight')
      expect(changes).toMatchObject([{ value: 'docs', isExpanded: true }])
      expect(changes[0].item).toBe(docs)
      await settle(tree)

      expect(docs.getAttribute('aria-expanded')).toBe('true')
      expect(
        aria(
          item(tree, 'api.md'),
          'aria-level',
          'aria-setsize',
          'aria-posinset',
        ),
      ).toEqual(['2', '2', '2'])
      press('ArrowRight')
      expect(focused()).toBe('guide.md')
    })
  })

  describe('motion', () => {
    let motion: ReducedMotionMock | null = null

    afterEach(() => {
      motion?.restore()
      motion = null
    })

    it('animates the children height when a branch opens', async () => {
      const tree = await mount(files())
      const components = item(tree, 'components')
      components.isExpanded = true
      await components.updateComplete
      const group = part(components, 'group')
      expect(group.hidden).toBe(false)
      expect(group.hasAttribute('data-animating')).toBe(true)
    })

    it('opens and closes at once, with static guide lines, under reduced motion', async () => {
      motion = mockReducedMotion(true)
      const tree = await mount(files())
      const components = item(tree, 'components')
      components.isExpanded = true
      await components.updateComplete
      const group = part(components, 'group')
      expect(group.hidden).toBe(false)
      expect(group.hasAttribute('data-animating')).toBe(false)
      expect(group.style.height).toBe('')
      await settle(tree)
      expect(part(item(tree, 'button.ts'), 'guide').style.clipPath).toBe('')

      components.isExpanded = false
      await components.updateComplete
      expect(group.hidden).toBe(true)
      expect(group.hasAttribute('data-animating')).toBe(false)
    })
  })
})
