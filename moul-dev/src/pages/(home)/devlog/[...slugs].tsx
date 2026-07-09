import type { PageProps } from 'waku/router'
import { unstable_notFound } from 'waku/router/server'
import { getMDXComponents } from '@/components/mdx'
import { devlogSource } from '@/lib/source'
import { getAuthor } from '@/lib/authors'

export default function Page({ slugs }: PageProps<'/devlog/[...slugs]'>) {
  const page = devlogSource.getPage(slugs)
  if (!page) unstable_notFound()

  const MDX = page.data.body
  const date = new Date(page.data.date)
  const author = getAuthor(page.data.author)

  return (
    <>
      <title>{`${page.data.title} — Moul Devlog`}</title>
      <meta name="description" content={page.data.description} />

      <main className="mx-auto w-full max-w-3xl px-6 py-20 lg:py-32">
        <div className="mb-8">
          <a
            href="/devlog"
            className="text-sm font-medium text-fd-muted-foreground hover:text-fd-primary transition-colors duration-200"
          >
            ← Back to Devlog
          </a>
        </div>

        <time
          dateTime={date.toISOString()}
          className="text-sm font-mono text-fd-muted-foreground/80"
        >
          {date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mt-2 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fd-foreground to-fd-muted-foreground">
          {page.data.title}
        </h1>

        {page.data.description && (
          <p className="text-fd-muted-foreground text-lg mb-8 leading-relaxed">
            {page.data.description}
          </p>
        )}

        <div className="flex items-center justify-between border-y border-fd-border/40 py-4 mb-10">
          <div className="flex items-center gap-3">
            <img
              src={author.avatar}
              alt={author.name}
              className="size-10 rounded-full ring-1 ring-fd-border bg-fd-muted"
            />
            <div>
              <span className="block text-sm font-semibold text-fd-foreground">
                {author.name}
              </span>
              <span className="block text-xs text-fd-muted-foreground">
                {author.title}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={author.github}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/30 transition-all duration-150"
              title={`${author.name}'s GitHub`}
            >
              <svg
                className="size-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            <a
              href={author.x}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/30 transition-all duration-150"
              title={`${author.name}'s X (Twitter)`}
            >
              <svg
                className="size-4.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MDX components={getMDXComponents()} />
        </article>
      </main>
    </>
  )
}

export async function getConfig() {
  const pages = devlogSource
    .generateParams()
    .map((item) => (item.lang ? [item.lang, ...item.slug] : item.slug))

  return {
    render: 'static' as const,
    staticPaths: pages,
  } as const
}
