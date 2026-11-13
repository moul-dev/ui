import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion } from '../../test-setup'
import type { MoulProgressBar } from '../ProgressBar/ProgressBar'
import './FileUpload'
import type {
  FileUploadContext,
  FileUploadItem,
  MoulFileUpload,
} from './FileUpload'
import { fileUploadStyles } from './FileUpload.styles'

const png = (name = 'photo.png', size = 3) =>
  new File(['x'.repeat(size)], name, { type: 'image/png' })
const pdf = (name = 'report.pdf', size = 3) =>
  new File(['x'.repeat(size)], name, { type: 'application/pdf' })

const query = <T extends Element = HTMLElement>(
  el: MoulFileUpload,
  selector: string,
): T | null => el.shadowRoot?.querySelector<T>(selector) ?? null

const queryAll = <T extends Element = HTMLElement>(
  el: MoulFileUpload,
  selector: string,
): T[] => Array.from(el.shadowRoot?.querySelectorAll<T>(selector) ?? [])

/** Text of the elements an ARIA id-list points at, as a screen reader would join it. */
const idRefText = (el: MoulFileUpload, ids: string | null): string =>
  (ids ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => el.shadowRoot?.getElementById(id)?.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

const button = (el: MoulFileUpload, name: string) =>
  queryAll<HTMLButtonElement>(el, 'button, a').find(
    (node) => node.getAttribute('aria-label') === name,
  ) ?? null

/** Picks files the way the browser reports them: on the hidden input's `change`. */
async function pick(el: MoulFileUpload, files: File[]): Promise<void> {
  const input = el.inputElement as HTMLInputElement
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
  })
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await el.updateComplete
}

/** A drag event carrying files, like the browser's, with a stubbed `dataTransfer`. */
function dragEvent(type: string, files: File[]): Event {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
  })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      types: ['Files'],
      items: files.map(() => ({ kind: 'file' })),
      dropEffect: 'none',
    },
  })
  return event
}

interface PendingUpload {
  file: File
  context: FileUploadContext
  resolve(value: unknown): void
  reject(error: unknown): void
}

/** An `upload` function whose calls the test settles by hand. */
function manualUpload() {
  const calls: PendingUpload[] = []
  const upload = vi.fn(
    (file: File, context: FileUploadContext) =>
      new Promise<unknown>((resolve, reject) => {
        calls.push({ file, context, resolve, reject })
      }),
  )
  return { upload, calls }
}

const settle = async (el: MoulFileUpload) => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await el.updateComplete
}

const formValue = (el: MoulFileUpload) =>
  (el.internalsController.internals as unknown as { formValue: unknown })
    .formValue

afterEach(() => {
  vi.restoreAllMocks()
})

