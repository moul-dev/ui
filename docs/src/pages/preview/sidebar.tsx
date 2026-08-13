import React from 'react'
import { SidebarPreview } from '@/components/sidebar-preview'

export default function SidebarPreviewPage() {
  return (
    <>
      <title>Sidebar Full Page Preview — Moul UI</title>
      <meta
        name="description"
        content="Interactive full-viewport preview of the Moul UI Sidebar layout, with collapsible states, theme configs and a live mock dashboard."
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
