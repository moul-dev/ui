import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { Logo } from '@/components/logo'
import { ThemeSelector } from '@/components/theme-selector'
import { gitConfig } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        type: 'custom',
        secondary: true,
        children: <ThemeSelector />,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
