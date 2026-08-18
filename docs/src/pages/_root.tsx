import type { ReactNode } from 'react'
import { Provider } from '@/components/provider'
import '@/styles/globals.css'

export default async function RootElement({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const colors = {
                    amber: { hue: 55, chroma: 1 },
                    indigo: { hue: 250, chroma: 1 },
                    violet: { hue: 290, chroma: 1 },
                    pink: { hue: 340, chroma: 1 },
                    ruby: { hue: 25, chroma: 1 },
                    gold: { hue: 85, chroma: 1 },
                    emerald: { hue: 145, chroma: 1 },
                    teal: { hue: 185, chroma: 1 },
                    sky: { hue: 215, chroma: 1 },
                    slate: { hue: 250, chroma: 0 },
                  };
                  const densities = {
                    compact: { density: 0.8, fontScale: 0.92 },
                    default: { density: 1.0, fontScale: 1.0 },
                    spacious: { density: 1.25, fontScale: 1.06 },
                  };
                  const radiuses = {
                    sharp: 0,
                    subtle: 0.5,
                    default: 1.0,
                    curved: 1.5,
                    round: 2.0,
                  };

                  const params = new URLSearchParams(window.location.search);
                  const themeParam = params.get('theme');
                  const hueParam = params.get('hue');
                  const chromaParam = params.get('chroma');
                  const densityParam = params.get('density');
                  const fontScaleParam = params.get('fontScale');
                  const radiusParam = params.get('radius');

                  let hue = hueParam || localStorage.getItem('moul-theme-hue');
                  let chroma = chromaParam || localStorage.getItem('moul-theme-chroma');
                  let density = localStorage.getItem('moul-theme-density');
                  let fontScale = fontScaleParam || localStorage.getItem('moul-theme-font-scale');
                  let radius = localStorage.getItem('moul-theme-radius');

                  if (themeParam && colors[themeParam.toLowerCase()]) {
                    hue = colors[themeParam.toLowerCase()].hue;
                    chroma = colors[themeParam.toLowerCase()].chroma;
                  }

                  if (densityParam) {
                    if (densities[densityParam.toLowerCase()]) {
                      density = densities[densityParam.toLowerCase()].density;
                      fontScale = densities[densityParam.toLowerCase()].fontScale;
                    } else {
                      density = densityParam;
                    }
                  }

                  if (radiusParam) {
                    if (radiuses[radiusParam.toLowerCase()] !== undefined) {
                      radius = radiuses[radiusParam.toLowerCase()];
                    } else {
                      radius = radiusParam;
                    }
                  }

                  if (hue) document.documentElement.style.setProperty('--brand-hue', hue);
                  if (chroma) document.documentElement.style.setProperty('--brand-chroma-multiplier', chroma);
                  if (density) document.documentElement.style.setProperty('--brand-density-factor', density);
                  if (fontScale) document.documentElement.style.setProperty('--brand-font-scale', fontScale);
                  if (radius !== null && radius !== undefined) document.documentElement.style.setProperty('--brand-radius-factor', radius);
                } catch (e) {}
              })();
            `,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:site_name" content="Moul UI" />
        <meta name="twitter:site" content="@mouldev" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-version="2026.08.18" className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
