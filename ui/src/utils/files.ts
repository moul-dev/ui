/**
 * File helpers shared by `<moul-file-upload>` and the attachments of
 * `<moul-prompt-input>`, so both accept, size and preview files the same way.
 */

const IMAGE_EXTENSION = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i
const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB']
const SAFE_PROTOCOLS = ['http:', 'https:', 'blob:']

let nextId = 0

/** A fresh id for a picked file. */
export const createFileId = (): string =>
  `file-${Date.now().toString(36)}-${nextId++}`

/** `1536` → `1.5 KB`, in steps of 1024. */
export function formatFileSize(bytes: number): string {
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024
    unit++
  }
  return `${unit === 0 ? size : Number(size.toFixed(1))} ${SIZE_UNITS[unit]}`
}

/** Matches the `accept` attribute's grammar: extensions, `type/*` wildcards and exact MIME types. */
export function matchesAccept(file: File, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return (
    tokens.length === 0 ||
    tokens.some((token) =>
      token.startsWith('.')
        ? name.endsWith(token)
        : token.endsWith('/*')
          ? type.startsWith(token.slice(0, -1))
          : type === token,
    )
  )
}

/** True for an image, by its MIME type or else its name or URL. */
export function isImageFile(item: {
  name: string
  type?: string
  url?: string
}): boolean {
  if (item.type) return item.type.startsWith('image/')
  const path = (item.url ?? '').split(/[?#]/)[0] ?? ''
  return IMAGE_EXTENSION.test(item.name) || IMAGE_EXTENSION.test(path)
}

/** The URL if it is safe to open as a link (http, https or blob), else null. */
export function safeHref(url: string | undefined): string | null {
  if (!url) return null
  try {
    return SAFE_PROTOCOLS.includes(new URL(url, document.baseURI).protocol)
      ? url
      : null
  } catch {
    return null
  }
}

/** A thrown upload error as a sentence for the file's row. */
export const uploadErrorText = (error: unknown): string =>
  (error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '') || 'Upload failed.'
