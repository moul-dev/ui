import type { ApiContext } from 'waku/router'
import { unstable_notFound } from 'waku/router/server'
import { getLLMText, source } from '@/lib/source'

export async function GET(
  _: Request,
  { params }: ApiContext<'/llms.mdx/docs/[...slugs]/content.md'>,
) {
  const isKm = params.slugs[0] === 'km'
  const lang = isKm ? 'km' : 'en'
  const slugs = isKm ? params.slugs.slice(1) : params.slugs
  const page = source.getPage(slugs, lang)
  if (!page) unstable_notFound()

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  })
}

export async function getConfig() {
  const enPages = source.getPages('en').map((page) => page.slugs)
  const kmPages = source.getPages('km').map((page) => ['km', ...page.slugs])

  return {
    render: 'static' as const,
    staticPaths: [...enPages, ...kmPages],
  } as const
}
