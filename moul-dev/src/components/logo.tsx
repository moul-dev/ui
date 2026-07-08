import type * as React from 'react'

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  iconOnly?: boolean
  iconClassName?: string
}

export function Logo({
  iconOnly = false,
  iconClassName,
  className,
  ...props
}: LogoProps) {
  const icon = (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={iconClassName}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <title>moul.dev</title>
      {/* Mathematically generated squeezed 2D dodecahedron projection (6 pieces, 10 outer edges, perspective squeeze towards right) */}
      {/* Center Pentagon */}
      <polygon points="80.29,50.00 65.06,73.08 35.53,66.00 35.53,34.00 65.06,26.92" />
      {/* Right Face */}
      <polygon points="82.01,51.24 95.00,51.24 88.99,72.83 71.53,88.94 66.78,74.32" />
      {/* Bottom Face */}
      <polygon points="64.33,75.29 69.08,89.92 43.24,94.02 17.82,80.55 34.80,68.21" />
      {/* Bottom-Left Face */}
      <polygon points="33.04,66.00 16.06,78.34 5.00,50.00 16.06,21.66 33.04,34.00" />
      {/* Top-Left Face */}
      <polygon points="34.80,31.79 17.82,19.45 43.24,5.98 69.08,10.08 64.33,24.71" />
      {/* Top-Right Face */}
      <polygon points="66.78,25.68 71.53,11.06 88.99,27.17 95.00,48.76 82.01,48.76" />
    </svg>
  )

  if (iconOnly) {
    return (
      <span className={className} {...props}>
        {icon}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 font-semibold tracking-tight text-fd-foreground whitespace-nowrap ${className || ''}`}
      {...props}
    >
      <span className="h-6 w-6 flex-shrink-0 text-fd-primary">{icon}</span>
      <span className="font-sans text-[15px] font-bold tracking-tight">
        Moul
      </span>
    </span>
  )
}
