import { Link } from 'waku'
import { InteractiveGrid } from '@/components/interactive-grid'
import { LiquidGlassCard } from '@/components/liquid-glass-card'
import { CopyBlock } from '@/components/copy-block'

export default function Home() {
  return (
    <>
      <title>Moul UI — Clean by default. Adaptable by design.</title>
      <meta
        name="description"
        content="Meet Moul UI. The UI library forged for moul.dev, engineered for your next big idea. Perfect for product engineers who want a modern, consistent baseline."
      />

      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-10 lg:px-8 overflow-hidden">
          {/* Grid Background */}
          <InteractiveGrid />

          {/* Decorative Glow — top */}
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                background:
                  'linear-gradient(to top right, oklch(0.78 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.12), oklch(0.70 calc(0.10 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 250) - 15) / 0.08))',
              }}
            />
          </div>

          {/* Main Hero Content */}
          <div className="mx-auto max-w-4xl py-20 sm:py-28 lg:py-36 text-center">
            {/* Version Badge */}
            <div className="flex flex-col items-center gap-5 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm leading-6 text-fd-muted-foreground ring-1 ring-fd-border/60 backdrop-blur-sm bg-fd-card/30 transition-all duration-300 hover:ring-fd-border">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: 'oklch(0.75 calc(0.18 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))' }}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs tracking-wide">v0.1.0</span>
                <span className="text-fd-muted-foreground/60">—</span>
                <span>Now available</span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto leading-[1.1] mb-6">
              <span className="block text-fd-foreground">
                Clean by default.
              </span>
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, oklch(0.72 calc(0.17 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 250) - 5)), oklch(0.78 calc(0.16 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 250) + 10)), oklch(0.72 calc(0.14 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 250) - 15)))',
                }}
              >
                Adaptable by design.
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-lg leading-8 text-fd-muted-foreground max-w-2xl mx-auto mb-8">
              A React component library built on{' '}
              <strong className="font-semibold text-fd-foreground">
                React Aria
              </strong>{' '}
              and{' '}
              <strong className="font-semibold text-fd-foreground">
                StyleX
              </strong>
              . Accessible, zero-runtime, production-tested at{' '}
              <a
                href="https://moul.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 font-semibold text-fd-foreground hover:opacity-75 transition-opacity"
                style={{
                  textDecorationColor: 'oklch(0.75 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                }}
              >
                moul.dev
              </a>
              .
            </p>

            {/* Install Command */}
            <div className="flex justify-center mb-8">
              <CopyBlock command="bun add @moul-dev/ui" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-x-4">
              <Link
                to="/docs"
                id="cta-get-started"
                className="px-6 py-2.5 rounded-full font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: 'oklch(0.75 calc(0.18 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                  color: 'oklch(0.15 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                }}
              >
                Read the docs
              </Link>
              <a
                href="https://github.com/moul-dev/ui"
                target="_blank"
                rel="noopener noreferrer"
                id="cta-github"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-fd-border bg-fd-card/50 text-fd-card-foreground font-semibold text-sm shadow-sm backdrop-blur-sm hover:bg-fd-accent hover:text-fd-accent-foreground transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg
                  className="h-4 w-4 fill-current"
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

        {/* Features Section */}
        <div className="relative isolate px-6 overflow-hidden">
          <div className="mx-auto max-w-5xl w-full pb-20 sm:pb-28">
            <div className="border-t border-fd-border/30 pt-16 sm:pt-20">
              <p
                className="text-sm font-mono font-medium tracking-widest uppercase text-center mb-3"
                style={{ color: 'oklch(0.70 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))' }}
              >
                Why Moul UI
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-fd-foreground text-center mb-4">
                Built different.
              </h2>
              <p className="text-base text-fd-muted-foreground max-w-2xl mx-auto text-center mb-14 leading-relaxed">
                The developer experience of a premium component library with the
                performance and accessibility of a custom-built solution.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Feature 1: Accessible */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.1)',
                      color: 'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Accessible by default
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Powered by{' '}
                      <strong className="text-fd-foreground font-semibold">
                        React Aria
                      </strong>
                      . Full keyboard navigation, screen reader support, and
                      robust interaction states out of the box.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 2: Zero-runtime */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.1)',
                      color: 'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Zero-runtime styling
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Built with{' '}
                      <strong className="text-fd-foreground font-semibold">
                        StyleX
                      </strong>
                      . Type-safe, collision-free atomic CSS extracted at build
                      time — no runtime cost.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 3: Flexible */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.1)',
                      color: 'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Headless flexibility, styled convenience
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Ship fast with clean defaults. Every component is designed
                      to be effortlessly overridden to match your brand.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 4: Production tested */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.1)',
                      color: 'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Production tested
                    </h3>
                    <p className="text-sm text-fd-muted-foreground leading-relaxed">
                      Extracted from the{' '}
                      <a
                        href="https://moul.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline font-medium"
                        style={{ color: 'oklch(0.70 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250))' }}
                      >
                        moul.dev
                      </a>{' '}
                      platform. Battle-tested components used in production
                      every day.
                    </p>
                  </div>
                </LiquidGlassCard>
              </div>
            </div>
          </div>

          {/* Glowing Side Decoration — bottom */}
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                background:
                  'linear-gradient(to top right, oklch(0.78 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250) / 0.08), oklch(0.70 calc(0.12 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 250) - 15) / 0.06))',
              }}
            />
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
