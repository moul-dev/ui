import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import starlight from '@astrojs/starlight'
import { defineConfig, passthroughImageService } from 'astro/config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  site: 'https://moul.dev',
  image: {
    service: passthroughImageService(),
  },
  vite: {
    resolve: {
      alias: {
        '@moul-dev/ui/tokens.css': resolve(
          __dirname,
          '../ui/src/shared/tokens.css',
        ),
      },
    },
  },
  integrations: [
    starlight({
      title: 'Moul UI',
      logo: { src: './public/favicon.svg' },
      customCss: ['./src/styles/globals.css', './src/styles/docs.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started' },
            { label: 'Installation', slug: 'installation' },
            { label: 'Theming', slug: 'theming' },
          ],
        },
        { label: 'Components', autogenerate: { directory: 'components' } },
        { label: 'Blocks', autogenerate: { directory: 'blocks' } },
      ],
      social: { github: 'https://github.com/moul-dev/ui' },
    }),
  ],
})
