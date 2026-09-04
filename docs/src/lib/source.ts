import { changelog, docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server'
import { i18n } from './i18n'
import { getDocOgImageUrl } from './og'
import { changelogRoute, docsContentRoute, docsRoute } from './shared'

export const source = loader({
  i18n,
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  plugins: [lucideIconsPlugin()],
})

export const changelogSource = loader({
  source: toFumadocsSource(changelog, []),
  baseUrl: changelogRoute,
})

export function getPageImage(slugs: string[], lang?: string) {
  const page = source.getPage(slugs, lang)
  const title = page?.data.title || slugs[slugs.length - 1] || 'Documentation'
  const description = page?.data.description

  return {
    segments: slugs,
    url: getDocOgImageUrl(title, description),
  }
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments =
    page.locale && page.locale !== i18n.defaultLanguage
      ? [page.locale, ...page.slugs, 'content.md']
      : [...page.slugs, 'content.md']

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
