import { Link } from 'waku'
import { InteractiveGrid } from '@/components/interactive-grid'
import { LiquidGlassCard } from '@/components/liquid-glass-card'
import { Logo } from '@/components/logo'

export default function Home() {
  return (
    <>
      <title>Moul UI — Clean by default. Adaptable by design.</title>
      <meta
        name="description"
        content="Meet Moul UI. The UI library forged for moul.dev, engineered for your next big idea. Perfect for product engineers who want a modern, consistent baseline."
      />

      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        {/* Hero Section Container (with grid background) */}
        <div className="relative isolate px-6 pt-10 lg:px-8 overflow-hidden">
          {/* Grid Background */}
          <InteractiveGrid />

          {/* Decorative Glow */}
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:opacity-20" />
          </div>

          {/* Main Hero Content */}
          <div className="mx-auto max-w-4xl py-20 sm:py-28 lg:py-36 text-center">
            {/* Logo and Announcement Badge */}
            <div className="flex flex-col items-center gap-5 mb-8">
              <Logo className="h-16 w-16 text-fd-primary hover:scale-105 hover:rotate-6 transition-transform duration-500 cursor-pointer" />
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-fd-muted-foreground ring-1 ring-fd-border/80 hover:ring-fd-border transition-all duration-300 backdrop-blur-sm bg-fd-card/30">
                Introducing{' '}
                <span className="font-semibold text-fd-primary">
                  Moul UI v0.1.0
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto leading-[1.1] mb-6">
              <span className="block text-fd-foreground font-sans">
                Clean by default.
              </span>
              <span className="block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                Adaptable by design.
              </span>
            </h1>

            {/* Tagline / Paragraph */}
            <p className="text-lg leading-8 text-fd-muted-foreground max-w-2xl mx-auto mb-10">
              Meet{' '}
              <code className="px-1.5 py-0.5 rounded bg-fd-secondary border border-fd-border font-mono text-sm text-fd-secondary-foreground font-medium">
                Moul UI
              </code>
              . The UI library forged for{' '}
              <a
                href="https://moul.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 decoration-fd-primary font-semibold text-fd-foreground hover:text-fd-primary transition-colors"
              >
                moul.dev
              </a>
              , engineered for your next big idea. Perfect for product engineers
              who want a modern, consistent baseline that easily bends to fit
              any platform, brand, or aesthetic.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-x-6">
              <Link
                to="/docs"
                id="cta-get-started"
                className="px-6 py-3 rounded-xl bg-fd-primary text-fd-primary-foreground font-semibold text-sm shadow-md hover:bg-fd-primary/95 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/moul-dev/ui"
                target="_blank"
                rel="noopener noreferrer"
                id="cta-github"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-fd-border bg-fd-card/50 text-fd-card-foreground font-semibold text-sm shadow-sm backdrop-blur-sm hover:bg-fd-accent hover:text-fd-accent-foreground transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg
                  className="h-5 w-5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Why Moul UI? Section */}
        <div className="relative isolate px-6 overflow-hidden">
          <div className="mx-auto max-w-5xl w-full pb-20 sm:pb-28">
            <div className="border-t border-fd-border/40 pt-16 sm:pt-20">
              <h2 className="text-3xl font-bold tracking-tight text-fd-foreground text-center mb-4 flex items-center justify-center gap-2 flex-wrap">
                <span>Why</span>
                <span className="inline-flex items-center gap-2 text-2xl align-middle">
                  <span>Moul</span>
                  <span className="px-1.5 py-0.5 rounded bg-fd-muted text-fd-muted-foreground border border-fd-border text-xs font-mono font-semibold tracking-wider leading-none shadow-[0_1.5px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_1.5px_0_0_rgba(255,255,255,0.1)]">
                    UI
                  </span>
                </span>
                <span>?</span>
              </h2>
              <p className="text-base text-fd-muted-foreground max-w-3xl mx-auto text-center mb-12 leading-relaxed">
                Built on a bleeding-edge modern stack,{' '}
                <code className="px-1.5 py-0.5 rounded bg-fd-secondary border border-fd-border font-mono text-sm text-fd-secondary-foreground font-medium">
                  Moul UI
                </code>{' '}
                gives you the developer experience of a premium component
                library with the performance and accessibility of a custom-built
                solution.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Feature 1 */}
                <LiquidGlassCard>
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center text-blue-500 dark:text-blue-400 font-bold text-lg">
                    ♿
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1">
                      Accessible by default
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Powered by{' '}
                      <strong className="text-fd-foreground font-semibold">
                        React Aria
                      </strong>
                      , guaranteeing top-tier keyboard navigation, screen reader
                      support, and robust interaction states right out of the
                      box.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 2 */}
                <LiquidGlassCard>
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/15 flex items-center justify-center text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1">
                      Zero-runtime styling
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Built with{' '}
                      <strong className="text-fd-foreground font-semibold">
                        StyleX
                      </strong>{' '}
                      for type-safe, collision-free atomic CSS. You get the
                      benefits of CSS-in-JS without the performance hit.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 3 */}
                <LiquidGlassCard>
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500/10 dark:bg-purple-400/15 flex items-center justify-center text-purple-500 dark:text-purple-400 font-bold text-lg">
                    🧩
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1">
                      Headless flexibility, styled convenience
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      We provide the clean, minimalist styles you need to ship
                      fast, but every component is designed to be effortlessly
                      overridden to match your brand.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 4 */}
                <LiquidGlassCard>
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/15 flex items-center justify-center text-emerald-500 dark:text-emerald-400 font-bold text-lg">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1">
                      Production tested
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Extracted directly from the{' '}
                      <a
                        href="https://moul.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-fd-primary font-medium"
                      >
                        moul.dev
                      </a>{' '}
                      platform. These aren't just theoretical components; they
                      are actively used in production.
                    </p>
                  </div>
                </LiquidGlassCard>
              </div>
            </div>
          </div>

          {/* Glowing Side Decoration */}
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] dark:opacity-15" />
          </div>
        </div>
      </div>
    </>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  }
}
