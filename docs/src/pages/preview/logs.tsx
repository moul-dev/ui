import { LogsPreview } from '@/components/logs-preview'
import { OpenGraph } from '@/components/open-graph'
import { getDocOgImageUrl } from '@/lib/og'

export default function LogsPreviewPage() {
  const ogImage = getDocOgImageUrl(
    'Logs Block Preview',
    'Interactive full-viewport preview of the Moul UI Logs component with Drawer inspector, live streaming, and filtering.',
  )

  return (
    <>
      <OpenGraph
        title="Logs Full Page Preview — Moul UI"
        description="Interactive full-viewport preview of the Moul UI Logs component based on React Aria Table with Drawer Inspector."
        image={ogImage}
      />
      <LogsPreview />
    </>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
