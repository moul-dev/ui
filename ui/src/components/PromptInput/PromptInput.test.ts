import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './PromptInput'
import type { MoulPromptInput, PromptModel } from './PromptInput'

const MODELS: PromptModel[] = [
  { value: 'fast', label: 'Fast', description: 'Quick answers' },
  { value: 'deep', label: 'Deep' },
]

const root = (el: MoulPromptInput) => el.shadowRoot as ShadowRoot
const textarea = (el: MoulPromptInput) =>
  root(el).querySelector('textarea') as HTMLTextAreaElement
const send = (el: MoulPromptInput) =>
  root(el).querySelector<HTMLButtonElement>(
    '[part="send-button"]',
  ) as HTMLButtonElement
const status = (el: MoulPromptInput) =>
  root(el).querySelector('[role="status"]')?.textContent

async function mount(props: Partial<MoulPromptInput> = {}) {
  const el = await fixture<MoulPromptInput>(
    html`<moul-prompt-input></moul-prompt-input>`,
  )
  Object.assign(el, props)
  await el.updateComplete
  return el
}

async function type(el: MoulPromptInput, text: string): Promise<void> {
  const area = textarea(el)
  area.value = text
  area.dispatchEvent(new Event('input', { bubbles: true }))
  await el.updateComplete
}

function press(
  el: MoulPromptInput,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  textarea(el).dispatchEvent(event)
  return event
}

const file = (name: string, type: string, size = 10) =>
  new File(['x'.repeat(size)], name, { type })

