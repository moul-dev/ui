import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  getHomeOgImageUrl,
} from '@/lib/og'

export interface OpenGraphProps {
  /** Document page title (placed in <title> and og:title / twitter:title). */
  title: string
  /** Page description. */
  description?: string
  /** Open Graph image URL. Defaults to home OG image. */
  image?: string
  /** Open Graph type: website or article. Defaults to website. */
  type?: 'website' | 'article'
  /** Width of the OG image in pixels. Defaults to 1200. */
  imageWidth?: number
  /** Height of the OG image in pixels. Defaults to 630. */
  imageHeight?: number
  /** Alt text for the image. Defaults to title. */
  imageAlt?: string
  /** Published time for articles/changelog entries (ISO string). */
  publishedTime?: string
  /** Author name for articles/changelog entries. */
  author?: string
}

export function OpenGraph({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  type = 'website',
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  publishedTime,
  author,
}: OpenGraphProps) {
  const ogImage = image || getHomeOgImageUrl()
  const alt = imageAlt || title

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={DEFAULT_SITE_TITLE} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:image:alt" content={alt} />

      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={alt} />
    </>
  )
}
