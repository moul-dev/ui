import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { FormInternalsController } from '../../controllers/form-internals.controller'
import { defineElement } from '../../utils/define-element'
import {
  createFileId as createId,
  uploadErrorText as errorText,
  formatFileSize,
  isImageFile as isImage,
  matchesAccept,
  safeHref,
} from '../../utils/files'
import { close, externalLink } from '../../utils/icons'
import { EASE_OUT, subtleAnimate } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import '../ProgressBar/ProgressBar'
import '../Tooltip/Tooltip'
import { fileUploadStyles } from './FileUpload.styles'
import {
  fileIcon,
  retryIcon,
  trashIcon,
  uploadCloudIcon,
  uploadIcon,
} from './icons'

export type FileUploadStatus = 'idle' | 'uploading' | 'done' | 'error'

/** One row of the file list: a picked file, or one that already exists (a record's current file). */
export interface FileUploadItem {
  id: string
  name: string
  /** Bytes. */
  size?: number
  /** MIME type. */
  type?: string
  /** Where the stored file lives; shows the Open link and, for images, the thumbnail. */
  url?: string
  /** The picked file; preset items usually have none. */
  file?: File
  status: FileUploadStatus
  /** 0 to 100; unset while the amount is unknown. */
  progress?: number
  /** Why the upload failed. */
  error?: string
  /** What `upload` resolved with, such as the server's upload result. */
  response?: unknown
  createdAt?: string | number | Date
}

export interface FileUploadContext {
  /** Aborts when the user cancels the upload or the item leaves the list. */
  signal: AbortSignal
  /** Reports progress from 0 to 100; until the first call the bar is indeterminate. */
  onProgress(percent: number): void
}

export type FileUploadFunction = (
  file: File,
  context: FileUploadContext,
) => Promise<unknown>

export type FileRejectReason = 'type' | 'size' | 'count'

export interface FileUploadChangeDetail {
  items: FileUploadItem[]
}

export interface FileUploadRemoveDetail {
  item: FileUploadItem
}

export interface FileUploadRejectDetail {
  file: File
  reason: FileRejectReason
}

/**
 * A form-associated file picker: a drop zone that opens the file dialog or
 * takes dropped files, over a list of the chosen files, each with an image
 * thumbnail or file icon, its name, size and date, and upload progress on a
 * `moul-progress-bar`. Set `upload` to send each accepted file as soon as it
 * is picked, with Cancel and Retry, or leave it unset and drive the rows with
 * `updateItem()`. Without `is-multiple` it holds one file that Replace or
 * another drop swaps out, like a record's attachment field; preset `items`
 * with `status: 'done'` and a `url` to show files that already exist.
 *
 * Keyboard and screen readers: the drop zone is a native `<button>` named by
 * the label plus its instructions ("Drop a file here or browse"); `Enter` or
 * `Space` opens the file dialog, whose hidden `<input type="file">` carries
 * `accept` and `multiple`. Dropping needs a pointer; keyboard users pick
 * through the dialog. The files form a list, and each row's Open link and
 * Retry, Replace, Cancel and Remove buttons are reached with `Tab` and named
 * with the file ("Remove report.pdf"). When the focused button goes away (a
 * removal, a retry, a replacement), focus moves to a button in the nearest
 * row, or to the drop zone. An uploading row has a progressbar named
 * "Uploading report.pdf". A polite live region announces added, uploaded,
 * failed, canceled, removed and rejected files. `aria-invalid` follows
 * `is-invalid` and `error-message`, and `aria-describedby` points at the
 * description, the rejection message and the error message; with one file
 * attached and the drop zone hidden, both move to the Replace button. The
 * required marker is hidden from screen readers, so `is-required` reaches them
 * only through form validation.
 *
 * Reduced motion: the drop zone shows a dragged file by colour alone instead
 * of also growing slightly, new rows appear in place instead of sliding and
 * fading in, and progress bars jump to each value instead of gliding.
 *
 * @slot instructions - Replaces "Drop a file here or browse" in the drop zone.
 * @fires change - The list changed or an item's status did; `detail.items` is the new list.
 * @fires remove - Cancelable, before an item is removed or its upload canceled; `detail.item`. Prevent it to keep the item.
 * @fires reject - A file failed `accept`, `max-size` or `max-files`; `detail.file` and `detail.reason` (`'type' | 'size' | 'count'`).
 * @csspart base - The wrapper; files can be dropped anywhere on it.
 * @csspart label - The label row.
 * @csspart required-indicator - The `*` after the label.
 * @csspart dropzone - The drop zone button.
 * @csspart dropzone-icon - The cloud icon in the drop zone.
 * @csspart instructions - The drop zone text.
 * @csspart browse - The "browse" word in the drop zone text.
 * @csspart list - The file list.
 * @csspart item - Each file row; also `item-idle`, `item-uploading`, `item-done` or `item-error`.
 * @csspart thumbnail - The image preview or file icon.
 * @csspart name - The file name.
 * @csspart meta - Size, date and upload percentage.
 * @csspart upload-error - A failed upload's message.
 * @csspart progress - The row's `moul-progress-bar`.
 * @csspart actions - The row's buttons.
 * @csspart action - Each row action; also `open`, `retry`, `replace` or `remove`.
 * @csspart description - The description text.
 * @csspart rejection - The message about files that were not added.
 * @csspart error - The error message.
 * @cssprop --file-upload-thumbnail-size - Width and height of each row's thumbnail (2.75rem).
 */
