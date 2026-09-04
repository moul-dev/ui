import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { PageProps } from 'waku/router'
import { HomeView } from '@/components/home-view'
import { baseOptions } from '@/lib/layout.shared'

export default function LocalizedHome({ lang }: PageProps<'/[lang]'>) {
  return (
    <HomeLayout {...baseOptions(lang)}>
      <HomeView lang={lang} />
    </HomeLayout>
  )
}

export async function getConfig() {
  return {
    render: 'static' as const,
    staticPaths: ['km'],
  } as const
}
