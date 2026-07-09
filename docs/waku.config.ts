import tailwindcss from '@tailwindcss/vite'
import mdx from 'fumadocs-mdx/vite'
import { esmExternalRequirePlugin, perEnvironmentPlugin } from 'vite'
import { defineConfig } from 'waku/config'

export default defineConfig({
  vite: {
    resolve: {
      tsconfigPaths: true,
      external: ['@takumi-rs/image-response'],
      dedupe: ['react', 'react-dom', 'waku'],
    },
    build: {
      target: 'esnext',
    },
    ssr: {
      noExternal: [
        '@moul-dev/ui',
        'react-aria-components',
        'react-aria',
        'react-stately',
        /@react-aria/,
        /@react-stately/,
      ],
    },

    plugins: [
      tailwindcss(),
      mdx(),
      perEnvironmentPlugin('esm-external-require-client', (env) => {
        if (env.name === 'client') {
          return esmExternalRequirePlugin({
            external: [
              'react',
              'react-dom',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
            ],
          })
        }
        return false
      }),
      {
        name: 'shim-import-meta-url',
        transform(code, id, options) {
          const isSSR = options?.ssr || (this.environment && this.environment.name !== 'client');
          if (isSSR && code.includes('import.meta.url')) {
            return {
              code: code.replaceAll('import.meta.url', '"file:///index.js"'),
              map: null,
            };
          }
        },
      },
    ],
  },
})
