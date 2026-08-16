'use client'

import {
  Button,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverDialog,
  PopoverTrigger,
} from '@moul-dev/ui'
import { Check, Code, ExternalLink, Palette, Share2 } from 'lucide-react'
import * as React from 'react'
import {
  applyThemeToDOM,
  DENSITY_PRESETS,
  type DensityPreset,
  generateCssConfig,
  generateShareUrl,
  getDefaultThemeState,
  parseThemeFromUrl,
  RADIUS_PRESETS,
  type RadiusPreset,
  saveThemeToStorage,
  THEME_COLORS,
  type ThemeColor,
  type ThemeState,
} from '@/lib/theme'

export function ThemeSelector() {
  const [themeState, setThemeState] = React.useState<ThemeState>(
    getDefaultThemeState(),
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [copiedCss, setCopiedCss] = React.useState(false)
  const [copiedUrl, setCopiedUrl] = React.useState(false)

  // Sync state on mount: priority to URL parameters, then localStorage
  React.useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const parsedFromUrl = parseThemeFromUrl(searchParams)

      const initialHue = localStorage.getItem('moul-theme-hue')
      const initialChroma = localStorage.getItem('moul-theme-chroma')
      const initialDensity = localStorage.getItem('moul-theme-density')
      const initialFontScale = localStorage.getItem('moul-theme-font-scale')
      const initialRadius = localStorage.getItem('moul-theme-radius')

      let nextColor = THEME_COLORS[0]!
      let nextDensity = DENSITY_PRESETS[1]!
      let nextDensityFactor = 1.0
      let nextFontScale = 1.0
      let nextRadius = RADIUS_PRESETS[2]!
      let nextRadiusFactor = 1.0

      if (initialHue !== null && initialChroma !== null) {
        const h = Number.parseInt(initialHue, 10)
        const c = Number.parseFloat(initialChroma)
        const found = THEME_COLORS.find(
          (col) => col.hue === h && col.chroma === c,
        )
        if (found) nextColor = found
      }

      if (initialDensity !== null) {
        const dVal = Number.parseFloat(initialDensity)
        const fsVal = initialFontScale
          ? Number.parseFloat(initialFontScale)
          : 1.0
        const found = DENSITY_PRESETS.find((d) => d.densityFactor === dVal)
        if (found) {
          nextDensity = found
          nextDensityFactor = found.densityFactor
          nextFontScale = found.fontScale
        } else if (!Number.isNaN(dVal)) {
          nextDensityFactor = dVal
          nextFontScale = fsVal
        }
      }

      if (initialRadius !== null) {
        const rVal = Number.parseFloat(initialRadius)
        const found = RADIUS_PRESETS.find((r) => r.radiusFactor === rVal)
        if (found) {
          nextRadius = found
          nextRadiusFactor = found.radiusFactor
        } else if (!Number.isNaN(rVal)) {
          nextRadiusFactor = rVal
        }
      }

      // Apply URL params override if present
      if (parsedFromUrl) {
        if (parsedFromUrl.color) nextColor = parsedFromUrl.color
        if (parsedFromUrl.density) nextDensity = parsedFromUrl.density
        if (parsedFromUrl.densityFactor !== undefined)
          nextDensityFactor = parsedFromUrl.densityFactor
        if (parsedFromUrl.fontScale !== undefined)
          nextFontScale = parsedFromUrl.fontScale
        if (parsedFromUrl.radius) nextRadius = parsedFromUrl.radius
        if (parsedFromUrl.radiusFactor !== undefined)
          nextRadiusFactor = parsedFromUrl.radiusFactor
      }

      const mergedState: ThemeState = {
        color: nextColor,
        density: nextDensity,
        densityFactor: nextDensityFactor,
        fontScale: nextFontScale,
        radius: nextRadius,
        radiusFactor: nextRadiusFactor,
      }

      setThemeState(mergedState)
      applyThemeToDOM({
        hue: mergedState.color.hue,
        chroma: mergedState.color.chroma,
        densityFactor: mergedState.densityFactor,
        fontScale: mergedState.fontScale,
        radiusFactor: mergedState.radiusFactor,
      })
    } catch (e) {
      console.error('Failed to init theme selector', e)
    }
  }, [])

  const updateTheme = (partial: Partial<ThemeState>) => {
    setThemeState((prev) => {
      const next: ThemeState = { ...prev, ...partial }
      applyThemeToDOM({
        hue: next.color.hue,
        chroma: next.color.chroma,
        densityFactor: next.densityFactor,
        fontScale: next.fontScale,
        radiusFactor: next.radiusFactor,
      })
      saveThemeToStorage({
        hue: next.color.hue,
        chroma: next.color.chroma,
        densityFactor: next.densityFactor,
        fontScale: next.fontScale,
        radiusFactor: next.radiusFactor,
      })
      return next
    })
  }

  const handleSelectColor = (color: ThemeColor) => {
    updateTheme({ color })
  }

  const handleSelectDensity = (density: DensityPreset) => {
    updateTheme({
      density,
      densityFactor: density.densityFactor,
      fontScale: density.fontScale,
    })
  }

  const handleSelectRadius = (radius: RadiusPreset) => {
    updateTheme({
      radius,
      radiusFactor: radius.radiusFactor,
    })
  }

  const cssConfig = generateCssConfig({
    hue: themeState.color.hue,
    chroma: themeState.color.chroma,
    densityFactor: themeState.densityFactor,
    fontScale: themeState.fontScale,
    radiusFactor: themeState.radiusFactor,
  })

  const handleCopyConfig = () => {
    try {
      navigator.clipboard.writeText(cssConfig)
      setCopiedCss(true)
      setTimeout(() => setCopiedCss(false), 2000)
    } catch (err) {
      console.error('Failed to copy CSS: ', err)
    }
  }

  const handleCopyShareUrl = () => {
    try {
      const shareUrl = generateShareUrl(themeState)
      navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (err) {
      console.error('Failed to copy share URL: ', err)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="ghost"
          aria-label="Customize theme options"
          className="relative flex items-center justify-center rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/20 transition-colors cursor-pointer"
        >
          <Palette className="h-[18px] w-[18px] transition-transform duration-200" />
          <span
            className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white dark:border-black shadow-xs transition-colors duration-300"
            style={{ backgroundColor: themeState.color.colorClass }}
          />
        </Button>
        <Popover placement="bottom end" showArrow={false} className="z-50">
          <PopoverDialog className="w-80 p-4 rounded-2xl border border-black/8 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl outline-hidden focus:outline-hidden">
            <div className="flex flex-col gap-4">
              {/* Header & Full Preview Link */}
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase select-none">
                  Theme Customizer
                </span>
                <a
                  href={`/theme?theme=${themeState.color.id}&density=${themeState.density.id}&radius=${themeState.radius.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-fd-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Theme Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Color Palette Swatches */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Color Palette
                </span>
                <div className="grid grid-cols-5 gap-2 p-1">
                  {THEME_COLORS.map((color) => {
                    const isActive =
                      color.hue === themeState.color.hue &&
                      color.chroma === themeState.color.chroma
                    return (
                      <button
                        type="button"
                        key={color.id}
                        onClick={() => handleSelectColor(color)}
                        title={color.name}
                        aria-label={`Select ${color.name} color`}
                        className="group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer outline-hidden border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: color.colorClass }}
                      >
                        {isActive && (
                          <Check
                            className={`h-4 w-4 stroke-[2.5] ${color.checkmarkColor}`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Density Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Density
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                  {DENSITY_PRESETS.map((preset) => {
                    const isSelected = themeState.density.id === preset.id
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectDensity(preset)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Radius Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Radius
                </span>
                <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                  {RADIUS_PRESETS.map((preset) => {
                    const isSelected = themeState.radius.id === preset.id
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectRadius(preset)}
                        title={preset.name}
                        className={`py-1 px-1.5 rounded-lg text-[11px] font-medium transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions: Copy Config & Share Link */}
              <div className="flex gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(true)
                    setIsOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Code className="h-3.5 w-3.5" />
                  CSS Config
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy shareable theme URL"
                >
                  {copiedUrl ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  {copiedUrl ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>
          </PopoverDialog>
        </Popover>
      </PopoverTrigger>

      {/* CSS Config Modal */}
      <ModalOverlay
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      >
        <Modal
          size="md"
          className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden focus:outline-hidden"
        >
          <ModalDialog className="focus:outline-hidden">
            <ModalHeader className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Export CSS Config
            </ModalHeader>
            <ModalBody className="p-5 flex flex-col gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <p>
                Paste this configuration into your global stylesheet (e.g.{' '}
                <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded-sm">
                  globals.css
                </code>
                ) to replicate the active theme in your project:
              </p>
              <div className="relative font-mono text-xs bg-zinc-950 text-zinc-200 p-4 rounded-lg border border-zinc-800 shadow-inner group">
                <pre className="overflow-x-auto whitespace-pre">
                  {cssConfig}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-transparent"
                  title="Copy to clipboard"
                >
                  {copiedCss ? (
                    <Check className="h-4 w-4 text-green-500 stroke-[2.5]" />
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </ModalBody>
            <ModalFooter className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <Button
                variant="outline"
                onPress={() => setIsModalOpen(false)}
                className="py-1.5 px-4 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}
