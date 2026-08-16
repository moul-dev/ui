import { ThemeStudio } from '@/components/theme-studio'

export default function ThemePage() {
  return (
    <>
      <title>Theme Studio & Component Preview — Moul UI</title>
      <meta
        name="description"
        content="Interactive theme studio to customize colors, density, typography scale, and radius with live preview across all Moul UI components."
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
