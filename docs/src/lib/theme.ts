export interface ThemeColor {
  name: string
  id: string
  hue: number
  chroma: number
  colorClass: string
  checkmarkColor: string
}

export interface DensityPreset {
  id: string
  name: string
  densityFactor: number
  fontScale: number
  description: string
}

export interface RadiusPreset {
  id: string
  name: string
  radiusFactor: number
  description: string
}

export const THEME_COLORS: ThemeColor[] = [
  {
    name: 'Amber',
    id: 'amber',
    hue: 55,
    chroma: 1,
    colorClass: 'oklch(0.65 0.16 55)',
    checkmarkColor: 'text-zinc-950',
  },
  {
    name: 'Indigo',
    id: 'indigo',
    hue: 250,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 250)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Violet',
    id: 'violet',
    hue: 290,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 290)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Pink',
    id: 'pink',
    hue: 340,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 340)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Ruby',
    id: 'ruby',
    hue: 25,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 25)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Gold',
    id: 'gold',
    hue: 85,
    chroma: 1,
    colorClass: 'oklch(0.65 0.14 85)',
    checkmarkColor: 'text-zinc-950',
  },
  {
    name: 'Emerald',
    id: 'emerald',
    hue: 145,
    chroma: 1,
    colorClass: 'oklch(0.60 0.18 145)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Teal',
    id: 'teal',
    hue: 185,
    chroma: 1,
    colorClass: 'oklch(0.60 0.16 185)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Sky',
    id: 'sky',
    hue: 215,
    chroma: 1,
    colorClass: 'oklch(0.60 0.18 215)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Slate',
    id: 'slate',
    hue: 250,
    chroma: 0,
    colorClass: 'oklch(0.60 0.00 250)',
    checkmarkColor: 'text-white',
  },
]

export const DENSITY_PRESETS: DensityPreset[] = [
  {
    id: 'compact',
    name: 'Compact',
    densityFactor: 0.8,
    fontScale: 0.92,
    description: 'Tighter spacing & compact fonts for data-heavy apps',
  },
  {
    id: 'default',
    name: 'Default',
    densityFactor: 1.0,
    fontScale: 1.0,
    description: 'Balanced spacing and standard typography',
  },
  {
    id: 'spacious',
    name: 'Spacious',
    densityFactor: 1.25,
    fontScale: 1.06,
    description: 'Generous whitespace for comfortable reading',
  },
]

export const RADIUS_PRESETS: RadiusPreset[] = [
  {
    id: 'sharp',
    name: 'Sharp',
    radiusFactor: 0,
    description: '0px square corners',
  },
  {
    id: 'subtle',
    name: 'Subtle',
    radiusFactor: 0.5,
    description: 'Subtle, refined rounding',
  },
  {
    id: 'default',
    name: 'Default',
    radiusFactor: 1.0,
    description: 'Standard modern corner radius',
  },
  {
    id: 'curved',
    name: 'Curved',
    radiusFactor: 1.5,
    description: 'Smooth accentuated curves',
  },
  {
    id: 'round',
    name: 'Round',
    radiusFactor: 2.0,
    description: 'Highly rounded, friendly aesthetic',
  },
]

export interface ThemeState {
  color: ThemeColor
  density: DensityPreset
  densityFactor: number
  fontScale: number
  radius: RadiusPreset
  radiusFactor: number
}

export function getDefaultThemeState(): ThemeState {
  return {
    color: THEME_COLORS[0]!,
    density: DENSITY_PRESETS[1]!, // Default
    densityFactor: 1.0,
    fontScale: 1.0,
    radius: RADIUS_PRESETS[2]!, // Default
    radiusFactor: 1.0,
  }
}

export function applyThemeToDOM(theme: {
  hue: number
  chroma: number
  densityFactor: number
  fontScale: number
  radiusFactor: number
}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--brand-hue', theme.hue.toString())
  root.style.setProperty('--brand-chroma-multiplier', theme.chroma.toString())
  root.style.setProperty(
    '--brand-density-factor',
    theme.densityFactor.toString(),
  )
  root.style.setProperty('--brand-font-scale', theme.fontScale.toString())
  root.style.setProperty('--brand-radius-factor', theme.radiusFactor.toString())
}

