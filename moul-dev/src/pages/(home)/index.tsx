import { DodecahedronLogo } from '@/components/dodecahedron-logo'
import { InteractiveGrid } from '@/components/interactive-grid'

export default function Home() {
  return (
    <>
      <title>moul.dev — Bring Your Own Compute. Simplified.</title>
      <meta
        name="description"
        content="Unify your servers, clouds, and local machines into a single secure compute grid. Self-hosted, lightweight, and developer-friendly."
      />

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
                  className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{
                    background:
                      'oklch(0.75 calc(0.18 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 198))',
                  }}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs tracking-wide">
                  Active Development Preview
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto lg:mx-0 leading-[1.1]">
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
          </div>

          {/* Right 3D Dodecahedron Column */}
          <div className="lg:col-span-5 flex justify-center items-center w-full">
            <DodecahedronLogo />
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