describe('<moul-file-upload>', () => {
  it('is registered, form-associated, and has the documented defaults', async () => {
    const el = await fixture<MoulFileUpload>(
      html`<moul-file-upload label="Attachment"></moul-file-upload>`,
    )
    expect(customElements.get('moul-file-upload')).toBeDefined()
    expect(
      (
        customElements.get('moul-file-upload') as unknown as {
          formAssociated: boolean
        }
      ).formAssociated,
    ).toBe(true)
    expect(el.items).toEqual([])
    expect(el.upload).toBeNull()
    expect(el.isMultiple).toBe(false)
    expect(el.maxSize).toBe(0)
    expect(el.maxFiles).toBe(0)
    expect(el.accept).toBe('')
    expect(query(el, '[part~="list"]')).toBeNull()
    expect(query(el, '[part~="dropzone"]')).not.toBeNull()
  })

  describe('picking and dropping', () => {
    it('adds picked files as idle items and fires change', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      const onChange = vi.fn()
      el.addEventListener('change', onChange)
      await pick(el, [pdf('a.pdf', 2048), png('b.png')])

      expect(el.items.map((item) => [item.name, item.status])).toEqual([
        ['a.pdf', 'idle'],
        ['b.png', 'idle'],
      ])
      expect(el.items[0].size).toBe(2048)
      expect(el.items[0].type).toBe('application/pdf')
      expect(el.items[0].file).toBeInstanceOf(File)
      expect(new Set(el.items.map((item) => item.id)).size).toBe(2)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange.mock.calls[0][0].detail.items).toBe(el.items)
      expect(queryAll(el, '[part~="item"]')).toHaveLength(2)
      expect(query(el, '[part~="meta"]')?.textContent).toContain('2 KB')
      // The input is cleared so the same file can be picked again.
      expect((el.inputElement as HTMLInputElement).value).toBe('')
    })

    it('appends in multiple mode and keeps the drop zone', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      await pick(el, [pdf('a.pdf')])
      await pick(el, [pdf('b.pdf')])
      expect(el.items.map((item) => item.name)).toEqual(['a.pdf', 'b.pdf'])
      expect(el.dropzone).not.toBeNull()
    })

    it('takes files dropped with a real DataTransfer', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      const data = new DataTransfer()
      data.items.add(pdf('dropped.pdf'))
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: data })
      el.dropzone?.dispatchEvent(drop)
      await el.updateComplete

      expect(drop.defaultPrevented).toBe(true)
      expect(el.items.map((item) => item.name)).toEqual(['dropped.pdf'])
    })

    it('highlights while files are dragged over it and clears on leave and drop', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      const zone = el.dropzone as HTMLButtonElement
      const files = [pdf()]
      const enter = dragEvent('dragenter', files)
      zone.dispatchEvent(enter)
      expect(enter.defaultPrevented).toBe(true)
      expect(el.hasAttribute('data-dragging')).toBe(true)

      // Entering a child and leaving it keeps the highlight.
      zone
        .querySelector('[part~="instructions"]')
        ?.dispatchEvent(dragEvent('dragenter', files))
      zone.dispatchEvent(dragEvent('dragleave', files))
      expect(el.hasAttribute('data-dragging')).toBe(true)

      const over = dragEvent('dragover', files)
      zone.dispatchEvent(over)
      expect(over.defaultPrevented).toBe(true)
      expect(
        (over as unknown as { dataTransfer: DataTransfer }).dataTransfer
          .dropEffect,
      ).toBe('copy')

      zone.dispatchEvent(dragEvent('dragleave', files))
      expect(el.hasAttribute('data-dragging')).toBe(false)

      zone.dispatchEvent(dragEvent('dragenter', files))
      zone.dispatchEvent(dragEvent('drop', files))
      await el.updateComplete
      expect(el.hasAttribute('data-dragging')).toBe(false)
      expect(el.items).toHaveLength(1)
    })

    it('ignores drags that carry no files', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files"></moul-file-upload>`,
      )
      const enter = new Event('dragenter', { bubbles: true, cancelable: true })
      Object.defineProperty(enter, 'dataTransfer', {
        value: { files: [], types: ['text/plain'], items: [] },
      })
      el.dropzone?.dispatchEvent(enter)
      expect(enter.defaultPrevented).toBe(false)
      expect(el.hasAttribute('data-dragging')).toBe(false)
    })

    it('ignores picks and drops while disabled, and blocks the drop from opening the file', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-disabled></moul-file-upload>`,
      )
      const zone = el.dropzone as HTMLButtonElement
      expect(zone.disabled).toBe(true)
      expect((el.inputElement as HTMLInputElement).disabled).toBe(true)

      const over = dragEvent('dragover', [pdf()])
      zone.dispatchEvent(over)
      expect(over.defaultPrevented).toBe(true)
      expect(
        (over as unknown as { dataTransfer: DataTransfer }).dataTransfer
          .dropEffect,
      ).toBe('none')
      zone.dispatchEvent(dragEvent('dragenter', [pdf()]))
      expect(el.hasAttribute('data-dragging')).toBe(false)

      zone.dispatchEvent(dragEvent('drop', [pdf()]))
      await pick(el, [pdf()])
      expect(el.items).toEqual([])
    })
  })

  describe('validation', () => {
    it('rejects files outside accept by extension, wildcard and exact type', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Files"
          is-multiple
          accept="image/*, .PDF, text/csv"
        ></moul-file-upload>`,
      )
      const onReject = vi.fn()
      el.addEventListener('reject', onReject)
      const exe = new File(['x'], 'setup.exe', {
        type: 'application/x-msdownload',
      })
      const csv = new File(['x'], 'data.csv', { type: 'text/csv' })
      const doc = new File(['x'], 'notes.txt', { type: 'text/plain' })
      await pick(el, [png(), pdf('upper.pdf'), csv, exe, doc])

      expect(el.items.map((item) => item.name)).toEqual([
        'photo.png',
        'upper.pdf',
        'data.csv',
      ])
      expect(onReject).toHaveBeenCalledTimes(2)
      expect(onReject.mock.calls[0][0].detail).toEqual({
        file: exe,
        reason: 'type',
      })
      expect(onReject.mock.calls[1][0].detail.file).toBe(doc)
      expect(query(el, '[part~="rejection"]')?.textContent).toBe(
        'setup.exe is not an accepted file type. notes.txt is not an accepted file type.',
      )
      expect(el.inputElement?.getAttribute('accept')).toBe(
        'image/*, .PDF, text/csv',
      )
    })

    it('rejects files larger than max-size', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" max-size="1024"></moul-file-upload>`,
      )
      const onReject = vi.fn()
      el.addEventListener('reject', onReject)
      const big = pdf('big.pdf', 2000)
      await pick(el, [big])

      expect(el.items).toEqual([])
      expect(onReject.mock.calls[0][0].detail).toEqual({
        file: big,
        reason: 'size',
      })
      expect(query(el, '[part~="rejection"]')?.textContent).toBe(
        'big.pdf is larger than 1 KB.',
      )
      expect(query(el, '[role="status"]')?.textContent).toBe(
        'big.pdf is larger than 1 KB.',
      )
    })

    it('rejects files past max-files, counting the ones already listed', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple max-files="2"></moul-file-upload>`,
      )
      const onReject = vi.fn()
      el.addEventListener('reject', onReject)
      await pick(el, [pdf('a.pdf')])
      await pick(el, [pdf('b.pdf'), pdf('c.pdf')])

      expect(el.items.map((item) => item.name)).toEqual(['a.pdf', 'b.pdf'])
      expect(onReject).toHaveBeenCalledTimes(1)
      expect(onReject.mock.calls[0][0].detail.reason).toBe('count')
      expect(query(el, '[part~="rejection"]')?.textContent).toBe(
        'c.pdf was not added: up to 2 files are allowed.',
      )

      // The next pick replaces the old message.
      await pick(el, [new File(['x'], 'nope.pdf')])
      expect(query(el, '[part~="rejection"]')?.textContent).toBe(
        'nope.pdf was not added: up to 2 files are allowed.',
      )
    })

    it('keeps the first file of a multi-file drop in single mode', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar"></moul-file-upload>`,
      )
      const onReject = vi.fn()
      el.addEventListener('reject', onReject)
      el.dropzone?.dispatchEvent(
        dragEvent('drop', [png('a.png'), png('b.png')]),
      )
      await el.updateComplete

      expect(el.items.map((item) => item.name)).toEqual(['a.png'])
      expect(onReject.mock.calls[0][0].detail.reason).toBe('count')
      expect(query(el, '[part~="rejection"]')?.textContent).toBe(
        'b.png was not added: only one file is allowed.',
      )
    })
  })

  describe('upload flow', () => {
    it('uploads at once, shows indeterminate then real progress, and stores the response', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar" .upload=${upload}></moul-file-upload>`,
      )
      const statuses: string[] = []
      el.addEventListener('change', (event) => {
        statuses.push(
          (event as CustomEvent<{ items: FileUploadItem[] }>).detail.items[0]
            ?.status,
        )
      })
      const file = png()
      await pick(el, [file])

      expect(upload).toHaveBeenCalledTimes(1)
      expect(calls[0].file).toBe(file)
      expect(calls[0].context.signal.aborted).toBe(false)
      expect(el.items[0].status).toBe('uploading')
      const bar = query<MoulProgressBar>(el, 'moul-progress-bar')
      expect(bar?.isIndeterminate).toBe(true)
      expect(bar?.getAttribute('aria-label')).toBe('Uploading photo.png')
      expect(query(el, '[part~="meta"]')?.textContent).toContain('Uploading…')

      calls[0].context.onProgress(40.4)
      await el.updateComplete
      expect(el.items[0].progress).toBe(40.4)
      expect(bar?.isIndeterminate).toBe(false)
      expect(bar?.value).toBe(40.4)
      expect(query(el, '[part~="meta"]')?.textContent).toContain('40%')

      calls[0].context.onProgress(250)
      expect(el.items[0].progress).toBe(100)

      const response = { url: 'https://cdn.example.com/photo.png', size: 3 }
      calls[0].resolve(response)
      await settle(el)

      expect(el.items[0].status).toBe('done')
      expect(el.items[0].response).toBe(response)
      expect(query(el, 'moul-progress-bar')).toBeNull()
      expect(query(el, '[part~="item"]')?.getAttribute('part')).toBe(
        'item item-done',
      )
      expect(statuses).toEqual(['uploading', 'done'])
      expect(query(el, '[role="status"]')?.textContent).toBe(
        'photo.png uploaded.',
      )
    })

    it('marks a failed upload with its message and retries it', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple .upload=${upload}></moul-file-upload>`,
      )
      await pick(el, [pdf()])
      calls[0].reject(new Error('Storage is full'))
      await settle(el)

      expect(el.items[0].status).toBe('error')
      expect(el.items[0].error).toBe('Storage is full')
      expect(query(el, '[part~="upload-error"]')?.textContent).toBe(
        'Storage is full',
      )
      expect(query(el, '[role="status"]')?.textContent).toBe(
        'report.pdf failed to upload: Storage is full',
      )

      const retry = button(el, 'Retry report.pdf') as HTMLButtonElement
      expect(retry).not.toBeNull()
      retry.click()
      await el.updateComplete
      expect(upload).toHaveBeenCalledTimes(2)
      expect(el.items[0].status).toBe('uploading')
      expect(el.items[0].error).toBeUndefined()
      expect(button(el, 'Retry report.pdf')).toBeNull()

      calls[1].resolve({ ok: true })
      await settle(el)
      expect(el.items[0].status).toBe('done')
    })

    it('reports a failure without a message as "Upload failed."', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Files"
          .upload=${() => Promise.reject(undefined)}
        ></moul-file-upload>`,
      )
      await pick(el, [pdf()])
      await settle(el)
      expect(el.items[0].error).toBe('Upload failed.')
    })

    it('cancels an upload: aborts the signal, removes the row, ignores the late result', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple .upload=${upload}></moul-file-upload>`,
      )
      const onRemove = vi.fn()
      el.addEventListener('remove', onRemove)
      await pick(el, [pdf()])

      const cancel = button(el, 'Cancel report.pdf') as HTMLButtonElement
      expect(cancel).not.toBeNull()
      expect(button(el, 'Remove report.pdf')).toBeNull()
      cancel.click()
      await el.updateComplete

      expect(calls[0].context.signal.aborted).toBe(true)
      expect(onRemove).toHaveBeenCalledTimes(1)
      expect(el.items).toEqual([])
      expect(query(el, '[role="status"]')?.textContent).toBe(
        'Canceled report.pdf.',
      )

      calls[0].resolve({ late: true })
      await settle(el)
      expect(el.items).toEqual([])
    })

    it('keeps uploading when the cancel is prevented', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" .upload=${upload}></moul-file-upload>`,
      )
      el.addEventListener('remove', (event) => event.preventDefault())
      await pick(el, [pdf()])
      ;(button(el, 'Cancel report.pdf') as HTMLButtonElement).click()
      await el.updateComplete
      expect(calls[0].context.signal.aborted).toBe(false)
      expect(el.items[0].status).toBe('uploading')
    })

    it('aborts an upload whose item the app removes from items', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" .upload=${upload}></moul-file-upload>`,
      )
      await pick(el, [pdf()])
      el.items = []
      await el.updateComplete
      expect(calls[0].context.signal.aborted).toBe(true)
    })

    it('leaves files idle without upload, for the app to drive through updateItem', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files"></moul-file-upload>`,
      )
      const onChange = vi.fn()
      await pick(el, [pdf()])
      el.addEventListener('change', onChange)
      const { id } = el.items[0]

      el.updateItem(id, { status: 'uploading', progress: 10 })
      await el.updateComplete
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(query<MoulProgressBar>(el, 'moul-progress-bar')?.value).toBe(10)
      // App-driven uploads have no Cancel; Remove lets the app stop them.
      expect(button(el, 'Remove report.pdf')).not.toBeNull()

      el.updateItem(id, { progress: 60 })
      expect(onChange).toHaveBeenCalledTimes(1)

      el.updateItem(id, { status: 'error', error: 'Offline' })
      await el.updateComplete
      expect(onChange).toHaveBeenCalledTimes(2)
      // No Retry without an upload function to retry with.
      expect(button(el, 'Retry report.pdf')).toBeNull()
      el.updateItem('missing', { status: 'done' })
      expect(onChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('single mode', () => {
    it('replaces the current file, aborting its upload, and offers Replace and Remove', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar" .upload=${upload}></moul-file-upload>`,
      )
      await pick(el, [png('first.png')])
      expect(el.dropzone).toBeNull()
      await pick(el, [png('second.png')])

      expect(calls[0].context.signal.aborted).toBe(true)
      expect(el.items.map((item) => item.name)).toEqual(['second.png'])
      calls[1].resolve({ id: 1 })
      await settle(el)

      const click = vi.spyOn(el.inputElement as HTMLInputElement, 'click')
      const replace = button(el, 'Replace second.png') as HTMLButtonElement
      expect(replace.textContent?.trim()).toBe('Replace')
      replace.click()
      expect(click).toHaveBeenCalledTimes(1)
      expect(button(el, 'Remove second.png')).not.toBeNull()
      expect(el.inputElement?.hasAttribute('multiple')).toBe(false)
    })

    it('replaces the file when another is dropped on the row', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar"></moul-file-upload>`,
      )
      await pick(el, [png('first.png')])
      query(el, '[part~="item"]')?.dispatchEvent(
        dragEvent('drop', [png('second.png')]),
      )
      await el.updateComplete
      expect(el.items.map((item) => item.name)).toEqual(['second.png'])
    })
  })

  describe('remove', () => {
    it('fires a cancelable remove first and keeps the item when prevented', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      await pick(el, [pdf('a.pdf'), pdf('b.pdf')])
      const [first] = el.items
      const onChange = vi.fn()
      el.addEventListener('change', onChange)
      el.addEventListener(
        'remove',
        (event) => {
          const { detail } = event as CustomEvent<{ item: FileUploadItem }>
          expect(detail.item).toBe(first)
          expect(el.items).toContain(first)
          event.preventDefault()
        },
        { once: true },
      )

      ;(button(el, 'Remove a.pdf') as HTMLButtonElement).click()
      await el.updateComplete
      expect(el.items).toHaveLength(2)
      expect(onChange).not.toHaveBeenCalled()

      ;(button(el, 'Remove a.pdf') as HTMLButtonElement).click()
      await el.updateComplete
      expect(el.items.map((item) => item.name)).toEqual(['b.pdf'])
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(query(el, '[role="status"]')?.textContent).toBe('Removed a.pdf.')
      expect(el.removeItem('missing')).toBe(false)
    })

    it('shows the drop zone again after the only file is removed', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar"></moul-file-upload>`,
      )
      await pick(el, [png()])
      ;(button(el, 'Remove photo.png') as HTMLButtonElement).click()
      await el.updateComplete
      expect(el.dropzone).not.toBeNull()
      expect(query(el, '[part~="list"]')).toBeNull()
    })
  })

  describe('form association', () => {
    it('submits each picked File under name', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload name="docs" label="Files" is-multiple></moul-file-upload>`,
      )
      expect(formValue(el)).toBeNull()
      const a = pdf('a.pdf')
      const b = png('b.png')
      await pick(el, [a, b])

      const value = formValue(el) as FormData
      expect(value).toBeInstanceOf(FormData)
      expect(value.getAll('docs')).toHaveLength(2)
      expect((value.getAll('docs')[0] as File).name).toBe('a.pdf')
      expect((value.getAll('docs')[1] as File).name).toBe('b.png')
    })

    it('is valueMissing while is-required and no item is idle, uploading or done', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-required></moul-file-upload>`,
      )
      expect(el.validity?.valueMissing).toBe(true)
      expect(el.validationMessage).toBe('Select a file.')
      expect(el.checkValidity()).toBe(false)

      el.items = [{ id: '1', name: 'old.pdf', status: 'error' }]
      await el.updateComplete
      expect(el.validity?.valueMissing).toBe(true)

      el.items = [{ id: '1', name: 'old.pdf', status: 'done', url: '/f/1' }]
      await el.updateComplete
      expect(el.validity?.valid).toBe(true)

      el.items = []
      el.errorMessage = 'Attach the signed contract.'
      await el.updateComplete
      expect(el.validationMessage).toBe('Attach the signed contract.')
    })

    it('clears the list on form reset and follows the form disabled state', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" .upload=${upload}></moul-file-upload>`,
      )
      await pick(el, [new File(['x'], 'bad.exe'), pdf()])
      el.formResetCallback()
      await el.updateComplete
      expect(el.items).toEqual([])
      expect(calls[0].context.signal.aborted).toBe(true)
      expect(query(el, '[part~="rejection"]')).toBeNull()

      el.formDisabledCallback(true)
      await el.updateComplete
      expect(el.isDisabled).toBe(true)
      expect(el.hasAttribute('is-disabled')).toBe(true)
      el.formDisabledCallback(false)
      expect(el.isDisabled).toBe(false)
    })

    it('submits its files and resets with <moul-form>', async () => {
      await import('../Form/Form')
      const form = await fixture<
        HTMLElement & { getFormData(): FormData; reset(): void }
      >(
        html`<moul-form><moul-file-upload name="docs" label="Files" is-multiple></moul-file-upload></moul-form>`,
      )
      const el = form.querySelector('moul-file-upload') as MoulFileUpload
      await pick(el, [pdf('a.pdf'), png('b.png')])

      const files = form.getFormData().getAll('docs') as File[]
      expect(files.map((file) => file.name)).toEqual(['a.pdf', 'b.png'])

      form.reset()
      await el.updateComplete
      expect(el.items).toEqual([])
      expect(form.getFormData().getAll('docs')).toEqual([])
    })
  })

  describe('previews', () => {
    it('previews picked images with object URLs and revokes them on removal, replacement and disconnect', async () => {
      let count = 0
      const create = vi
        .spyOn(URL, 'createObjectURL')
        .mockImplementation(() => `blob:preview-${++count}`)
      const revoke = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => {})
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar"></moul-file-upload>`,
      )

      await pick(el, [png('a.png'), pdf()].slice(0, 1))
      const img = query<HTMLImageElement>(el, '[part~="thumbnail"] img')
      expect(img?.getAttribute('src')).toBe('blob:preview-1')
      expect(img?.getAttribute('alt')).toBe('')
      // Re-rendering reuses the URL.
      el.requestUpdate()
      await el.updateComplete
      expect(create).toHaveBeenCalledTimes(1)

      await pick(el, [png('b.png')])
      expect(revoke).toHaveBeenCalledWith('blob:preview-1')
      expect(
        query<HTMLImageElement>(el, '[part~="thumbnail"] img')?.getAttribute(
          'src',
        ),
      ).toBe('blob:preview-2')

      ;(button(el, 'Remove b.png') as HTMLButtonElement).click()
      await el.updateComplete
      expect(revoke).toHaveBeenCalledWith('blob:preview-2')

      await pick(el, [png('c.png')])
      const parent = el.parentElement as HTMLElement
      el.remove()
      expect(revoke).toHaveBeenCalledWith('blob:preview-3')
      parent.append(el)
      await el.updateComplete
      expect(
        query<HTMLImageElement>(el, '[part~="thumbnail"] img')?.getAttribute(
          'src',
        ),
      ).toBe('blob:preview-4')
    })

    it('shows a file icon for other files and the url for existing images', async () => {
      const create = vi.spyOn(URL, 'createObjectURL')
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Files"
          is-multiple
          .items=${[
            {
              id: 'existing',
              name: 'cover.jpg',
              url: 'https://cdn.example.com/cover.jpg?w=200',
              status: 'done',
            },
            {
              id: 'doc',
              name: 'contract.pdf',
              status: 'done',
              size: 5_242_880,
            },
          ]}
        ></moul-file-upload>`,
      )
      const [cover, contract] = queryAll(el, '[part~="thumbnail"]')
      expect(cover.querySelector('img')?.getAttribute('src')).toBe(
        'https://cdn.example.com/cover.jpg?w=200',
      )
      expect(contract.querySelector('img')).toBeNull()
      expect(contract.querySelector('svg')).not.toBeNull()
      expect(create).not.toHaveBeenCalled()
      expect(queryAll(el, '[part~="meta"]')[0]?.textContent).toContain('5 MB')
    })
  })

  describe('keyboard and screen readers', () => {
    it('is a native button named by the label and instructions that opens the picker', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Attachment" is-required></moul-file-upload>`,
      )
      const zone = el.dropzone as HTMLButtonElement
      expect(zone.tagName).toBe('BUTTON')
      expect(zone.type).toBe('button')
      // A native button: focusable without a tabindex of its own.
      expect(zone.hasAttribute('tabindex')).toBe(false)
      expect(idRefText(el, zone.getAttribute('aria-labelledby'))).toBe(
        'Attachment Drop a file here or browse',
      )
      expect(
        query(el, '[part~="required-indicator"]')?.getAttribute('aria-hidden'),
      ).toBe('true')

      // Enter and Space on a native button arrive as a click.
      const click = vi.spyOn(el.inputElement as HTMLInputElement, 'click')
      zone.click()
      expect(click).toHaveBeenCalledTimes(1)
      el.openPicker()
      expect(click).toHaveBeenCalledTimes(2)
      el.isDisabled = true
      await el.updateComplete
      el.openPicker()
      expect(click).toHaveBeenCalledTimes(2)
    })

    it('keeps the file input out of the tab order and out of sight', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple accept=".pdf"></moul-file-upload>`,
      )
      const input = el.inputElement as HTMLInputElement
      expect(input.hidden).toBe(true)
      expect(input.tabIndex).toBe(-1)
      expect(input.multiple).toBe(true)
      expect(input.accept).toBe('.pdf')
    })

    it('forwards focus() to the drop zone, or to the row in single mode', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Avatar"></moul-file-upload>`,
      )
      el.focus()
      expect(el.shadowRoot?.activeElement).toBe(el.dropzone)
      await pick(el, [png()])
      el.focus()
      expect(el.shadowRoot?.activeElement?.getAttribute('aria-label')).toBe(
        'Replace photo.png',
      )
    })

    it('names the list and every row action with the file', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Avatar"
          .items=${[
            {
              id: '1',
              name: 'avatar.png',
              url: 'https://cdn.example.com/avatar.png',
              status: 'done',
              createdAt: '2026-01-15T10:00:00Z',
            },
          ]}
        ></moul-file-upload>`,
      )
      const list = query(el, '[part~="list"]') as HTMLElement
      expect(list.tagName).toBe('UL')
      expect(list.getAttribute('role')).toBe('list')
      expect(idRefText(el, list.getAttribute('aria-labelledby'))).toBe('Avatar')
      expect(list.querySelectorAll('li')).toHaveLength(1)

      const open = button(el, 'Open avatar.png') as unknown as HTMLAnchorElement
      expect(open.tagName).toBe('A')
      expect(open.getAttribute('href')).toBe(
        'https://cdn.example.com/avatar.png',
      )
      expect(open.getAttribute('target')).toBe('_blank')
      expect(open.getAttribute('rel')).toBe('noopener noreferrer')
      expect(button(el, 'Replace avatar.png')).not.toBeNull()
      expect(button(el, 'Remove avatar.png')).not.toBeNull()
      expect(query(el, '[part~="meta"]')?.textContent).toContain(
        new Date('2026-01-15T10:00:00Z').toLocaleDateString(),
      )
    })

    it('does not link a url that is not http, https or blob', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Files"
          .items=${[
            {
              id: '1',
              name: 'x.pdf',
              url: 'javascript:alert(1)',
              status: 'done',
            },
          ]}
        ></moul-file-upload>`,
      )
      expect(button(el, 'Open x.pdf')).toBeNull()
    })

    it('marks errors with aria-invalid and links description, rejection and error text', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Contract"
          description="PDF up to 10 MB."
          accept=".pdf"
        ></moul-file-upload>`,
      )
      const zone = el.dropzone as HTMLButtonElement
      expect(zone.getAttribute('aria-invalid')).toBe('false')
      expect(idRefText(el, zone.getAttribute('aria-describedby'))).toBe(
        'PDF up to 10 MB.',
      )

      await pick(el, [png()])
      el.errorMessage = 'A contract is required.'
      await el.updateComplete
      expect(zone.getAttribute('aria-invalid')).toBe('true')
      expect(idRefText(el, zone.getAttribute('aria-describedby'))).toBe(
        'PDF up to 10 MB. photo.png is not an accepted file type. A contract is required.',
      )

      el.errorMessage = ''
      el.isInvalid = true
      await el.updateComplete
      expect(zone.getAttribute('aria-invalid')).toBe('true')
    })

    it('moves the description and error onto Replace while the drop zone is hidden', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Contract" error-message="Too old."></moul-file-upload>`,
      )
      await pick(el, [pdf()])
      const replace = button(el, 'Replace report.pdf') as HTMLButtonElement
      expect(replace.getAttribute('aria-invalid')).toBe('true')
      expect(idRefText(el, replace.getAttribute('aria-describedby'))).toBe(
        'Too old.',
      )
    })

    it('announces added, rejected and removed files in a polite live region', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple accept=".pdf"></moul-file-upload>`,
      )
      const status = query(el, '[part~="status"]') as HTMLElement
      expect(status.getAttribute('role')).toBe('status')
      expect(status.textContent).toBe('')

      await pick(el, [pdf('a.pdf')])
      expect(status.textContent).toBe('Added a.pdf.')
      await pick(el, [pdf('b.pdf'), pdf('c.pdf'), png('d.png')])
      expect(status.textContent).toBe(
        'Added 2 files. d.png is not an accepted file type.',
      )
      ;(button(el, 'Remove b.pdf') as HTMLButtonElement).click()
      await el.updateComplete
      expect(status.textContent).toBe('Removed b.pdf.')
    })

    it('moves focus to a remaining button when the focused one goes away', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
      )
      await pick(el, [pdf('a.pdf'), pdf('b.pdf')])
      const removeB = button(el, 'Remove b.pdf') as HTMLButtonElement
      removeB.focus()
      removeB.click()
      await el.updateComplete
      expect(el.shadowRoot?.activeElement?.getAttribute('aria-label')).toBe(
        'Remove a.pdf',
      )

      ;(button(el, 'Remove a.pdf') as HTMLButtonElement).click()
      await el.updateComplete
      expect(el.shadowRoot?.activeElement).toBe(el.dropzone)
    })

    it('moves focus from a retried row to its Cancel button', async () => {
      const { upload, calls } = manualUpload()
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload label="Files" .upload=${upload}></moul-file-upload>`,
      )
      await pick(el, [pdf()])
      calls[0].reject(new Error('Nope'))
      await settle(el)
      const retry = button(el, 'Retry report.pdf') as HTMLButtonElement
      retry.focus()
      retry.click()
      await el.updateComplete
      expect(el.shadowRoot?.activeElement?.getAttribute('aria-label')).toBe(
        'Cancel report.pdf',
      )
    })
  })

  describe('reduced motion', () => {
    const css = (Array.isArray(fileUploadStyles) ? fileUploadStyles : [])
      .map((sheet: unknown) => (sheet as { cssText?: string }).cssText ?? '')
      .join('\n')

    it('drops the drag scale and transitions under reduced motion', () => {
      const block = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      )
      expect(block).toContain('transition: none')
      expect(block).toContain('transform: none')
      expect(block).toContain(":host([data-dragging]) [part~='dropzone']")
    })

    it('slides a new row in normally and shows it in place under reduced motion', async () => {
      const rowStyleAfter = async (isReduced: boolean) => {
        const motion = mockReducedMotion(isReduced)
        try {
          const el = await fixture<MoulFileUpload>(
            html`<moul-file-upload label="Files" is-multiple></moul-file-upload>`,
          )
          await pick(el, [pdf()])
          await new Promise((resolve) => setTimeout(resolve, 40))
          return query(el, '[part~="item"]')?.getAttribute('style') ?? ''
        } finally {
          motion.restore()
        }
      }

      expect(await rowStyleAfter(false)).toContain('translateY')
      expect(await rowStyleAfter(true)).toBe('')
    })

    it('does not animate rows that were there on first render', async () => {
      const el = await fixture<MoulFileUpload>(
        html`<moul-file-upload
          label="Files"
          .items=${[{ id: '1', name: 'a.pdf', status: 'done' }]}
        ></moul-file-upload>`,
      )
      await new Promise((resolve) => setTimeout(resolve, 40))
      expect(query(el, '[part~="item"]')?.getAttribute('style') ?? '').toBe('')
    })
  })
})
