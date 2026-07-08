import { Link } from 'waku'
import { CopyBlock } from '@/components/copy-block'
import { DodecahedronLogo } from '@/components/dodecahedron-logo'
import { InteractiveGrid } from '@/components/interactive-grid'
import { LiquidGlassCard } from '@/components/liquid-glass-card'

export default function Home() {
  return (
    <>
      <title>Moul — Bring Your Own Compute. Simplified.</title>
      <meta
        name="description"
        content="Unify your servers, clouds, and local machines into a single secure compute grid. Self-hosted, lightweight, and developer-friendly."
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
                  'linear-gradient(to top right, oklch(0.78 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198) / 0.12), oklch(0.70 calc(0.10 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 198) - 15) / 0.08))',
              }}
            />
          </div>

          {/* Main Hero Content: Grid Layout */}
          <div className="mx-auto max-w-7xl py-20 sm:py-28 lg:py-36 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Version Badge */}
              <div className="flex flex-col items-center lg:items-start gap-5 mb-8">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm leading-6 text-fd-muted-foreground ring-1 ring-fd-border/60 backdrop-blur-sm bg-fd-card/30 transition-all duration-300 hover:ring-fd-border">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        'oklch(0.75 calc(0.18 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
                    }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs tracking-wide">
                    v0.1.0
                  </span>
                  <span className="text-fd-muted-foreground/60">—</span>
                  <span>Now available</span>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto lg:mx-0 leading-[1.1] mb-6">
                <span className="block text-fd-foreground">
                  Bring Your Own Compute.
                </span>
                <span
                  className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, oklch(0.72 calc(0.17 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 198) - 5)), oklch(0.78 calc(0.16 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 198) + 10)), oklch(0.72 calc(0.14 * var(--brand-chroma-multiplier, 1)) calc(var(--brand-hue, 198) - 15)))',
                  }}
                >
                  Simplified.
                </span>
              </h1>

              {/* Tagline */}
              <p className="text-lg leading-8 text-fd-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8">
                Combine your server hardware, private cloud, or local
                development instances into one{' '}
                <strong className="font-semibold text-fd-foreground">
                  secure, zero-trust compute grid
                </strong>
                . Run code serverless, manage workloads, and scale
                infrastructure without the complexity or cloud markup.
              </p>

              {/* Install Command */}
              <div className="flex justify-center lg:justify-start w-full mb-8">
                <CopyBlock command="curl -fsSL https://moul.dev/install.sh | sh" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center lg:justify-start gap-x-4">
                <Link
                  to="/docs"
                  id="cta-get-started"
                  className="px-6 py-2.5 rounded-full font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background:
                      'oklch(0.75 calc(0.18 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
                    color:
                      'oklch(0.15 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
                  }}
                >
                  Get Started
                </Link>
                <a
                  href="https://github.com/moul-dev/moul"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="cta-github"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-fd-border bg-fd-card/50 text-fd-card-foreground font-semibold text-sm shadow-sm backdrop-blur-sm hover:bg-fd-accent hover:text-fd-accent-foreground transition-all duration-200"
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

            {/* Right 3D Dodecahedron Column */}
            <div className="lg:col-span-5 flex justify-center items-center w-full">
              <DodecahedronLogo />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative isolate px-6 overflow-hidden">
          <div className="mx-auto max-w-5xl w-full pb-20 sm:pb-28">
            <div className="border-t border-fd-border/30 pt-16 sm:pt-20">
              <p
                className="text-sm font-mono font-medium tracking-widest uppercase text-center mb-3"
                style={{
                  color:
                    'oklch(0.70 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
                }}
              >
                Why moul.dev
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-fd-foreground text-center mb-4">
                Compute, reclaimed.
              </h2>
              <p className="text-base text-fd-muted-foreground max-w-2xl mx-auto text-center mb-14 leading-relaxed">
                Unlock full control over your server fleet. Simple APIs to
                deploy workloads, route traffic, and monitor compute without
                SaaS middleware or vendor lock-in.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Feature 1: Multi-Provider Compute */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198) / 0.1)',
                      color:
                        'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
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
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Multi-Provider Compute
                    </h3>
                    <p className="text-sm leading-relaxed text-fd-muted-foreground">
                      Combine bare-metal machines, Raspberry Pis, or standard
                      cloud instances (AWS, GCP, Azure) into a single logical
                      cluster in seconds.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 2: Zero-Trust Security */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198) / 0.1)',
                      color:
                        'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
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
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Zero-Trust Networking
                    </h3>
                    <p className="text-sm leading-relaxed text-fd-muted-foreground">
                      Secure, direct peer-to-peer encrypted wire tunnels
                      establish connections between your nodes. No public
                      ingress or firewall exceptions required.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 3: Self-Hosted Control */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198) / 0.1)',
                      color:
                        'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
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
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Complete Autonomy
                    </h3>
                    <p className="text-sm leading-relaxed text-fd-muted-foreground">
                      Retain 100% ownership of your workloads, configurations,
                      and data. Eliminate middleman platform fees, subscription
                      overhead, and billing markup.
                    </p>
                  </div>
                </LiquidGlassCard>

                {/* Feature 4: Developer-First API */}
                <LiquidGlassCard className="feature-card">
                  <div
                    className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'oklch(0.75 calc(0.14 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198) / 0.1)',
                      color:
                        'oklch(0.70 calc(0.16 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
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
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-fd-foreground mb-1.5">
                      Declarative API
                    </h3>
                    <p className="text-sm leading-relaxed text-fd-muted-foreground">
                      Define tasks, serverless functions, and cron jobs with
                      simple TypeScript. Scale out executions over your grid
                      using simple orchestrator methods.
                    </p>
                  </div>
                </LiquidGlassCard>
              </div>
            </div>
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
