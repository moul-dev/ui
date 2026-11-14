import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { PlaceholderCycleController } from '../../controllers/placeholder-cycle.controller'
import { defineElement } from '../../utils/define-element'
import {
  createFileId,
  formatFileSize,
  isImageFile,
  matchesAccept,
  uploadErrorText,
} from '../../utils/files'
import {
  arrowUp,
  chevronDown,
  close,
  paperclip,
  stopSquare,
} from '../../utils/icons'
import { isImplicitSubmissionKey } from '../../utils/implicit-submission'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { scatterText } from '../../utils/scatter-text'
import '../DropdownMenu/DropdownMenu'
import type { DropdownMenuActionDetail } from '../DropdownMenu/DropdownMenu'
import type {
  FileUploadFunction,
  FileUploadItem,
} from '../FileUpload/FileUpload'
import { fileIcon } from '../FileUpload/icons'
import { promptInputStyles } from './PromptInput.styles'

/** A model the picker offers. */
export interface PromptModel {
  value: string
  label: string
  /** A line under the label in the menu: "Fast and cheap". */
  description?: string
}

/** A file attached to the prompt; the same shape as a `<moul-file-upload>` item. */
export type PromptAttachment = FileUploadItem

export type PromptSubmitKey = 'enter' | 'mod-enter'

export interface PromptSubmitDetail {
  /** The prompt text. */
  value: string
  attachments: PromptAttachment[]
  /** The chosen model's `value`, or empty. */
  model: string
}

export interface PromptModelChangeDetail {
  value: string
  model: PromptModel | undefined
}

export interface PromptAttachmentsChangeDetail {
  attachments: PromptAttachment[]
}

export interface PromptAttachmentRejectDetail {
  file: File
  reason: 'type' | 'size' | 'count'
}

const LINE_HEIGHT_FALLBACK = 24

/**
 * The composer of a chat with a language model: a text box that grows with
 * what is typed, a send button that turns into a stop button while the model
 * answers, and, when asked for, a model picker and file attachments. `Enter`
 * sends (or `Ctrl`/`⌘` + `Enter` with `submit-key="mod-enter"`), and
 * `Arrow Up` in an empty box brings back earlier prompts. `placeholders`
 * rotates the hint, and `vanish-on-submit` scatters the sent text away.
 *
 * Sending fires a cancelable `promptsubmit` with the text, the attachments
 * and the model; unless it is cancelled the box empties and the prompt joins
 * `history`. Set `is-generating` while the answer streams: the send button
 * becomes Stop, which fires `stop`, and sending waits. With
 * `allow-attachments`, files come in through the paperclip button, a paste
 * or a drop, and are checked against `accept`, `max-size` and `max-files`;
 * set `upload` to send each one as soon as it is attached, as
 * `<moul-file-upload>` does.
 *
 * Keyboard and screen readers: the text box is a native `<textarea>` named
 * by `label` ("Message") and described by a hint that says how to send.
 * `Enter` sends unless an input method is composing text (Khmer, Japanese
 * and other IMEs), and `Shift` + `Enter` adds a line. `Arrow Up` at the start
 * of an empty box, or while browsing, steps back through `history`, `Arrow
 * Down` steps forward to the draft, and `Escape` returns to the draft; while
 * the model answers, `Escape` stops it. The send, stop, attach and remove
 * buttons are native buttons with names ("Send message", "Stop generating",
 * "Attach files", "Remove report.pdf"), and the model picker is a
 * `<moul-dropdown-menu>` of radio items whose trigger says "Model: …". A
 * polite live region reports attached, rejected, uploaded and failed files.
 * Rotating hints are hidden from screen readers, which hear one stable
 * placeholder.
 *
 * Reduced motion: attachments appear without sliding in, the rotating hints
 * swap in place, sent text clears at once instead of scattering, and the
 * buttons change colour without fading.
 *
 * @slot start - Controls placed after the attach button, such as a tool toggle.
 * @slot end - Controls placed before the send button.
 * @fires promptsubmit - The prompt was sent; cancelable. `detail` is `{ value, attachments, model }`.
 * @fires stop - The stop button was used, or `Escape` pressed, while generating.
 * @fires input - The text changed.
 * @fires modelchange - Another model was picked; `detail` is `{ value, model }`.
 * @fires attachmentschange - Attachments were added, removed or changed status; `detail` is `{ attachments }`.
 * @fires attachmentreject - A file was refused; `detail` is `{ file, reason }` with `type`, `size` or `count`.
 * @csspart base - The composer's surface.
 * @csspart attachments - The list of attached files.
 * @csspart attachment - Each attached file.
 * @csspart textarea - The text box.
 * @csspart placeholder - The rotating hint.
 * @csspart toolbar - The row of buttons under the text box.
 * @csspart attach-button - The paperclip button.
 * @csspart model-button - The model picker's trigger.
 * @csspart send-button - The send or stop button.
 * @cssprop --prompt-input-max-rows - Rows the text box grows to before it scrolls; `max-rows` sets it. Defaults to `8`.
 */
