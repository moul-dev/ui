import { LiquidGlassCard } from '@/components/liquid-glass-card'
import { getAuthor } from '@/lib/authors'
import { devlogSource } from '@/lib/source'

export default function DevlogIndex() {
  const posts = devlogSource.getPages().sort((a, b) => {
    const dateA = new Date(a.data.date)
    const dateB = new Date(b.data.date)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <>
      <title>Devlog — Moul Developer Log</title>
      <meta
        name="description"
        content="Latest updates and developer logs from the Moul team."
      />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Devlog — Moul Developer Log" />
      <meta
        property="og:description"
        content="Latest updates and developer logs from the Moul team."
      />
      <meta property="og:image" content="https://moul.dev/og/facebook.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Devlog — Moul Developer Log" />
      <meta
        name="twitter:description"
        content="Latest updates and developer logs from the Moul team."
      />
      <meta name="twitter:image" content="https://moul.dev/og/x.png" />

      <main className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm leading-6 text-fd-muted-foreground ring-1 ring-fd-border/60 backdrop-blur-sm bg-fd-card/30 mb-6">
            <span className="font-mono text-xs tracking-wide">
              Developer Log
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-fd-foreground to-fd-muted-foreground">
            Behind the Scenes of Moul
          </h1>
          <p className="text-fd-muted-foreground text-lg">
            Engineering insights, design updates, and technical highlights from
            our team as we simplify the cloud.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 ring-1 ring-fd-border/50 rounded-2xl bg-fd-card/10 backdrop-blur-sm">
            <p className="text-fd-muted-foreground">
              No devlogs published yet. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => {
              const date = new Date(post.data.date)
              const author = getAuthor(post.data.author)

              return (
                <LiquidGlassCard key={post.url} className="h-full">
                  <div className="flex flex-col justify-between w-full h-full">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <time
                          dateTime={date.toISOString()}
                          className="text-xs font-mono text-fd-muted-foreground/80"
                        >
                          {date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight mb-2 hover:text-fd-primary transition-colors duration-200">
                        <a
                          href={post.url}
                          className="after:absolute after:inset-0"
                        >
                          {post.data.title}
                        </a>
                      </h2>

                      {post.data.description && (
                        <p className="text-fd-muted-foreground text-sm line-clamp-3 mb-6">
                          {post.data.description}
                        </p>
                      )}
                    </div>

                    {/* Author block */}
                    <div className="relative z-20 flex items-center justify-between border-t border-fd-border/40 pt-4 mt-auto">
                      <div className="flex items-center gap-3">
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="size-8 rounded-full ring-1 ring-fd-border bg-fd-muted"
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

                      {/* Author social links */}
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
                  </div>
                </LiquidGlassCard>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
