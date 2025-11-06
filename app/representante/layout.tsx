import { ThemeProvider } from '@/components/theme-provider'

export default function RepresentanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}

