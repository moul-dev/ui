import { changelog, docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server'
import { getDocOgImageUrl } from './og'
import { changelogRoute, docsContentRoute, docsRoute } from './shared'

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  plugins: [lucideIconsPlugin()],
})

export const changelogSource = loader({
  source: toFumadocsSource(changelog, []),
  baseUrl: changelogRoute,
})

export function getPageImage(slugs: string[]) {
  const page = source.getPage(slugs)
  const title = page?.data.title || slugs[slugs.length - 1] || 'Documentation'
  const description = page?.data.description

  return {
    segments: slugs,
    url: getDocOgImageUrl(title, description),
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
