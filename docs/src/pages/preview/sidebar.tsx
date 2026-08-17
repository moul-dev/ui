import { OpenGraph } from '@/components/open-graph'
import { SidebarPreview } from '@/components/sidebar-preview'
import { getDocOgImageUrl } from '@/lib/og'

export default function SidebarPreviewPage() {
  const ogImage = getDocOgImageUrl(
    'Sidebar Preview',
    'Interactive full-viewport preview of the Moul UI Sidebar layout, responsive collapsible states, and theme configs.',
  )

  return (
    <>
      <OpenGraph
        title="Sidebar Full Page Preview — Moul UI"
        description="Interactive full-viewport preview of the Moul UI Sidebar layout, with collapsible states, theme configs and a live mock dashboard."
        image={ogImage}
      />
      <SidebarPreview />
    </>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
