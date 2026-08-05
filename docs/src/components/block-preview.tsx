'use client'

import React, { useState } from 'react'
import { Badge, Button } from '@moul-dev/ui'
import { ExternalLink, Layout, RefreshCw } from 'lucide-react'

interface BlockPreviewProps {
  previewUrl: string
  title?: string
  description?: string
  height?: string
}

export function BlockPreview({
  previewUrl,
  title = 'Sidebar Preview',
  description = 'Experience the complete responsive layout component with live controls and collapsible navigation states.',
  height = '540px',
}: BlockPreviewProps) {
  const [showEmbedded, setShowEmbedded] = useState(false)
  const [key, setKey] = useState(0)

  return (
    <div className="my-6 not-prose rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
      {/* Mock Browser Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-red-400/80 dark:bg-red-500/60 inline-block" />
            <span className="size-3 rounded-full bg-amber-400/80 dark:bg-amber-500/60 inline-block" />
            <span className="size-3 rounded-full bg-emerald-400/80 dark:bg-emerald-500/60 inline-block" />
          </div>
          <span className="ml-2 text-xs font-mono text-neutral-400 dark:text-neutral-500 hidden sm:inline-block">
            {previewUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowEmbedded((prev) => !prev)}
          >
            {showEmbedded ? 'Hide Frame' : 'Inline Frame'}
          </Button>

          {showEmbedded && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center shrink-0"
            >
              <Button variant="primary" size="sm">
                <span>Preview</span>
                <ExternalLink className="size-3.5 ml-1" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Main Preview Banner / Body */}
      {!showEmbedded ? (
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-xs shrink-0">
              <Layout className="size-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 m-0">
                  {title}
                </h4>
                <Badge variant="primary">Full Page</Badge>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 m-0 max-w-xl leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center shrink-0 self-start sm:self-center"
          >
            <Button variant="primary" size="md">
              <span>Preview</span>
              <ExternalLink className="size-4 ml-1.5" />
            </Button>
          </a>
        </div>
      ) : (
        /* Embedded Frame View (On Demand) */
        <div className="p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setKey((prev) => prev + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
            >
              <RefreshCw className="size-3" />
              <span>Reload Frame</span>
            </button>
          </div>
          <div className="w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg bg-white dark:bg-neutral-950">
            <iframe
              key={key}
              src={previewUrl}
              title={title}
              className="w-full border-0"
              style={{ height }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