export class MoulPromptInput extends LitElement {
  static override styles = promptInputStyles

  static override properties = {
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    placeholders: { attribute: false },
    placeholderInterval: { type: Number, attribute: 'placeholder-interval' },
    isGenerating: { type: Boolean, reflect: true, attribute: 'is-generating' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    models: { attribute: false },
    model: { type: String, reflect: true },
    allowAttachments: {
      type: Boolean,
      reflect: true,
      attribute: 'allow-attachments',
    },
    accept: { type: String },
    maxFiles: { type: Number, attribute: 'max-files' },
    maxSize: { type: Number, attribute: 'max-size' },
    attachments: { attribute: false },
    upload: { attribute: false },
    history: { attribute: false },
    maxHistory: { type: Number, attribute: 'max-history' },
    submitKey: { type: String, attribute: 'submit-key' },
    maxRows: { type: Number, attribute: 'max-rows' },
    vanishOnSubmit: {
      type: Boolean,
      reflect: true,
      attribute: 'vanish-on-submit',
    },
    isDragging: { state: true },
    announcement: { state: true },
  }

  /** The text in the box. */
  declare value: string
  /** The text box's accessible name. */
  declare label: string
  /** A fixed placeholder; also what screen readers hear when `placeholders` rotate. */
  declare placeholder: string
  /** Hints the placeholder rotates through while the box is empty. */
  declare placeholders: string[]
  /** Milliseconds each hint stays; at least 1000. */
  declare placeholderInterval: number
  /** The model is answering: the send button becomes Stop and sending waits. */
  declare isGenerating: boolean
  declare isDisabled: boolean
  /** The models to pick from; the picker shows when there are any. */
  declare models: PromptModel[]
  /** The chosen model's `value`; defaults to the first model. */
  declare model: string
  /** Show the attach button and take pasted and dropped files. */
  declare allowAttachments: boolean
  /** File types to take, as in `<input accept>`: `image/*,.pdf`. */
  declare accept: string
  /** The most files at once; 0 for no limit. */
  declare maxFiles: number
  /** The largest file in bytes; 0 for no limit. */
  declare maxSize: number
  /** The attached files. */
  declare attachments: PromptAttachment[]
  /** Sends each attached file; while it runs the file shows progress and sending waits. */
  declare upload: FileUploadFunction | null
  /** Earlier prompts, oldest first; each sent prompt is added. */
  declare history: string[]
  /** The most prompts `history` keeps. */
  declare maxHistory: number
  /** `enter` sends on Enter (Shift + Enter for a new line); `mod-enter` sends on Ctrl or ⌘ + Enter. */
  declare submitKey: PromptSubmitKey
  /** Rows the box grows to before it scrolls. */
  declare maxRows: number
  /** Scatter the sent text away instead of clearing it at once. */
  declare vanishOnSubmit: boolean
  /** @internal */
  declare isDragging: boolean
  /** @internal */
  declare announcement: string

  private readonly hints = new PlaceholderCycleController(this, {
    hints: () => (Array.isArray(this.placeholders) ? this.placeholders : []),
    interval: () => this.placeholderInterval,
    isIdle: () => !!this.value,
  })
  /** Where `Arrow Up` has reached in `history`; -1 while editing the draft. */
  private historyIndex = -1
  private draft = ''
  private dragDepth = 0
  private readonly uploads = new Map<string, AbortController>()
  private readonly previews = new Map<string, { file: File; url: string }>()
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.value = ''
    this.label = 'Message'
    this.placeholder = ''
    this.placeholders = []
    this.placeholderInterval = 3000
    this.isGenerating = false
    this.isDisabled = false
    this.models = []
    this.model = ''
    this.allowAttachments = false
    this.accept = ''
    this.maxFiles = 10
    this.maxSize = 0
    this.attachments = []
    this.upload = null
    this.history = []
    this.maxHistory = 50
    this.submitKey = 'enter'
    this.maxRows = 8
    this.vanishOnSubmit = false
    this.isDragging = false
    this.announcement = ''
  }

