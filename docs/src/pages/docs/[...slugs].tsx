import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { ExternalLink } from 'lucide-react'
import type { PageProps } from 'waku/router'
import { unstable_notFound } from 'waku/router/server'
import { getMDXComponents } from '@/components/mdx'
import { OpenGraph } from '@/components/open-graph'
import { getDocOgImageUrl } from '@/lib/og'
import { gitConfig } from '@/lib/shared'
import { getPageMarkdownUrl, source } from '@/lib/source'

export default function Page({ slugs }: PageProps<'/docs/[...slugs]'>) {
  const page = source.getPage(slugs)
  if (!page) unstable_notFound()

  const MDX = page.data.body
  const markdownUrl = getPageMarkdownUrl(page).url
  const reactAria = (page.data as { reactAria?: string }).reactAria
  const reactAriaLink = reactAria
    ? reactAria.startsWith('http')
      ? reactAria
      : `https://react-aria.adobe.com/${reactAria}`
    : null

  const ogImageUrl = getDocOgImageUrl(page.data.title, page.data.description)

  return (
    <DocsPage toc={page.data.toc}>
      <OpenGraph
        title={`${page.data.title} — Moul UI`}
        description={page.data.description}
        image={ogImageUrl}
        type="article"
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
        {reactAriaLink && (
          <a
            href={reactAriaLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({
              color: 'secondary',
              size: 'sm',
            })} gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground`}
          >
            <ExternalLink />
            React Aria
          </a>
        )}
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function getConfig() {
  const pages = source
    .generateParams()
    .map((item) => (item.lang ? [item.lang, ...item.slug] : item.slug))

  return {
    render: 'static' as const,
    staticPaths: pages,
  } as const
}