export function saveThemeToStorage(theme: {
  hue: number
  chroma: number
  densityFactor: number
  fontScale: number
  radiusFactor: number
}) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('moul-theme-hue', theme.hue.toString())
    localStorage.setItem('moul-theme-chroma', theme.chroma.toString())
    localStorage.setItem('moul-theme-density', theme.densityFactor.toString())
    localStorage.setItem('moul-theme-font-scale', theme.fontScale.toString())
    localStorage.setItem('moul-theme-radius', theme.radiusFactor.toString())
  } catch (e) {
    console.error('Failed to save theme to localStorage', e)
  }
}

export function generateCssConfig(theme: {
  hue: number
  chroma: number
  densityFactor: number
  fontScale: number
  radiusFactor: number
}): string {
  return `:root {
  --brand-hue: ${theme.hue};
  --brand-chroma-multiplier: ${theme.chroma};
  --brand-density-factor: ${theme.densityFactor};
  --brand-font-scale: ${theme.fontScale};
  --brand-radius-factor: ${theme.radiusFactor};
}`
}

export function generateShareUrl(
  theme: {
    color: ThemeColor
    density: DensityPreset
    densityFactor: number
    fontScale: number
    radius: RadiusPreset
    radiusFactor: number
  },
  basePath = '/theme',
): string {
  if (typeof window === 'undefined') return basePath
  const url = new URL(basePath, window.location.origin)

  // Use preset IDs if matching exactly, or numeric values
  url.searchParams.set('theme', theme.color.id)

  if (
    theme.density.densityFactor === theme.densityFactor &&
    theme.density.fontScale === theme.fontScale
  ) {
    url.searchParams.set('density', theme.density.id)
  } else {
    url.searchParams.set('density', theme.densityFactor.toString())
    url.searchParams.set('fontScale', theme.fontScale.toString())
  }

  if (theme.radius.radiusFactor === theme.radiusFactor) {
    url.searchParams.set('radius', theme.radius.id)
  } else {
    url.searchParams.set('radius', theme.radiusFactor.toString())
  }

  return url.toString()
}

export function parseThemeFromUrl(
  searchParams: URLSearchParams,
): Partial<ThemeState> | null {
  const result: Partial<ThemeState> = {}

  // Parse color
  const themeParam = searchParams.get('theme')
  const hueParam = searchParams.get('hue')
  const chromaParam = searchParams.get('chroma')

  if (themeParam) {
    const matched = THEME_COLORS.find(
      (c) =>
        c.id.toLowerCase() === themeParam.toLowerCase() ||
        c.name.toLowerCase() === themeParam.toLowerCase(),
    )
    if (matched) result.color = matched
  } else if (hueParam) {
    const hue = Number.parseFloat(hueParam)
    const chroma = chromaParam !== null ? Number.parseFloat(chromaParam) : 1
    const matched = THEME_COLORS.find(
      (c) => c.hue === hue && c.chroma === chroma,
    )
    if (matched) {
      result.color = matched
    } else {
      result.color = {
        name: `Custom (${hue})`,
        id: 'custom',
        hue,
        chroma,
        colorClass: `oklch(0.60 ${0.18 * chroma} ${hue})`,
        checkmarkColor: 'text-white',
      }
    }
  }

  // Parse density
  const densityParam = searchParams.get('density')
  const fontScaleParam = searchParams.get('fontScale')

  if (densityParam) {
    const matched = DENSITY_PRESETS.find(
      (d) => d.id.toLowerCase() === densityParam.toLowerCase(),
    )
    if (matched) {
      result.density = matched
      result.densityFactor = matched.densityFactor
      result.fontScale = matched.fontScale
    } else {
      const val = Number.parseFloat(densityParam)
      if (!Number.isNaN(val)) {
        result.densityFactor = val
        result.fontScale = fontScaleParam
          ? Number.parseFloat(fontScaleParam)
          : 1.0
        result.density = {
          id: 'custom',
          name: 'Custom',
          densityFactor: val,
          fontScale: result.fontScale,
          description: 'User-defined custom density',
        }
      }
    }
  }

  // Parse radius
  const radiusParam = searchParams.get('radius')
  if (radiusParam) {
    const matched = RADIUS_PRESETS.find(
      (r) => r.id.toLowerCase() === radiusParam.toLowerCase(),
    )
    if (matched) {
      result.radius = matched
      result.radiusFactor = matched.radiusFactor
    } else {
      const val = Number.parseFloat(radiusParam)
      if (!Number.isNaN(val)) {
        result.radiusFactor = val
        result.radius = {
          id: 'custom',
          name: 'Custom',
          radiusFactor: val,
          description: 'User-defined custom radius',
        }
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null
}
