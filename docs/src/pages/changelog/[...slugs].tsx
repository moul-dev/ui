import type { PageProps } from 'waku/router'
import { unstable_notFound } from 'waku/router/server'
import { getMDXComponents } from '@/components/mdx'
import { changelogSource } from '@/lib/source'

export default function Page({ slugs }: PageProps<'/changelog/[...slugs]'>) {
  const page = changelogSource.getPage(slugs)
  if (!page) unstable_notFound()

  const MDX = page.data.body
  const { author, avatar, date } = page.data

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <div className="mb-6">
        <a
          href="/changelog"
          className="text-sm text-fd-muted-foreground hover:text-fd-primary transition-colors"
        >
          ← Back to Changelog
        </a>
      </div>

      <time
        dateTime={typeof date === 'string' ? date : date.toISOString()}
        className="text-sm text-fd-muted-foreground"
      >
        {new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>

      <h1 className="text-3xl font-bold mt-2 mb-2">{page.data.title}</h1>

      {page.data.description && (
        <p className="text-fd-muted-foreground text-lg mb-4">
          {page.data.description}
        </p>
      )}

      {author && (
        <div className="flex items-center gap-3 border-b pb-6 mb-8">
          {avatar && (
            <img src={avatar} alt={author} className="size-8 rounded-full" />
          )}
          <span className="text-sm font-medium">{author}</span>
        </div>
      )}

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <MDX components={getMDXComponents()} />
      </article>
    </main>
  )
}

export async function getConfig() {
  const pages = changelogSource
    .generateParams()
    .map((item) => (item.lang ? [item.lang, ...item.slug] : item.slug))

  return {
    render: 'static' as const,
    staticPaths: pages,
  } as const
}