describe('<moul-prompt-input>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
  })

  it('sends on Enter with the text, attachments and model, then empties', async () => {
    const el = await mount({ models: MODELS })
    const onSubmit = vi.fn()
    el.addEventListener('promptsubmit', onSubmit)
    await type(el, 'List my collections')
    press(el, 'Enter')
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]?.[0].detail).toEqual({
      value: 'List my collections',
      attachments: [],
      model: 'fast',
    })
    await el.updateComplete
    expect(el.value).toBe('')
    expect(el.history).toEqual(['List my collections'])
  })

  it('keeps the text when promptsubmit is cancelled', async () => {
    const el = await mount()
    el.addEventListener('promptsubmit', (event) => event.preventDefault())
    await type(el, 'Draft')
    press(el, 'Enter')
    await el.updateComplete
    expect(el.value).toBe('Draft')
  })

  it('does not send empty text', async () => {
    const el = await mount()
    const onSubmit = vi.fn()
    el.addEventListener('promptsubmit', onSubmit)
    await type(el, '   ')
    expect(send(el).disabled).toBe(true)
    press(el, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends with Ctrl or ⌘ + Enter when submit-key is mod-enter', async () => {
    const el = await mount({ submitKey: 'mod-enter' })
    const onSubmit = vi.fn()
    el.addEventListener('promptsubmit', onSubmit)
    await type(el, 'Hi')
    expect(press(el, 'Enter').defaultPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    press(el, 'Enter', { metaKey: true })
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('shows Stop while generating, waits to send, and stops', async () => {
    const el = await mount({ isGenerating: true })
    const onSubmit = vi.fn()
    const onStop = vi.fn()
    el.addEventListener('promptsubmit', onSubmit)
    el.addEventListener('stop', onStop)
    await type(el, 'Next question')
    press(el, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(send(el).getAttribute('aria-label')).toBe('Stop generating')
    send(el).click()
    expect(onStop).toHaveBeenCalledOnce()
    expect(el.value).toBe('Next question')
  })

  it('picks a model from the menu', async () => {
    const el = await mount({ models: MODELS })
    const onModel = vi.fn()
    el.addEventListener('modelchange', onModel)
    const trigger = root(el).querySelector('[part="model-button"]')
    expect(trigger?.textContent).toContain('Fast')
    const items = root(el).querySelectorAll('moul-menu-item')
    expect(items).toHaveLength(2)
    expect(items[0]?.hasAttribute('is-checked')).toBe(true)
    root(el)
      .querySelector('moul-dropdown-menu')
      ?.dispatchEvent(
        new CustomEvent('action', {
          detail: { value: 'deep', item: items[1] },
          bubbles: true,
          composed: true,
        }),
      )
    await el.updateComplete
    expect(el.model).toBe('deep')
    expect(onModel.mock.calls[0]?.[0].detail).toEqual({
      value: 'deep',
      model: MODELS[1],
    })
    expect(trigger?.textContent).toContain('Deep')
  })

  describe('attachments', () => {
    it('shows the attach button only with allow-attachments', async () => {
      const el = await mount()
      expect(root(el).querySelector('[part="attach-button"]')).toBeNull()
      el.allowAttachments = true
      await el.updateComplete
      expect(
        root(el)
          .querySelector('[part="attach-button"]')
          ?.getAttribute('aria-label'),
      ).toBe('Attach files')
    })

    it('checks type, size and count, and reports what it refused', async () => {
      const el = await mount({
        allowAttachments: true,
        accept: 'image/*,.pdf',
        maxSize: 100,
        maxFiles: 2,
      })
      const onReject = vi.fn()
      el.addEventListener('attachmentreject', onReject)
      el.addFiles([
        file('a.png', 'image/png'),
        file('b.exe', 'application/x-msdownload'),
        file('big.pdf', 'application/pdf', 500),
        file('c.pdf', 'application/pdf'),
        file('d.png', 'image/png'),
      ])
      await el.updateComplete
      expect(el.attachments.map((item) => item.name)).toEqual([
        'a.png',
        'c.pdf',
      ])
      expect(onReject.mock.calls.map((c) => c[0].detail.reason)).toEqual([
        'type',
        'size',
        'count',
      ])
      await el.updateComplete
      expect(status(el)).toContain('Attached 2 files.')
      expect(status(el)).toContain('b.exe is not an accepted file type.')
    })

    it('uploads each file and waits for uploads before sending', async () => {
      let finish: (value: unknown) => void = () => {}
      const upload = vi.fn(
        (_file: File, context: { onProgress(p: number): void }) =>
          new Promise((resolve) => {
            context.onProgress(40)
            finish = resolve
          }),
      )
      const el = await mount({ allowAttachments: true, upload })
      const onSubmit = vi.fn()
      el.addEventListener('promptsubmit', onSubmit)
      el.addFiles([file('notes.txt', 'text/plain')])
      await el.updateComplete
      expect(el.attachments[0]).toMatchObject({
        status: 'uploading',
        progress: 40,
      })
      expect(root(el).querySelector('.attachment-meta')?.textContent).toBe(
        'Uploading 40%',
      )
      el.submit()
      expect(onSubmit).not.toHaveBeenCalled()
      finish({ id: 'file_1' })
      await vi.waitFor(() => expect(el.attachments[0]?.status).toBe('done'))
      expect(el.submit()).toBe(true)
      expect(onSubmit.mock.calls[0]?.[0].detail.attachments[0]).toMatchObject({
        name: 'notes.txt',
        response: { id: 'file_1' },
      })
      await el.updateComplete
      expect(el.attachments).toEqual([])
    })

    it('cancels an upload when its file is removed', async () => {
      let signal: AbortSignal | undefined
      const upload = vi.fn((_f: File, context: { signal: AbortSignal }) => {
        signal = context.signal
        return new Promise(() => {})
      })
      const el = await mount({ allowAttachments: true, upload })
      el.addFiles([file('a.txt', 'text/plain')])
      await el.updateComplete
      const remove = root(el).querySelector<HTMLButtonElement>(
        'button[aria-label="Remove a.txt"]',
      )
      remove?.click()
      await el.updateComplete
      expect(el.attachments).toEqual([])
      expect(signal?.aborted).toBe(true)
    })

    it('takes pasted files', async () => {
      const el = await mount({ allowAttachments: true })
      const paste = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(paste, 'clipboardData', {
        value: { files: [file('shot.png', 'image/png')] },
      })
      textarea(el).dispatchEvent(paste)
      await el.updateComplete
      expect(paste.defaultPrevented).toBe(true)
      expect(el.attachments.map((item) => item.name)).toEqual(['shot.png'])
    })
  })

  describe('keyboard and screen readers', () => {
    it('names the text box and describes how to send', async () => {
      const el = await mount({ label: 'Ask Moul' })
      expect(textarea(el).getAttribute('aria-label')).toBe('Ask Moul')
      const hint = root(el).querySelector(
        `#${textarea(el).getAttribute('aria-describedby')}`,
      )
      expect(hint?.textContent).toContain('Shift and Enter for a new line')
      expect(send(el).getAttribute('aria-label')).toBe('Send message')
    })

    it('adds a line on Shift + Enter and waits for an IME to finish', async () => {
      const el = await mount()
      const onSubmit = vi.fn()
      el.addEventListener('promptsubmit', onSubmit)
      await type(el, 'ក')
      expect(press(el, 'Enter', { shiftKey: true }).defaultPrevented).toBe(
        false,
      )
      expect(press(el, 'Enter', { isComposing: true }).defaultPrevented).toBe(
        false,
      )
      expect(press(el, 'Enter', { keyCode: 229 }).defaultPrevented).toBe(false)
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('walks back and forth through history with the arrow keys', async () => {
      const el = await mount({ history: ['first', 'second'] })
      await type(el, '')
      press(el, 'ArrowUp')
      await el.updateComplete
      expect(el.value).toBe('second')
      press(el, 'ArrowUp')
      await el.updateComplete
      expect(el.value).toBe('first')
      press(el, 'ArrowDown')
      await el.updateComplete
      expect(el.value).toBe('second')
      press(el, 'ArrowDown')
      await el.updateComplete
      expect(el.value).toBe('')
    })

    it('leaves Arrow Up alone in a box with a draft', async () => {
      const el = await mount({ history: ['first'] })
      await type(el, 'my draft')
      textarea(el).setSelectionRange(0, 0)
      expect(press(el, 'ArrowUp').defaultPrevented).toBe(false)
      expect(el.value).toBe('my draft')
    })

    it('returns to the draft on Escape and stops generation on Escape', async () => {
      const el = await mount({ history: ['first'] })
      press(el, 'ArrowUp')
      await el.updateComplete
      press(el, 'Escape')
      await el.updateComplete
      expect(el.value).toBe('')
      el.isGenerating = true
      await el.updateComplete
      const onStop = vi.fn()
      el.addEventListener('stop', onStop)
      expect(press(el, 'Escape').defaultPrevented).toBe(true)
      expect(onStop).toHaveBeenCalledOnce()
    })

    it('labels the model picker trigger with the model', async () => {
      const el = await mount({ models: MODELS, model: 'deep' })
      expect(
        root(el)
          .querySelector('[part="model-button"]')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim(),
      ).toBe('Model: Deep')
    })
  })

  describe('reduced motion', () => {
    it('clears sent text at once with vanish-on-submit', async () => {
      motion.set(true)
      const el = await mount({ vanishOnSubmit: true })
      const layer = root(el).querySelector('.vanish-layer') as HTMLElement
      const animate = vi.fn()
      layer.animate = animate as unknown as typeof layer.animate
      await type(el, 'gone')
      press(el, 'Enter')
      await el.updateComplete
      expect(el.value).toBe('')
      expect(animate).not.toHaveBeenCalled()
    })
  })
})
