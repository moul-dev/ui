import type { PageProps } from 'waku/router'
import { unstable_notFound } from 'waku/router/server'
import { getMDXComponents } from '@/components/mdx'
import { getAuthor } from '@/lib/authors'
import { devlogSource, getDevlogPageImage } from '@/lib/source'

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
      <meta property="og:type" content="article" />
      <meta property="og:title" content={`${page.data.title} — Moul Devlog`} />
      <meta property="og:description" content={page.data.description} />
      <meta
        property="og:image"
        content={
          getDevlogPageImage(page.data.title, page.data.description, 'facebook')
            .url
        }
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${page.data.title} — Moul Devlog`} />
      <meta name="twitter:description" content={page.data.description} />
      <meta
        name="twitter:image"
        content={
          getDevlogPageImage(page.data.title, page.data.description, 'x').url
        }
      />

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
              className="p-1.5 rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/30 transition-all duration-150"
              title={`${author.name}'s GitHub`}
            >
              <svg
                role="img"
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="GitHub"
              >
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
            {author.x && (
              <a
                href={author.x}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/30 transition-all duration-150"
                title={`${author.name}'s X (Twitter)`}
              >
                <svg
                  role="img"
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-label="X"
                >
                  <title>X</title>
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
                </svg>
              </a>
            )}
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
