import { OpenGraph } from '@/components/open-graph'
import { ThemeStudio } from '@/components/theme-studio'
import { getDocOgImageUrl } from '@/lib/og'

export default function ThemePage() {
  const ogImage = getDocOgImageUrl(
    'Theme Studio',
    'Interactive OKLCH color customization, density tuning, and live preview across all Moul UI components.',
  )

  return (
    <>
      <OpenGraph
        title="Theme Studio & Component Preview — Moul UI"
        description="Interactive theme studio to customize colors, density, typography scale, and radius with live preview across all Moul UI components."
        image={ogImage}
      />
      <ThemeStudio />
    </>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
