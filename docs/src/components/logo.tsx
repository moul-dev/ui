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
      viewBox="0 0 24 24"
      fill="currentColor"
      className={iconClassName}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <title>Moul UI Logo</title>
      {/* Top-Left Facet */}
      <path d="M 11.6 2.25 L 3.5 11.25 L 9.4 13.5 Z" />

      {/* Top-Right Facet */}
      <path d="M 12.2 2.25 L 20.3 11.25 L 10.0 13.5 Z" />

      {/* Bottom-Left Facet */}
      <path d="M 11.6 21.85 L 3.5 11.95 L 9.4 14.2 Z" />

      {/* Bottom-Right Facet */}
      <path d="M 12.2 21.85 L 20.3 11.95 L 10.0 14.2 Z" />
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
      className={`inline-flex items-center gap-2 font-semibold tracking-tight text-fd-foreground whitespace-nowrap ${className || ''}`}
      {...props}
    >
      <span className="h-8 w-8 flex-shrink-0 text-fd-primary">{icon}</span>
      Moul UI
      <span className="ml-1 rounded-md bg-fd-primary/10 border border-fd-primary/25 px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wide text-fd-primary uppercase">
        Beta
      </span>
    </span>
  )
}
