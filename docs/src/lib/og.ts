export interface OgImageOptions {
  /** The main title text to display on the image. Supports {text|color} syntax. */
  title?: string
  /** The subtitle text. Supports {text|color} syntax. */
  subtitle?: string
  /** Custom base color for title (hex without #, or CSS color name). */
  title_color?: string
  /** Custom base color for subtitle (hex without #, or CSS color name). */
  subtitle_color?: string
  /** Layout style: default, profile, devlog, or logo. */
  layout?: 'default' | 'profile' | 'devlog' | 'logo'
  /** Object key for image stored in Cloudflare R2 bucket. */
  image_key?: string
  /** GitHub username or avatar URL (https://github.com/username.png). */
  avatar?: string
  /** Custom author name to display next to avatar. */
  author_name?: string
  /** Custom author role/description. */
  author_role?: string
  /** Boolean flag to hide author avatar, name, and role. */
  hide_author?: boolean
  /** Target platform dimensions (default: facebook = 1200x630). */
  target?:
    | 'facebook'
    | 'x'
    | 'linkedin'
    | 'instagram'
    | 'instagram-square'
    | 'instagram-portrait'
    | 'instagram-story'
  /** Use the dedicated /devlog template route. */
  isDevlog?: boolean
}

export const OG_BASE_URL = 'https://og.moul.dev'
export const DEFAULT_SITE_TITLE = 'Moul UI'
export const DEFAULT_TAGLINE = 'Engineered for flow. Crafted to scale.'
export const DEFAULT_DESCRIPTION =
  'Accessible, zero-runtime React UI component library built on React Aria and StyleX.'

/**
 * Builds a dynamic Open Graph image URL pointing to https://og.moul.dev
 */
export function getOgImageUrl(options: OgImageOptions = {}): string {
  const {
    isDevlog = false,
    title,
    subtitle,
    title_color,
    subtitle_color,
    layout,
    image_key,
    avatar,
    author_name,
    author_role,
    hide_author,
    target,
  } = options

  const baseUrl = isDevlog ? `${OG_BASE_URL}/devlog` : `${OG_BASE_URL}/`
  const params = new URLSearchParams()

  if (title) params.set('title', title)
  if (subtitle) params.set('subtitle', subtitle)
  if (title_color) params.set('title_color', title_color)
  if (subtitle_color) params.set('subtitle_color', subtitle_color)
  if (layout && !isDevlog && layout !== 'default') params.set('layout', layout)
  if (image_key) params.set('image_key', image_key)
  if (avatar) params.set('avatar', avatar)
  if (author_name) params.set('author_name', author_name)
  if (author_role) params.set('author_role', author_role)
  if (hide_author !== undefined) params.set('hide_author', String(hide_author))
  if (target && target !== 'facebook') params.set('target', target)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Generates an OG image URL for the homepage.
 */
export function getHomeOgImageUrl(): string {
  return getOgImageUrl({
    title: DEFAULT_SITE_TITLE,
    subtitle: DEFAULT_TAGLINE,
  })
}

/**
 * Generates an OG image URL for documentation pages.
 */
export function getDocOgImageUrl(title: string, description?: string): string {
  return getOgImageUrl({
    title,
    subtitle: description || DEFAULT_TAGLINE,
  })
}

/**
 * Generates an OG image URL for devlog / changelog posts.
 */
export function getDevlogOgImageUrl(
  title: string,
  options: {
    subtitle?: string
    author_name?: string
    avatar?: string
    author_role?: string
    hide_author?: boolean
  } = {},
): string {
  return getOgImageUrl({
    isDevlog: true,
    title,
    subtitle: options.subtitle,
    author_name: options.author_name,
    avatar: options.avatar,
    author_role: options.author_role,
    hide_author: options.hide_author,
  })
}
