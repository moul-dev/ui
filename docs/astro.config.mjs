import { execSync } from 'node:child_process'
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

try {
  execSync('bun ../scripts/verify-no-react.ts docs', { stdio: 'inherit' })
} catch {
  process.exit(1)
}

export default defineConfig({
  site: 'https://moul.dev',
  output: 'static',
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
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'docs' },
            { label: 'LLM & Agent Guide', slug: 'docs/llms' },
          ],
        },
        {
          label: 'Components',
          autogenerate: { directory: 'docs/components' },
        },
        {
          label: 'Blocks',
          autogenerate: { directory: 'docs/blocks' },
        },
        {
          label: 'Changelog',
          items: [
            { label: 'All Releases', slug: 'changelog' },
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
