import { devlog, docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server'
import { docsContentRoute, docsImageRoute, docsRoute } from './shared'

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  plugins: [lucideIconsPlugin()],
})

export const devlogSource = loader({
  source: toFumadocsSource(devlog, []),
  baseUrl: '/devlog',
})

export function getPageImage(slugs: string[]) {
  const segments = [...slugs, 'image.webp']

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  }
}

export function getDevlogPageImage(
  title: string,
  description?: string,
  target?: 'x' | 'facebook',
) {
  const formattedTitle = title.replace(/\bMoul\b/g, '{Moul|00CEE1}')
  const url = new URL('https://og.moul.dev/devlog')
  url.searchParams.set('title', formattedTitle)
  if (description) {
    url.searchParams.set('subtitle', description)
  }
  if (target) {
    url.searchParams.set('target', target)
  }
  return {
    url: url.toString(),
  }
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md']

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  }
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title} (${page.url})

${processed}`
}