  public get textarea(): HTMLTextAreaElement | null {
    return this.renderRoot?.querySelector('textarea') ?? null
  }

  /** True when there is something to send and nothing in the way. */
  public get canSubmit(): boolean {
    return (
      !this.isDisabled &&
      !this.isGenerating &&
      (this.value.trim() !== '' || this.attachmentList().length > 0)
    )
  }

  public override focus(options?: FocusOptions): void {
    this.textarea?.focus(options)
  }

  /**
   * Sends the prompt as `Enter` does: fires `promptsubmit` and, unless that
   * is cancelled, empties the box. Returns whether it was sent. It waits
   * while generating, while files upload, or while a file has failed.
   */
  public submit(): boolean {
    if (!this.canSubmit) return false
    const attachments = this.attachmentList()
    if (attachments.some((item) => item.status === 'uploading')) {
      this.announce('Wait for the files to finish uploading.')
      return false
    }
    if (attachments.some((item) => item.status === 'error')) {
      this.announce('Remove the files that failed to upload first.')
      return false
    }
    const value = this.value
    const sent = this.dispatchEvent(
      new CustomEvent<PromptSubmitDetail>('promptsubmit', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { value, attachments, model: this.currentModel()?.value ?? '' },
      }),
    )
    if (!sent) return false
    this.remember(value)
    const textarea = this.textarea
    const scroll = textarea?.scrollTop ?? 0
    this.setValue('')
    if (attachments.length) this.setAttachments([])
    const layer = this.renderRoot?.querySelector<HTMLElement>('.vanish-layer')
    if (this.vanishOnSubmit && layer && value) {
      void scatterText(layer, value, { scrollTop: scroll })
    }
    return true
  }

  /** Fires `stop`, as the stop button does, while generating. */
  public stop(): void {
    if (!this.isGenerating) return
    this.dispatchEvent(
      new CustomEvent('stop', { bubbles: true, composed: true }),
    )
  }

  /** Empties the box and the attachments. */
  public clear(): void {
    this.setValue('')
    this.setAttachments([])
  }

  /** Attaches files as a pick, paste or drop does, checking `accept`, `max-size` and `max-files`. */
  public addFiles(files: Iterable<File> | ArrayLike<File>): void {
    const list = Array.from(files)
    if (this.isDisabled || !list.length) return
    const current = this.attachmentList()
    const room =
      this.maxFiles > 0
        ? Math.max(0, this.maxFiles - current.length)
        : Number.POSITIVE_INFINITY
    const added: PromptAttachment[] = []
    const messages: string[] = []
    for (const file of list) {
      const reason = !matchesAccept(file, this.accept ?? '')
        ? 'type'
        : this.maxSize > 0 && file.size > this.maxSize
          ? 'size'
          : added.length >= room
            ? 'count'
            : null
      if (reason) {
        messages.push(
          reason === 'type'
            ? `${file.name} is not an accepted file type.`
            : reason === 'size'
              ? `${file.name} is larger than ${formatFileSize(this.maxSize)}.`
              : `${file.name} was not added: up to ${this.maxFiles} files are allowed.`,
        )
        this.emit<PromptAttachmentRejectDetail>('attachmentreject', {
          file,
          reason,
        })
        continue
      }
      added.push({
        id: createFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: this.upload ? 'uploading' : 'idle',
      })
    }
    if (added.length) {
      messages.unshift(
        added.length === 1
          ? `Attached ${added[0]?.name}.`
          : `Attached ${added.length} files.`,
      )
      this.setAttachments([...current, ...added])
      for (const item of added) void this.startUpload(item.id)
    }
    if (messages.length) this.announce(messages.join(' '))
  }

  /** Removes an attachment and cancels its upload. */
  public removeAttachment(id: string): void {
    const item = this.attachmentList().find((entry) => entry.id === id)
    if (!item) return
    this.setAttachments(this.attachmentList().filter((entry) => entry !== item))
    this.announce(`Removed ${item.name}.`)
    this.focus()
  }

  /** Merges `patch` into an attachment, for apps that run uploads themselves. */
  public updateAttachment(
    id: string,
    patch: Partial<Omit<PromptAttachment, 'id'>>,
  ): void {
    const list = this.attachmentList()
    const current = list.find((item) => item.id === id)
    if (!current) return
    const next = { ...current, ...patch, id }
    this.setAttachments(
      list.map((item) => (item === current ? next : item)),
      {
        emit: next.status !== current.status,
      },
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated) this.observeWidth()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    for (const controller of this.uploads.values()) controller.abort()
    this.uploads.clear()
    for (const { url } of this.previews.values()) URL.revokeObjectURL(url)
    this.previews.clear()
    this.dragDepth = 0
    this.isDragging = false
  }

  private attachmentList(): PromptAttachment[] {
    return Array.isArray(this.attachments) ? this.attachments : []
  }

  private modelList(): PromptModel[] {
    return Array.isArray(this.models) ? this.models : []
  }

  private currentModel(): PromptModel | undefined {
    const models = this.modelList()
    return models.find((model) => model.value === this.model) ?? models[0]
  }

  private emit<T>(type: string, detail: T): boolean {
    return this.dispatchEvent(
      new CustomEvent<T>(type, { bubbles: true, composed: true, detail }),
    )
  }

  private announce(text: string): void {
    // Clearing the region for one render first makes a repeat of the same words heard again.
    this.announcement = ''
    this.updateComplete.then(() => {
      this.announcement = text
    })
  }

  private setValue(value: string): void {
    if (value === this.value) return
    this.value = value
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }

  private setAttachments(
    attachments: PromptAttachment[],
    { emit = true } = {},
  ): void {
    this.attachments = attachments
    this.release()
    if (emit) {
      this.emit<PromptAttachmentsChangeDetail>('attachmentschange', {
        attachments,
      })
    }
  }

  private remember(value: string): void {
    const text = value.trim()
    this.historyIndex = -1
    this.draft = ''
    if (!text) return
    const history = (Array.isArray(this.history) ? this.history : []).filter(
      (entry) => entry !== text,
    )
    history.push(text)
    const max = Math.max(0, Math.trunc(this.maxHistory) || 0)
    this.history = max ? history.slice(-max) : []
  }

  /** Cancels uploads and revokes previews of files that left the list. */
  private release(): void {
    const byId = new Map(this.attachmentList().map((item) => [item.id, item]))
    for (const [id, controller] of this.uploads) {
      if (byId.has(id)) continue
      controller.abort()
      this.uploads.delete(id)
    }
    for (const [id, preview] of this.previews) {
      if (byId.get(id)?.file === preview.file) continue
      URL.revokeObjectURL(preview.url)
      this.previews.delete(id)
    }
  }

  private async startUpload(id: string): Promise<void> {
    const item = this.attachmentList().find((entry) => entry.id === id)
    const upload = this.upload
    if (!item?.file || !upload) return
    const controller = new AbortController()
    this.uploads.set(id, controller)
    const isCurrent = () => this.uploads.get(id) === controller
    try {
      const response = await upload(item.file, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (isCurrent() && Number.isFinite(percent)) {
            this.updateAttachment(id, {
              progress: Math.min(100, Math.max(0, percent)),
            })
          }
        },
      })
      if (!isCurrent()) return
      this.uploads.delete(id)
      this.updateAttachment(id, { status: 'done', progress: 100, response })
      this.announce(`${item.name} uploaded.`)
    } catch (error) {
      if (!isCurrent()) return
      this.uploads.delete(id)
      const message = uploadErrorText(error)
      this.updateAttachment(id, { status: 'error', error: message })
      this.announce(`${item.name} failed to upload: ${message}`)
    }
  }

  private previewSrc(item: PromptAttachment): string {
    if (!isImageFile(item)) return ''
    if (!item.file || typeof URL.createObjectURL !== 'function') {
      return item.url ?? ''
    }
    let preview = this.previews.get(item.id)
    if (preview?.file !== item.file) {
      if (preview) URL.revokeObjectURL(preview.url)
      preview = { file: item.file, url: URL.createObjectURL(item.file) }
      this.previews.set(item.id, preview)
    }
    return preview.url
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (this.submitKey !== 'enter' && this.submitKey !== 'mod-enter') {
      this.submitKey = 'enter'
    }
    if (changed.has('attachments')) this.release()
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('maxRows')) this.fitHeight()
    const previous = changed.get('attachments') as
      | PromptAttachment[]
      | undefined
    if (previous) {
      const before = new Set(previous.map((item) => item.id))
      for (const chip of this.renderRoot.querySelectorAll<HTMLElement>(
        '[part~="attachment"]',
      )) {
        if (before.has(chip.dataset.id ?? '')) continue
        subtleAnimate(
          chip,
          { opacity: [0, 1], transform: ['scale(0.92)', 'scale(1)'] },
          { duration: 0.2, ease: EASE_OUT },
        )
      }
    }
  }

  protected override firstUpdated(): void {
    this.fitHeight()
    this.observeWidth()
  }

  /** A narrower box wraps the text onto more lines, so its height follows the width. */
  private observeWidth(): void {
    if (this.resizeObserver || typeof ResizeObserver !== 'function') return
    let width = 0
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.width ?? 0
      if (Math.abs(next - width) < 1) return
      width = next
      this.fitHeight()
    })
    this.resizeObserver.observe(this)
  }

  /** Grows the text box with its text, up to `max-rows`, then lets it scroll. */
  private fitHeight(): void {
    const textarea = this.textarea
    if (!textarea) return
    const style = getComputedStyle(textarea)
    const line = Number.parseFloat(style.lineHeight) || LINE_HEIGHT_FALLBACK
    const padding =
      (Number.parseFloat(style.paddingTop) || 0) +
      (Number.parseFloat(style.paddingBottom) || 0)
    const rows = Math.max(1, Math.trunc(this.maxRows) || 8)
    const max = line * rows + padding
    textarea.style.height = 'auto'
    const height = Math.min(textarea.scrollHeight, max)
    textarea.style.height = `${Math.max(height, line + padding)}px`
    textarea.style.overflowY =
      textarea.scrollHeight > max + 1 ? 'auto' : 'hidden'
  }

  private readonly handleInput = (event: Event): void => {
    const textarea = event.target as HTMLTextAreaElement
    this.historyIndex = -1
    this.value = textarea.value
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }

  private recall(direction: -1 | 1, event: KeyboardEvent): void {
    const history = Array.isArray(this.history) ? this.history : []
    if (!history.length) return
    if (this.historyIndex === -1) {
      if (direction === 1) return
      this.draft = this.value
      this.historyIndex = history.length - 1
    } else {
      this.historyIndex += direction
    }
    event.preventDefault()
    if (this.historyIndex < 0) this.historyIndex = 0
    let next: string
    if (this.historyIndex >= history.length) {
      this.historyIndex = -1
      next = this.draft
    } else {
      next = history[this.historyIndex] ?? ''
    }
    this.setValue(next)
    this.updateComplete.then(() => {
      const textarea = this.textarea
      if (!textarea) return
      const end = textarea.value.length
      textarea.setSelectionRange(end, end)
    })
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const textarea = event.target as HTMLTextAreaElement
    if (event.key === 'Enter') {
      const isMod = event.ctrlKey || event.metaKey
      const wantsSend =
        this.submitKey === 'mod-enter'
          ? isMod && !event.isComposing && event.keyCode !== 229
          : isImplicitSubmissionKey(event) && !event.shiftKey
      if (!wantsSend) return
      event.preventDefault()
      this.submit()
      return
    }
    if (event.key === 'Escape') {
      if (this.isGenerating) {
        event.preventDefault()
        event.stopPropagation()
        this.stop()
      } else if (this.historyIndex !== -1) {
        event.preventDefault()
        event.stopPropagation()
        this.historyIndex = -1
        this.setValue(this.draft)
      }
      return
    }
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
      return
    }
    const { selectionStart, selectionEnd, value } = textarea
    if (selectionStart !== selectionEnd) return
    const isBrowsing = this.historyIndex !== -1
    if (event.key === 'ArrowUp') {
      const onFirstLine = !value.slice(0, selectionStart).includes('\n')
      if ((value === '' || isBrowsing) && onFirstLine) this.recall(-1, event)
    } else if (event.key === 'ArrowDown' && isBrowsing) {
      const onLastLine = !value.slice(selectionEnd).includes('\n')
      if (onLastLine) this.recall(1, event)
    }
  }

  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (!this.allowAttachments || this.isDisabled) return
    const files = Array.from(event.clipboardData?.files ?? [])
    if (!files.length) return
    // An image copied from a page also carries its address as text; keep the file.
    event.preventDefault()
    this.addFiles(files)
  }

  private hasFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  private readonly handleDragEnter = (event: DragEvent): void => {
    if (!this.allowAttachments || this.isDisabled || !this.hasFiles(event)) {
      return
    }
    event.preventDefault()
    this.dragDepth++
    this.isDragging = true
  }

  private readonly handleDragOver = (event: DragEvent): void => {
    if (!this.allowAttachments || this.isDisabled || !this.hasFiles(event)) {
      return
    }
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  private readonly handleDragLeave = (): void => {
    if (!this.isDragging) return
    this.dragDepth = Math.max(0, this.dragDepth - 1)
    if (this.dragDepth === 0) this.isDragging = false
  }

  private readonly handleDrop = (event: DragEvent): void => {
    if (!this.allowAttachments || this.isDisabled || !this.hasFiles(event)) {
      return
    }
    event.preventDefault()
    this.dragDepth = 0
    this.isDragging = false
    this.addFiles(event.dataTransfer?.files ?? [])
  }

  private openPicker(): void {
    this.renderRoot
      .querySelector<HTMLInputElement>('input[type="file"]')
      ?.click()
  }

  private readonly handlePick = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (input.files) this.addFiles(input.files)
    input.value = ''
  }

  /** A press on the surface around the text puts the caret in the box. */
  private readonly handleSurfacePointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement
    if (
      target.closest('button, a, input, textarea, moul-dropdown-menu, [slot]')
    ) {
      return
    }
    event.preventDefault()
    this.focus()
  }

  private readonly handleModelAction = (
    event: CustomEvent<DropdownMenuActionDetail>,
  ): void => {
    event.stopPropagation()
    const value = event.detail.value
    if (value === this.currentModel()?.value) return
    this.model = value
    this.emit<PromptModelChangeDetail>('modelchange', {
      value,
      model: this.modelList().find((model) => model.value === value),
    })
  }

  private renderAttachment(item: PromptAttachment) {
    const preview = this.previewSrc(item)
    const status =
      item.status === 'uploading'
        ? item.progress === undefined
          ? 'Uploading'
          : `Uploading ${Math.round(item.progress)}%`
        : item.status === 'error'
          ? item.error || 'Upload failed'
          : item.size === undefined
            ? ''
            : formatFileSize(item.size)
    return html`
      <li
        part="attachment"
        class="attachment"
        data-id=${item.id}
        data-status=${item.status}
        title=${item.status === 'error' ? (item.error ?? nothing) : item.name}
      >
        <span class="thumb" aria-hidden="true">
          ${preview ? html`<img src=${preview} alt="" />` : fileIcon}
        </span>
        <span class="attachment-text">
          <span class="attachment-name">${item.name}</span>
          ${status ? html`<span class="attachment-meta">${status}</span>` : nothing}
        </span>
        ${
          item.status === 'uploading'
            ? html`<span
                class="attachment-progress"
                style="--_progress: ${item.progress ?? 30}%"
                ?data-indeterminate=${item.progress === undefined}
                aria-hidden="true"
              ></span>`
            : nothing
        }
        <button
          class="remove"
          type="button"
          aria-label="Remove ${item.name}"
          title="Remove"
          @click=${() => this.removeAttachment(item.id)}
        >
          ${close()}
        </button>
      </li>
    `
  }

  private renderModels() {
    const models = this.modelList()
    if (!models.length) return nothing
    const current = this.currentModel()
    return html`
      <moul-dropdown-menu
        class="models"
        placement="top-start"
        label="Model"
        ?is-disabled=${this.isDisabled}
        @action=${this.handleModelAction}
      >
        <button slot="trigger" part="model-button" class="tool-button model-button" type="button">
          <span class="sr-only">Model: </span>${current?.label ?? ''}
          ${chevronDown('chevron')}
        </button>
        ${models.map(
          (model) => html`
            <moul-menu-item
              type="radio"
              value=${model.value}
              ?is-checked=${model.value === current?.value}
            >
              <span class="model-option">
                <span>${model.label}</span>
                ${
                  model.description
                    ? html`<span class="model-description">${model.description}</span>`
                    : nothing
                }
              </span>
            </moul-menu-item>
          `,
        )}
      </moul-dropdown-menu>
    `
  }

  protected override render() {
    const attachments = this.attachmentList()
    const sendHint =
      this.submitKey === 'mod-enter'
        ? 'Press Control or Command and Enter to send.'
        : 'Press Enter to send and Shift and Enter for a new line.'
    return html`
      <div
        part="base"
        class="base"
        ?data-dragging=${this.isDragging}
        ?data-disabled=${this.isDisabled}
        @pointerdown=${this.handleSurfacePointerDown}
        @dragenter=${this.handleDragEnter}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        ${
          attachments.length
            ? html`<ul part="attachments" class="attachments" aria-label="Attachments">
                ${repeat(
                  attachments,
                  (item) => item.id,
                  (item) => this.renderAttachment(item),
                )}
              </ul>`
            : nothing
        }
        <div class="field">
          <textarea
            id="input"
            part="textarea"
            rows="1"
            aria-label=${this.label}
            aria-describedby="send-hint"
            placeholder=${this.placeholder || (this.placeholders?.[0] ?? '')}
            ?data-cycling=${this.hints.isActive}
            ?disabled=${this.isDisabled}
            .value=${this.value}
            @input=${this.handleInput}
            @keydown=${this.handleKeyDown}
            @paste=${this.handlePaste}
          ></textarea>
          ${this.hints.render(!!this.value)}
          <span class="vanish-layer" aria-hidden="true"></span>
        </div>
        <div part="toolbar" class="toolbar">
          ${
            this.allowAttachments
              ? html`<button
                  part="attach-button"
                  class="tool-button icon"
                  type="button"
                  aria-label="Attach files"
                  title="Attach files"
                  ?disabled=${this.isDisabled}
                  @click=${this.openPicker}
                >
                  ${paperclip()}
                </button>`
              : nothing
          }
          <slot name="start"></slot>
          ${this.renderModels()}
          <span class="spacer"></span>
          <slot name="end"></slot>
          ${
            this.isGenerating
              ? html`<button
                  part="send-button"
                  class="send stop"
                  type="button"
                  aria-label="Stop generating"
                  title="Stop generating"
                  @click=${() => this.stop()}
                >
                  ${stopSquare()}
                </button>`
              : html`<button
                  part="send-button"
                  class="send"
                  type="button"
                  aria-label="Send message"
                  title="Send message"
                  ?disabled=${!this.canSubmit}
                  @click=${() => this.submit()}
                >
                  ${arrowUp()}
                </button>`
          }
        </div>
        <input
          type="file"
          multiple
          hidden
          accept=${this.accept || nothing}
          tabindex="-1"
          @change=${this.handlePick}
        />
        <span class="sr-only" id="send-hint">${sendHint}</span>
        <span class="sr-only" role="status">${this.announcement}</span>
      </div>
    `
  }
}

defineElement('moul-prompt-input', MoulPromptInput)

declare global {
  interface HTMLElementTagNameMap {
    'moul-prompt-input': MoulPromptInput
  }
}
