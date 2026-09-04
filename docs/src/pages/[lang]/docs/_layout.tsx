import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { docsOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

export default function Layout({
  children,
  lang = 'km',
}: {
  children: ReactNode
  lang?: string
}) {
  return (
    <DocsLayout {...docsOptions(lang)} tree={source.getPageTree(lang)}>
      {children}
    </DocsLayout>
  )
}
