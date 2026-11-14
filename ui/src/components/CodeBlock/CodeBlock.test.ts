import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './CodeBlock'
import type { MoulCodeBlock } from './CodeBlock'

const shadow = (el: MoulCodeBlock) => el.shadowRoot as ShadowRoot
const pre = (el: MoulCodeBlock) =>
  shadow(el).querySelector('[part~="code"]') as HTMLElement
const tabs = (el: MoulCodeBlock) =>
  Array.from(shadow(el).querySelectorAll<HTMLButtonElement>('[role="tab"]'))
const copyButton = (el: MoulCodeBlock) =>
  shadow(el).querySelector<HTMLButtonElement>('[part~="copy-button"]')
const status = (el: MoulCodeBlock) =>
  shadow(el).querySelector('[role="status"]')?.textContent?.trim()

let writeText: ReturnType<typeof vi.fn>

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
})

describe('<moul-code-block>', () => {
  it('shows `code` highlighted, with the text exactly as given', async () => {
    const code = 'const a = 1\n\n// two\nlet b = "x"'
    const el = await fixture<MoulCodeBlock>(
      html`<moul-code-block language="ts" .code=${code}></moul-code-block>`,
    )
    expect(pre(el).textContent).toBe(code)
    expect(pre(el).querySelectorAll('.line')).toHaveLength(4)
    expect(pre(el).querySelector('.tok-keyword')?.textContent).toBe('const')
    expect(pre(el).querySelector('.tok-comment')?.textContent).toBe('// two')
    expect(pre(el).querySelector('.tok-string')?.textContent).toBe('"x"')
  })

  it('renders code as text, never as markup', async () => {
    const el = await fixture<MoulCodeBlock>(
      html`<moul-code-block
        language="html"
        code="<img src=x onerror=alert(1)>"
      ></moul-code-block>`,
    )
    expect(pre(el).querySelector('img')).toBeNull()
    expect(pre(el).textContent).toBe('<img src=x onerror=alert(1)>')
  })

  it('reads its own text, dedented, when there is no `code`', async () => {
    const el =
      await fixture<MoulCodeBlock>(html`<moul-code-block language="css">
        .a {
          color: red;
        }
      </moul-code-block>`)
    expect(el.currentCode).toBe('.a {\n  color: red;\n}')
    expect(pre(el).textContent).toBe('.a {\n  color: red;\n}')
  })

  it('reads a template as written, with bare boolean attributes', async () => {
    const el =
      await fixture<MoulCodeBlock>(html`<moul-code-block language="html">
      <template><moul-modal is-open>a &lt; b</moul-modal></template>
    </moul-code-block>`)
    expect(el.currentCode).toBe('<moul-modal is-open>a < b</moul-modal>')
  })

  it('follows changes to the markup', async () => {
    const el = await fixture<MoulCodeBlock>(
      html`<moul-code-block>one</moul-code-block>`,
    )
    el.textContent = 'two'
    await new Promise((resolve) => setTimeout(resolve))
    await el.updateComplete
    expect(pre(el).textContent).toBe('two')
  })

  it('marks highlighted lines and numbers lines on request', async () => {
    const el = await fixture<MoulCodeBlock>(
      html`<moul-code-block
        code=${'a\nb\nc\nd'}
        highlight-lines="2, 4"
        show-line-numbers
        is-wrapped
      ></moul-code-block>`,
    )
    const lines = Array.from(pre(el).querySelectorAll('.line'))
    expect(lines.map((line) => line.hasAttribute('data-highlighted'))).toEqual([
      false,
      true,
      false,
      true,
    ])
    const base = shadow(el).querySelector('[part~="base"]') as HTMLElement
    expect(base.classList.contains('numbered')).toBe(true)
    expect(base.classList.contains('wrapped')).toBe(true)
  })

  it('shows the filename in a header, and the copy button there', async () => {
    const el = await fixture<MoulCodeBlock>(
      html`<moul-code-block filename="app.ts" code="x"></moul-code-block>`,
    )
    expect(shadow(el).querySelector('[part~="filename"]')?.textContent).toBe(
      'app.ts',
    )
    const button = copyButton(el)
    expect(button?.closest('[part~="header"]')).not.toBeNull()
    expect(button?.classList.contains('floating')).toBe(false)
  })

  describe('copying', () => {
    it('copies the code, flips the icon and says so', async () => {
      const onCopy = vi.fn()
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block
          language="sh"
          code="bun add x"
          @codecopy=${onCopy}
        ></moul-code-block>`,
      )
      copyButton(el)?.click()
      await vi.waitFor(() => expect(onCopy).toHaveBeenCalled())
      await el.updateComplete
      expect(writeText).toHaveBeenCalledWith('bun add x')
      expect(onCopy.mock.calls[0][0].detail).toEqual({
        code: 'bun add x',
        language: 'sh',
        isCopied: true,
      })
      expect(copyButton(el)?.hasAttribute('data-copied')).toBe(true)
      expect(status(el)).toBe('Copied')
    })

    it('says when the clipboard refused', async () => {
      writeText.mockImplementation(() => Promise.reject(new Error('denied')))
      document.execCommand = vi.fn(() => false)
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block code="x" copy-failed-label="Nope"></moul-code-block>`,
      )
      await el.copy()
      await el.updateComplete
      expect(copyButton(el)?.hasAttribute('data-copied')).toBe(false)
      expect(status(el)).toBe('Nope')
    })

    it('hides the button with hide-copy', async () => {
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block code="x" hide-copy></moul-code-block>`,
      )
      expect(copyButton(el)).toBeNull()
    })
  })

  describe('tabs', () => {
    async function mountTabs(attrs = ''): Promise<MoulCodeBlock> {
      const host = document.createElement('div')
      host.innerHTML = `<moul-code-block language="sh" ${attrs}>
        <script type="text/plain" data-label="npm">npm i moul</script>
        <script type="text/plain" data-label="pnpm">pnpm add moul</script>
        <script type="text/plain" data-label="TypeScript" data-language="ts">const a: number = 1</script>
      </moul-code-block>`
      document.body.append(host)
      const el = host.firstElementChild as MoulCodeBlock
      await el.updateComplete
      return el
    }

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('makes one tab per snippet, as a tablist with its panel', async () => {
      const el = await mountTabs()
      expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual([
        'npm',
        'pnpm',
        'TypeScript',
      ])
      expect(tabs(el)[0].getAttribute('aria-selected')).toBe('true')
      expect(tabs(el)[0].tabIndex).toBe(0)
      expect(tabs(el)[1].tabIndex).toBe(-1)
      const panel = shadow(el).querySelector('[role="tabpanel"]')
      expect(panel?.getAttribute('aria-labelledby')).toBe('tab-0')
      expect(panel?.getAttribute('tabindex')).toBe('0')
      expect(pre(el).textContent).toBe('npm i moul')
    })

    it('moves and selects with the arrow keys, Home and End', async () => {
      const onChange = vi.fn()
      const el = await mountTabs()
      el.addEventListener('tabchange', onChange)
      const key = (k: string) =>
        shadow(el)
          .querySelector('[role="tablist"]')
          ?.dispatchEvent(
            new KeyboardEvent('keydown', { key: k, bubbles: true }),
          )
      tabs(el)[0].focus()
      key('ArrowRight')
      await el.updateComplete
      expect(el.selectedIndex).toBe(1)
      expect(shadow(el).activeElement?.id).toBe('tab-1')
      expect(onChange.mock.calls[0][0].detail).toEqual({
        index: 1,
        label: 'pnpm',
      })
      key('End')
      await el.updateComplete
      expect(el.selectedIndex).toBe(2)
      expect(pre(el).querySelector('.tok-type')?.textContent).toBe('number')
      key('ArrowRight')
      await el.updateComplete
      expect(el.selectedIndex).toBe(0)
      key('ArrowLeft')
      await el.updateComplete
      expect(el.selectedIndex).toBe(2)
      key('Home')
      await el.updateComplete
      expect(el.selectedIndex).toBe(0)
    })

    it('switches blocks that share a sync-key together, by label', async () => {
      const first = await mountTabs('sync-key="pm"')
      const second = await mountTabs('sync-key="pm"')
      const other = await mountTabs('sync-key="other"')
      tabs(first)[1].click()
      await second.updateComplete
      expect(second.selectedIndex).toBe(1)
      expect(other.selectedIndex).toBe(0)
    })

    it('copies the selected tab', async () => {
      const el = await mountTabs()
      tabs(el)[1].click()
      await el.updateComplete
      await el.copy()
      expect(writeText).toHaveBeenCalledWith('pnpm add moul')
    })

    it('takes tabs from the `tabs` property before anything else', async () => {
      const el = await mountTabs()
      el.tabs = [
        { label: 'A', code: 'a' },
        { label: 'B', code: 'b', language: 'ts' },
      ]
      await el.updateComplete
      expect(tabs(el).map((tab) => tab.textContent?.trim())).toEqual(['A', 'B'])
    })
  })

  describe('keyboard and screen readers', () => {
    it('names the code by label, filename or language', async () => {
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block language="ts" code="x"></moul-code-block>`,
      )
      const scroller = () => shadow(el).querySelector('[part~="scroller"]')
      expect(scroller()?.getAttribute('role')).toBe('group')
      expect(scroller()?.getAttribute('aria-label')).toBe('TypeScript code')
      el.filename = 'index.ts'
      await el.updateComplete
      expect(scroller()?.getAttribute('aria-label')).toBe('index.ts')
      el.label = 'Setup'
      await el.updateComplete
      expect(scroller()?.getAttribute('aria-label')).toBe('Setup')
    })

    it('makes the code focusable only when it has to scroll', async () => {
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block code="x"></moul-code-block>`,
      )
      const scroller = shadow(el).querySelector(
        '[part~="scroller"]',
      ) as HTMLElement
      expect(scroller.hasAttribute('tabindex')).toBe(false)
      Object.defineProperty(scroller, 'scrollWidth', { value: 900 })
      Object.defineProperty(scroller, 'clientWidth', { value: 300 })
      el.code = 'longer'
      await el.updateComplete
      await el.updateComplete
      expect(scroller.getAttribute('tabindex')).toBe('0')
    })

    it('names the copy button and hides line numbers from screen readers', async () => {
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block code="x" show-line-numbers copy-label="Copy snippet"></moul-code-block>`,
      )
      expect(copyButton(el)?.getAttribute('aria-label')).toBe('Copy snippet')
      // Numbers are CSS counters, not text in the code.
      expect(pre(el).textContent).toBe('x')
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    afterEach(() => motion?.restore())

    it('switches tabs without easing the height or fading the code', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulCodeBlock>(
        html`<moul-code-block
          .tabs=${[{ label: 'A', code: 'a' }, { label: 'B', code: 'b\nb\nb' }]}
        ></moul-code-block>`,
      )
      tabs(el)[1].click()
      await el.updateComplete
      const body = shadow(el).querySelector('[part~="body"]') as HTMLElement
      expect(body.style.height).toBe('')
      expect(pre(el).style.opacity).toBe('')
      expect(pre(el).textContent).toBe('b\nb\nb')
    })
  })
})