export class MoulFileUpload extends LitElement {
  static override styles = fileUploadStyles
  static readonly formAssociated = true

  static override properties = {
    name: { type: String, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    accept: { type: String, reflect: true },
    isMultiple: { type: Boolean, reflect: true, attribute: 'is-multiple' },
    maxSize: { type: Number, attribute: 'max-size' },
    maxFiles: { type: Number, attribute: 'max-files' },
    isRequired: { type: Boolean, reflect: true, attribute: 'is-required' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isInvalid: { type: Boolean, reflect: true, attribute: 'is-invalid' },
    errorMessage: { type: String, reflect: true, attribute: 'error-message' },
    items: { attribute: false },
    upload: { attribute: false },
    rejections: { state: true },
    announcement: { state: true },
  }

  declare name: string
  declare label: string
  declare description: string
  /** Comma-separated MIME types (`image/png`), wildcards (`image/*`) and extensions (`.pdf`). */
  declare accept: string
  declare isMultiple: boolean
  /** Largest accepted file in bytes; 0 for no limit. */
  declare maxSize: number
  /** Most files the list holds with `is-multiple`; 0 for no limit. */
  declare maxFiles: number
  declare isRequired: boolean
  declare isDisabled: boolean
  declare isInvalid: boolean
  declare errorMessage: string
  declare items: FileUploadItem[]
  declare upload: FileUploadFunction | null
  private declare rejections: string[]
  private declare announcement: string

  public internalsController: FormInternalsController
  private readonly uploads = new Map<string, AbortController>()
  private readonly previews = new Map<string, { file: File; url: string }>()
  private dragDepth = 0
  private pendingAnnouncement = ''
  private focusIndex: number | null = null
  private focusAction = ''

  constructor() {
    super()
    this.name = ''
    this.label = ''
    this.description = ''
    this.accept = ''
    this.isMultiple = false
    this.maxSize = 0
    this.maxFiles = 0
    this.isRequired = false
    this.isDisabled = false
    this.isInvalid = false
    this.errorMessage = ''
    this.items = []
    this.upload = null
    this.rejections = []
    this.announcement = ''

    this.internalsController = new FormInternalsController(this)
  }

  public get inputElement(): HTMLInputElement | null {
    return this.renderRoot?.querySelector('input[type="file"]') ?? null
  }

  /** The drop zone button; null in single mode while a file is attached. */
  public get dropzone(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('[part~="dropzone"]') ?? null
  }

  public override focus(options?: FocusOptions): void {
    ;(
      this.dropzone ??
      this.renderRoot?.querySelector<HTMLElement>('[part~="item"] button')
    )?.focus(options)
  }

  public checkValidity(): boolean {
    return this.internalsController.checkValidity()
  }

  public reportValidity(): boolean {
    return this.internalsController.reportValidity()
  }

  public get validity(): ValidityState | null {
    return this.internalsController.validity
  }

  public get validationMessage(): string {
    return this.internalsController.validationMessage
  }

  /** Opens the system file dialog. */
  public openPicker(): void {
    if (!this.isDisabled) this.inputElement?.click()
  }

  /**
   * Adds files as if the user picked them: each is checked against `accept`,
   * `max-size` and `max-files` (rejects fire `reject`), and the accepted ones
   * start uploading when `upload` is set. In single mode the first accepted
   * file replaces the current item.
   */
  public addFiles(files: Iterable<File> | ArrayLike<File>): void {
    const list = Array.from(files)
    if (this.isDisabled || list.length === 0) return
    const room = !this.isMultiple
      ? 1
      : this.maxFiles > 0
        ? this.maxFiles - this.items.length
        : Number.POSITIVE_INFINITY
    const added: FileUploadItem[] = []
    const rejections: string[] = []
    for (const file of list) {
      const reason: FileRejectReason | null = !matchesAccept(file, this.accept)
        ? 'type'
        : this.maxSize > 0 && file.size > this.maxSize
          ? 'size'
          : added.length >= room
            ? 'count'
            : null
      if (reason) {
        rejections.push(this.rejectionText(file, reason))
        this.emit('reject', { file, reason })
        continue
      }
      added.push({
        id: createId(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        status: this.upload ? 'uploading' : 'idle',
      })
    }
    this.rejections = rejections
    if (added.length > 0) {
      this.items = this.isMultiple ? [...this.items, ...added] : added
      this.release()
      this.announce(
        added.length === 1
          ? `Added ${added[0].name}.`
          : `Added ${added.length} files.`,
      )
    }
    for (const text of rejections) this.announce(text)
    if (added.length === 0) return
    this.emitChange()
    for (const item of added) void this.startUpload(item.id)
  }

  /**
   * Merges `patch` into an item, for apps that run uploads themselves. Fires
   * `change` when the status changes.
   */
  public updateItem(
    id: string,
    patch: Partial<Omit<FileUploadItem, 'id'>>,
  ): void {
    const current = this.items.find((item) => item.id === id)
    if (!current) return
    const next = { ...current, ...patch, id }
    this.items = this.items.map((item) => (item === current ? next : item))
    if (next.status !== current.status) this.emitChange()
  }

  /**
   * Removes an item, aborting its upload, after a cancelable `remove` event.
   * Returns false when there is no such item or the event was prevented.
   */
  public removeItem(id: string): boolean {
    const item = this.items.find((entry) => entry.id === id)
    if (!item || !this.emit('remove', { item }, true)) return false
    const wasUploading = this.uploads.has(id)
    this.items = this.items.filter((entry) => entry !== item)
    this.release()
    this.announce(`${wasUploading ? 'Canceled' : 'Removed'} ${item.name}.`)
    this.emitChange()
    return true
  }

  public formResetCallback(): void {
    this.items = []
    this.rejections = []
    this.release()
  }

  public formDisabledCallback(disabled: boolean): void {
    this.isDisabled = disabled
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // Previews were revoked on disconnect; render recreates them.
    if (this.hasUpdated) this.requestUpdate()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    for (const { url } of this.previews.values()) URL.revokeObjectURL(url)
    this.previews.clear()
    this.dragDepth = 0
    this.removeAttribute('data-dragging')
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('items')) this.release()
    if (
      changed.has('items') ||
      changed.has('name') ||
      changed.has('isRequired') ||
      changed.has('errorMessage')
    ) {
      this.syncFormValue()
    }
    const active = this.shadowRoot?.activeElement as HTMLElement | null
    this.focusIndex = active
      ? Number(active.closest<HTMLElement>('[data-index]')?.dataset.index ?? -1)
      : null
    this.focusAction = active?.dataset.action ?? ''
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    this.pendingAnnouncement = ''
    if (changed.has('label')) {
      warnMissingLabel(this, 'file upload', Boolean(this.label))
    }
    if (!changed.has('items')) return
    this.restoreFocus()
    const previous = changed.get('items') as FileUploadItem[] | undefined
    if (!previous) return
    const before = new Set(previous.map((item) => item.id))
    const rows = this.renderRoot.querySelectorAll('[part~="item"]')
    this.items.forEach((item, index) => {
      if (before.has(item.id) || !rows[index]) return
      subtleAnimate(
        rows[index],
        {
          opacity: [0, 1],
          transform: ['translateY(-6px)', 'translateY(0px)'],
        },
        { duration: 0.22, ease: EASE_OUT },
      )
    })
  }

  private emit(type: string, detail: unknown, cancelable = false): boolean {
    return this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
        cancelable,
      }),
    )
  }

  private emitChange(): void {
    this.emit('change', { items: this.items })
  }

  private announce(text: string): void {
    this.pendingAnnouncement = this.pendingAnnouncement
      ? `${this.pendingAnnouncement} ${text}`
      : text
    this.announcement = this.pendingAnnouncement
  }

  private rejectionText(file: File, reason: FileRejectReason): string {
    if (reason === 'type') return `${file.name} is not an accepted file type.`
    if (reason === 'size') {
      return `${file.name} is larger than ${formatFileSize(this.maxSize)}.`
    }
    const max = this.isMultiple ? this.maxFiles : 1
    return `${file.name} was not added: ${max === 1 ? 'only one file is allowed' : `up to ${max} files are allowed`}.`
  }

  /** Aborts uploads and revokes previews whose item left the list or changed file. */
  private release(): void {
    const byId = new Map(this.items.map((item) => [item.id, item]))
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
    const item = this.items.find((entry) => entry.id === id)
    const upload = this.upload
    if (!item?.file || !upload) return
    this.uploads.get(id)?.abort()
    const controller = new AbortController()
    this.uploads.set(id, controller)
    const isCurrent = () => this.uploads.get(id) === controller
    this.updateItem(id, {
      status: 'uploading',
      progress: undefined,
      error: undefined,
    })
    try {
      const response = await upload(item.file, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (isCurrent() && Number.isFinite(percent)) {
            this.updateItem(id, {
              progress: Math.min(100, Math.max(0, percent)),
            })
          }
        },
      })
      if (!isCurrent()) return
      this.uploads.delete(id)
      this.updateItem(id, { status: 'done', progress: 100, response })
      this.announce(`${item.name} uploaded.`)
    } catch (error) {
      if (!isCurrent()) return
      this.uploads.delete(id)
      const message = errorText(error)
      this.updateItem(id, { status: 'error', error: message })
      this.announce(`${item.name} failed to upload: ${message}`)
    }
  }

  private syncFormValue(): void {
    let value: FormData | null = null
    for (const { file } of this.items) {
      if (!file || !this.name) continue
      value ??= new FormData()
      value.append(this.name, file)
    }
    this.internalsController.setValue(value)
    const isMissing =
      this.isRequired && !this.items.some((item) => item.status !== 'error')
    if (isMissing) {
      this.internalsController.setValidity(
        { valueMissing: true },
        this.errorMessage || 'Select a file.',
        this.dropzone ?? undefined,
      )
    } else {
      this.internalsController.setValidity({})
    }
  }

  /** An object URL for a picked image, made once per file and revoked by `release()`. */
  private previewSrc(item: FileUploadItem): string {
    if (!isImage(item)) return ''
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

  /** Puts focus back in the field when the focused button was removed by this update. */
  private restoreFocus(): void {
    if (this.focusIndex === null || this.shadowRoot?.activeElement) return
    const rows = this.renderRoot.querySelectorAll<HTMLElement>('[part~="item"]')
    const row = rows[Math.max(0, Math.min(this.focusIndex, rows.length - 1))]
    const target =
      row?.querySelector<HTMLElement>(`[data-action="${this.focusAction}"]`) ??
      row?.querySelector<HTMLElement>('button') ??
      this.dropzone
    target?.focus()
  }

  private hasFiles(event: DragEvent): boolean {
    const data = event.dataTransfer
    if (!data) return false
    return (
      Array.from(data.types ?? []).includes('Files') ||
      Array.from(data.items ?? []).some((entry) => entry.kind === 'file')
    )
  }

  private handleDragEnter = (event: DragEvent): void => {
    if (!this.hasFiles(event)) return
    event.preventDefault()
    this.dragDepth++
    this.toggleAttribute('data-dragging', !this.isDisabled)
  }

  private handleDragOver = (event: DragEvent): void => {
    if (!this.hasFiles(event)) return
    // Also when disabled, so a stray drop does not open the file in the tab.
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.isDisabled ? 'none' : 'copy'
    }
  }

  private handleDragLeave = (): void => {
    this.dragDepth = Math.max(0, this.dragDepth - 1)
    if (this.dragDepth === 0) this.removeAttribute('data-dragging')
  }

  private handleDrop = (event: DragEvent): void => {
    const files = event.dataTransfer?.files
    if (!files?.length) return
    event.preventDefault()
    this.dragDepth = 0
    this.removeAttribute('data-dragging')
    this.addFiles(files)
  }

  private handleInputChange = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (input.files) this.addFiles(input.files)
    // Lets the same file be picked again.
    input.value = ''
  }

  private renderItem(item: FileUploadItem, index: number, describedBy: string) {
    const { name, status } = item
    const isUploading = status === 'uploading'
    const canCancel = isUploading && this.uploads.has(item.id)
    const canRetry = status === 'error' && Boolean(item.file && this.upload)
    const src = this.previewSrc(item)
    const href = isUploading ? null : safeHref(item.url)
    const date = item.createdAt === undefined ? null : new Date(item.createdAt)
    const meta = [
      item.size === undefined ? '' : formatFileSize(item.size),
      date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : '',
      !isUploading
        ? ''
        : item.progress === undefined
          ? 'Uploading…'
          : `${Math.round(item.progress)}%`,
    ].filter(Boolean)

    return html`
      <li part="item item-${status}" data-index=${index}>
        <span part="thumbnail">
          ${src ? html`<img src=${src} alt="" decoding="async" />` : fileIcon}
        </span>
        <div part="info">
          <span part="name" title=${name}>${name}</span>
          ${
            meta.length > 0
              ? html`<span part="meta">${meta.map((text) => html`<span>${text}</span>`)}</span>`
              : nothing
          }
          ${
            status === 'error'
              ? html`<span part="upload-error">${item.error || 'Upload failed.'}</span>`
              : nothing
          }
          ${
            isUploading
              ? html`<moul-progress-bar
                  part="progress"
                  size="sm"
                  aria-label=${`Uploading ${name}`}
                  .value=${item.progress ?? 0}
                  ?is-indeterminate=${item.progress === undefined}
                ></moul-progress-bar>`
              : nothing
          }
        </div>
        <div part="actions">
          ${
            href
              ? html`<moul-tooltip content="Open in new tab">
                  <a
                    part="action open"
                    data-action="open"
                    href=${href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label=${`Open ${name}`}
                    >${externalLink()}</a
                  >
                </moul-tooltip>`
              : nothing
          }
          ${
            canRetry
              ? html`<moul-tooltip content="Retry upload">
                  <button
                    part="action retry"
                    data-action="retry"
                    type="button"
                    aria-label=${`Retry ${name}`}
                    ?disabled=${this.isDisabled}
                    @click=${() => this.startUpload(item.id)}
                  >
                    ${retryIcon}
                  </button>
                </moul-tooltip>`
              : nothing
          }
          ${
            !this.isMultiple && !isUploading
              ? html`<button
                  part="action replace"
                  data-action="replace"
                  type="button"
                  aria-label=${`Replace ${name}`}
                  aria-describedby=${describedBy || nothing}
                  aria-invalid=${this.isInvalid || this.errorMessage ? 'true' : nothing}
                  ?disabled=${this.isDisabled}
                  @click=${this.openPicker}
                >
                  ${uploadIcon}<span>Replace</span>
                </button>`
              : nothing
          }
          <moul-tooltip content=${canCancel ? 'Cancel upload' : 'Remove file'}>
            <button
              part="action remove"
              data-action="remove"
              type="button"
              aria-label=${`${canCancel ? 'Cancel' : 'Remove'} ${name}`}
              ?disabled=${this.isDisabled}
              @click=${() => this.removeItem(item.id)}
            >
              ${canCancel ? close() : trashIcon}
            </button>
          </moul-tooltip>
        </div>
      </li>
    `
  }

  protected override render() {
    const hasLabel = Boolean(this.label)
    const isInvalid = this.isInvalid || Boolean(this.errorMessage)
    const describedBy = [
      this.description ? 'description' : '',
      this.rejections.length > 0 ? 'rejection' : '',
      this.errorMessage ? 'error' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const hasDropzone = this.isMultiple || this.items.length === 0

    return html`
      <div
        part="base"
        @dragenter=${this.handleDragEnter}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        ${
          hasLabel
            ? html`<div part="label">
                <span id="label">${this.label}</span>${
                  this.isRequired
                    ? html`<span part="required-indicator" aria-hidden="true">*</span>`
                    : nothing
                }
              </div>`
            : nothing
        }
        <input
          type="file"
          hidden
          tabindex="-1"
          accept=${this.accept || nothing}
          ?multiple=${this.isMultiple}
          ?disabled=${this.isDisabled}
          @change=${this.handleInputChange}
        />
        ${
          hasDropzone
            ? html`<button
                part="dropzone"
                type="button"
                aria-labelledby=${hasLabel ? 'label instructions' : 'instructions'}
                aria-describedby=${describedBy || nothing}
                aria-invalid=${isInvalid ? 'true' : 'false'}
                ?disabled=${this.isDisabled}
                @click=${this.openPicker}
              >
                <span part="dropzone-icon">${uploadCloudIcon}</span>
                <span id="instructions" part="instructions">
                  <slot name="instructions"
                    >Drop ${this.isMultiple ? 'files' : 'a file'} here or
                    <span part="browse">browse</span></slot
                  >
                </span>
              </button>`
            : nothing
        }
        ${
          this.items.length > 0
            ? html`<ul
                part="list"
                role="list"
                aria-labelledby=${hasLabel ? 'label' : nothing}
                aria-label=${hasLabel ? nothing : 'Files'}
              >
                ${this.items.map((item, index) =>
                  this.renderItem(item, index, describedBy),
                )}
              </ul>`
            : nothing
        }
        ${
          this.description
            ? html`<div id="description" part="description">${this.description}</div>`
            : nothing
        }
        ${
          this.rejections.length > 0
            ? html`<div id="rejection" part="rejection">${this.rejections.join(' ')}</div>`
            : nothing
        }
        ${
          this.errorMessage
            ? html`<div id="error" part="error">${this.errorMessage}</div>`
            : nothing
        }
        <div part="status" role="status">${this.announcement}</div>
      </div>
    `
  }
}

defineElement('moul-file-upload', MoulFileUpload)

declare global {
  interface HTMLElementTagNameMap {
    'moul-file-upload': MoulFileUpload
  }
}
