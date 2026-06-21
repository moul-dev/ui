'use client'

import React from 'react'

interface ComponentPreviewProps {
  children: React.ReactNode
  align?: 'center' | 'start' | 'end'
}

export function ComponentPreview({
  children,
  align = 'center',
}: ComponentPreviewProps) {
  return (
    <div className="my-6 not-prose border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/30">
      <div
        className={`flex items-center ${
          align === 'center'
            ? 'justify-center'
            : align === 'start'
              ? 'justify-start'
              : 'justify-end'
        } p-10 min-h-[180px] gap-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]`}
      >
        {children}
      </div>
    </div>
  )
}
