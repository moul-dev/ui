/// <reference types="vitest" />
import { resolve } from 'node:path'
import stylex from '@stylexjs/unplugin'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      dev: process.env.NODE_ENV === 'development',
      runtimeInjection: false,
    }),
    react(),
    dts({ tsconfigPath: './tsconfig.app.json' }),
  ],
  build: {
    target: 'esnext',
    lib: {
      entry: {
        'moul-ui': resolve(__dirname, 'src/index.ts'),
        'tokens.stylex': resolve(__dirname, 'src/tokens/tokens.stylex.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-aria-components',
        '@stylexjs/stylex',
        'recharts',
        'react-aria',
        'input-otp',
      ],
      output: {
        banner: "'use client';",
      },
    },
  },
})
