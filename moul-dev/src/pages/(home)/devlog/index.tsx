import { devlogSource } from '@/lib/source'
import { getAuthor } from '@/lib/authors'
import { LiquidGlassCard } from '@/components/liquid-glass-card'

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
                            className="size-4"
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
                          className="p-1.5 rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/30 transition-all duration-150"
                          title={`${author.name}'s X (Twitter)`}
                        >
                          <svg
                            className="size-4"
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
