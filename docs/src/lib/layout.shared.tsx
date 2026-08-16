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
        text: 'Theme',
        url: '/theme',
        active: 'url',
      },
      {
        text: 'Changelog',
        url: '/changelog',
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

export function docsOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
      children: (
        <div className="flex justify-end">
          <ThemeSelector />
        </div>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Theme',
        url: '/theme',
        active: 'url',
      },
      {
        text: 'Changelog',
        url: '/changelog',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
