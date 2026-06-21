import type { ReactNode } from 'react'
import { Provider } from '@/components/provider'
import '@/styles/globals.css'

export default async function RootElement({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet" />
      </head>
      <body data-version="1.0" className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}

export async function getConfig() {
  return {
    render: 'static',
  } as const
}
