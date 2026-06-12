'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="default"
      themes={['default', 'grimoire', 'studio']}
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  )
}
