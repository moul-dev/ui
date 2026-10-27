import fs from 'node:fs'
import { resolve } from 'node:path'
import { LitElement } from 'lit'
import { createServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toastQueue } from '../index'
import { MoulSandbox } from '../sandbox'
import { defineElement } from '../utils/define-element'

async function awaitSandboxUpdate(sandbox: MoulSandbox): Promise<void> {
  await sandbox.updateComplete
  if (sandbox.shadowRoot) {
    const children = Array.from(sandbox.shadowRoot.querySelectorAll('*'))
    await Promise.all(
      children.map((child) => {
        if ('updateComplete' in child && (child as LitElement).updateComplete) {
          return (child as LitElement).updateComplete
        }
        return Promise.resolve()
      }),
    )
  }
}

describe('Adversarial Challenge: Pure Lit Sandbox (ui/src/sandbox.ts)', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    document.documentElement.dataset.theme = 'dark'
    document.documentElement.classList.add('dark')
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  describe('Suite 1: DOM Instantiation & Element Lifecycle Contracts', () => {
    it('instantiates <moul-sandbox> in DOM via document.createElement without errors', async () => {
      const sandbox = document.createElement('moul-sandbox') as MoulSandbox
      container.appendChild(sandbox)
      await awaitSandboxUpdate(sandbox)

      expect(sandbox).toBeInstanceOf(MoulSandbox)
      expect(sandbox).toBeInstanceOf(LitElement)
      expect(sandbox.shadowRoot).not.toBeNull()
      expect(sandbox.shadowRoot?.mode).toBe('open')
    })

    it('verifies customElements registry and tag map augmentation', () => {
      const registeredCtor = customElements.get('moul-sandbox')
      expect(registeredCtor).toBe(MoulSandbox)
    })

    it('idempotently handles re-registration via defineElement without throwing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => {
        defineElement('moul-sandbox', MoulSandbox)
      }).not.toThrow()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered'),
      )
      expect(customElements.get('moul-sandbox')).toBe(MoulSandbox)
    })

    it('survives rapid connect/disconnect DOM lifecycle cycles without errors or leaks', async () => {
      const sandbox = document.createElement('moul-sandbox') as MoulSandbox

      for (let i = 0; i < 10; i++) {
        container.appendChild(sandbox)
        await awaitSandboxUpdate(sandbox)
        expect(sandbox.isConnected).toBe(true)

        container.removeChild(sandbox)
        expect(sandbox.isConnected).toBe(false)
      }

      // Reconnect and verify it still functions
      container.appendChild(sandbox)
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isConnected).toBe(true)
      expect(sandbox.shadowRoot?.querySelector('moul-sidebar')).not.toBeNull()
    })

    it('instantiates multiple concurrent <moul-sandbox> instances without interference', async () => {
      const sandbox1 = document.createElement('moul-sandbox') as MoulSandbox
      const sandbox2 = document.createElement('moul-sandbox') as MoulSandbox
      container.appendChild(sandbox1)
      container.appendChild(sandbox2)

      await Promise.all([
        awaitSandboxUpdate(sandbox1),
        awaitSandboxUpdate(sandbox2),
      ])

      sandbox1.selectedCategory = 'actions'
      sandbox2.selectedCategory = 'charts'

      await Promise.all([
        awaitSandboxUpdate(sandbox1),
        awaitSandboxUpdate(sandbox2),
      ])

      expect(sandbox1.selectedCategory).toBe('actions')
      expect(sandbox2.selectedCategory).toBe('charts')
      expect(sandbox1.shadowRoot?.querySelector('#actions')).not.toBeNull()
      expect(sandbox1.shadowRoot?.querySelector('#charts')).toBeNull()
      expect(sandbox2.shadowRoot?.querySelector('#charts')).not.toBeNull()
      expect(sandbox2.shadowRoot?.querySelector('#actions')).toBeNull()
    })
  })

  describe('Suite 2: Category Switching & Filtering Invariants', () => {
    let sandbox: MoulSandbox

    beforeEach(async () => {
      sandbox = document.createElement('moul-sandbox') as MoulSandbox
      container.appendChild(sandbox)
      await awaitSandboxUpdate(sandbox)
    })

    it('renders all 6 category sections when selectedCategory is "all"', () => {
      expect(sandbox.selectedCategory).toBe('all')
      const root = sandbox.shadowRoot!
      expect(root.querySelector('#actions')).not.toBeNull()
      expect(root.querySelector('#surfaces')).not.toBeNull()
      expect(root.querySelector('#overlays')).not.toBeNull()
      expect(root.querySelector('#forms')).not.toBeNull()
      expect(root.querySelector('#charts')).not.toBeNull()
      expect(root.querySelector('#blocks')).not.toBeNull()
    })

    const categories = [
      'actions',
      'surfaces',
      'overlays',
      'forms',
      'charts',
      'blocks',
    ] as const

    for (const cat of categories) {
      it(`filters DOM strictly to #${cat} section when selectedCategory is "${cat}"`, async () => {
        sandbox.selectedCategory = cat
        await awaitSandboxUpdate(sandbox)

        const root = sandbox.shadowRoot!
        expect(root.querySelector(`#${cat}`)).not.toBeNull()

        // Verify other 5 sections are NOT present in DOM
        const otherCats = categories.filter((c) => c !== cat)
        for (const other of otherCats) {
          expect(root.querySelector(`#${other}`)).toBeNull()
        }
      })
    }

    it('switches category via selectionchange event on <moul-sidebar>', async () => {
      const sidebar = sandbox.shadowRoot!.querySelector('moul-sidebar')!
      expect(sidebar).not.toBeNull()

      sidebar.dispatchEvent(
        new CustomEvent('selectionchange', {
          detail: { selectedKey: 'overlays' },
          bubbles: true,
          composed: true,
        }),
      )
      await awaitSandboxUpdate(sandbox)

      expect(sandbox.selectedCategory).toBe('overlays')
      expect(sandbox.shadowRoot!.querySelector('#overlays')).not.toBeNull()
      expect(sandbox.shadowRoot!.querySelector('#actions')).toBeNull()
    })

    it('gracefully handles empty, null or malformed selectionchange events', async () => {
      const sidebar = sandbox.shadowRoot!.querySelector('moul-sidebar')!
      sandbox.selectedCategory = 'surfaces'
      await awaitSandboxUpdate(sandbox)

      // Malformed event with empty detail
      sidebar.dispatchEvent(
        new CustomEvent('selectionchange', {
          detail: {},
          bubbles: true,
          composed: true,
        }),
      )
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.selectedCategory).toBe('surfaces')

      // Malformed event with null detail
      sidebar.dispatchEvent(
        new CustomEvent('selectionchange', {
          detail: null as any,
          bubbles: true,
          composed: true,
        }),
      )
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.selectedCategory).toBe('surfaces')
    })

    it('gracefully handles unknown category key without throwing or crashing', async () => {
      sandbox.selectedCategory = 'nonexistent-category'
      await awaitSandboxUpdate(sandbox)

      expect(sandbox.selectedCategory).toBe('nonexistent-category')
      const root = sandbox.shadowRoot!
      for (const cat of categories) {
        expect(root.querySelector(`#${cat}`)).toBeNull()
      }
    })

    it('survives rapid category switching barrage without desyncing', async () => {
      const sequence = [
        'actions',
        'surfaces',
        'overlays',
        'forms',
        'charts',
        'blocks',
        'all',
      ]
      for (let i = 0; i < 35; i++) {
        sandbox.selectedCategory = sequence[i % sequence.length]
      }
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.selectedCategory).toBe(sequence[34 % sequence.length])
      const expectedCat = sequence[34 % sequence.length]
      if (expectedCat === 'all') {
        expect(sandbox.shadowRoot!.querySelector('#actions')).not.toBeNull()
      } else {
        expect(
          sandbox.shadowRoot!.querySelector(`#${expectedCat}`),
        ).not.toBeNull()
      }
    })
  })

  describe('Suite 3: Theme Toggling & DOM Synchronisation', () => {
    let sandbox: MoulSandbox

    beforeEach(async () => {
      sandbox = document.createElement('moul-sandbox') as MoulSandbox
      container.appendChild(sandbox)
      await awaitSandboxUpdate(sandbox)
    })

    it('toggles theme from dark to light and updates DOM classes and dataset', () => {
      const toastSpy = vi.spyOn(toastQueue, 'add')
      sandbox.theme = 'dark'
      document.documentElement.dataset.theme = 'dark'
      document.documentElement.classList.add('dark')

      sandbox.toggleTheme()

      expect(sandbox.theme).toBe('light')
      expect(document.documentElement.dataset.theme).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Theme Toggled',
          tone: 'primary',
          description: expect.stringContaining('light'),
        }),
      )
    })

    it('toggles theme from light to dark and restores dark class', () => {
      sandbox.theme = 'light'
      document.documentElement.dataset.theme = 'light'
      document.documentElement.classList.remove('dark')

      sandbox.toggleTheme()

      expect(sandbox.theme).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('survives a 50-cycle rapid theme toggle barrage and maintains invariant consistency', () => {
      const initialTheme = sandbox.theme
      for (let i = 0; i < 50; i++) {
        sandbox.toggleTheme()
      }
      // Even number of toggles returns to initial theme
      expect(sandbox.theme).toBe(initialTheme)
      expect(document.documentElement.dataset.theme).toBe(initialTheme)
      if (initialTheme === 'dark') {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      } else {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      }
    })
  })

  describe('Suite 4: Interactive Triggers & Controls', () => {
    let sandbox: MoulSandbox

    beforeEach(async () => {
      sandbox = document.createElement('moul-sandbox') as MoulSandbox
      container.appendChild(sandbox)
      await awaitSandboxUpdate(sandbox)
    })

    it('increments counter on interactive counter button click', async () => {
      sandbox.selectedCategory = 'actions'
      await awaitSandboxUpdate(sandbox)

      const buttons = Array.from(
        sandbox.shadowRoot!.querySelectorAll('moul-button'),
      )
      const counterBtn = buttons.find((btn) =>
        btn.textContent?.includes('Interactive Counter'),
      )
      expect(counterBtn).not.toBeUndefined()

      expect(sandbox.counter).toBe(0)
      counterBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.counter).toBe(1)
      expect(counterBtn!.textContent).toContain('Interactive Counter: 1')

      counterBtn!.click()
      counterBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.counter).toBe(3)
      expect(counterBtn!.textContent).toContain('Interactive Counter: 3')
    })

    it('toggles pending state on button click', async () => {
      sandbox.selectedCategory = 'actions'
      await awaitSandboxUpdate(sandbox)

      const buttons = Array.from(
        sandbox.shadowRoot!.querySelectorAll('moul-button'),
      )
      const pendingBtn = buttons.find((btn) =>
        btn.textContent?.includes('Toggle Pending'),
      )
      expect(pendingBtn).not.toBeUndefined()

      expect(sandbox.isPending).toBe(false)
      pendingBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isPending).toBe(true)
      expect(pendingBtn!.textContent).toContain('Pending State')
      expect(pendingBtn!.hasAttribute('is-pending')).toBe(true)

      pendingBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isPending).toBe(false)
      expect(pendingBtn!.textContent).toContain('Toggle Pending')
    })

    it('opens and closes interactive modal dialog', async () => {
      sandbox.selectedCategory = 'overlays'
      await awaitSandboxUpdate(sandbox)

      const buttons = Array.from(
        sandbox.shadowRoot!.querySelectorAll('moul-button'),
      )
      const modalBtn = buttons.find((btn) =>
        btn.textContent?.includes('Open Modal Dialog'),
      )
      expect(modalBtn).not.toBeUndefined()

      const modal = sandbox.shadowRoot!.querySelector('moul-modal')
      expect(modal).not.toBeNull()
      expect(sandbox.isModalOpen).toBe(false)

      modalBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isModalOpen).toBe(true)
      expect(modal!.hasAttribute('is-open')).toBe(true)

      // Close modal
      modal!.dispatchEvent(new CustomEvent('close'))
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isModalOpen).toBe(false)
      expect(modal!.hasAttribute('is-open')).toBe(false)
    })

    it('opens and confirms/cancels interactive alert dialog', async () => {
      sandbox.selectedCategory = 'overlays'
      await awaitSandboxUpdate(sandbox)

      const buttons = Array.from(
        sandbox.shadowRoot!.querySelectorAll('moul-button'),
      )
      const alertBtn = buttons.find((btn) =>
        btn.textContent?.includes('Open Alert Dialog'),
      )
      expect(alertBtn).not.toBeUndefined()

      const alertDialog = sandbox.shadowRoot!.querySelector('moul-alert-dialog')
      expect(alertDialog).not.toBeNull()
      expect(sandbox.isAlertModalOpen).toBe(false)

      alertBtn!.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isAlertModalOpen).toBe(true)
      expect(alertDialog!.hasAttribute('is-open')).toBe(true)

      // Cancel alert dialog
      alertDialog!.dispatchEvent(new CustomEvent('cancel'))
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isAlertModalOpen).toBe(false)

      // Open again and confirm
      const toastSpy = vi.spyOn(toastQueue, 'add')
      alertBtn!.click()
      await awaitSandboxUpdate(sandbox)
      alertDialog!.dispatchEvent(new CustomEvent('confirm'))
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.isAlertModalOpen).toBe(false)
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'error',
        }),
      )
    })

    it('triggers toasts across all 4 tones via triggerToast', () => {
      const toastSpy = vi.spyOn(toastQueue, 'add')
      const tones = ['primary', 'success', 'warning', 'error'] as const

      for (const tone of tones) {
        ;(sandbox as any).triggerToast(tone)
        expect(toastSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            tone,
            title: `${tone.toUpperCase()} Notification`,
          }),
        )
      }
    })

    it('fires toast from toolbar button', async () => {
      const toastSpy = vi.spyOn(toastQueue, 'add')
      const buttons = Array.from(
        sandbox.shadowRoot!.querySelectorAll('.toolbar-actions moul-button'),
      )
      const fireToastBtn = buttons.find((btn) =>
        btn.textContent?.includes('Fire Toast'),
      )
      expect(fireToastBtn).not.toBeUndefined()

      fireToastBtn!.click()
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'primary',
          title: 'PRIMARY Notification',
        }),
      )
    })

    it('handles interactive form input events', async () => {
      sandbox.selectedCategory = 'forms'
      await awaitSandboxUpdate(sandbox)

      const root = sandbox.shadowRoot!

      // Text Field
      const textField = root.querySelector(
        'moul-text-field',
      ) as HTMLInputElement
      if (textField) {
        textField.value = 'Challenger Text'
        textField.dispatchEvent(new Event('input'))
        expect(sandbox.textValue).toBe('Challenger Text')
      }

      // Slider
      const slider = root.querySelector('moul-slider') as HTMLInputElement
      if (slider) {
        slider.value = '88'
        slider.dispatchEvent(new Event('input'))
        expect(sandbox.sliderValue).toBe(88)
      }

      // Switch
      const switchEl = root.querySelector('moul-switch') as any
      if (switchEl) {
        switchEl.isChecked = false
        switchEl.dispatchEvent(new Event('change'))
        expect(sandbox.switchValue).toBe(false)
      }
    })

    it('handles pagination pagechange event', async () => {
      sandbox.selectedCategory = 'overlays'
      await awaitSandboxUpdate(sandbox)

      const pagination = sandbox.shadowRoot!.querySelector('moul-pagination')
      expect(pagination).not.toBeNull()

      pagination!.dispatchEvent(
        new CustomEvent('pagechange', { detail: { page: 4 } }),
      )
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.currentPage).toBe(4)
    })

    it('handles tabs click event', async () => {
      sandbox.selectedCategory = 'overlays'
      await awaitSandboxUpdate(sandbox)

      const tabs = sandbox.shadowRoot!.querySelector('moul-tabs')
      expect(tabs).not.toBeNull()

      const reportsTab = tabs!.querySelector(
        'moul-tab[key="reports"]',
      ) as HTMLElement
      expect(reportsTab).not.toBeNull()

      reportsTab.click()
      await awaitSandboxUpdate(sandbox)
      expect(sandbox.selectedTab).toBe('reports')
    })
  })

  describe('Suite 5: Vite Dev Server Transformation Cleanliness', () => {
    const uiDir = fs.existsSync(resolve(process.cwd(), 'src/sandbox.ts'))
      ? process.cwd()
      : resolve(process.cwd(), 'ui')

    it('verifies that Vite dev server transforms ui/index.html cleanly', async () => {
      const server = await createServer({
        root: uiDir,
        server: { port: 5211 },
      })
      try {
        const html = fs.readFileSync(resolve(uiDir, 'index.html'), 'utf-8')
        const transformedHtml = await server.transformIndexHtml('/', html)
        expect(transformedHtml).toContain('<moul-sandbox></moul-sandbox>')
        expect(transformedHtml).toContain('/src/sandbox.ts')
        expect(transformedHtml).toContain('/src/styles/style.css')
        expect(transformedHtml.length).toBeGreaterThan(500)
      } finally {
        await server.close()
      }
    })

    it('verifies that Vite dev server transforms ui/src/sandbox.ts cleanly with zero banned imports', async () => {
      const server = await createServer({
        root: uiDir,
        server: { port: 5212 },
      })
      try {
        const transformedModule =
          await server.transformRequest('/src/sandbox.ts')
        expect(transformedModule).not.toBeNull()
        expect(transformedModule?.code).toBeDefined()
        expect(transformedModule?.code.length).toBeGreaterThan(10000)

        // Verify no banned React imports were resolved or bundled
        expect(transformedModule?.code).not.toContain('@stylexjs')
        expect(transformedModule?.code).not.toContain('react/jsx-runtime')
        expect(transformedModule?.code).not.toContain('react-dom')
      } finally {
        await server.close()
      }
    })
  })
})
