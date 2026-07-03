import { changelogSource } from '@/lib/source'

export default function ChangelogIndex() {
  const pages = changelogSource.getPages().sort((a, b) => {
    const dateA = new Date(a.data.date)
    const dateB = new Date(b.data.date)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-2">Changelog</h1>
      <p className="text-fd-muted-foreground mb-12">
        All notable changes to Moul UI.
      </p>

      <div className="relative border-l border-fd-border pl-8 space-y-12">
        {pages.map((page) => {
          const date =
            typeof page.data.date === 'string'
              ? new Date(page.data.date)
              : page.data.date
          const { author, avatar } = page.data

          return (
            <article key={page.url} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[calc(2rem+5px)] top-1.5 size-2.5 rounded-full border-2 border-fd-primary bg-fd-background transition-colors group-hover:bg-fd-primary" />

              <time
                dateTime={date.toISOString()}
                className="text-sm text-fd-muted-foreground"
              >
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>

              <h2 className="text-xl font-semibold mt-1 mb-1">
                <a
                  href={page.url}
                  className="hover:text-fd-primary transition-colors"
                >
                  {page.data.title}
                </a>
              </h2>

              {page.data.description && (
                <p className="text-fd-muted-foreground text-sm mb-3">
                  {page.data.description}
                </p>
              )}

              {author && (
                <div className="flex items-center gap-2 mt-3">
                  {avatar && (
                    <img
                      src={avatar}
                      alt={author}
                      className="size-6 rounded-full"
                    />
                  )}
                  <span className="text-xs text-fd-muted-foreground">
                    {author}
                  </span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
