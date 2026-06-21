import tailwindcss from '@tailwindcss/vite'
import mdx from 'fumadocs-mdx/vite'
import { esmExternalRequirePlugin, perEnvironmentPlugin } from 'vite'
import { defineConfig } from 'waku/config'

export default defineConfig({
  vite: {
    resolve: {
      tsconfigPaths: true,
      external: ['@takumi-rs/image-response'],
      dedupe: ['waku'],
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
    ],
  },
})
