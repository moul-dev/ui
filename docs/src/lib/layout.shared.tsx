import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { gitConfig } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-fd-foreground">
          <span>moul.dev</span>
          <span className="px-1.5 py-0.5 rounded bg-fd-primary/10 text-fd-primary border border-fd-primary/20 text-[10px] font-extrabold uppercase tracking-widest leading-none">
            UI
          </span>
        </span>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
