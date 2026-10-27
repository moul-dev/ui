import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import { COMPONENT_CATEGORIES } from './src/categories.ts'

try {
  execSync('bun ../scripts/verify-no-react.ts docs', { stdio: 'inherit' })
} catch {
  process.exit(1)
}

// Previews render straight from the library source so the docs never drift
// behind a stale `ui/dist` build, and component edits hot-reload in dev.
const uiSrc = (path) =>
  fileURLToPath(new URL(`../ui/src/${path}`, import.meta.url))

export default defineConfig({
  site: 'https://moul.dev',
  output: 'static',
  vite: {
    resolve: {
      alias: [
        {
          find: /^@moul-dev\/ui\/style\.css$/,
          replacement: uiSrc('styles/style.css'),
        },
        { find: /^@moul-dev\/ui$/, replacement: uiSrc('index.ts') },
      ],
    },
  },
  integrations: [
    starlight({
      title: 'Moul UI',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        km: {
          label: 'ភាសាខ្មែរ',
          lang: 'km',
        },
      },
      customCss: ['./src/styles/global.css'],
      components: {
        Hero: './src/components/Hero.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      // Code blocks sit on white surfaces lifted by a soft shadow, like the
      // sandbox's demo groups; colors come from the Moul token layer.
      expressiveCode: {
        styleOverrides: {
          borderRadius: 'var(--radius-2xl)',
          borderColor: 'transparent',
        },
        // Runs after Starlight's own per-theme frame colors, which would
        // otherwise win over the global styleOverrides.
        customizeTheme: (theme) => {
          // Contrast checks run against the real surface color.
          theme.bg = theme.type === 'dark' ? '#18181b' : '#ffffff'
          theme.styleOverrides.frames = {
            ...theme.styleOverrides.frames,
            editorBackground: 'var(--color-surface)',
            terminalBackground: 'var(--color-surface)',
            terminalTitlebarBackground: 'var(--color-surface)',
            editorTabBarBackground: 'var(--color-surface)',
            editorActiveTabBackground: 'var(--color-surface)',
            frameBoxShadowCssValue: 'var(--shadow-surface)',
          }
          return theme
        },
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'docs' },
            { label: 'LLM & Agent Guide', slug: 'docs/llms' },
          ],
        },
        ...COMPONENT_CATEGORIES.map(({ label, slugs }) => ({
          label,
          badge: { text: String(slugs.length), variant: 'default' },
          items: slugs,
        })),
        {
          label: 'Changelog',
          items: [
            { label: 'All Releases', slug: 'changelog' },
            { label: '2026-10-27', slug: 'changelog/2026-10-27' },
            { label: '2026-09-07', slug: 'changelog/2026-09-07' },
            { label: '2026-08-25', slug: 'changelog/2026-08-25' },
            { label: '2026-08-22', slug: 'changelog/2026-08-22' },
            { label: '2026-08-21', slug: 'changelog/2026-08-21' },
            { label: '2026-08-17', slug: 'changelog/2026-08-17' },
            { label: '2026-08-15', slug: 'changelog/2026-08-15' },
          ],
        },
      ],
    }),
  ],
})
