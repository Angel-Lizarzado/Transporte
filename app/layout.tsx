import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { InstallPrompt } from '@/components/install-prompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestor de Transporte Escolar',
  description: 'Sistema de gestión para transporte escolar privado',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Transporte Escolar',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#722F37',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}

