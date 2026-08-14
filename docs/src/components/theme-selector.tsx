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
import { Check, Code, Palette } from 'lucide-react'
import * as React from 'react'

interface ThemeColor {
  name: string
  hue: number
  chroma: number // chroma multiplier
  colorClass: string // Preview background inline style color (in light mode OKLCH)
  checkmarkColor: string // Contrast helper for active check icon
}

const colors: ThemeColor[] = [
  {
    name: 'Amber',
    hue: 55,
    chroma: 1,
    colorClass: 'oklch(0.65 0.16 55)',
    checkmarkColor: 'text-zinc-950',
  },
  {
    name: 'Indigo',
    hue: 250,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 250)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Violet',
    hue: 290,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 290)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Pink',
    hue: 340,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 340)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Ruby',
    hue: 25,
    chroma: 1,
    colorClass: 'oklch(0.60 0.20 25)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Gold',
    hue: 85,
    chroma: 1,
    colorClass: 'oklch(0.65 0.14 85)',
    checkmarkColor: 'text-zinc-950',
  },
  {
    name: 'Emerald',
    hue: 145,
    chroma: 1,
    colorClass: 'oklch(0.60 0.18 145)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Teal',
    hue: 185,
    chroma: 1,
    colorClass: 'oklch(0.60 0.16 185)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Sky',
    hue: 215,
    chroma: 1,
    colorClass: 'oklch(0.60 0.18 215)',
    checkmarkColor: 'text-white',
  },
  {
    name: 'Slate',
    hue: 250,
    chroma: 0,
    colorClass: 'oklch(0.60 0.00 250)',
    checkmarkColor: 'text-white',
  },
]

export function ThemeSelector() {
  const [activeColor, setActiveColor] = React.useState<ThemeColor>(colors[0]!)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Sync state with localStorage and CSS properties on mount
  React.useEffect(() => {
    try {
      const storedHue = localStorage.getItem('moul-theme-hue')
      const storedChroma = localStorage.getItem('moul-theme-chroma')

      if (storedHue !== null && storedChroma !== null) {
        const hue = Number.parseInt(storedHue, 10)
        const chroma = Number.parseFloat(storedChroma)

        const matched = colors.find((c) => c.hue === hue && c.chroma === chroma)
        if (matched) {
          setActiveColor(matched)
        }
      }
    } catch (e) {
      console.error('Failed to read theme from localStorage', e)
    }
  }, [])

  const handleSelectColor = (color: ThemeColor) => {
    setActiveColor(color)
    try {
      localStorage.setItem('moul-theme-hue', color.hue.toString())
      localStorage.setItem('moul-theme-chroma', color.chroma.toString())

      // Apply style variables to document element
      document.documentElement.style.setProperty(
        '--brand-hue',
        color.hue.toString(),
      )
      document.documentElement.style.setProperty(
        '--brand-chroma-multiplier',
        color.chroma.toString(),
      )
    } catch (e) {
      console.error('Failed to save theme color', e)
    }
    setIsOpen(false) // Close the popover automatically
  }

  const cssConfig = `:root {
  --brand-hue: ${activeColor.hue};
  --brand-chroma-multiplier: ${activeColor.chroma};
}`

  const handleCopyConfig = () => {
    try {
      navigator.clipboard.writeText(cssConfig)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="ghost"
          aria-label="Customize theme color"
          className="relative flex items-center justify-center rounded-lg text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/20 transition-colors cursor-pointer"
        >
          <Palette className="h-[18px] w-[18px] transition-transform duration-200" />
          <span
            className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border border-white dark:border-black shadow-xs transition-colors duration-300"
            style={{ backgroundColor: activeColor.colorClass }}
          />
        </Button>
        <Popover placement="bottom end" showArrow={false} className="z-50">
          <PopoverDialog className="w-56 p-4 rounded-xl border border-black/8 dark:border-white/10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg shadow-xl outline-hidden focus:outline-hidden">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase select-none">
                Themes
              </span>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => {
                  const isActive =
                    color.hue === activeColor.hue &&
                    color.chroma === activeColor.chroma
                  return (
                    <button
                      type="button"
                      key={color.name}
                      onClick={() => handleSelectColor(color)}
                      title={color.name}
                      aria-label={`Select ${color.name} color`}
                      className="group relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer outline-hidden border border-black/5 dark:border-white/5 hover:z-10"
                      style={{ backgroundColor: color.colorClass }}
                    >
                      {isActive && (
                        <Check
                          className={`h-4.5 w-4.5 stroke-[2.5] ${color.checkmarkColor}`}
                        />
                      )}
                      <span className="absolute -top-8 scale-0 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white transition-all group-hover:scale-100 z-20 whitespace-nowrap shadow-md pointer-events-none">
                        {color.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true)
                  setIsOpen(false)
                }}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-fd-primary text-fd-primary-foreground hover:opacity-90 transition-opacity cursor-pointer border border-transparent shadow-xs"
              >
                <Code className="h-3.5 w-3.5" />
                Copy CSS Config
              </button>
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
          className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-xl border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden focus:outline-hidden"
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
                  {copied ? (
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
            <ModalFooter className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
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
